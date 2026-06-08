const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const {
  makeId,
  now,
  slugify,
  loadStore,
  saveStore,
  createEvent,
  getEventRecord,
  resetEventRecord,
  text,
  addActivity,
  getPublicState,
  getClientState,
} = require('./store');

const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || '0.0.0.0';
const ADMIN_MASTER_PIN = String(process.env.ADMIN_MASTER_PIN || '');

let store = loadStore();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

function ok(data = {}) {
  return { ok: true, ...data };
}

function fail(error) {
  return {
    ok: false,
    message: error && error.message ? error.message : 'No se pudo completar la acción.',
    status: error && error.status ? error.status : 500,
    retryAfterMs: error && error.retryAfterMs ? error.retryAfterMs : 0,
  };
}

function httpError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function getRecordOrThrow(eventId) {
  const id = slugify(eventId || '');
  const record = getEventRecord(store, id);
  if (!record) throw httpError('Evento no encontrado. Revisá el link o creá una sala nueva.', 404);
  return record;
}

function requireAdmin(record, pin) {
  const value = String(pin || '');
  if (value !== String(record.pin) && (!ADMIN_MASTER_PIN || value !== ADMIN_MASTER_PIN)) {
    throw httpError('PIN de cabina incorrecto.', 401);
  }
}

function requirePublicOpen(state) {
  if (state.event.closed) throw httpError('El evento está cerrado.', 423);
  if (!state.event.active) throw httpError('El evento no está activo.', 423);
  if (state.event.paused) throw httpError('La interacción está pausada por el DJ.', 423);
}

function clientPayload(record, clientId) {
  return {
    eventId: record.id,
    state: getPublicState(record.state),
    me: getClientState(record.state, clientId),
  };
}

function roomName(eventId) {
  return `event:${slugify(eventId)}`;
}

function broadcastState(eventId) {
  const record = getRecordOrThrow(eventId);
  for (const socket of io.of('/').adapter.rooms.get(roomName(eventId)) || []) {
    const target = io.of('/').sockets.get(socket);
    if (target) target.emit('state', clientPayload(record, target.data.clientId || ''));
  }
}

function persistAndBroadcast(eventId) {
  const record = getRecordOrThrow(eventId);
  record.updatedAt = now();
  record.state.updatedAt = now();
  saveStore(store);
  broadcastState(eventId);
}

function touchConnected(record, clientId) {
  const id = text(clientId, 80);
  if (!id) return;
  record.state.event.connectedByClient[id] = now();
  const cutoff = Date.now() - 1000 * 60 * 12;
  for (const [key, value] of Object.entries(record.state.event.connectedByClient)) {
    if (new Date(value).getTime() < cutoff) delete record.state.event.connectedByClient[key];
  }
  record.updatedAt = now();
  saveStore(store);
}

function getEventIdFromPayload(socket, payload) {
  if (payload && typeof payload === 'object' && payload.eventId) return slugify(payload.eventId);
  return slugify(socket.data.eventId || '');
}

const rateMemory = new Map();
const PUBLIC_ACTION_COOLDOWN_MS = Number(process.env.PUBLIC_ACTION_COOLDOWN_MS || 5 * 60 * 1000);

function formatWait(ms) {
  const seconds = Math.max(1, Math.ceil(ms / 1000));
  if (seconds >= 60) {
    const minutes = Math.ceil(seconds / 60);
    return minutes === 1 ? '1 minuto' : `${minutes} minutos`;
  }
  return seconds === 1 ? '1 segundo' : `${seconds} segundos`;
}

function rateLimit(record, clientId, action, ms) {
  const id = text(clientId, 80);
  if (!id) throw httpError('No se detectó el dispositivo.', 400);
  const key = `${record.id}:${id}:${action}`;
  const current = Date.now();
  const previous = rateMemory.get(key) || 0;
  const wait = ms - (current - previous);
  if (wait > 0) {
    const error = httpError(`Ya participaste en esta opción. Podés volver a intentarlo en ${formatWait(wait)}.`, 429);
    error.retryAfterMs = wait;
    throw error;
  }
  rateMemory.set(key, current);
}

function publicCooldown(record, clientId, action) {
  rateLimit(record, clientId, action, PUBLIC_ACTION_COOLDOWN_MS);
}

function adminEventUrl(eventId) {
  return `/cabina/${encodeURIComponent(eventId)}`;
}

function publicEventUrl(eventId) {
  return `/e/${encodeURIComponent(eventId)}`;
}

function showEventUrl(eventId) {
  return `/show/${encodeURIComponent(eventId)}`;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'Pista Viva DJ', mode: 'multi-event', time: now() });
});

app.post('/api/events', (req, res) => {
  try {
    const eventId = text(req.body.eventId, 48);
    const title = text(req.body.title, 60) || 'Pista Viva DJ';
    const djName = text(req.body.djName, 60) || 'DJ en vivo';
    const pin = text(req.body.pin, 24);

    const record = createEvent(store, { eventId, title, djName, pin });
    res.json(ok({
      event: {
        id: record.id,
        title: record.state.event.title,
        djName: record.state.event.djName,
        publicUrl: publicEventUrl(record.id),
        cabinaUrl: adminEventUrl(record.id),
        showUrl: showEventUrl(record.id),
      },
    }));
  } catch (error) {
    res.status(error.status || 400).json(fail(error));
  }
});

app.get('/api/state', (req, res) => {
  try {
    const eventId = slugify(req.query.eventId || '');
    const clientId = text(req.query.clientId, 80);
    const record = getRecordOrThrow(eventId);
    if (clientId) touchConnected(record, clientId);
    res.json(clientPayload(record, clientId));
  } catch (error) {
    res.status(error.status || 404).json(fail(error));
  }
});

app.post('/api/admin/auth', (req, res) => {
  try {
    const record = getRecordOrThrow(req.body.eventId);
    requireAdmin(record, req.body.pin);
    res.json(ok({ eventId: record.id }));
  } catch (error) {
    res.status(error.status || 401).json(fail(error));
  }
});

app.get('/api/admin/export', (req, res) => {
  try {
    const record = getRecordOrThrow(req.query.eventId);
    requireAdmin(record, req.query.pin);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="pista-viva-dj-${record.id}-${Date.now()}.json"`);
    res.end(JSON.stringify(record.state, null, 2));
  } catch (error) {
    res.status(error.status || 401).json(fail(error));
  }
});

io.on('connection', (socket) => {
  socket.on('client:join', (payload, ack) => {
    try {
      const eventId = typeof payload === 'object' ? payload.eventId : '';
      const clientId = typeof payload === 'object' ? payload.clientId : payload;
      const record = getRecordOrThrow(eventId);
      const id = text(clientId, 80) || makeId('client');

      socket.data.clientId = id;
      socket.data.eventId = record.id;
      socket.join(roomName(record.id));
      touchConnected(record, id);
      socket.emit('state', clientPayload(record, id));
      if (typeof ack === 'function') ack(ok({ clientId: id, eventId: record.id }));
      broadcastState(record.id);
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
      socket.emit('state:error', fail(error));
    }
  });

  socket.on('state:get', (payload, ack) => {
    try {
      const eventId = getEventIdFromPayload(socket, payload);
      const record = getRecordOrThrow(eventId);
      const data = clientPayload(record, socket.data.clientId || '');
      socket.emit('state', data);
      if (typeof ack === 'function') ack(ok(data));
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
    }
  });

  socket.on('song:create', (payload, ack) => {
    try {
      const record = getRecordOrThrow(getEventIdFromPayload(socket, payload));
      const state = record.state;
      requirePublicOpen(state);
      const clientId = text(payload.clientId || socket.data.clientId, 80);
      publicCooldown(record, clientId, 'song:create');

      const name = text(payload.name, 40);
      const song = text(payload.song, 80);
      const artist = text(payload.artist, 80);
      const message = text(payload.message, 120);
      if (!name || !song) throw httpError('Escribí tu nombre y la canción.');

      const request = {
        id: makeId('song'),
        name,
        song,
        artist,
        message,
        status: 'waiting',
        votesByClient: {},
        createdAt: now(),
      };
      state.songRequests.unshift(request);
      addActivity(state, 'song', `${name} envió un pedido para aprobar`);
      persistAndBroadcast(record.id);
      if (typeof ack === 'function') ack(ok({ id: request.id }));
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
    }
  });

  socket.on('song:vote', (payload, ack) => {
    try {
      const record = getRecordOrThrow(getEventIdFromPayload(socket, payload));
      const state = record.state;
      requirePublicOpen(state);
      const clientId = text(payload.clientId || socket.data.clientId, 80);
      publicCooldown(record, clientId, 'song:vote');

      const request = state.songRequests.find((item) => item.id === payload.id);
      if (!request) throw httpError('Ese pedido ya no existe.');
      if (request.status !== 'pending') throw httpError('Ese pedido todavía no fue aprobado por cabina.');
      request.votesByClient = request.votesByClient || {};
      request.votesByClient[clientId] = true;
      addActivity(state, 'vote', `Un voto subió "${request.song}"`);
      persistAndBroadcast(record.id);
      if (typeof ack === 'function') ack(ok());
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
    }
  });

  socket.on('song:status', (payload, ack) => {
    try {
      const record = getRecordOrThrow(getEventIdFromPayload(socket, payload));
      const state = record.state;
      requireAdmin(record, payload.pin);
      const request = state.songRequests.find((item) => item.id === payload.id);
      if (!request) throw httpError('Pedido no encontrado.', 404);
      const status = ['waiting', 'pending', 'played', 'rejected'].includes(payload.status) ? payload.status : 'waiting';
      request.status = status;
      request.updatedAt = now();
      addActivity(state, 'admin', status === 'pending' ? `Cabina aprobó "${request.song}"` : `Cabina marcó "${request.song}" como ${status}`);
      persistAndBroadcast(record.id);
      if (typeof ack === 'function') ack(ok());
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
    }
  });

  socket.on('song:delete', (payload, ack) => {
    try {
      const record = getRecordOrThrow(getEventIdFromPayload(socket, payload));
      const state = record.state;
      requireAdmin(record, payload.pin);
      const before = state.songRequests.length;
      state.songRequests = state.songRequests.filter((item) => item.id !== payload.id);
      if (before === state.songRequests.length) throw httpError('Pedido no encontrado.', 404);
      addActivity(state, 'admin', 'Cabina eliminó un pedido');
      persistAndBroadcast(record.id);
      if (typeof ack === 'function') ack(ok());
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
    }
  });

  socket.on('mood:vote', (payload, ack) => {
    try {
      const record = getRecordOrThrow(getEventIdFromPayload(socket, payload));
      const state = record.state;
      requirePublicOpen(state);
      const clientId = text(payload.clientId || socket.data.clientId, 80);
      publicCooldown(record, clientId, 'mood:vote');
      const optionId = text(payload.optionId, 40);
      if (!state.mood.options.some((option) => option.id === optionId)) throw httpError('Opción inválida.');
      state.mood.votesByClient[clientId] = optionId;
      const option = state.mood.options.find((item) => item.id === optionId);
      addActivity(state, 'mood', `Nuevo voto de ambiente: ${option.label}`);
      persistAndBroadcast(record.id);
      if (typeof ack === 'function') ack(ok());
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
    }
  });

  socket.on('mood:reset', (payload, ack) => {
    try {
      const record = getRecordOrThrow(getEventIdFromPayload(socket, payload));
      requireAdmin(record, payload.pin);
      record.state.mood.votesByClient = {};
      addActivity(record.state, 'admin', 'Cabina reinició la votación de ambiente');
      persistAndBroadcast(record.id);
      if (typeof ack === 'function') ack(ok());
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
    }
  });

  socket.on('dedication:create', (payload, ack) => {
    try {
      const record = getRecordOrThrow(getEventIdFromPayload(socket, payload));
      const state = record.state;
      requirePublicOpen(state);
      const clientId = text(payload.clientId || socket.data.clientId, 80);
      publicCooldown(record, clientId, 'dedication:create');

      const name = text(payload.name, 40);
      const message = text(payload.message, 160);
      if (!name || !message) throw httpError('Escribí tu nombre y el mensaje.');
      const dedication = {
        id: makeId('ded'),
        name,
        message,
        status: 'pending',
        createdAt: now(),
      };
      state.dedications.unshift(dedication);
      addActivity(state, 'dedication', `${name} envió una dedicatoria para aprobar`);
      persistAndBroadcast(record.id);
      if (typeof ack === 'function') ack(ok({ id: dedication.id }));
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
    }
  });

  socket.on('dedication:moderate', (payload, ack) => {
    try {
      const record = getRecordOrThrow(getEventIdFromPayload(socket, payload));
      const state = record.state;
      requireAdmin(record, payload.pin);
      const dedication = state.dedications.find((item) => item.id === payload.id);
      if (!dedication) throw httpError('Dedicatoria no encontrada.', 404);
      const status = payload.status === 'approved' ? 'approved' : 'rejected';
      dedication.status = status;
      dedication.approvedAt = status === 'approved' ? now() : dedication.approvedAt;
      dedication.updatedAt = now();
      addActivity(state, 'admin', `Cabina ${status === 'approved' ? 'aprobó' : 'rechazó'} una dedicatoria`);
      persistAndBroadcast(record.id);
      if (typeof ack === 'function') ack(ok());
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
    }
  });

  socket.on('dedication:delete', (payload, ack) => {
    try {
      const record = getRecordOrThrow(getEventIdFromPayload(socket, payload));
      const state = record.state;
      requireAdmin(record, payload.pin);
      const before = state.dedications.length;
      state.dedications = state.dedications.filter((item) => item.id !== payload.id);
      if (before === state.dedications.length) throw httpError('Dedicatoria no encontrada.', 404);
      addActivity(state, 'admin', 'Cabina eliminó una dedicatoria');
      persistAndBroadcast(record.id);
      if (typeof ack === 'function') ack(ok());
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
    }
  });

  socket.on('energy:add', (payload, ack) => {
    try {
      const record = getRecordOrThrow(getEventIdFromPayload(socket, payload));
      const state = record.state;
      requirePublicOpen(state);
      const clientId = text(payload.clientId || socket.data.clientId, 80);
      publicCooldown(record, clientId, 'energy:add');
      state.energy.contributorsByClient[clientId] = now();
      state.energy.taps = Number(state.energy.taps || 0) + 1;
      state.energy.score = Math.min(100, Number(state.energy.score || 0) + 1);
      if (state.energy.score === 100) addActivity(state, 'energy', 'La energía llegó al máximo');
      persistAndBroadcast(record.id);
      if (typeof ack === 'function') ack(ok());
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
    }
  });

  socket.on('energy:reset', (payload, ack) => {
    try {
      const record = getRecordOrThrow(getEventIdFromPayload(socket, payload));
      requireAdmin(record, payload.pin);
      record.state.energy = { score: 0, taps: 0, contributorsByClient: {} };
      addActivity(record.state, 'admin', 'Cabina reinició la energía colectiva');
      persistAndBroadcast(record.id);
      if (typeof ack === 'function') ack(ok());
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
    }
  });

  socket.on('battle:create', (payload, ack) => {
    try {
      const record = getRecordOrThrow(getEventIdFromPayload(socket, payload));
      const state = record.state;
      requireAdmin(record, payload.pin);
      const nameA = text(payload.nameA, 80);
      const artistA = text(payload.artistA, 80);
      const nameB = text(payload.nameB, 80);
      const artistB = text(payload.artistB, 80);
      const duration = Math.max(1, Math.min(180, Number(payload.durationMinutes || 5)));
      if (!nameA || !nameB) throw httpError('Cargá las dos canciones de la batalla.');
      state.battle = {
        active: true,
        title: text(payload.title, 80) || 'Batalla de canciones',
        optionA: { name: nameA, artist: artistA },
        optionB: { name: nameB, artist: artistB },
        votesByClient: {},
        endsAt: new Date(Date.now() + duration * 60 * 1000).toISOString(),
        createdAt: now(),
      };
      addActivity(state, 'battle', `Nueva batalla: ${nameA} vs ${nameB}`);
      persistAndBroadcast(record.id);
      if (typeof ack === 'function') ack(ok());
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
    }
  });

  socket.on('battle:vote', (payload, ack) => {
    try {
      const record = getRecordOrThrow(getEventIdFromPayload(socket, payload));
      const state = record.state;
      requirePublicOpen(state);
      const clientId = text(payload.clientId || socket.data.clientId, 80);
      publicCooldown(record, clientId, 'battle:vote');
      const choice = payload.choice === 'b' ? 'b' : 'a';
      if (!state.battle.active) throw httpError('No hay batalla activa.');
      state.battle.votesByClient[clientId] = choice;
      addActivity(state, 'battle', 'Nuevo voto en batalla de canciones');
      persistAndBroadcast(record.id);
      if (typeof ack === 'function') ack(ok());
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
    }
  });

  socket.on('battle:close', (payload, ack) => {
    try {
      const record = getRecordOrThrow(getEventIdFromPayload(socket, payload));
      requireAdmin(record, payload.pin);
      record.state.battle.active = false;
      addActivity(record.state, 'admin', 'Cabina cerró la batalla de canciones');
      persistAndBroadcast(record.id);
      if (typeof ack === 'function') ack(ok());
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
    }
  });

  socket.on('trivia:create', (payload, ack) => {
    try {
      const record = getRecordOrThrow(getEventIdFromPayload(socket, payload));
      const state = record.state;
      requireAdmin(record, payload.pin);
      const question = text(payload.question, 140);
      const options = [payload.a, payload.b, payload.c, payload.d].map((option) => text(option, 80));
      const correctIndex = Number(payload.correctIndex);
      if (!question || options.some((option) => !option)) throw httpError('Completá pregunta y cuatro opciones.');
      if (![0, 1, 2, 3].includes(correctIndex)) throw httpError('Elegí la opción correcta.');
      state.trivia = {
        active: true,
        question,
        options,
        correctIndex,
        votesByClient: {},
        createdAt: now(),
      };
      addActivity(state, 'trivia', `Nueva trivia: ${question}`);
      persistAndBroadcast(record.id);
      if (typeof ack === 'function') ack(ok());
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
    }
  });

  socket.on('trivia:vote', (payload, ack) => {
    try {
      const record = getRecordOrThrow(getEventIdFromPayload(socket, payload));
      const state = record.state;
      requirePublicOpen(state);
      const clientId = text(payload.clientId || socket.data.clientId, 80);
      publicCooldown(record, clientId, 'trivia:vote');
      const choice = Number(payload.choice);
      if (!state.trivia.active) throw httpError('No hay trivia activa.');
      if (![0, 1, 2, 3].includes(choice)) throw httpError('Opción inválida.');
      state.trivia.votesByClient[clientId] = String(choice);
      addActivity(state, 'trivia', 'Nuevo voto en trivia');
      persistAndBroadcast(record.id);
      if (typeof ack === 'function') ack(ok());
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
    }
  });

  socket.on('trivia:close', (payload, ack) => {
    try {
      const record = getRecordOrThrow(getEventIdFromPayload(socket, payload));
      requireAdmin(record, payload.pin);
      record.state.trivia.active = false;
      addActivity(record.state, 'admin', 'Cabina cerró la trivia');
      persistAndBroadcast(record.id);
      if (typeof ack === 'function') ack(ok());
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
    }
  });

  socket.on('screen:set', (payload, ack) => {
    try {
      const record = getRecordOrThrow(getEventIdFromPayload(socket, payload));
      requireAdmin(record, payload.pin);
      const state = record.state;
      const allowedModes = ['live', 'qr', 'energy', 'dedications', 'battle', 'trivia', 'stats'];
      const mode = allowedModes.includes(payload.mode) ? payload.mode : 'qr';
      state.screen.mode = mode;
      state.screen.announcement = text(payload.announcement, 100) || state.screen.announcement;
      addActivity(state, 'admin', `Pantalla show cambió a ${mode}`);
      persistAndBroadcast(record.id);
      if (typeof ack === 'function') ack(ok());
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
    }
  });

  socket.on('screen:banner', (payload, ack) => {
    try {
      const record = getRecordOrThrow(getEventIdFromPayload(socket, payload));
      requireAdmin(record, payload.pin);
      const state = record.state;
      const allowedEffects = ['spark', 'heart', 'bolt', 'pixel', 'confetti'];
      const allowedBackgrounds = ['neon', 'pink', 'cyan', 'gold', 'game'];
      const allowedMotions = ['pop', 'marquee', 'rise', 'blast'];
      const nextText = text(payload.text, 180);
      const visible = Boolean(payload.visible) && Boolean(nextText);
      state.screen.banner = {
        ...(state.screen.banner || {}),
        text: nextText,
        visible,
        effect: allowedEffects.includes(payload.effect) ? payload.effect : 'spark',
        background: allowedBackgrounds.includes(payload.background) ? payload.background : 'neon',
        motion: allowedMotions.includes(payload.motion) ? payload.motion : 'pop',
        durationSeconds: [0, 10, 20].includes(Number(payload.durationSeconds)) ? Number(payload.durationSeconds) : 0,
        lastShownAt: visible ? now() : (state.screen.banner && state.screen.banner.lastShownAt) || null,
      };
      addActivity(state, 'admin', visible ? `Cartel en pantalla: ${nextText}` : 'Cabina ocultó el cartel de pantalla');
      persistAndBroadcast(record.id);
      if (typeof ack === 'function') ack(ok());
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
    }
  });


  socket.on('screen:standby', (payload, ack) => {
    try {
      const record = getRecordOrThrow(getEventIdFromPayload(socket, payload));
      requireAdmin(record, payload.pin);
      const state = record.state;
      const allowedFx = [
        'neon-tunnel',
        'energy-burst',
        'cyber-grid',
        'plasma-waves',
        'laser-storm',
        'future-rings',
        'digital-galaxy',
        'dj-reactor',
        'glitch-impact',
        'epic-countdown',
      ];
      const allowedRotation = ['single', 'random'];
      const allowedDurations = [15, 30, 45, 60];
      const fxId = allowedFx.includes(payload.fxId) ? payload.fxId : 'neon-tunnel';
      const rotationMode = allowedRotation.includes(payload.rotationMode) ? payload.rotationMode : 'single';
      const durationSeconds = allowedDurations.includes(Number(payload.durationSeconds)) ? Number(payload.durationSeconds) : 30;
      const visible = Boolean(payload.visible);

      state.screen.standby = {
        ...(state.screen.standby || {}),
        visible,
        fxId,
        rotationMode,
        durationSeconds,
        updatedAt: now(),
      };

      addActivity(
        state,
        'admin',
        visible
          ? `Standby FX activo: ${rotationMode === 'random' ? 'aleatorio' : fxId}`
          : 'Cabina volvió al dashboard/show'
      );
      persistAndBroadcast(record.id);
      if (typeof ack === 'function') ack(ok());
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
    }
  });

  socket.on('event:update', (payload, ack) => {
    try {
      const record = getRecordOrThrow(getEventIdFromPayload(socket, payload));
      const state = record.state;
      requireAdmin(record, payload.pin);
      state.event.title = text(payload.title, 60) || state.event.title;
      state.event.djName = text(payload.djName, 60) || state.event.djName;
      state.event.style = text(payload.style, 80) || state.event.style;
      state.event.bpm = text(payload.bpm, 20);
      state.event.publicUrl = text(payload.publicUrl, 250);
      addActivity(state, 'admin', 'Cabina actualizó los datos del evento');
      persistAndBroadcast(record.id);
      if (typeof ack === 'function') ack(ok());
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
    }
  });

  socket.on('event:set-status', (payload, ack) => {
    try {
      const record = getRecordOrThrow(getEventIdFromPayload(socket, payload));
      const state = record.state;
      requireAdmin(record, payload.pin);
      const status = payload.status;
      if (status === 'active') {
        state.event.active = true;
        state.event.paused = false;
        state.event.closed = false;
      }
      if (status === 'paused') {
        state.event.active = true;
        state.event.paused = true;
        state.event.closed = false;
      }
      if (status === 'closed') {
        state.event.active = false;
        state.event.paused = false;
        state.event.closed = true;
      }
      addActivity(state, 'admin', `Estado del evento: ${status}`);
      persistAndBroadcast(record.id);
      if (typeof ack === 'function') ack(ok());
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
    }
  });

  socket.on('event:reset', (payload, ack) => {
    try {
      const record = getRecordOrThrow(getEventIdFromPayload(socket, payload));
      requireAdmin(record, payload.pin);
      resetEventRecord(record);
      addActivity(record.state, 'admin', 'Cabina reinició todos los datos del evento');
      persistAndBroadcast(record.id);
      if (typeof ack === 'function') ack(ok());
    } catch (error) {
      if (typeof ack === 'function') ack(fail(error));
    }
  });
});

const distDir = path.join(__dirname, '..', 'dist');
app.use(express.static(distDir));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ ok: false, message: 'Endpoint no encontrado.' });
    return;
  }
  res.sendFile(path.join(distDir, 'index.html'), (error) => {
    if (error) {
      res.status(200).send(`
        <html lang="es">
          <head><title>Pista Viva DJ</title></head>
          <body style="font-family:Arial;background:#02030a;color:white;padding:32px">
            <h1>Pista Viva DJ API activa</h1>
            <p>Servidor multi-evento activo.</p>
            <p>Para desarrollo abrí <strong>http://localhost:5173/</strong>.</p>
          </body>
        </html>
      `);
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Pista Viva DJ multi-evento listo en http://${HOST}:${PORT}`);
});

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.join(__dirname, '..', 'data');
const eventsFile = path.join(dataDir, 'events.json');
const legacyStateFile = path.join(dataDir, 'state.json');

function makeId(prefix = 'id') {
  if (crypto.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function now() {
  return new Date().toISOString();
}

function slugify(value) {
  const clean = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return clean || `evento-${Date.now()}`;
}

function randomPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function defaultState() {
  return {
    version: 3,
    createdAt: now(),
    updatedAt: now(),
    event: {
      id: '',
      title: 'Pista Viva DJ',
      djName: 'DJ en vivo',
      style: 'Fiesta interactiva',
      bpm: '',
      active: true,
      paused: false,
      closed: false,
      publicUrl: '',
      connectedByClient: {},
    },
    screen: {
      mode: 'live',
      announcement: 'Escaneá y participá',
      banner: {
        text: '',
        visible: false,
        effect: 'spark',
        background: 'neon',
        motion: 'pop',
        durationSeconds: 0,
        lastShownAt: null,
      },
    },
    mood: {
      options: [
        { id: 'reggaeton', label: 'Más reggaetón', icon: '🕶️', accent: 'pink' },
        { id: 'cumbia', label: 'Más cumbia', icon: '🥁', accent: 'orange' },
        { id: 'electronica', label: 'Más electrónica', icon: '🎧', accent: 'cyan' },
        { id: 'clasicos', label: 'Clásicos', icon: '🪩', accent: 'violet' },
        { id: 'romantico', label: 'Romántico', icon: '💗', accent: 'magenta' },
        { id: 'sorpresa', label: 'Sorpresa DJ', icon: '❔', accent: 'green' },
      ],
      votesByClient: {},
    },
    songRequests: [],
    dedications: [],
    energy: {
      score: 0,
      taps: 0,
      contributorsByClient: {},
    },
    battle: {
      active: false,
      title: 'Batalla de canciones',
      optionA: { name: '', artist: '' },
      optionB: { name: '', artist: '' },
      votesByClient: {},
      endsAt: null,
      createdAt: null,
    },
    trivia: {
      active: false,
      question: '',
      options: ['', '', '', ''],
      correctIndex: null,
      votesByClient: {},
      createdAt: null,
    },
    activity: [],
  };
}

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function normalizeState(input, eventId = '') {
  const base = defaultState();
  const state = {
    ...base,
    ...input,
    event: { ...base.event, ...(input.event || {}), id: eventId || (input.event && input.event.id) || '' },
    screen: {
      ...base.screen,
      ...(input.screen || {}),
      banner: { ...base.screen.banner, ...(((input.screen || {}).banner) || {}) },
    },
    mood: { ...base.mood, ...(input.mood || {}) },
    energy: { ...base.energy, ...(input.energy || {}) },
    battle: { ...base.battle, ...(input.battle || {}) },
    trivia: { ...base.trivia, ...(input.trivia || {}) },
  };

  if (!Array.isArray(state.mood.options)) state.mood.options = base.mood.options;
  if (!state.mood.votesByClient || typeof state.mood.votesByClient !== 'object') state.mood.votesByClient = {};
  if (!Array.isArray(state.songRequests)) state.songRequests = [];
  if (!Array.isArray(state.dedications)) state.dedications = [];
  if (!Array.isArray(state.activity)) state.activity = [];
  if (!state.energy.contributorsByClient || typeof state.energy.contributorsByClient !== 'object') state.energy.contributorsByClient = {};
  if (!state.event.connectedByClient || typeof state.event.connectedByClient !== 'object') state.event.connectedByClient = {};
  if (!state.battle.votesByClient || typeof state.battle.votesByClient !== 'object') state.battle.votesByClient = {};
  if (!state.trivia.votesByClient || typeof state.trivia.votesByClient !== 'object') state.trivia.votesByClient = {};
  state.version = 3;
  state.updatedAt = now();
  return state;
}

function defaultStore() {
  return {
    version: 3,
    createdAt: now(),
    updatedAt: now(),
    events: {},
  };
}

function normalizeEventRecord(record, eventId) {
  const id = slugify(eventId || record?.id);
  const pin = String(record?.pin || randomPin()).slice(0, 24);
  return {
    id,
    pin,
    createdAt: record?.createdAt || now(),
    updatedAt: now(),
    state: normalizeState(record?.state || defaultState(), id),
  };
}

function normalizeStore(input) {
  const store = {
    ...defaultStore(),
    ...(input || {}),
    events: {},
  };

  if (input && input.events && typeof input.events === 'object') {
    for (const [key, value] of Object.entries(input.events)) {
      const id = slugify(key);
      store.events[id] = normalizeEventRecord(value, id);
    }
  }

  store.updatedAt = now();
  return store;
}

function loadStore() {
  ensureDataDir();

  if (!fs.existsSync(eventsFile) && fs.existsSync(legacyStateFile)) {
    try {
      const legacy = JSON.parse(fs.readFileSync(legacyStateFile, 'utf8'));
      const id = 'evento-demo';
      const migrated = defaultStore();
      migrated.events[id] = normalizeEventRecord({
        id,
        pin: process.env.ADMIN_PIN || '1234',
        state: normalizeState(legacy, id),
      }, id);
      saveStore(migrated);
      return migrated;
    } catch (_error) {
      // If migration fails, continue with an empty multi-event store.
    }
  }

  if (!fs.existsSync(eventsFile)) {
    const fresh = defaultStore();
    saveStore(fresh);
    return fresh;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
    return normalizeStore(parsed);
  } catch (error) {
    const backup = `${eventsFile}.broken-${Date.now()}.json`;
    fs.copyFileSync(eventsFile, backup);
    const fresh = defaultStore();
    saveStore(fresh);
    return fresh;
  }
}

function saveStore(store) {
  ensureDataDir();
  store.updatedAt = now();
  fs.writeFileSync(eventsFile, JSON.stringify(store, null, 2), 'utf8');
}

function createEvent(store, { eventId, title, djName, pin }) {
  const id = slugify(eventId || title || 'evento');
  if (store.events[id]) {
    const error = new Error('Ese código de evento ya existe. Elegí otro.');
    error.status = 409;
    throw error;
  }
  const cleanPin = text(pin, 24);
  if (cleanPin.length < 4) {
    const error = new Error('El PIN debe tener al menos 4 caracteres.');
    error.status = 400;
    throw error;
  }

  const state = defaultState();
  state.event.id = id;
  state.event.title = text(title, 60) || 'Pista Viva DJ';
  state.event.djName = text(djName, 60) || 'DJ en vivo';
  state.event.style = 'Fiesta interactiva';
  addActivity(state, 'admin', 'Evento creado');

  const record = normalizeEventRecord({
    id,
    pin: cleanPin,
    state,
  }, id);

  store.events[id] = record;
  saveStore(store);
  return record;
}

function getEventRecord(store, eventId) {
  const id = slugify(eventId);
  return store.events[id] || null;
}

function resetEventRecord(record) {
  const previous = record.state.event || {};
  const fresh = defaultState();
  fresh.event.id = record.id;
  fresh.event.title = previous.title || 'Pista Viva DJ';
  fresh.event.djName = previous.djName || 'DJ en vivo';
  fresh.event.style = previous.style || 'Fiesta interactiva';
  fresh.event.bpm = previous.bpm || '';
  fresh.event.publicUrl = previous.publicUrl || '';
  record.state = normalizeState(fresh, record.id);
  record.updatedAt = now();
  return record.state;
}

function text(value, max = 120) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function addActivity(state, type, message) {
  state.activity.unshift({
    id: makeId('act'),
    type,
    message: text(message, 180),
    createdAt: now(),
  });
  state.activity = state.activity.slice(0, 80);
}

function countValues(object) {
  return Object.values(object || {}).reduce((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function getPublicState(state) {
  const moodCounts = countValues(state.mood.votesByClient);
  const totalMoodVotes = Object.keys(state.mood.votesByClient).length;
  const moodOptions = state.mood.options.map((option) => {
    const votes = moodCounts[option.id] || 0;
    return { ...option, votes, percent: percent(votes, totalMoodVotes) };
  });

  const requests = state.songRequests
    .map((request) => ({
      id: request.id,
      name: request.name,
      song: request.song,
      artist: request.artist,
      message: request.message,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      votes: Object.keys(request.votesByClient || {}).length,
    }))
    .sort((a, b) => b.votes - a.votes || new Date(b.createdAt) - new Date(a.createdAt));

  const approvedDedications = state.dedications
    .filter((dedication) => dedication.status === 'approved')
    .map(({ id, name, message, status, createdAt, approvedAt }) => ({ id, name, message, status, createdAt, approvedAt }))
    .sort((a, b) => new Date(b.approvedAt || b.createdAt) - new Date(a.approvedAt || a.createdAt));

  const pendingDedications = state.dedications
    .filter((dedication) => dedication.status === 'pending')
    .map(({ id, name, message, status, createdAt }) => ({ id, name, message, status, createdAt }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const battleTotal = Object.keys(state.battle.votesByClient || {}).length;
  const battleVotes = countValues(state.battle.votesByClient);
  const triviaTotal = Object.keys(state.trivia.votesByClient || {}).length;
  const triviaVotes = countValues(state.trivia.votesByClient);

  return {
    version: state.version,
    updatedAt: state.updatedAt,
    event: {
      id: state.event.id,
      title: state.event.title,
      djName: state.event.djName,
      style: state.event.style,
      bpm: state.event.bpm,
      active: state.event.active,
      paused: state.event.paused,
      closed: state.event.closed,
      publicUrl: state.event.publicUrl,
      connected: Object.keys(state.event.connectedByClient || {}).length,
    },
    screen: state.screen,
    mood: {
      totalVotes: totalMoodVotes,
      options: moodOptions,
    },
    songRequests: requests,
    dedications: {
      approved: approvedDedications,
      pending: pendingDedications,
      total: state.dedications.length,
    },
    energy: {
      score: Math.max(0, Math.min(100, Number(state.energy.score) || 0)),
      taps: Number(state.energy.taps) || 0,
      contributors: Object.keys(state.energy.contributorsByClient || {}).length,
    },
    battle: {
      active: Boolean(state.battle.active),
      title: state.battle.title,
      optionA: state.battle.optionA,
      optionB: state.battle.optionB,
      votesA: battleVotes.a || 0,
      votesB: battleVotes.b || 0,
      percentA: percent(battleVotes.a || 0, battleTotal),
      percentB: percent(battleVotes.b || 0, battleTotal),
      totalVotes: battleTotal,
      endsAt: state.battle.endsAt,
      createdAt: state.battle.createdAt,
    },
    trivia: {
      active: Boolean(state.trivia.active),
      question: state.trivia.question,
      options: state.trivia.options,
      correctIndex: state.trivia.correctIndex,
      votes: state.trivia.options.map((_, index) => triviaVotes[String(index)] || 0),
      percents: state.trivia.options.map((_, index) => percent(triviaVotes[String(index)] || 0, triviaTotal)),
      totalVotes: triviaTotal,
      createdAt: state.trivia.createdAt,
    },
    activity: state.activity.slice(0, 30),
  };
}

function getClientState(state, clientId) {
  const id = text(clientId, 80);
  return {
    moodVote: state.mood.votesByClient[id] || null,
    battleVote: state.battle.votesByClient[id] || null,
    triviaVote: state.trivia.votesByClient[id] || null,
    energyContributed: Boolean(state.energy.contributorsByClient[id]),
    votedRequestIds: state.songRequests
      .filter((request) => Boolean((request.votesByClient || {})[id]))
      .map((request) => request.id),
  };
}

module.exports = {
  makeId,
  now,
  slugify,
  randomPin,
  defaultState,
  normalizeState,
  loadStore,
  saveStore,
  createEvent,
  getEventRecord,
  resetEventRecord,
  text,
  addActivity,
  getPublicState,
  getClientState,
  eventsFile,
};

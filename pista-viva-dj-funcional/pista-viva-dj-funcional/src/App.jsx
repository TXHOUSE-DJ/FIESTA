import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import QRCode from 'qrcode';
import {
  BarChart3,
  Cast,
  Download,
  Smartphone,
  Check,
  Crown,
  Gamepad2,
  Heart,
  Home,
  Lock,
  Menu,
  MessageCircle,
  MonitorPlay,
  Music2,
  PauseCircle,
  PlayCircle,
  Power,
  RefreshCcw,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Swords,
  Trash2,
  Trophy,
  Users,
  Vote,
  X,
  Zap,
} from 'lucide-react';

function cls(...items) {
  return items.filter(Boolean).join(' ');
}

function Brand({ compact = false }) {
  return (
    <div className={cls('flex items-center justify-center gap-3 text-center', compact && 'justify-start gap-2')}>
      <div className={cls('relative grid shrink-0 place-items-center rounded-2xl border border-neonCyan/40 bg-gradient-to-br from-neonCyan/20 via-neonViolet/20 to-neonPink/20 text-white shadow-neonCyan', compact ? 'h-11 w-11' : 'h-16 w-16')}>
        <Zap className="text-neonCyan" size={compact ? 24 : 34} />
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-neonPink shadow-neonPink" />
      </div>
      <div className={cls('leading-tight', compact ? 'text-left' : 'text-left')}>
        <div className={cls('font-black tracking-tight text-white', compact ? 'text-xl' : 'text-3xl')}>
          Pista Viva <span className="bg-gradient-to-r from-neonPink via-white to-neonCyan bg-clip-text text-transparent">DJ</span>
        </div>
        <div className={cls('font-bold uppercase tracking-[0.22em] text-neonCyan', compact ? 'text-[9px]' : 'text-xs')}>
          Interacción en vivo
        </div>
      </div>
    </div>
  );
}


function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  async function install() {
    if (!promptEvent) return { ok: false, reason: 'manual' };
    promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice?.outcome === 'accepted') {
      setInstalled(true);
      setPromptEvent(null);
      return { ok: true };
    }
    return { ok: false, reason: 'dismissed' };
  }

  return { canInstall: Boolean(promptEvent), installed, install };
}

function InstallAppButton({ type = 'public', compact = false, className = '' }) {
  const { canInstall, installed, install } = useInstallPrompt();
  const [helpOpen, setHelpOpen] = useState(false);
  const isDj = type === 'dj';
  const label = isDj ? 'Descargar Cabina DJ' : 'Descargar App de la fiesta';
  const sublabel = isDj ? 'Icono privado para el DJ' : 'Icono para invitados';

  async function handleInstall() {
    if (installed) {
      setHelpOpen(true);
      return;
    }
    if (canInstall) {
      const result = await install();
      if (result?.ok) return;
    }
    setHelpOpen(true);
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleInstall}
        className={cls(
          'group relative w-full overflow-hidden rounded-3xl border bg-white/[.055] text-left shadow-neonCyan transition active:scale-[.98]',
          isDj ? 'border-neonPink/35' : 'border-neonCyan/35',
          compact ? 'p-3' : 'p-4',
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(0,229,255,.13),transparent_28%),radial-gradient(circle_at_85%_80%,rgba(255,43,214,.14),transparent_30%)]" />
        <div className="relative z-10 flex items-center gap-3">
          <div className={cls('grid shrink-0 place-items-center rounded-2xl border bg-black/35', isDj ? 'border-neonPink/35 text-neonPink' : 'border-neonCyan/35 text-neonCyan', compact ? 'h-11 w-11' : 'h-14 w-14')}>
            {isDj ? <ShieldCheck size={compact ? 24 : 30} /> : <Smartphone size={compact ? 24 : 30} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className={cls('font-black text-white', compact ? 'text-sm' : 'text-lg')}>{installed ? 'App instalada' : label}</div>
            <div className="mt-0.5 text-xs font-bold text-softText">{sublabel}</div>
          </div>
          <Download className={isDj ? 'text-neonPink' : 'text-neonCyan'} size={24} />
        </div>
      </button>

      {helpOpen && (
        <div className="mt-3 rounded-3xl border border-white/10 bg-black/55 p-4 text-sm text-softText">
          <div className="mb-2 font-black text-white">Instalación manual</div>
          <p><strong>Android / Chrome:</strong> tocá ⋮ y elegí “Agregar a pantalla principal”.</p>
          <p className="mt-1"><strong>iPhone / Safari:</strong> tocá Compartir ⬆ y elegí “Agregar a inicio”.</p>
          <p className="mt-2 text-xs">El icono cambia según dónde la instales: público desde /e/codigo y DJ desde /cabina/codigo.</p>
        </div>
      )}
    </div>
  );
}


function apiOrigin() {
  const explicit = import.meta.env.VITE_API_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  if (window.location.port === '5173') {
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }
  return window.location.origin;
}

function getClientId() {
  const key = 'pista_viva_client_id';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const generated =
    window.crypto && window.crypto.randomUUID
      ? `client_${window.crypto.randomUUID()}`
      : `client_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(key, generated);
  return generated;
}

function usePista(eventId) {
  const [payload, setPayload] = useState(null);
  const [connected, setConnected] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');
  const clientId = useMemo(getClientId, []);
  const origin = useMemo(apiOrigin, []);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!eventId) {
      setPayload(null);
      setConnected(false);
      setError('');
      return undefined;
    }

    const socket = io(origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 600,
      reconnectionAttempts: Infinity,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('client:join', { clientId, eventId });
    });

    socket.on('disconnect', () => setConnected(false));
    socket.on('state', (nextPayload) => {
      setError('');
      setPayload(nextPayload);
    });
    socket.on('state:error', (response) => setError(response?.message || 'No se pudo abrir el evento.'));

    fetch(`${origin}/api/state?eventId=${encodeURIComponent(eventId)}&clientId=${encodeURIComponent(clientId)}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data?.ok && data?.message) {
          setError(data.message);
          setPayload(null);
          return;
        }
        setError('');
        setPayload(data);
      })
      .catch(() => {
        setError('No se pudo conectar con el servidor.');
        setToast({ type: 'error', text: 'No se pudo conectar con el servidor.' });
      });

    return () => socket.disconnect();
  }, [clientId, origin, eventId]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function action(eventName, data = {}) {
    return new Promise((resolve) => {
      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        const result = { ok: false, message: 'Sin conexión con el servidor.' };
        setToast({ type: 'error', text: result.message });
        resolve(result);
        return;
      }

      socket.emit(eventName, { ...data, clientId, eventId }, (response) => {
        if (!response || !response.ok) {
          setToast({ type: 'error', text: response?.message || 'No se pudo completar.' });
          resolve(response || { ok: false });
          return;
        }
        resolve(response);
      });
    });
  }

  function notify(text, type = 'success') {
    setToast({ text, type });
  }

  return {
    state: payload?.state,
    me: payload?.me || {},
    connected,
    clientId,
    apiOrigin: origin,
    eventId,
    error,
    action,
    notify,
    toast,
  };
}

const TXHOUSE_URL = 'https://www.txhouse.com.ar';

const STANDBY_FX = [
  { id: 'neon-tunnel', number: 1, icon: '🌀', title: 'Neon Tunnel', subtitle: 'túnel láser hipervelocidad' },
  { id: 'energy-burst', number: 2, icon: '💥', title: 'Energy Burst', subtitle: 'explosión de partículas' },
  { id: 'cyber-grid', number: 3, icon: '🌐', title: 'Cyber Grid', subtitle: 'horizonte synthwave 3D' },
  { id: 'plasma-waves', number: 4, icon: '〰️', title: 'Plasma Waves', subtitle: 'ondas líquidas eléctricas' },
  { id: 'laser-storm', number: 5, icon: '⚡', title: 'Laser Storm', subtitle: 'tormenta de rayos y humo' },
  { id: 'future-rings', number: 6, icon: '◎', title: 'Future Rings', subtitle: 'anillos orbitales épicos' },
  { id: 'digital-galaxy', number: 7, icon: '✨', title: 'Digital Galaxy', subtitle: 'nebulosa digital infinita' },
  { id: 'dj-reactor', number: 8, icon: '☢', title: 'DJ Pulse Reactor', subtitle: 'núcleo de energía de pista' },
  { id: 'glitch-impact', number: 9, icon: '▣', title: 'Glitch Impact', subtitle: 'cortes cibernéticos agresivos' },
  { id: 'epic-countdown', number: 10, icon: '🔺', title: 'Epic Countdown', subtitle: 'intro de show profesional' },
];

const STANDBY_DURATIONS = [15, 30, 45, 60];


const TXHOUSE_SLIDES = [
  { eyebrow: 'Sponsor oficial', title: 'Auriculares & audio', text: 'Soná mejor.', tags: ['Auriculares', 'Parlantes'], accent: 'cyan' },
  { eyebrow: 'Tech store', title: 'Gaming', text: 'Jugá a otro nivel.', tags: ['Mouse', 'Teclados'], accent: 'pink' },
  { eyebrow: 'TXHOUSE', title: 'Luces DJ', text: 'Brillá en tu evento.', tags: ['DJ', 'Luces LED'], accent: 'violet' },
  { eyebrow: 'Entrega rápida', title: 'Cargadores', text: 'Siempre con batería.', tags: ['Carga', 'USB'], accent: 'cyan' },
  { eyebrow: 'Tecnología', title: 'Cables & adaptadores', text: 'Conectá todo.', tags: ['HDMI', 'Adaptadores'], accent: 'pink' },
  { eyebrow: 'Setup ideal', title: 'Teclados & mouse', text: 'Comodidad y estilo.', tags: ['Periféricos', 'Oficina'], accent: 'violet' },
  { eyebrow: 'Rosario', title: 'Retirá en Alberdi 239', text: 'Pasá y llevátelo.', tags: ['Stock TX', 'Local'], accent: 'cyan' },
  { eyebrow: 'WhatsApp', title: 'Pedí fácil', text: 'Consultá y resolvé rápido.', tags: ['Atención', 'Asesoramiento'], accent: 'pink' },
  { eyebrow: 'Accesorios', title: 'Tecnología para todos los días', text: 'Simple, útil, canchera.', tags: ['Accesorios', 'Tech'], accent: 'violet' },
  { eyebrow: 'txhouse.com.ar', title: 'Tu tienda tech', text: 'Entrá y descubrí más.', tags: ['Online', 'Rosario'], accent: 'cyan' },
];

function useRotatingIndex(length, delay = 5200) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!length || length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % length);
    }, delay);
    return () => window.clearInterval(timer);
  }, [length, delay]);

  return index % Math.max(length, 1);
}

function getTxAccentStyles(accent = 'cyan') {
  if (accent === 'pink') {
    return {
      chip: 'border-neonPink/35 bg-neonPink/12 text-neonPink',
      glow: 'shadow-neonPink',
      dot: 'bg-neonPink',
      title: 'from-white via-neonPink to-neonCyan',
    };
  }
  if (accent === 'violet') {
    return {
      chip: 'border-neonViolet/35 bg-neonViolet/14 text-[#c8adff]',
      glow: 'shadow-neonViolet',
      dot: 'bg-neonViolet',
      title: 'from-white via-[#c8adff] to-neonPink',
    };
  }
  return {
    chip: 'border-neonCyan/35 bg-neonCyan/12 text-neonCyan',
    glow: 'shadow-neonCyan',
    dot: 'bg-neonCyan',
    title: 'from-white via-neonCyan to-neonPink',
  };
}

function TxHouseLogo({ compact = false, stacked = false }) {
  return (
    <div className={cls('flex text-white', stacked ? 'flex-col items-center text-center' : 'items-center gap-3')}>
      <div className={cls('grid place-items-center rounded-[24px] border border-white/12 bg-white/[.06] font-black text-white shadow-2xl', compact ? 'h-12 w-12 text-base' : 'h-16 w-16 text-2xl')}>
        TX
      </div>
      <div className={cls('leading-none', stacked ? 'mt-2' : '')}>
        <div className={cls('font-black tracking-wide text-white', compact ? 'text-base' : 'text-2xl')}>TXHouse</div>
        <div className={cls('mt-1 text-softText', compact ? 'text-[10px]' : 'text-xs')}>Tecnología para tu fiesta</div>
      </div>
    </div>
  );
}

function TxHouseBanner({ compact = false, className = '' }) {
  const currentIndex = useRotatingIndex(TXHOUSE_SLIDES.length, compact ? 4200 : 5200);
  const slide = TXHOUSE_SLIDES[currentIndex];
  const accent = getTxAccentStyles(slide.accent);

  return (
    <a
      href={TXHOUSE_URL}
      target="_blank"
      rel="noreferrer"
      className={cls('txhouse-banner group relative block overflow-hidden rounded-[30px] border border-white/10 bg-black/35 backdrop-blur-xl transition hover:scale-[1.01] active:scale-[.99]', compact ? 'p-3.5' : 'p-4', className)}
    >
      <div className="txhouse-overlay absolute inset-0 opacity-80" />
      <div className={cls('relative z-10 grid items-center gap-3', compact ? 'grid-cols-[96px_1fr]' : 'grid-cols-[116px_1fr]')}>
        <div className={cls('relative overflow-hidden rounded-[24px] border border-white/10 bg-black/30 p-3', accent.glow)}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.10),transparent_24%),radial-gradient(circle_at_80%_75%,rgba(255,255,255,.08),transparent_24%)]" />
          <div className="relative z-10 flex h-full min-h-[106px] flex-col items-center justify-center gap-2">
            <div className="txhouse-logo-pulse">
              <TxHouseLogo stacked compact={false} />
            </div>
          </div>
        </div>

        <div key={currentIndex} className="txhouse-slide-copy min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className={cls('inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em]', accent.chip)}>
              {slide.eyebrow}
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              {TXHOUSE_SLIDES.map((item, index) => (
                <span
                  key={item.title}
                  className={cls('block h-1.5 rounded-full transition-all', index === currentIndex ? 'w-5 ' + accent.dot : 'w-1.5 bg-white/25')}
                />
              ))}
            </div>
          </div>

          <h3 className={cls('mt-3 bg-gradient-to-r bg-clip-text font-black text-transparent', compact ? 'text-lg leading-tight' : 'text-xl leading-tight', accent.title)}>
            {slide.title}
          </h3>
          <p className={cls('mt-1.5 font-semibold text-white/90', compact ? 'text-sm' : 'text-[15px]')}>
            {slide.text}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {slide.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/[.05] px-2.5 py-1 text-[11px] font-bold text-softText">
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-softText">txhouse.com.ar</div>
            <div className={cls('rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]', accent.chip)}>
              Ver sponsor ↗
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}

function TxHousePoweredBy({ className = '' }) {
  const currentIndex = useRotatingIndex(TXHOUSE_SLIDES.length, 4200);
  const slide = TXHOUSE_SLIDES[currentIndex];
  const accent = getTxAccentStyles(slide.accent);

  return (
    <a
      href={TXHOUSE_URL}
      target="_blank"
      rel="noreferrer"
      className={cls('relative block overflow-hidden rounded-[24px] border border-white/10 bg-black/30 px-4 py-3 backdrop-blur-xl', className)}
    >
      <div className="txhouse-overlay absolute inset-0 opacity-60" />
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={cls('rounded-2xl border border-white/10 bg-white/[.05] p-2.5', accent.glow)}>
            <div className="text-center text-lg font-black leading-none text-white">TX</div>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-softText">Sponsor</div>
            <div className="truncate text-sm font-black text-white">TXHouse · {slide.title}</div>
          </div>
        </div>
        <div className={cls('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]', accent.chip)}>
          txhouse.com.ar
        </div>
      </div>
    </a>
  );
}

function getDashboardUrl(eventId) {
  return `${window.location.origin}/show/${encodeURIComponent(eventId || '')}?dashboard=1&tv=1`;
}

function CastDashboardPanel({ eventId, compact = false }) {
  const [status, setStatus] = useState('');

  async function copyLink() {
    const url = getDashboardUrl(eventId);
    try {
      await navigator.clipboard.writeText(url);
      setStatus('Link del dashboard copiado.');
    } catch {
      setStatus(url);
    }
  }

  async function projectDashboard() {
    const url = getDashboardUrl(eventId);

    if ('PresentationRequest' in window) {
      try {
        const request = new window.PresentationRequest([url]);
        await request.start();
        setStatus('Dashboard enviado a la pantalla disponible.');
        return;
      } catch (error) {
        if (error?.name === 'AbortError') {
          setStatus('Proyección cancelada.');
          return;
        }
      }
    }

    const popup = window.open(url, 'pista-viva-dashboard', 'popup=yes,width=1440,height=900');
    if (popup) {
      popup.focus();
      setStatus('Se abrió solo el dashboard. En Chrome podés enviarlo al TV con “Transmitir”.');
    } else {
      setStatus('El navegador bloqueó la ventana. Permití popups o copiá el link.');
    }
  }

  return (
    <div className={cls('glow-border rounded-[28px] border border-neonCyan/30 bg-neonCyan/10 p-4 shadow-neonCyan', compact && 'p-3')}>
      <div className="flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-neonCyan/35 bg-black/35 text-neonCyan">
          <Cast size={30} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-neonCyan">Proyección TV</div>
          <h2 className={cls('font-black text-white', compact ? 'text-lg' : 'text-2xl')}>Compartir solo el dashboard en vivo</h2>
          <p className="mt-1 text-sm text-softText">
            No comparte la cabina ni los controles del DJ. Abre/proyecta únicamente la pantalla pública con ranking, QR, mensajes, energía y votaciones.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={projectDashboard} className="neon-button flex items-center justify-center gap-2">
              <Cast size={20} /> Conectar TV
            </button>
            <button type="button" onClick={copyLink} className="soft-button">
              Copiar link dashboard
            </button>
          </div>
          {status && <p className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3 text-xs font-bold text-softText">{status}</p>}
          <p className="mt-2 break-all text-[11px] text-softText">{getDashboardUrl(eventId)}</p>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ state, connected }) {
  const closed = state?.event?.closed;
  const paused = state?.event?.paused;
  const label = closed ? 'Evento cerrado' : paused ? 'Pausado' : connected ? 'En vivo' : 'Conectando';
  const color = closed ? 'bg-red-400' : paused ? 'bg-yellow-300' : connected ? 'bg-neonGreen' : 'bg-white/40';

  return (
    <div className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3 py-1 text-xs font-black text-softText">
      <span className={cls('h-2.5 w-2.5 rounded-full', color)} />
      {label}
    </div>
  );
}

function AppHeader({ state, connected, onOpenMenu }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/60 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+14px)] backdrop-blur-xl">
      <Brand compact />
      <div className="mt-3 flex items-center justify-between gap-3">
        <StatusPill state={state} connected={connected} />
        <button
          type="button"
          onClick={onOpenMenu}
          className="rounded-2xl border border-white/10 bg-white/[.06] p-2 text-white"
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>
      </div>
    </header>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed left-1/2 top-[calc(env(safe-area-inset-top)+18px)] z-[80] w-[calc(100%-28px)] max-w-[430px] -translate-x-1/2">
      <div
        className={cls(
          'glow-border flex items-center gap-3 rounded-2xl border bg-black/80 p-4 text-sm font-bold shadow-2xl backdrop-blur-xl',
          toast.type === 'error' ? 'border-red-400/50 text-red-100' : 'border-neonGreen/50 text-white',
        )}
      >
        {toast.type === 'error' ? <X className="text-red-300" /> : <Check className="text-neonGreen" />}
        <span>{toast.text}</span>
      </div>
    </div>
  );
}

function Panel({ children, className = '' }) {
  return <section className={cls('neon-card p-4', className)}>{children}</section>;
}

function Button({ children, onClick, type = 'button', disabled = false, className = '', variant = 'primary' }) {
  const base =
    variant === 'primary'
      ? 'neon-button'
      : variant === 'danger'
        ? 'danger-button'
        : 'soft-button';
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls(base, className)}>
      {children}
    </button>
  );
}

function Field({ icon: Icon, label, className = '', ...props }) {
  return (
    <label className={cls('block space-y-2', className)}>
      {label && <span className="text-sm font-bold text-white/90">{label}</span>}
      <span className="relative block">
        {Icon && <Icon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-softText" size={18} />}
        <input className={cls('field', Icon && 'pl-11')} {...props} />
      </span>
    </label>
  );
}

function TextArea({ label, className = '', ...props }) {
  return (
    <label className={cls('block space-y-2', className)}>
      {label && <span className="text-sm font-bold text-white/90">{label}</span>}
      <textarea className="field min-h-28 resize-none" {...props} />
    </label>
  );
}

function EmptyState({ icon: Icon = Sparkles, title, text }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-white/[.035] p-6 text-center">
      <Icon className="mx-auto mb-3 text-neonCyan" size={34} />
      <h3 className="font-black">{title}</h3>
      <p className="mt-1 text-sm text-softText">{text}</p>
    </div>
  );
}

function getEnergyMode(score) {
  const value = Number(score) || 0;
  if (value >= 95) return 'critical';
  if (value >= 85) return 'overdrive';
  if (value >= 65) return 'boost';
  return 'normal';
}

function EnergyRing({ score, size = 'normal' }) {
  const dimension = size === 'large' ? 'h-60 w-60' : 'h-40 w-40';
  const energyMode = getEnergyMode(score);
  return (
    <div
      className={cls('energy-ring energy-core mx-auto grid place-items-center rounded-full shadow-neonPink', dimension, energyMode === 'boost' && 'energy-boost', energyMode === 'overdrive' && 'energy-overdrive', energyMode === 'critical' && 'energy-critical')}
      style={{ '--energy': Math.round((Number(score) || 0) * 3.6) + 'deg' }}
    >
      <div className="energy-orbit energy-orbit-a" />
      <div className="energy-orbit energy-orbit-b" />
      <div className="energy-burst-lines" />
      <div className="grid h-[72%] w-[72%] place-items-center rounded-full bg-black/70">
        <div className="text-center">
          <div className={cls('font-black leading-none', size === 'large' ? 'text-6xl' : 'text-4xl')}>{score}%</div>
          <div className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-softText">energía</div>
          {energyMode !== 'normal' && <div className="mt-2 text-[10px] font-black uppercase tracking-[0.24em] text-neonCyan">{energyMode === 'critical' ? 'explosión' : energyMode === 'overdrive' ? 'overdrive' : 'boost'}</div>}
        </div>
      </div>
    </div>
  );
}

function EnergyOverdriveOverlay({ score }) {
  const mode = getEnergyMode(score);
  if (mode === 'normal') return null;
  const isCritical = mode === 'critical';
  return (
    <div className={cls('pointer-events-none fixed inset-0 z-50 overflow-hidden', isCritical ? 'energy-overlay energy-overlay-critical' : 'energy-overlay energy-overlay-overdrive')}>
      <div className="energy-overlay-bg" />
      <div className="energy-lightning energy-lightning-a" />
      <div className="energy-lightning energy-lightning-b" />
      <div className="energy-lightning energy-lightning-c" />
      <div className="absolute inset-0 grid place-items-center p-8">
        <div className="energy-overdrive-panel text-center">
          <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-white/20 bg-black/35 px-5 py-2 text-sm font-black uppercase tracking-[0.28em] text-white">
            <Zap className="text-neonCyan" /> {isCritical ? 'POWER MAX' : 'POWER BOOST'}
          </div>
          <div className="text-7xl font-black leading-none text-white drop-shadow-[0_0_30px_rgba(255,255,255,.35)] md:text-9xl">{score}%</div>
          <div className="mt-3 text-xl font-black uppercase tracking-[0.32em] text-neonCyan md:text-3xl">{isCritical ? 'La pista explota' : 'Subiendo energía'}</div>
        </div>
      </div>
    </div>
  );
}

function QRCodeImage({ url, large = false, className = '' }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(url, {
      margin: 1,
      width: large ? 680 : 420,
      color: { dark: '#000000', light: '#ffffff' },
    }).then((nextSrc) => {
      if (active) setSrc(nextSrc);
    });
    return () => {
      active = false;
    };
  }, [url, large]);

  if (!src) return <div className={cls('aspect-square w-full animate-pulse rounded-2xl bg-white/10', className)} />;
  return <img src={src} alt="QR del evento" className={cls('w-full rounded-2xl', className)} />;
}

function QRPanel({ url, title = 'Escaneá y participá', large = false }) {
  return (
    <Panel className="glow-border text-center">
      {title && (
        <div className="mb-4 flex items-center justify-center gap-2 text-neonPink">
          <Sparkles size={20} />
          <h2 className={cls('font-black', large ? 'text-4xl' : 'text-2xl')}>{title}</h2>
          <Sparkles size={20} className="text-neonCyan" />
        </div>
      )}
      <div className="mx-auto w-full max-w-[310px] rounded-[30px] bg-white p-3 shadow-neonCyan">
        <QRCodeImage url={url} large={large} />
      </div>
      <p className="mt-4 break-all rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-softText">
        {url}
      </p>
    </Panel>
  );
}

function EventBlocked({ state }) {
  if (!state?.event?.closed && !state?.event?.paused && state?.event?.active) return null;
  const message = state?.event?.closed
    ? 'El evento está cerrado.'
    : state?.event?.paused
      ? 'La interacción está pausada por el DJ.'
      : 'El evento todavía no está activo.';
  return (
    <div className="mb-4 rounded-3xl border border-yellow-300/40 bg-yellow-300/10 p-4 text-sm font-bold text-yellow-100">
      {message}
    </div>
  );
}

function HomeScreen({ state, setTab }) {
  const qrUrl = state.event.publicUrl || `${window.location.origin}/e/${state.event.id}`;
  return (
    <div className="space-y-4">
      <QRPanel url={qrUrl} />
      <InstallAppButton type="public" />
      <Panel>
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-3xl border border-neonPink/50 bg-neonPink/15 text-3xl shadow-neonPink">
            🎧
          </div>
          <div>
            <p className="text-sm font-bold text-neonGreen">Evento activo</p>
            <h1 className="text-2xl font-black">{state.event.djName}</h1>
            <p className="text-sm text-softText">
              {[state.event.style, state.event.bpm && `${state.event.bpm} BPM`].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <StatMini label="conectados" value={state.event.connected} />
          <StatMini label="pedidos" value={state.songRequests.length} />
          <StatMini label="energía" value={`${state.energy.score}%`} />
        </div>
      </Panel>
      <TxHouseBanner />
      <div className="grid gap-3">
        <ActionRow icon={Music2} label="Pedir canción" onClick={() => setTab('songs')} />
        <ActionRow icon={Vote} label="Votar ambiente" onClick={() => setTab('mood')} color="violet" />
        <ActionRow icon={Heart} label="Mandar dedicatoria" onClick={() => setTab('dedications')} />
        <ActionRow icon={Zap} label="Subir energía" onClick={() => setTab('energy')} color="cyan" />
      </div>
    </div>
  );
}

function ActionRow({ icon: Icon, label, onClick, color = 'pink' }) {
  const glow = color === 'cyan' ? 'shadow-neonCyan border-neonCyan/40' : color === 'violet' ? 'shadow-neonViolet border-neonViolet/40' : 'shadow-neonPink border-neonPink/40';
  return (
    <button
      type="button"
      onClick={onClick}
      className={cls(
        'flex items-center justify-between rounded-3xl border bg-white/[.06] p-4 text-left font-black transition active:scale-[.98]',
        glow,
      )}
    >
      <span className="flex items-center gap-4 text-xl">
        <Icon className="text-neonPink" size={30} />
        {label}
      </span>
      <span className="text-3xl text-softText">›</span>
    </button>
  );
}

function StatMini({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
      <div className="text-xl font-black text-white">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-softText">{label}</div>
    </div>
  );
}

function SongsScreen({ state, me, action, notify }) {
  const [form, setForm] = useState({ name: '', song: '', artist: '', message: '' });
  const pending = state.songRequests.filter((item) => item.status === 'pending');
  const voted = new Set(me.votedRequestIds || []);

  async function submit(event) {
    event.preventDefault();
    const response = await action('song:create', form);
    if (response?.ok) {
      setForm({ name: '', song: '', artist: '', message: '' });
      notify('Pedido enviado para aprobación del DJ.');
    }
  }

  async function vote(id) {
    const response = await action('song:vote', { id });
    if (response?.ok) notify('Voto sumado al pedido.');
  }

  return (
    <div className="space-y-4">
      <EventBlocked state={state} />
      <Panel className="glow-border">
        <div className="mb-4 text-center">
          <Music2 className="mx-auto mb-2 text-neonPink" size={34} />
          <h2 className="text-2xl font-black">Pedir canción</h2>
          <p className="text-sm text-softText">Tu pedido llega en vivo a la cabina.</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field icon={Users} placeholder="Tu nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={40} />
          <Field icon={Music2} placeholder="Canción" value={form.song} onChange={(e) => setForm({ ...form, song: e.target.value })} maxLength={80} />
          <Field icon={Star} placeholder="Artista" value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} maxLength={80} />
          <Field icon={MessageCircle} placeholder="Mensaje opcional" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={120} />
          <Button type="submit" className="w-full">
            <span className="flex items-center justify-center gap-2">
              <Send size={20} /> Enviar pedido
            </span>
          </Button>
        </form>
      </Panel>

      <Panel>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xl font-black">Más pedidas</h3>
          <span className="rounded-full bg-neonPink/15 px-3 py-1 text-xs font-black text-neonPink">{pending.length}</span>
        </div>
        {pending.length === 0 ? (
          <EmptyState icon={Music2} title="Todavía no hay pedidos" text="Cuando el DJ apruebe pedidos, aparecen acá en tiempo real." />
        ) : (
          <div className="space-y-3">
            {pending.map((request, index) => (
              <div key={request.id} className="rounded-2xl border border-neonPink/25 bg-black/30 p-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-neonPink/15 text-lg font-black">{index + 1}</div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-black">{request.song}</h4>
                    <p className="truncate text-sm text-softText">{request.artist || 'Artista no indicado'} · pidió {request.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => vote(request.id)}
                    disabled={voted.has(request.id)}
                    className="rounded-2xl border border-neonPink/40 bg-neonPink/15 px-3 py-2 text-sm font-black text-neonPink disabled:opacity-50"
                  >
                    ♥ {request.votes}
                  </button>
                </div>
                {request.message && <p className="mt-2 rounded-xl bg-white/[.04] p-2 text-sm text-softText">{request.message}</p>}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function MoodScreen({ state, me, action, notify }) {
  async function vote(optionId) {
    const response = await action('mood:vote', { optionId });
    if (response?.ok) notify('Tu voto cambió la pista.');
  }

  return (
    <div className="space-y-4">
      <EventBlocked state={state} />
      <Panel className="text-center">
        <Sparkles className="mx-auto mb-2 text-neonPink" size={34} />
        <h2 className="text-2xl font-black">Votá el ambiente</h2>
        <p className="text-sm text-softText">Elegí qué querés escuchar. Se actualiza en vivo.</p>
      </Panel>

      <div className="grid grid-cols-2 gap-3">
        {state.mood.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => vote(option.id)}
            className={cls(
              'min-h-28 rounded-3xl border bg-white/[.06] p-4 text-left transition active:scale-[.98]',
              me.moodVote === option.id ? 'border-neonCyan shadow-neonCyan' : 'border-white/10',
            )}
          >
            <div className="text-3xl">{option.icon}</div>
            <div className="mt-2 text-lg font-black leading-tight">{option.label}</div>
          </button>
        ))}
      </div>

      <Panel>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xl font-black">Resultados en vivo</h3>
          <span className="rounded-full bg-neonGreen/15 px-3 py-1 text-xs font-black text-neonGreen">EN VIVO</span>
        </div>
        <div className="space-y-3">
          {state.mood.options.map((option) => (
            <div key={option.id}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-bold">{option.icon} {option.label}</span>
                <span className="font-black text-neonCyan">{option.percent}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-neonPink via-neonViolet to-neonCyan" style={{ width: `${option.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function DedicationsScreen({ state, action, notify }) {
  const [form, setForm] = useState({ name: '', message: '' });

  async function submit(event) {
    event.preventDefault();
    const response = await action('dedication:create', form);
    if (response?.ok) {
      setForm({ name: '', message: '' });
      notify('Dedicatoria enviada para aprobación.');
    }
  }

  return (
    <div className="space-y-4">
      <EventBlocked state={state} />
      <Panel className="glow-border">
        <div className="mb-4 text-center">
          <Heart className="mx-auto mb-2 text-neonPink" size={34} />
          <h2 className="text-2xl font-black">Enviá tu dedicatoria</h2>
          <p className="text-sm text-softText">El DJ aprueba qué mensajes aparecen en pantalla.</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field icon={Users} placeholder="Tu nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={40} />
          <TextArea placeholder="Escribí tu mensaje..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={160} />
          <div className="text-right text-xs text-softText">{form.message.length}/160</div>
          <Button type="submit" className="w-full">
            <span className="flex items-center justify-center gap-2">
              <Send size={20} /> Enviar dedicatoria
            </span>
          </Button>
        </form>
      </Panel>

      <Panel>
        <h3 className="mb-3 text-xl font-black">Dedicatorias en pantalla</h3>
        {state.dedications.approved.length === 0 ? (
          <EmptyState icon={Heart} title="Aún no hay dedicatorias aprobadas" text="Las aprobadas por cabina se muestran acá y en la pantalla show." />
        ) : (
          <div className="space-y-3">
            {state.dedications.approved.slice(0, 8).map((dedication) => (
              <div key={dedication.id} className="rounded-2xl border border-neonPink/30 bg-neonPink/10 p-4">
                <p className="text-lg font-black">{dedication.message}</p>
                <p className="mt-1 text-sm text-softText">De: {dedication.name}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function EnergyScreen({ state, me, action, notify }) {
  async function addEnergy() {
    const response = await action('energy:add');
    if (response?.ok) notify('Energía sumada a la pista.');
  }

  async function battleVote(choice) {
    const response = await action('battle:vote', { choice });
    if (response?.ok) notify('Voto registrado en la batalla.');
  }

  async function triviaVote(choice) {
    const response = await action('trivia:vote', { choice });
    if (response?.ok) notify('Respuesta enviada.');
  }

  return (
    <div className="space-y-4">
      <EventBlocked state={state} />
      <Panel className="glow-border text-center">
        <h2 className="mb-4 text-2xl font-black">Energía de la pista</h2>
        <EnergyRing score={state.energy.score} />
        <Button onClick={addEnergy} className="mt-5 w-full text-xl">
          <span className="flex items-center justify-center gap-2">
            <Zap size={26} /> Subir energía
          </span>
        </Button>
        <p className="mt-3 text-sm text-softText">{state.energy.contributors} personas sumaron energía</p>
      </Panel>

      <BattlePublic battle={state.battle} vote={battleVote} myVote={me.battleVote} />

      <TriviaPublic trivia={state.trivia} vote={triviaVote} myVote={me.triviaVote} />
    </div>
  );
}

function BattlePublic({ battle, vote, myVote }) {
  if (!battle.active) {
    return <EmptyState icon={Swords} title="No hay batalla activa" text="Cuando el DJ cree una batalla, vas a poder votar acá." />;
  }

  return (
    <Panel>
      <div className="mb-3 text-center">
        <Swords className="mx-auto text-neonPink" size={28} />
        <h3 className="text-xl font-black">{battle.title}</h3>
        <p className="text-sm text-softText">Vos elegís cuál suena</p>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-3">
        <BattleOption side="a" data={battle.optionA} percent={battle.percentA} votes={battle.votesA} active={myVote === 'a'} onClick={() => vote('a')} />
        <div className="grid place-items-center text-2xl font-black text-neonPink">VS</div>
        <BattleOption side="b" data={battle.optionB} percent={battle.percentB} votes={battle.votesB} active={myVote === 'b'} onClick={() => vote('b')} />
      </div>
    </Panel>
  );
}

function BattleOption({ data, percent, votes, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cls('rounded-2xl border bg-black/30 p-3 text-left transition active:scale-[.98]', active ? 'border-neonCyan shadow-neonCyan' : 'border-white/10')}
    >
      <div className="mb-8 grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/10">
        <PlayCircle />
      </div>
      <h4 className="truncate font-black">{data.name}</h4>
      <p className="truncate text-xs text-softText">{data.artist || 'Artista'}</p>
      <div className="mt-3 text-2xl font-black">{percent}%</div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-neonPink to-neonCyan" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 text-xs text-softText">{votes} votos</p>
    </button>
  );
}

function TriviaPublic({ trivia, vote, myVote }) {
  if (!trivia.active) {
    return <EmptyState icon={Gamepad2} title="No hay trivia activa" text="Cuando el DJ lance una trivia, aparece en esta sección." />;
  }

  return (
    <Panel>
      <div className="mb-4 text-center">
        <Gamepad2 className="mx-auto text-neonCyan" size={30} />
        <h3 className="text-xl font-black">Trivia en vivo</h3>
        <p className="text-sm text-softText">{trivia.question}</p>
      </div>
      <div className="grid gap-2">
        {trivia.options.map((option, index) => (
          <button
            key={`${option}-${index}`}
            type="button"
            onClick={() => vote(index)}
            className={cls(
              'rounded-2xl border bg-white/[.055] p-3 text-left font-bold transition active:scale-[.98]',
              Number(myVote) === index ? 'border-neonCyan shadow-neonCyan' : 'border-white/10',
            )}
          >
            <div className="flex justify-between gap-3">
              <span>{option}</span>
              <span className="text-neonPink">{trivia.percents[index]}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-neonViolet to-neonCyan" style={{ width: `${trivia.percents[index]}%` }} />
            </div>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function MoreMenu({ open, onClose, eventId }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-xl">
      <div className="mx-auto min-h-screen max-w-[480px] p-4 pt-[calc(env(safe-area-inset-top)+20px)]">
        <div className="mb-4 flex items-center justify-between">
          <Brand compact />
          <button type="button" onClick={onClose} className="rounded-2xl border border-white/10 bg-white/[.06] p-2">
            <X />
          </button>
        </div>
        <div className="space-y-3">
          <a href={`/cabina/${eventId || ""}`} className="flex items-center gap-4 rounded-3xl border border-neonPink/30 bg-neonPink/10 p-4 font-black">
            <ShieldCheck className="text-neonPink" /> Cabina DJ
          </a>
          <a href={`/show/${eventId || ""}`} className="flex items-center gap-4 rounded-3xl border border-neonCyan/30 bg-neonCyan/10 p-4 font-black">
            <MonitorPlay className="text-neonCyan" /> Pantalla Show
          </a>
          <TxHouseBanner compact />
        </div>
      </div>
    </div>
  );
}

function PublicApp({ pista }) {
  const { state, me, connected, action, notify, toast } = pista;
  const [tab, setTab] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);

  const tabs = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'songs', label: 'Pedir', icon: Music2 },
    { id: 'mood', label: 'Votar', icon: Vote },
    { id: 'dedications', label: 'Mensajes', icon: Heart },
    { id: 'energy', label: 'Energía', icon: Zap },
  ];

  return (
    <div className="app-shell">
      <div className="app-frame">
        <AppHeader state={state} connected={connected} onOpenMenu={() => setMenuOpen(true)} />
        <main className="px-4 pb-28 pt-4">
          {tab === 'home' && <HomeScreen state={state} setTab={setTab} />}
          {tab === 'songs' && <SongsScreen state={state} me={me} action={action} notify={notify} />}
          {tab === 'mood' && <MoodScreen state={state} me={me} action={action} notify={notify} />}
          {tab === 'dedications' && <DedicationsScreen state={state} action={action} notify={notify} />}
          {tab === 'energy' && <EnergyScreen state={state} me={me} action={action} notify={notify} />}
        </main>
        <nav className="bottom-nav">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cls('nav-item', tab === item.id && 'nav-item-active')}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      <MoreMenu open={menuOpen} onClose={() => setMenuOpen(false)} eventId={state.event.id} />
      <Toast toast={toast} />
    </div>
  );
}

function AdminLogin({ apiOrigin, eventId, onLogin }) {
  const sessionKey = `pista_admin_pin_${eventId}`;
  const [pin, setPin] = useState(sessionStorage.getItem(sessionKey) || '');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    const response = await fetch(`${apiOrigin}/api/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, eventId }),
    });
    const data = await response.json();
    if (!data.ok) {
      setError(data.message || 'PIN incorrecto.');
      return;
    }
    sessionStorage.setItem(sessionKey, pin);
    onLogin(pin);
  }

  return (
    <div className="app-shell">
      <div className="app-frame px-4 py-[calc(env(safe-area-inset-top)+24px)]">
        <Brand />
        <InstallAppButton type="dj" className="mt-5" />
        <Panel className="glow-border mt-5">
          <Lock className="mb-3 text-neonPink" size={38} />
          <h1 className="text-3xl font-black">Cabina DJ</h1>
          <p className="mt-2 text-softText">Ingresá el PIN para controlar el evento en vivo.</p>
          <form onSubmit={submit} className="mt-5 space-y-3">
            <Field icon={Lock} type="password" placeholder="PIN de cabina" value={pin} onChange={(e) => setPin(e.target.value)} />
            {error && <p className="rounded-2xl border border-red-400/40 bg-red-400/10 p-3 text-sm font-bold text-red-100">{error}</p>}
            <Button type="submit" className="w-full">Entrar a cabina</Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}

function AdminApp({ pista }) {
  const { state, connected, action, notify, toast, apiOrigin, eventId } = pista;
  const sessionKey = `pista_admin_pin_${eventId}`;
  const [pin, setPin] = useState(sessionStorage.getItem(sessionKey) || '');
  const [section, setSection] = useState('control');

  if (!pin) return <AdminLogin apiOrigin={apiOrigin} eventId={eventId} onLogin={setPin} />;

  const sections = [
    { id: 'control', label: 'Control', icon: Settings },
    { id: 'requests', label: 'Pedidos', icon: Music2 },
    { id: 'messages', label: 'Mensajes', icon: Heart },
    { id: 'games', label: 'Juegos', icon: Gamepad2 },
    { id: 'screen', label: 'Show', icon: MonitorPlay },
  ];

  function logout() {
    sessionStorage.removeItem(sessionKey);
    setPin('');
  }

  return (
    <div className="app-shell">
      <div className="app-frame">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+14px)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <Brand compact />
            <button type="button" onClick={logout} className="rounded-2xl border border-white/10 bg-white/[.06] p-2">
              <X size={20} />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <StatusPill state={state} connected={connected} />
            <a href={`/show/${state.event.id || ""}`} className="rounded-full border border-neonCyan/30 bg-neonCyan/10 px-3 py-1 text-xs font-black text-neonCyan">Abrir show</a>
          </div>
        </header>

        <main className="px-4 pb-28 pt-4">
          {section === 'control' && <AdminControl state={state} action={action} notify={notify} pin={pin} apiOrigin={apiOrigin} />}
          {section === 'requests' && <AdminRequests state={state} action={action} notify={notify} pin={pin} />}
          {section === 'messages' && <AdminMessages state={state} action={action} notify={notify} pin={pin} />}
          {section === 'games' && <AdminGames state={state} action={action} notify={notify} pin={pin} />}
          {section === 'screen' && <AdminScreen state={state} action={action} notify={notify} pin={pin} />}
        </main>

        <nav className="bottom-nav">
          {sections.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={cls('nav-item', section === item.id && 'nav-item-active')}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      <Toast toast={toast} />
    </div>
  );
}

function AdminControl({ state, action, notify, pin, apiOrigin }) {
  const [form, setForm] = useState({
    title: state.event.title,
    djName: state.event.djName,
    style: state.event.style,
    bpm: state.event.bpm,
    publicUrl: state.event.publicUrl || `${window.location.origin}/e/${state.event.id}`,
  });

  useEffect(() => {
    setForm({
      title: state.event.title,
      djName: state.event.djName,
      style: state.event.style,
      bpm: state.event.bpm,
      publicUrl: state.event.publicUrl || `${window.location.origin}/e/${state.event.id}`,
    });
  }, [state.event.title, state.event.djName, state.event.style, state.event.bpm, state.event.publicUrl]);

  async function save() {
    const response = await action('event:update', { ...form, pin });
    if (response?.ok) notify('Evento actualizado.');
  }

  async function setStatus(status) {
    const response = await action('event:set-status', { status, pin });
    if (response?.ok) notify('Estado actualizado.');
  }

  async function resetAll() {
    const accepted = window.confirm('Esto borra pedidos, votos, energía y dedicatorias. ¿Continuar?');
    if (!accepted) return;
    const response = await action('event:reset', { pin });
    if (response?.ok) notify('Datos del evento reiniciados.');
  }

  const exportUrl = `${apiOrigin}/api/admin/export?eventId=${encodeURIComponent(state.event.id)}&pin=${encodeURIComponent(pin)}`;

  return (
    <div className="space-y-4">
      <InstallAppButton type="dj" compact />
      <Panel className="glow-border">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-3xl border border-neonPink/40 bg-neonPink/15">
            <Crown className="text-neonPink" size={34} />
          </div>
          <div>
            <p className="text-sm font-bold text-neonGreen">Centro de control</p>
            <h1 className="text-2xl font-black">{state.event.djName}</h1>
            <p className="text-sm text-softText">{state.event.connected} conectados</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <ControlStat icon={Music2} value={state.songRequests.filter((r) => r.status === 'pending').length} label="Pedidos" />
          <ControlStat icon={Vote} value={state.mood.totalVotes} label="Votos" />
          <ControlStat icon={Heart} value={state.dedications.pending.length} label="Por aprobar" />
          <ControlStat icon={Zap} value={`${state.energy.score}%`} label="Energía" />
        </div>
      </Panel>

      <Panel>
        <h2 className="mb-3 text-xl font-black">Datos del evento</h2>
        <div className="space-y-3">
          <Field label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Field label="Nombre del DJ" value={form.djName} onChange={(e) => setForm({ ...form, djName: e.target.value })} />
          <Field label="Estilo" value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })} />
          <Field label="BPM" value={form.bpm} onChange={(e) => setForm({ ...form, bpm: e.target.value })} />
          <Field label="URL pública para QR" value={form.publicUrl} onChange={(e) => setForm({ ...form, publicUrl: e.target.value })} />
          <Button onClick={save} className="w-full">Guardar datos</Button>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={() => setStatus('active')}>
          <PlayCircle className="mx-auto mb-1" /> Activar
        </Button>
        <Button variant="secondary" onClick={() => setStatus('paused')}>
          <PauseCircle className="mx-auto mb-1" /> Pausar
        </Button>
      </div>
      <Button variant="danger" onClick={() => setStatus('closed')} className="w-full">
        <span className="flex items-center justify-center gap-2">
          <Power /> Cerrar evento
        </span>
      </Button>

      <TxHouseBanner compact />

      <Panel>
        <h2 className="mb-3 text-xl font-black">Datos</h2>
        <div className="grid gap-3">
          <a href={exportUrl} className="soft-button text-center">Exportar JSON del evento</a>
          <Button variant="danger" onClick={resetAll}>
            <span className="flex items-center justify-center gap-2">
              <RefreshCcw size={18} /> Reiniciar interacción
            </span>
          </Button>
        </div>
      </Panel>
    </div>
  );
}

function ControlStat({ icon: Icon, value, label }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[.06] p-4">
      <Icon className="mb-2 text-neonPink" size={28} />
      <div className="text-3xl font-black">{value}</div>
      <div className="text-sm text-softText">{label}</div>
    </div>
  );
}

function AdminRequests({ state, action, notify, pin }) {
  async function setStatus(id, status) {
    const response = await action('song:status', { id, status, pin });
    if (response?.ok) notify('Pedido actualizado.');
  }

  async function remove(id) {
    const response = await action('song:delete', { id, pin });
    if (response?.ok) notify('Pedido eliminado.');
  }

  const pending = state.songRequests.filter((request) => ['waiting', 'pending'].includes(request.status));

  return (
    <div className="space-y-4">
      <Panel>
        <h1 className="text-2xl font-black">Pedidos de canciones</h1>
        <p className="text-sm text-softText">Los más votados aparecen arriba.</p>
      </Panel>
      {pending.length === 0 ? (
        <EmptyState icon={Music2} title="Sin pedidos pendientes" text="Los pedidos del público entran acá en vivo." />
      ) : (
        <div className="space-y-3">
          {pending.map((request) => (
            <Panel key={request.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-black">{request.song}</h3>
                  <p className="truncate text-softText">{request.artist || 'Artista no indicado'}</p>
                  <p className="mt-1 text-sm text-softText">Pidió {request.name} · {request.votes} votos</p>
                  <p className={cls('mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em]', request.status === 'waiting' ? 'border border-yellow-300/35 bg-yellow-300/10 text-yellow-100' : 'border border-neonGreen/35 bg-neonGreen/10 text-neonGreen')}>
                    {request.status === 'waiting' ? 'Por aprobar' : 'Aprobado visible'}
                  </p>
                  {request.message && <p className="mt-2 rounded-2xl bg-white/[.04] p-3 text-sm">{request.message}</p>}
                </div>
                <div className="rounded-2xl border border-neonPink/30 bg-neonPink/10 px-3 py-2 font-black text-neonPink">♥ {request.votes}</div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {request.status === 'waiting' ? (
                  <Button variant="secondary" onClick={() => setStatus(request.id, 'pending')}>Aprobar</Button>
                ) : (
                  <Button variant="secondary" onClick={() => setStatus(request.id, 'played')}>Sonó</Button>
                )}
                <Button variant="secondary" onClick={() => setStatus(request.id, 'rejected')}>Rechazar</Button>
                <Button variant="danger" onClick={() => remove(request.id)}>
                  <Trash2 className="mx-auto" size={18} />
                </Button>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminMessages({ state, action, notify, pin }) {
  async function moderate(id, status) {
    const response = await action('dedication:moderate', { id, status, pin });
    if (response?.ok) notify(status === 'approved' ? 'Dedicatoria aprobada.' : 'Dedicatoria rechazada.');
  }

  async function remove(id) {
    const response = await action('dedication:delete', { id, pin });
    if (response?.ok) notify('Dedicatoria eliminada.');
  }

  return (
    <div className="space-y-4">
      <Panel>
        <h1 className="text-2xl font-black">Moderación</h1>
        <p className="text-sm text-softText">Aprobá solo lo que querés mostrar en pantalla.</p>
      </Panel>

      <Panel>
        <h2 className="mb-3 text-xl font-black">Pendientes</h2>
        {state.dedications.pending.length === 0 ? (
          <EmptyState icon={Heart} title="Sin mensajes pendientes" text="Las dedicatorias nuevas llegan acá." />
        ) : (
          <div className="space-y-3">
            {state.dedications.pending.map((dedication) => (
              <div key={dedication.id} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <p className="font-black">{dedication.message}</p>
                <p className="text-sm text-softText">De: {dedication.name}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button variant="secondary" onClick={() => moderate(dedication.id, 'approved')}>Aprobar</Button>
                  <Button variant="danger" onClick={() => moderate(dedication.id, 'rejected')}>Rechazar</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel>
        <h2 className="mb-3 text-xl font-black">Aprobadas</h2>
        {state.dedications.approved.length === 0 ? (
          <EmptyState icon={Heart} title="Sin aprobadas" text="Cuando apruebes una dedicatoria se verá acá." />
        ) : (
          <div className="space-y-3">
            {state.dedications.approved.map((dedication) => (
              <div key={dedication.id} className="rounded-2xl border border-neonPink/25 bg-neonPink/10 p-3">
                <p className="font-black">{dedication.message}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-sm text-softText">De: {dedication.name}</p>
                  <button type="button" onClick={() => remove(dedication.id)} className="rounded-xl bg-red-500/15 p-2 text-red-200">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function AdminGames({ state, action, notify, pin }) {
  const [battle, setBattle] = useState({ title: 'Batalla de canciones', nameA: '', artistA: '', nameB: '', artistB: '', durationMinutes: 5 });
  const [trivia, setTrivia] = useState({ question: '', a: '', b: '', c: '', d: '', correctIndex: 0 });

  async function createBattle(event) {
    event.preventDefault();
    const response = await action('battle:create', { ...battle, pin });
    if (response?.ok) {
      notify('Batalla publicada.');
      setBattle({ title: 'Batalla de canciones', nameA: '', artistA: '', nameB: '', artistB: '', durationMinutes: 5 });
    }
  }

  async function closeBattle() {
    const response = await action('battle:close', { pin });
    if (response?.ok) notify('Batalla cerrada.');
  }

  async function createTrivia(event) {
    event.preventDefault();
    const response = await action('trivia:create', { ...trivia, pin });
    if (response?.ok) {
      notify('Trivia publicada.');
      setTrivia({ question: '', a: '', b: '', c: '', d: '', correctIndex: 0 });
    }
  }

  async function closeTrivia() {
    const response = await action('trivia:close', { pin });
    if (response?.ok) notify('Trivia cerrada.');
  }

  async function resetEnergy() {
    const response = await action('energy:reset', { pin });
    if (response?.ok) notify('Energía reiniciada.');
  }

  async function resetMood() {
    const response = await action('mood:reset', { pin });
    if (response?.ok) notify('Votación reiniciada.');
  }

  return (
    <div className="space-y-4">
      <Panel>
        <h1 className="text-2xl font-black">Juegos + energía</h1>
        <p className="text-sm text-softText">Creá dinámicas reales para que el público interactúe.</p>
      </Panel>

      <Panel>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black">Energía</h2>
          <span className="text-2xl font-black text-neonCyan">{state.energy.score}%</span>
        </div>
        <EnergyRing score={state.energy.score} />
        <Button variant="secondary" onClick={resetEnergy} className="mt-4 w-full">Reiniciar energía</Button>
      </Panel>

      <Panel>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black">Ambiente</h2>
          <span className="text-sm font-black text-neonGreen">{state.mood.totalVotes} votos</span>
        </div>
        <div className="space-y-2">
          {state.mood.options.map((option) => (
            <div key={option.id}>
              <div className="flex justify-between text-sm">
                <span>{option.icon} {option.label}</span>
                <span>{option.percent}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-neonPink to-neonCyan" style={{ width: `${option.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
        <Button variant="secondary" onClick={resetMood} className="mt-4 w-full">Reiniciar votos de ambiente</Button>
      </Panel>

      <Panel>
        <h2 className="mb-3 text-xl font-black">Crear batalla</h2>
        <form onSubmit={createBattle} className="space-y-3">
          <Field label="Título" value={battle.title} onChange={(e) => setBattle({ ...battle, title: e.target.value })} />
          <Field label="Canción A" value={battle.nameA} onChange={(e) => setBattle({ ...battle, nameA: e.target.value })} />
          <Field label="Artista A" value={battle.artistA} onChange={(e) => setBattle({ ...battle, artistA: e.target.value })} />
          <Field label="Canción B" value={battle.nameB} onChange={(e) => setBattle({ ...battle, nameB: e.target.value })} />
          <Field label="Artista B" value={battle.artistB} onChange={(e) => setBattle({ ...battle, artistB: e.target.value })} />
          <Field label="Duración en minutos" type="number" min="1" max="180" value={battle.durationMinutes} onChange={(e) => setBattle({ ...battle, durationMinutes: e.target.value })} />
          <Button type="submit" className="w-full">Publicar batalla</Button>
          {state.battle.active && <Button variant="danger" onClick={closeBattle} className="w-full">Cerrar batalla activa</Button>}
        </form>
      </Panel>

      <Panel>
        <h2 className="mb-3 text-xl font-black">Crear trivia</h2>
        <form onSubmit={createTrivia} className="space-y-3">
          <Field label="Pregunta" value={trivia.question} onChange={(e) => setTrivia({ ...trivia, question: e.target.value })} />
          <Field label="Opción A" value={trivia.a} onChange={(e) => setTrivia({ ...trivia, a: e.target.value })} />
          <Field label="Opción B" value={trivia.b} onChange={(e) => setTrivia({ ...trivia, b: e.target.value })} />
          <Field label="Opción C" value={trivia.c} onChange={(e) => setTrivia({ ...trivia, c: e.target.value })} />
          <Field label="Opción D" value={trivia.d} onChange={(e) => setTrivia({ ...trivia, d: e.target.value })} />
          <label className="block space-y-2">
            <span className="text-sm font-bold text-white/90">Respuesta correcta</span>
            <select className="field" value={trivia.correctIndex} onChange={(e) => setTrivia({ ...trivia, correctIndex: Number(e.target.value) })}>
              <option value={0}>Opción A</option>
              <option value={1}>Opción B</option>
              <option value={2}>Opción C</option>
              <option value={3}>Opción D</option>
            </select>
          </label>
          <Button type="submit" className="w-full">Publicar trivia</Button>
          {state.trivia.active && <Button variant="danger" onClick={closeTrivia} className="w-full">Cerrar trivia activa</Button>}
        </form>
      </Panel>
    </div>
  );
}


const SCREEN_BANNER_EFFECTS = [
  { id: 'spark', icon: '✨', label: 'Brillo' },
  { id: 'heart', icon: '💗', label: 'Corazones' },
  { id: 'bolt', icon: '⚡', label: 'Rayos' },
  { id: 'pixel', icon: '🕹️', label: 'Game' },
  { id: 'confetti', icon: '🎉', label: 'Fiesta' },
];

const SCREEN_BANNER_BACKGROUNDS = [
  { id: 'neon', icon: '🌌', label: 'Neón' },
  { id: 'pink', icon: '💜', label: 'Fucsia' },
  { id: 'cyan', icon: '🔷', label: 'Cyan' },
  { id: 'gold', icon: '🏆', label: 'Dorado' },
  { id: 'game', icon: '🎮', label: 'Arcade' },
];

const SCREEN_BANNER_MOTIONS = [
  { id: 'pop', icon: '💥', label: 'Explota' },
  { id: 'marquee', icon: '⬅️', label: 'Corre a la izquierda' },
  { id: 'rise', icon: '⬆️', label: 'Sube en bloque' },
  { id: 'blast', icon: '⚡', label: 'Impacto rápido' },
];

const SCREEN_BANNER_DURATIONS = [
  { value: 0, icon: '∞', label: 'Queda visible' },
  { value: 10, icon: '10', label: 'Desaparece en 10 segundos' },
  { value: 20, icon: '20', label: 'Desaparece en 20 segundos' },
];

function getBannerFromState(state) {
  return {
    text: state?.screen?.banner?.text || '',
    effect: state?.screen?.banner?.effect || 'spark',
    background: state?.screen?.banner?.background || 'neon',
    motion: state?.screen?.banner?.motion || 'pop',
    durationSeconds: Number(state?.screen?.banner?.durationSeconds || 0),
    visible: Boolean(state?.screen?.banner?.visible),
  };
}

function SymbolChoiceGroup({ title, items, value, onChange }) {
  return (
    <div>
      <div className="mb-2 text-sm font-black uppercase tracking-[0.16em] text-softText">{title}</div>
      <div className="grid grid-cols-5 gap-2">
        {items.map((item) => (
          <button
            key={item.id ?? item.value}
            type="button"
            onClick={() => onChange(item.id ?? item.value)}
            title={item.label}
            aria-label={item.label}
            className={cls(
              'grid aspect-square place-items-center rounded-2xl border bg-white/[.055] text-2xl transition active:scale-[.96]',
              value === (item.id ?? item.value) ? 'border-neonCyan bg-neonCyan/10 shadow-neonCyan' : 'border-white/10',
            )}
          >
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

function AdminShowBannerPanel({ state, action, notify, pin }) {
  const [form, setForm] = useState(getBannerFromState(state));

  useEffect(() => {
    setForm(getBannerFromState(state));
  }, [state.updatedAt]);

  async function publish() {
    const response = await action('screen:banner', { ...form, visible: true, pin });
    if (response?.ok) notify('Cartel publicado en pantalla.');
  }

  async function hide() {
    const response = await action('screen:banner', { ...form, visible: false, pin });
    if (response?.ok) notify('Cartel oculto.');
  }

  return (
    <Panel className="glow-border">
      <div className="mb-4 flex items-start gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-3xl border border-neonCyan/40 bg-neonCyan/10 text-neonCyan shadow-neonCyan">
          <Sparkles size={30} />
        </div>
        <div>
          <h2 className="text-xl font-black">Cartel superior</h2>
          <p className="mt-1 text-sm text-softText">
            Mensaje editable para mostrar arriba del dashboard. Ideal para saludos, momentos especiales o avisos del DJ.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <TextArea
          label="Mensaje del cartel"
          placeholder="Feliz cumple Flor! 🎂"
          maxLength={180}
          value={form.text}
          onChange={(event) => setForm({ ...form, text: event.target.value })}
        />
        <div className="flex items-center justify-between text-xs text-softText">
          <span>Tamaño ideal: una frase corta. Si es largo, usá movimiento ⬅️.</span>
          <span>{form.text.length}/180</span>
        </div>

        <SymbolChoiceGroup
          title="Efecto"
          items={SCREEN_BANNER_EFFECTS}
          value={form.effect}
          onChange={(effect) => setForm({ ...form, effect })}
        />

        <SymbolChoiceGroup
          title="Fondo"
          items={SCREEN_BANNER_BACKGROUNDS}
          value={form.background}
          onChange={(background) => setForm({ ...form, background })}
        />

        <SymbolChoiceGroup
          title="Entrada"
          items={SCREEN_BANNER_MOTIONS}
          value={form.motion}
          onChange={(motion) => setForm({ ...form, motion })}
        />

        <div>
          <div className="mb-2 text-sm font-black uppercase tracking-[0.16em] text-softText">Tiempo</div>
          <div className="grid grid-cols-3 gap-2">
            {SCREEN_BANNER_DURATIONS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setForm({ ...form, durationSeconds: item.value })}
                title={item.label}
                aria-label={item.label}
                className={cls(
                  'rounded-2xl border bg-white/[.055] px-3 py-3 text-lg font-black transition active:scale-[.96]',
                  Number(form.durationSeconds) === item.value ? 'border-neonPink bg-neonPink/10 text-neonPink shadow-neonPink' : 'border-white/10 text-white',
                )}
              >
                {item.icon}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
          <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-neonCyan">Vista previa</div>
          <ScreenBannerPreview banner={form} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button onClick={publish} disabled={!form.text.trim()}>
            <span className="flex items-center justify-center gap-2">
              <Sparkles size={18} /> Mostrar
            </span>
          </Button>
          <Button variant="secondary" onClick={hide}>
            Ocultar
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function ScreenBannerPreview({ banner }) {
  return (
    <div className={cls('screen-live-banner screen-live-banner-preview', `screen-banner-bg-${banner.background}`, `screen-banner-effect-${banner.effect}`, `screen-banner-motion-${banner.motion}`)}>
      <div className="screen-banner-fx" />
      <div className="screen-banner-content">
        <span className="screen-banner-text">{banner.text || 'Feliz cumple Flor! 🎂'}</span>
      </div>
    </div>
  );
}

function ScreenAnnouncementBanner({ state }) {
  const banner = state?.screen?.banner || {};
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 400);
    return () => window.clearInterval(timer);
  }, []);

  const duration = Number(banner.durationSeconds || 0);
  const startedAt = banner.lastShownAt ? Date.parse(banner.lastShownAt) : nowMs;
  const elapsed = Number.isFinite(startedAt) ? nowMs - startedAt : 0;
  const isTimedOut = duration > 0 && elapsed > duration * 1000;
  const active = Boolean(banner.visible && banner.text && !isTimedOut);
  const progress = duration > 0 ? Math.max(0, 100 - (elapsed / (duration * 1000)) * 100) : 100;

  if (!active) return null;

  return (
    <div className="screen-banner-layer">
      <div className={cls('screen-live-banner', `screen-banner-bg-${banner.background || 'neon'}`, `screen-banner-effect-${banner.effect || 'spark'}`, `screen-banner-motion-${banner.motion || 'pop'}`)}>
        <div className="screen-banner-fx" />
        <div className="screen-banner-content">
          <span className="screen-banner-text">{banner.text}</span>
        </div>
        {duration > 0 && (
          <div className="screen-banner-progress">
            <div style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}


function AdminStandbyFXPanel({ state, action, notify, pin }) {
  const standby = state.screen.standby || {};
  const [selectedFx, setSelectedFx] = useState(standby.fxId || 'neon-tunnel');
  const [rotationMode, setRotationMode] = useState(standby.rotationMode || 'single');
  const [durationSeconds, setDurationSeconds] = useState(Number(standby.durationSeconds) || 30);

  useEffect(() => {
    setSelectedFx(standby.fxId || 'neon-tunnel');
    setRotationMode(standby.rotationMode || 'single');
    setDurationSeconds(Number(standby.durationSeconds) || 30);
  }, [standby.fxId, standby.rotationMode, standby.durationSeconds]);

  async function applyStandby(visible = true, nextMode = rotationMode, nextFx = selectedFx, nextDuration = durationSeconds) {
    const response = await action('screen:standby', {
      pin,
      visible,
      rotationMode: nextMode,
      fxId: nextFx,
      durationSeconds: nextDuration,
    });
    if (response?.ok) notify(visible ? 'Standby FX enviado a pantalla.' : 'Standby FX oculto.');
  }

  function chooseFx(fxId) {
    setSelectedFx(fxId);
    setRotationMode('single');
  }

  return (
    <Panel className="glow-border">
      <div className="mb-4 flex items-start gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-neonPink/35 bg-neonPink/10 text-3xl shadow-neonPink">🎛️</div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-neonPink">Standby FX profesional</div>
          <h2 className="text-2xl font-black">Ocultar dashboard con visuales épicas</h2>
          <p className="mt-1 text-sm text-softText">
            Ideal para pausas, cambios de bloque, entrada de novios, cumpleañera, egresados o momento previo al drop.
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setRotationMode('random');
            applyStandby(true, 'random', selectedFx, durationSeconds);
          }}
          className={cls('rounded-3xl border p-4 text-left font-black transition active:scale-[.98]', standby.visible && standby.rotationMode === 'random' ? 'border-neonCyan bg-neonCyan/10 shadow-neonCyan' : 'border-white/10 bg-white/[.055]')}
        >
          <div className="mb-2 text-3xl">🎲</div>
          Aleatorio
          <div className="mt-1 text-xs font-bold text-softText">Cambia solo y repite infinito</div>
        </button>
        <button
          type="button"
          onClick={() => applyStandby(false)}
          className={cls('rounded-3xl border p-4 text-left font-black transition active:scale-[.98]', !standby.visible ? 'border-neonPink/30 bg-neonPink/10 text-neonPink' : 'border-white/10 bg-white/[.055]')}
        >
          <div className="mb-2 text-3xl">■</div>
          Quitar
          <div className="mt-1 text-xs font-bold text-softText">Vuelve al dashboard/show</div>
        </button>
      </div>

      <div className="mb-4">
        <div className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-softText">⏱ cada visual</div>
        <div className="grid grid-cols-4 gap-2">
          {STANDBY_DURATIONS.map((seconds) => (
            <button
              key={seconds}
              type="button"
              onClick={() => {
                setDurationSeconds(seconds);
                if (standby.visible) applyStandby(true, rotationMode, selectedFx, seconds);
              }}
              className={cls('rounded-2xl border px-3 py-3 text-center font-black transition active:scale-[.98]', durationSeconds === seconds ? 'border-neonCyan bg-neonCyan/10 text-neonCyan shadow-neonCyan' : 'border-white/10 bg-white/[.055] text-white')}
            >
              {seconds}s
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {STANDBY_FX.map((fx) => (
          <button
            key={fx.id}
            type="button"
            onClick={() => chooseFx(fx.id)}
            onDoubleClick={() => applyStandby(true, 'single', fx.id, durationSeconds)}
            className={cls('group overflow-hidden rounded-3xl border bg-black/30 p-3 text-left transition active:scale-[.98]', selectedFx === fx.id && rotationMode !== 'random' ? 'border-neonPink bg-neonPink/10 shadow-neonPink' : 'border-white/10')}
          >
            <div className={cls('standby-admin-thumb', `standby-fx-${fx.id}`)}>
              <StandbyVisualLayers fxId={fx.id} mini />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-black">{fx.icon} {fx.title}</div>
                <div className="truncate text-[11px] text-softText">{fx.subtitle}</div>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[.06] px-2 py-1 text-xs font-black text-softText">#{fx.number}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Button onClick={() => applyStandby(true, 'single', selectedFx, durationSeconds)} className="w-full">
          <span className="flex items-center justify-center gap-2">▶ Mostrar FX elegido</span>
        </Button>
        <Button variant="secondary" onClick={() => applyStandby(true, 'random', selectedFx, durationSeconds)} className="w-full">
          🎲 Random infinito
        </Button>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3 text-xs text-softText">
        Tamaño ideal si después reemplazás por videos reales: <strong className="text-white">1920×1080, MP4 H.264, 30fps, sin audio, loop 12–20s.</strong>
        Nombres: <strong className="text-white">public/standby/standby-1.mp4</strong> hasta <strong className="text-white">standby-10.mp4</strong>.
      </div>
    </Panel>
  );
}


function AdminScreen({ state, action, notify, pin }) {
  const [announcement, setAnnouncement] = useState(state.screen.announcement || 'Escaneá y participá');
  const modes = [
    { id: 'live', label: 'En vivo', icon: MonitorPlay },
    { id: 'qr', label: 'QR', icon: Home },
    { id: 'energy', label: 'Energía', icon: Zap },
    { id: 'dedications', label: 'Dedicatorias', icon: Heart },
    { id: 'battle', label: 'Batalla', icon: Swords },
    { id: 'trivia', label: 'Trivia', icon: Gamepad2 },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
  ];

  async function setMode(mode) {
    const response = await action('screen:set', { mode, announcement, pin });
    if (response?.ok) notify('Pantalla actualizada.');
  }

  return (
    <div className="space-y-4">
      <Panel>
        <h1 className="text-2xl font-black">Pantalla Show</h1>
        <p className="text-sm text-softText">Elegí qué se muestra en la pantalla grande.</p>
        <a href={`/show/${state.event.id || ""}`} className="mt-4 block rounded-2xl border border-neonCyan/30 bg-neonCyan/10 p-3 text-center font-black text-neonCyan">
          Abrir pantalla show
        </a>
      </Panel>

      <CastDashboardPanel eventId={state.event.id} />

      <AdminShowBannerPanel state={state} action={action} notify={notify} pin={pin} />

      <AdminStandbyFXPanel state={state} action={action} notify={notify} pin={pin} />

      <Panel>
        <Field label="Mensaje principal" value={announcement} onChange={(e) => setAnnouncement(e.target.value)} />
        <div className="mt-4 grid grid-cols-2 gap-3">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setMode(mode.id)}
                className={cls(
                  'rounded-3xl border p-4 text-left font-black transition active:scale-[.98]',
                  state.screen.mode === mode.id ? 'border-neonCyan bg-neonCyan/10 shadow-neonCyan' : 'border-white/10 bg-white/[.055]',
                )}
              >
                <Icon className="mb-2 text-neonPink" />
                {mode.label}
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel>
        <h2 className="mb-3 text-xl font-black">Actividad reciente</h2>
        {state.activity.length === 0 ? (
          <EmptyState icon={Sparkles} title="Sin actividad todavía" text="Cuando el público participe se verá acá." />
        ) : (
          <div className="space-y-2">
            {state.activity.slice(0, 10).map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-black/25 p-3 text-sm">
                <p className="font-bold">{item.message}</p>
                <p className="mt-1 text-xs text-softText">{new Date(item.createdAt).toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function StandbyVisualLayers({ fxId, mini = false }) {
  const fx = STANDBY_FX.find((item) => item.id === fxId) || STANDBY_FX[0];
  const particles = mini ? 16 : 42;
  const beams = mini ? 8 : 18;
  return (
    <div className={cls('standby-visual-layers', mini && 'standby-visual-mini')}>
      <div className="standby-bg" />
      <div className="standby-grid" />
      <div className="standby-vignette" />
      <div className="standby-core">
        {Array.from({ length: beams }).map((_, index) => (
          <span key={`beam-${index}`} className="standby-beam" style={{ '--i': index, '--total': beams }} />
        ))}
      </div>
      <div className="standby-particles">
        {Array.from({ length: particles }).map((_, index) => (
          <span key={`p-${index}`} className="standby-particle" style={{ '--i': index, '--total': particles }} />
        ))}
      </div>
      <div className="standby-fx-shape standby-shape-a" />
      <div className="standby-fx-shape standby-shape-b" />
      <div className="standby-fx-shape standby-shape-c" />
      {fx.id === 'epic-countdown' && (
        <div className="standby-countdown">
          <span>3</span><span>2</span><span>1</span><span>GO</span>
        </div>
      )}
      {!mini && (
        <div className="standby-label">
          <div className="standby-kicker">Pista Viva DJ · Visual FX</div>
          <div className="standby-title">{fx.icon} {fx.title}</div>
          <div className="standby-subtitle">{fx.subtitle}</div>
        </div>
      )}
    </div>
  );
}

function StandbyShow({ state, tvMode = false }) {
  const standby = state.screen.standby || {};
  const randomMode = standby.rotationMode === 'random';
  const duration = Math.max(5, Number(standby.durationSeconds) || 30);
  const initialIndex = Math.max(0, STANDBY_FX.findIndex((item) => item.id === standby.fxId));
  const [index, setIndex] = useState(initialIndex >= 0 ? initialIndex : 0);

  useEffect(() => {
    const nextIndex = Math.max(0, STANDBY_FX.findIndex((item) => item.id === standby.fxId));
    if (!randomMode && nextIndex >= 0) setIndex(nextIndex);
  }, [standby.fxId, randomMode]);

  useEffect(() => {
    if (!randomMode) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1 + Math.floor(Math.random() * (STANDBY_FX.length - 1))) % STANDBY_FX.length);
    }, duration * 1000);
    return () => window.clearInterval(timer);
  }, [randomMode, duration]);

  const fx = STANDBY_FX[index % STANDBY_FX.length];

  return (
    <div className={cls('standby-show', tvMode && 'standby-show-tv', `standby-fx-${fx.id}`)}>
      <StandbyVisualLayers fxId={fx.id} />
      <div className="standby-topbar">
        <Brand compact />
        <div className="rounded-full border border-neonCyan/30 bg-black/35 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-neonCyan">
          {randomMode ? `🎲 Random · ${duration}s` : `FX #${fx.number}`}
        </div>
      </div>
      <div className="standby-bottom-hint">
        <span>Standby visual activo</span>
        <span>El DJ puede volver al dashboard desde cabina</span>
      </div>
    </div>
  );
}


function ShowApp({ pista }) {
  const { state, connected } = pista;
  const qrUrl = state.event.publicUrl || `${window.location.origin}/e/${state.event.id}`;
  const searchParams = new URLSearchParams(window.location.search);
  const forceDashboard = searchParams.get('dashboard') === '1';
  const tvMode = searchParams.get('tv') === '1' || forceDashboard;
  const standbyVisible = Boolean(state.screen.standby?.visible);
  const mode = standbyVisible ? 'standby' : (forceDashboard ? 'live' : state.screen.mode);

  return (
    <div className={cls('show-frame', tvMode && 'tv-mode', standbyVisible && 'show-frame-standby')}>
      {!standbyVisible && <ScreenAnnouncementBanner state={state} />}
      <div className={cls('mx-auto flex min-h-screen w-full flex-col', tvMode ? 'tv-shell max-w-none p-4' : 'max-w-6xl p-5 sm:p-8')}>
        {!tvMode && (
          <header className="flex items-center justify-between gap-4">
            <Brand />
            <StatusPill state={state} connected={connected} />
          </header>
        )}

        <main className={cls('grid flex-1 place-items-center', tvMode ? 'min-h-0 py-0' : 'py-6')}>
          {mode === 'standby' && <StandbyShow state={state} tvMode={tvMode} />}
          {mode === 'live' && <ShowLiveDashboard state={state} connected={connected} qrUrl={qrUrl} tvMode={tvMode} />}
          {mode === 'qr' && <ShowQR state={state} qrUrl={qrUrl} />}
          {mode === 'energy' && <ShowEnergy state={state} />}
          {mode === 'dedications' && <ShowDedications state={state} />}
          {mode === 'battle' && <ShowBattle state={state} />}
          {mode === 'trivia' && <ShowTrivia state={state} />}
          {mode === 'stats' && <ShowStats state={state} />}
        </main>

        {!tvMode && (
          <footer className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <ShowStat icon={Users} label="Participantes" value={state.event.connected} />
              <ShowStat icon={Heart} label="Dedicatorias" value={state.dedications.approved.length} />
              <ShowStat icon={Vote} label="Votos totales" value={state.mood.totalVotes + state.battle.totalVotes + state.trivia.totalVotes} />
            </div>
            <TxHousePoweredBy />
          </footer>
        )}
      </div>
    </div>
  );
}


function ShowLiveDashboard({ state, connected, qrUrl, tvMode = false }) {
  const [introVisible, setIntroVisible] = useState(true);
  const [highlightIndex, setHighlightIndex] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroVisible(false), 18000);
    return () => window.clearTimeout(timer);
  }, []);

  const highlights = useMemo(() => buildLiveHighlights(state), [state]);
  const safeHighlights = highlights.length > 0 ? highlights : [
    {
      label: 'Pantalla en vivo',
      title: 'La pista está lista',
      subtitle: 'Cuando el público participe, los pedidos, votos y mensajes aparecen automáticamente acá.',
      icon: Sparkles,
      tone: 'cyan',
    },
  ];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHighlightIndex((current) => (current + 1) % safeHighlights.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [safeHighlights.length]);

  const current = safeHighlights[highlightIndex % safeHighlights.length];

  if (introVisible && !tvMode) {
    return (
      <div className="live-intro w-full max-w-5xl text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-neonGreen/30 bg-neonGreen/10 px-5 py-2 text-sm font-black uppercase tracking-[0.22em] text-neonGreen">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-neonGreen" />
          Evento en vivo
        </div>
        <h1 className="screen-title">{state.screen.announcement || 'Escaneá y participá'}</h1>
        <p className="mt-4 text-2xl font-black text-neonCyan">Tu música. Tu energía. Tu fiesta.</p>
        <div className="mx-auto mt-8 grid max-w-5xl items-center gap-8 md:grid-cols-[1fr_1.15fr]">
          <div className="rounded-[36px] border border-white/10 bg-black/35 p-6 text-left shadow-neonPink">
            <Brand />
            <div className="mt-8 grid gap-4">
              <ShowIntroFeature icon={Music2} title="Pedí canciones" />
              <ShowIntroFeature icon={Heart} title="Mandá dedicatorias" />
              <ShowIntroFeature icon={Vote} title="Votá el ambiente" />
              <ShowIntroFeature icon={Zap} title="Subí energía" />
            </div>
            <TxHousePoweredBy className="mt-6" />
          </div>
          <div className="glow-border rounded-[42px] border border-neonCyan/30 bg-black/55 p-6 shadow-neonCyan">
            <div className="mx-auto max-w-[470px] rounded-[34px] bg-white p-4">
              <QRCodeImage url={qrUrl} large />
            </div>
            <p className="mt-4 break-all text-sm font-bold text-softText">{qrUrl}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cls('live-dashboard w-full', tvMode && 'live-dashboard-tv', getEnergyMode(state.energy.score) !== 'normal' && 'live-dashboard-boost')}>
      <EnergyOverdriveOverlay score={state.energy.score} />
      <div className={cls('mb-5 grid items-center gap-4 lg:grid-cols-[1fr_auto]', tvMode && 'tv-live-header')}>
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-neonGreen/30 bg-neonGreen/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-neonGreen">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-neonGreen" />
            Dashboard en vivo
          </div>
          <h1 className="screen-title">{state.event.title || 'Pista Viva DJ'}</h1>
          <p className="mt-2 text-xl font-bold text-softText">{state.event.djName} · {state.event.style}</p>
        </div>
        <LiveMiniQR qrUrl={qrUrl} />
      </div>

      <div className={cls('grid gap-5 xl:grid-cols-[1.4fr_.9fr]', tvMode && 'tv-dashboard-grid')}>
        <section className={cls('space-y-5', tvMode && 'tv-main-column')}>
          <LiveHighlightCard key={current.label + "-" + current.title + "-" + current.subtitle} highlight={current} />
          <div className={cls('grid gap-5 lg:grid-cols-2', tvMode && 'tv-two-panels')}>
            <ShowEnergyPanel state={state} />
            <ShowMoodRanking state={state} />
          </div>
          <LiveDedicationsWall state={state} />
          {!tvMode && (
            <div className="grid gap-5 lg:grid-cols-2">
              <LiveBattleWidget battle={state.battle} />
              <LiveTriviaWidget trivia={state.trivia} />
            </div>
          )}
        </section>

        <aside className={cls('space-y-5', tvMode && 'tv-side-column')}>
          <LiveSongRanking requests={state.songRequests} />
          {tvMode ? <LiveBattleWidget battle={state.battle} /> : <LiveActivityFeed activity={state.activity} />}
          {tvMode ? <TxHousePoweredBy /> : <TxHouseBanner compact />}
        </aside>
      </div>
    </div>
  );
}

function buildLiveHighlights(state) {
  const highlights = [];
  const latestDedication = state.dedications.approved[0];
  const topSong = state.songRequests.filter((request) => request.status === 'pending')[0];
  const topMood = [...state.mood.options].sort((a, b) => b.votes - a.votes || b.percent - a.percent)[0];

  if (latestDedication) {
    highlights.push({
      label: 'Dedicatoria aprobada por cabina',
      title: latestDedication.message,
      subtitle: `De: ${latestDedication.name}`,
      icon: Heart,
      tone: 'pink',
    });
  }

  if (topSong) {
    highlights.push({
      label: 'Pedido más votado',
      title: topSong.song,
      subtitle: `${topSong.artist || 'Artista no indicado'} · pidió ${topSong.name} · ${topSong.votes} votos`,
      icon: Music2,
      tone: 'cyan',
    });
  }

  if (state.battle.active) {
    const leader = state.battle.percentA >= state.battle.percentB ? state.battle.optionA : state.battle.optionB;
    const percent = state.battle.percentA >= state.battle.percentB ? state.battle.percentA : state.battle.percentB;
    highlights.push({
      label: 'Batalla de canciones',
      title: leader.name || state.battle.title,
      subtitle: `${leader.artist || 'Votación abierta'} · lidera con ${percent}%`,
      icon: Swords,
      tone: 'violet',
    });
  }

  if (state.trivia.active) {
    highlights.push({
      label: 'Trivia en vivo',
      title: state.trivia.question,
      subtitle: `${state.trivia.totalVotes} respuestas del público`,
      icon: Gamepad2,
      tone: 'cyan',
    });
  }

  if (topMood) {
    highlights.push({
      label: 'Ambiente de la pista',
      title: `${topMood.icon} ${topMood.label}`,
      subtitle: `${topMood.percent}% de los votos · ${state.mood.totalVotes} votos totales`,
      icon: Vote,
      tone: 'pink',
    });
  }

  highlights.push({
    label: 'Energía colectiva',
    title: `${state.energy.score}% de energía`,
    subtitle: `${state.energy.contributors} personas ya sumaron energía desde su celular`,
    icon: Zap,
    tone: 'cyan',
  });

  return highlights;
}

function ShowIntroFeature({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[.055] p-4">
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-neonPink/30 bg-neonPink/10 text-neonPink shadow-neonPink">
        <Icon size={28} />
      </div>
      <div className="text-xl font-black">{title}</div>
    </div>
  );
}

function LiveMiniQR({ qrUrl }) {
  return (
    <div className="glow-border flex items-center gap-4 rounded-[30px] border border-neonCyan/30 bg-black/50 p-3 shadow-neonCyan">
      <div className="w-28 shrink-0 rounded-2xl bg-white p-2">
        <QRCodeImage url={qrUrl} />
      </div>
      <div className="max-w-[260px]">
        <div className="text-sm font-black uppercase tracking-[0.2em] text-neonCyan">Escaneá y participá</div>
        <div className="mt-1 text-xl font-black">Entrá desde tu celular</div>
        <div className="mt-1 break-all text-xs text-softText">{qrUrl}</div>
      </div>
    </div>
  );
}

function LiveHighlightCard({ highlight }) {
  const Icon = highlight.icon || Sparkles;
  const toneClasses =
    highlight.tone === 'cyan'
      ? 'border-neonCyan/35 shadow-neonCyan'
      : highlight.tone === 'violet'
        ? 'border-neonViolet/35 shadow-neonViolet'
        : 'border-neonPink/35 shadow-neonPink';

  return (
    <div key={highlight.label + '-' + highlight.title} className={cls('live-pop live-impact-card overflow-hidden rounded-[38px] border bg-black/45 p-7', toneClasses)}>
      <div className="absolute-neon" />
      <div className="impact-speed-lines" />
      <div className="relative z-10 flex items-start gap-5">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[28px] border border-white/10 bg-white/[.06] text-neonPink">
          <Icon size={44} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 inline-flex rounded-full border border-neonGreen/30 bg-neonGreen/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-neonGreen">
            Acción importante · {highlight.label}
          </div>
          <h2 className="text-4xl font-black leading-tight md:text-6xl">{highlight.title}</h2>
          <p className="mt-4 text-2xl font-bold text-softText">{highlight.subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function ShowEnergyPanel({ state }) {
  const mode = getEnergyMode(state.energy.score);
  return (
    <div className={cls('rounded-[34px] border border-neonCyan/25 bg-white/[.055] p-5 shadow-neonCyan', mode !== 'normal' && 'energy-panel-hot')}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-black">Energía colectiva</h2>
        <span className={cls('rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em]', mode === 'critical' ? 'border border-neonPink/35 bg-neonPink/12 text-neonPink' : mode === 'overdrive' ? 'border border-neonCyan/35 bg-neonCyan/12 text-neonCyan' : mode === 'boost' ? 'border border-neonViolet/35 bg-neonViolet/12 text-[#c8adff]' : 'border border-neonGreen/30 bg-neonGreen/10 text-neonGreen')}>
          {mode === 'critical' ? 'POWER MAX' : mode === 'overdrive' ? 'OVERDRIVE' : mode === 'boost' ? 'BOOST' : 'EN VIVO'}
        </span>
      </div>
      <EnergyRing score={state.energy.score} />
      <ShowEnergyBar score={state.energy.score} />
      <p className="mt-3 text-center text-lg font-black text-neonCyan">{state.energy.contributors} personas ya sumaron energía</p>
      <p className="mt-1 text-center text-sm font-bold uppercase tracking-[0.18em] text-softText">{mode === 'critical' ? 'La pantalla entra en modo explosión' : mode === 'overdrive' ? 'La pista acelera con brillo y rayos' : mode === 'boost' ? 'La energía está subiendo fuerte' : 'Seguí tocando power desde el celular'}</p>
    </div>
  );
}

function ShowMoodRanking({ state }) {
  const options = [...state.mood.options].sort((a, b) => b.percent - a.percent || b.votes - a.votes);
  return (
    <div className="rounded-[34px] border border-neonPink/25 bg-white/[.055] p-5 shadow-neonPink">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-black">Ambiente elegido</h2>
        <span className="text-sm font-black text-neonPink">{state.mood.totalVotes} votos</span>
      </div>
      <div className="space-y-3">
        {options.map((option, index) => (
          <div key={option.id} className="rounded-2xl border border-white/10 bg-black/30 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="min-w-0 truncate text-lg font-black">{index + 1}. {option.icon} {option.label}</div>
              <div className="text-2xl font-black text-neonCyan">{option.percent}%</div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-neonPink via-neonViolet to-neonCyan transition-all duration-700" style={{ width: `${option.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveDedicationsWall({ state }) {
  const items = state.dedications.approved.slice(0, 10);
  return (
    <div className="rounded-[34px] border border-neonPink/25 bg-black/35 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-black">Dedicatorias aprobadas</h2>
        <span className="rounded-full border border-neonPink/30 bg-neonPink/10 px-3 py-1 text-xs font-black text-neonPink">Pasan en vivo</span>
      </div>
      {items.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-white/15 bg-white/[.035] p-6 text-center text-xl font-bold text-softText">
          Cuando el DJ apruebe mensajes, aparecen grandes y luego quedan pasando acá.
        </p>
      ) : (
        <div className="live-ticker overflow-hidden rounded-3xl border border-white/10 bg-white/[.04] p-3">
          <div className="live-ticker-track flex gap-3">
            {[...items, ...items].map((dedication, index) => (
              <div key={`${dedication.id}-${index}`} className="min-w-[360px] rounded-3xl border border-neonPink/25 bg-neonPink/10 p-4">
                <div className="mb-2 flex items-center gap-2 text-neonPink">
                  <Heart size={22} />
                  <span className="font-black">Dedicatoria</span>
                </div>
                <p className="text-xl font-black">{dedication.message}</p>
                <p className="mt-2 text-sm text-softText">De: {dedication.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LiveBattleWidget({ battle }) {
  return (
    <div className="rounded-[34px] border border-neonViolet/25 bg-white/[.055] p-5">
      <h2 className="mb-4 flex items-center gap-2 text-2xl font-black"><Swords className="text-neonPink" /> Batalla</h2>
      {!battle.active ? (
        <p className="rounded-3xl border border-dashed border-white/15 p-5 text-softText">Sin batalla activa.</p>
      ) : (
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <MiniBattleSide title={battle.optionA.name} percent={battle.percentA} />
          <div className="text-2xl font-black text-neonPink">VS</div>
          <MiniBattleSide title={battle.optionB.name} percent={battle.percentB} />
        </div>
      )}
    </div>
  );
}

function MiniBattleSide({ title, percent }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
      <div className="truncate text-lg font-black">{title || 'Canción'}</div>
      <div className="mt-2 text-4xl font-black text-neonCyan">{percent}%</div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-neonPink to-neonCyan transition-all duration-700" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function LiveTriviaWidget({ trivia }) {
  return (
    <div className="rounded-[34px] border border-neonCyan/25 bg-white/[.055] p-5">
      <h2 className="mb-4 flex items-center gap-2 text-2xl font-black"><Gamepad2 className="text-neonCyan" /> Trivia</h2>
      {!trivia.active ? (
        <p className="rounded-3xl border border-dashed border-white/15 p-5 text-softText">Sin trivia activa.</p>
      ) : (
        <div>
          <p className="mb-3 text-xl font-black">{trivia.question}</p>
          <div className="space-y-2">
            {trivia.options.map((option, index) => (
              <div key={`${option}-${index}`} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="flex justify-between gap-3 font-bold">
                  <span>{option}</span>
                  <span className="text-neonCyan">{trivia.percents[index]}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-neonViolet to-neonCyan transition-all duration-700" style={{ width: `${trivia.percents[index]}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LiveSongRanking({ requests }) {
  const pending = requests.filter((request) => request.status === 'pending').slice(0, 8);
  return (
    <div className="rounded-[34px] border border-neonCyan/25 bg-black/40 p-5 shadow-neonCyan">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-black">Ranking de pedidos</h2>
        <span className="rounded-full border border-neonCyan/30 bg-neonCyan/10 px-3 py-1 text-xs font-black text-neonCyan">Siempre visible</span>
      </div>
      {pending.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-white/15 p-5 text-softText">Todavía no hay pedidos.</p>
      ) : (
        <div className="space-y-3">
          {pending.map((request, index) => (
            <div key={request.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-3xl border border-white/10 bg-white/[.045] p-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-neonPink/25 bg-neonPink/10 text-xl font-black text-neonPink">#{index + 1}</div>
              <div className="min-w-0">
                <div className="truncate text-lg font-black">{request.song}</div>
                <div className="truncate text-sm text-softText">{request.artist || 'Artista no indicado'} · pidió {request.name}</div>
              </div>
              <div className="rounded-2xl border border-neonPink/30 bg-neonPink/10 px-3 py-2 text-lg font-black text-neonPink">♥ {request.votes}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LiveActivityFeed({ activity }) {
  const items = activity.slice(0, 8);
  return (
    <div className="rounded-[34px] border border-white/10 bg-black/35 p-5">
      <h2 className="mb-4 text-2xl font-black">Actividad en vivo</h2>
      {items.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-white/15 p-5 text-softText">La actividad aparece acá apenas el público participa.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={item.id} className={cls('rounded-2xl border border-white/10 bg-white/[.045] p-3', index === 0 && 'activity-hot-card')}>
              <p className="font-bold">{item.message}</p>
              <p className="mt-1 text-xs text-softText">{new Date(item.createdAt).toLocaleTimeString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ShowQR({ state, qrUrl }) {
  return (
    <div className="w-full max-w-4xl text-center">
      <h1 className="screen-title">{state.screen.announcement || 'Escaneá y participá'}</h1>
      <p className="mt-4 text-xl font-black text-neonCyan">Tu música. Tu energía. Tu fiesta.</p>
      <div className="mx-auto mt-7 max-w-[440px]">
        <QRPanel url={qrUrl} title="" large />
      </div>
      <ShowEnergyBar score={state.energy.score} />
    </div>
  );
}

function ShowEnergy({ state }) {
  return (
    <div className="text-center">
      <h1 className="screen-title">Energía colectiva</h1>
      <p className="mt-4 text-2xl text-softText">Subí energía desde tu celular</p>
      <div className="mt-10">
        <EnergyRing score={state.energy.score} size="large" />
      </div>
      <p className="mt-6 text-3xl font-black text-neonCyan">{state.energy.contributors} personas ya sumaron energía</p>
    </div>
  );
}

function ShowDedications({ state }) {
  const items = state.dedications.approved.slice(0, 4);
  return (
    <div className="w-full max-w-5xl text-center">
      <h1 className="screen-title">Dedicatorias en vivo</h1>
      {items.length === 0 ? (
        <p className="mt-8 text-2xl text-softText">Todavía no hay dedicatorias aprobadas.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {items.map((dedication) => (
            <div key={dedication.id} className="glow-border rounded-[28px] border border-neonPink/35 bg-black/40 p-6 text-left shadow-neonPink">
              <Heart className="mb-3 text-neonPink" size={36} />
              <p className="text-2xl font-black">{dedication.message}</p>
              <p className="mt-3 text-lg text-softText">De: {dedication.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ShowBattle({ state }) {
  const battle = state.battle;
  return (
    <div className="w-full max-w-5xl text-center">
      <h1 className="screen-title">Batalla de canciones</h1>
      {!battle.active ? (
        <p className="mt-8 text-2xl text-softText">No hay batalla activa.</p>
      ) : (
        <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-5">
          <ShowBattleSide title={battle.optionA.name} artist={battle.optionA.artist} percent={battle.percentA} votes={battle.votesA} />
          <div className="rounded-full border border-neonPink/40 bg-neonPink/15 px-6 py-5 text-4xl font-black text-neonPink shadow-neonPink">VS</div>
          <ShowBattleSide title={battle.optionB.name} artist={battle.optionB.artist} percent={battle.percentB} votes={battle.votesB} />
        </div>
      )}
    </div>
  );
}

function ShowBattleSide({ title, artist, percent, votes }) {
  return (
    <div className="rounded-[32px] border border-white/10 bg-white/[.06] p-6 text-left">
      <PlayCircle className="mb-8 text-neonCyan" size={54} />
      <h2 className="text-4xl font-black">{title}</h2>
      <p className="mt-1 text-xl text-softText">{artist}</p>
      <div className="mt-8 text-6xl font-black">{percent}%</div>
      <div className="mt-4 h-5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-neonPink to-neonCyan" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-3 text-lg text-softText">{votes} votos</p>
    </div>
  );
}

function ShowTrivia({ state }) {
  const trivia = state.trivia;
  return (
    <div className="w-full max-w-5xl text-center">
      <h1 className="screen-title">Trivia en vivo</h1>
      {!trivia.active ? (
        <p className="mt-8 text-2xl text-softText">No hay trivia activa.</p>
      ) : (
        <>
          <p className="mt-6 text-3xl font-black">{trivia.question}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {trivia.options.map((option, index) => (
              <div key={`${option}-${index}`} className="rounded-[28px] border border-white/10 bg-white/[.06] p-5 text-left">
                <div className="flex justify-between gap-5 text-2xl font-black">
                  <span>{option}</span>
                  <span className="text-neonCyan">{trivia.percents[index]}%</span>
                </div>
                <div className="mt-4 h-4 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-neonViolet to-neonCyan" style={{ width: `${trivia.percents[index]}%` }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ShowStats({ state }) {
  return (
    <div className="w-full max-w-5xl text-center">
      <h1 className="screen-title">La pista vibra</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <BigStat icon={Users} value={state.event.connected} label="Conectados" />
        <BigStat icon={Music2} value={state.songRequests.length} label="Pedidos" />
        <BigStat icon={Zap} value={`${state.energy.score}%`} label="Energía" />
        <BigStat icon={Heart} value={state.dedications.approved.length} label="Dedicatorias" />
        <BigStat icon={Vote} value={state.mood.totalVotes} label="Votos ambiente" />
        <BigStat icon={Trophy} value={state.battle.totalVotes} label="Batalla" />
      </div>
    </div>
  );
}

function ShowEnergyBar({ score }) {
  return (
    <div className="mx-auto mt-7 max-w-3xl rounded-3xl border border-white/10 bg-black/40 p-4">
      <div className="mb-2 flex items-center justify-center gap-2 text-xl font-black uppercase">
        <Zap className="text-neonPink" /> Energía colectiva
      </div>
      <div className="h-8 overflow-hidden rounded-full border border-neonViolet/40 bg-white/10 p-1">
        <div className="h-full rounded-full bg-gradient-to-r from-neonBlue via-neonPink to-yellow-300" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function ShowStat({ icon: Icon, value, label }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/35 p-4 text-center">
      <Icon className="mx-auto mb-1 text-neonCyan" />
      <div className="text-2xl font-black">{value}</div>
      <div className="text-xs uppercase tracking-wide text-softText">{label}</div>
    </div>
  );
}

function BigStat({ icon: Icon, value, label }) {
  return (
    <div className="rounded-[32px] border border-white/10 bg-white/[.06] p-8">
      <Icon className="mx-auto mb-4 text-neonPink" size={48} />
      <div className="text-6xl font-black">{value}</div>
      <div className="mt-2 text-xl font-bold text-softText">{label}</div>
    </div>
  );
}

function LoadingApp() {
  return (
    <div className="app-shell">
      <div className="app-frame grid min-h-screen place-items-center p-8 text-center">
        <div>
          <Brand />
          <div className="mx-auto mt-8 h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-neonPink" />
          <p className="mt-4 font-bold text-softText">Conectando con la pista...</p>
        </div>
      </div>
    </div>
  );
}


function getRouteInfo() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts[0] === 'e' && parts[1]) return { mode: 'public', eventId: parts[1] };
  if (parts[0] === 'cabina' && parts[1]) return { mode: 'admin', eventId: parts[1] };
  if (parts[0] === 'show' && parts[1]) return { mode: 'show', eventId: parts[1] };
  return { mode: 'landing', eventId: '' };
}

function slugifyClient(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function EventLanding() {
  const origin = useMemo(apiOrigin, []);
  const [form, setForm] = useState({
    title: '',
    djName: '',
    eventId: '',
    pin: '',
  });
  const [existing, setExisting] = useState('');
  const [error, setError] = useState('');

  const cleanEventId = slugifyClient(form.eventId || form.title);

  async function createEvent(event) {
    event.preventDefault();
    setError('');
    if (!cleanEventId) {
      setError('Poné un nombre o código para el evento.');
      return;
    }
    if (String(form.pin || '').trim().length < 4) {
      setError('El PIN debe tener al menos 4 caracteres.');
      return;
    }

    try {
      const response = await fetch(`${origin}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title || 'Pista Viva DJ',
          djName: form.djName || 'DJ en vivo',
          eventId: cleanEventId,
          pin: form.pin,
        }),
      });
      const data = await response.json();
      if (!data.ok) {
        setError(data.message || 'No se pudo crear el evento.');
        return;
      }
      window.location.href = `/cabina/${data.event.id}`;
    } catch {
      setError('No se pudo conectar con el servidor.');
    }
  }

  function openExisting(event) {
    event.preventDefault();
    const id = slugifyClient(existing);
    if (!id) {
      setError('Ingresá el código del evento.');
      return;
    }
    window.location.href = `/cabina/${id}`;
  }

  return (
    <div className="app-shell">
      <div className="app-frame px-4 py-[calc(env(safe-area-inset-top)+24px)]">
        <Brand />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <InstallAppButton type="public" compact />
          <InstallAppButton type="dj" compact />
        </div>
        <Panel className="glow-border mt-6">
          <div className="mb-4 inline-flex rounded-full border border-neonGreen/30 bg-neonGreen/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-neonGreen">
            Multi-evento seguro
          </div>
          <h1 className="text-3xl font-black">Crear sala independiente</h1>
          <p className="mt-2 text-sm text-softText">
            Cada fiesta tiene su propio link, cabina, PIN, QR, pantalla show, pedidos y mensajes. Nada se mezcla con otra fiesta.
          </p>

          <form onSubmit={createEvent} className="mt-5 space-y-3">
            <Field label="Nombre del evento" placeholder="Ej: Feliz cumple Flor" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={60} />
            <Field label="Nombre del DJ" placeholder="Ej: DJ Nico" value={form.djName} onChange={(e) => setForm({ ...form, djName: e.target.value })} maxLength={60} />
            <Field label="Código de evento" placeholder="Ej: flor-15" value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })} maxLength={48} />
            <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-xs font-bold text-softText">
              Link público: <span className="text-neonCyan">/e/{cleanEventId || 'tu-evento'}</span>
            </div>
            <Field label="PIN privado de cabina" type="password" placeholder="Mínimo 4 números o letras" value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} maxLength={24} />
            {error && <p className="rounded-2xl border border-red-400/40 bg-red-400/10 p-3 text-sm font-bold text-red-100">{error}</p>}
            <Button type="submit" className="w-full">Crear evento y abrir cabina</Button>
          </form>
        </Panel>

        <Panel className="mt-4">
          <h2 className="text-xl font-black">Abrir evento existente</h2>
          <form onSubmit={openExisting} className="mt-3 grid gap-3">
            <Field placeholder="Código del evento, ej: flor-15" value={existing} onChange={(e) => setExisting(e.target.value)} />
            <Button type="submit" variant="secondary" className="w-full">Abrir cabina</Button>
          </form>
        </Panel>

        <Panel className="mt-4">
          <h2 className="text-xl font-black">Seguridad activa</h2>
          <div className="mt-3 grid gap-2 text-sm font-bold text-softText">
            <p>✔ Cada evento vive en una sala separada.</p>
            <p>✔ El público solo envía pedidos y mensajes para revisión.</p>
            <p>✔ Dedicatorias y canciones no salen en pantalla hasta que el DJ aprueba.</p>
            <p>✔ Cartel superior, pantalla, juegos y moderación solo con PIN.</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function EventError({ message }) {
  return (
    <div className="app-shell">
      <div className="app-frame grid min-h-screen place-items-center p-6 text-center">
        <Panel className="glow-border">
          <X className="mx-auto mb-3 text-red-300" size={42} />
          <h1 className="text-2xl font-black">No se pudo abrir el evento</h1>
          <p className="mt-2 text-softText">{message || 'Revisá el link o creá una sala nueva.'}</p>
          <a href="/" className="neon-button mt-5 block">Crear o abrir evento</a>
        </Panel>
      </div>
    </div>
  );
}

export default function App() {
  const route = getRouteInfo();
  const pista = usePista(route.eventId);

  if (!route.eventId) return <EventLanding />;
  if (pista.error) return <EventError message={pista.error} />;
  if (!pista.state) return <LoadingApp />;

  if (route.mode === 'admin') return <AdminApp pista={pista} />;
  if (route.mode === 'show') return <ShowApp pista={pista} />;

  return <PublicApp pista={pista} />;
}

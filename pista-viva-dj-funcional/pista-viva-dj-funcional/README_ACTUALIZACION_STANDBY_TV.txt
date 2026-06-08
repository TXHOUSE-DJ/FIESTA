Pista Viva DJ - Actualización Standby FX + Calidad TV

Incluye:
- Modo Standby FX manejado desde Cabina DJ > Show.
- 10 visuales profesionales futuristas.
- Modo aleatorio infinito.
- Tiempo configurable: 15, 30, 45 o 60 segundos.
- Default: 30 segundos.
- Botón quitar para volver al dashboard.
- Modo TV 16:9 mejorado.
- Visuales vectoriales, más nítidos que videos comprimidos.
- Mantiene anti-spam/cooldown de 5 minutos.
- Mantiene PWA/botones de instalación.

Para proyectar:
https://TU-LINK/show/TU-EVENTO?dashboard=1&tv=1

En notebook:
- Chrome a 100% de zoom
- F11 pantalla completa
- Preferentemente HDMI para calidad máxima

Render:
- NODE_VERSION: 20.18.0
- Build Command recomendado:
  npm install --include=dev && npm run build

Si npm falla en Render:
  corepack enable && corepack prepare pnpm@9.15.4 --activate && pnpm install --no-frozen-lockfile && pnpm run build

Start Command:
  node server/index.js

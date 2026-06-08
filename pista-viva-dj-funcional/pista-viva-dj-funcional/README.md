# Pista Viva DJ — Multi-evento seguro

App para eventos con público + cabina DJ + pantalla show.

## Qué incluye

- Eventos independientes por código.
- Link público separado por fiesta: `/e/codigo`.
- Cabina separada por fiesta: `/cabina/codigo`.
- Pantalla show separada por fiesta: `/show/codigo`.
- PIN propio por evento.
- Pedidos de canciones con aprobación del DJ.
- Dedicatorias con aprobación del DJ.
- Votación de ambiente.
- Energía colectiva.
- Batallas y trivia creadas solo desde cabina.
- Cartel superior editable solo desde cabina.
- Sponsors rotativos.
- Persistencia en `data/events.json`.
- Socket.IO en tiempo real.

## Desarrollo

```bash
npm install
npm run dev
```

Abrí:

```txt
http://localhost:5173/
```

Desde la pantalla inicial creás una sala, por ejemplo:

```txt
flor-15
```

Después usás:

```txt
http://localhost:5173/e/flor-15
http://localhost:5173/cabina/flor-15
http://localhost:5173/show/flor-15
```

## Producción

```bash
npm run build
npm start
```

## Seguridad

El público no publica directo en pantalla.

- Canciones nuevas quedan en estado "Por aprobar".
- Solo aparecen en ranking/show cuando cabina toca "Aprobar".
- Dedicatorias quedan pendientes hasta que el DJ las aprueba.
- Pantalla, cartel, juegos, reinicios y moderación requieren PIN del evento.
- Cada evento tiene datos separados, así no se mezcla una fiesta con otra.

PISTA VIVA DJ - MULTI EVENTO SEGURO - RENDER

COMANDOS DE RENDER

Build Command:
npm install && npm run build

Start Command:
npm start

VARIABLES
No hace falta ADMIN_PIN global.
Cada evento crea su propio PIN.

Opcional:
ADMIN_MASTER_PIN = tu-pin-maestro

RUTAS

Pantalla inicial:
/

Crear evento:
/

App pública de una fiesta:
/e/codigo-del-evento

Cabina DJ de esa fiesta:
/cabina/codigo-del-evento

Pantalla show de esa fiesta:
/show/codigo-del-evento

EJEMPLO

Evento: flor-15
Público:
https://tu-app.onrender.com/e/flor-15

Cabina:
https://tu-app.onrender.com/cabina/flor-15

Show:
https://tu-app.onrender.com/show/flor-15

SEGURIDAD

- Cada evento tiene datos separados.
- Cada evento tiene PIN propio.
- El público no puede publicar directo en pantalla.
- Canciones y dedicatorias entran a moderación.
- Solo cabina con PIN aprueba y muestra contenido.

const fs = require('fs');
const { eventsFile } = require('./store');

if (fs.existsSync(eventsFile)) fs.unlinkSync(eventsFile);
console.log(`Eventos reiniciados. Archivo eliminado: ${eventsFile}`);

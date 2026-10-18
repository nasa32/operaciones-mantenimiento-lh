# OPS 4.1.5 — Selector horario 12 horas AM/PM

Cambio puntual basado en OPS 4.1.4.

- Selector de hora de 1 a 12, minutos 00–59 y periodo AM/PM.
- Aplica a las horas de inicio y finalización de órdenes asignadas y órdenes manuales, porque comparten `timePicker`.
- El control convierte el valor elegido a HH:mm de 24 horas en un campo oculto para mantener compatibilidad con el servidor y los registros existentes.
- Conversión: 12:xx AM -> 00:xx; 12:xx PM -> 12:xx; 1–11 PM -> 13–23.
- El comparador existente de inicio y finalización sigue usando HH:mm, por lo que conserva la validación cronológica.
- No se modificaron los módulos de almacenamiento de fotografías, la generación del PDF, la lectura del PDF original, asignaciones ni la base de datos.

Validación realizada: `node --check public/tecnico.js` y comprobación de sintaxis del ZIP. No sustituye prueba en navegador móvil / Netlify.

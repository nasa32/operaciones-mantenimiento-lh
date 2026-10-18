# OPS 4.1.4 — Corrección de expediente PDF

Cambios limitados a `netlify/functions/export.mjs`:
- Se reemplazó el carácter `✓`, que no es compatible con la fuente estándar Helvetica de pdf-lib y puede provocar `WinAnsi cannot encode "✓"`, por `OK` para evitar que falle la generación del PDF.
- El PDF de respuesta del técnico se genera primero y luego incorpora las páginas del PDF original de la OT al final.
- La carga de evidencias para el PDF individual queda dentro del bloque controlado de errores para registrar y devolver el error real de exportación en lugar de fallar antes de entrar al `try`.
- Se conserva el PDF original almacenado en la OT; no se altera el flujo de carga ni almacenamiento de fotografías.

Validación realizada:
- `node --check netlify/functions/export.mjs`
- `npm run test:pdf`
- `npm run test:images`

Pendiente: prueba real en el despliegue de Netlify con una OT aceptada y sus evidencias. La validación local no sustituye la prueba de producción.

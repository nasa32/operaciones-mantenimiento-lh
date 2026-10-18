# OPS 4.1.1 — Selector digital, informe de gestión y PDF directo

## Cambios incluidos
- Selector de hora multiplataforma con listas digitales de hora (00–23) y minutos (00–59), sin depender del selector nativo circular ni de AM/PM. Se usa tanto en órdenes asignadas como en órdenes manuales. El valor guardado sigue siendo `HH:mm` de 24 horas para mantener compatibilidad con el servidor y los informes existentes.
- Nuevo módulo administrativo **Informe resumido de gestión de mantenimiento**. Permite seleccionar fecha inicial/final y 1, 2, 3 o 5 fotos por técnico. El PDF agrupa las actividades completadas por técnico y añade evidencias reales de sus órdenes, junto con el logo original de `public/lake-house-logo.jpg`.
- El informe filtra por fecha de ejecución e incluye actividades marcadas como realizadas. Las fotos se eligen de las evidencias existentes; no se inventan imágenes ni actividades.
- Apertura del PDF original: se reserva la ventana al tocar el botón y luego se navega directamente a un objeto PDF temporal, sin crear una pantalla con iframe intermedio. Si el navegador bloquea la ventana emergente, se abre el PDF en la pestaña actual.
- Se actualizó la versión de caché del service worker para que los clientes PWA descarguen los archivos nuevos.

## Elementos que se conservan
- Menú administrativo y estilo visual de OPS 4.1.0.
- Login, roles, asignación de OT y PDF original como fuente de verdad.
- Órdenes manuales y numeración automática del servidor.
- Flujo de evidencias ANTES, DURANTE y DESPUÉS, almacenamiento independiente y validación al enviar a revisión.
- Exportaciones de expediente PDF y Excel existentes.

## Pruebas ejecutadas en esta preparación
- `node --check public/admin.js`
- `node --check public/tecnico.js`
- `node --check netlify/functions/export.mjs`
- `npm run test:pdf`
- `npm run test:images`

Las pruebas locales de sintaxis y regresión incluidas pasaron. No equivalen a una prueba de despliegue real en Netlify ni a una prueba en todos los modelos de celular; eso debe verificarse después de desplegar en una copia de prueba.

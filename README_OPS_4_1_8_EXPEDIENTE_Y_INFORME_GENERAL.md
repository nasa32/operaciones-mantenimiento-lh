# OPS 4.1.8 — Expediente PDF y reporte general de mantenimiento

## Cambios
- El expediente individual presenta el checklist en una sola tabla con actividad, estado y comentario real del técnico por actividad.
- Se elimina la sección Historial de la orden del PDF individual para dar espacio a observaciones y evaluación del cliente.
- El expediente se organiza en páginas: datos/checklist y evidencias/materiales/observaciones/evaluación. Se conserva el intento de anexar el PDF original después del reporte; si no se puede anexar, el reporte se conserva y el error queda en logs.
- El informe general por rango de fechas se mantiene disponible desde Reportes y Excel. Cada tarea resumida ahora muestra fecha, número de OT, área/equipo, tipo de mantenimiento, actividad y resultado registrado en el comentario del técnico; si no existe comentario, indica “Actividad realizada” sin inventar un resultado técnico.
- Se mantiene la selección de 1, 2, 3 o 5 fotografías por técnico, usando evidencias almacenadas disponibles.
- Se cambia el nombre de caché de PWA para actualizar los archivos estáticos.

## Validaciones
- `node --check netlify/functions/export.mjs`
- `node --check public/admin.js`
- `node --check public/tecnico.js`
- `node --check public/sw.js`
- `npm run test:pdf` — aprobado.
- `npm run test:images` — aprobado.

No fue posible completar la instalación de todas las dependencias para generar un PDF real localmente, ni se ha probado en el sitio de producción de Netlify. Antes de reemplazar la versión estable, desplegar como prueba y generar el expediente de una OT aceptada con comentarios y evidencias reales.

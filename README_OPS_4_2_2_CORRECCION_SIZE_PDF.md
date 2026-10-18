# OT Mantenimiento OPS 4.2.2 — Corrección del error options.size del expediente PDF

## Causa identificada
En `netlify/functions/export.mjs`, el bucle que dibuja las líneas de «Respuesta general del técnico» llamaba a `text()` sin pasar el texto `ln` y la coordenada X. Esto desplazaba los argumentos y enviaba `false` como `size` a `pdf-lib`, causando el error `options.size must be of type number or n, but was actually of type boolean`.

## Corrección
Se corrigió la llamada para pasar `text(page, ln, 33, y-24-i*10, 7.5, false, C.ink, 112)` y mantener la firma correcta de la función auxiliar. Se conserva la normalización defensiva del color incluida en 4.2.1.

## Funciones preservadas
- Lector de PDF y extracción de actividades.
- Órdenes asignadas y manuales, estados y asignación a técnicos.
- Evidencias ANTES/DURANTE/DESPUÉS.
- Archivo histórico, restauración y eliminación controlada.
- Contador PWA del técnico.
- Checklist con estado y comentario por actividad.
- Expediente PDF individual, informe general por rango de fechas y exportación Excel.

## Pruebas ejecutadas
- `node --check netlify/functions/export.mjs`: aprobado.
- `npm run test:pdf`: aprobado.
- `npm run test:images`: aprobado.

## Limitación
No se pudo ejecutar una generación real del expediente porque el paquete no incluye `node_modules` ni se instalaron dependencias en este entorno. No se ha probado en el Netlify de producción. Antes de reemplazar la versión activa, desplegar en una prueba y generar el expediente de una OT existente, comprobando checklist, comentario general, fotos y PDF original.

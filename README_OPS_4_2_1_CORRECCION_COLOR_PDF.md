# OT Mantenimiento OPS 4.2.1 — Corrección defensiva del color en PDF

## Cambio
- Se agregó normalización del color en las funciones de texto y recuadros del expediente individual PDF.
- Si un argumento de color llega por error como número, se normaliza a un color RGB válido antes de pasarlo a pdf-lib; si no es válido, se utiliza el color de respaldo.
- No se modificó el flujo de evidencias, el lector del PDF original, los estados de las órdenes, archivo/restauración/eliminación, ni la lógica del contador del técnico.

## Pruebas ejecutadas
- `node --check netlify/functions/export.mjs`: correcto.
- `npm run test:pdf`: correcto.
- `npm run test:images`: correcto.

## Limitación
No se ha ejecutado una generación real de expediente con dependencias instaladas ni un despliegue de producción en Netlify. Por tanto, se debe probar el ZIP en una publicación de prueba antes de sustituir la versión productiva.

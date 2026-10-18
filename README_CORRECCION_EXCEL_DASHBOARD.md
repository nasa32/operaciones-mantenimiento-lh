# Corrección focalizada — Dashboard Excel OPS Mantenimiento

Esta actualización parte de la versión 4.3.0 y se limita al módulo de informe general Excel y a los filtros del módulo Informes y Excel.

## Cambios
- Nuevo formulario de exportación general con fechas, técnico, área, tipo de mantenimiento y estado de OT.
- El servidor aplica los filtros seleccionados antes de construir el informe.
- El archivo se organiza en una sola hoja: indicadores principales, conteos por tipo/estado/área, tendencia mensual, desempeño por técnico y detalle de las OT.
- El detalle incluye datos de actividades, satisfacción, condición final del equipo, tiempos, observaciones y materiales disponibles.
- La exportación general Excel ya no intenta recuperar todas las fotografías desde el almacenamiento de evidencias; esas imágenes no son necesarias para el tablero y esta lectura adicional podía provocar fallos de exportación. La generación de expedientes PDF y sus evidencias se conserva sin cambios.
- Se conservan las funciones restantes del proyecto 4.3.0.

## Validación local
- `node --check` en `public/admin.js` y `netlify/functions/export.mjs`.
- Pruebas existentes: imágenes, informe de gestión PDF, actividades del checklist, regresión 502 al enviar OT y tipo de mantenimiento.

Los datos del archivo se generan desde las órdenes reales del sistema al ejecutar la exportación. El informe no inventa cantidades, costos de materiales ni disponibilidad histórica de equipos que no estén registrados.

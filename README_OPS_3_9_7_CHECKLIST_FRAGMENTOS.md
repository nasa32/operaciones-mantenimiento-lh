# OT Mantenimiento OPS 3.9.7 — Corrección de filas fragmentadas

- Conserva el número de actividad cuando PDF.js devuelve el número y una celda divisoria en una línea y la descripción en la siguiente.
- Evita que esas descripciones se anexen a la actividad anterior.
- Mantiene cantidad variable de actividades y excluye la sección de materiales del checklist.
- Cambia la caché de la PWA para solicitar el lector actualizado.

## Pruebas

Ejecutar `npm run test:pdf`. Incluye regresión para actividades 04, 06 y 08 separadas de sus descripciones por una línea de guiones.

Desplegar el ZIP completo en Netlify, incluyendo `netlify/functions`. Probar con el PDF original antes de sustituir el despliegue funcional.

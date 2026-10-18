# OPS 4.2.3 — Mostrar solo la respuesta del técnico

Cambios acotados al texto de presentación de comentarios por actividad:
- En el expediente PDF, el encabezado de la columna ahora es `RESPUESTA`.
- El contenido muestra únicamente la respuesta escrita; si un comentario antiguo empieza con `Comentario del técnico:`, se elimina ese prefijo al mostrarlo.
- Las vistas de lectura del administrador y técnico tampoco repiten ese prefijo.
- No se modificaron el guardado de comentarios, el lector PDF, el flujo de fotografías, las órdenes, ni el archivo histórico.

Pruebas locales: `node --check` para los módulos JavaScript y pruebas existentes de actividades PDF y formatos de imagen. Esto no sustituye una prueba de despliegue real en Netlify.

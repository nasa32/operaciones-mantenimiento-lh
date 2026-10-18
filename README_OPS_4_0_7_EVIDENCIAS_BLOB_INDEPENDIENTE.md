# OPS 4.0.7 — Evidencias fotográficas en Blobs independientes

## Alcance estricto
Este ajuste se limita al almacenamiento, recuperación, validación y exportación de evidencias fotográficas. No modifica el inicio de sesión, asignación de OT, extracción de actividades ni la interfaz de otras funciones.

## Qué cambia
- Cada fotografía nueva se guarda en un Blob independiente con una clave única basada en la OT y el ID de la evidencia.
- Antes de confirmar la carga, el servidor vuelve a leer el Blob y verifica que los datos coincidan.
- El registro de la OT guarda metadatos y referencias, no el contenido base64 de todas las fotos.
- Al enviar para revisión, el servidor comprueba que las imágenes se puedan recuperar y que exista al menos una imagen válida por etapa: ANTES, DURANTE y DESPUÉS.
- El expediente PDF recupera las imágenes desde los Blobs independientes y las incorpora al reporte.
- La lectura migra de forma perezosa las evidencias existentes que estaban incrustadas en el registro de la OT o guardadas en el formato anterior por etapa.
- La eliminación de una evidencia elimina también su Blob individual y sus referencias heredadas.

## Pruebas locales
Se ejecutaron las pruebas de formatos de imagen y extracción del checklist; ambas suites pasan. También se verificó la sintaxis de las funciones modificadas.

## Validación necesaria tras desplegar
Las pruebas locales no pueden confirmar el almacenamiento real de Netlify. Después de publicar, probar una OT de prueba con una foto en cada etapa, enviarla inmediatamente a revisión y descargar el expediente PDF. Confirmar que las tres imágenes aparecen en el PDF y que el administrador puede abrirlas.

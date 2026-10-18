# OT Mantenimiento OPS 3.9.3 — Envío a revisión robusto

## Cambios
- Se desactiva la validación nativa silenciosa del formulario para mostrar mensajes claros cuando falta un campo.
- Se guardan primero el checklist, comentarios, fecha, horas, materiales y satisfacción antes de subir las fotos.
- Se envían las fotografías pendientes una por una, mostrando en qué etapa ocurre un error y conservando la selección si falla.
- Tras cargar las fotos, se consulta de nuevo la OT en el servidor y se comprueba que haya evidencia guardada en ANTES, DURANTE y DESPUÉS antes de solicitar revisión.
- Los errores de conexión o respuestas no JSON del servidor se muestran con más detalle.
- Se actualizó el nombre de caché del service worker.

## Pruebas pendientes en Netlify
Desplegar el ZIP completo y probar en un dispositivo móvil una OT de prueba con una foto por etapa, confirmar que pasa a EN REVISIÓN y que el administrador ve las tres fotos. Esta comprobación local no sustituye la prueba real del backend Netlify/Blobs.

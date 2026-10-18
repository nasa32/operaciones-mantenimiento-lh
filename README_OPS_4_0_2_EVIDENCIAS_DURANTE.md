# OT Mantenimiento OPS 4.0.2 — Corrección de evidencia DURANTE

## Alcance
Esta versión se enfoca en el error recurrente en el que la aplicación informa que las tres fotos fueron cargadas, pero al enviar la OT el servidor afirma que falta DURANTE.

## Cambios técnicos
- Las evidencias nuevas se guardan en un almacén Netlify Blobs separado (`ot-mantenimiento-evidences-v1`), por orden y etapa (`BEFORE`, `DURING`, `AFTER`).
- El registro principal de la OT conserva metadatos de evidencia, no el contenido base64 de las imágenes.
- La confirmación de carga se devuelve solo después de que finalice la escritura de la evidencia en su almacén.
- La validación de envío consulta los registros independientes de las tres etapas, además de reconocer las evidencias antiguas guardadas en el registro principal.
- Al guardar un borrador o cargar una nueva foto, las evidencias antiguas embebidas se migran al almacén por etapa para mantener compatibilidad.
- La pantalla del técnico y la exportación PDF/Excel vuelven a hidratar las evidencias para mostrarlas y exportarlas.
- El borrado de una foto elimina la evidencia del registro de su etapa y los metadatos asociados.
- Se actualizó el nombre de caché del service worker para forzar la descarga de los archivos estáticos nuevos.

## Despliegue
Desplegar el proyecto completo en Netlify, incluidas `netlify/functions` y `netlify/lib`. No subir solo la carpeta `public`. Las variables de entorno no se modifican en esta versión.

## Verificación recomendada
1. En una OT de prueba, cargar una foto en ANTES, DURANTE y DESPUÉS.
2. Usar Guardar avance y confirmar que las fotos siguen visibles.
3. Enviar a revisión.
4. Confirmar que el administrador puede ver las tres etapas y descargar el expediente.

## Nota
La sintaxis JavaScript se validó localmente. La comprobación final debe hacerse en el sitio Netlify publicado, porque el entorno local no tiene acceso al almacén remoto de Netlify Blobs.

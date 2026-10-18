# OT Mantenimiento OPS 4.0.4 — auditoría y estabilización

## Cambios principales
- La ficha principal de la OT vuelve a ser la fuente autoritativa para las fotos nuevas, siguiendo el flujo de la base funcional 1.5.0.
- Se conserva compatibilidad de lectura con fotos de las versiones 4.0.2/4.0.3 que estén en el almacén separado de evidencias.
- El guardado del borrador conserva las imágenes completas en la OT.
- La eliminación quita la imagen del registro principal y de los registros heredados para evitar que reaparezca.
- El envío valida las etapas ANTES, DURANTE y DESPUÉS contra el registro completo de la OT.
- Las listas de órdenes ya no descargan los datos base64 de fotos ni el PDF original. El expediente individual sí los carga para visualizar y exportar las evidencias.
- Si la pantalla del técnico no puede verificar una etapa después de los reintentos, se detiene antes de enviar la OT y señala solo la etapa pendiente.
- Se actualizó la versión de caché del service worker a 4.0.4.

## Pruebas locales
- Sintaxis de JavaScript y módulos del servidor.
- Pruebas automatizadas del lector PDF: 10 actividades de OT 0042, sin nombres ni especialidades, duplicados conservados y conteos variables.
- Pruebas locales de flujo API: creación, carga de las tres etapas, guardado de borrador, envío a revisión, listado sin payload de fotos y lectura de expediente con fotos.

## Despliegue
Desplegar el proyecto completo en Netlify, incluida la carpeta `netlify/functions`. Las funciones no se actualizan al publicar únicamente los archivos estáticos.

## Nota de compatibilidad
Las fotos guardadas en la base de datos principal se conservan. Para órdenes creadas en 4.0.2/4.0.3, la función combina los metadatos del registro principal con las evidencias heredadas cuando estas todavía estén disponibles en Netlify Blobs. Se recomienda probar primero con una OT de prueba.

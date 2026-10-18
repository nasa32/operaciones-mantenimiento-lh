# OT Mantenimiento OPS 3.9.2 — Conversión HEIC/HEIF

## Corrección
- Las fotos HEIC/HEIF seleccionadas desde la galería o capturadas por el celular se convierten a JPG antes de generar la vista previa.
- La conversión se ejecuta en el navegador usando `heic2any` cargado desde jsDelivr, con respaldo en unpkg.
- El JPG convertido continúa por el flujo existente de reducción de tamaño y envío como evidencia.
- Se conserva la validación de foto obligatoria en ANTES, DURANTE y DESPUÉS, así como la opción de quitar fotos.
- Se cambió el nombre de caché del service worker para forzar que se descargue el código actualizado.

## Importante
La conversión HEIC necesita conexión a internet para cargar la librería la primera vez. Si ambos CDN están bloqueados, el sistema muestra un mensaje para volver a intentar o configurar la cámara para guardar en JPG. Las imágenes JPG/PNG siguen usando el flujo normal.

## Prueba recomendada después de desplegar
1. En un teléfono que produzca HEIC, abre una OT y elige una foto HEIC desde galería.
2. Verifica que aparezca una vista previa JPG.
3. Quita la foto y confirma que desaparece.
4. Vuelve a cargarla en ANTES, DURANTE y DESPUÉS, envía la OT de prueba y comprueba las evidencias desde administrador.

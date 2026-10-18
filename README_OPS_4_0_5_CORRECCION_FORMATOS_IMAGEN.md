# OPS 4.0.5 — Corrección localizada de preparación de imágenes

Esta versión modifica exclusivamente la ruta de selección, detección, decodificación y compresión de fotografías del técnico, junto con la versión de caché para que el navegador actualice `tecnico.js`.

## Cambios
- Identifica formatos por firma binaria real y no solo por extensión o MIME.
- Detecta JPEG, PNG, WebP, GIF, BMP, TIFF, AVIF y contenedores HEIC/HEIF.
- Convierte HEIC/HEIF detectado por contenido aunque el archivo tenga nombre `.jpg`.
- Corrige el MIME de imágenes conocidas cuando la galería lo entrega vacío o incorrecto.
- Decodifica con `createImageBitmap`, luego `blob:` y después `data:` URL; verifica dimensiones antes de continuar.
- La selección valida que la imagen se pueda abrir antes de agregarla a la evidencia.
- Errores específicos por formato no compatible, en vez de atribuir todos los fallos a HEIC.
- No modifica el lector PDF, checklist, estados, APIs, persistencia de órdenes ni el flujo de revisión.

## Pruebas ejecutadas en este entorno
- `node --check public/tecnico.js` — aprobado.
- `node tests/image-format.test.cjs` — aprobado: detección por firma de JPEG, PNG, WebP, GIF, BMP y AVIF, además de casos con extensión/MIME engañosos.
- Las seis muestras derivadas de la foto real se decodificaron y re-encodearon con el decodificador de imágenes Sharp en el entorno de trabajo.
- La foto original `1000847189.jpg` se verificó como JPEG y se pudo decodificar.

## Limitación de la validación
No se pudo ejecutar un navegador Chromium interactivo/headless en este entorno (el proceso no finalizó), así que no se afirma una prueba de interfaz real en Android. Tampoco se adjuntó un archivo HEIC auténtico para probar la conversión de extremo a extremo. La conversión HEIC/HEIF sigue usando `heic2any` desde CDN, por lo que requiere conectividad en el momento de convertir. Los formatos JPEG/PNG/WebP/GIF/BMP/AVIF se validaron por firma y decodificación local; la apertura final de AVIF depende del soporte del navegador instalado.


## Diagnóstico adicional: error de DURANTE en Xiaomi/Redmi

Se identificó que el mensaje «El servidor verificó las evidencias y no encontró una foto válida en DURANTE» se genera en la validación del servidor al enviar la OT. No es un mensaje del decodificador de imágenes. El código guardaba la evidencia y luego consultaba Netlify Blobs con consistencia predeterminada, lo que podía permitir una lectura inmediatamente posterior que todavía no reflejara la última escritura.

Corrección acotada en esta revisión: configurar los almacenes de Netlify Blobs usados por la aplicación con `consistency: "strong"` para que la lectura de verificación observe las escrituras confirmadas. No se cambió el lector PDF, el checklist, los estados, la interfaz ni el flujo de revisión.

Validación local: pruebas de formatos de imagen y del lector PDF, y comprobaciones de sintaxis JavaScript. La confirmación final debe hacerse en el despliegue real de Netlify y en el Redmi que presentó el error, porque este entorno no puede acceder a la cuenta/almacenamiento de producción.

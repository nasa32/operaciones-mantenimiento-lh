# OT Mantenimiento OPS 3.9 — Corrección de evidencias

## Cambios
- Mejor lectura y preparación de fotos tomadas con cámara o seleccionadas desde la galería.
- Normalización de las imágenes a JPG antes de enviarlas al servidor.
- Redimensionamiento y compresión progresiva para ajustarse al límite del backend.
- Vista previa independiente para ANTES, DURANTE y DESPUÉS.
- Botón **Quitar foto** en cada imagen local para corregir selecciones equivocadas antes de enviarlas.
- Las fotos ya guardadas en una OT editable también se muestran y pueden eliminarse individualmente, con confirmación.
- La API registra la eliminación en el historial y bloquea la eliminación de evidencias cuando la OT ya está en revisión o aceptada.
- El envío sigue exigiendo al menos una evidencia en cada etapa: ANTES, DURANTE y DESPUÉS.
- Se actualizó el nombre de caché del service worker para que los dispositivos reciban los archivos nuevos.

## Despliegue
Desplegar el proyecto completo con Netlify Functions habilitadas. Conservar la versión anterior como respaldo. Después del despliegue, cerrar y volver a abrir la PWA o actualizar la página en el navegador.

## Pruebas realizadas
- `node --check public/tecnico.js`
- `node --check netlify/functions/orders.mjs`
- `node --check public/admin.js`
- `node tests/pdf-activities.test.cjs`

Las pruebas anteriores validan sintaxis y el test existente del lector PDF. La cámara física, formatos particulares del teléfono y el flujo de almacenamiento deben confirmarse en el dispositivo real después del despliegue.

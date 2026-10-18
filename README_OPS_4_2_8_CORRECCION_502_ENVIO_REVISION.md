# OT Mantenimiento OPS 4.2.8 — Corrección envío a revisión / 502

## Cambios
- La función `orders` ya no vuelve a hidratar y adjuntar las fotografías en base64 a la respuesta del envío SUBMIT. Devuelve la confirmación de la OT y los metadatos de evidencias, después de guardar el estado `IN_REVIEW`.
- El panel del técnico deja de reabrir inmediatamente el expediente completo después de enviar la OT. Actualiza la lista y muestra confirmación, evitando que un fallo posterior al envío al recuperar imágenes parezca un fallo del propio envío.
- Se conservan las validaciones de checklist, fecha y horas, evaluación, estado final y las tres etapas de evidencia.

## Verificación local
- `node --check netlify/functions/orders.mjs`: aprobado.
- `node --check public/tecnico.js`: aprobado.
- `npm run test:pdf`: aprobado.
- `npm run test:images`: aprobado.
- `npm run test:management-report`: aprobado.

## Limitación
No se ha ejecutado un despliegue real de Netlify ni una prueba end-to-end con Blobs en el sitio del usuario. Después de desplegar, verificar con una OT de prueba y revisar `Cloud compute > Functions > orders` si persiste un 502.

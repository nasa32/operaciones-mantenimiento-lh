# OT Mantenimiento OPS 3.9.4 — Confirmación de evidencias

## Correcciones
- Evita depender de una lectura GET inmediata única para verificar fotos recién guardadas.
- Cada respuesta de carga debe incluir la orden y confirmar que contiene la evidencia de la etapa que se acaba de subir.
- Si una etapa no aparece en la respuesta confirmada, hace hasta tres consultas adicionales sin caché antes de detener el envío.
- La validación del servidor sigue exigiendo evidencia persistida en ANTES, DURANTE y DESPUÉS; no se omiten controles de seguridad.
- Respuesta de carga incluye `savedEvidence` con identificador y etapa guardada.
- Se actualizó el nombre de caché de la PWA.

## Pruebas
Validar sintaxis con `node --check public/tecnico.js` y `node --check netlify/functions/orders.mjs`. Ejecutar `npm run test:pdf`.

## Prueba pendiente
Desplegar en Netlify y probar con una OT de prueba y fotografías reales de cámara/galería. Esta corrección no se considera validada en producción hasta completar esa prueba.

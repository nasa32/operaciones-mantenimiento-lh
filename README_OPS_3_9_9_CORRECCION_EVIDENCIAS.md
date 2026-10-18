# OT Mantenimiento OPS 3.9.9 — Confirmación de evidencias

- La interfaz valida la respuesta explícita `savedEvidence` que devuelve el servidor después de guardar la evidencia, en lugar de depender exclusivamente del array de evidencias de la respuesta completa.
- Se normalizan nombres de etapa en inglés y español (BEFORE/ANTES, DURING/DURANTE, AFTER/DESPUES) para compatibilidad con órdenes ya guardadas.
- La comprobación final y el servidor reconocen estas variantes.
- Si el servidor rechaza el envío porque una etapa no está guardada, devuelve un mensaje que identifica la etapa faltante.
- Conserva la validación obligatoria de las tres etapas; no permite enviar una OT sin evidencias persistidas.

Desplegar el ZIP completo en Netlify. Probar con una OT de prueba y verificar las fotos en la vista del técnico y del administrador antes de dar la corrección por validada en producción.

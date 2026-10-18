# OT Mantenimiento OPS 4.2.9 — corrección del error 502 al enviar a revisión

## Causa identificada
En `netlify/functions/orders.mjs`, las acciones `SAVE_DRAFT` y `SUBMIT` invocaban `cleanTechnicianResponse(...)`, pero esa función no estaba definida en el archivo. Al ejecutar el envío, Node.js lanzaba `ReferenceError: cleanTechnicianResponse is not defined`, que puede aparecer al usuario como HTTP 502.

## Corrección
- Se definió `cleanTechnicianResponse` en la función de órdenes.
- Se mantiene la limpieza de los prefijos “Respuesta del técnico:” y “Comentario del técnico:” sin modificar el texto real.
- Se agregó prueba de regresión `npm run test:submit-502`.

## Pruebas
La prueba local verifica la existencia y uso del helper, la ruta SUBMIT y la transición a `IN_REVIEW`. Debe validarse además en el despliegue Netlify de prueba; no se afirma que se haya probado en producción.

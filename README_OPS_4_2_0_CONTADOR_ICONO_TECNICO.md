# OPS 4.2.0 — Contador de OT pendientes en el icono

Cambio focalizado sobre OPS 4.1.9.

- Conserva los iconos existentes: llave y destornillador amarillos, fondo azul industrial y borde blanco. No se redibujan ni reemplazan los PNG de icono.
- Usa la API de insignia de la PWA (`navigator.setAppBadge` / `clearAppBadge`) cuando el navegador y el sistema la admiten.
- El contador solo incluye órdenes `ASSIGNED` y `RETURNED`: pendientes de iniciar o devueltas para corrección. No cuenta órdenes `IN_PROGRESS`, `IN_REVIEW` ni `ACCEPTED`.
- Actualiza al cargar la lista, cada 60 segundos mientras la página está abierta y al volver a la aplicación.
- Se cambia la caché del service worker para evitar conservar archivos antiguos.

Limitación: sin notificaciones push configuradas, el icono no puede refrescarse en tiempo real mientras la PWA está totalmente cerrada. La insignia depende del soporte de Android/navegador/lanzador. La versión requiere pruebas en el dispositivo real.

Validaciones recomendadas: `node --check public/tecnico.js`, `node --check netlify/functions/orders.mjs`, `npm run test:pdf`, `npm run test:images`. No se modifican funciones de almacenamiento de evidencias, revisión, PDF ni exportación.

# OT Mantenimiento OPS 4.0.3 — Icono y contador de pendientes

- Se integra el icono oficial azul, con borde blanco y llave inglesa/destornillador amarillos, sin número fijo dibujado.
- Se actualizan los iconos PNG de 192 y 512 px, manifest PWA, apple-touch-icon y caché del service worker.
- En el panel del técnico aparece un contador rojo y una tarjeta con el número de OT pendientes.
- En navegadores compatibles con la API Badging se llama a `navigator.setAppBadge(count)` para actualizar el contador del icono instalado; cuando no hay pendientes se limpia con `clearAppBadge()`.
- El contador considera pendientes las OT en estados `ASSIGNED`, `IN_PROGRESS` y `RETURNED`.
- Mientras la app está abierta, el contador se refresca cada 60 segundos sin redibujar toda la lista.

Nota: el número nativo sobre el icono depende del soporte del sistema operativo/navegador. El contador dentro de la app funciona como alternativa. Esta versión no incorpora notificaciones push con la aplicación cerrada.

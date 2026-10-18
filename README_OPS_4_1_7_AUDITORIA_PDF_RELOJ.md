# OPS 4.1.7 — Robustez de expediente PDF y actualización de reloj

- El texto enviado a las fuentes estándar del PDF se normaliza para evitar que caracteres Unicode no compatibles en datos de OT interrumpan la generación. Se conservan acentos latinos y se reemplazan símbolos no admitidos por alternativas seguras.
- Se conserva la lógica de incorporar el PDF original al final del expediente; si ese anexo falla, el reporte de respuesta debe poder descargarse.
- Se incrementó el nombre de caché del service worker para obligar a instalar los recursos actualizados en dispositivos que conservan una versión anterior.
- El selector AM/PM ya está definido en `public/tecnico.js`; el cambio de caché ayuda a que los celulares reciban ese código en vez de usar un JS antiguo.

## Validaciones locales
- `node --check netlify/functions/export.mjs`
- `node --check public/tecnico.js`
- `node --check public/sw.js`
- Pruebas de lector de actividades, formatos de imágenes e integridad ZIP.

## Pendiente
La generación de un expediente real con la OT del usuario debe probarse en Netlify. Esta versión no se considera verificada en producción hasta confirmar descarga, fotos y anexo original.

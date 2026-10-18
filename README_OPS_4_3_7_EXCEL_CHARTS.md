# OPS MANTENIMIENTO 4.3.7 — Gráficos nativos del Excel

Cambio exclusivo del generador de `management-excel` en `netlify/functions/export.mjs`. Se agregan gráficos nativos al libro XLSX del dashboard mediante la inserción de partes DrawingML y relaciones del paquete Office Open XML.

- Agregada dependencia `jszip` para completar el paquete XLSX con gráficos nativos.
- Añadidos gráficos de tipo de mantenimiento, estado de OT, área, evolución mensual, estado final del equipo y satisfacción.
- Los gráficos toman sus categorías y valores de las tablas resumen existentes de la hoja Dashboard ejecutivo.
- Se mantienen las hojas de detalle y análisis por técnico.
- No se modifican los flujos de órdenes ni el generador del expediente PDF.

Validación local: `node --check netlify/functions/export.mjs` y las cinco pruebas existentes pasan. La validación final de apertura y renderizado de gráficos debe hacerse en Excel tras desplegar, porque este entorno no dispone de instalación de dependencias ni de Excel/LibreOffice para abrir el archivo final.

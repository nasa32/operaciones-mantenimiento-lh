# OPS 4.1.9 — Archivo, navegación y eliminación controlada

Cambios focalizados sobre OPS 4.1.8:
- Admin: archivar manualmente solo OT aceptadas, consultar archivo histórico, buscar por número/equipo/área/técnico y restaurar.
- Admin: eliminar definitivamente solo OT asignadas (ASSIGNED), no manuales, sin evidencias ni señales de ejecución. Las demás deben archivarse o mantenerse.
- Técnico: vistas separadas por pendientes/en ejecución/devueltas, en revisión y aceptadas. Las aceptadas se muestran en su propia pestaña automáticamente.
- Backend: autorización de rol admin para archivar/restaurar/eliminar; las órdenes archivadas siguen en la base de datos y exportación general.
- No se modifica el almacenamiento de evidencias ni el generador PDF.

Validación: node --check para orders.mjs, admin.js y tecnico.js; pruebas existentes test:pdf y test:images.
Pendiente: prueba funcional en Netlify con una copia de producción y datos reales. Antes de publicar, conservar ZIP anterior y no cambiar variables ni almacenamiento de Blobs.

# OPS MANTENIMIENTO 4.3.2 — Continuidad del expediente PDF

## Cambio puntual
Se modificó únicamente `netlify/functions/export.mjs` para el expediente PDF individual:
- Las evidencias fotográficas continúan en el espacio disponible después del checklist.
- Materiales, observaciones, evaluación del cliente y respuesta general siguen el flujo vertical del contenido.
- Se crea una página nueva cuando el siguiente bloque no cabe en el espacio útil.
- Las tres evidencias se mantienen en una fila y cada bloque conserva su contenido.

No se modificaron la interfaz, la gestión de órdenes, el lector de PDF, el flujo de evidencias, el informe general ni la exportación Excel.

## Validaciones ejecutadas
- `node --check netlify/functions/export.mjs`
- `npm run test:pdf`
- `npm run test:images`
- `npm run test:management-report`
- `npm run test:submit-502`
- `npm run test:maintenance-type`

Todas las validaciones finalizaron correctamente. La generación debe verificarse con órdenes reales tras desplegar el ZIP en Netlify; no se realizó despliegue desde este entorno.

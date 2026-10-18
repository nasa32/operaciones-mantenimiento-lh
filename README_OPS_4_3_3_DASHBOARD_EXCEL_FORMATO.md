# OPS MANTENIMIENTO 4.3.3 — formato del dashboard Excel

## Alcance
- Ajusta únicamente la presentación del archivo Excel del informe general.
- Agrega estilos corporativos (azul oscuro, azul y amarillo industrial), bandas de título, mejor jerarquía visual, encabezados de tabla, filas alternadas, filtros y congelación de encabezados.
- Conserva el contenido de las órdenes y los parámetros de filtrado por fechas, técnico, área, tipo y estado que ya recibe el endpoint.
- Usa `xlsx-js-style` para escribir estilos de celdas.

## Validación
- `node --check netlify/functions/export.mjs`
- `npm run test:management-report`
- `npm run test:pdf`
- `npm run test:images`
- `npm run test:submit-502`
- `npm run test:maintenance-type`

Las cinco pruebas existentes pasaron. No se validó una descarga real contra datos del Netlify de producción.

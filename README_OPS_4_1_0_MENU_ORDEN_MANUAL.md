# OPS 4.1.0 — Menú administrativo y órdenes manuales

## Alcance
- Agrega navegación lateral administrativa azul industrial con acentos amarillos, adaptable a móvil.
- Conserva el logo original de Lake House (`public/lake-house-logo.jpg`).
- Agrega al técnico un formulario para registrar trabajos espontáneos.
- El servidor asigna un número único `OT-M-YYYYMMDD-XXXXXXXXXXXX` a cada orden manual.
- La orden manual queda asociada al técnico autenticado, marcada con `origin: MANUAL`, y enviada a revisión tras guardar evidencias de ANTES, DURANTE y DESPUÉS.
- En administración se agrega una sección independiente “Órdenes manuales” con búsqueda, filtro de estado y acceso al expediente.
- No cambia el flujo existente de creación administrativa de órdenes con PDF.

## Validaciones
Ejecutar `npm test` (pruebas definidas: `npm run test:images` y `npm run test:pdf`) y `node --check` para los scripts JS y funciones `.mjs`.

## Nota sobre numeración
La numeración manual es generada exclusivamente en el servidor con fecha y sufijo aleatorio de 48 bits; se comprueba contra los números existentes antes de guardar. No depende del texto ingresado por el técnico.

# OT Mantenimiento OPS 4.2.7 — Reemplazo completo al seleccionar otro PDF

## Cambio principal
Al seleccionar un nuevo PDF en el formulario de creación de OT, la aplicación ahora solicita confirmación para reemplazar la orden completa del formulario. Si se confirma, limpia y vuelve a llenar número de OT, tipo de mantenimiento, área, equipo, descripción y checklist con los datos extraídos del nuevo PDF. Los campos no detectados se dejan vacíos para evitar mezclar datos de dos órdenes.

## Técnico
El selector de técnico incluye una opción inicial vacía. Si el PDF contiene un campo de técnico que coincide exactamente con un usuario activo, se selecciona; si no se detecta o no coincide, queda sin seleccionar y el administrador debe elegirlo antes de crear la OT. Esto evita conservar por accidente el técnico de la orden anterior.

## Cancelación y error de lectura
Si el administrador cancela el reemplazo, se conserva el formulario anterior y se limpia la selección del archivo nuevo para evitar asociar datos anteriores con el PDF equivocado. Si el lector falla, los campos se limpian para evitar mezclar datos antiguos con el nuevo archivo.

## Pruebas locales
- `node --check public/admin.js`
- `node --check public/pdf-reader.js`
- `npm run test:pdf`
- `npm run test:images`
- `npm run test:management-report`

Las pruebas locales no equivalen a una validación en el sitio de producción de Netlify. Se recomienda desplegar primero como prueba y verificar con dos PDFs distintos antes de reemplazar la versión activa.

# OT Mantenimiento OPS 3.8 — Checklist dinámico y menú interactivo

## Cambios incluidos
- El checklist se genera con la cantidad de actividades que se extraiga de la tabla del PDF; no se exige una cantidad fija.
- El lector acepta el número y la descripción en la misma línea o en líneas separadas cuando el extractor del PDF separa la celda numérica del texto.
- Se conservan el orden por número, la advertencia de saltos/duplicados y la exclusión de la sección de materiales/repuestos/insumos.
- Se añadieron pruebas automatizadas para órdenes de 3, 7, 10, 17 y 25 actividades, así como para el número separado de la descripción.
- El administrador inicia en un menú de navegación con tarjetas interactivas: Dashboard, Crear y asignar OT, Órdenes de trabajo e Informes/Excel. Cada vista incluye el botón «Volver al menú».
- Se actualizó la caché de la PWA para forzar la carga de la nueva interfaz y lector.

## Importante sobre la extracción
El lector extrae el texto disponible en PDF seleccionables. Si el PDF está escaneado como imagen, se requiere OCR, que no se incorpora en esta versión. El conteo es dinámico y no asume que todas las OT tengan 10 actividades. Los saltos de numeración se reportan para revisión; no se inventan tareas.

## Menú administrativo
La navegación activa solo los módulos ya disponibles en esta versión: dashboard, creación/asignación de OT, seguimiento de órdenes y exportación general. La administración editable de nombres/contraseñas no se presenta como una función terminada y queda fuera de este alcance.

## Pruebas ejecutadas
- `node tests/pdf-activities.test.cjs`: aprobado; casos variables y número separado.
- `node --check` para los JavaScript principales: aprobado.

## Despliegue
Desplegar el ZIP completo en Netlify con Netlify Functions habilitadas. No publicar únicamente `public/`. Conservar una copia de la versión actual y validar login, creación de OT, checklist, guardado del técnico y exportaciones antes de reemplazar producción.

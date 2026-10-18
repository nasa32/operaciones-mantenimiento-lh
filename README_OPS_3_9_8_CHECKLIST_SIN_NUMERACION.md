# OT Mantenimiento OPS 3.9.8 — Checklist independiente de numeración

## Corrección
- El lector ya no exige una secuencia consecutiva ni utiliza los números de fila para decidir si una actividad es válida.
- Dentro de la sección `Actividades de mantenimiento y/o servicio`, extrae las celdas con descripciones legibles y descarta números aislados, separadores, códigos de personal y columnas vecinas reconocibles.
- Se detiene en la sección de materiales/repuestos/insumos para no mezclarlos con el checklist.
- La pantalla informa cuántas actividades extrajo y pide revisar el resultado, sin advertir falsamente que faltan números.
- Se actualizó el nombre de caché del service worker.

## Pruebas
Ejecutar `npm run test:pdf`. Las pruebas incluyen cantidades variables, números y descripciones separados, códigos de columnas adyacentes, líneas divisorias, actividades sin numeración y exclusión de materiales.

## Despliegue
Desplegar el ZIP completo en Netlify, conservando `netlify/functions` y `netlify/lib`. Probar con el PDF original antes de sustituir el despliegue funcional. La extracción de PDFs escaneados como imagen todavía requiere OCR; este lector trabaja con texto seleccionable del PDF.

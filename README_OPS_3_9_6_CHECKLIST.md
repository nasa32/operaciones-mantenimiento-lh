# OT Mantenimiento OPS 3.9.6 — Corrección de filas del checklist

## Corrección
El lector ahora busca la primera celda de cada fila numerada que contenga una descripción válida, saltando celdas vacías, líneas divisorias y códigos de personal. Esto evita perder actividades cuando el PDF.js devuelve una fila como `04 | -------- | Descripción de actividad | REG-030 ...`.

## Verificación
Incluye prueba de regresión para 10 actividades, incluyendo los casos de las filas 4, 6 y 8 que podían descartarse por tener separadores antes de la descripción. La cantidad de actividades sigue siendo dinámica.

## Despliegue
Desplegar el proyecto completo en Netlify con sus funciones. Actualizar la caché de la PWA antes de validar el PDF real.

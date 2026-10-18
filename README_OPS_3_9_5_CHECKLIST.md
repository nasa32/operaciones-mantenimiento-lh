# OT Mantenimiento OPS 3.9.5 — Corrección del checklist

## Cambios
- Evita mezclar el texto de las actividades con códigos de otras columnas (por ejemplo REG-030), líneas de borde y separadores.
- Mejora la separación de celdas del PDF y el agrupamiento vertical de líneas para reducir la unión accidental de actividades distintas.
- Las continuaciones solo se agregan cuando parecen formar parte de la descripción de la actividad; no se anexan líneas de columnas vecinas ni separadores.
- Conserva el lector de cantidad variable y el resto de funciones del proyecto 3.9.4.

## Despliegue
Desplegar el contenido completo del ZIP en Netlify, incluidas las funciones del servidor. Conservar la versión anterior como respaldo y probar con el PDF original antes de reemplazar producción.

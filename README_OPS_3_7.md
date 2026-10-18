# OT Mantenimiento OPS 3.7 — Corrección de lectura del checklist PDF

## Correcciones de esta versión
- El lector reconoce actividades numeradas tanto con separador (`01 | Actividad`) como sin separador (`01 Actividad`).
- El análisis se limita a la sección “Actividades de mantenimiento” y se detiene al detectar la sección de materiales/repuestos/insumos.
- Cuenta las actividades encontradas y comprueba si la numeración inicia en 1 y es consecutiva.
- Informa al administrador si hay saltos en la numeración para que pueda comparar el checklist con el PDF original.
- Si el PDF contiene texto seleccionable pero no se detectan filas numeradas, muestra un error claro en vez de aceptar silenciosamente un checklist vacío.
- Se actualizó la clave de caché del service worker para evitar servir el lector antiguo en la PWA instalada.
- Se conserva la sección de “Materiales, repuestos e insumos utilizados” en la pantalla del técnico y en el expediente.

## Límite importante
La extracción solo puede confirmar lo que consigue leer del texto del PDF. Si el documento es un escaneo/imagen, requiere OCR, que no se incluye en esta versión. Siempre se debe comprobar que la cantidad detectada coincida con la tabla original antes de crear la OT.

## Prueba realizada
Se ejecutó una prueba automatizada del analizador con una tabla de ejemplo de 10 actividades numeradas del 01 al 10. El analizador devolvió 10 actividades, sin números faltantes y con secuencia completa. Esta prueba valida el patrón de numeración, pero no sustituye una prueba con el PDF original de la OT 0042.

## Despliegue
Desplegar el ZIP completo en Netlify con Netlify Functions habilitadas. No publicar solo la carpeta `public`. Conservar un respaldo de la versión 3.6 y verificar inicio de sesión, lectura de PDF, creación de OT, guardado del técnico y exportaciones antes de reemplazar producción.

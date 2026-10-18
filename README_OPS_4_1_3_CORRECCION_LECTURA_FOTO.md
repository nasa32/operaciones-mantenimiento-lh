# OPS 4.1.3 — Corrección puntual de lectura de fotografías

Base: OPS 4.1.2.

## Único cambio funcional
- En `public/tecnico.js`, se crea una copia independiente de los bytes de cada fotografía inmediatamente después de seleccionarla.
- Se aplica tanto a las órdenes asignadas como al formulario de OT manual, antes de detectar el formato, generar vista previa, convertir o comprimir.
- Si el navegador ya no permite leer la referencia temporal original, se muestra un mensaje claro para volver a seleccionar la foto.

No se modificaron los endpoints, la lógica de Netlify Blobs, los límites del servidor, la asignación de órdenes, el PDF, el informe, el reloj, los estilos ni el resto de la interfaz.

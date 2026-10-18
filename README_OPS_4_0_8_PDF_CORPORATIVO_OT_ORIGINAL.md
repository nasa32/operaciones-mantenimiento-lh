# OPS 4.0.8 — Expediente PDF corporativo + OT original

Cambios limitados al generador de reportes PDF:
- Rediseño de la primera página del expediente con estilo corporativo Lake House.
- Logotipo Lake House en el encabezado superior únicamente; no se repite en el pie.
- Evidencias ANTES, DURANTE y DESPUÉS en una fila compacta con imágenes de tamaño uniforme.
- Información técnica, checklist, materiales, respuesta, observaciones, satisfacción e historial organizados en bloques.
- El PDF original cargado por el administrador se adjunta después de la página del expediente, empezando en la página 2 y conservando todas sus páginas.
- Se mantienen las funciones existentes de carga y almacenamiento de evidencias y el resto del flujo de OT.

Validación local: `node --check netlify/functions/export.mjs`.
Pendiente: desplegar en Netlify y comprobar una OT real, especialmente que el PDF original aparezca a partir de la página 2 y que todas las fotos disponibles se incluyan en la primera página.

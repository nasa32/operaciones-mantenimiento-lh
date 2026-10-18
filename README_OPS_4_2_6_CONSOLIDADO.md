# OT Mantenimiento OPS 4.2.6 — consolidación de ajustes

## Cambios incluidos
- El panel de revisión administrativa muestra el contenido de la respuesta del técnico sin los prefijos accidentales «Respuesta del técnico:» o «Comentario del técnico:».
- El backend normaliza esa respuesta al guardar el borrador y al enviar la OT a revisión.
- Estado final obligatorio con exactamente tres opciones: Operativo, Inoperativo y En inspección. Se guarda en la OT y el informe general muestra el estado seleccionado.
- El informe general horizontal usa exclusivamente evidencia de la etapa DESPUÉS. Si falta, muestra «Falta foto DESPUÉS»; no sustituye con fotos de otras etapas.
- Los indicadores del informe incluyen total de intervenciones, equipos operativos y equipos inoperativos. Las órdenes en inspección se muestran en la tabla, pero no se cuentan como operativas ni inoperativas.
- El informe conserva el logo original de Lake House y no incluye checklist ni detalle de actividades.
- El expediente PDF de respuesta del técnico no anexa el PDF original de la OT.
- El generador de expediente valida el tamaño de texto para no pasar un booleano a `drawText` como tamaño de fuente.

## Pruebas locales
- `node --check` en los archivos JavaScript/MJS modificados.
- `npm run test:pdf` — aprobado.
- `npm run test:images` — aprobado.
- `npm run test:management-report` — aprobado.

No se pudo instalar `pdf-lib`/`xlsx` en este entorno por tiempo de espera, por lo que no se ejecutó una generación real de PDF aquí ni se probó el despliegue publicado de Netlify. Antes de sustituir producción, desplegar en el mismo proyecto y probar una OT real con fotos en las tres etapas, abrir el expediente PDF y generar el informe general con y sin foto DESPUÉS.

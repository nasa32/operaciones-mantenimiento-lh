# OPS 4.1.6 — Corrección de generación del expediente PDF

## Cambio puntual
- La generación del reporte de respuesta del técnico ya no se interrumpe si el PDF original está corrupto, cifrado, vacío o no puede incorporarse mediante `pdf-lib`.
- Cuando el PDF original es válido, se siguen anexando sus páginas al final del reporte.
- Si el anexo falla, el reporte del técnico se genera y el detalle queda registrado en los logs de Netlify. El PDF original no se elimina de la OT y se debe consultar por separado.
- Si hay un error recuperando evidencias del Blob, queda registrado en logs; el reporte puede generarse con las evidencias disponibles y se incluye un aviso para no dar por hecho que todas las fotos se incorporaron.
- No se cambiaron los módulos de captura/subida de fotos, selector horario, formulario de OT, login ni asignación.

## Validaciones ejecutadas
- `node --check netlify/functions/export.mjs`: correcto.
- `node tests/pdf-activities.test.cjs`: correcto.
- `node tests/image-format.test.cjs`: correcto.
- `unzip -t`: verificar al entregar.

## Pendiente
No se dispone de la OT real ni de acceso a la función desplegada de Netlify desde este entorno. La generación final debe probarse en un despliegue de prueba con una OT real. Si el PDF original no puede incorporarse, la respuesta del técnico debe seguir descargándose y el error de anexo aparecerá en los logs.

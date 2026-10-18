# OPS 4.1.2 — PDF de respuesta y carga inicial de OT

Cambios limitados: 
- El expediente PDF individual contiene únicamente la respuesta del técnico con el diseño corporativo, actividades, evidencias y cierre. Ya no se anexan las páginas del PDF original. El original sigue conservado en la OT y se puede abrir por separado.
- Se añade manejo controlado de errores para exportación PDF individual, con registro del error técnico en los logs de Netlify.
- El selector del PDF original se movió al comienzo del formulario de creación, en un bloque destacado a la derecha en pantallas amplias y arriba en móvil. La extracción existente continúa rellenando los campos que estén vacíos.

No se modificó la lógica de almacenamiento, carga, revisión o aceptación de fotografías.

Validar antes de producción: generar PDF de una OT aceptada con evidencias reales; comprobar que tenga solo las páginas del informe de respuesta; abrir PDF original desde su botón; seleccionar un PDF nuevo y confirmar la extracción de campos/checklist; asignar una OT y probar las evidencias ANTES/DURANTE/DESPUÉS.

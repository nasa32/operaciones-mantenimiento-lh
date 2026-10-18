# OPS 4.2.5 — Informe general horizontal de equipos

## Formato aprobado
- Encabezado con el archivo de logo original `public/lake-house-logo.jpg`.
- Periodo seleccionado e indicadores: total intervenido, operativo y fuera de servicio.
- Una fila horizontal por intervención con número de OT, equipo, área, tipo preventivo/correctivo, técnico, fecha, estado y fotografía al extremo derecho.
- No se imprime el checklist ni el detalle de actividades.
- Foto opcional por equipo: una imagen representativa prioriza DESPUÉS, luego DURANTE y finalmente ANTES; el administrador puede elegir no mostrar fotos.
- Los estados no registrados se muestran como `NO REGISTRADO`, sin inferir condiciones.

## Cambios
- `netlify/functions/export.mjs`: reemplaza el anexo fotográfico por una foto en línea en cada fila, añade tipo de mantenimiento, indicadores y carga local del logo del club.
- `public/admin.html`: el selector ahora permite una foto por equipo o ninguna.
- `tests/management-report.test.cjs`: contrato de campos del formato aprobado.

## Validación y limitaciones
La validación de sintaxis y pruebas de contrato no equivale a comprobar la generación en producción. Debe probarse en un despliegue de prueba con órdenes que tengan `type`, estado y fotos reales. La foto elegida es la primera evidencia disponible según prioridad DESPUÉS/DURANTE/ANTES.

- `public/sw.js`: cambia el identificador de caché a 4.2.5 para que el navegador solicite los archivos nuevos.

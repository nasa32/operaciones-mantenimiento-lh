# OT Mantenimiento OPS 3.5 — checklist numerado y materiales

## Cambios
- Icono PWA renovado: llave inglesa y destornillador amarillos sobre fondo azul industrial, con borde blanco. Se regeneraron los iconos 192×192 y 512×512.
- Lector PDF: el checklist solo toma filas numeradas dentro de la tabla “ACTIVIDADES DE MANTENIMIENTO Y/O SERVICIO” y se detiene al encontrar “MATERIALES - REPUESTOS - INSUMOS” u otra sección. Ignora textos sin numeración y otras tablas.
- La sección de materiales/repuestos/insumos no se convierte en actividades; se presenta al técnico como un campo de texto para registrar lo realmente utilizado.
- “Materiales, repuestos e insumos utilizados” se guarda al guardar avance o enviar a revisión, se muestra en el panel de administrador y se incluye en el PDF/Excel de exportación.
- Se actualizó el nombre de caché del service worker para que los dispositivos soliciten los nuevos archivos.

## Validación recomendada
Probar con un PDF real que contenga filas numeradas, un encabezado de materiales y otras secciones con números para confirmar que solo se extraigan las actividades del cuadro indicado. También verificar guardar avance, enviar a revisión y exportar PDF/Excel.

Nota: no se ha ejecutado una prueba contra el sitio publicado de Netlify.

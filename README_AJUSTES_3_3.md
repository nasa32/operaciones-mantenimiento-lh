# OT Mantenimiento OPS 3.3 — Cambios

## Checklist por actividad
- Se añadió un campo de comentario para cada actividad.
- El comentario se guarda junto con el estado de la actividad y se muestra al administrador.
- Los comentarios se incluyen en el expediente PDF y en la hoja Checklist de Excel.

## Datos de ejecución
- Fecha de ejecución.
- Hora de inicio.
- Hora de finalización.
- Se valida que los campos sean obligatorios al enviar la OT y que la hora final no sea anterior a la hora de inicio.

## Evaluación del cliente
- ☹️ Insatisfecho.
- 🙂 Satisfecho.
- 😄 Muy satisfecho.
- La selección queda guardada en la OT, se muestra en el panel administrativo y se exporta a PDF/Excel para indicadores.

## Archivos ajustados
- `public/tecnico.js`: campos del técnico, comentarios, horas y evaluación.
- `public/admin.js`: visualización de los comentarios y resumen final.
- `public/styles.css`: estilos adaptables para móvil.
- `netlify/functions/orders.mjs`: persistencia y validación del servidor.
- `netlify/functions/export.mjs`: incorporación a PDF y Excel.
- `public/sw.js`: actualización de caché para que el navegador descargue la versión nueva.

La sintaxis JavaScript se revisó con Node.js y el ZIP se validó. Aún es necesario hacer la prueba funcional final en el sitio Netlify publicado.

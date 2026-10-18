# OT Mantenimiento - V1.3 PWA

Aplicación de órdenes de trabajo para Netlify.

## Novedad V1.3
- Aplicación instalable en Android/iPhone como icono en la pantalla de inicio.
- Manifest PWA, iconos y service worker.
- El acceso a las funciones de Netlify queda siempre en red; no se cachean respuestas de login ni datos de las OT.
- En la pantalla de login, cuando el navegador lo permite, aparece **Instalar en el celular**.

## Usuarios
- admin / AdminOT2026!
- tecnico01 / TecOT01#2026 ... tecnico10 / TecOT10#2026

## Publicación
1. En Netlify, Deploys -> Add deploy -> Deploy manually.
2. Sube el ZIP descomprimido o arrastra el contenido del proyecto según la interfaz disponible.
3. Abre la URL principal del sitio desde el celular.
4. En Android Chrome usa **Instalar aplicación** / **Agregar a pantalla de inicio**. En la página de login puede aparecer el botón **Instalar en el celular**.

## V1.4
- Selector de fotografías desde galería o cámara (sin `capture` obligatorio).
- Compresión automática de fotografías en el celular antes de enviarlas.
- Carga de cada evidencia por separado para evitar solicitudes pesadas y errores de almacenamiento/tamaño.
- Checklist móvil con casillas visibles y táctiles.
- Interfaz de técnico optimizada para pantallas pequeñas.


## OPS 3.3 — Comentarios, ejecución y satisfacción del cliente
- Cada actividad del checklist incluye un campo de comentario individual.
- El técnico registra fecha de ejecución, hora de inicio y hora de finalización.
- Se registra la evaluación del cliente: insatisfecho, satisfecho o muy satisfecho.
- Los datos se guardan en la OT y se incluyen en el expediente PDF y en la exportación Excel; los comentarios individuales aparecen en el PDF y en la hoja Checklist.
- Se valida que la hora final no sea anterior a la hora inicial.
- Se actualizó la caché del service worker para aplicar la interfaz nueva.

Nota: ejecutar pruebas reales en Netlify con una OT de prueba antes de sustituir la versión productiva.

## OPS 3.4 — Icono y evidencias móviles
- Icono PWA rediseñado con llave inglesa industrial amarilla/grafito.
- Campos de comentario sin texto de ejemplo preinsertado.
- Evidencias ANTES/DURANTE/DESPUÉS con botones separados para galería y cámara; las imágenes de ambas fuentes se combinan en la vista previa y el envío.
- Service worker actualizado para renovar la caché estática.
Consulte `README_AJUSTES_3_4.md` para pruebas recomendadas.

## OPS 3.6 — Dashboard e informes
- Panel administrativo ampliado con gráficos dinámicos por estado, área, tipo de mantenimiento y OT aceptadas por técnico.
- Indicadores de actividades realizadas/pendientes, materiales registrados y satisfacción del cliente.
- Exportación Excel organizada en once hojas para resumen, técnicos, detalle OT, actividades, materiales, categorías, satisfacción, evidencias e historial.
- Los materiales permanecen como texto libre y no se calculan cantidades/costos no capturados. Los gráficos dinámicos se presentan en el dashboard web; la librería XLSX actual no incrusta gráficos nativos en el Excel.
- Ver `README_OPS_3_6.md` para alcance y limitaciones.


## Actualización OPS 4.0.3
Se integra el icono oficial de herramientas amarillas sobre fondo azul con borde blanco, se actualiza el manifiesto PWA y se añade contador de OT pendientes para el técnico, incluida la API de contador nativo cuando el navegador la soporte.

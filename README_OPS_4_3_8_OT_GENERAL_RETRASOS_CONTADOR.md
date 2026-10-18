# OPS MANTENIMIENTO 4.3.8

## Cambios incluidos
- Nuevo flujo de creación y asignación de OT General con múltiples actividades y fecha individual por actividad.
- Vista de técnico para marcar actividades, adjuntar una evidencia fotográfica por tarea y guardar comentarios. La tarea solo puede marcarse completada si tiene evidencia registrada.
- Detección visual de retrasos en tareas de OT General y en OT específicas con fecha límite guardada.
- Contador de órdenes pendientes en la PWA: incluye órdenes asignadas, en ejecución o devueltas; baja cuando se envían a revisión o se aceptan. El contador del icono depende del soporte del navegador/SO.
- Campo opcional de fecha límite para nuevas OT específicas. Las OT antiguas sin fecha límite no pueden clasificarse con fiabilidad como retrasadas.
- El Excel registra el tipo de OT, fecha límite y actividades generales en sus totales por técnico.
- Se actualizó la caché del service worker para que los dispositivos descarguen los recursos nuevos.

## Verificación
Se comprobaron sintaxis de JavaScript/ESM y pruebas de regresión existentes, además de una prueba de contrato para el nuevo flujo OT General. No se desplegó en Netlify ni se probaron datos de producción.

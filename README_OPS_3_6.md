# OT Mantenimiento OPS 3.6 — Dashboard e informes

## Cambios
- Dashboard administrativo con gráficos de barras dinámicos por estado, área y tipo de mantenimiento.
- Indicadores de actividades del checklist realizadas y pendientes.
- Indicadores de órdenes con materiales registrados y cantidad de renglones informados.
- Resumen de evaluaciones de cliente por categoría.
- Gráfico de órdenes aceptadas por técnico (el dato representa conteo de OT aceptadas; no es una puntuación de productividad).
- Exportación Excel organizada en hojas: Resumen, Técnicos, Detalle OT, Actividades, Materiales, Por estado, Por área, Tipos mantenimiento, Satisfacción, Evidencias e Historial.
- La exportación diferencia el número de OT de las actividades del checklist y mantiene comentarios individuales.

## Consideraciones de datos
- Los materiales se registran como texto libre. El informe no inventa cantidades, unidades ni costos; esos campos se indican como por especificar hasta implementar un catálogo de inventario y captura estructurada.
- Las horas se totalizan solo cuando el formato registrado permite calcular una duración válida el mismo día. No se infieren turnos nocturnos.
- El Excel incluye tablas y hojas de datos preparadas para análisis. Los gráficos dinámicos de esta entrega se muestran en el dashboard web; la biblioteca XLSX incluida no incrusta gráficos nativos en el archivo Excel.
- La administración editable de nombres y contraseñas no está incluida en este incremento; las credenciales siguen gestionándose con el mecanismo existente.

## Despliegue
Desplegar el proyecto completo con Netlify Functions habilitadas. La carga estática por sí sola no publica `netlify/functions`. Mantener una copia de seguridad de la versión 3.5 y probar login, creación de OT, envío del técnico y exportaciones antes de sustituir producción.

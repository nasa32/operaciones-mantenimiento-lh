# Auditoría profunda — OT Mantenimiento OPS 4.0.4

## Referencias comparadas
- Base funcional: `DOC-20260929-WA0148.zip` (paquete V1.5 / OT-Mantenimiento 1).
- Versión auditada: `OT_MANTENIMIENTO_OPS_4.0.3_ICONO_OFICIAL_CONTADOR_PENDIENTES.zip`.
- Versión corregida: OPS 4.0.4.

## Hallazgos críticos en OPS 4.0.3
1. `UPLOAD_EVIDENCE` guardaba la imagen en un almacén Blob separado y devolvía `savedEvidence` con metadatos. El cliente añadía esos metadatos a la pantalla aun cuando la respuesta no contenía los bytes de la imagen. Eso podía mostrar una foto como guardada sin poder recuperarla.
2. La acción `SUBMIT` convertía `o.evidences` a metadatos con `metadataEvidence(ev)`, quitando `dataUrl` del registro principal. La validación y visualización dependían entonces de que el segundo almacén estuviera disponible y devolviera exactamente las imágenes.
3. Las consultas de lista hidrataban las evidencias completas. El contador del técnico consultaba la lista cada 60 segundos, por lo que se podían transferir de nuevo todas las fotos de todas las OT para calcular solo un número.
4. El almacén de usuarios se cambió a `ot-mantenimiento-users-v2` sin migrar las cuentas existentes del almacén anterior. Esto podía hacer que se ignoraran nombres o claves previamente configurados.

## Correcciones aplicadas en OPS 4.0.4
- La ficha principal de la OT vuelve a ser la fuente autoritativa de las nuevas fotografías, como en la base funcional 1.5.0.
- La acción de envío conserva los datos completos de las imágenes en la OT; no los sustituye por metadatos.
- La pantalla del técnico ya no acepta una confirmación de foto si el servidor no devuelve el `dataUrl` real de la evidencia.
- Si tras los reintentos falta una etapa, el formulario se detiene antes de enviar y señala la etapa concreta.
- Se conserva lectura compatible con evidencias de 4.0.2/4.0.3 almacenadas en el almacén separado.
- Las listas de órdenes devuelven metadatos, sin los bytes de las fotos ni el PDF original. El expediente individual sigue cargando las evidencias para técnico, administrador y exportaciones.
- Al eliminar una foto, se quita del registro principal y de cualquier registro heredado para que no reaparezca.
- Si el almacén nuevo de usuarios está vacío, se migran las cuentas existentes del almacén anterior antes de crear cuentas predeterminadas.
- Se actualizó la caché del service worker a 4.0.4.

## Pruebas locales realizadas
- Sintaxis de los archivos JavaScript y módulos del servidor.
- Lector PDF: 10 actividades de OT 0042; excluye nombres y especialidades; conserva actividades repetidas y admite diferentes cantidades y filas sin numeración.
- Flujo de API simulado: iniciar sesión, crear OT, cargar ANTES/DURANTE/DESPUÉS, eliminar y volver a cargar DURANTE, guardar borrador, enviar a revisión, consultar lista sin imágenes pesadas, abrir expediente con imágenes y aceptar desde administración.
- Compatibilidad: lectura y conservación de evidencias de la estructura separada anterior.
- Compatibilidad de cuentas: migración de usuarios antiguos.
- Manifiesto PWA, referencias de archivos locales e iconos de 192×192 y 512×512.

## Límites de esta auditoría
Las pruebas de flujo se ejecutaron localmente con un almacén Blob simulado. No equivalen a una prueba contra el sitio real de Netlify ni contra su almacenamiento de producción. La validación final requiere desplegar el proyecto completo, incluidas las funciones de `netlify/functions`, y probar con una OT de prueba.

## Pendientes funcionales detectados
- No se implementan notificaciones push cuando la PWA está cerrada. El contador dentro de la aplicación y el badge del navegador solo se actualizan cuando el navegador ejecuta el código y el dispositivo admite la API.
- El panel de administrador no incluye todavía una pantalla para cambiar nombres y contraseñas; `users.mjs` es de consulta.
- El Excel incluye hojas de resumen y detalle, pero no gráficos incrustados dentro del archivo XLSX. Los gráficos actuales están en el panel web.

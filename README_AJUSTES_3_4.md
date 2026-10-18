# OT Mantenimiento OPS 3.4 — icono, comentarios y evidencias

## Cambios
- Se rediseñaron los iconos PWA de 192×192 y 512×512: llave inglesa industrial oscura sobre fondo amarillo, con alto contraste.
- Se eliminó el texto de ejemplo (placeholder) de los campos de comentarios por actividad y observaciones generales; los campos vacíos se muestran en blanco y solo se conserva el texto que digite el técnico.
- Para cada etapa de evidencia (ANTES, DURANTE y DESPUÉS) se incorporaron dos controles independientes: **Elegir de galería** (múltiples imágenes) y **Tomar foto** (captura con `capture="environment"` en dispositivos/navegadores compatibles).
- La vista previa combina las imágenes seleccionadas desde ambos controles y el envío las procesa todas para la etapa correspondiente.
- Se actualizó la versión de caché del service worker para que los dispositivos soliciten los archivos estáticos nuevos.

## Prueba recomendada
1. Despliegue el proyecto completo con las funciones de Netlify.
2. En un teléfono, actualice la PWA o cierre y vuelva a abrirla para renovar la caché.
3. Abra una OT de prueba; verifique que los campos de comentario aparezcan vacíos.
4. En ANTES, DURANTE y DESPUÉS, seleccione una imagen desde galería y capture otra desde cámara. Confirme que ambas aparezcan en la vista previa y que el envío se complete.
5. Compruebe en el expediente del administrador que las fotos estén clasificadas en la etapa correcta.

Nota: el atributo `capture="environment"` solicita la cámara trasera en navegadores compatibles; la interfaz exacta depende del dispositivo y del navegador. No se alteró el backend ni el formato de las evidencias.

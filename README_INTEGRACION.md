# OT Mantenimiento OPS — Integración funcional + diseño industrial

## Base del proyecto
- Backend tomado del proyecto funcional DOC-20260929-WA0148: Netlify Functions y Netlify Blobs.
- Diseño industrial inspirado en ULTIMA: grafito, acero, amarillo de seguridad, tarjetas y estados claros.
- Login con selector de Administrador y Técnico 01–10.
- Lector PDF experimental en navegador: intenta extraer campos y actividades; el usuario debe verificar la vista previa. PDF escaneados sin texto seleccionable requieren OCR, que aún no está incluido.
- El expediente PDF y Excel usan las funciones de exportación del backend original.

## Despliegue
Este proyecto usa funciones de servidor en `netlify/functions` y almacenamiento Netlify Blobs. **Netlify Drop solo publica archivos estáticos y no es suficiente para desplegar estas funciones.** Para usarlo como aplicación completa, conecte esta carpeta a un repositorio Git y vincúlelo al sitio Netlify, con `netlify.toml` en la raíz. No hace falta usar el agente de IA.

Configuración de compilación: sin comando de build; directorio publicado `public`; funciones `netlify/functions`. Netlify debe instalar las dependencias de `package.json` para empaquetar las funciones.

## Credenciales iniciales
- `admin` / `AdminOT2026!`
- `tecnico01` / `TecOT01#2026` hasta `tecnico10` / `TecOT10#2026`

Son credenciales de demostración. El backend de referencia usa un secreto de reserva si no se configura `NETLIFY_DATABASE_SECRET`; esto evita el error de variable faltante, pero no es una configuración de seguridad recomendable para producción pública. Antes de uso real, configure un secreto robusto por un método compatible con el plan y revise el mecanismo de sesión.

## Pruebas necesarias antes de producción
1. Desplegar las funciones y confirmar `/.netlify/functions/login`, `users`, `orders` y `export`.
2. Probar los once accesos y permisos.
3. Probar lectura PDF con el formato oficial; verificar todos los campos y el checklist manualmente.
4. Probar creación, ejecución, fotos ANTES/DURANTE/DESPUÉS, envío a revisión, aceptación y expediente con PDF original adjunto.
5. Probar desde dos dispositivos para confirmar que Netlify Blobs comparte los datos.

# Corrección de inicio de sesión — OPS 3.1

## Qué corrige

La versión anterior guardaba las cuentas iniciales en el mismo almacén de Netlify Blobs que podía contener cuentas antiguas. Si ese registro ya existía, no volvía a inicializar las contraseñas predeterminadas, por lo que `admin / AdminOT2026!` podía ser rechazado.

Esta versión separa el almacén de usuarios (`ot-mantenimiento-users-v2`) del almacén principal de órdenes (`ot-mantenimiento`). Al estar vacío el almacén nuevo, se inicializan las 11 cuentas de demostración. Las órdenes existentes en el almacén principal no se eliminan ni se migran.

## Credenciales iniciales

- `admin` / `AdminOT2026!`
- `tecnico01` / `TecOT01#2026`
- ...
- `tecnico10` / `TecOT10#2026`

## Publicación

Este proyecto contiene Netlify Functions y Netlify Blobs. Debe publicarse mediante un despliegue de Netlify que procese `netlify.toml` y las funciones, no como archivos estáticos de Netlify Drop. Mantén el despliegue actual como respaldo.

## Nota de seguridad

Las contraseñas incluidas son credenciales de demostración. Cambia las contraseñas antes de usar el sistema con órdenes reales. No publiques secretos en el código ni compartas valores de variables de entorno.

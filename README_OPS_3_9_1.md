# OT Mantenimiento OPS 3.9.1 — corrección de fondo azul del icono

- Se fuerza el color azul industrial `#06244A` en el fondo de instalación de la PWA y en el color de la barra del navegador.
- Se actualiza el nombre de caché del Service Worker para que el navegador detecte la versión nueva.
- Se añade versión a las rutas de iconos para evitar reutilizar una referencia antigua.
- Se configura el icono como `purpose: any` para evitar que el navegador aplique recortes de icono adaptable sobre el borde blanco.

## Importante
Después de desplegar, elimina el acceso directo antiguo de la pantalla de inicio del celular y vuelve a instalar la aplicación desde el sitio actualizado. Algunos sistemas conservan el icono anterior aunque el sitio ya esté actualizado.

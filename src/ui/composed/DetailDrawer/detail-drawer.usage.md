# DetailDrawer

Panel lateral para revisar detalle o editar informacion sin abandonar la pantalla actual.

## Cuando Usarlo

- Al dar clic en `Ver detalle` desde una tabla.
- Para edicion rapida de un expediente.
- Para mostrar informacion secundaria manteniendo la lista visible.

## Props Principales

- `open`: muestra u oculta el panel.
- `title`, `description`, `meta`: encabezado del panel.
- `tone`: `neutral`, `info`, `success`, `warning` o `danger`.
- `size`: `sm`, `md` o `lg`.
- `placement`: `right` o `left`.
- `presentation`: `overlay` para app real, `inline` para catalogo o demos.
- `onClose$`: accion de cierre.

## Criterio

`DetailDrawer` no decide que registro esta seleccionado. La app real controla el registro, permisos, guardado y cierre.

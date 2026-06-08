# NotificationCenter

Centro de avisos para alertas acumuladas del sistema.

## Cuando Usarlo

- En el header del `AppShell`.
- Para avisos de sesion, backend, base de datos, documentos pendientes e importaciones CSV.
- Cuando el usuario necesita revisar eventos recientes sin perder la pantalla actual.

## Props Principales

- `items`: lista de notificaciones.
- `label`: etiqueta accesible del boton.
- `title`: titulo del panel.
- `align`: `start` o `end`.
- `size`: `sm` o `md`.
- `maxItems`: limita la lista visible.
- `unreadCount`: contador total de no leidas, util si la lista visible esta limitada.
- `onMarkAllRead$`: accion para marcar todo como leido.

## Criterio

La app real decide que avisos existen, cuales estan leidos y que acciones ejecutan. El componente solo representa el estado y dispara callbacks.

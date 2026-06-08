# UserMenu

Menu de usuario para mostrar identidad, rol, estado de sesion y acciones comunes.

## Cuando Usarlo

- En sidebar, header o app shell.
- Para perfil, preferencias, seguridad y cierre de sesion.
- Cuando el usuario necesita confirmar con que cuenta esta trabajando.

## Props Principales

- `user`: nombre, rol, iniciales, avatar, estado y metadatos.
- `actions`: items, separadores y etiquetas.
- `size`: `sm` o `md`.
- `align`: `start` o `end`.
- `compact`: muestra solo avatar y caret.
- `sessionLabel`: texto breve del estado de sesion.

## Criterio

La app real decide permisos, acciones disponibles y cierre de sesion. `UserMenu` solo pinta esas opciones y ejecuta callbacks.

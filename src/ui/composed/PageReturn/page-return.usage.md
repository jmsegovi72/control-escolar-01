# PageReturn

Barra de navegación interna que unifica el retorno a flujos previos dentro de cada módulo.

## Props

| Prop | Tipo | Uso |
| --- | --- | --- |
| `title` | `string` | Título de la acción/pantalla actual. |
| `eyebrow` | `string` | Nombre del módulo principal (por defecto "MODULO DE USUARIOS"). |
| `buttonLabel` | `string` | Etiqueta del botón de retroceso (por defecto "Regresar"). |
| `iconLeft` | `string` | Ícono del botón (por defecto "back"). |
| `onClick$` | `PropFunction<() => void \| Promise<void>>` | Callback al hacer clic en el botón de retorno. |

## Ejemplo

```tsx
<PageReturn
  eyebrow="MODULO DE USUARIOS"
  title="Detalle de usuario"
  buttonLabel="Regresar"
  onClick$={goBack$}
/>
```

## Criterio

Usar `PageReturn` en la parte superior de todas las pantallas de acciones secundarias de un módulo (como crear, editar, detalle o búsquedas avanzadas) justo después de la cabecera del shell. Esto asegura consistencia en el comportamiento del botón de retorno y la visualización de la jerarquía de páginas.

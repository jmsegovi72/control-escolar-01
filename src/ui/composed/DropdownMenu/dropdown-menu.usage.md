# DropdownMenu

Menu desplegable para acciones compactas.

## Cuando Usarlo

- Acciones por fila en tablas.
- Menu de usuario/avatar.
- Acciones secundarias en encabezados.
- Opciones de configuracion.

## Props

| Prop | Tipo | Uso |
| --- | --- | --- |
| `label` | `string` | Texto del boton disparador. |
| `items` | `DropdownMenuItem[]` | Opciones del menu. |
| `icon` | `IconIntent` | Icono opcional del disparador. |
| `align` | `start \| end` | Alineacion del menu. |
| `size` | `sm \| md` | Tamano visual. |
| `disabled` | `boolean` | Bloquea el disparador. |

## Item

```ts
type DropdownMenuItem =
  | {
      type?: "item";
      id: string;
      label: string;
      icon?: IconIntent;
      tone?: "neutral" | "danger" | "warning" | "success";
      shortcut?: string;
      disabled?: boolean;
      onSelect$?: QRL<() => void>;
    }
  | { type: "separator"; id: string }
  | { type: "label"; id: string; label: string };
```

## Ejemplo

```tsx
<DropdownMenu
  label="Acciones"
  icon="settings"
  items={[
    { id: "view", label: "Ver detalle", icon: "view" },
    { id: "edit", label: "Editar", icon: "edit" },
    { type: "separator", id: "sep" },
    { id: "delete", label: "Eliminar", icon: "delete", tone: "danger" },
  ]}
/>
```

## Criterio

`DropdownMenu` centraliza la experiencia de menus. Si una tabla, avatar o toolbar necesita acciones compactas, debe usar este componente o su misma API.

# Tooltip

Ayuda breve para controles compactos.

## Cuando Usarlo

- Botones solo con icono.
- Sidebar colapsado.
- Indicadores de estado.
- Acciones de tabla.

## Props

| Prop | Tipo | Uso |
| --- | --- | --- |
| `content` | `string` | Texto del tooltip. |
| `placement` | `top \| right \| bottom \| left` | Posicion del tooltip. |
| `disabled` | `boolean` | Oculta el tooltip. |

## Ejemplo

```tsx
<Tooltip content="Editar alumno">
  <IconButton label="Editar alumno" icon="edit" />
</Tooltip>
```

## Criterio

El tooltip aclara, no reemplaza etiquetas importantes. Si el usuario necesita leerlo para entender una accion critica, conviene usar texto visible.

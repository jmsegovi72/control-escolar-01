# ConfirmAction

Patron para confirmar acciones delicadas.

Internamente usa `Dialog` y `Button`, para que todas las confirmaciones del sistema se vean consistentes.

## Cuando Usarlo

- Eliminar alumno.
- Desactivar usuario.
- Desbloquear login.
- Cancelar inscripcion.
- Borrar documento.
- Confirmar importacion masiva.

## Props

| Prop | Tipo | Uso |
| --- | --- | --- |
| `open` | `boolean` | Muestra la confirmacion. |
| `title` | `string` | Titulo principal. |
| `description` | `string` | Explicacion breve. |
| `details` | `string` | Detalle adicional. |
| `tone` | `neutral \| danger \| warning \| success` | Intencion visual. |
| `size` | `sm \| md \| lg` | Tamano del dialogo. |
| `icon` | `IconIntent` | Icono manual opcional. |
| `confirmLabel` | `string` | Texto del boton principal. |
| `cancelLabel` | `string` | Texto del boton secundario. |
| `loading` | `boolean` | Muestra proceso en confirmacion. |
| `onConfirm$` | `QRL<() => void>` | Evento de confirmacion. |
| `onCancel$` | `QRL<() => void>` | Evento de cancelacion. |

## Ejemplo

```tsx
<ConfirmAction
  open
  tone="danger"
  title="Eliminar alumno"
  description="Esta accion no se puede deshacer."
  confirmLabel="Eliminar"
/>
```

## Criterio

Usar `ConfirmAction` cuando hay una decision binaria clara. Si el flujo requiere capturar informacion adicional, usar `Dialog` directamente.

# Toast

Notificacion breve para eventos del sistema.

## Cuando Usarlo

- Guardado exitoso.
- Error de conexion o backend.
- Avisos de sesion.
- Exportacion iniciada o terminada.
- Cambios de estado.

## Props

| Prop | Tipo | Uso |
| --- | --- | --- |
| `title` | `string` | Mensaje principal. |
| `description` | `string` | Detalle opcional. |
| `tone` | `info \| success \| warning \| danger` | Intencion visual. |
| `icon` | `IconIntent` | Icono manual opcional. |
| `actionLabel` | `string` | Accion secundaria. |
| `dismissible` | `boolean` | Muestra boton de cierre. |
| `progress` | `number` | Barra visual de 0 a 100. |
| `placement` | `inline \| floating` | Estilo de contexto. |
| `onAction$` | `QRL<() => void>` | Evento de accion. |
| `onDismiss$` | `QRL<() => void>` | Evento de cierre. |

## Ejemplo

```tsx
<Toast
  tone="success"
  title="Cambios guardados"
  description="El expediente se actualizo correctamente."
  dismissible
/>
```

## Criterio

`Toast` solo representa la notificacion. La app real controla cola, duracion, cierre automatico y persistencia.

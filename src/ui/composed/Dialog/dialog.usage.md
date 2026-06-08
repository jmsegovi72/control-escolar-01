# Dialog

Ventana modal para confirmaciones, avisos importantes y flujos cortos.

## Cuando Usarlo

- Confirmar eliminar o cambiar estatus.
- Avisar que la sesion esta por expirar.
- Mostrar errores criticos.
- Capturar informacion corta sin abandonar la pantalla.

## Props

| Prop | Tipo | Uso |
| --- | --- | --- |
| `open` | `boolean` | Controla si se renderiza. |
| `title` | `string` | Titulo principal. |
| `description` | `string` | Explicacion breve. |
| `tone` | `neutral \| danger \| warning \| success` | Intencion visual. |
| `size` | `sm \| md \| lg` | Ancho del dialogo. |
| `icon` | `IconIntent` | Icono manual opcional. |
| `closeLabel` | `string` | Texto accesible para cerrar. |
| `onClose$` | `QRL<() => void>` | Evento al cerrar. |

## Slots

| Slot | Uso |
| --- | --- |
| default | Contenido del dialogo. |
| `footer` | Botones de accion. |

## Ejemplo

```tsx
<Dialog
  open
  title="Eliminar alumno"
  description="Esta accion no se puede deshacer."
  tone="danger"
>
  <p>Se eliminara el expediente seleccionado.</p>
  <Button q:slot="footer" variant="secondary">Cancelar</Button>
  <Button q:slot="footer" variant="danger">Eliminar</Button>
</Dialog>
```

## Criterio

`Dialog` no decide acciones ni maneja estado interno de negocio. La app real controla `open`, `onClose$` y los botones de accion.

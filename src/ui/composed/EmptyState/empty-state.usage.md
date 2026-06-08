# EmptyState

Estado visual para pantallas o bloques sin datos.

## Cuando Usarlo

- Busquedas sin resultados.
- Modulos sin registros iniciales.
- Tablas vacias.
- Documentos o historial sin movimientos.
- Errores recuperables donde no hay contenido que mostrar.

## Props

| Prop | Tipo | Uso |
| --- | --- | --- |
| `title` | `string` | Mensaje principal. |
| `description` | `string` | Detalle o siguiente paso. |
| `icon` | `IconIntent` | Icono manual opcional. |
| `tone` | `neutral \| info \| warning \| danger` | Intencion visual. |
| `size` | `sm \| md \| lg` | Presencia visual. |
| `actionLabel` | `string` | Accion principal. |
| `secondaryActionLabel` | `string` | Accion secundaria. |
| `onAction$` | `QRL<() => void>` | Evento principal. |
| `onSecondaryAction$` | `QRL<() => void>` | Evento secundario. |

## Ejemplo

```tsx
<EmptyState
  title="No hay alumnos registrados"
  description="Crea el primer expediente para comenzar."
  icon="student"
  actionLabel="Nuevo alumno"
/>
```

## Criterio

Un estado vacio debe orientar, no solo informar. Siempre que sea posible, debe explicar que paso y ofrecer una accion clara.

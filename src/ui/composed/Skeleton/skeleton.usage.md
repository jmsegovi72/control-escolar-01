# Skeleton

Marcador visual de carga para anticipar contenido.

## Cuando Usarlo

- Tablas cargando datos.
- Formularios cargando expediente.
- Resumenes o cards esperando respuesta.
- Avatar o datos de usuario cargando.

## Props

| Prop | Tipo | Uso |
| --- | --- | --- |
| `variant` | `text \| block \| avatar \| table \| form` | Forma del skeleton. |
| `rows` | `number` | Cantidad de lineas o filas. |
| `size` | `sm \| md \| lg` | Tamano visual. |
| `animated` | `boolean` | Activa o desactiva shimmer. |

## Ejemplo

```tsx
<Skeleton variant="table" rows={5} />
<Skeleton variant="form" rows={4} />
<Skeleton variant="avatar" size="lg" />
```

## Criterio

`Skeleton` se usa cuando sabemos que el contenido viene pronto. Si no hay datos reales despues de cargar, usar `EmptyState`.

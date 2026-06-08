# Toolbar

Barra de herramientas para busqueda, filtros y acciones de pantalla.

## Slots

| Slot | Uso |
| --- | --- |
| `leading` | Busqueda o filtro principal. |
| `center` | Filtros secundarios. |
| `actions` | Acciones principales. |
| default | Contenido adicional en segunda linea. |

## Props

| Prop | Tipo | Uso |
| --- | --- | --- |
| `density` | `comfortable \| compact` | Espaciado de la barra. |
| `wrap` | `boolean` | Permite salto de linea en grupos. |

## Ejemplo

```tsx
<Toolbar>
  <Input q:slot="leading" variant="quiet" iconLeft="search" />
  <DateRangeInput q:slot="center" size="sm" variant="quiet" />
  <Button q:slot="actions" iconLeft="add">Nuevo</Button>
  <Button q:slot="actions" variant="secondary" iconLeft="download">Exportar</Button>
</Toolbar>
```

## Criterio

`Toolbar` evita que cada pantalla acomode busqueda, filtros y acciones de forma distinta. Debe sentirse densa, clara y operacional.

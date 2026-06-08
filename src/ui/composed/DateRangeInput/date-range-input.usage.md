# DateRangeInput

Rango de fechas compuesto por dos `DateInput`.

## Cuando Usarlo

- Filtros de reportes.
- Busqueda por periodo.
- Documentos vencidos entre fechas.
- Movimientos del sistema.
- Inscripciones dentro de un rango.

## Props

| Prop | Tipo | Uso |
| --- | --- | --- |
| `startValue` | `string` | Fecha inicial `YYYY-MM-DD`. |
| `endValue` | `string` | Fecha final `YYYY-MM-DD`. |
| `startLabel` | `string` | Etiqueta de inicio. |
| `endLabel` | `string` | Etiqueta de fin. |
| `min` | `string` | Fecha minima. |
| `max` | `string` | Fecha maxima. |
| `variant` | `line \| box \| quiet` | Estilo visual heredado. |
| `size` | `sm \| md \| lg` | Tamano. |
| `disabled` | `boolean` | Bloquea ambos campos. |
| `invalid` | `boolean` | Marca ambos campos. |
| `required` | `boolean` | Requiere ambos campos. |
| `hint` | `string` | Ayuda general. |
| `error` | `string` | Error general. |

## Ejemplo

```tsx
<DateRangeInput
  startLabel="Desde"
  endLabel="Hasta"
  startValue="2026-01-01"
  endValue="2026-06-07"
/>
```

## Criterio

Usar `DateRangeInput` para filtros y reportes. Para una sola fecha, usar `DateInput`.

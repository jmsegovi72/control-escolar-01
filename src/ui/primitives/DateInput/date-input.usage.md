# DateInput

Campo base para fechas.

## Cuando Usarlo

- Fecha de nacimiento.
- Fecha de inscripcion.
- Vigencia de documentos.
- Inicio o fin de ciclo escolar.
- Filtros por fecha.

## Props

Hereda props de `Input`, excepto `type` e `iconLeft`.

| Prop | Tipo | Uso |
| --- | --- | --- |
| `variant` | `line \| box \| quiet` | Estilo visual. |
| `size` | `sm \| md \| lg` | Tamano del campo. |
| `value` | `string` | Fecha en formato `YYYY-MM-DD`. |
| `min` | `string` | Fecha minima. |
| `max` | `string` | Fecha maxima. |
| `required` | `boolean` | Requerido en formulario. |
| `invalid` | `boolean` | Estado invalido. |
| `showIcon` | `boolean` | Muestra icono de calendario. |

## Ejemplo

```tsx
<Field label="Fecha de nacimiento" required>
  <DateInput required max="2026-06-07" />
</Field>
```

## Criterio

`DateInput` es el campo simple. Si despues necesitamos seleccionar rangos o calendarios complejos, crearemos `DateRangeInput` o `CalendarPopover`.

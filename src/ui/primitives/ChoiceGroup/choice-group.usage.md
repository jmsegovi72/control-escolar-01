# ChoiceGroup

Seleccion unica con apariencia de tira o tarjetas seleccionables.

Internamente usa radios reales para mantener accesibilidad y comportamiento de formulario, pero visualmente la opcion completa se marca.

## Cuando usarlo

- Opciones importantes donde conviene que toda la opcion sea clickeable.
- Selecciones con descripcion, por ejemplo zona, turno, tipo de alumno o modalidad.
- Interfaces modernas donde el radio clasico se siente pequeno o antiguo.

## Props

| Prop | Tipo | Uso |
| --- | --- | --- |
| `options` | `ChoiceOption[]` | Lista de opciones disponibles. |
| `value` | `string` | Valor seleccionado. |
| `name` | `string` | Nombre compartido por el grupo. Requerido para agrupar radios. |
| `size` | `sm \| md \| lg` | Cambia padding y presencia visual. |
| `direction` | `row \| column` | Tira horizontal o lista vertical. |
| `disabled` | `boolean` | Bloquea todo el grupo. |
| `required` | `boolean` | Exige seleccionar una opcion dentro del formulario. |
| `invalid` | `boolean` | Marca el grupo como invalido. |
| `onChange$` | `QRL<(value: string) => void>` | Notifica el valor seleccionado. |

## Opcion

```ts
type ChoiceOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};
```

## Ejemplo

```tsx
<Field label="Zona" hint="La opcion completa funciona como seleccion.">
  <ChoiceGroup
    name="zone"
    direction="column"
    value="urban"
    options={[
      {
        value: "urban",
        label: "Urbano",
        description: "Localidades con mayor densidad.",
      },
      {
        value: "rural",
        label: "Rural",
        description: "Comunidades con menor densidad.",
      },
    ]}
  />
</Field>
```

## Criterio

`ChoiceGroup` no reemplaza a `RadioGroup`; es otra presentacion para el mismo tipo de decision: una sola opcion activa.

Usalo cuando la decision necesite mas area tactil, mejor lectura o una apariencia mas moderna.

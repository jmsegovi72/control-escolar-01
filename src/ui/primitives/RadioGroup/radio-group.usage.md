# RadioGroup

Seleccion unica clasica basada en `input type="radio"`.

## Cuando usarlo

- Formularios donde la seleccion debe verse tradicional y clara.
- Opciones cortas como `Si / No`, turno, genero, estado o tipo.
- Pantallas densas donde una tira de tarjetas ocuparia demasiado espacio.

## Props

| Prop | Tipo | Uso |
| --- | --- | --- |
| `options` | `RadioOption[]` | Lista de opciones disponibles. |
| `value` | `string` | Valor seleccionado. |
| `name` | `string` | Nombre compartido por el grupo. Requerido para agrupar radios. |
| `size` | `sm \| md \| lg` | Cambia el tamano del control. |
| `direction` | `row \| column` | Distribucion horizontal o vertical. |
| `disabled` | `boolean` | Bloquea todo el grupo. |
| `required` | `boolean` | Exige seleccionar una opcion dentro del formulario. |
| `invalid` | `boolean` | Marca el grupo como invalido. |
| `onChange$` | `QRL<(value: string) => void>` | Notifica el valor seleccionado. |

## Opcion

```ts
type RadioOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};
```

## Ejemplo

```tsx
<Field label="Turno" required>
  <RadioGroup
    name="shift"
    direction="row"
    value="morning"
    required
    options={[
      { value: "morning", label: "Matutino" },
      { value: "evening", label: "Vespertino" },
      { value: "mixed", label: "Mixto" },
    ]}
  />
</Field>
```

## Criterio

`RadioGroup` mantiene la convencion conocida de la industria. Si el usuario espera ver opciones pequenas y directas, este componente es suficiente.

Si la eleccion necesita mas presencia visual o descripcion por opcion, conviene usar `ChoiceGroup`.

# Textarea

`Textarea` captura texto largo como observaciones, comentarios, descripciones o
motivos.

## Reglas

- Usa `Textarea` cuando el usuario necesita escribir mas de una linea.
- Usa `variant="box"` para observaciones, motivos y textos importantes.
- Usa `variant="line"` para formularios ligeros con poco texto.
- Usa `variant="quiet"` para comentarios rapidos o zonas compactas.
- Usa `resize="vertical"` como comportamiento normal.
- Usa `resize="none"` cuando el layout no debe cambiar.
- Usa `invalid` cuando el texto no cumple una regla de validacion.
- Combinalo con `Field` para label, ayuda, requerido o error.

## Ejemplos

```tsx
<Field label="Observaciones">
  <Textarea
    variant="box"
    placeholder="Escribe observaciones relevantes..."
  />
</Field>

<Field label="Motivo de baja" error="El motivo es obligatorio.">
  <Textarea variant="line" invalid />
</Field>
```

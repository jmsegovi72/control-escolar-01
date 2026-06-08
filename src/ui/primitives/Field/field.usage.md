# Field

`Field` da contexto a un control de formulario. No captura valor por si mismo:
solo organiza label, ayuda, error y estado visual alrededor de un control.

## Reglas

- Usa `Field` cuando un control necesite label, ayuda o error.
- Usa `required` para campos obligatorios; se muestra con `*`.
- Usa `optional` solo cuando convenga aclarar que el dato no es obligatorio.
- Usa `error` para mensajes de validacion visibles.
- Cuando `Field` tenga `error`, el control hijo debe recibir `invalid`.
- Usa `variant="compact"` en filtros, toolbars o zonas con poco espacio.
- Mantén `Input`, `Select` y `SearchSelect` sin label propio; combinalos con
  `Field`.

## Ejemplos

```tsx
<Field label="Correo institucional" hint="Usa el correo asignado." required>
  <Input variant="line" iconLeft="mail" />
</Field>

<Field label="CURP" error="La CURP no tiene el formato correcto.">
  <Input variant="box" invalid />
</Field>

<Field label="Buscar" variant="compact">
  <Input variant="quiet" iconLeft="search" />
</Field>
```

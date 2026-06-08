# Panel

`Panel` agrupa contenido relacionado como una unidad de trabajo. No debe usarse
para encerrar toda la interfaz ni para convertir cada bloque en tarjeta.

## Reglas

- Usa `Panel` para formularios cortos, filtros, resumenes o secciones de
  configuracion.
- Usa `title` para nombrar la unidad de trabajo.
- Usa `description` cuando el usuario necesite contexto antes de actuar.
- Usa el slot `actions` para acciones del panel, como crear, editar o filtrar.
- Usa `variant="default"` para bloques principales.
- Usa `variant="subtle"` para bloques secundarios o filtros ligeros.
- Usa `variant="outlined"` cuando necesites separar sin elevar visualmente.
- Usa `density="compact"` en toolbars, filtros o espacios densos.
- Evita anidar paneles dentro de paneles.

## Ejemplos

```tsx
<Panel
  eyebrow="Alumnos"
  title="Datos academicos"
  description="Informacion usada para inscripcion y seguimiento."
>
  <Button q:slot="actions" size="sm" iconLeft="edit">
    Editar
  </Button>
  <Field label="Matricula">
    <Input variant="line" />
  </Field>
</Panel>

<Panel variant="subtle" density="compact" title="Filtros">
  <Select variant="quiet" placeholder="Estado" options={options} />
</Panel>
```

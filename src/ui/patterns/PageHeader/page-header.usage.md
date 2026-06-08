# PageHeader

`PageHeader` encabeza una pantalla o vista principal. Define el contexto antes
de que el usuario interactue con filtros, tablas o formularios.

## Reglas

- Usa un solo `PageHeader` por pantalla.
- Usa `title` para nombrar claramente la vista.
- Usa `description` para explicar que se gestiona o que puede hacer el usuario.
- No repitas el titulo dentro de la descripcion.
- Usa `meta` para estados cortos, categoria o modulo.
- Coloca la accion principal en `actions`.
- Evita muchas acciones primarias compitiendo en el header.
- Usa `density="compact"` en vistas internas o subpantallas.

## Ejemplos

```tsx
<PageHeader
  eyebrow="Alumnos"
  title="Admisiones"
  description="Gestiona aspirantes, documentos y estatus de ingreso."
  meta="Modulo escolar"
>
  <Button q:slot="actions" iconLeft="add">
    Nuevo alumno
  </Button>
  <Button q:slot="actions" variant="secondary" iconLeft="filter">
    Filtros
  </Button>
</PageHeader>
```

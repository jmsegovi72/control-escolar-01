# DataTable

`DataTable` muestra datos tabulares con busqueda, filtros opcionales por columna,
acciones por fila, estados y paginacion.

## Reglas

- Usa `searchable` para busqueda global.
- Usa filtros por columna solo cuando aporten valor real.
- Usa `filter.type="text"` para texto libre como nombre, matricula o CURP.
- Usa `filter.type="select"` para estados, grupos, roles o categorias cerradas.
- Usa `actionMode="auto"` como modo recomendado.
- En `auto`, una accion se muestra directa y varias acciones se agrupan en menu.
- Usa `actionMode="menu"` si quieres forzar menu siempre.
- Usa `actionMode="inline"` solo para tablas con pocas acciones y baja densidad.
- Usa `badge.toneMap` para pintar estados por valor.
- Usa `pageSizeOptions` cuando el backend soporte limites especificos.
- Usa `hasActiveFilters` para mostrar la accion de limpiar filtros.
- Usa `onClearFilters$` para resetear busqueda, filtros y pagina.

## Filtros Por Columna

```tsx
{
  key: "name",
  label: "Alumno",
  filter: {
    type: "text",
    placeholder: "Filtrar alumno",
  },
}
```

```tsx
{
  key: "status",
  label: "Estado",
  filter: {
    type: "select",
    placeholder: "Todos",
    options: [
      { value: "active", label: "Activo" },
      { value: "inactive", label: "Inactivo" },
    ],
  },
}
```

## Acciones

```tsx
actions={[
  { label: "Ver detalle", icon: "view", onClick$: view$ },
  { label: "Editar", icon: "edit", onClick$: edit$ },
  { label: "Eliminar", icon: "delete", tone: "danger", onClick$: delete$ },
]}
```

## Badges

```tsx
{
  key: "status",
  label: "Estado",
  badge: {
    toneMap: {
      Activo: "success",
      Pendiente: "warning",
      Baja: "danger",
    },
  },
}
```

## Paginacion

```tsx
import { DEFAULT_DATA_TABLE_PAGE_SIZE_OPTIONS } from "~/ui/patterns/DataTable/data-table.config";

<DataTable
  pagination={{ page: 1, limit: 10, total: 32 }}
  pageSizeOptions={[...DEFAULT_DATA_TABLE_PAGE_SIZE_OPTIONS]}
/>
```

## Limpiar Filtros

`Limpiar filtros` pertenece a la tabla, no a cada filtro individual. Debe
resetear busqueda global, filtros de columna y pagina actual.

```tsx
<DataTable
  hasActiveFilters
  onClearFilters$={clearFilters$}
/>
```

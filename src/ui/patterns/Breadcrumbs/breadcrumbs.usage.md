# Breadcrumbs

Ruta de navegacion para ubicar al usuario dentro del sistema.

## Cuando Usarlo

- Expedientes profundos.
- Submodulos.
- Configuraciones con jerarquia.
- Pantallas donde el sidebar no basta para explicar ubicacion.

## Props

| Prop | Tipo | Uso |
| --- | --- | --- |
| `items` | `BreadcrumbItem[]` | Elementos de la ruta. |
| `onNavigate$` | `QRL<(item) => void>` | Evento al seleccionar una ruta anterior. |

## Item

```ts
type BreadcrumbItem = {
  id: string;
  label: string;
  href?: string;
  icon?: IconIntent;
  current?: boolean;
};
```

## Ejemplo

```tsx
<Breadcrumbs
  items={[
    { id: "home", label: "Inicio", icon: "dashboard" },
    { id: "students", label: "Alumnos", icon: "student" },
    { id: "record", label: "Expediente CE-2026-001", current: true },
  ]}
/>
```

## Criterio

`Breadcrumbs` no reemplaza al sidebar. Sirve para orientar al usuario cuando ya entro a una ruta profunda.

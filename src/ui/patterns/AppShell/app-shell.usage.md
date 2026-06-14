# AppShell

Marco visual reusable para pantallas administrativas.

No representa una ruta real. Solo organiza el `Sidebar`, el encabezado del modulo, acciones, toolbar y contenido.

## Slots

| Slot | Uso |
| --- | --- |
| `sidebar` | Navegacion lateral, normalmente `Sidebar`. |
| `actions` | Acciones principales del modulo. |
| `toolbar` | Filtros, busqueda o controles secundarios. |
| default | Contenido principal: tabla, formulario, paneles, etc. |

## Props

| Prop | Tipo | Uso |
| --- | --- | --- |
| `eyebrow` | `string` | Texto corto superior. |
| `title` | `string` | Titulo de pantalla. |
| `description` | `string` | Descripcion breve. |
| `meta` | `string` | Chip informativo junto al titulo. |
| `density` | `comfortable \| compact` | Espaciado general. |
| `headerVariant` | `stacked \| inline` | Encabezado clasico o encabezado delgado tipo ruta. |

## Ejemplo

```tsx
<AppShell
  eyebrow="Modulo escolar"
  title="Alumnos"
  description="Consulta, filtra y administra expedientes."
  meta="2026"
>
  <Sidebar q:slot="sidebar" {...sidebarProps} />
  <Button q:slot="actions" iconLeft="add">Nuevo alumno</Button>
  <Input q:slot="toolbar" variant="quiet" iconLeft="search" />
  <DataTable rows={rows} columns={columns} />
</AppShell>
```

## Variante inline

```tsx
<AppShell
  eyebrow="SICES V1"
  title="Dashboard"
  density="compact"
  headerVariant="inline"
>
  <Sidebar q:slot="sidebar" {...sidebarProps} />
  <Button q:slot="actions" size="sm" iconLeft="add">Nuevo</Button>
</AppShell>
```

## Criterio

`AppShell` es el puente entre biblioteca UI y app real. Permite probar si los patrones sobreviven juntos antes de conectar rutas, permisos y datos.

# Sidebar

Navegacion lateral profesional para la app administrativa.

Este componente es visual y configurable. No conoce rutas reales, permisos ni sesion; recibe datos desde afuera para que despues pueda conectarse a la app.

## Incluye

- Marca del sistema.
- Estado expandido o colapsado.
- Secciones de navegacion.
- Items activos, deshabilitados, con badge y con hijos.
- Reloj/fecha recibido por props.
- Indicadores de sistema recibidos por props.
- Contador de sesion recibido por props.
- Avatar o iniciales del usuario.
- Acciones inferiores como configuracion o cerrar sesion.

## Props

| Prop | Tipo | Uso |
| --- | --- | --- |
| `brand` | `SidebarBrand` | Nombre, abreviatura y subtitulo del sistema. |
| `sections` | `SidebarSection[]` | Grupos principales de navegacion. |
| `activeItem` | `string` | Id del item activo. |
| `collapsed` | `boolean` | Muestra solo iconos. |
| `clock` | `SidebarClock` | Hora y fecha mostradas en el panel. |
| `systemStatus` | `SidebarSystemStatus` | Semaforos de sistema y contador de sesion. |
| `user` | `SidebarUser` | Avatar, nombre, rol y estado. |
| `footerItems` | `SidebarItem[]` | Acciones inferiores. |
| `onNavigate$` | `QRL<(item: SidebarItem) => void>` | Evento al seleccionar item. |
| `onToggleCollapse$` | `QRL<() => void>` | Evento al colapsar/expandir. |

## Ejemplo

```tsx
<Sidebar
  brand={{
    name: "Control Escolar",
    shortName: "CE",
    subtitle: "Instituto Central",
  }}
  activeItem="students"
  clock={{
    label: "Turno matutino",
    time: "08:45",
    date: "Lunes 7 de junio",
  }}
  systemStatus={{
    items: [
      { id: "api", label: "API", value: "Activa", tone: "online" },
      { id: "db", label: "Base de datos", value: "Estable", tone: "online" },
    ],
    session: {
      label: "Sesion expira en",
      remaining: "14:32",
      tone: "warning",
    },
  }}
  user={{
    name: "Mac Segovia",
    role: "Administrador",
    status: "Sesion activa",
  }}
  sections={[
    {
      id: "school",
      label: "Escolar",
      items: [
        { id: "dashboard", label: "Inicio", icon: "dashboard" },
        { id: "students", label: "Alumnos", icon: "student", badge: 12 },
        { id: "teachers", label: "Docentes", icon: "teacher" },
      ],
    },
  ]}
  footerItems={[
    { id: "settings", label: "Configuracion", icon: "settings" },
    { id: "logout", label: "Salir", icon: "logout" },
  ]}
/>
```

## Criterio

El `Sidebar` es estructura de producto. Debe sentirse estable, claro y facil de escanear.

La app real debe calcular permisos, ruta activa, hora, estado del servidor y tiempo restante de sesion. Este componente solo representa esos datos con consistencia visual.

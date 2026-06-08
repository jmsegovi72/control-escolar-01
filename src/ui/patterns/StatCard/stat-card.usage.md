# StatCard

Tarjeta de metrica para dashboards y resumen operativo.

## Cuando Usarlo

- Alumnos activos.
- Docentes registrados.
- Grupos abiertos.
- Documentos pendientes.
- Usuarios bloqueados.
- Inscripciones del ciclo.

## Props

| Prop | Tipo | Uso |
| --- | --- | --- |
| `label` | `string` | Nombre de la metrica. |
| `value` | `string \| number` | Valor principal. |
| `description` | `string` | Contexto secundario. |
| `icon` | `IconIntent` | Icono semantico. |
| `tone` | `neutral \| primary \| success \| warning \| danger \| info` | Intencion visual. |
| `trend` | `StatTrend` | Cambio o comparativo. |
| `loading` | `boolean` | Muestra skeleton interno. |

## Ejemplo

```tsx
<StatCard
  label="Alumnos activos"
  value="1,248"
  description="Ciclo 2026"
  icon="student"
  tone="success"
  trend={{ value: "8%", direction: "up", label: "contra mes anterior" }}
/>
```

## Criterio

`StatCard` debe ser compacto y escaneable. No es una tarjeta decorativa; es lectura operativa rapida.

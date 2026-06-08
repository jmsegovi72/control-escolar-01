# SystemHealth

Grupo de semaforos para representar estado operativo del sistema.

## Cuando Usarlo

- En dashboard, toolbar, header o sidebar.
- Para API, base de datos, sesion, trabajos por lote o sincronizacion.
- Cuando el usuario necesita saber si puede seguir trabajando con confianza.

## Componentes

- `StatusIndicator`: indicador individual.
- `SystemHealth`: grupo de indicadores.

## Props Principales

- `items`: lista de estados.
- `tone`: `online`, `warning`, `offline` o `neutral`.
- `value`: valor corto, por ejemplo `36 ms` o `14:32`.
- `description`: detalle breve.
- `compact`: modo reducido para toolbar o header.
- `orientation`: `horizontal` o `vertical`.

## Criterio

La app real mide servicios, sesion y procesos. `SystemHealth` solo representa esos valores.

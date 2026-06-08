# Badge

`Badge` muestra estados cortos dentro de tablas, listas, formularios o resumenes.

## Reglas

- Usa `success` para activo, valido, pagado o completado correctamente.
- Usa `warning` para pendiente, advertencia o por revisar.
- Usa `danger` para error, vencido, baja o invalido.
- Usa `info` para registrado, importado o informacion de proceso.
- Usa `neutral` para estados generales, desconocidos o sin prioridad.
- Usa `primary` para destacar un estado propio del modulo.
- Usa textos cortos; evita frases largas dentro de un badge.
- Usa `size="sm"` en tablas y zonas densas.

## Ejemplos

```tsx
<Badge tone="success">Activo</Badge>
<Badge tone="warning">Pendiente</Badge>
<Badge tone="danger">Vencido</Badge>
<Badge tone="info">Registrado</Badge>
<Badge size="sm" tone="success">Valido</Badge>
```

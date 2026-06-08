# Accordion

Seccion expandible para informacion secundaria, filtros avanzados o bloques de formulario.

## Props

| Prop | Tipo | Uso |
| --- | --- | --- |
| `title` | `string` | Titulo visible. |
| `description` | `string` | Texto secundario opcional. |
| `open` | `boolean` | Estado inicial abierto. |
| `disabled` | `boolean` | Evita abrir/cerrar. |
| `icon` | `IconIntent` | Icono semantico opcional. |
| `variant` | `default \| subtle \| outlined` | Estilo visual. |
| `size` | `sm \| md \| lg` | Densidad del componente. |
| `tone` | `neutral \| primary \| warning \| danger` | Intencion visual. |

## Ejemplo

```tsx
<Accordion
  title="Filtros avanzados"
  description="Opciones adicionales para consulta."
  icon="filter"
  open
>
  <Field label="Grupo">
    <Select options={groups} />
  </Field>
</Accordion>
```

## Criterio

Usar `Accordion` cuando el contenido ayuda, pero no necesita estar visible todo el tiempo.

Para acciones criticas o confirmaciones, usar `Dialog`. Para separar secciones principales de un expediente, usar `Tabs`.

# SearchSelect

`SearchSelect` permite escribir para filtrar una lista y seleccionar una opcion
real. No debe usarse como input de texto libre.

## Conceptos

- `query` es el texto que el usuario escribe.
- `value` es el valor real de la opcion seleccionada.
- `required` exige que exista `value`; escribir texto no basta.
- `onQueryChange$` se ejecuta cuando cambia el texto.
- `onSelect$` se ejecuta cuando el usuario elige una opcion.
- `onClear$` se ejecuta cuando se limpia la seleccion.

## Reglas

- Usa `SearchSelect` para alumnos, docentes, personas, grupos, materias o
  codigos postales.
- Usa `Select` si la lista es corta y no requiere busqueda.
- Usa `Input` si el dato es texto libre.
- Usa `required` cuando el formulario necesita una opcion valida.
- Si el usuario escribe despues de seleccionar, el `value` debe limpiarse.
- Muestra `emptyMessage` cuando no haya coincidencias.
- Usa `loading` cuando la busqueda dependa de una carga remota.

## Ejemplos

```tsx
<Field label="Alumno" required>
  <SearchSelect
    required
    query={query.value}
    value={studentId.value}
    placeholder="Buscar alumno..."
    options={students.value}
    onQueryChange$={onQueryChange$}
    onSelect$={onSelect$}
  />
</Field>
```

```tsx
<SearchSelect
  variant="box"
  iconLeft="teacher"
  placeholder="Buscar docente..."
  options={[
    {
      value: "teacher-1",
      label: "Dra. Ana Mendoza",
      description: "Matematicas · Tiempo completo",
    },
  ]}
/>
```

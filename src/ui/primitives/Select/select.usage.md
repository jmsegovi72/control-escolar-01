# Select

`Select` permite elegir una opcion de una lista cerrada. Usa un dropdown custom
para mantener la misma calidad visual del sistema.

## Reglas

- Usa `Select` cuando las opciones son conocidas y no necesitas busqueda.
- Usa `variant="line"` en formularios ligeros o elegantes.
- Usa `variant="box"` en formularios densos o campos criticos.
- Usa `variant="quiet"` para filtros y toolbars.
- Usa `iconLeft` solo cuando ayude a reconocer el tipo de dato.
- Usa `invalid` cuando la seleccion no cumple una regla de validacion.
- Usa `disabled` cuando la seleccion no puede modificarse.
- Si la lista es grande o el usuario necesita escribir para encontrar, usa
  `SearchSelect`.

## Ejemplos

```tsx
<Select
  variant="line"
  placeholder="Selecciona un ciclo"
  iconLeft="schedule"
  options={[
    { value: "2025-2026", label: "2025-2026" },
    { value: "2026-2027", label: "2026-2027" },
  ]}
/>

<Select
  variant="quiet"
  placeholder="Filtrar estado"
  iconLeft="filter"
  options={[
    { value: "active", label: "Activo" },
    { value: "inactive", label: "Inactivo" },
  ]}
/>
```

# Button

`Button` es la base para acciones visibles con texto. `IconButton` usa el
mismo core, pero sirve para acciones compactas con solo icono.

## Reglas

- Usa `primary` para la accion principal de una pantalla o seccion.
- Evita tener varios `primary` compitiendo en el mismo bloque visual.
- Usa `secondary` para acciones normales o alternativas.
- Usa `ghost` para acciones suaves en barras, tablas o paneles.
- Usa `danger` solo para acciones destructivas o de riesgo.
- Usa `warning` para acciones que requieren atencion antes de continuar.
- Usa `success` para confirmaciones o pasos completados, no como boton comun.
- Usa `link` cuando la accion se comporta como navegacion textual.
- Usa `loading` cuando la accion esta en proceso y debe bloquear clicks.
- Usa `fullWidth` en formularios, pasos guiados o pantallas estrechas.
- Usa `IconButton` para acciones repetidas como ver, editar, eliminar o buscar.

## Ejemplos

```tsx
<Button iconLeft="save">Guardar</Button>
<Button variant="secondary">Cancelar</Button>
<Button variant="danger" iconLeft="delete">Eliminar</Button>
<Button loading>Guardando</Button>
<IconButton label="Editar" icon="edit" variant="secondary" />
```

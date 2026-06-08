# Input

`Input` es el control base para capturar texto. No incluye label, ayuda ni
mensaje de error; eso pertenece a `Field`.

## Variantes

- Usa `line` para formularios ligeros, elegantes o con buena respiracion.
- Usa `box` para formularios densos, campos criticos o pantallas con muchas
  columnas.
- Usa `quiet` para filtros, busquedas compactas y barras de herramientas.

## Reglas

- Usa `iconLeft` cuando el icono ayude a reconocer el dato.
- Usa `iconRight` para estados o acciones visuales simples.
- Evita poner iconos decorativos si no aportan significado.
- Usa `invalid` solo cuando el campo tiene error de validacion.
- Usa `disabled` cuando el usuario no puede editar ni enfocar el campo.
- Usa `readOnly` cuando el dato se puede enfocar o copiar, pero no modificar.
- Mantén `Input` sin label; compón con `Field` cuando necesites contexto.

## Ejemplos

```tsx
<Input variant="line" placeholder="Correo institucional" iconLeft="mail" />
<Input variant="box" placeholder="CURP" />
<Input variant="quiet" placeholder="Buscar alumno..." iconLeft="search" />
<Input variant="line" invalid placeholder="Matricula requerida" />
```

# Checkbox

`Checkbox` representa una decision binaria o una seleccion independiente.

## Reglas

- Usa `Checkbox` para activar/desactivar una opcion clara.
- Usa `checked` cuando la opcion debe iniciar marcada.
- Usa `disabled` cuando la opcion existe, pero no puede modificarse.
- Usa `invalid` cuando la seleccion es requerida o entra en conflicto con una
  regla de validacion.
- Usa `size="sm"` en tablas, filtros o zonas compactas.
- Usa `size="md"` para formularios normales.
- Usa `size="lg"` solo cuando la seleccion sea protagonista en la pantalla.
- Evita usar `Checkbox` para elegir una sola opcion entre varias; para eso usa
  `RadioGroup` o `Select`.

## Ejemplos

```tsx
<Checkbox>Activar expediente academico</Checkbox>
<Checkbox checked>Notificar al tutor</Checkbox>
<Checkbox invalid>Debes aceptar antes de continuar</Checkbox>
<Checkbox disabled>Opcion bloqueada por permisos</Checkbox>
```

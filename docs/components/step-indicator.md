# StepIndicator

Componente UI reutilizable para mostrar el progreso de un wizard multi-paso.

Ubicacion: `src/ui/composed/StepIndicator/`

Se usa en `q:slot="toolbar"` del `AuthenticatedShell` en pantallas de accion como crear, editar o ver.

---

## Objetivo

Mostrar al usuario:

- en que paso esta
- que pasos ya completo
- si el paso actual esta en estado normal, error o success

---

## API

```ts
interface Step {
  eyebrow: string;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  current: number; // 1-indexed
  tone?: 'success' | 'error';
  onStepClick$?: PropFunction<(step: number) => void>;
}
```

### Slots

No tiene. Todo se controla por props.

---

## Comportamiento por tono

`tone` siempre se aplica sobre el paso `current`.

| `current` | `tone` | Pasos previos | Paso actual |
|---|---|---|---|
| 1 | `undefined` | pendientes | active (azul) |
| 2 | `undefined` | done (verde) | active (azul) |
| 2 | `error` | done (verde) | error (rojo) |
| 3 | `success` | done (verde) | done (verde + check) |

Reglas:

1. Los pasos anteriores a `current` siempre van en `done`.
2. El connector se pinta verde si el paso al que lleva ya fue alcanzado (`stepNum <= current`).
3. `success` convierte el paso actual en completado.
4. `error` mantiene el paso actual en tono de error.

---

## Reglas obligatorias

1. Pasar `current` desde el estado real del wizard. Nunca hardcodearlo.
2. Pasar `tone` cuando el paso actual tenga un estado semantico conocido.
3. Usarlo en `q:slot="toolbar"` del `AuthenticatedShell`.
4. Los textos `eyebrow` y `label` salen de `messages.ts`.
5. Si un conflicto del backend pertenece a un paso anterior, `current` debe regresar a ese paso antes de pintar `tone="error"`.

---

## Regla de mapeo

El indicador no decide por si solo en que paso ocurrio el error. Cada pantalla debe mapear sus estados a `current` y `tone`.

Patron recomendado:

1. `current=1` cuando el usuario sigue resolviendo la seleccion o validacion inicial.
2. `current=2` cuando ya entro al formulario principal.
3. `current=3` solo cuando existe resultado final exitoso.
4. `tone="error"` solo en el paso que realmente fallo.
5. `tone="success"` solo en el paso final exitoso.

---

## Casos comunes

### Create con validacion inicial

Ejemplo: crear persona.

- CURP invalida o duplicada: `current=1`, `tone="error"`
- Error en campos del formulario: `current=2`, `tone="error"`
- Registro exitoso: `current=3`, `tone="success"`

### Create con seleccion y formulario

Ejemplo: direcciones o demografia.

- Aun no hay persona seleccionada: `current=1`
- Persona seleccionada y formulario abierto: `current=2`
- Error al guardar o validacion del formulario: `current=2`, `tone="error"`
- Registro exitoso: `current=3`, `tone="success"`

### Conflicto de backend ligado a un paso anterior

Ejemplo: contacto de emergencia cuando la persona ya tiene un registro.

- Aunque ya se haya seleccionado la persona, el conflicto pertenece al paso 1
- Debe calcularse `current=1`, `tone="error"`
- No se debe dejar el paso 2 en verde o azul si el bloqueo ocurrio antes de capturar datos

---

## Ejemplos

Paso final exitoso:

```tsx
<StepIndicator
  q:slot="toolbar"
  steps={steps}
  current={3}
  tone="success"
/>
```

Error en el formulario del paso 2:

```tsx
<StepIndicator
  q:slot="toolbar"
  steps={steps}
  current={2}
  tone="error"
/>
```

Conflicto en paso 1 aunque exista seleccion temporal:

```tsx
const currentStep = success.value
  ? 3
  : backendConflictOnStep1.value
    ? 1
    : selectedItem.value
      ? 2
      : 1;

const stepTone = success.value
  ? 'success'
  : hasStepError.value
    ? 'error'
    : undefined;
```

---

## Anti-patrones

```tsx
// Mal: no usar wrappers para recolorear el componente desde una pantalla
<div class="custom-toolbar-warning">
  <StepIndicator q:slot="toolbar" steps={steps} current={1} />
</div>

// Mal: current hardcodeado
<StepIndicator q:slot="toolbar" steps={steps} current={3} />
```

---

## Checklist

- [ ] Importar `StepIndicator` desde `~/ui`
- [ ] Definir textos en `messages.ts`
- [ ] Calcular `current` desde el estado real
- [ ] Pasar `tone` cuando aplique
- [ ] Renderizarlo en `q:slot="toolbar"`
- [ ] Verificar width completo del toolbar
- [ ] Verificar error/success visualmente
- [ ] Ejecutar `npm run build.types`
- [ ] Ejecutar `npm run check`

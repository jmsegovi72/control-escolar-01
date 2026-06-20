# StepIndicator

Componente UI reutilizable para mostrar el progreso de un wizard (formulario multi-paso).

Ubicación: `src/ui/composed/StepIndicator/`

Se usa en `q:slot="toolbar"` del `AuthenticatedShell` en pantallas de acción multi-paso (create, edit, etc.).

---

## Objetivo

Mostrar al usuario en qué paso está, qué pasos ya completó, y dar feedback visual inmediato del estado final (éxito/error) del wizard.

---

## API

```ts
interface Step {
  eyebrow: string;     // ej: "Paso 1"
  label: string;       // ej: "Buscar persona"
}

interface StepIndicatorProps {
  steps: Step[];
  current: number;                              // 1-indexed
  tone?: 'success' | 'error';                   // refleja el estado final del wizard
  onStepClick$?: PropFunction<(step: number) => void>;
}
```

### Slots

No tiene. Todo se controla por props.

---

## Comportamiento por tono

| `current` | `tone` | Paso N-1 | Connector N-1→N | Paso N | Paso N+1 |
|---|---|---|---|---|---|
| 1 | — | — | gris | active (azul) | pendiente |
| 2 | — | done (verde) | verde | active (azul) | pendiente |
| 3 | — | done | verde | active | — |
| 3 | `success` | done | verde | done (verde + check) | — |
| 3 | `error` | done | verde | active (rojo) | — |

**Regla de oro del connector:** un connector está verde si el paso al que **lleva** fue alcanzado (`stepNum <= current`), independientemente del tono final.

---

## Reglas obligatorias

1. **SIEMPRE pasar `tone` cuando el wizard tiene un estado final conocido** (success o error). NUNCA omitir el `tone` solo porque "ya se ve bien" — sin `tone`, el último paso queda en azul cuando debería ser verde/rojo.

2. **Vincular `current` al estado real del wizard**, no a un número hardcoded. La fórmula típica:
   ```ts
   const currentStep = resultTone.value
     ? 3                                          // resultado conocido
     : showForm.value
       ? 2                                        // formulario activo
       : 1;                                       // paso inicial
   ```

3. **Vincular `tone` al estado final del submit**:
   ```tsx
   <StepIndicator
     steps={[...]}
     current={currentStep}
     tone={success.value ? 'success' : error.value ? 'error' : undefined}
   />
   ```

4. **Usar en `q:slot="toolbar"` del `AuthenticatedShell`** — no dentro del container de la página, no como elemento propio.

5. **Los textos `eyebrow` y `label` vienen de `messages.ts`** — nunca hardcodear.

---

## Anti-patrones (no hacer)

```tsx
// ❌ MAL — no pasar tone cuando hay resultado
<StepIndicator steps={steps} current={3} />

// ❌ MAL — current hardcoded
<StepIndicator steps={steps} current={3} tone="success" />

// ❌ MAL — usar fuera del slot toolbar
<div class="my-page">
  <StepIndicator steps={steps} current={2} />
  ...
</div>
```

---

## Ejemplo completo

```tsx
import { StepIndicator } from '~/ui/composed/StepIndicator';

// En el componente:
const currentStep =
  resultTone.value
    ? 3
    : showForm.value
      ? 2
      : 1;

// En el JSX (dentro de <AuthenticatedShell>):
<StepIndicator
  q:slot="toolbar"
  steps={[
    { eyebrow: m.step1Eyebrow, label: m.step1Label },
    { eyebrow: m.step2Eyebrow, label: m.step2Label },
    { eyebrow: m.step3Eyebrow, label: m.step3Label },
  ]}
  current={currentStep}
  tone={resultTone.value || undefined}
/>
```

---

## Checklist al implementar StepIndicator en un módulo nuevo

- [ ] Importar `StepIndicator` desde `~/ui/composed/StepIndicator`
- [ ] Definir `step1Eyebrow/Label`, `step2Eyebrow/Label`, `step3Eyebrow/Label` en `messages.ts`
- [ ] Computar `currentStep` desde el estado real del wizard (NO hardcodear)
- [ ] Definir signal de estado final (`resultTone` o equivalente) — `''` = sin resultado, `'success'` o `'error'`
- [ ] Pasar `tone={resultTone.value || undefined}` siempre
- [ ] Renderizar dentro de `<AuthenticatedShell>` con `q:slot="toolbar"`
- [ ] Verificar visualmente:
  - [ ] Paso 1 activo (azul) cuando `current=1`
  - [ ] Connector 1→2 verde al pasar a paso 2
  - [ ] Paso 3 verde con check en éxito
  - [ ] Paso 3 rojo con X en error
- [ ] Verificar `npm run build.types && npm run check`
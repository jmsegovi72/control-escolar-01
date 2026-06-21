# CreateResult

Componente UI reutilizable para mostrar el resultado de una acción de **crear** (POST) en cualquier módulo: éxito (registro guardado) o error (registro fallido).

Ubicación: `src/ui/composed/CreateResult/`

---

## Objetivo

Garantizar que **toda pantalla de creación** tenga la misma estructura visual, el mismo idioma de feedback al usuario y el mismo manejo de error. No reinventar el panel de resultado en cada módulo.

**Usar cuando:**
- Una acción de crear termina en éxito o error (después de un POST)
- Se necesita mostrar un resumen de lo creado
- Se necesita dar acciones al usuario ("Crear otro", "Ir al hub")

**No usar para:**
- Listas o tablas (usar componentes de tablas)
- Formularios activos (usar `Panel`)
- Acciones que no son de crear (editar, eliminar, toggle tienen su propio patrón; si los necesitas, crear `EditResult`, etc.)

---

## API

```ts
type CreateResultTone = 'success' | 'error';

interface CreateResultProps {
  tone?: CreateResultTone;            // default: 'success'
  eyebrow: string;                    // ej: "Dirección registrada"
  title: string;                      // ej: "¡Listo!" o "Error al guardar"
  description?: string;               // descripción debajo del título
  onRetry$?: QRL<() => void | Promise<void>>;
  retryLabel?: string;                // default: "Reintentar"
  class?: string;
}

interface CreateResultRowProps {
  label: string;
  value: string | number | null | undefined;
  fallback?: string;                  // default: "—"
}
```

### Slots

| Slot | Contenido |
|---|---|
| **default** | Filas `CreateResultRow` (resumen de lo creado) — opcional |
| **`actions`** | Botones de acción (ej: "Crear otro", "Ir a personas") |

---

## Estructura interna

```
<section data-tone="success|error">
  <header>
    <icon-container>          ← circular grande (4rem), color según tono
    <span eyebrow>            ← var(--font-mono), uppercase
    <h2>                       ← var(--font-display)
    <p description>            ← var(--font-text-muted)
  </header>

  <div class="body">          ← padding, oculta si no hay children (:empty)
    <slot default />           ← CreateResultRow's
  </div>

  <div class="actions">       ← border-top, flex-end
    {tone === 'error' && onRetry$ && (
      <Button>Reintentar</Button>
    )}
    <slot name="actions" />    ← botones extra
  </div>
</section>
```

El color del header, borde, ícono y connector cambian según `tone`:
- `success` → verde (success-soft, color-success)
- `error` → rojo (danger-soft, color-danger)

---

## Ejemplo completo

### Éxito con resumen

```tsx
import { CreateResult, CreateResultRow } from '~/ui/composed/CreateResult';

<CreateResult
  tone="success"
  eyebrow={m.successEyebrow}
  title={m.successTitle}
  description={m.successMessage}
>
  <CreateResultRow label={m.resultPersonLabel} value={selectedPerson.value?.fullName} />
  <CreateResultRow label={m.resultStreetLabel} value={street.value} />
  <CreateResultRow label={m.resultZipCodeLabel} value={settlement.value?.zipCode} />

  <div q:slot="actions">
    <Button variant="secondary" onClick$={resetAll$}>
      {m.successCreateAnother}
    </Button>
    <Button iconRight="chevron-right" onClick$={() => nav(ROUTES.HUB)}>
      {m.successFinish}
    </Button>
  </div>
</CreateResult>
```

### Error con reintento

```tsx
<CreateResult
  tone="error"
  eyebrow={m.errorResultEyebrow}
  title={m.errorResultTitle}
  description={error.value}
  onRetry$={createItem$}
  retryLabel={m.errorRetry}
>
  <div q:slot="actions">
    <Button variant="secondary" onClick$={() => { resultTone.value = ''; }}>
      {m.errorBackToForm}
    </Button>
  </div>
</CreateResult>
```

---

## Reglas obligatorias

1. **Toda pantalla de crear debe terminar en `CreateResult`** (en éxito o en error), nunca en un `Panel` neutro ni solo un `Toast`.
2. **El slot `actions` debe tener al menos un botón** que saque al usuario de la pantalla (ir al hub) o le permita crear otro registro.
3. **El botón principal del slot `actions` debe navegar al hub del módulo** (no a la búsqueda, no al detalle), usando `ROUTES.MODULE_HUB`.
4. **Si la pantalla puede fallar**, usar `tone="error"` + `onRetry$` con la misma función `createItem$`. Nunca manejar el error solo con un `Toast` (el usuario necesita ver pantalla completa con opción de reintentar).
5. **El resumen (slot default) es opcional** pero recomendado: siempre que haya datos del registro creado (id, nombre, dirección, etc.), mostrarlos con `CreateResultRow`.
6. **Los textos vienen de `src/config/messages.ts`** — nunca hardcodear strings en el JSX.
7. **NO** pasar `class` con estilos que rompan el patrón (colores, padding, bordes). Solo usarlo para `max-width` o ajustes de layout del contenedor padre.

---

## Anti-patrones (no hacer)

```tsx
// ❌ MAL — Panel genérico, sin tono
<Panel eyebrow="Éxito" title="Se creó">
  <p>El registro se guardó.</p>
</Panel>

// ❌ MAL — sin acciones, usuario queda atrapado
<CreateResult tone="success" title="Listo" />

// ❌ MAL — Toast solo para error de submit (no da reintento visual)
{error.value && <Toast>{error.value}</Toast>}

// ❌ MAL — texto hardcoded
<CreateResult eyebrow="Éxito" title="Listo" />
```

---

## Checklist al implementar CreateResult en un módulo nuevo

- [ ] Importar `CreateResult` y `CreateResultRow` desde `~/ui/composed/CreateResult`
- [ ] Definir `eyebrow`, `title`, `description` en `messages.ts`
- [ ] Definir labels del resumen en `messages.ts` (`result*`)
- [ ] Renderizar `CreateResult` cuando `success.value` o `error.value`
- [ ] Pasar `tone="success"` o `tone="error"` según el estado
- [ ] Si es error, pasar `onRetry$={createItem$}` y `retryLabel`
- [ ] Slot `actions` con botón secundario ("Crear otro") + botón principal ("Ir a [módulo]")
- [ ] Botón principal navega a `ROUTES.MODULE_HUB`
- [ ] Verificar `npm run build.types && npm run check`

---

## Ver también

- [submit-and-delta.md](./submit-and-delta.md) — Principios de submit, delta de cambios, comparación inputs vs selects, reset de signals
- [edit-result.md](./edit-result.md) — Componente paralelo para acciones de editar
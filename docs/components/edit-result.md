# EditResult

Componente UI reutilizable para mostrar el resultado de una acción de **editar** (PATCH) en cualquier módulo: éxito (cambios guardados) o error (cambios fallidos).

Ubicación: `src/ui/composed/EditResult/`

Es paralelo a `CreateResult` (que es específico para POST/crear). Mismo idioma visual, mismo patrón, distinto namespace.

---

## Objetivo

Garantizar que **toda pantalla de edición** tenga la misma estructura visual al guardar exitosamente, evitando el patrón confuso de "Toast verde + seguir como si estuvieras editando".

**Usar cuando:**
- Una acción de editar termina en éxito o error (después de un PATCH)
- Se necesita mostrar un resumen de los datos editados
- Se necesita dar acciones al usuario ("Editar otra persona", "Ir a personas")

**No usar para:**
- Acciones de crear (usar `CreateResult`)
- Acciones de eliminar, toggle, etc. (no tienen patrón aún)
- Formularios activos (usar `Panel`)

---

## API

```ts
type EditResultTone = 'success' | 'error';

interface EditResultProps {
  tone?: EditResultTone;                // default: 'success'
  eyebrow: string;                      // ej: "Cambios guardados"
  title: string;                        // ej: "Persona actualizada"
  description?: string;
  onRetry$?: QRL<() => void | Promise<void>>;
  retryLabel?: string;                  // default: "Reintentar"
  class?: string;
}

interface EditResultRowProps {
  label: string;
  value: string | number | null | undefined;
  fallback?: string;                    // default: "—"
}
```

### Slots

| Slot | Contenido |
|---|---|
| **default** | Filas `EditResultRow` (resumen de lo editado) — opcional |
| **`actions`** | Botones de acción (ej: "Editar otra persona", "Ir a personas") |

---

## Estructura interna

Idéntica a `CreateResult` pero con namespace `edit-result__*` en vez de `create-result__*`. Header con tono (success/error), ícono circular grande, body opcional con `EditResultRow`, footer con acciones y botón "Reintentar" opcional.

```
<section data-tone="success|error">
  <header>
    <icon-container>          ← circular grande (4rem), color según tono
    <span eyebrow>            ← var(--font-mono), uppercase
    <h2>                       ← var(--font-display)
    <p description>            ← var(--font-text-muted)
  </header>

  <div class="body">          ← padding, oculta si no hay children (:empty)
    <slot default />           ← EditResultRow's
  </div>

  <div class="actions">       ← border-top, flex-end
    {tone === 'error' && onRetry$ && (
      <Button>Reintentar</Button>
    )}
    <slot name="actions" />    ← botones extra
  </div>
</section>
```

---

## Ejemplo completo

### Éxito con resumen

```tsx
import { EditResult, EditResultRow } from '~/ui/composed/EditResult';

<EditResult
  eyebrow={m.successResultEyebrow}
  title={m.successResultTitle}
  description={m.successResultDescription}
>
  <EditResultRow label={m.resultCurp} value={currentPerson.curp} />
  <EditResultRow label={m.resultName} value={currentPerson.fullName} />
  <EditResultRow label={m.resultGender} value={genderLabel} />

  <div q:slot="actions">
    <Button
      variant="ghost"
      iconLeft="view"
      onClick$={() => nav(ROUTES.PERSONS_DETAIL)}
    >
      {m.successResultViewAnother}
    </Button>
    <Button
      iconRight="chevron-right"
      onClick$={() => nav(ROUTES.PERSONS)}
    >
      {m.successResultFinish}
    </Button>
  </div>
</EditResult>
```

### Error con reintento

```tsx
<EditResult
  tone="error"
  eyebrow={m.errorResultEyebrow}
  title={m.errorResultTitle}
  description={error.value}
  onRetry$={updateItem$}
  retryLabel={m.errorRetry}
>
  <div q:slot="actions">
    <Button
      variant="secondary"
      onClick$={() => { resultTone.value = ''; }}
    >
      {m.errorBackToForm}
    </Button>
  </div>
</EditResult>
```

---

## Reglas obligatorias

1. **Toda pantalla de editar debe terminar en `EditResult`** (en éxito o en error), nunca en un `<Toast>` verde que se queda en el formulario.
2. **El slot `actions` debe tener al menos un botón** que saque al usuario de la pantalla (ir al hub) o le permita editar otro registro.
3. **El botón principal del slot `actions` debe navegar al hub del módulo** (no a la búsqueda, no al detalle), usando `ROUTES.MODULE_HUB`.
4. **El botón secundario del slot `actions` debe navegar al modo selección del módulo** (ej: `ROUTES.MODULE_DETAIL` sin `?id`), permitiendo "editar otro registro".
5. **El resumen (slot default) es opcional** pero recomendado: siempre que haya datos del registro editado, mostrarlos con `EditResultRow`.
6. **Los textos vienen de `src/config/messages.ts`** — nunca hardcodear strings en el JSX.
7. **Cuando `success.value === true`, ocultar el formulario** y mostrar el `EditResult`. Revertir con un nuevo track o reset explícito.
8. **NO** pasar `class` con estilos que rompan el patrón (colores, padding, bordes). Solo usarlo para `max-width` o ajustes de layout del contenedor padre.

---

## Anti-patrones (no hacer)

```tsx
// ❌ MAL — Toast solo, sin pantalla de resultado (el usuario queda atrapado)
{success.value && (
  <Toast tone="success" title="Cambios guardados" />
)}

// ❌ MAL — sin acciones, usuario no sabe qué hacer
<EditResult title="Cambios guardados" />

// ❌ MAL — texto hardcoded
<EditResult eyebrow="Éxito" title="Listo" />

// ❌ MAL — botón principal navega a otro lado que no es el hub
<Button onClick$={() => nav(ROUTES.PERSONS_DETAIL)}>Finalizar</Button>
```

---

## Patrón de uso estándar en edit

### Estructura del componente

```tsx
const success = useSignal(false);

const updateItem$ = $(async () => {
  // ... validación
  try {
    await itemService.update(id, dto);
    success.value = true;
  } catch (err) {
    error.value = normalizeError(err).message;
  }
});

return (
  <AuthenticatedShell ...>
    <ActionHeader q:slot="hub-header" ... />

    <div class="...">
      {/* ── Resultado de éxito ── */}
      {!loading.value && success.value && currentItem && (
        <EditResult ...>
          <EditResultRow ... />
          ...
        </EditResult>
      )}

      {/* ── Formulario ── */}
      {!loading.value && !success.value && currentItem && (
        <div class="...">
          {/* form fields */}
        </div>
      )}
    </div>
  </AuthenticatedShell>
);
```

### Acciones estandarizadas (mismo patrón en todos los módulos)

| Botón | Variante | Icono | Destino |
|---|---|---|---|
| Secundario | `ghost` | `view` | `ROUTES.MODULE_EDIT` (modo selección) |
| Primario | `primary` | `chevron-right` | `ROUTES.MODULE_HUB` |

---

## Checklist al implementar EditResult en un módulo nuevo

- [ ] Importar `EditResult` y `EditResultRow` desde `~/ui/composed/EditResult`
- [ ] Definir `successResultEyebrow`, `successResultTitle`, `successResultDescription` en `messages.ts`
- [ ] Definir labels del resumen (`resultCurp`, `resultName`, etc.) en `messages.ts`
- [ ] Definir `successResultViewAnother`, `successResultFinish` en `messages.ts`
- [ ] Renderizar `EditResult` cuando `success.value === true`
- [ ] **Ocultar el formulario** cuando `success.value === true` (`!success.value && currentItem`)
- [ ] Slot `actions` con botón secundario ("Editar otra [módulo]") + botón principal ("Ir a [módulo]")
- [ ] Botón secundario navega a `ROUTES.MODULE_DETAIL` (modo selección)
- [ ] Botón principal navega a `ROUTES.MODULE_HUB`
- [ ] Verificar `npm run build.types && npm run check`
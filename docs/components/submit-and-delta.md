# Submit y Delta de Cambios

Patrón estándar para `submit` de formularios en pantallas de acción (create, edit) en cualquier módulo.

---

## Objetivo

Garantizar que:
1. **No se hagan llamadas innecesarias al backend** cuando el usuario no cambió nada
2. **El backend reciba solo los campos que realmente cambiaron** (delta), evitando impacto innecesario en la BD
3. **La ficha de resultado muestre los datos actualizados** sin necesidad de un GET extra
4. **El botón de submit esté deshabilitado por defecto** y solo se habilite cuando hay cambios

---

## Principio 1: Botón deshabilitado por defecto

El botón "Guardar cambios" / "Crear" debe estar **deshabilitado cuando no hay cambios** en el formulario.

**Cómo detectar cambios** (computed `hasChanges`):

```ts
const hasChanges = useComputed$(() => {
  const ca = address.value;
  if (!ca) return false;

  // Inputs (textos): comparar strings trimmed
  const streetChanged = street.value.trim() !== (ca.street ?? '').trim();
  const exteriorChanged = exteriorNumber.value.trim() !== (ca.exteriorNumber ?? '').trim();

  // Selects (catálogos): comparar IDs directamente
  const originalStreetTypeId = streetTypes.value.find(
    (t) => t.name === ca.streetType || t.abbreviation === ca.streetType,
  )?.id ?? 0;
  const streetTypeChanged = streetTypeId.value !== originalStreetTypeId;

  return streetChanged || exteriorChanged || streetTypeChanged;
});
```

**Regla:**
- **Inputs** (texto) → comparar `signal.value.trim() !== original.trim()`
- **Selects** (catálogos numéricos) → comparar `signal.value !== originalId`

**Nunca** comparar strings de selects (el backend puede devolver abreviaturas como `"Av."` en vez de `"Avenida"`, causando falsos positivos).

---

## Principio 2: Enviar solo lo que cambió (delta)

El submit debe construir un objeto `changes` con **solo los campos modificados**:

```ts
const changes: Record<string, unknown> = {};

if (streetChanged) changes.street = street.value.trim();
if (exteriorChanged) {
  const v = exteriorNumber.value.trim();
  changes.exteriorNumber = v === '' ? null : v;  // null si borró
}
if (streetTypeChanged) changes.streetTypeId = streetTypeId.value;
// ... etc

// Si nada cambió, no llamar al backend
if (Object.keys(changes).length === 0) {
  error.value = 'No hay cambios para guardar.';
  saving.value = false;
  return;
}
```

**Reglas:**
- **Nunca enviar todos los campos siempre** — solo los que cambiaron
- **Campos opcionales vacíos** → enviar `null` (no `""` ni `undefined`), porque el backend rechaza valores con solo espacios
- **Campos obligatorios vacíos** → NO enviar, mostrar error de validación antes

---

## Principio 3: Backend devuelve datos actualizados (sin GET extra)

Después de un `POST` o `PATCH` exitoso, el backend devuelve la dirección/registro actualizado en `data.data`. **No hacer un GET extra** para refrescar la vista.

```ts
const updated = await addressService.update(id, changes);
address.value = updated;  // Asignar el response completo
success.value = true;     // Mostrar el Result component
```

El response del backend incluye **todos los campos semánticos** (calle, CP, asentamiento, municipio, estado, etc.) ya resueltos. Usar estos datos para llenar la ficha de resultado.

---

## Principio 4: Type `AddressInfo` (o equivalente)

Definir un tipo reducido que solo contenga los campos editables del formulario + los semánticos mínimos para pintar en la UI:

```ts
export interface AddressInfo {
  id: number;
  // Editables del formulario
  street: string;
  streetTypeId: number;
  exteriorNumber: string | null;
  interiorNumber: string | null;
  block: string | null;
  betweenStreets: string | null;
  zipCodeId: number;
  // Semánticos mínimos para UI
  streetType: string;
  zipCode: string;
  settlement: string;
  settlementType: string;
  locality: string;
  municipalityName: string;
  municipalCapital: string;
  stateName: string;
  // Para mostrar el titular
  curp: string;
  fullName: string;
}
```

TypeScript ignora cualquier propiedad adicional que devuelva el backend si no está en la interfaz.

---

## Principio 5: Validación de campos vacíos opcionales

Cuando el usuario borra un campo opcional, **el frontend debe enviar `null`** (no `""` ni `"   "`), porque el backend rechaza valores con solo espacios.

**Normalización:**

```ts
const normalize = (value: string | null | undefined): string | null => {
  const trimmed = (value ?? '').trim();
  return trimmed === '' ? null : trimmed;
};
```

**Uso en submit:**

```ts
if (exteriorChanged) {
  changes.exteriorNumber = normalize(exteriorNumber.value);
}
```

---

## Principio 6: Reset de signals al cambiar URL

Cuando el componente se desmonta o cambia la URL (`?id`), limpiar **todos** los signals:

```ts
useVisibleTask$(async ({ track }) => {
  const idParam = track(() => location.url.searchParams.get('id'));

  // Reset
  loading.value = true;
  error.value = '';
  address.value = null;
  success.value = false;
  selectionMode.value = false;

  // Inputs
  street.value = '';
  streetTypeId.value = 0;
  exteriorNumber.value = '';
  // ... etc

  // Búsqueda
  personQuery.value = '';
  personResults.value = [];
  // ... etc
});
```

Si no se limpian, al volver a entrar a la pantalla el usuario ve valores stale de la sesión anterior.

---

## Checklist al implementar submit en una pantalla de acción

- [ ] Computed `hasChanges` que detecta cambios (inputs con trim, selects con IDs)
- [ ] Botón de submit deshabilitado cuando `!hasChanges.value`
- [ ] Validación de campos obligatorios antes de submit
- [ ] Construcción de objeto `changes` solo con campos modificados
- [ ] Campos opcionales vacíos → `null` (no `""`)
- [ ] Si `changes` está vacío → no llamar al backend
- [ ] Después de submit exitoso: `address.value = response.data.data` (sin GET extra)
- [ ] Reset de todos los signals al cambiar URL
- [ ] Verificar `npm run build.types && npm run check`
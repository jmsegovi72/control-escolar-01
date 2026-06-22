# Patron de Busqueda Avanzada

## Objetivo

Este documento define como implementar una pantalla de `busqueda avanzada` dentro de un modulo del sistema.

La referencia funcional actual es:
- `src/routes/persons/search/`
- `src/routes/persons/demographics/search/`

La referencia visual y estructural base sigue el layout de acciones descrito en:
- `docs/action-and-hub-structure.md`

La idea es que cualquier programador pueda leer este documento e implementar una nueva accion de busqueda avanzada sin inventar layout, sin romper el shell y sin cambiar el comportamiento esperado del usuario.

---

## Resultado Esperado

Una pantalla de busqueda avanzada debe cumplir siempre con esto:

1. Usa `AuthenticatedShell` con `fullWidth`.
2. Usa `ActionHeader` en `q:slot="hub-header"`.
3. No agrega headers extra dentro del contenido.
4. Muestra una `barra de filtros` centrada con ancho maximo controlado por token.
5. Muestra la `tabla de resultados` ocupando el ancho disponible del area de trabajo.
6. No carga todos los registros al abrir la pantalla.
7. Solo consulta resultados cuando el usuario ejecuta la busqueda.
8. Al limpiar filtros, la pantalla vuelve al estado vacio inicial y no consulta todo.
9. Los filtros tipo `select` se cargan con catalogos al inicio.
10. Despues de la primera busqueda, los `select` dependientes se recalculan con los valores presentes en los resultados visibles.
11. Si el usuario entra a `ver` o `editar` desde la tabla y luego regresa, debe recuperar sus filtros y la tabla actualizada.

---

## Estructura de Layout

## Shell

Patron obligatorio:

```tsx
<AuthenticatedShell ... fullWidth>
  <ActionHeader q:slot="hub-header" ... />

  <div class="module-search-page">
    <div class="module-search-page__content">
      <section class="module-search__filters-panel">
        ...barra de filtros...
      </section>

      <section class="module-search__table-card">
        ...resultados...
      </section>
    </div>
  </div>
</AuthenticatedShell>
```

Reglas:
- `ActionHeader` siempre va en el slot del shell.
- La barra de filtros vive dentro del contenido de la accion.
- La tabla no va dentro de la misma tarjeta visual del filtro.
- La tabla es un bloque independiente y de ancho completo.

## Ancho de la barra de filtros

La barra de filtros no debe ocupar todo el ancho.

Usar siempre:

```css
width: min(100%, var(--layout-form-max-width));
margin: 0 auto;
```

Reglas:
- No hardcodear `600px`, `640px` ni valores literales.
- El ancho maximo lo controla el token `--layout-form-max-width`.
- Si el diseno cambia, se cambia el token, no cada pantalla.

## Ancho de la tabla

La tabla de resultados debe ocupar el ancho maximo disponible:

```css
.module-search__table-card {
  width: 100%;
}
```

La tabla no debe quedar contenida al ancho del formulario.

---

## Estructura Interna del Filtro

La barra de filtros tiene tres zonas:

1. `top`
2. `advanced`
3. `footer`

## Top

Contiene:
- campo global de busqueda
- boton para abrir/cerrar filtros avanzados
- boton para aplicar filtros

Patron:

```tsx
<div class="module-search__filters-top">
  <div class="module-search__global">
    <Input ... />
  </div>

  <div class="module-search__top-actions">
    <Button ...>{m.advancedToggle}</Button>
    <Button type="submit" ...>{m.applyFilters}</Button>
  </div>
</div>
```

## Advanced

Contiene los filtros propios del modulo.

Reglas:
- Debe abrir y cerrar sin recargar la pagina.
- Debe usar grids responsivos de 2 o 3 columnas.
- Los campos visibles dependen del modulo.
- La estructura visual es compartida; solo cambian los filtros.

Ejemplo:

```tsx
<div class="module-search__advanced" data-open={showFilters.value ? 'true' : undefined}>
  <div class="module-search__advanced-grid module-search__advanced-grid--three">
    ...
  </div>
</div>
```

## Footer

Contiene:
- resumen de filtros/resultados
- accion para limpiar filtros

Patron:

```tsx
<div class="module-search__filters-footer">
  <span class="module-search__filters-info">{filtersInfo.value}</span>
  <Button variant="ghost" ...>{m.clearFilters}</Button>
</div>
```

---

## Comportamiento de Carga Inicial

## Regla principal

La pantalla no debe hacer una consulta de resultados al abrir.

Estado inicial esperado:
- `rows = []`
- `total = 0`
- `searched = false`
- sin llamada a `findMany`
- la tabla muestra estado vacio orientado a buscar

Esto evita:
- cargar todos los registros sin necesidad
- consultas costosas
- ruido visual para el usuario
- dependencias incorrectas entre filtros y resultados

## Lo que si se carga al inicio

Solo se cargan:
- permisos de la vista
- catalogos base de los `select`
- contexto guardado de una busqueda previa, si existe

---

## Catalogos y Selects

## Carga inicial de catalogos

Cada modulo puede necesitar catalogos distintos. Esos catalogos deben cargarse al abrir la pantalla.

Ejemplo real de demografia:
- `GET /catalog/marital-statuses`
- `GET /catalog/indigenous-languages`
- `GET /catalog/foreign-languages`
- `GET /catalog/special-conditions`

Reglas:
- Los `select` deben tener placeholder vacio al inicio.
- No seleccionar un valor por defecto real.
- Si el backend usa shapes diferentes, normalizar en el servicio.

Ejemplo de normalizacion:
- `name`
- `status`
- `label`
- `description`

El componente de pantalla no debe llenarse de logica de parseo de API. Esa logica va en el servicio.

## Dependencia despues de buscar

Despues de la primera busqueda:
- los `select` dependientes deben recalcularse con los valores unicos presentes en `response.data`
- esto ayuda a que los filtros se vuelvan contextuales al conjunto actual

Ejemplo:
- antes de buscar, `estado civil` usa todo el catalogo
- despues de buscar, `estado civil` solo muestra valores existentes en los resultados visibles

Patron recomendado:

```tsx
const source =
  searched.value && resultValues.value.length > 0
    ? resultValues.value.map(...)
    : catalogValues.value;
```

## Respaldo

Si un catalogo falla y la UX no puede quedar vacia, se puede definir un respaldo local solo si el modulo ya tiene una lista oficial conocida.

Eso fue necesario en demografia como defensa adicional, pero la fuente principal sigue siendo backend.

---

## Aplicar Filtros

La pantalla debe consultar resultados solo cuando el usuario hace submit.

Patron:

```tsx
onSubmit$={async () => {
  if (loading.value) return;
  page.value = 1;
  await searchModule$();
}}
```

Reglas:
- Al cambiar filtro no se consulta automaticamente.
- Al aplicar filtros se reinicia `page = 1`.
- Si existe `searchTerm` separado de `appliedSearchTerm`, guardar el valor aplicado antes de consultar.

---

## Limpiar Filtros

Limpiar filtros debe:
- resetear todos los campos
- limpiar resultados
- limpiar chips
- limpiar valores dependientes de resultados
- dejar `searched = false`
- cerrar panel avanzado si el modulo asi lo requiere
- no hacer consulta de resultados

Patron:

```tsx
const clearFilters$ = $(() => {
  ...
  rows.value = [];
  total.value = 0;
  searched.value = false;
  ...
});
```

Error comun a evitar:
- limpiar filtros y disparar una consulta que carga todos los registros

Eso no esta permitido en este patron.

---

## Estado Informativo del Footer

El texto del footer debe distinguir entre:

1. Pantalla virgen
2. Busqueda sin filtros
3. Busqueda con filtros

Patron:

- Estado inicial:
  `Sin filtros activos · Listo para buscar`
- Con resultados sin filtros:
  `Sin filtros activos · X registros`
- Con filtros activos:
  `N filtros activos · X registros`

No mostrar frases como:
- `Mostrando todos los registros`

si la pantalla aun no ha hecho una busqueda.

---

## Chips de Filtros Activos

Si el modulo lo necesita, mostrar chips con filtros activos.

Reglas:
- Cada chip representa un filtro aplicado.
- Cada chip puede eliminarse individualmente.
- Al quitar un chip, se vuelve a ejecutar la busqueda con el resto de filtros.
- El chip debe mostrar texto entendible, no ids internos.

---

## Tabla de Resultados

La tabla debe:
- ocupar el ancho disponible
- usar `DataTable`
- tener `empty state` coherente para estado inicial y sin resultados
- incluir acciones de fila del modulo

Ejemplos de acciones:
- ver detalle
- editar
- otras acciones del modulo

Las columnas dependen del modulo, pero el contenedor visual debe respetar el patron compartido.

---

## Persistencia del Contexto de Busqueda

Si desde la tabla se navega a otra accion del mismo modulo, la busqueda debe poder recuperarse.

Ejemplo real:
- busqueda avanzada
- abrir detalle de un registro
- editar el registro
- regresar
- ver nuevamente la tabla con filtros y resultados actualizados

## Como se implementa

Usar un helper de workflow por modulo en `src/utils/`.

Ejemplos:
- `src/utils/persons-workflow.ts`
- `src/utils/demographics-workflow.ts`

Ese helper debe guardar:
- filtros activos
- pagina
- limite
- ruta de retorno
- item seleccionado opcional

Patron:

```ts
moduleWorkContext.save({
  filters,
  module: 'module-name',
  returnPath: '/ruta/de/busqueda',
  selectedItem,
});
```

## Cuando guardar

Guardar el contexto antes de navegar desde una accion de tabla:

```tsx
onClick$: $(async (row) => {
  await saveWorkContext$(row);
  await nav(`${ROUTES.MODULE_DETAIL}?id=${row.id}`);
})
```

## Cuando restaurar

Restaurar el contexto en `useVisibleTask$` de la pantalla de busqueda:
- rehidratar filtros
- rehidratar pagina y limite
- abrir panel avanzado si corresponde
- volver a consultar resultados

## Boton Regresar

En detalle o editar:
- primero usar `returnPath` del workflow si existe
- si no existe, usar historial del navegador si aplica
- si tampoco aplica, volver al hub del modulo

Esto evita que el usuario pierda el contexto desde el que llego.

---

## Textos y Configuracion

Reglas del proyecto:
- ningun texto visible va hardcodeado en la ruta
- todos los textos van en `src/config/messages.ts`
- ninguna ruta va hardcodeada
- usar `ROUTES.*`

La busqueda avanzada de un modulo debe tener su bloque de mensajes propio:
- titulos
- placeholders
- columnas
- acciones
- estados vacios
- textos del footer

---

## Servicios y Tipos

Para implementar una nueva busqueda avanzada, normalmente se necesitan:

1. Tipos del modulo para `findMany`
2. Servicio del modulo con filtros
3. Tipos y servicios de catalogos, si existen selects
4. Helper de workflow del modulo

Checklist tecnico:
- definir DTO de filtros
- implementar `findMany`
- normalizar respuesta paginada
- extraer metadatos de total
- tipar catalogos
- normalizar valores de catalogos

---

## Checklist de Implementacion

## Layout

- `AuthenticatedShell` con `fullWidth`
- `ActionHeader` en `q:slot="hub-header"`
- sin headers extra dentro del contenido
- panel de filtros con ancho `min(100%, var(--layout-form-max-width))`
- tabla de resultados a ancho completo

## Estado

- `rows`
- `total`
- `page`
- `limit`
- `loading`
- `searched`
- `error`
- `showFilters`

## Filtros

- `searchTerm`
- filtros avanzados propios del modulo
- catalogos base
- valores dependientes de resultados

## Flujo

- no consultar al abrir
- cargar catalogos al inicio
- consultar solo al enviar formulario
- reiniciar pagina al buscar
- limpiar sin consultar todo
- recalcular selects dependientes tras la primera consulta
- guardar contexto antes de navegar desde la tabla
- restaurar contexto al regresar

## Calidad

- `npm run build.types`
- `npm run check`

---

## Referencias Reales

Pantallas:
- `src/routes/persons/search/index.tsx`
- `src/routes/persons/search/search.css`
- `src/routes/persons/demographics/search/index.tsx`
- `src/routes/persons/demographics/search/search.css`

Helpers:
- `src/utils/module-work-context.ts`
- `src/utils/persons-workflow.ts`
- `src/utils/demographics-workflow.ts`

Servicios:
- `src/services/person/person.service.ts`
- `src/services/demographic/demographic.service.ts`
- `src/services/catalog/catalog.service.ts`

---

## Regla Final

Cada modulo puede cambiar:
- que filtros muestra
- que columnas renderiza
- que catalogos consume
- que acciones ofrece en la tabla

Pero no debe cambiar:
- la estructura del shell
- el patron de layout
- la logica de carga inicial
- la regla de no consultar todo al abrir
- la regla de filtros dependientes despues de buscar
- la persistencia del contexto de trabajo

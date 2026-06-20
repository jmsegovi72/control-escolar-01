# Estructura de Hub y Pantallas de Accion

## Objetivo

Este documento define la estructura oficial para dos tipos de pantallas dentro de `control-escolar-01`:

1. `Hub de acciones`
2. `Pantallas de accion`

La meta es que todas las vistas existentes y futuras usen la misma arquitectura del shell para evitar errores de ancho, scroll, barras duplicadas, headers montados en el lugar incorrecto o fixes visuales innecesarios.

---

## Dos Tipos de Pantalla

### 1. Hub de acciones

Es la pantalla menu de un modulo.

Ejemplos:
- `persons/index`
- cualquier pantalla que solo lista o agrupa acciones del modulo

Su estructura visual es:

1. `Sidebar`
2. `Header` principal del sistema
3. `HubHeader`
4. `HubContent`

### 2. Pantalla de accion

Es una vista operativa concreta.

Ejemplos:
- `persons/detail`
- `persons/create`
- futuras pantallas como `edit`, `toggle`, `search`, `import`, etc.

Su estructura visual es:

1. `Sidebar`
2. `Header` principal del sistema
3. `ActionHeader`
4. `Toolbar` opcional de la accion
5. `ActionContent`

Importante:
- `Header` principal, `HubHeader` y `ActionHeader` no representan lo mismo
- el `HubHeader` pertenece al menu del modulo
- el `ActionHeader` pertenece a una accion concreta
- `HubHeader` y `ActionHeader` no deben mezclarse en la misma vista

---

## Fuente de Verdad

### Fuente de verdad para pantallas de accion

La referencia principal es:
- `src/routes/persons/detail/index.tsx`
- `src/routes/persons/detail/detail.css`

`persons/detail` define la estructura base correcta de una accion sin barra de pasos.

Patron correcto:
- `ActionHeader` montado como hijo directo de `AuthenticatedShell`
- `ActionHeader` usando `q:slot="hub-header"`
- contenido real dentro de `.person-detail-page`
- area interna dentro de `.person-detail__content`

Ejemplo:

```tsx
<AuthenticatedShell ... fullWidth>
  <ActionHeader q:slot="hub-header" ... />

  <div class="person-detail-page">
    <div class="person-detail__content">
      ...contenido...
    </div>
  </div>
</AuthenticatedShell>
```

### Variante con barra de pasos

La referencia de accion con pasos es:
- `src/routes/persons/create/index.tsx`
- `src/routes/persons/create/create.css`

Patron correcto:
- `ActionHeader` en `q:slot="hub-header"`
- `StepIndicator` en `q:slot="toolbar"`
- contenido real dentro de `.create-person-page`
- area interna dentro de `.create-person-stage`

Ejemplo:

```tsx
<AuthenticatedShell ... fullWidth>
  <ActionHeader q:slot="hub-header" ... />

  <StepIndicator q:slot="toolbar" ... />

  <div class="create-person-page">
    <div class="create-person-stage">
      ...contenido...
    </div>
  </div>
</AuthenticatedShell>
```

---

## Donde Va Cada Pieza

### `HubHeader`

Se usa solo en el hub del modulo.

Siempre debe ir en:
- la capa del shell destinada al encabezado del hub

Nunca debe ir:
- dentro del contenido centrado
- dentro de tarjetas
- dentro de toolbars de accion

### `ActionHeader`

Se usa solo en pantallas de accion.

Siempre debe ir en:
- `q:slot="hub-header"`

Nunca debe ir:
- dentro de `.page`
- dentro del contenido scrollable
- dentro de `toolbar`
- dentro de un `Panel`, `Card` o contenedor centrado

### `StepIndicator`

Si la accion tiene pasos, debe ir en:
- `q:slot="toolbar"`

Nunca debe ir:
- dentro de `.create-person-page`
- dentro de `.create-person-stage`
- dentro del mismo bloque visual del `ActionHeader`

### `HubContent`

Es el contenido del menu de acciones.

Ejemplos:
- tarjetas de acciones
- accesos directos
- grupos de modulos
- descripciones del modulo

### `ActionContent`

Es el trabajo real de la accion.

Ejemplos:
- formularios
- resultados
- paneles
- buscadores
- toasts de error propios de la accion

Nunca deben vivir dentro del contenido:
- `HubHeader`
- `ActionHeader`
- `StepIndicator`
- controles globales del shell

---

## Reglas de Scroll

### Hub de acciones

El hub normalmente no necesita una barra de pasos.

La regla es:
- el shell resuelve las barras superiores
- el contenido del hub vive debajo
- no se debe meter el header del hub dentro de tarjetas ni contenedores centrados

### Pantallas de accion sin pasos

Como `persons/detail`:
- `ActionHeader` arriba
- contenido debajo
- scroll normal del area de trabajo

### Pantallas de accion con pasos

Como `persons/create`:
- `ActionHeader` fijo arriba
- `StepIndicator` fijo debajo
- el trabajo de la accion debe desplazarse debajo de esas barras

---

## Reglas de CSS

### Regla sobre valores hardcodeados

Todos los valores visuales (colores, espacios, radios, anchos) deben venir de tokens definidos en `src/ui/styles/tokens.css`.

**Nunca** escribir valores literales como:
- Colores: `color: #3060CC` ❌
- Espacios: `padding: 16px 22px` ❌
- Radios: `border-radius: 14px` ❌
- Anchos: `width: 600px` ❌
- Bordes: `border: 1.5px solid` ❌

Usar siempre tokens:
- `color: var(--color-primary)` ✓
- `padding: var(--space-4) var(--space-5)` ✓
- `border-radius: var(--radius-5)` ✓
- `width: min(100%, var(--layout-form-max-width))` ✓
- `border: var(--border-width-2) solid var(--color-primary)` ✓

Si el valor no existe como token, agregarlo a `tokens.css` primero. No agregar un `:root { --x: 37.5rem; }` local en el archivo de la ruta — eso es un valor hardcodeado disfrazado de variable.

**Para los anchos de formulario**, el token es:
```css
--layout-form-max-width: 37.5rem; /* 600px */
```

### Wrapper raiz de pagina

Usar un wrapper simple y limpio:

```css
.page-root {
  display: grid;
  gap: 0;
  background: var(--color-bg);
  min-width: 0;
}
```

No usar:
- margenes negativos
- compensaciones para pegar barras
- trucos para estirar ancho
- wrappers extra para corregir layout roto

### Contenido real

Usar una capa interna clara:

```css
.page-content {
  display: grid;
  gap: var(--space-4);
  align-content: start;
  width: 100%;
  min-width: 0;
  padding: var(--space-8) var(--space-4);
  box-sizing: border-box;
}
```

### Bloques centrados

Solo las tarjetas o paneles internos pueden limitar ancho.

```css
.page-card {
  width: min(100%, var(--layout-form-max-width));
  margin: 0 auto;
}
```

**Token:**
```css
--layout-form-max-width: 37.5rem; /* 600px */
```

Este token esta en `src/ui/styles/tokens.css`. Si en el futuro cambia el ancho de los formularios (por ejemplo a 720px), solo se modifica el token en un lugar y todos los formularios se actualizan.

Nunca debe centrarse:
- `HubHeader`
- `ActionHeader`
- `StepIndicator`
- `Toolbar`

### Regla para estados simples vs resultados

En una misma pantalla de accion pueden coexistir dos reglas de ancho distintas.

Los siguientes bloques si pueden ir en un contenedor interno con `var(--layout-form-max-width)` (600px):
- formularios cortos
- loaders
- estados vacios
- exito
- error

Los siguientes bloques no deben quedar encerrados en un `max-width` angosto:
- tablas
- resultados
- revisiones masivas
- busquedas avanzadas

Regla oficial:
- estados simples: `width: min(100%, 40rem)`
- resultados con tabla: `width: 100%` del area util del workspace
- los margenes laterales los resuelve el layout general, no la pantalla

Error comun:
- reutilizar el mismo wrapper centrado para la captura inicial y para la tabla de resultados

Solucion:
- separar el contenedor de estados simples del contenedor ancho de resultados

---

## Regla de Ancho

### En hubs

- `HubHeader` debe ocupar 100%
- el area del hub puede tener tarjetas centradas o grillas segun el modulo

### En pantallas de accion

- `ActionHeader` debe ocupar 100%
- `StepIndicator` debe ocupar 100%
- el contenido puede centrarse solo internamente

Esto significa:
- barras arriba: ancho completo
- tarjetas internas: ancho segun la necesidad de la accion o del hub

---

## Errores que ya no se deben repetir

### Error 1: tratar hub y accion como si fueran la misma pantalla

Problema:
- se mezclan responsabilidades
- se reutiliza mal el header
- se rompe la jerarquia visual

Solucion:
- decidir primero si la pantalla es hub o accion
- aplicar el patron correcto de ese tipo

### Error 2: montar headers dentro del contenido

Problema:
- se mueven con el scroll
- parecen una tarjeta o una barra interna

Solucion:
- montar el header en la capa superior del shell

### Error 3: montar la barra de pasos dentro del contenido

Problema:
- se desplaza con el formulario
- rompe la jerarquia visual

Solucion:
- moverla a `q:slot="toolbar"`

### Error 4: usar margenes negativos para pegar barras

Problema:
- genera parches fragiles
- produce separaciones raras
- hace dificil replicar el patron en otras pantallas

Solucion:
- usar la estructura correcta del shell
- dejar que `AppShell` controle las capas superiores

### Error 5: centrar toda la pantalla en vez de centrar solo el contenido interno

Problema:
- el header deja de ocupar 100%
- la barra de pasos parece metida en otra barra
- el hub pierde el ancho real del shell

Solucion:
- centrar solo paneles, tarjetas o bloques internos
- nunca centrar la estructura superior

---

## Procedimiento para migrar una vista existente

1. Determinar si la vista es `hub` o `accion`
2. Verificar si usa `AuthenticatedShell fullWidth`
3. Sacar headers y barras de la zona de contenido si estan mal montados
4. Montar la capa superior correcta:
   - `HubHeader` para hubs
   - `ActionHeader` para acciones
   - `StepIndicator` en `toolbar` si hay pasos
5. Dejar dentro de la pagina solo el contenido real
6. Eliminar fixes heredados, margenes negativos y wrappers estructurales incorrectos
7. Confirmar ancho completo de las barras superiores
8. Validar scroll en el lugar correcto

---

## Procedimiento para una vista nueva

### Si es hub

1. Crear route con `AuthenticatedShell`
2. Definir `HubHeader`
3. Crear wrapper de pagina simple
4. Montar tarjetas o acciones dentro de `HubContent`
5. Validar ancho completo arriba

### Si es accion

1. Crear route con `AuthenticatedShell`
2. Definir `ActionHeader` en `hub-header`
3. Definir `StepIndicator` en `toolbar` solo si aplica
4. Crear wrapper de pagina simple
5. Crear contenedor interno de `ActionContent`
6. Agregar paneles, formularios o resultados dentro del contenido
7. Validar ancho completo de barras
8. Validar scroll antes de cerrar la tarea

---

## Checklist rapido

Antes de dar una vista por buena, confirmar:

- ya se definio si la vista es `hub` o `accion`
- el header correcto esta en la capa correcta
- si hay pasos, `StepIndicator` esta en `q:slot="toolbar"`
- las barras superiores ocupan 100%
- el contenido vive en un wrapper propio
- las tarjetas centradas son internas, no estructurales
- no hay margenes negativos
- no hay barras dentro de otras barras
- el scroll ocurre en la zona correcta
- la estructura coincide con la fuente de verdad correspondiente

---

## Archivos de referencia

### Shell base
- `src/components/layout/AuthenticatedShell/AuthenticatedShell.tsx`
- `src/ui/patterns/AppShell/AppShell.tsx`
- `src/ui/patterns/AppShell/app-shell.css`

### Pantalla de accion base
- `src/routes/persons/detail/index.tsx`
- `src/routes/persons/detail/detail.css`

### Pantalla de accion con pasos
- `src/routes/persons/create/index.tsx`
- `src/routes/persons/create/create.css`

### Componentes superiores
- `src/ui/composed/ActionHeader/ActionHeader.tsx`
- `src/ui/composed/ActionHeader/action-header.css`
- `src/ui/composed/StepIndicator/StepIndicator.tsx`
- `src/ui/composed/StepIndicator/step-indicator.css`

---

## Regla de consistencia para elementos tipo link

Si un control se ve como `link` o comunica una accion secundaria tipo link, no debe estilizarse de forma local en cada pantalla.

La regla oficial es:

1. usar el patron compartido del sistema
2. usar los mismos tokens de color, peso, tamano, line-height, hover y focus
3. evitar clases locales para que un link se vea diferente en otro modulo sin razon funcional real

Esto aplica a ejemplos como:
- `Recuperar contraseña`
- `Cambiar CURP`
- acciones secundarias textuales dentro de formularios o paneles

Decision del proyecto:
- si un elemento es visualmente un `link`, debe heredar del mismo patron comun
- los modulos no deben crear una variante propia solo por conveniencia visual
- si hace falta una nueva variante, primero se define en el sistema compartido y luego se reutiliza

Objetivo:
- mismo lenguaje visual en todas las acciones
- menos divergencias entre modulos
- mantenimiento mas simple
- menos parches CSS locales

---

## Regla de respaldo despues de aprobar cambios

Cuando una pantalla o ajuste ya fue probado y aprobado visual o funcionalmente, no debe quedarse solo como cambio local.

La regla oficial es:

1. hacer `commit` del estado aprobado
2. hacer `push` a GitHub inmediatamente
3. continuar con la siguiente pantalla o ajuste solo despues de que ese respaldo exista en remoto

Esto evita perder trabajo cuando:
- otro programador rompe una vista despues
- alguien hace un revert equivocado
- la maquina local falla
- se mezclan cambios buenos con cambios experimentales

Importante:
- `guardar` archivos no crea respaldo
- `commit` sin `push` solo protege en local
- el respaldo oficial del proyecto existe hasta que el cambio aprobado esta en GitHub

Regla practica del equipo:
- pantalla aprobada = `commit` + `push`
- refactor aprobado = `commit` + `push`
- fix delicado ya validado = `commit` + `push`

Si un cambio todavia esta en prueba, puede seguir local.
Si un cambio ya quedo bien, no debe quedarse sin respaldo remoto.

---

## Decision final del proyecto

A partir de este punto, la regla oficial del proyecto es:

- primero se decide si la vista es `hub` o `accion`
- el hub usa su propia estructura
- la accion usa la estructura validada en `persons/detail`
- si la accion tiene pasos, usa la variante validada en `persons/create`
- cualquier vista que no siga este patron debe refactorizarse antes de seguir parchando estilos

---

## Componentes UI oficiales (no inventar el patrón)

Estas son las piezas validadas del sistema. Cualquier pantalla de accion **DEBE** usarlas. Si necesitas algo que no esta aqui, primero revisa si ya existe, y si no, crealo en `src/ui/composed/` documentandolo.

| Componente | Doc | Cuando usarlo |
|---|---|---|
| `HubHeader` | (en codigo) | Pantalla hub de modulo |
| `ActionHeader` | (en codigo) | Pantalla de accion (header con back + title) |
| `ActionCard` / `ActionRow` | (en codigo) | Items dentro del hub |
| `StepIndicator` | [step-indicator.md](./components/step-indicator.md) | Wizard multi-paso (toolbar) |
| `CreateResult` | [create-result.md](./components/create-result.md) | Resultado de accion de crear (success/error) |
| `Panel` | (en codigo) | Contenedor neutro de secciones en forms |

### Regla critica: resultado de accion

Toda pantalla de crear **debe** terminar en `CreateResult` (success o error). Ver [create-result.md](./components/create-result.md) para API, ejemplos y reglas.

### Regla critica: wizard multi-paso

Toda pantalla con pasos **debe** pasar `tone` al `StepIndicator` cuando hay resultado conocido. Sin esto, el ultimo paso queda en azul cuando deberia ser verde (success) o rojo (error). Ver [step-indicator.md](./components/step-indicator.md).



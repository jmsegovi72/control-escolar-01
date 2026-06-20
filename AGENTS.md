# AGENTS.md — control-escolar-app

## Stack

- **Framework**: Qwik 1.20+ / Qwik City (enrutamiento por archivos), SSR primero
- **Build**: Vite 7.3, TypeScript 5.4
- **Lint/Fmt**: Biome 2.4 (`npm run check`, `npm run fmt`, `npm run lint`)
- **HTTP**: Axios
- **Sin framework de tests** configurado
- **Arquitectura detallada** en [`ARCHITECTURE.md`](./ARCHITECTURE.md)

## Comandos de desarrollo

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor dev en `127.0.0.1:5175` (SSR) |
| `npm run dev` | Igual que start, sin `--open` |
| `npm run dev.debug` | Servidor dev con `--inspect-brk` |
| `npm run build` | Build producción (cliente + SSR) |
| `npm run build.types` | TypeScript check (`tsc --incremental --noEmit`) |
| `npm run check` | Biome lint + verificación de formato |
| `npm run fmt` | Autoformato con Biome (`biome format --write .`) |
| `npm run fmt.check` | Solo verificar formato |
| `npm run qwik add` | Agregar integraciones (adaptadores, etc.) |

**Antes de commit**: `build.types -> check`

## Arquitectura

Dos repositorios:
- **`control-escolar-v1/`** (directorio hermano) — librería UI (primitivas, patrones, tokens)
- **`control-escolar-app/`** (este repo) — lógica de negocio, páginas, servicios API

Alias `~/*` → `./src/*` (mediante `vite-tsconfig-paths`).

## Convenciones (obligatorio)

1. **Sin texto hardcodeado** — todos los textos visibles en `src/config/messages.ts` (type-safe, `as const`)
2. **Sin rutas hardcodeadas** — usar constantes `ROUTES.*` de `src/config/routes.ts`
3. **UI desde `~/ui` solamente** — importar con `import { Button } from '~/ui'`
4. **Nuevo componente UI reutilizable** → crear en `control-escolar-v1/src/ui/`, luego consumir desde `~/ui`
5. **Servicios** en `src/services/` — no inventar endpoints del backend; solicitar explícitamente
6. **Sesión**: `localStorage` mediante helper `sessionStore` (`src/utils/session.ts`)
7. **Permisos**: `hasPermission(permisos, modulo, 'read'|'write')` de `src/utils/permissions.ts`
8. **Páginas autenticadas** envueltas en `<AuthenticatedShell>` (no usar archivos `layout.tsx` — no existen en este repo)
9. **Convención Qwik**: handlers con sufijo `$` (`onClick$`, `useVisibleTask$`)
10. **CSS**: archivos `.css` planos con custom properties (sin Tailwind, sin CSS modules)

## Detalles de enrutamiento

- Tanto `/` como `/login` muestran la página de login (`src/routes/index.tsx` es re-exportado por `src/routes/login/index.tsx`)
- Login redirige a `/dashboard` al éxito, o a `/change-password` si es primer login
- Sesión expirada redirige a `/login?expired=session` o `/login?expired=temporary`
- No hay `layout.tsx` en directorios de rutas; el layout de auth es `<AuthenticatedShell>` usado por página

## Archivos clave

| Ruta | Propósito |
|---|---|
| `src/config/messages.ts` | Todos los textos visibles |
| `src/config/routes.ts` | Constantes de rutas (`ROUTES.*`) |
| `src/config/env.ts` | Variables de entorno (`PUBLIC_API_URL`) |
| `src/config/app.config.ts` | Nombre, descripción, iniciales |
| `src/services/api.client.ts` | Instancia Axios con interceptores auth |
| `src/services/auth/auth.service.ts` | Login, manejo de sesión |
| `src/utils/session.ts` | `sessionStore` (wrapper de localStorage) |
| `src/utils/permissions.ts` | Helper `hasPermission()` |
| `src/utils/api-error.ts` | Normalización de errores |
| `src/root.tsx` | Raíz de la app (`QwikCityProvider`) |
| `src/entry.ssr.tsx` | Punto de entrada SSR |
| `src/types/` | Definiciones TypeScript (auth, user, person, address, etc.) |
| `src/components/` | Componentes específicos de la app (layout, router-head, persons, users) |

## Docs de patrones UI

Estos documentos son **la fuente de verdad** para implementar pantallas. Antes de inventar algo, leerlos.

| Doc | Cubre |
|---|---|
| [`docs/action-and-hub-structure.md`](./docs/action-and-hub-structure.md) | Estructura oficial de hubs y pantallas de acción |
| [`docs/components/create-result.md`](./docs/components/create-result.md) | `CreateResult` — ficha de resultado de crear (success/error) |
| [`docs/components/step-indicator.md`](./docs/components/step-indicator.md) | `StepIndicator` — wizard multi-paso, regla obligatoria de `tone` |

## Entorno

- `PUBLIC_API_URL` o `VITE_API_URL` — defaults a `http://localhost:3000/sices/v3`
- `PUBLIC_API_HEALTH_URL` o `VITE_API_HEALTH_URL` — health endpoint opcional

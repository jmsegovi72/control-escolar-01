# Arquitectura del Proyecto Control Escolar (SICES V1)

## Estructura General: Dos Proyectos

```
D:\mac\myCode\js\qwik\
├── control-escolar-v1\        ← ALMACÉN UI (componentes, tokens, iconos)
│   └── src\
│       └── ui\
│           ├── primitives\    ← Componentes atómicos (Button, Input, Select, Badge, etc.)
│           ├── composed\      ← Componentes compuestos (Toast, Dialog, SearchSelect, etc.)
│           ├── patterns\      ← Patrones de página (DataTable, Sidebar, AppShell, etc.)
│           ├── icons\         ← Mapas de iconos (icon-map.ts, icon-intents.ts)
│           ├── registry\      ← Registro de componentes (component-registry.ts)
│           └── styles\        ← TOKENS CSS y estilos base
│               ├── tokens.css       ← Design tokens (colores, fuentes, espaciado, sombras)
│               ├── themes.css       ← Temas (light/dark)
│               ├── reset.css        ← Reset CSS
│               ├── motion.css       ← Animaciones y transiciones
│               └── index.css        ← Entry point de estilos
│
└── control-escolar-app\       ← APLICACIÓN (lógica de negocio, páginas, servicios)
    ├── src\
    │   ├── config\
    │   │   ├── messages.ts    ← ALMACÉN DE MENSAJES (todos los textos visibles)
    │   │   ├── routes.ts      ← Constantes de rutas
    │   │   ├── app.config.ts  ← Config de la app (nombre, iniciales)
    │   │   └── env.ts         ← Variables de entorno
    │   ├── routes\            ← Páginas de la aplicación
    │   │   ├── index.tsx      ← Login
    │   │   ├── dashboard\     ← Dashboard
    │   │   ├── users\         ← Módulo Usuarios (hub, search, edit, create, detail, reset-login)
    │   │   └── change-password\
    │   ├── services\          ← Servicios de API (auth, user, catalog, health)
    │   ├── types\             ← Tipos TypeScript (user.types, api.types, auth.types, etc.)
    │   ├── utils\             ← Utilidades (api-error, session, navigation, password-rules)
    │   └── components\        ← Componentes específicos de la app (layout, router-head)
    └── package.json
```

---

## 1. Almacén UI (`control-escolar-v1`)

### Propósito
Proyecto independiente que contiene **todos los componentes visuales reutilizables** y **tokens de diseño**. Se desarrolla, visualiza y prueba de forma aislada.

### Categorías de componentes

| Carpeta | Categoría | Qué contiene | Ejemplos |
|---|---|---|---|
| `primitives/` | Atómicos | Componentes base de formularios y UI | Button, Input, Select, Checkbox, Badge, Panel, Field, Avatar |
| `composed/` | Compuestos | Componentes que combinan varios primitivos | Toast, Dialog, SearchSelect, NotificationCenter, FileUpload, DateRangeInput |
| `patterns/` | Patrones | Componentes de página completos | DataTable, Sidebar, AppShell, ConfirmAction, Toolbar, Stepper |

### Tokens CSS (`src/ui/styles/`)
```css
/* tokens.css - Design tokens */
--font-sans, --font-size-sm, --space-4, --radius-2, --color-primary, etc.

/* themes.css - Temas claro/oscuro */
--bg-page, --text-primary, --border-subtle, etc.
```

### Reglas del Almacén UI
1. **Los componentes NO contienen textos visibles** (esos van en `messages.ts` de la app)
2. **Los componentes NO tienen lógica de negocio** (solo presentación)
3. Todo componente reutilizable se crea **primero aquí**, se prueba, y luego se consume desde la app
4. Se exporta desde `src/ui/index.ts` y se registra en `src/ui/registry/component-registry.ts`

---

## 2. Aplicación (`control-escolar-app`)

### Propósito
Proyecto que consume los componentes del almacén UI y contiene **toda la lógica de negocio, servicios, páginas y configuración**.

### Reglas de desarrollo

#### a) Almacén de mensajes (`src/config/messages.ts`)
- **Todos los textos visibles** van aquí, **nunca hardcodeados** en componentes
- Estructura por módulo: `messages.users.edit.title`, `messages.errors.loginFailed`
- Type-safe gracias a `as const`
- **Ortografía correcta**: acentos, ñ, mayúsculas/minúsculas

#### b) Rutas (`src/config/routes.ts`)
- Todas las rutas como constantes: `ROUTES.USERS_EDIT`
- **Nunca rutas hardcodeadas** en strings

#### c) Servicios de API (`src/services/`)
- **No inventar rutas ni respuestas del backend**
- Si se necesita un endpoint nuevo, se solicita explícitamente
- Los servicios existentes: `auth/`, `user/`, `catalog/`, `health/`

#### d) Flujo para agregar un componente
1. Buscar en el almacén UI (`control-escolar-v1/src/ui/`) si el componente ya existe
2. Si **NO existe**: crearlo en el almacén, probarlo allí, luego consumirlo
3. Si **SÍ existe**: importarlo desde `~/ui` (ej: `import { Button, Toast } from '~/ui'`)
4. Los textos del componente van en `src/config/messages.ts`
5. Las rutas van en `src/config/routes.ts`

#### e) Flujo para crear una página nueva
1. Crear carpeta en `src/routes/{modulo}/`
2. Usar `AuthenticatedShell` como layout si requiere autenticación
3. Usar componentes del almacén UI para la interfaz
4. Referenciar textos desde `messages.ts`
5. Referenciar rutas desde `ROUTES`
6. Servicios solo desde `src/services/`
7. Utilidades desde `src/utils/`

### Archivos clave

| Archivo | Propósito |
|---|---|
| `src/config/messages.ts` | Todos los textos visibles del sistema |
| `src/config/routes.ts` | Constantes de rutas |
| `src/config/env.ts` | Variables de entorno (API_URL, etc.) |
| `src/config/app.config.ts` | Nombre e iniciales del sistema |
| `src/root.tsx` | Raíz de la aplicación Qwik |
| `src/utils/api-error.ts` | Normalización de errores de API |
| `src/utils/session.ts` | Manejo de sesión |
| `src/utils/users-workflow.ts` | Flujo de navegación entre pantallas de usuarios |

---

## 3. Flujo de trabajo típico

### Desarrollo de un feature nuevo

```
1. Definir textos en messages.ts
2. Definir rutas en routes.ts
3. Crear/verificar componente en almacén UI
4. Crear página en routes/{modulo}/
5. Conectar con servicio de API
6. Probar visualmente
```

### Ejemplo: Crear pantalla "Editar usuario"

```tsx
// ✅ Correcto
import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
import { Button, Panel } from '~/ui';
import { userService } from '~/services/user/user.service';

// ❌ Incorrecto - textos hardcodeados
<Button>Guardar</Button>

// ✅ Correcto - textos desde messages
<Button>{messages.users.edit.actionSave}</Button>

// ❌ Incorrecto - rutas hardcodeadas
await nav('/users/edit?id=5');

// ✅ Correcto - rutas desde constantes
await nav(`${ROUTES.USERS_EDIT}?id=${id}`);
```

---

## 4. Stack tecnológico

- **Framework**: Qwik (Qwik City)
- **Lenguaje**: TypeScript
- **Estilos**: CSS nativo con custom properties (design tokens)
- **Backend**: API REST (los endpoints se solicitan explícitamente)
- **Runtime**: Node.js
- **Paquete**: npm

---

## 5. Convenciones de nomenclatura

- **Componentes**: PascalCase (`SearchSelect`, `UserMenu`)
- **Archivos**: kebab-case (`user.service.ts`, `api-error.ts`)
- **Rutas**: kebab-case (`/reset-login`, `/change-password`)
- **Mensajes**: camelCase anidado (`messages.users.edit.validationUsername`)
- **Constantes**: UPPER_SNAKE_CASE (`ROUTES.USERS_EDIT`)
- **Señales Qwik**: camelCase (`searchTerm`, `selectedPerson`)
- **Métodos $**: suffix `$` (`goBack$`, `saveChanges$`)

---

## 6. Guía para el Frontend: Integración de Permisos Dinámicos (SICES V3)

El backend de SICES V3 retorna un objeto `permissions` en las respuestas de **Login** (`POST /auth/login`) y **Verificación de Sesión** (`GET /auth/check-status`).

### 6.1 Estructura del Objeto Recibido

El objeto contiene los módulos como llaves en formato **camelCase** y un arreglo de strings indicando si tiene permisos de lectura (`"read"`) y/o escritura (`"write"`):

```json
{
  "permissions": {
    "users": [],
    "persons": ["read", "write"],
    "grades": ["read", "write"],
    "enrollments": ["read"],
    "classes": ["read"],
    "students": ["read"],
    "emergencyContacts": ["read", "write"],
    "staff": []
  }
}
```

### 6.2 Implementación Paso a Paso en el Frontend

#### Paso A: Guardar los permisos en el estado global

Al iniciar sesión con éxito o al reconstruir la sesión en la recarga de la página, guarda el objeto `permissions` en tu manejador de estado global (`useSignal`, Context API) o en `sessionStorage`/`localStorage`.

```ts
// Ejemplo Qwik: guardar en un servicio de sesión
// session.ts
export type PermissionsMap = Record<string, string[]>;

let permissionsStore: PermissionsMap = {};

export function setPermissions(p: PermissionsMap) {
  permissionsStore = p;
  sessionStorage.setItem('permissions', JSON.stringify(p));
}

export function getPermissions(): PermissionsMap {
  if (Object.keys(permissionsStore).length === 0) {
    const stored = sessionStorage.getItem('permissions');
    if (stored) {
      try { permissionsStore = JSON.parse(stored); } catch { /* ignore */ }
    }
  }
  return permissionsStore;
}
```

#### Paso B: Helper global de verificación

Crea una función utilitaria para facilitar la comprobación de permisos en cualquier vista o componente:

```typescript
// src/utils/permissions.ts

/**
 * Verifica si el usuario tiene un permiso específico sobre un módulo.
 * @param permissions Objeto de permisos guardado en el estado
 * @param module Nombre del módulo (ej: 'grades', 'students')
 * @param action Acción a validar ('read' o 'write')
 */
export function hasPermission(
  permissions: Record<string, string[]>,
  module: string,
  action: 'read' | 'write',
): boolean {
  if (!permissions || !permissions[module]) return false;
  return permissions[module].includes(action);
}
```

#### Paso C: Renderizar dinámicamente el Menú Lateral (Sidebar)

Para mostrar u ocultar las opciones de navegación principales, evalúa si el usuario tiene al menos permiso de **lectura** (`"read"`) en ese módulo:

```typescript
// Ejemplo Qwik en AuthenticatedShell o Sidebar
import { getPermissions } from '~/services/session';
import { hasPermission } from '~/utils/permissions';

const permissions = getPermissions();

const menuItems = [
  { name: 'Alumnos', path: '/students', module: 'students' },
  { name: 'Calificaciones', path: '/grades', module: 'grades' },
  { name: 'Personal', path: '/staff', module: 'staff' },
];

// Filtrar el menú antes de renderizarlo:
const visibleMenuItems = menuItems.filter((item) =>
  hasPermission(permissions, item.module, 'read'),
);
```

#### Paso D: Ocultar o deshabilitar botones de acción (Crear, Editar, Eliminar)

Dentro de una vista, usa el permiso de **escritura** (`"write"`) para ocultar o bloquear las acciones de modificación:

```tsx
// Ejemplo Qwik
import { getPermissions } from '~/services/session';
import { hasPermission } from '~/utils/permissions';

const permissions = getPermissions();
const canWrite = hasPermission(permissions, 'grades', 'write');

return (
  <Button
    disabled={!canWrite}
    onClick$={openAddGradeModal}
  >
    Registrar Calificación
  </Button>
);
```

### 6.3 Beneficio para el Frontend

- **Cero hardcodeo de roles**: El frontend no tiene que conocer los roles (Administrador, Docente, etc.). Solo evalúa los permisos directos que el backend le entrega.
- **Seguridad sincronizada**: Si un rol cambia de permisos en el backend, la interfaz del frontend se adaptará automáticamente sin necesidad de realizar nuevos despliegues de código en el cliente.
- **Declarativo**: Cada componente sabe qué necesita (lectura o escritura) y lo verifica contra el objeto de permisos, sin importar qué rol tiene el usuario.

### 6.4 Integración con el flujo de autenticación actual

El flujo actual en `src/routes/index.tsx` (login) ya recibe la respuesta del backend. Cuando el backend de SICES V3 entregue el objeto `permissions`, se deberá:

1. Extraer `permissions` de la respuesta del login
2. Guardarlo en la sesión (usando el helper del Paso A)
3. Pasar los permisos al `AuthenticatedShell` y `Sidebar` para filtrar el menú
4. Usar `hasPermission()` en cada vista que tenga acciones condicionales
import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { appConfig } from '~/config/app.config';
import { Badge, Button, Panel, Toolbar } from '~/ui';
import { AppIcon } from '~/ui/icons';
import './users.css';

type UserAction = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: Parameters<typeof AppIcon>[0]['intent'];
  tone: 'primary' | 'neutral' | 'warning' | 'danger' | 'info';
  badge?: string;
  disabled?: boolean;
};

const primaryActions: UserAction[] = [
  {
    id: 'search',
    title: 'Busqueda avanzada',
    description: 'Consulta usuarios con filtros, estados y acciones por fila.',
    href: '/users/search',
    icon: 'search',
    tone: 'primary',
    badge: 'Principal',
  },
  {
    id: 'create',
    title: 'Crear usuario',
    description: 'Registra acceso inicial y prepara contrasena temporal.',
    href: '/users/create',
    icon: 'add',
    tone: 'info',
    badge: 'Alta',
  },
];

const operationalActions: UserAction[] = [
  {
    id: 'detail',
    title: 'Ver usuario',
    description: 'Consulta datos, rol, tipo y estado de acceso.',
    href: '/users/detail',
    icon: 'view',
    tone: 'neutral',
    badge: 'Seleccion',
  },
  {
    id: 'edit',
    title: 'Editar usuario',
    description: 'Modifica datos de acceso y permisos administrativos.',
    href: '/users/edit',
    icon: 'edit',
    tone: 'neutral',
    badge: 'Seleccion',
  },
  {
    id: 'toggle',
    title: 'Activar / Desactivar',
    description: 'Cambia el acceso al sistema sin eliminar la cuenta.',
    href: '/users/toggle',
    icon: 'toggle',
    tone: 'warning',
    badge: 'Control',
  },
  {
    id: 'unlock',
    title: 'Desbloquear usuario',
    description: 'Libera cuentas bloqueadas por intentos fallidos.',
    href: '/users/unlock',
    icon: 'unlock',
    tone: 'warning',
    badge: 'Soporte',
  },
  {
    id: 'reset-login',
    title: 'Resetear primer login',
    description: 'Genera flujo obligatorio de cambio de contrasena.',
    href: '/users/reset-login',
    icon: 'login-reset',
    tone: 'danger',
    badge: 'Admin',
  },
];

export default component$(() => {
  const nav = useNavigate();

  return (
    <AuthenticatedShell
      eyebrow="Administracion"
      title="Usuarios"
      description="Gestion de cuentas, acceso inicial, bloqueo y restablecimiento administrado."
      meta="Modulo SUPER"
      allowedUserTypes={['SUPER']}
      accessDeniedDescription="El modulo de usuarios esta reservado para cuentas SUPER."
    >
      <Toolbar q:slot="toolbar">
        <span q:slot="leading">Hub de acciones</span>
        <span q:slot="center">
          La busqueda avanzada sera el centro del modulo; las demas acciones se
          resolveran desde seleccion de usuario.
        </span>
        <Button
          q:slot="actions"
          iconLeft="add"
          onClick$={async () => await nav('/users/create')}
        >
          Nuevo usuario
        </Button>
      </Toolbar>

      <div class="users-hub">
        <section class="users-hub__hero">
          <div>
            <span class="users-hub__kicker">Centro de administracion</span>
            <h2>Gestiona accesos sin perder el contexto</h2>
            <p>
              Primero construiremos la busqueda/listado con filtros y acciones
              por fila. Este hub queda como entrada rapida para los flujos
              administrativos.
            </p>
          </div>
          <div class="users-hub__summary" aria-label="Resumen del modulo">
            <span>
              <strong>7</strong>
              acciones
            </span>
            <span>
              <strong>SUPER</strong>
              acceso
            </span>
          </div>
        </section>

        <section class="users-hub__grid users-hub__grid--primary">
          {primaryActions.map((action) => (
            <article
              class="users-action-card"
              data-tone={action.tone}
              key={action.id}
            >
              <div class="users-action-card__icon" aria-hidden="true">
                <AppIcon intent={action.icon} size="md" />
              </div>
              <div class="users-action-card__copy">
                <div class="users-action-card__title-row">
                  <h3>{action.title}</h3>
                  {action.badge && <Badge tone="primary">{action.badge}</Badge>}
                </div>
                <p>{action.description}</p>
              </div>
              <Button
                variant={action.id === 'search' ? 'primary' : 'secondary'}
                iconRight="chevron-right"
                onClick$={async () => await nav(action.href)}
              >
                Abrir
              </Button>
            </article>
          ))}
        </section>

        <Panel
          title="Acciones operativas"
          description="Estas acciones normalmente parten de un usuario seleccionado en la tabla."
          density="compact"
        >
          <div class="users-hub__grid">
            {operationalActions.map((action) => (
              <article
                class="users-action-card users-action-card--compact"
                data-tone={action.tone}
                key={action.id}
              >
                <div class="users-action-card__icon" aria-hidden="true">
                  <AppIcon intent={action.icon} size="sm" />
                </div>
                <div class="users-action-card__copy">
                  <div class="users-action-card__title-row">
                    <h3>{action.title}</h3>
                    {action.badge && (
                      <Badge tone="neutral">{action.badge}</Badge>
                    )}
                  </div>
                  <p>{action.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  iconRight="chevron-right"
                  onClick$={async () => await nav(action.href)}
                >
                  Ir
                </Button>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Usuarios`,
};

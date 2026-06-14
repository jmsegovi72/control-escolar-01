import {
  component$,
  useComputed$,
  useContext,
  useSignal,
  useVisibleTask$,
} from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { AuthenticatedShellSystemStatusContext } from '~/components/layout/AuthenticatedShell/authenticated-shell.context';
import { appConfig } from '~/config/app.config';
import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
import { Badge } from '~/ui';
import { AppIcon } from '~/ui/icons';
import type { SidebarStatusTone } from '~/ui/patterns/Sidebar/sidebar.types';
import { sessionStore } from '~/utils/session';
import { getTokenLoginTime } from '~/utils/session-utils';
import './dashboard.css';

type DashboardHealthRow = {
  id: string;
  label: string;
  detail: string;
  value: string;
  tone: SidebarStatusTone;
};

type DashboardModule = {
  id: string;
  title: string;
  description: string;
  icon: Parameters<typeof AppIcon>[0]['intent'];
  tone: 'blue' | 'teal' | 'violet' | 'slate' | 'gray';
  status: 'active' | 'soon';
  href?: string;
};

const DASHBOARD_MODULES: DashboardModule[] = [
  {
    id: 'persons',
    title: 'Personas',
    description: 'Registro y gestión de personas del sistema.',
    icon: 'person',
    tone: 'blue',
    status: 'active',
    href: ROUTES.PERSONS,
  },
  {
    id: 'users',
    title: 'Usuarios',
    description: 'Cuentas, roles y permisos de acceso.',
    icon: 'user-settings',
    tone: 'teal',
    status: 'active',
    href: ROUTES.USERS,
  },
  {
    id: 'addresses',
    title: 'Direcciones',
    description: 'Domicilios y ubicaciones registradas.',
    icon: 'pin',
    tone: 'violet',
    status: 'active',
    href: ROUTES.ADDRESSES,
  },
  {
    id: 'catalogs',
    title: 'Catálogos',
    description: 'Tablas y valores de configuración global.',
    icon: 'settings',
    tone: 'slate',
    status: 'active',
    href: ROUTES.CATALOGS_ZIP_CODES,
  },
  {
    id: 'students',
    title: 'Alumnos',
    description: 'Gestión académica y expedientes escolares.',
    icon: 'student',
    tone: 'gray',
    status: 'soon',
  },
  {
    id: 'grades',
    title: 'Calificaciones',
    description: 'Seguimiento y captura del desempeño académico.',
    icon: 'class',
    tone: 'gray',
    status: 'soon',
  },
  {
    id: 'attendance',
    title: 'Asistencia',
    description: 'Control de presencia y seguimiento por grupo.',
    icon: 'check',
    tone: 'gray',
    status: 'soon',
  },
  {
    id: 'schedule',
    title: 'Horarios',
    description: 'Organización de bloques, turnos y sesiones.',
    icon: 'schedule',
    tone: 'gray',
    status: 'soon',
  },
];

export default component$(() => {
  return (
    <AuthenticatedShell
      eyebrow={appConfig.name}
      title="Dashboard"
      meta="Vista inicial"
    >
      <DashboardContent />
    </AuthenticatedShell>
  );
});

const DashboardContent = component$(() => {
  const nav = useNavigate();
  const systemStatus = useContext(AuthenticatedShellSystemStatusContext);
  const user = useSignal(sessionStore.getUser());
  const todayDate = useSignal(formatLongDate(new Date()));
  const loginTime = useSignal('');

  const sessionRemaining = useComputed$(() =>
    toMinutesAndSeconds(systemStatus.session.remaining),
  );
  const sessionTone = useComputed$<SidebarStatusTone>(
    () => systemStatus.session.tone,
  );
  const sessionStatus = useComputed$(() =>
    getSessionStatus(systemStatus.session.tone),
  );

  useVisibleTask$(() => {
    user.value = sessionStore.getUser();
    loginTime.value = getTokenLoginTime();

    const updateClock = () => {
      todayDate.value = formatLongDate(new Date());
    };

    updateClock();
    const dateInterval = window.setInterval(updateClock, 10000);

    return () => {
      window.clearInterval(dateInterval);
    };
  });

  return (
    <div class="dashboard-page">
      <section class="dashboard-welcome">
        <div class="dashboard-welcome__text">
          <p class="dashboard-welcome__eyebrow">
            Ciclo escolar {getCurrentCycle()}
          </p>
          <h2 class="dashboard-welcome__title">
            {user.value?.gender === 'M' ? 'Bienvenida,' : 'Bienvenido,'}{' '}
            <span>{user.value?.firstName ?? 'Usuario'}</span>
          </h2>
          <p class="dashboard-welcome__sub">
            Inicio del sistema - {appConfig.fullName} &middot; Control Escolar
          </p>
        </div>

        <div class="dashboard-welcome__badge">
          <AppIcon intent="schedule" size="sm" />
          <span>{todayDate.value}</span>
        </div>
      </section>

      <section class="dashboard-info-grid">
        <article class="dashboard-info-card">
          <div class="dashboard-info-card__title">
            <AppIcon intent="info" size="sm" />
            <span>Estado del sistema</span>
          </div>

          <div class="dashboard-status-list">
            {buildHealthRows(
              systemStatus.backend,
              systemStatus.database,
              systemStatus.session.tone,
            ).map((row) => (
              <div class="dashboard-status-row" key={row.id}>
                <div class="dashboard-status-row__label">
                  <span
                    class="dashboard-status-row__dot"
                    data-tone={row.tone}
                    aria-hidden="true"
                  />
                  <span>
                    <strong>{row.label}</strong>
                    {row.detail ? ` ${row.detail}` : ''}
                  </span>
                </div>
                <Badge
                  size="sm"
                  tone={toBadgeTone(row.tone)}
                  class="dashboard-status-row__value"
                >
                  {row.value}
                </Badge>
              </div>
            ))}
          </div>
        </article>

        <article class="dashboard-info-card">
          <div class="dashboard-info-card__title">
            <AppIcon intent="lock" size="sm" />
            <span>Sesión activa</span>
          </div>

          <div class="dashboard-session">
            <div class="dashboard-session__main">
              <div
                class="dashboard-session__icon"
                data-tone={sessionTone.value}
                aria-hidden="true"
              >
                <AppIcon intent="lock" size="md" />
              </div>
              <div>
                <div class="dashboard-session__label">Estado de sesión</div>
                <Badge
                  size="sm"
                  tone={toBadgeTone(sessionTone.value)}
                  class="dashboard-session__status-badge"
                >
                  {sessionStatus.value}
                </Badge>
              </div>
            </div>

            <div class="dashboard-session__rows">
              <div class="dashboard-session__row">
                <span class="dashboard-session__key">Usuario</span>
                <span class="dashboard-session__value">
                  {user.value?.fullName ?? 'No disponible'}
                </span>
              </div>
              <div class="dashboard-session__row">
                <span class="dashboard-session__key">Rol</span>
                <span class="dashboard-session__value">
                  {user.value?.roleName ?? 'No disponible'}
                </span>
              </div>
              <div class="dashboard-session__row">
                <span class="dashboard-session__key">Tiempo restante</span>
                <span
                  class="dashboard-session__value"
                  data-tone={sessionTone.value}
                >
                  {sessionRemaining.value}
                </span>
              </div>
              {sessionTone.value !== 'offline' && (
                <div class="dashboard-session__row">
                  <span class="dashboard-session__key">Inicio de sesión</span>
                  <span class="dashboard-session__value">
                    {loginTime.value}
                  </span>
                </div>
              )}
            </div>
          </div>
        </article>
      </section>

      <section class="dashboard-modules-section">
        <header class="dashboard-section-header">
          <div>
            <h3 class="dashboard-section-header__title">
              Acceso rapido a modulos
            </h3>
            <p class="dashboard-section-header__sub">
              Modulos activos en esta version del sistema
            </p>
          </div>
        </header>

        <div class="dashboard-modules-grid">
          {DASHBOARD_MODULES.map((module) => (
            <button
              key={module.id}
              class="dashboard-module-card"
              type="button"
              data-tone={module.tone}
              data-disabled={module.status !== 'active' ? 'true' : undefined}
              disabled={module.status !== 'active'}
              onClick$={async () => {
                if (!module.href || module.status !== 'active') {
                  return;
                }

                await nav(module.href);
              }}
            >
              <div class="dashboard-module-card__top">
                <span
                  class="dashboard-module-card__icon"
                  data-tone={module.tone}
                  aria-hidden="true"
                >
                  <AppIcon intent={module.icon} size="md" />
                </span>
                <Badge
                  size="sm"
                  tone={module.status === 'active' ? 'success' : 'neutral'}
                  class="dashboard-module-card__tag"
                >
                  {module.status === 'active' ? 'Activo' : 'Proximamente'}
                </Badge>
              </div>

              <div class="dashboard-module-card__body">
                <strong>{module.title}</strong>
                <p>{module.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Dashboard`,
};

const LONG_DATE_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function formatLongDate(date: Date) {
  const formatted = LONG_DATE_FORMATTER.format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function getCurrentCycle(): string {
  const now = new Date();
  const year = now.getFullYear();
  return now.getMonth() >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function buildHealthRows(
  backend: { value: string; tone: SidebarStatusTone },
  database: { value: string; tone: SidebarStatusTone },
  sessionTone: SidebarStatusTone,
): DashboardHealthRow[] {
  const jwtStatus = getJwtStatus(sessionTone);

  return [
    {
      id: 'backend',
      label: messages.layout.shell.backend,
      detail: '',
      value: backend.value,
      tone: backend.tone,
    },
    {
      id: 'database',
      label: messages.layout.shell.database,
      detail: 'MySQL',
      value: database.value,
      tone: database.tone,
    },
    {
      id: 'auth',
      label: 'Autenticación',
      detail: 'JWT',
      value: jwtStatus.value,
      tone: jwtStatus.tone,
    },
  ];
}

function getJwtStatus(tone: SidebarStatusTone): {
  value: string;
  tone: SidebarStatusTone;
} {
  if (tone === 'offline') {
    return { value: 'Sin sesi�n', tone: 'offline' };
  }

  if (tone === 'warning') {
    return { value: 'Por vencer', tone: 'warning' };
  }

  if (tone === 'online') {
    return { value: 'Activa', tone: 'online' };
  }

  return { value: 'No disponible', tone: 'neutral' };
}

function getSessionStatus(tone: SidebarStatusTone) {
  if (tone === 'offline') {
    return 'Sin sesi�n';
  }

  if (tone === 'warning') {
    return 'Por vencer';
  }

  if (tone === 'online') {
    return 'Activa';
  }

  return 'No disponible';
}

function toBadgeTone(
  tone: SidebarStatusTone,
): 'neutral' | 'success' | 'warning' | 'danger' {
  if (tone === 'online') {
    return 'success';
  }

  if (tone === 'warning') {
    return 'warning';
  }

  if (tone === 'offline') {
    return 'danger';
  }

  return 'neutral';
}

function toMinutesAndSeconds(value: string) {
  const [hours = '00', minutes = '00'] = value.split(':');
  const totalMinutes = Number(hours) * 60 + Number(minutes);
  return `${totalMinutes} minutos`;
}

import {
  $,
  component$,
  Slot,
  useSignal,
  useVisibleTask$,
} from '@builder.io/qwik';
import { useLocation, useNavigate } from '@builder.io/qwik-city';

import { appConfig } from '~/config/app.config';
import { ENV } from '~/config/env';
import { authService } from '~/services/auth/auth.service';
import { healthService } from '~/services/health/health.service';
import type { User } from '~/types/auth.types';
import { AppShell, Button, Sidebar } from '~/ui';
import type {
  SidebarBehavior,
  SidebarItem,
  SidebarSection,
  SidebarStatusTone,
  SidebarUser,
} from '~/ui/patterns/Sidebar/sidebar.types';
import { sessionStore } from '~/utils/session';

type AuthenticatedShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: string;
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

const formatDate = (date: Date) =>
  date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatTime = (date: Date) =>
  date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const getTokenRemaining = () => {
  const token = sessionStore.getToken();
  if (!token) return { label: 'Sin sesion', tone: 'offline' as const };

  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
    const expiration = Number(payload.exp ?? 0) * 1000;
    const remaining = expiration - Date.now();

    if (remaining <= 0) {
      return { label: '00:00:00', tone: 'offline' as const };
    }

    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    const label = [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, '0'))
      .join(':');
    const tone: SidebarStatusTone =
      remaining <= 30 * 60 * 1000 ? 'warning' : 'online';

    return { label, tone };
  } catch {
    return { label: 'No disponible', tone: 'neutral' as const };
  }
};

const getAvatarUrl = (user: User) => {
  if (!user.photoUrl) {
    return user.userTypeCode === 'SUPER'
      ? '/avatars/admin-default.svg'
      : '/avatars/user-default.svg';
  }

  if (
    user.photoUrl.startsWith('http') ||
    user.photoUrl.startsWith('/avatars/')
  ) {
    return user.photoUrl;
  }

  const apiBase = ENV.API_URL.replace(/\/sices\/v\d+$/, '');
  return `${apiBase}/${user.photoUrl.replace(/^\/+/, '')}`;
};

const createNavigation = (isSuper: boolean, hasControlAccess: boolean) => {
  const sections: SidebarSection[] = [
    {
      id: 'main',
      label: 'Menu principal',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: 'dashboard',
          href: '/dashboard',
          disabled: !hasControlAccess,
        },
        {
          id: 'persons',
          label: 'Personas',
          icon: 'person',
          disabled: !hasControlAccess,
          children: [
            {
              id: 'persons-management',
              label: 'Gestion',
              icon: 'person',
              href: '/persons',
              disabled: true,
            },
            {
              id: 'persons-addresses',
              label: 'Direccion',
              icon: 'school',
              href: '/addresses',
              disabled: true,
            },
            {
              id: 'persons-demographics',
              label: 'Demografia',
              icon: 'dashboard',
              href: '/demographics',
              disabled: true,
            },
            {
              id: 'persons-emergency',
              label: 'Contactos emergencia',
              icon: 'phone',
              href: '/persons/emergency-contacts',
              disabled: true,
            },
          ],
        },
        {
          id: 'students',
          label: 'Estudiantes',
          icon: 'student',
          disabled: !hasControlAccess,
          children: [
            {
              id: 'students-admission',
              label: 'Admision',
              icon: 'add',
              href: '/students/admission',
              disabled: true,
            },
            {
              id: 'students-enrollment',
              label: 'Matricula',
              icon: 'save',
              href: '/students/enrollment',
              disabled: true,
            },
            {
              id: 'students-grades',
              label: 'Calificaciones',
              icon: 'check',
              href: '/students/grades',
              disabled: true,
            },
          ],
        },
        {
          id: 'teachers',
          label: 'Docentes',
          icon: 'teacher',
          disabled: true,
        },
        {
          id: 'staff',
          label: 'Personal',
          icon: 'staff',
          disabled: true,
        },
        {
          id: 'catalogs',
          label: 'Catalogos',
          icon: 'settings',
          disabled: !hasControlAccess,
          children: [
            {
              id: 'catalogs-zip-codes',
              label: 'Codigos postales',
              icon: 'school',
              href: '/zip-codes',
              disabled: true,
            },
            {
              id: 'catalogs-classes',
              label: 'Clases',
              icon: 'class',
              href: '/classes',
              disabled: true,
            },
          ],
        },
      ],
    },
  ];

  if (isSuper) {
    sections.push({
      id: 'admin',
      label: 'Administracion',
      items: [
        {
          id: 'users',
          label: 'Usuarios',
          icon: 'user-settings',
          href: '/users',
        },
      ],
    });
  }

  return sections;
};

export const AuthenticatedShell = component$<AuthenticatedShellProps>(
  ({ eyebrow, title, description, meta }) => {
    const nav = useNavigate();
    const location = useLocation();
    const collapsed = useSignal(false);
    const sidebarBehavior = useSignal<SidebarBehavior>('fixed');
    const sidebarHovering = useSignal(false);
    const sidebarOpen = useSignal(false);
    const openItems = useSignal<string[]>([]);
    const time = useSignal(formatTime(new Date()));
    const date = useSignal(formatDate(new Date()));
    const sessionRemaining = useSignal(getTokenRemaining().label);
    const sessionTone = useSignal<SidebarStatusTone>(getTokenRemaining().tone);
    const backendStatus = useSignal({
      value: 'Validando',
      tone: 'neutral' as SidebarStatusTone,
    });
    const databaseStatus = useSignal({
      value: 'Validando',
      tone: 'neutral' as SidebarStatusTone,
    });
    const sidebarUser = useSignal<SidebarUser | undefined>();
    const sections = useSignal<SidebarSection[]>([]);

    useVisibleTask$(async () => {
      if (authService.requiresPasswordChange()) {
        await nav('/change-password');
        return;
      }

      if (!authService.isAuthenticated()) {
        await nav('/login');
        return;
      }

      const storedCollapsed = localStorage.getItem('sidebar-collapsed');
      collapsed.value = storedCollapsed === 'true';
      sidebarBehavior.value =
        localStorage.getItem('sidebar-behavior') === 'hover'
          ? 'hover'
          : 'fixed';
      sidebarHovering.value = false;

      const user = sessionStore.getUser();
      const isSuper = user?.userTypeCode === 'SUPER';
      const hasControlAccess = isSuper || user?.userTypeCode === 'CE';

      sidebarUser.value = user
        ? {
            name: user.fullName,
            role: user.roleName || user.userTypeName,
            initials: getInitials(user.fullName),
            avatarUrl: getAvatarUrl(user),
            status: user.isActive ? 'Sesion activa' : 'Usuario inactivo',
          }
        : undefined;
      sections.value = createNavigation(
        Boolean(isSuper),
        Boolean(hasControlAccess),
      );

      const updateClock = () => {
        const now = new Date();
        const remaining = getTokenRemaining();
        time.value = formatTime(now);
        date.value = formatDate(now);
        sessionRemaining.value = remaining.label;
        sessionTone.value = remaining.tone;
      };

      const updateHealth = async () => {
        const systemHealth = await healthService.checkSystem();

        backendStatus.value = systemHealth.backend;
        databaseStatus.value = systemHealth.database;
      };

      updateClock();
      void updateHealth();
      const interval = window.setInterval(updateClock, 1000);
      const healthInterval = window.setInterval(() => {
        void updateHealth();
      }, 15000);

      const onResize = () => {
        if (window.innerWidth > 900) {
          sidebarOpen.value = false;
        }
      };

      window.addEventListener('resize', onResize);

      return () => {
        window.clearInterval(interval);
        window.clearInterval(healthInterval);
        window.removeEventListener('resize', onResize);
      };
    });

    const sidebarCollapsed =
      sidebarBehavior.value === 'hover'
        ? !sidebarHovering.value
        : collapsed.value;

    const toggleSidebarBehavior$ = $(() => {
      if (sidebarBehavior.value === 'hover') {
        sidebarBehavior.value = 'fixed';
        collapsed.value = false;
        sidebarHovering.value = false;
        localStorage.setItem('sidebar-behavior', 'fixed');
        localStorage.setItem('sidebar-collapsed', 'false');
        return;
      }

      sidebarBehavior.value = 'hover';
      sidebarHovering.value = false;
      localStorage.setItem('sidebar-behavior', 'hover');
    });

    return (
      <AppShell
        eyebrow={eyebrow ?? appConfig.name}
        title={title}
        description={description}
        meta={meta}
        sidebarOpen={sidebarOpen.value}
        onToggleSidebar$={$(() => {
          sidebarOpen.value = !sidebarOpen.value;
        })}
      >
        <Sidebar
          q:slot="sidebar"
          brand={{
            name: appConfig.name,
            shortName: appConfig.initials,
            subtitle: appConfig.description,
          }}
          sections={sections.value}
          activeItem={
            location.url.pathname.startsWith('/users') ? 'users' : 'dashboard'
          }
          openItems={openItems.value}
          collapsed={sidebarCollapsed}
          behavior={sidebarBehavior.value}
          clock={{
            label: 'Hora actual',
            time: time.value,
            date: date.value,
          }}
          systemStatus={{
            items: [
              {
                id: 'api',
                label: 'Backend',
                value: backendStatus.value.value,
                tone: backendStatus.value.tone,
              },
              {
                id: 'database',
                label: 'Base de datos',
                value: databaseStatus.value.value,
                tone: databaseStatus.value.tone,
              },
            ],
            session: {
              label: 'Sesion',
              remaining: sessionRemaining.value,
              tone: sessionTone.value,
            },
          }}
          user={sidebarUser.value}
          userMenuSessionLabel={`Sesion: ${sessionRemaining.value}`}
          userActions={[
            {
              id: 'settings',
              label: 'Configuracion',
              icon: 'settings',
              disabled: true,
            },
            { type: 'separator', id: 'session-separator' },
            {
              id: 'logout',
              label: 'Cerrar sesion',
              icon: 'logout',
              tone: 'danger',
              onSelect$: $(async () => {
                authService.logout();
                await nav('/login');
              }),
            },
          ]}
          footerItems={[
            {
              id: 'settings',
              label: 'Configuracion',
              icon: 'settings',
              children: [
                {
                  id: 'sidebar-behavior',
                  label:
                    sidebarBehavior.value === 'hover'
                      ? 'Usar sidebar fijo'
                      : 'Auto colapso',
                  icon: sidebarBehavior.value === 'hover' ? 'pin' : 'toggle',
                },
              ],
            },
          ]}
          onToggleCollapse$={$(() => {
            if (sidebarBehavior.value === 'hover') {
              sidebarBehavior.value = 'fixed';
              collapsed.value = false;
              sidebarHovering.value = false;
              localStorage.setItem('sidebar-behavior', 'fixed');
              localStorage.setItem('sidebar-collapsed', 'false');
              return;
            }

            collapsed.value = !collapsed.value;
            localStorage.setItem('sidebar-collapsed', String(collapsed.value));
          })}
          onPointerEnter$={$(() => {
            if (sidebarBehavior.value === 'hover') {
              sidebarHovering.value = true;
            }
          })}
          onPointerLeave$={$(() => {
            if (sidebarBehavior.value === 'hover') {
              sidebarHovering.value = false;
            }
          })}
          onToggleItem$={$((item: SidebarItem, open: boolean) => {
            if (open) {
              openItems.value = [
                ...openItems.value.filter((itemId) => itemId !== item.id),
                item.id,
              ];
              return;
            }

            openItems.value = openItems.value.filter(
              (itemId) => itemId !== item.id,
            );
          })}
          onNavigate$={$(async (item: SidebarItem) => {
            if (item.id === 'sidebar-behavior') {
              await toggleSidebarBehavior$();
              return;
            }

            if (!item.href || item.disabled) return;

            sidebarOpen.value = false;
            await nav(item.href);
          })}
        />

        <Button
          q:slot="actions"
          variant="secondary"
          iconLeft="logout"
          onClick$={async () => {
            authService.logout();
            await nav('/login');
          }}
        >
          Cerrar sesion
        </Button>

        <Slot />
      </AppShell>
    );
  },
);

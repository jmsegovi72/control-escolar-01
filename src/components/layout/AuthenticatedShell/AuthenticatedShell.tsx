import {
  $,
  component$,
  Slot,
  useSignal,
  useVisibleTask$,
} from '@builder.io/qwik';
import { useLocation, useNavigate } from '@builder.io/qwik-city';

import { appConfig } from '~/config/app.config';
import { messages } from '~/config/messages';
import { ENV } from '~/config/env';
import { authService } from '~/services/auth/auth.service';
import { healthService } from '~/services/health/health.service';
import type { User } from '~/types/auth.types';
import { AppShell, Button, Panel, Sidebar } from '~/ui';
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
  allowedUserTypes?: string[];
  allowedRoles?: string[];
  accessDeniedTitle?: string;
  accessDeniedDescription?: string;
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
  if (!token)
    return { label: messages.layout.shell.noSession, tone: 'offline' as const };

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
    return {
      label: messages.layout.shell.tokenUnavailable,
      tone: 'neutral' as const,
    };
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
      label: messages.layout.shell.menuMain,
      items: [
        {
          id: 'dashboard',
          label: messages.layout.shell.nav.dashboard,
          icon: 'dashboard',
          href: '/dashboard',
          disabled: !hasControlAccess,
        },
        {
          id: 'persons',
          label: messages.layout.shell.nav.persons,
          icon: 'person',
          disabled: !hasControlAccess,
          children: [
            {
              id: 'persons-management',
              label: messages.layout.shell.nav.personsManagement,
              icon: 'person',
              href: '/persons',
              disabled: true,
            },
            {
              id: 'persons-addresses',
              label: messages.layout.shell.nav.personsAddresses,
              icon: 'school',
              href: '/addresses',
              disabled: true,
            },
            {
              id: 'persons-demographics',
              label: messages.layout.shell.nav.personsDemographics,
              icon: 'dashboard',
              href: '/demographics',
              disabled: true,
            },
            {
              id: 'persons-emergency',
              label: messages.layout.shell.nav.personsEmergency,
              icon: 'phone',
              href: '/persons/emergency-contacts',
              disabled: true,
            },
          ],
        },
        {
          id: 'students',
          label: messages.layout.shell.nav.students,
          icon: 'student',
          disabled: !hasControlAccess,
          children: [
            {
              id: 'students-admission',
              label: messages.layout.shell.nav.studentsAdmission,
              icon: 'add',
              href: '/students/admission',
              disabled: true,
            },
            {
              id: 'students-enrollment',
              label: messages.layout.shell.nav.studentsEnrollment,
              icon: 'save',
              href: '/students/enrollment',
              disabled: true,
            },
            {
              id: 'students-grades',
              label: messages.layout.shell.nav.studentsGrades,
              icon: 'check',
              href: '/students/grades',
              disabled: true,
            },
          ],
        },
        {
          id: 'teachers',
          label: messages.layout.shell.nav.teachers,
          icon: 'teacher',
          disabled: true,
        },
        {
          id: 'staff',
          label: messages.layout.shell.nav.staff,
          icon: 'staff',
          disabled: true,
        },
        {
          id: 'catalogs',
          label: messages.layout.shell.nav.catalogs,
          icon: 'settings',
          disabled: !hasControlAccess,
          children: [
            {
              id: 'catalogs-zip-codes',
              label: messages.layout.shell.nav.catalogsZipCodes,
              icon: 'school',
              href: '/zip-codes',
              disabled: true,
            },
            {
              id: 'catalogs-classes',
              label: messages.layout.shell.nav.catalogsClasses,
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
      label: messages.layout.shell.menuAdmin,
      items: [
        {
          id: 'users',
          label: messages.layout.shell.nav.users,
          icon: 'user-settings',
          href: '/users',
        },
      ],
    });
  }

  return sections;
};

const normalizeAccessValue = (value?: string) =>
  value?.trim().toUpperCase() ?? '';

const canAccessRoute = (
  user: User | null,
  allowedUserTypes?: string[],
  allowedRoles?: string[],
) => {
  if (!allowedUserTypes?.length && !allowedRoles?.length) {
    return true;
  }

  if (!user) {
    return false;
  }

  const normalizedUserType = normalizeAccessValue(user.userTypeCode);
  const normalizedRole = normalizeAccessValue(user.roleName);
  const userTypeAllowed = allowedUserTypes?.some(
    (type) => normalizeAccessValue(type) === normalizedUserType,
  );
  const roleAllowed = allowedRoles?.some(
    (role) => normalizeAccessValue(role) === normalizedRole,
  );

  return Boolean(userTypeAllowed || roleAllowed);
};

export const AuthenticatedShell = component$<AuthenticatedShellProps>(
  ({
    eyebrow,
    title,
    description,
    meta,
    allowedUserTypes,
    allowedRoles,
    accessDeniedTitle = messages.layout.shell.accessDeniedTitle,
    accessDeniedDescription = messages.layout.shell.accessDeniedDescription,
  }) => {
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
    const authorizationReady = useSignal(false);
    const authorized = useSignal(false);
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
      authorized.value = canAccessRoute(user, allowedUserTypes, allowedRoles);
      authorizationReady.value = true;

      sidebarUser.value = user
        ? {
            name: user.fullName,
            role: user.roleName || user.userTypeName,
            initials: getInitials(user.fullName),
            avatarUrl: getAvatarUrl(user),
            status: user.isActive
              ? messages.layout.shell.userActiveStatus
              : messages.layout.shell.userInactiveStatus,
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
            label: messages.layout.shell.clockLabel,
            time: time.value,
            date: date.value,
          }}
          systemStatus={{
            items: [
              {
                id: 'api',
                label: messages.layout.shell.backend,
                value: backendStatus.value.value,
                tone: backendStatus.value.tone,
              },
              {
                id: 'database',
                label: messages.layout.shell.database,
                value: databaseStatus.value.value,
                tone: databaseStatus.value.tone,
              },
            ],
            session: {
              label: messages.layout.shell.sessionLabel,
              remaining: sessionRemaining.value,
              tone: sessionTone.value,
            },
          }}
          user={sidebarUser.value}
          userMenuSessionLabel={messages.layout.shell.userMenuSession.replace(
            '{remaining}',
            sessionRemaining.value,
          )}
          userActions={[
            {
              id: 'settings',
              label: messages.layout.shell.userActions.settings,
              icon: 'settings',
              disabled: true,
            },
            { type: 'separator', id: 'session-separator' },
            {
              id: 'logout',
              label: messages.layout.shell.userActions.logout,
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
              label: messages.layout.shell.sidebarSettings,
              icon: 'settings',
              children: [
                {
                  id: 'sidebar-behavior',
                  label:
                    sidebarBehavior.value === 'hover'
                      ? messages.layout.shell.sidebarFixed
                      : messages.layout.shell.sidebarHover,
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
          {messages.layout.shell.logoutLabel}
        </Button>

        {authorizationReady.value && authorized.value && (
          <div class="authenticated-shell__container">
            <Slot />
          </div>
        )}

        {authorizationReady.value && !authorized.value && (
          <Panel
            eyebrow="Permisos"
            title={accessDeniedTitle}
            description={accessDeniedDescription}
          >
            <Button
              variant="secondary"
              iconLeft="back"
              onClick$={async () => await nav('/dashboard')}
            >
              {messages.layout.shell.returnToDashboard}
            </Button>
          </Panel>
        )}
      </AppShell>
    );
  },
);

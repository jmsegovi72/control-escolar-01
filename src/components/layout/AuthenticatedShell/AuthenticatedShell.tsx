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
import { ROUTES } from '~/config/routes';
import { authService } from '~/services/auth/auth.service';
import { healthService } from '~/services/health/health.service';
import { AppShell, Button, Panel, Sidebar } from '~/ui';
import type {
  SidebarBehavior,
  SidebarItem,
  SidebarSection,
  SidebarStatusTone,
  SidebarUser,
} from '~/ui/patterns/Sidebar/sidebar.types';
import { sessionStore } from '~/utils/session';
import {
  formatDate,
  formatTime,
  getAvatarUrl,
  getInitials,
  getTokenRemaining,
} from '~/utils/session-utils';
import { canAccessRoute, createNavigation } from '~/utils/navigation';

type AuthenticatedShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: string;
  allowedUserTypes?: string[];
  allowedRoles?: string[];
  accessDeniedTitle?: string;
  accessDeniedDescription?: string;
  fullWidth?: boolean;
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
    fullWidth = false,
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
        await nav(ROUTES.CHANGE_PASSWORD);
        return;
      }

      if (!authService.isAuthenticated()) {
        await nav(ROUTES.LOGIN);
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
                await nav(ROUTES.LOGIN);
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
            const isMobile =
              typeof window !== 'undefined' && window.innerWidth <= 900;

            if (isMobile) {
              sidebarOpen.value = false;
              return;
            }

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
            if (
              sidebarBehavior.value === 'hover' &&
              typeof window !== 'undefined' &&
              window.innerWidth > 900
            ) {
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
            await nav(ROUTES.LOGIN);
          }}
        >
          {messages.layout.shell.logoutLabel}
        </Button>

        {authorizationReady.value && authorized.value && (
          <div class={`authenticated-shell__container${fullWidth ? ' authenticated-shell__container--full-width' : ''}`}>
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
              onClick$={async () => await nav(ROUTES.DASHBOARD)}
            >
              {messages.layout.shell.returnToDashboard}
            </Button>
          </Panel>
        )}
      </AppShell>
    );
  },
);

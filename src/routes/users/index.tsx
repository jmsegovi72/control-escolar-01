import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';

import { ActionCard } from '~/components/action-card';
import { ActionRow } from '~/components/action-row';
import { HubHeader } from '~/components/hub-header';
import { HubSection } from '~/components/hub-section';
import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { appConfig } from '~/config/app.config';
import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
import { Panel } from '~/ui';
import './users.css';

const m = messages.users.hub;

const primaryActions = [
  {
    id: 'search',
    title: m.primaryActions.search.title,
    description: m.primaryActions.search.description,
    href: ROUTES.USERS_SEARCH,
    icon: 'search' as const,
    tone: 'primary' as const,
    badge: m.primaryActions.search.badge,
  },
  {
    id: 'create',
    title: m.primaryActions.create.title,
    description: m.primaryActions.create.description,
    href: ROUTES.USERS_CREATE,
    icon: 'add' as const,
    tone: 'info' as const,
    badge: m.primaryActions.create.badge,
  },
];

const operationalActions = [
  {
    id: 'detail',
    title: m.operationalActions.detail.title,
    description: m.operationalActions.detail.description,
    href: ROUTES.USERS_DETAIL,
    icon: 'view' as const,
    tone: 'gray' as const,
    badge: m.operationalActions.detail.badge,
  },
  {
    id: 'edit',
    title: m.operationalActions.edit.title,
    description: m.operationalActions.edit.description,
    href: ROUTES.USERS_EDIT,
    icon: 'edit' as const,
    tone: 'gray' as const,
    badge: m.operationalActions.edit.badge,
  },
  {
    id: 'toggle',
    title: m.operationalActions.toggle.title,
    description: m.operationalActions.toggle.description,
    href: ROUTES.USERS_TOGGLE,
    icon: 'toggle' as const,
    tone: 'warning' as const,
    badge: m.operationalActions.toggle.badge,
  },
  {
    id: 'unlock',
    title: m.operationalActions.unlock.title,
    description: m.operationalActions.unlock.description,
    href: ROUTES.USERS_UNLOCK,
    icon: 'unlock' as const,
    tone: 'warning' as const,
    badge: m.operationalActions.unlock.badge,
  },
  {
    id: 'resetLogin',
    title: m.operationalActions.resetLogin.title,
    description: m.operationalActions.resetLogin.description,
    href: ROUTES.USERS_RESET_LOGIN,
    icon: 'login-reset' as const,
    tone: 'primary' as const,
    badge: m.operationalActions.resetLogin.badge,
  },
];

const totalActions = primaryActions.length + operationalActions.length;

export default component$(() => {
  return (
    <AuthenticatedShell
      eyebrow={messages.app.name}
      title={m.title}
      description={m.description}
      allowedUserTypes={['SUPER']}
      accessDeniedDescription={m.accessDenied}
    >
      <HubHeader
        q:slot="hub-header"
        eyebrow="Gestión de usuarios"
        icon="staff"
        title={m.title}
        description={m.description}
        metaItems={[
          { label: m.meta, icon: 'settings', tone: 'accent' },
          { label: `${totalActions} acciones del módulo`, icon: 'search' },
          { label: 'Acceso SUPER', icon: 'settings' },
        ]}
      />

      <div class="users-page">
        <HubSection title="Acciones principales" count={primaryActions.length}>
          <div class="users-main-grid">
            {primaryActions.map((action) => (
              <ActionCard
                key={action.id}
                icon={action.icon}
                tone={action.tone}
                title={action.title}
                description={action.description}
                badge={action.badge}
                href={action.href}
                actionLabel={m.openButton}
              />
            ))}
          </div>
        </HubSection>

        <HubSection title="Acciones operativas" count={operationalActions.length}>
          <Panel
            title={m.panelTitle}
            description={m.panelDescription}
            icon="settings"
          >
            <div class="users-panel__rows">
              {operationalActions.map((action) => (
                <ActionRow
                  key={action.id}
                  icon={action.icon}
                  tone={action.tone}
                  title={action.title}
                  description={action.description}
                  badge={action.badge}
                  href={action.href}
                  actionLabel={m.goButton}
                />
              ))}
            </div>
          </Panel>
        </HubSection>
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Usuarios`,
};
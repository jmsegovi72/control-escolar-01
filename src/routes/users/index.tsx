import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { appConfig } from '~/config/app.config';
import { messages } from '~/config/messages';
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
    title: messages.users.hub.primaryActions.search.title,
    description: messages.users.hub.primaryActions.search.description,
    href: '/users/search',
    icon: 'search',
    tone: 'primary',
    badge: messages.users.hub.primaryActions.search.badge,
  },
  {
    id: 'create',
    title: messages.users.hub.primaryActions.create.title,
    description: messages.users.hub.primaryActions.create.description,
    href: '/users/create',
    icon: 'add',
    tone: 'info',
    badge: messages.users.hub.primaryActions.create.badge,
  },
];

const operationalActions: UserAction[] = [
  {
    id: 'detail',
    title: messages.users.hub.operationalActions.detail.title,
    description: messages.users.hub.operationalActions.detail.description,
    href: '/users/detail',
    icon: 'view',
    tone: 'neutral',
    badge: messages.users.hub.operationalActions.detail.badge,
  },
  {
    id: 'edit',
    title: messages.users.hub.operationalActions.edit.title,
    description: messages.users.hub.operationalActions.edit.description,
    href: '/users/edit',
    icon: 'edit',
    tone: 'neutral',
    badge: messages.users.hub.operationalActions.edit.badge,
  },
  {
    id: 'toggle',
    title: messages.users.hub.operationalActions.toggle.title,
    description: messages.users.hub.operationalActions.toggle.description,
    href: '/users/toggle',
    icon: 'toggle',
    tone: 'warning',
    badge: messages.users.hub.operationalActions.toggle.badge,
  },
  {
    id: 'unlock',
    title: messages.users.hub.operationalActions.unlock.title,
    description: messages.users.hub.operationalActions.unlock.description,
    href: '/users/unlock',
    icon: 'unlock',
    tone: 'warning',
    badge: messages.users.hub.operationalActions.unlock.badge,
  },
  {
    id: 'reset-login',
    title: messages.users.hub.operationalActions.resetLogin.title,
    description: messages.users.hub.operationalActions.resetLogin.description,
    href: '/users/reset-login',
    icon: 'login-reset',
    tone: 'danger',
    badge: messages.users.hub.operationalActions.resetLogin.badge,
  },
];

export default component$(() => {
  const nav = useNavigate();

  return (
    <AuthenticatedShell
      eyebrow={messages.users.hub.eyebrow}
      title={messages.users.hub.title}
      description={messages.users.hub.description}
      meta={messages.users.hub.meta}
      allowedUserTypes={['SUPER']}
      accessDeniedDescription={messages.users.hub.accessDenied}
    >
      <Toolbar q:slot="toolbar">
        <span q:slot="leading">{messages.users.hub.toolbarLeading}</span>
        <span q:slot="center">{messages.users.hub.toolbarCenter}</span>
        <Button
          q:slot="actions"
          iconLeft="add"
          onClick$={async () => await nav('/users/create')}
        >
          {messages.users.hub.newUser}
        </Button>
      </Toolbar>

      <div class="users-hub">
        <section class="users-hub__hero">
          <div>
            <span class="users-hub__kicker">
              {messages.users.hub.heroKicker}
            </span>
            <h2>{messages.users.hub.heroTitle}</h2>
            <p>{messages.users.hub.heroDescription}</p>
          </div>
          <div class="users-hub__summary" aria-label="Resumen del modulo">
            <span>
              <strong>7</strong>
              {messages.users.hub.summaryActions}
            </span>
            <span>
              <strong>{appConfig.initials}</strong>
              {messages.users.hub.summaryAccess}
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
                variant="primary"
                iconRight="chevron-right"
                onClick$={async () => await nav(action.href)}
              >
                {messages.users.hub.openButton}
              </Button>
            </article>
          ))}
        </section>

        <Panel
          title={messages.users.hub.panelTitle}
          description={messages.users.hub.panelDescription}
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
                  {messages.users.hub.goButton}
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

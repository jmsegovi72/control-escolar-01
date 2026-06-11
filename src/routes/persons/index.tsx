import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { appConfig } from '~/config/app.config';
import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
import { Badge, Button, Panel, Toolbar } from '~/ui';
import { AppIcon } from '~/ui/icons';
import './persons.css';

type PersonAction = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: Parameters<typeof AppIcon>[0]['intent'];
  tone: 'primary' | 'neutral' | 'warning' | 'danger' | 'info';
  badge?: string;
  disabled?: boolean;
};

const m = messages.persons.hub;

const primaryActions: PersonAction[] = [
  {
    id: 'search',
    title: m.primaryActions.search.title,
    description: m.primaryActions.search.description,
    href: ROUTES.PERSONS_SEARCH,
    icon: 'search',
    tone: 'primary',
    badge: m.primaryActions.search.badge,
  },
  {
    id: 'create',
    title: m.primaryActions.create.title,
    description: m.primaryActions.create.description,
    href: ROUTES.PERSONS_CREATE,
    icon: 'add',
    tone: 'info',
    badge: m.primaryActions.create.badge,
  },
];

const operationalActions: PersonAction[] = [
  {
    id: 'detail',
    title: m.operationalActions.detail.title,
    description: m.operationalActions.detail.description,
    href: ROUTES.PERSONS_DETAIL,
    icon: 'view',
    tone: 'neutral',
    badge: m.operationalActions.detail.badge,
  },
  {
    id: 'edit',
    title: m.operationalActions.edit.title,
    description: m.operationalActions.edit.description,
    href: ROUTES.PERSONS_EDIT,
    icon: 'edit',
    tone: 'neutral',
    badge: m.operationalActions.edit.badge,
  },
  {
    id: 'emergency',
    title: m.operationalActions.emergency.title,
    description: m.operationalActions.emergency.description,
    href: ROUTES.PERSONS_EMERGENCY,
    icon: 'phone',
    tone: 'warning',
    badge: m.operationalActions.emergency.badge,
  },
  {
    id: 'fake1',
    title: 'Acción de prueba 1',
    description: 'Descripción de prueba para verificar el scroll de la página.',
    href: '#',
    icon: 'settings',
    tone: 'primary',
    badge: 'Prueba',
  },
  {
    id: 'fake2',
    title: 'Acción de prueba 2',
    description: 'Otra descripción de prueba para empujar el contenido.',
    href: '#',
    icon: 'user-settings',
    tone: 'info',
    badge: 'Prueba',
  },
  {
    id: 'fake3',
    title: 'Acción de prueba 3',
    description: 'Tercera descripción de prueba para probar el scroll de la página.',
    href: '#',
    icon: 'unlock',
    tone: 'danger',
    badge: 'Prueba',
  },
];

export default component$(() => {
  const nav = useNavigate();

  return (
    <AuthenticatedShell
      eyebrow={m.eyebrow}
      title={m.title}
      description={m.description}
      meta={m.meta}
      allowedUserTypes={['SUPER', 'CE']}
      accessDeniedDescription={m.accessDenied}
    >
      <Toolbar q:slot="toolbar">
        <span q:slot="leading">{m.toolbarLeading}</span>
        <span q:slot="center">{m.toolbarCenter}</span>
        <Button
          q:slot="actions"
          iconLeft="add"
          onClick$={async () => await nav(ROUTES.PERSONS_CREATE)}
        >
          {m.newPerson}
        </Button>
      </Toolbar>

      <div class="persons-hub">
        <section class="persons-hub__hero">
          <div>
            <span class="persons-hub__kicker">{m.heroKicker}</span>
            <h2>{m.heroTitle}</h2>
            <p>{m.heroDescription}</p>
          </div>
          <div class="persons-hub__summary" aria-label={m.summaryLabel}>
            <span>
              <strong>5</strong>
              {m.summaryActions}
            </span>
            <span>
              <strong>{appConfig.initials}</strong>
              {m.summaryAccess}
            </span>
          </div>
        </section>

        <section class="persons-hub__grid persons-hub__grid--primary">
          {primaryActions.map((action) => (
            <article
              class="persons-action-card"
              data-tone={action.tone}
              key={action.id}
            >
              <div class="persons-action-card__icon" aria-hidden="true">
                <AppIcon intent={action.icon} size="md" />
              </div>
              <div class="persons-action-card__copy">
                <div class="persons-action-card__title-row">
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
                {m.openButton}
              </Button>
            </article>
          ))}
        </section>

        <Panel
          title={m.panelTitle}
          description={m.panelDescription}
          density="compact"
        >
          <div class="persons-hub__grid">
            {operationalActions.map((action) => (
              <article
                class="persons-action-card persons-action-card--compact"
                data-tone={action.tone}
                key={action.id}
              >
                <div class="persons-action-card__icon" aria-hidden="true">
                  <AppIcon intent={action.icon} size="sm" />
                </div>
                <div class="persons-action-card__copy">
                  <div class="persons-action-card__title-row">
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
                  {m.goButton}
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
  title: `${appConfig.name} | Personas`,
};

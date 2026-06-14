import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { appConfig } from '~/config/app.config';
import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
import { Badge, Button, Panel, Toolbar } from '~/ui';
import { AppIcon } from '~/ui/icons';
import './addresses.css';

type AddressAction = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: Parameters<typeof AppIcon>[0]['intent'];
  tone: 'primary' | 'neutral' | 'warning' | 'danger' | 'info';
  badge?: string;
  disabled?: boolean;
};

const m = messages.addresses.hub;

const primaryActions: AddressAction[] = [
  {
    id: 'search',
    title: m.primaryActions.search.title,
    description: m.primaryActions.search.description,
    href: ROUTES.ADDRESSES_SEARCH,
    icon: 'search',
    tone: 'primary',
    badge: m.primaryActions.search.badge,
  },
  {
    id: 'create',
    title: m.primaryActions.create.title,
    description: m.primaryActions.create.description,
    href: ROUTES.ADDRESSES_CREATE,
    icon: 'add',
    tone: 'info',
    badge: m.primaryActions.create.badge,
  },
];

const operationalActions: AddressAction[] = [
  {
    id: 'detail',
    title: m.operationalActions.detail.title,
    description: m.operationalActions.detail.description,
    href: ROUTES.ADDRESSES_DETAIL,
    icon: 'view',
    tone: 'neutral',
    badge: m.operationalActions.detail.badge,
  },
  {
    id: 'edit',
    title: m.operationalActions.edit.title,
    description: m.operationalActions.edit.description,
    href: ROUTES.ADDRESSES_EDIT,
    icon: 'edit',
    tone: 'neutral',
    badge: m.operationalActions.edit.badge,
  },
  {
    id: 'bulkLoad',
    title: m.operationalActions.bulkLoad.title,
    description: m.operationalActions.bulkLoad.description,
    href: ROUTES.ADDRESSES_BULK_LOAD,
    icon: 'upload',
    tone: 'info',
    badge: m.operationalActions.bulkLoad.badge,
  },
];

const relatedModules: AddressAction[] = [
  {
    id: 'zipCodes',
    title: m.relatedModules.zipCodes.title,
    description: m.relatedModules.zipCodes.description,
    href: ROUTES.CATALOGS_ZIP_CODES_CREATE,
    icon: 'pin',
    tone: 'neutral',
    badge: m.relatedModules.zipCodes.badge,
    disabled: true,
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
        <Button
          q:slot="leading"
          variant="ghost"
          iconLeft="back"
          onClick$={async () => await nav(ROUTES.PERSONS)}
        >
          {m.toolbarBack}
        </Button>
        <span q:slot="center">{m.toolbarCenter}</span>
        <Button
          q:slot="actions"
          iconLeft="add"
          onClick$={async () => await nav(ROUTES.ADDRESSES_CREATE)}
        >
          {m.newAddress}
        </Button>
      </Toolbar>

      <div class="addresses-hub">
        <section class="addresses-hub__hero">
          <div>
            <span class="addresses-hub__kicker">{m.heroKicker}</span>
            <h2>{m.heroTitle}</h2>
            <p>{m.heroDescription}</p>
          </div>
          <div class="addresses-hub__summary" aria-label={m.summaryLabel}>
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

        <section class="addresses-hub__grid addresses-hub__grid--primary">
          {primaryActions.map((action) => (
            <article
              class="addresses-action-card"
              data-tone={action.tone}
              key={action.id}
            >
              <div class="addresses-action-card__icon" aria-hidden="true">
                <AppIcon intent={action.icon} size="md" />
              </div>
              <div class="addresses-action-card__copy">
                <div class="addresses-action-card__title-row">
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
          <div class="addresses-hub__grid">
            {operationalActions.map((action) => (
              <article
                class="addresses-action-card addresses-action-card--compact"
                data-tone={action.tone}
                key={action.id}
              >
                <div class="addresses-action-card__icon" aria-hidden="true">
                  <AppIcon intent={action.icon} size="sm" />
                </div>
                <div class="addresses-action-card__copy">
                  <div class="addresses-action-card__title-row">
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

        <Panel
          title={m.relatedPanelTitle}
          description={m.relatedPanelDescription}
          density="compact"
        >
          <div class="addresses-hub__grid">
            {relatedModules.map((module) => (
              <article
                class="addresses-action-card addresses-action-card--compact"
                data-tone={module.tone}
                key={module.id}
              >
                <div class="addresses-action-card__icon" aria-hidden="true">
                  <AppIcon intent={module.icon} size="sm" />
                </div>
                <div class="addresses-action-card__copy">
                  <div class="addresses-action-card__title-row">
                    <h3>{module.title}</h3>
                    {module.badge && (
                      <Badge tone="neutral">{module.badge}</Badge>
                    )}
                  </div>
                  <p>{module.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  iconRight="chevron-right"
                  disabled={module.disabled}
                  onClick$={async () => await nav(module.href)}
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
  title: `${appConfig.name} | Direcciones`,
};

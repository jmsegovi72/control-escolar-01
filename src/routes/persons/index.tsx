import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { appConfig } from '~/config/app.config';
import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
import { Button, Toolbar } from '~/ui';
import { AppIcon } from '~/ui/icons';
import './persons.css';

type PersonAction = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: Parameters<typeof AppIcon>[0]['intent'];
  tone: 'primary' | 'success' | 'warning' | 'violet' | 'teal' | 'gray';
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
    tone: 'success',
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
    tone: 'warning',
    badge: m.operationalActions.detail.badge,
  },
  {
    id: 'edit',
    title: m.operationalActions.edit.title,
    description: m.operationalActions.edit.description,
    href: ROUTES.PERSONS_EDIT,
    icon: 'edit',
    tone: 'primary',
    badge: m.operationalActions.edit.badge,
  },
  {
    id: 'bulkLoad',
    title: m.operationalActions.bulkLoad.title,
    description: m.operationalActions.bulkLoad.description,
    href: ROUTES.PERSONS_BULK_LOAD,
    icon: 'upload',
    tone: 'violet',
    badge: m.operationalActions.bulkLoad.badge,
  },
];

const relatedModules: PersonAction[] = [
  {
    id: 'emergency',
    title: m.relatedModules.emergency.title,
    description: m.relatedModules.emergency.description,
    href: ROUTES.PERSONS_EMERGENCY,
    icon: 'phone',
    tone: 'gray',
    badge: m.relatedModules.emergency.badge,
    disabled: true,
  },
  {
    id: 'addresses',
    title: m.relatedModules.addresses.title,
    description: m.relatedModules.addresses.description,
    href: ROUTES.PERSONS_ADDRESSES,
    icon: 'pin',
    tone: 'teal',
    badge: m.relatedModules.addresses.badge,
  },
  {
    id: 'demographics',
    title: m.relatedModules.demographics.title,
    description: m.relatedModules.demographics.description,
    href: ROUTES.PERSONS_DEMOGRAPHICS,
    icon: 'group',
    tone: 'gray',
    badge: m.relatedModules.demographics.badge,
    disabled: true,
  },
];

const badgeToneByAction: Record<PersonAction['id'], string> = {
  search: 'primary',
  create: 'alta',
  detail: 'seleccion',
  edit: 'seleccion',
  bulkLoad: 'importar',
  emergency: 'modulo-off',
  addresses: 'modulo-on',
  demographics: 'modulo-off',
};

const sectionCountLabel = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? '' : 's'}`;

const totalActions =
  primaryActions.length + operationalActions.length + relatedModules.length;

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

      <div class="persons-page">
        <section class="persons-module-card">
          <div class="persons-module-card__top">
            <div class="persons-module-card__left">
              <div class="persons-module-card__eyebrow">
                <AppIcon intent="group" size="sm" />
                <span>{m.toolbarLeading}</span>
              </div>

              <h1 class="persons-module-card__title">{m.title}</h1>
              <p class="persons-module-card__description">{m.description}</p>

              <div class="persons-module-card__meta">
                <span class="persons-module-card__pill persons-module-card__pill--accent">
                  <AppIcon intent="settings" size="sm" />
                  <span>{m.meta}</span>
                </span>
                <span class="persons-module-card__pill">
                  <AppIcon intent="search" size="sm" />
                  <span>{totalActions} acciones del módulo</span>
                </span>
                <span class="persons-module-card__pill">
                  <AppIcon intent="settings" size="sm" />
                  <span>Acceso SUPER y CE</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section class="persons-section">
          <header class="persons-section__label">
            <span class="persons-section__title">Acciones principales</span>
            <span class="persons-section__line" aria-hidden="true" />
            <span class="persons-section__count">{primaryActions.length}</span>
          </header>

          <div class="persons-main-grid">
            {primaryActions.map((action) => (
              <article
                class={`persons-main-card persons-main-card--${action.tone}`}
                key={action.id}
              >
                <div class="persons-main-card__top">
                  <div
                    class={`persons-main-card__icon persons-main-card__icon--${action.tone}`}
                    aria-hidden="true"
                  >
                    <AppIcon intent={action.icon} size="lg" />
                  </div>

                  {action.badge && (
                    <span
                      class={`persons-badge persons-badge--${badgeToneByAction[action.id]}`}
                    >
                      {action.badge}
                    </span>
                  )}
                </div>

                <div class="persons-main-card__body">
                  <h2>{action.title}</h2>
                  <p>{action.description}</p>
                </div>

                <footer class="persons-main-card__footer">
                  <span class="persons-main-card__path">{action.href}</span>
                  <button
                    class={`persons-main-card__button persons-main-card__button--${action.tone}`}
                    type="button"
                    onClick$={async () => await nav(action.href)}
                  >
                    {m.openButton}
                    <AppIcon intent="chevron-right" size="sm" />
                  </button>
                </footer>
              </article>
            ))}
          </div>
        </section>

        <section class="persons-section">
          <header class="persons-section__label">
            <span class="persons-section__title">Acciones operativas</span>
            <span class="persons-section__line" aria-hidden="true" />
            <span class="persons-section__count">
              {operationalActions.length}
            </span>
          </header>

          <article class="persons-panel">
            <header class="persons-panel__header">
              <div>
                <div class="persons-panel__title">
                  <AppIcon intent="settings" size="sm" />
                  <span>Operaciones sobre personas</span>
                </div>
                <p class="persons-panel__subtitle">
                  Requieren seleccionar una persona de la búsqueda
                </p>
              </div>
              <span class="persons-panel__count">
                {sectionCountLabel(operationalActions.length, 'acción')}
              </span>
            </header>

            <div class="persons-panel__rows">
              {operationalActions.map((action) => (
                <article class="persons-row" key={action.id}>
                  <div
                    class={`persons-row__icon persons-row__icon--${action.tone}`}
                    aria-hidden="true"
                  >
                    <AppIcon intent={action.icon} size="md" />
                  </div>

                  <div class="persons-row__body">
                    <h3>{action.title}</h3>
                    <p>{action.description}</p>
                  </div>

                  <div class="persons-row__right">
                    {action.badge && (
                      <span
                        class={`persons-badge persons-badge--${badgeToneByAction[action.id]}`}
                      >
                        {action.badge}
                      </span>
                    )}

                    <button
                      class="persons-row__button"
                      type="button"
                      onClick$={async () => await nav(action.href)}
                    >
                      {m.goButton}
                      <AppIcon intent="chevron-right" size="sm" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </section>

        <section class="persons-section">
          <header class="persons-section__label">
            <span class="persons-section__title">Módulos relacionados</span>
            <span class="persons-section__line" aria-hidden="true" />
            <span class="persons-section__count">{relatedModules.length}</span>
          </header>

          <article class="persons-panel">
            <header class="persons-panel__header">
              <div>
                <div class="persons-panel__title">
                  <AppIcon intent="group" size="sm" />
                  <span>Extensiones por persona</span>
                </div>
                <p class="persons-panel__subtitle">
                  Se ejecutan en contexto de la persona activa
                </p>
              </div>
              <span class="persons-panel__count">
                {sectionCountLabel(relatedModules.length, 'módulo')}
              </span>
            </header>

            <div class="persons-panel__rows">
              {relatedModules.map((module) => (
                <article
                  class={{
                    'persons-row': true,
                    'persons-row--disabled': Boolean(module.disabled),
                  }}
                  key={module.id}
                >
                  <div
                    class={`persons-row__icon persons-row__icon--${module.tone}`}
                    aria-hidden="true"
                  >
                    <AppIcon intent={module.icon} size="md" />
                  </div>

                  <div class="persons-row__body">
                    <h3>{module.title}</h3>
                    <p>{module.description}</p>
                  </div>

                  <div class="persons-row__right">
                    {module.badge && (
                      <span
                        class={`persons-badge persons-badge--${badgeToneByAction[module.id]}`}
                      >
                        {module.badge}
                      </span>
                    )}

                    <button
                      class="persons-row__button"
                      type="button"
                      disabled={module.disabled}
                      onClick$={async () => {
                        if (!module.disabled) {
                          await nav(module.href);
                        }
                      }}
                    >
                      {m.goButton}
                      <AppIcon intent="chevron-right" size="sm" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </section>
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Personas`,
};

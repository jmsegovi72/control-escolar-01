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
import './demographics.css';

const m = messages.demographics.hub;

const primaryActions = [
  {
    id: 'search',
    title: m.primaryActions.search.title,
    description: m.primaryActions.search.description,
    href: ROUTES.DEMOGRAPHICS_SEARCH,
    icon: 'search' as const,
    tone: 'primary' as const,
    badge: m.primaryActions.search.badge,
    disabled: false,
  },
  {
    id: 'create',
    title: m.primaryActions.create.title,
    description: m.primaryActions.create.description,
    href: ROUTES.DEMOGRAPHICS_CREATE,
    icon: 'add' as const,
    tone: 'success' as const,
    badge: m.primaryActions.create.badge,
    disabled: false,
  },
];

const operationalActions = [
  {
    id: 'detail',
    title: m.operationalActions.detail.title,
    description: m.operationalActions.detail.description,
    href: ROUTES.DEMOGRAPHICS_DETAIL,
    icon: 'view' as const,
    tone: 'gray' as const,
    badge: m.operationalActions.detail.badge,
    disabled: false,
  },
  {
    id: 'edit',
    title: m.operationalActions.edit.title,
    description: m.operationalActions.edit.description,
    href: ROUTES.DEMOGRAPHICS_EDIT,
    icon: 'edit' as const,
    tone: 'gray' as const,
    badge: m.operationalActions.edit.badge,
    disabled: false,
  },
  {
    id: 'bulkLoad',
    title: m.operationalActions.bulkLoad.title,
    description: m.operationalActions.bulkLoad.description,
    href: ROUTES.DEMOGRAPHICS_BULK_LOAD,
    icon: 'upload' as const,
    tone: 'violet' as const,
    badge: m.operationalActions.bulkLoad.badge,
    disabled: true,
  },
];

const relatedModules = [
  {
    id: 'persons',
    title: m.relatedModules.persons.title,
    description: m.relatedModules.persons.description,
    href: ROUTES.PERSONS,
    icon: 'person' as const,
    tone: 'gray' as const,
    badge: m.relatedModules.persons.badge,
    disabled: false,
  },
];

const totalActions =
  primaryActions.length + operationalActions.length + relatedModules.length;

export default component$(() => {
  return (
    <AuthenticatedShell
      eyebrow={messages.app.name}
      title={m.title}
      description={m.description}
      allowedUserTypes={['SUPER', 'CE']}
      accessDeniedDescription={m.accessDenied}
    >
      <HubHeader
        q:slot="hub-header"
        eyebrow={m.toolbarLeading}
        icon="dashboard"
        title={m.title}
        description={m.description}
        metaItems={[
          { label: m.meta, icon: 'dashboard', tone: 'accent' },
          { label: `${totalActions} acciones del módulo`, icon: 'search' },
          { label: 'Acceso SUPER y CE', icon: 'settings' },
        ]}
      />

      <div class="demographics-page">
        <HubSection title="Acciones principales" count={primaryActions.length}>
          <div class="demographics-main-grid">
            {primaryActions.map((action) => (
              <ActionCard
                key={action.id}
                icon={action.icon}
                tone={action.tone}
                title={action.title}
                description={action.description}
                badge={action.badge}
                href={action.href}
                disabled={action.disabled}
                actionLabel={m.openButton}
              />
            ))}
          </div>
        </HubSection>

        <HubSection
          title="Acciones operativas"
          count={operationalActions.length}
        >
          <Panel
            title={m.panelTitle}
            description={m.panelDescription}
            icon="settings"
          >
            <div class="demographics-panel__rows">
              {operationalActions.map((action) => (
                <ActionRow
                  key={action.id}
                  icon={action.icon}
                  tone={action.tone}
                  title={action.title}
                  description={action.description}
                  badge={action.badge}
                  href={action.href}
                  disabled={action.disabled}
                  actionLabel={m.goButton}
                />
              ))}
            </div>
          </Panel>
        </HubSection>

        <HubSection title="Módulos relacionados" count={relatedModules.length}>
          <Panel
            title={m.relatedPanelTitle}
            description={m.relatedPanelDescription}
            icon="group"
          >
            <div class="demographics-panel__rows">
              {relatedModules.map((module) => (
                <ActionRow
                  key={module.id}
                  icon={module.icon}
                  tone={module.tone}
                  title={module.title}
                  description={module.description}
                  badge={module.badge}
                  href={module.href}
                  disabled={module.disabled}
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
  title: `${appConfig.name} | Demografía`,
};

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
import './persons.css';

const m = messages.persons.hub;

const primaryActions = [
  {
    id: 'search',
    title: m.primaryActions.search.title,
    description: m.primaryActions.search.description,
    href: ROUTES.PERSONS_SEARCH,
    icon: 'search' as const,
    tone: 'primary' as const,
    badge: m.primaryActions.search.badge,
  },
  {
    id: 'create',
    title: m.primaryActions.create.title,
    description: m.primaryActions.create.description,
    href: ROUTES.PERSONS_CREATE,
    icon: 'add' as const,
    tone: 'success' as const,
    badge: m.primaryActions.create.badge,
  },
];

const operationalActions = [
  {
    id: 'detail',
    title: m.operationalActions.detail.title,
    description: m.operationalActions.detail.description,
    href: ROUTES.PERSONS_DETAIL,
    icon: 'view' as const,
    tone: 'warning' as const,
    badge: m.operationalActions.detail.badge,
  },
  {
    id: 'edit',
    title: m.operationalActions.edit.title,
    description: m.operationalActions.edit.description,
    href: ROUTES.PERSONS_EDIT,
    icon: 'edit' as const,
    tone: 'primary' as const,
    badge: m.operationalActions.edit.badge,
  },
  {
    id: 'bulkLoad',
    title: m.operationalActions.bulkLoad.title,
    description: m.operationalActions.bulkLoad.description,
    href: ROUTES.PERSONS_BULK_LOAD,
    icon: 'upload' as const,
    tone: 'violet' as const,
    badge: m.operationalActions.bulkLoad.badge,
  },
];

const relatedModules = [
  {
    id: 'emergency',
    title: m.relatedModules.emergency.title,
    description: m.relatedModules.emergency.description,
    href: ROUTES.PERSONS_EMERGENCY,
    icon: 'phone' as const,
    tone: 'gray' as const,
    badge: m.relatedModules.emergency.badge,
    disabled: true,
  },
  {
    id: 'addresses',
    title: m.relatedModules.addresses.title,
    description: m.relatedModules.addresses.description,
    href: ROUTES.PERSONS_ADDRESSES,
    icon: 'pin' as const,
    tone: 'teal' as const,
    badge: m.relatedModules.addresses.badge,
    disabled: false,
  },
  {
    id: 'demographics',
    title: m.relatedModules.demographics.title,
    description: m.relatedModules.demographics.description,
    href: ROUTES.PERSONS_DEMOGRAPHICS,
    icon: 'group' as const,
    tone: 'gray' as const,
    badge: m.relatedModules.demographics.badge,
    disabled: true,
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
        icon="group"
        title={m.title}
        description={m.description}
        metaItems={[
          { label: m.meta, icon: 'group', tone: 'accent' },
          { label: `${totalActions} acciones del módulo`, icon: 'search' },
          { label: 'Acceso SUPER y CE', icon: 'settings' },
        ]}
      />

      <div class="persons-page">
        <HubSection title="Acciones principales" count={primaryActions.length}>
          <div class="persons-main-grid">
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

        <HubSection
          title="Acciones operativas"
          count={operationalActions.length}
        >
          <Panel
            title="Operaciones sobre personas"
            description="Requieren seleccionar una persona de la búsqueda"
            icon="settings"
          >
            <div class="persons-panel__rows">
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

        <HubSection title="Módulos relacionados" count={relatedModules.length}>
          <Panel
            title="Extensiones por persona"
            description="Se ejecutan en contexto de la persona activa"
            icon="group"
          >
            <div class="persons-panel__rows">
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
  title: `${appConfig.name} | Personas`,
};

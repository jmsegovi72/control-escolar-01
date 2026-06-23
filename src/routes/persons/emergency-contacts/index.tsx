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
import './emergency-contacts.css';

const m = messages.emergencyContacts.hub;

const primaryActions = [
  {
    id: 'create',
    title: m.primaryActions.create.title,
    description: m.primaryActions.create.description,
    href: ROUTES.EMERGENCY_CONTACTS_CREATE,
    icon: 'add' as const,
    tone: 'success' as const,
    badge: m.primaryActions.create.badge,
  },
  {
    id: 'detail',
    title: m.primaryActions.detail.title,
    description: m.primaryActions.detail.description,
    href: ROUTES.EMERGENCY_CONTACTS_DETAIL,
    icon: 'view' as const,
    tone: 'primary' as const,
    badge: m.primaryActions.detail.badge,
  },
];

const operationalActions = [
  {
    id: 'edit',
    title: m.operationalActions.edit.title,
    description: m.operationalActions.edit.description,
    href: ROUTES.EMERGENCY_CONTACTS_EDIT,
    icon: 'edit' as const,
    tone: 'primary' as const,
    badge: m.operationalActions.edit.badge,
  },
  {
    id: 'bulkLoad',
    title: m.operationalActions.bulkLoad.title,
    description: m.operationalActions.bulkLoad.description,
    href: ROUTES.EMERGENCY_CONTACTS_BULK_LOAD,
    icon: 'upload' as const,
    tone: 'violet' as const,
    badge: m.operationalActions.bulkLoad.badge,
  },
];

const relatedModules = [
  {
    id: 'persons',
    title: m.relatedModules.persons.title,
    description: m.relatedModules.persons.description,
    href: ROUTES.PERSONS,
    icon: 'person' as const,
    tone: 'slate' as const,
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
        icon="phone"
        title={m.title}
        description={m.description}
        metaItems={[
          { label: m.meta, icon: 'phone', tone: 'accent' },
          { label: `${totalActions} acciones del módulo`, icon: 'search' },
          { label: 'Acceso SUPER y CE', icon: 'settings' },
        ]}
      />

      <div class="emergency-contacts-page">
        <HubSection title="Acciones principales" count={primaryActions.length}>
          <div class="emergency-contacts-main-grid">
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
            title={m.panelTitle}
            description={m.panelDescription}
            icon="settings"
          >
            <div class="emergency-contacts-panel__rows">
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
            title={m.relatedPanelTitle}
            description={m.relatedPanelDescription}
            icon="phone"
          >
            <div class="emergency-contacts-panel__rows">
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
  title: `${appConfig.name} | Contacto de emergencia`,
};

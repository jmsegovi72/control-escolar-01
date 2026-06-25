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
import './students.css';

const m = messages.students.hub;

const primaryActions = [
  {
    id: 'search',
    title: m.primaryActions.search.title,
    description: m.primaryActions.search.description,
    href: ROUTES.STUDENTS_SEARCH,
    icon: 'search' as const,
    tone: 'primary' as const,
    badge: m.primaryActions.search.badge,
    disabled: false,
  },
  {
    id: 'create',
    title: m.primaryActions.create.title,
    description: m.primaryActions.create.description,
    href: ROUTES.STUDENTS_CREATE,
    icon: 'student' as const,
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
    href: ROUTES.STUDENTS_DETAIL,
    icon: 'view' as const,
    tone: 'warning' as const,
    badge: m.operationalActions.detail.badge,
    disabled: false,
  },
  {
    id: 'edit',
    title: m.operationalActions.edit.title,
    description: m.operationalActions.edit.description,
    href: ROUTES.STUDENTS_EDIT,
    icon: 'edit' as const,
    tone: 'primary' as const,
    badge: m.operationalActions.edit.badge,
    disabled: false,
  },
  {
    id: 'bulkLoad',
    title: m.operationalActions.bulkLoad.title,
    description: m.operationalActions.bulkLoad.description,
    href: ROUTES.STUDENTS_BULK_LOAD,
    icon: 'upload' as const,
    tone: 'violet' as const,
    badge: m.operationalActions.bulkLoad.badge,
    disabled: true,
  },
  {
    id: 'batchEmails',
    title: m.operationalActions.batchEmails.title,
    description: m.operationalActions.batchEmails.description,
    href: ROUTES.STUDENTS_BATCH_EMAILS,
    icon: 'mail' as const,
    tone: 'teal' as const,
    badge: m.operationalActions.batchEmails.badge,
    disabled: true,
  },
  {
    id: 'batchCodes',
    title: m.operationalActions.batchCodes.title,
    description: m.operationalActions.batchCodes.description,
    href: ROUTES.STUDENTS_BATCH_CODES,
    icon: 'class' as const,
    tone: 'teal' as const,
    badge: m.operationalActions.batchCodes.badge,
    disabled: true,
  },
];

const relatedModules = [
  {
    id: 'enrollment',
    title: m.relatedModules.enrollment.title,
    description: m.relatedModules.enrollment.description,
    href: ROUTES.STUDENTS_ENROLLMENT,
    icon: 'save' as const,
    tone: 'gray' as const,
    badge: m.relatedModules.enrollment.badge,
    disabled: true,
  },
  {
    id: 'documents',
    title: m.relatedModules.documents.title,
    description: m.relatedModules.documents.description,
    href: ROUTES.STUDENTS_DOCUMENTS,
    icon: 'download' as const,
    tone: 'gray' as const,
    badge: m.relatedModules.documents.badge,
    disabled: true,
  },
  {
    id: 'academicBackground',
    title: m.relatedModules.academicBackground.title,
    description: m.relatedModules.academicBackground.description,
    href: ROUTES.STUDENTS_ACADEMIC_BACKGROUND,
    icon: 'school' as const,
    tone: 'gray' as const,
    badge: m.relatedModules.academicBackground.badge,
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
        icon="student"
        title={m.title}
        description={m.description}
        metaItems={[
          { label: m.meta, icon: 'student', tone: 'accent' },
          { label: `${totalActions} acciones del módulo`, icon: 'check' },
          { label: 'Acceso SUPER y CE', icon: 'settings' },
        ]}
      />

      <div class="students-page">
        <HubSection title={m.primaryActionsTitle} count={primaryActions.length}>
          <div class="students-main-grid">
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
          title={m.operationalActionsTitle}
          count={operationalActions.length}
        >
          <Panel
            title={m.operationalPanel.title}
            description={m.operationalPanel.description}
            icon="settings"
          >
            <div class="students-panel__rows">
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

        <HubSection title={m.relatedModulesTitle} count={relatedModules.length}>
          <Panel
            title={m.relatedPanel.title}
            description={m.relatedPanel.description}
            icon="dashboard"
          >
            <div class="students-panel__rows">
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
  title: `${appConfig.name} | Estudiantes`,
};

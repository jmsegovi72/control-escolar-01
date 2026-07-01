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
import './documents.css';

const m = messages.students.documentsHub;

const primaryActions = [
  {
    id: 'upload',
    title: m.primaryActions.upload.title,
    description: m.primaryActions.upload.description,
    href: ROUTES.PERSONS_DOCUMENTS_UPLOAD,
    icon: 'upload' as const,
    tone: 'primary' as const,
    badge: m.primaryActions.upload.badge,
    disabled: false,
  },
  {
    id: 'detail',
    title: m.primaryActions.detail.title,
    description: m.primaryActions.detail.description,
    href: ROUTES.STUDENTS_DOCUMENTS_DETAIL,
    icon: 'view' as const,
    tone: 'warning' as const,
    badge: m.primaryActions.detail.badge,
    disabled: true,
  },
];

const operationalActions = [
  {
    id: 'list',
    title: m.operationalActions.list.title,
    description: m.operationalActions.list.description,
    href: ROUTES.STUDENTS_DOCUMENTS_LIST,
    icon: 'list' as const,
    tone: 'violet' as const,
    badge: m.operationalActions.list.badge,
    disabled: true,
  },
  {
    id: 'file',
    title: m.operationalActions.file.title,
    description: m.operationalActions.file.description,
    href: ROUTES.STUDENTS_DOCUMENTS_FILE,
    icon: 'download' as const,
    tone: 'slate' as const,
    badge: m.operationalActions.file.badge,
    disabled: true,
  },
  {
    id: 'edit',
    title: m.operationalActions.edit.title,
    description: m.operationalActions.edit.description,
    href: ROUTES.STUDENTS_DOCUMENTS_EDIT,
    icon: 'edit' as const,
    tone: 'primary' as const,
    badge: m.operationalActions.edit.badge,
    disabled: true,
  },
];

const notes = [
  m.notes.pdfOnly,
  m.notes.upsert,
  m.notes.fileName,
  m.notes.inlineView,
  m.notes.noBulkDelete,
];

const totalActions = primaryActions.length + operationalActions.length;

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
        icon="download"
        title={m.title}
        description={m.description}
        metaItems={[
          { label: m.meta, icon: 'download', tone: 'accent' },
          { label: `${totalActions} acciones disponibles`, icon: 'check' },
          { label: 'Multiples formatos · Max 20 MB', icon: 'info' },
        ]}
      />

      <div class="student-documents-page">
        <HubSection title={m.primaryActionsTitle} count={primaryActions.length}>
          <div class="student-documents-main-grid">
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
            <div class="student-documents-panel__rows">
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

        <HubSection title={m.notesTitle} count={notes.length}>
          <Panel
            title={m.notesPanel.title}
            description={m.notesPanel.description}
            icon="warning"
          >
            <div class="student-documents-note-card">
              <div class="student-documents-note-card__icon" aria-hidden="true">
                •
              </div>
              <div class="student-documents-note-card__content">
                {notes.map((note) => (
                  <div key={note} class="student-documents-note-card__item">
                    {note}
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </HubSection>
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Documentos de personas`,
};

import {
  $,
  component$,
  useComputed$,
  useSignal,
  useTask$,
  useVisibleTask$,
} from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useLocation, useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { appConfig } from '~/config/app.config';
import { ENV } from '~/config/env';
import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
import { documentService } from '~/services/document/document.service';
import { personService } from '~/services/person/person.service';
import { staffService } from '~/services/staff/staff.service';
import { studentService } from '~/services/student/student.service';
import type {
  DocumentDetail,
  PersonDocumentListItem,
} from '~/types/document.types';
import type { PersonListItem } from '~/types/person.types';
import type { StaffSearchResult } from '~/types/staff.types';
import type { StudentSearchResult } from '~/types/student.types';
import {
  ActionHeader,
  Avatar,
  Button,
  DateInput,
  EmptyState,
  Field,
  Panel,
  SearchSelect,
  SelectionStep,
  Textarea,
  Toast,
} from '~/ui';
import { EditResult, EditResultRow } from '~/ui/composed/EditResult';
import { AppIcon } from '~/ui/icons';
import { normalizeError } from '~/utils/api-error';
import './edit.css';

const m = messages.students.documentsEdit;
const DEFAULT_PERSON_AVATAR = '/avatars/user-default.svg';

type SubmissionMode = 'idle' | 'success' | 'error';
type ContextMode = 'view' | 'search';

type OriginalValues = {
  deliveryDate: string;
  studentId: number | null;
  staffId: number | null;
  notes: string;
};

const emptyOriginal: OriginalValues = {
  deliveryDate: '',
  studentId: null,
  staffId: null,
  notes: '',
};

const resolvePhotoUrl = (photoUrl?: string | null): string => {
  if (!photoUrl) return DEFAULT_PERSON_AVATAR;
  if (photoUrl.startsWith('http')) return photoUrl;
  const apiBase = ENV.API_URL.replace(/\/sices\/v\d+$/, '');
  return `${apiBase}/${photoUrl.replace(/^\/+/, '')}`;
};

const shouldSearch = (value: string): boolean => {
  const normalized = value.trim();
  if (!normalized) return false;
  if (/^\d+$/.test(normalized)) return true;
  return normalized.length >= 3;
};

const toDateInputValue = (value?: string | null): string => {
  if (!value) return '';
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? '';
};

const formatDateLabel = (value?: string | null): string => {
  if (!value) return m.noData;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const getDocumentContextLabel = (item: {
  studentId?: number | null;
  staffId?: number | null;
}) => {
  if (item.studentId) return m.documentStudentContext;
  if (item.staffId) return m.documentStaffContext;
  return m.documentGeneralContext;
};

export default component$(() => {
  const nav = useNavigate();
  const location = useLocation();

  const selectedPerson = useSignal<PersonListItem | null>(null);
  const personQuery = useSignal('');
  const personResults = useSignal<PersonListItem[]>([]);
  const searchingPerson = useSignal(false);

  const documents = useSignal<PersonDocumentListItem[]>([]);
  const loadingDocuments = useSignal(false);
  const selectedDocument = useSignal<DocumentDetail | null>(null);
  const loadingDocument = useSignal(false);

  const studentMode = useSignal<ContextMode>('view');
  const studentQuery = useSignal('');
  const studentResults = useSignal<StudentSearchResult[]>([]);
  const searchingStudent = useSignal(false);
  const selectedStudent = useSignal<StudentSearchResult | null>(null);

  const staffMode = useSignal<ContextMode>('view');
  const staffQuery = useSignal('');
  const staffResults = useSignal<StaffSearchResult[]>([]);
  const searchingStaff = useSignal(false);
  const selectedStaff = useSignal<StaffSearchResult | null>(null);

  const deliveryDate = useSignal('');
  const notes = useSignal('');
  const original = useSignal<OriginalValues>({ ...emptyOriginal });

  const loading = useSignal(false);
  const saving = useSignal(false);
  const mode = useSignal<SubmissionMode>('idle');
  const error = useSignal('');
  const formError = useSignal('');

  const personOptions = useComputed$(() =>
    personResults.value.map((person) => ({
      value: String(person.id),
      label: person.fullName,
      description: `${person.curp} - ID ${person.id}`,
    })),
  );

  const studentOptions = useComputed$(() =>
    studentResults.value.map((student) => ({
      value: String(student.id),
      label: student.fullName,
      description: `${student.studentCode ?? 'Sin matricula'} - ${student.curp}`,
    })),
  );

  const staffOptions = useComputed$(() =>
    staffResults.value.map((staff) => ({
      value: String(staff.id),
      label: staff.fullName,
      description: `${staff.employeeCode ?? 'Sin codigo'} - ${staff.curp}`,
    })),
  );

  const deliveryDateChanged = useComputed$(
    () =>
      deliveryDate.value.trim() !== '' &&
      deliveryDate.value !== original.value.deliveryDate,
  );

  const studentChanged = useComputed$(
    () => (selectedStudent.value?.id ?? null) !== original.value.studentId,
  );

  const staffChanged = useComputed$(
    () => (selectedStaff.value?.id ?? null) !== original.value.staffId,
  );

  const notesChanged = useComputed$(() => notes.value !== original.value.notes);

  const hasChanges = useComputed$(
    () =>
      deliveryDateChanged.value ||
      studentChanged.value ||
      staffChanged.value ||
      notesChanged.value,
  );

  const loadDocumentDetail$ = $(async (documentId: number) => {
    loadingDocument.value = true;
    formError.value = '';
    error.value = '';

    try {
      const detail = await documentService.findOne(documentId);
      selectedDocument.value = detail;

      deliveryDate.value = toDateInputValue(detail.deliveryDate);
      notes.value = detail.notes ?? '';
      original.value = {
        deliveryDate: toDateInputValue(detail.deliveryDate),
        studentId: detail.studentId ?? null,
        staffId: detail.staffId ?? null,
        notes: detail.notes ?? '',
      };

      studentMode.value = 'view';
      staffMode.value = 'view';
      studentQuery.value = '';
      staffQuery.value = '';
      studentResults.value = [];
      staffResults.value = [];

      if (detail.studentId) {
        try {
          selectedStudent.value = await studentService.findOne(
            detail.studentId,
          );
        } catch {
          selectedStudent.value = {
            id: detail.studentId,
            fullName:
              detail.studentName ??
              `${m.fieldStudentSelected} #${detail.studentId}`,
            curp: selectedPerson.value?.curp ?? '',
            studentCode: detail.studentCode ?? null,
          };
        }
      } else {
        selectedStudent.value = null;
      }

      if (detail.staffId) {
        try {
          const staff = await staffService.findOne(detail.staffId);
          selectedStaff.value = {
            ...staff,
            employeeCode: staff.employeeCode ?? staff.paymentUniqueKey ?? null,
          };
        } catch {
          selectedStaff.value = {
            id: detail.staffId,
            fullName:
              detail.staffName ?? `${m.fieldStaffSelected} #${detail.staffId}`,
            curp: selectedPerson.value?.curp ?? '',
            employeeCode: detail.employeeCode ?? null,
          };
        }
      } else {
        selectedStaff.value = null;
      }
    } catch (err) {
      error.value = normalizeError(err, m.errorDescription).message;
      selectedDocument.value = null;
    } finally {
      loadingDocument.value = false;
    }
  });

  const loadDocumentsForPerson$ = $(async (personId: number) => {
    loadingDocuments.value = true;
    error.value = '';
    selectedDocument.value = null;
    documents.value = [];

    try {
      documents.value = await documentService.listByPerson(personId);
    } catch (err) {
      error.value = normalizeError(err, m.errorDescription).message;
      documents.value = [];
    } finally {
      loadingDocuments.value = false;
    }
  });

  useVisibleTask$(async ({ track }) => {
    const personIdParam = track(() =>
      location.url.searchParams.get('personId'),
    );
    const documentIdParam = track(() => location.url.searchParams.get('id'));

    loading.value = true;
    selectedPerson.value = null;
    selectedDocument.value = null;
    documents.value = [];
    personQuery.value = '';
    personResults.value = [];
    studentResults.value = [];
    staffResults.value = [];
    studentQuery.value = '';
    staffQuery.value = '';
    error.value = '';
    formError.value = '';
    mode.value = 'idle';

    try {
      if (personIdParam) {
        const person = await personService.findOne(Number(personIdParam));
        selectedPerson.value = {
          id: person.id,
          fullName: person.fullName,
          firstName: person.firstName,
          firstLastName: person.firstLastName,
          secondLastName: person.secondLastName,
          curp: person.curp,
          gender: person.gender,
          photoUrl: person.photoUrl,
          phone: person.phone,
          personalEmail: person.personalEmail,
        };
        await loadDocumentsForPerson$(person.id);
      }

      if (documentIdParam) {
        await loadDocumentDetail$(Number(documentIdParam));
      }
    } catch (err) {
      error.value = normalizeError(err, m.errorDescription).message;
    } finally {
      loading.value = false;
    }
  });

  useTask$(async ({ track }) => {
    const query = track(() => personQuery.value.trim());

    if (!shouldSearch(query)) {
      personResults.value = [];
      return;
    }

    searchingPerson.value = true;
    try {
      const response = await personService.findMany({
        searchTerm: query,
        limit: 8,
        page: 1,
      });
      personResults.value = response.data;
    } catch {
      personResults.value = [];
    } finally {
      searchingPerson.value = false;
    }
  });

  useTask$(async ({ track }) => {
    const query = track(() => studentQuery.value.trim());

    if (studentMode.value !== 'search' || !shouldSearch(query)) {
      studentResults.value = [];
      searchingStudent.value = false;
      return;
    }

    searchingStudent.value = true;
    try {
      const response = await studentService.findMany({
        searchTerm: query,
        limit: 8,
        page: 1,
      });
      const currentPersonId = selectedPerson.value?.id;
      studentResults.value = response.data.filter(
        (item) =>
          !currentPersonId ||
          item.personId === undefined ||
          item.personId === currentPersonId,
      );
    } catch {
      studentResults.value = [];
    } finally {
      searchingStudent.value = false;
    }
  });

  useTask$(async ({ track }) => {
    const query = track(() => staffQuery.value.trim());

    if (staffMode.value !== 'search' || !shouldSearch(query)) {
      staffResults.value = [];
      searchingStaff.value = false;
      return;
    }

    searchingStaff.value = true;
    try {
      const response = /^\d+$/.test(query)
        ? { data: [await staffService.findOne(Number(query))] }
        : await staffService.findMany(query, 8, 1);

      const currentPersonId = selectedPerson.value?.id;
      staffResults.value = response.data
        .map((item) => ({
          ...item,
          employeeCode: item.employeeCode ?? item.paymentUniqueKey ?? null,
        }))
        .filter(
          (item) =>
            !currentPersonId ||
            item.personId === undefined ||
            item.personId === null ||
            item.personId === currentPersonId,
        );
    } catch {
      staffResults.value = [];
    } finally {
      searchingStaff.value = false;
    }
  });

  const resetFormError$ = $(() => {
    formError.value = '';
    if (mode.value === 'error') {
      mode.value = 'idle';
    }
  });

  const saveChanges$ = $(async () => {
    if (!selectedPerson.value) {
      formError.value = m.errorPersonRequired;
      return;
    }

    if (!selectedDocument.value) {
      formError.value = m.errorDocumentRequired;
      return;
    }

    if (
      studentMode.value === 'search' &&
      studentQuery.value.trim() &&
      !selectedStudent.value
    ) {
      formError.value = m.errorStudentInvalid;
      return;
    }

    if (
      staffMode.value === 'search' &&
      staffQuery.value.trim() &&
      !selectedStaff.value
    ) {
      formError.value = m.errorStaffInvalid;
      return;
    }

    if (!hasChanges.value) {
      formError.value = m.errorNoChanges;
      return;
    }

    const dto: Record<string, unknown> = {};

    if (deliveryDateChanged.value) {
      dto.deliveryDate = deliveryDate.value;
    }

    if (notesChanged.value) {
      dto.notes = notes.value;
    }

    if (studentChanged.value) {
      dto.studentId = selectedStudent.value?.id ?? null;
    }

    if (staffChanged.value) {
      dto.staffId = selectedStaff.value?.id ?? null;
    }

    saving.value = true;
    formError.value = '';
    error.value = '';

    try {
      const updated = await documentService.updateMetadata(
        selectedDocument.value.id,
        dto,
      );

      selectedDocument.value = {
        ...selectedDocument.value,
        studentId: updated.studentId ?? null,
        staffId: updated.staffId ?? null,
        deliveryDate:
          updated.deliveryDate ?? selectedDocument.value.deliveryDate,
        notes: updated.notes ?? '',
      };

      original.value = {
        deliveryDate: toDateInputValue(updated.deliveryDate),
        studentId: updated.studentId ?? null,
        staffId: updated.staffId ?? null,
        notes: updated.notes ?? '',
      };

      deliveryDate.value = toDateInputValue(updated.deliveryDate);
      notes.value = updated.notes ?? '';
      mode.value = 'success';
    } catch (err) {
      error.value = normalizeError(err, m.errorDescription).message;
      mode.value = 'error';
    } finally {
      saving.value = false;
    }
  });

  const currentDocument = selectedDocument.value;

  return (
    <AuthenticatedShell
      eyebrow={m.eyebrow}
      title={m.title}
      description={m.description}
      meta={m.meta}
      allowedUserTypes={['SUPER', 'CE']}
      accessDeniedDescription={m.accessDenied}
      fullWidth
    >
      <ActionHeader
        q:slot="hub-header"
        title={m.title}
        onBack$={async () => await nav(ROUTES.PERSONS_DOCUMENTS)}
      />

      <div class="document-edit-page">
        <div class="document-edit-page__content">
          {loading.value && (
            <Panel title={m.loadingTitle} description={m.loadingDescription}>
              <div class="document-edit-page__loading" />
            </Panel>
          )}

          {!loading.value && error.value && mode.value !== 'error' && (
            <Toast tone="danger" title="Error">
              {error.value}
            </Toast>
          )}

          {!loading.value && !selectedPerson.value && (
            <div class="document-edit-page__stage">
              <SelectionStep
                title={m.selectionPersonTitle}
                description={m.selectionPersonDescription}
                fieldLabel={m.selectionPersonFieldLabel}
                fieldHint={m.selectionPersonFieldHint}
                placeholder={m.selectionPersonPlaceholder}
                emptyMessage={m.selectionPersonEmpty}
                query={personQuery.value}
                options={personOptions.value}
                loading={searchingPerson.value}
                filterMode="external"
                onQueryChange$={(query) => {
                  personQuery.value = query;
                }}
                onSelect$={async (option) => {
                  const person = personResults.value.find(
                    (item) => item.id === Number(option.value),
                  );
                  if (!person) return;
                  selectedPerson.value = person;
                  personQuery.value = '';
                  personResults.value = [];
                  await loadDocumentsForPerson$(person.id);
                }}
              />
            </div>
          )}

          {!loading.value && selectedPerson.value && (
            <div class="document-edit-page__stage">
              <Panel
                title={m.selectedPersonTitle}
                description={m.selectedPersonDescription}
              >
                <div q:slot="leading" class="document-edit-page__panel-icon">
                  <AppIcon intent="person" size="md" />
                </div>
                <div class="document-edit-page__person-card">
                  <Avatar
                    src={resolvePhotoUrl(selectedPerson.value.photoUrl)}
                    name={selectedPerson.value.fullName}
                    size="lg"
                  />
                  <div class="document-edit-page__person-copy">
                    <strong>{selectedPerson.value.fullName}</strong>
                    <span>{selectedPerson.value.curp}</span>
                    <small>ID {selectedPerson.value.id}</small>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick$={() => {
                      selectedPerson.value = null;
                      selectedDocument.value = null;
                      documents.value = [];
                      personQuery.value = '';
                      mode.value = 'idle';
                      formError.value = '';
                      error.value = '';
                    }}
                  >
                    {m.selectedPersonChange}
                  </Button>
                </div>
              </Panel>

              {!currentDocument && (
                <Panel
                  title={m.documentsTitle}
                  description={m.documentsDescription}
                >
                  <div
                    q:slot="leading"
                    class="document-edit-page__panel-icon document-edit-page__panel-icon--amber"
                  >
                    <AppIcon intent="list" size="md" />
                  </div>

                  {loadingDocuments.value ? (
                    <div class="document-edit-page__loading-block">
                      {m.documentsLoading}
                    </div>
                  ) : documents.value.length === 0 ? (
                    <EmptyState
                      title={m.documentsEmpty}
                      description={m.documentsDescription}
                      tone="warning"
                    />
                  ) : (
                    <div class="document-edit-page__document-list">
                      {documents.value.map((item) => (
                        <article
                          key={item.id}
                          class="document-edit-page__doc-card"
                        >
                          <div class="document-edit-page__doc-card-copy">
                            <strong>{item.documentName}</strong>
                            <span>{formatDateLabel(item.deliveryDate)}</span>
                            <small>{getDocumentContextLabel(item)}</small>
                          </div>
                          <Button
                            size="sm"
                            onClick$={async () =>
                              await loadDocumentDetail$(item.id)
                            }
                          >
                            {m.documentSelectButton}
                          </Button>
                        </article>
                      ))}
                    </div>
                  )}
                </Panel>
              )}

              {loadingDocument.value && (
                <Panel
                  title={m.loadingTitle}
                  description={m.loadingDescription}
                >
                  <div class="document-edit-page__loading" />
                </Panel>
              )}

              {!loadingDocument.value &&
                currentDocument &&
                mode.value !== 'success' && (
                  <>
                    <div class="document-edit-page__summary-card">
                      <div class="document-edit-page__summary-icon">
                        <AppIcon intent="view" size="md" />
                      </div>
                      <div class="document-edit-page__summary-copy">
                        <div class="document-edit-page__summary-type">
                          {currentDocument.documentName}
                        </div>
                        <div class="document-edit-page__summary-file">
                          {currentDocument.filePath ?? m.noData}
                        </div>
                        <div class="document-edit-page__summary-meta">
                          <span>{selectedPerson.value.fullName}</span>
                          <span>{currentDocument.mimeType ?? m.noData}</span>
                        </div>
                      </div>
                    </div>

                    {formError.value && (
                      <Toast tone="danger" title="Error">
                        {formError.value}
                      </Toast>
                    )}

                    {mode.value === 'error' && error.value && (
                      <EditResult
                        tone="error"
                        eyebrow={m.errorEyebrow}
                        title={m.errorTitle}
                        description={error.value}
                        onRetry$={saveChanges$}
                        retryLabel={m.errorRetry}
                      >
                        <div q:slot="actions">
                          <Button
                            variant="secondary"
                            onClick$={() => {
                              mode.value = 'idle';
                              error.value = '';
                            }}
                          >
                            {m.errorBackToForm}
                          </Button>
                        </div>
                      </EditResult>
                    )}

                    {mode.value !== 'error' && (
                      <>
                        <Panel
                          title={m.formTitle}
                          description={m.formDescription}
                        >
                          <div
                            q:slot="leading"
                            class="document-edit-page__panel-icon"
                          >
                            <AppIcon intent="edit" size="md" />
                          </div>

                          <div class="document-edit-page__form-grid">
                            <Field
                              label={m.fieldDeliveryDateLabel}
                              optional
                              hint={m.fieldDeliveryDateHint}
                            >
                              <div class="document-edit-page__field-stack">
                                <label class="document-edit-page__field-label">
                                  <span>{m.fieldDeliveryDateLabel}</span>
                                  {deliveryDateChanged.value && (
                                    <span class="document-edit-page__changed-dot" />
                                  )}
                                </label>
                                <DateInput
                                  value={deliveryDate.value}
                                  onInput$={(event) => {
                                    deliveryDate.value = (
                                      event.target as HTMLInputElement
                                    ).value;
                                    resetFormError$();
                                  }}
                                />
                              </div>
                            </Field>

                            <Field
                              label={m.fieldStudentLabel}
                              optional
                              hint={m.fieldStudentHint}
                            >
                              <div class="document-edit-page__field-stack">
                                <label class="document-edit-page__field-label">
                                  <span>{m.fieldStudentLabel}</span>
                                  {studentChanged.value && (
                                    <span class="document-edit-page__changed-dot" />
                                  )}
                                </label>
                                <div class="document-edit-page__context-card">
                                  <div class="document-edit-page__context-avatar">
                                    <AppIcon intent="school" size="sm" />
                                  </div>
                                  <div class="document-edit-page__context-copy">
                                    <strong>
                                      {selectedStudent.value?.fullName ??
                                        m.fieldStudentUnassigned}
                                    </strong>
                                    <small>
                                      {selectedStudent.value
                                        ? `${selectedStudent.value.studentCode ?? 'Sin matricula'} - ID ${selectedStudent.value.id}`
                                        : m.noData}
                                    </small>
                                  </div>
                                  <div class="document-edit-page__context-actions">
                                    {selectedStudent.value ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick$={() => {
                                          selectedStudent.value = null;
                                          studentMode.value = 'view';
                                          studentQuery.value = '';
                                          resetFormError$();
                                        }}
                                      >
                                        {m.fieldStudentUnlink}
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick$={() => {
                                          studentMode.value = 'search';
                                        }}
                                      >
                                        {m.fieldStudentAssign}
                                      </Button>
                                    )}
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick$={() => {
                                        studentMode.value = 'search';
                                      }}
                                    >
                                      {m.searchButton}
                                    </Button>
                                  </div>
                                </div>

                                {studentMode.value === 'search' && (
                                  <SearchSelect
                                    query={studentQuery.value}
                                    options={studentOptions.value}
                                    loading={searchingStudent.value}
                                    placeholder={m.fieldStudentPlaceholder}
                                    filterMode="external"
                                    emptyMessage={
                                      shouldSearch(studentQuery.value)
                                        ? m.fieldStudentEmpty
                                        : m.fieldStudentHint
                                    }
                                    onQueryChange$={(query) => {
                                      studentQuery.value = query;
                                    }}
                                    onSelect$={async (option) => {
                                      const found = studentResults.value.find(
                                        (item) =>
                                          item.id === Number(option.value),
                                      );
                                      if (!found) return;
                                      selectedStudent.value = found;
                                      studentMode.value = 'view';
                                      studentQuery.value = '';
                                      studentResults.value = [];
                                      resetFormError$();
                                    }}
                                  />
                                )}
                              </div>
                            </Field>

                            <Field
                              label={m.fieldStaffLabel}
                              optional
                              hint={m.fieldStaffHint}
                            >
                              <div class="document-edit-page__field-stack">
                                <label class="document-edit-page__field-label">
                                  <span>{m.fieldStaffLabel}</span>
                                  {staffChanged.value && (
                                    <span class="document-edit-page__changed-dot" />
                                  )}
                                </label>
                                <div class="document-edit-page__context-card">
                                  <div class="document-edit-page__context-avatar">
                                    <AppIcon intent="staff" size="sm" />
                                  </div>
                                  <div class="document-edit-page__context-copy">
                                    <strong>
                                      {selectedStaff.value?.fullName ??
                                        m.fieldStaffUnassigned}
                                    </strong>
                                    <small>
                                      {selectedStaff.value
                                        ? `${selectedStaff.value.employeeCode ?? 'Sin codigo'} - ID ${selectedStaff.value.id}`
                                        : m.noData}
                                    </small>
                                  </div>
                                  <div class="document-edit-page__context-actions">
                                    {selectedStaff.value ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick$={() => {
                                          selectedStaff.value = null;
                                          staffMode.value = 'view';
                                          staffQuery.value = '';
                                          resetFormError$();
                                        }}
                                      >
                                        {m.fieldStaffUnlink}
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick$={() => {
                                          staffMode.value = 'search';
                                        }}
                                      >
                                        {m.fieldStaffAssign}
                                      </Button>
                                    )}
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick$={() => {
                                        staffMode.value = 'search';
                                      }}
                                    >
                                      {m.searchButton}
                                    </Button>
                                  </div>
                                </div>

                                {staffMode.value === 'search' && (
                                  <SearchSelect
                                    query={staffQuery.value}
                                    options={staffOptions.value}
                                    loading={searchingStaff.value}
                                    placeholder={m.fieldStaffPlaceholder}
                                    filterMode="external"
                                    emptyMessage={
                                      shouldSearch(staffQuery.value)
                                        ? m.fieldStaffEmpty
                                        : m.fieldStaffHint
                                    }
                                    onQueryChange$={(query) => {
                                      staffQuery.value = query;
                                    }}
                                    onSelect$={async (option) => {
                                      const found = staffResults.value.find(
                                        (item) =>
                                          item.id === Number(option.value),
                                      );
                                      if (!found) return;
                                      selectedStaff.value = found;
                                      staffMode.value = 'view';
                                      staffQuery.value = '';
                                      staffResults.value = [];
                                      resetFormError$();
                                    }}
                                  />
                                )}
                              </div>
                            </Field>

                            <Field
                              label={m.fieldNotesLabel}
                              optional
                              hint={m.fieldNotesHint}
                            >
                              <div class="document-edit-page__field-stack">
                                <label class="document-edit-page__field-label">
                                  <span>{m.fieldNotesLabel}</span>
                                  {notesChanged.value && (
                                    <span class="document-edit-page__changed-dot" />
                                  )}
                                </label>
                                <Textarea
                                  value={notes.value}
                                  rows={4}
                                  placeholder={m.fieldNotesPlaceholder}
                                  onInput$={(event) => {
                                    notes.value = (
                                      event.target as HTMLTextAreaElement
                                    ).value;
                                    resetFormError$();
                                  }}
                                />
                              </div>
                            </Field>
                          </div>
                        </Panel>

                        {!hasChanges.value && (
                          <div class="document-edit-page__hint-card">
                            <AppIcon intent="info" size="sm" />
                            <span>{m.noChangesHint}</span>
                          </div>
                        )}

                        <div class="document-edit-page__actions">
                          <Button
                            variant="secondary"
                            onClick$={async () =>
                              await nav(ROUTES.PERSONS_DOCUMENTS)
                            }
                          >
                            {m.cancelButton}
                          </Button>
                          <Button
                            iconLeft="save"
                            loading={saving.value}
                            disabled={saving.value || !hasChanges.value}
                            onClick$={saveChanges$}
                          >
                            {saving.value ? m.savingButton : m.saveButton}
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )}
            </div>
          )}

          {!loading.value &&
            mode.value === 'success' &&
            currentDocument &&
            selectedPerson.value && (
              <EditResult
                eyebrow={m.successEyebrow}
                title={m.successTitle}
                description={m.successDescription}
              >
                <EditResultRow
                  label={m.resultDocumentLabel}
                  value={currentDocument.documentName}
                />
                <EditResultRow
                  label={m.resultFileLabel}
                  value={currentDocument.filePath ?? m.noData}
                />
                <EditResultRow
                  label={m.resultPersonLabel}
                  value={selectedPerson.value.fullName}
                />
                <EditResultRow
                  label={m.resultDeliveryDateLabel}
                  value={formatDateLabel(
                    deliveryDate.value || currentDocument.deliveryDate,
                  )}
                />
                <EditResultRow
                  label={m.resultStudentLabel}
                  value={selectedStudent.value?.fullName ?? m.noData}
                />
                <EditResultRow
                  label={m.resultStaffLabel}
                  value={selectedStaff.value?.fullName ?? m.noData}
                />
                <EditResultRow
                  label={m.resultNotesLabel}
                  value={notes.value || m.noData}
                />

                <div
                  q:slot="actions"
                  class="document-edit-page__result-actions"
                >
                  <Button
                    variant="secondary"
                    onClick$={() => {
                      mode.value = 'idle';
                      error.value = '';
                    }}
                  >
                    {m.successContinueEditing}
                  </Button>
                  <Button
                    iconRight="chevron-right"
                    onClick$={async () => await nav(ROUTES.PERSONS_DOCUMENTS)}
                  >
                    {m.successFinish}
                  </Button>
                </div>
              </EditResult>
            )}
        </div>
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${m.title} | ${appConfig.name}`,
  meta: [
    {
      name: 'description',
      content: m.description,
    },
  ],
};

import {
  $,
  component$,
  useComputed$,
  useSignal,
  useTask$,
} from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { appConfig } from '~/config/app.config';
import { ENV } from '~/config/env';
import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
import { documentService } from '~/services/document/document.service';
import { personService } from '~/services/person/person.service';
import { staffService } from '~/services/staff/staff.service';
import { studentService } from '~/services/student/student.service';
import type { DocumentType } from '~/types/document.types';
import type { PersonListItem } from '~/types/person.types';
import type { StaffSearchResult } from '~/types/staff.types';
import type { StudentSearchResult } from '~/types/student.types';
import {
  ActionHeader,
  Avatar,
  Button,
  DateInput,
  Field,
  FileUpload,
  Input,
  Panel,
  SearchSelect,
  Select,
} from '~/ui';
import { CreateResult, CreateResultRow } from '~/ui/composed/CreateResult';
import { AppIcon } from '~/ui/icons';
import { normalizeError } from '~/utils/api-error';
import './upload.css';

const m = messages.persons.documentsUpload;
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const DEFAULT_PERSON_AVATAR = '/avatars/user-default.svg';
const ALLOWED_EXTENSIONS = ['pdf'] as const;

type SubmissionMode = 'idle' | 'success' | 'error';
type ContextMode = 'none' | 'student' | 'staff';

type UploadSummary = {
  personName: string;
  documentTypeName: string;
  fileName: string;
  contextLabel: string;
  deliveryDate: string;
  notes: string;
};

const emptySummary: UploadSummary = {
  personName: '',
  documentTypeName: '',
  fileName: '',
  contextLabel: '',
  deliveryDate: '',
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

const normalizeSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getFileExtension = (fileName: string): string => {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? '';
};

const formatBytes = (size: number): string => {
  if (!Number.isFinite(size) || size <= 0) return '0 KB';
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
};

export default component$(() => {
  const nav = useNavigate();

  const personQuery = useSignal('');
  const personResults = useSignal<PersonListItem[]>([]);
  const searchingPerson = useSignal(false);
  const selectedPerson = useSignal<PersonListItem | null>(null);
  const personConfirmed = useSignal(false);

  const contextMode = useSignal<ContextMode>('none');
  const contextQuery = useSignal('');
  const studentResults = useSignal<StudentSearchResult[]>([]);
  const staffResults = useSignal<StaffSearchResult[]>([]);
  const searchingContext = useSignal(false);
  const selectedStudent = useSignal<StudentSearchResult | null>(null);
  const selectedStaff = useSignal<StaffSearchResult | null>(null);

  const documentTypes = useSignal<DocumentType[]>([]);
  const loadingDocumentTypes = useSignal(true);
  const loadDocumentTypesError = useSignal('');

  const documentTypeId = useSignal('');
  const deliveryDate = useSignal('');
  const notes = useSignal('');
  const selectedFile = useSignal<File | null>(null);
  const hiddenFileInputRef = useSignal<HTMLInputElement>();

  const saving = useSignal(false);
  const mode = useSignal<SubmissionMode>('idle');
  const submitError = useSignal('');
  const resultWasReplace = useSignal(false);
  const summary = useSignal<UploadSummary>({ ...emptySummary });

  const errorField = useSignal('');
  const errorMessage = useSignal('');

  const currentStep = useComputed$(() => {
    if (mode.value === 'success' || mode.value === 'error') return 3;
    return personConfirmed.value ? 2 : 1;
  });

  useTask$(async () => {
    loadingDocumentTypes.value = true;
    loadDocumentTypesError.value = '';

    try {
      documentTypes.value = await documentService.getDocumentTypes();
    } catch (err) {
      documentTypes.value = [];
      loadDocumentTypesError.value = normalizeError(
        err,
        m.loadDocumentTypesError,
      ).message;
    } finally {
      loadingDocumentTypes.value = false;
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
    const activeMode = track(() => contextMode.value);
    const query = track(() => contextQuery.value.trim());

    studentResults.value = [];
    staffResults.value = [];

    if (activeMode === 'none' || !shouldSearch(query)) {
      searchingContext.value = false;
      return;
    }

    searchingContext.value = true;

    try {
      if (activeMode === 'student') {
        const response = await studentService.findMany({
          searchTerm: query,
          limit: 8,
          page: 1,
        });
        studentResults.value = response.data;
      }

      if (activeMode === 'staff') {
        if (/^\d+$/.test(query)) {
          const item = await staffService.findOne(Number(query));
          staffResults.value = [
            {
              ...item,
              employeeCode: item.employeeCode ?? item.paymentUniqueKey ?? null,
            },
          ];
        } else {
          const response = await staffService.findMany(query, 8, 1);
          staffResults.value = response.data.map((item) => ({
            ...item,
            employeeCode: item.employeeCode ?? item.paymentUniqueKey ?? null,
          }));
        }
      }
    } catch {
      studentResults.value = [];
      staffResults.value = [];
    } finally {
      searchingContext.value = false;
    }
  });

  const personOptions = useComputed$(() =>
    personResults.value.map((person) => ({
      value: String(person.id),
      label: person.fullName,
      description: `${person.curp} - ID ${person.id}`,
    })),
  );

  const contextOptions = useComputed$(() => {
    if (contextMode.value === 'student') {
      return studentResults.value.map((student) => ({
        value: String(student.id),
        label: student.fullName,
        description: `${student.studentCode ?? 'Sin matricula'} - ${student.curp}`,
      }));
    }

    if (contextMode.value === 'staff') {
      return staffResults.value.map((staff) => ({
        value: String(staff.id),
        label: staff.fullName,
        description: `${staff.employeeCode ?? 'Sin codigo'} - ${staff.curp}`,
      }));
    }

    return [];
  });

  const documentTypeOptions = useComputed$(() =>
    documentTypes.value.map((documentType) => ({
      value: String(documentType.id),
      label: documentType.name,
    })),
  );

  const selectedDocumentType = useComputed$(
    () =>
      documentTypes.value.find(
        (documentType) => String(documentType.id) === documentTypeId.value,
      ) ?? null,
  );

  const generatedFileName = useComputed$(() => {
    if (
      !selectedPerson.value?.curp ||
      !selectedDocumentType.value?.name ||
      !selectedFile.value
    ) {
      return '';
    }

    const extension = getFileExtension(selectedFile.value.name);
    if (!extension) return '';

    return `${selectedPerson.value.curp}-${normalizeSlug(selectedDocumentType.value.name)}.${extension}`;
  });

  const contextSummary = useComputed$(() => {
    if (contextMode.value === 'student' && selectedStudent.value) {
      return `Estudiante - ${selectedStudent.value.fullName}`;
    }

    if (contextMode.value === 'staff' && selectedStaff.value) {
      return `Personal - ${selectedStaff.value.fullName}`;
    }

    return m.contextNoneTitle;
  });

  const fileItems = useComputed$(() =>
    selectedFile.value
      ? [
          {
            id: selectedFile.value.name,
            name: selectedFile.value.name,
            sizeLabel: formatBytes(selectedFile.value.size),
            status: 'ready' as const,
          },
        ]
      : [],
  );

  const canSubmit = useComputed$(
    () =>
      Boolean(selectedPerson.value) &&
      personConfirmed.value &&
      Boolean(documentTypeId.value) &&
      Boolean(selectedFile.value) &&
      (contextMode.value === 'none' ||
        (contextMode.value === 'student' && Boolean(selectedStudent.value)) ||
        (contextMode.value === 'staff' && Boolean(selectedStaff.value))) &&
      !saving.value,
  );

  const clearValidation$ = $(() => {
    errorField.value = '';
    errorMessage.value = '';
  });

  const clearContextSelection$ = $(() => {
    contextQuery.value = '';
    studentResults.value = [];
    staffResults.value = [];
    selectedStudent.value = null;
    selectedStaff.value = null;
  });

  const setContextMode$ = $((nextMode: ContextMode) => {
    contextMode.value = nextMode;
    clearContextSelection$();
    if (errorField.value === 'context') {
      clearValidation$();
    }
  });

  const resetEntireFlow$ = $(() => {
    personQuery.value = '';
    personResults.value = [];
    selectedPerson.value = null;
    personConfirmed.value = false;
    contextMode.value = 'none';
    clearContextSelection$();
    documentTypeId.value = '';
    deliveryDate.value = '';
    notes.value = '';
    selectedFile.value = null;
    if (hiddenFileInputRef.value) {
      hiddenFileInputRef.value.value = '';
    }
    clearValidation$();
    mode.value = 'idle';
    submitError.value = '';
    resultWasReplace.value = false;
    summary.value = { ...emptySummary };
  });

  const goToStepTwo$ = $(() => {
    if (!selectedPerson.value) {
      errorField.value = 'person';
      errorMessage.value = m.errorPersonRequired;
      return;
    }

    personConfirmed.value = true;
    clearValidation$();
  });

  const validateFile$ = $((file: File | null) => {
    if (!file) {
      selectedFile.value = null;
      errorField.value = 'file';
      errorMessage.value = m.errorFileRequired;
      return false;
    }

    const extension = getFileExtension(file.name);
    if (
      !ALLOWED_EXTENSIONS.includes(
        extension as (typeof ALLOWED_EXTENSIONS)[number],
      )
    ) {
      selectedFile.value = null;
      errorField.value = 'file';
      errorMessage.value = m.errorFileInvalidType;
      return false;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      selectedFile.value = null;
      errorField.value = 'file';
      errorMessage.value = m.errorFileTooLarge;
      return false;
    }

    selectedFile.value = file;
    if (errorField.value === 'file') {
      clearValidation$();
    }
    return true;
  });

  const submit$ = $(async () => {
    clearValidation$();
    submitError.value = '';

    if (!selectedPerson.value) {
      errorField.value = 'person';
      errorMessage.value = m.errorPersonRequired;
      return;
    }

    if (!personConfirmed.value) {
      errorField.value = 'person';
      errorMessage.value = m.errorPersonRequired;
      return;
    }

    if (
      (contextMode.value === 'student' && !selectedStudent.value) ||
      (contextMode.value === 'staff' && !selectedStaff.value)
    ) {
      errorField.value = 'context';
      errorMessage.value =
        contextMode.value === 'student'
          ? m.errorStudentContextRequired
          : m.errorStaffContextRequired;
      return;
    }

    if (!documentTypeId.value) {
      errorField.value = 'documentType';
      errorMessage.value = m.errorDocumentTypeRequired;
      return;
    }

    if (!selectedFile.value) {
      errorField.value = 'file';
      errorMessage.value = m.errorFileRequired;
      return;
    }

    saving.value = true;

    try {
      const response = await documentService.upload({
        personId: selectedPerson.value.id,
        documentTypeId: Number(documentTypeId.value),
        file: selectedFile.value,
        ...(contextMode.value === 'student' && selectedStudent.value
          ? { studentId: selectedStudent.value.id }
          : {}),
        ...(contextMode.value === 'staff' && selectedStaff.value
          ? { staffId: selectedStaff.value.id }
          : {}),
        ...(deliveryDate.value ? { deliveryDate: deliveryDate.value } : {}),
        ...(notes.value.trim() ? { notes: notes.value.trim() } : {}),
      });

      const backendMessage = response.message?.toLowerCase() ?? '';
      resultWasReplace.value = backendMessage.includes('reemplaz');
      summary.value = {
        personName: selectedPerson.value.fullName,
        documentTypeName: selectedDocumentType.value?.name ?? '',
        fileName: generatedFileName.value || selectedFile.value.name,
        contextLabel: contextSummary.value,
        deliveryDate: deliveryDate.value,
        notes: notes.value.trim(),
      };
      mode.value = 'success';
    } catch (err) {
      submitError.value = normalizeError(err, m.saveErrorFallback).message;
      mode.value = 'error';
    } finally {
      saving.value = false;
    }
  });

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

      <div q:slot="toolbar" class="upload-person-document-steps">
        <div class="upload-person-document-step">
          <div
            class={[
              'upload-person-document-step__num',
              currentStep.value === 1
                ? 'is-active'
                : currentStep.value > 1
                  ? 'is-done'
                  : 'is-pending',
            ]}
          >
            {currentStep.value > 1 ? <AppIcon intent="check" size="xs" /> : '1'}
          </div>
          <div class="upload-person-document-step__copy">
            <span>{m.step1Eyebrow}</span>
            <strong>{m.step1Label}</strong>
          </div>
        </div>
        <div
          class={[
            'upload-person-document-step__connector',
            currentStep.value > 1 ? 'is-done' : '',
          ]}
        />
        <div class="upload-person-document-step">
          <div
            class={[
              'upload-person-document-step__num',
              currentStep.value === 2
                ? 'is-active'
                : currentStep.value > 2
                  ? 'is-done'
                  : 'is-pending',
            ]}
          >
            {currentStep.value > 2 ? <AppIcon intent="check" size="xs" /> : '2'}
          </div>
          <div class="upload-person-document-step__copy">
            <span>{m.step2Eyebrow}</span>
            <strong>{m.step2Label}</strong>
          </div>
        </div>
        <div
          class={[
            'upload-person-document-step__connector',
            currentStep.value > 2 ? 'is-done' : '',
          ]}
        />
        <div class="upload-person-document-step">
          <div
            class={[
              'upload-person-document-step__num',
              currentStep.value === 3 ? 'is-active' : 'is-pending',
            ]}
          >
            3
          </div>
          <div class="upload-person-document-step__copy">
            <span>{m.step3Eyebrow}</span>
            <strong>{m.step3Label}</strong>
          </div>
        </div>
      </div>

      <div class="upload-person-document-page">
        <div class="upload-person-document-page__content">
          {mode.value === 'success' ? (
            <CreateResult
              eyebrow={
                resultWasReplace.value
                  ? m.successReplaceEyebrow
                  : m.successEyebrow
              }
              title={
                resultWasReplace.value ? m.successReplaceTitle : m.successTitle
              }
              description={
                resultWasReplace.value
                  ? m.successReplaceDescription
                  : m.successDescription
              }
            >
              <CreateResultRow
                label={m.resultPersonLabel}
                value={summary.value.personName}
              />
              <CreateResultRow
                label={m.resultTypeLabel}
                value={summary.value.documentTypeName}
              />
              <CreateResultRow
                label={m.resultFileLabel}
                value={summary.value.fileName}
              />
              <CreateResultRow
                label={m.resultContextLabel}
                value={summary.value.contextLabel}
              />
              <CreateResultRow
                label={m.resultDateLabel}
                value={summary.value.deliveryDate}
                fallback="Sin fecha"
              />
              <CreateResultRow
                label={m.resultNotesLabel}
                value={summary.value.notes}
                fallback="Sin notas"
              />

              <div q:slot="actions">
                <Button variant="secondary" onClick$={resetEntireFlow$}>
                  {m.successCreateAnother}
                </Button>
                <Button
                  iconRight="chevron-right"
                  onClick$={async () => await nav(ROUTES.PERSONS_DOCUMENTS)}
                >
                  {m.successFinish}
                </Button>
              </div>
            </CreateResult>
          ) : mode.value === 'error' ? (
            <CreateResult
              tone="error"
              eyebrow={m.errorEyebrow}
              title={m.errorTitle}
              description={submitError.value || m.errorDescription}
              onRetry$={submit$}
              retryLabel={m.errorRetry}
            >
              <div q:slot="actions">
                <Button
                  variant="secondary"
                  onClick$={() => (mode.value = 'idle')}
                >
                  {m.errorBackToForm}
                </Button>
              </div>
            </CreateResult>
          ) : currentStep.value === 1 ? (
            <div class="upload-person-document-step-shell">
              <Panel
                title={m.searchPanelTitle}
                description={m.searchPanelDescription}
              >
                <Field
                  label={m.personSearchLabel}
                  required
                  hint={m.personSearchHint}
                  error={
                    errorField.value === 'person'
                      ? errorMessage.value
                      : undefined
                  }
                >
                  <SearchSelect
                    query={personQuery.value}
                    options={personOptions.value}
                    loading={searchingPerson.value}
                    placeholder={m.personSearchPlaceholder}
                    filterMode="external"
                    emptyMessage={
                      shouldSearch(personQuery.value)
                        ? m.personNoResults
                        : m.personSearchHint
                    }
                    invalid={errorField.value === 'person'}
                    onQueryChange$={(query) => {
                      personQuery.value = query;
                      if (errorField.value === 'person') {
                        clearValidation$();
                      }
                    }}
                    onSelect$={(option) => {
                      const person = personResults.value.find(
                        (item) => item.id === Number(option.value),
                      );
                      if (!person) return;
                      selectedPerson.value = person;
                      personConfirmed.value = false;
                      personQuery.value = '';
                      personResults.value = [];
                      clearValidation$();
                    }}
                  />
                </Field>
              </Panel>

              {selectedPerson.value && (
                <div class="upload-person-document-person-found">
                  <Avatar
                    src={resolvePhotoUrl(selectedPerson.value.photoUrl)}
                    name={selectedPerson.value.fullName}
                    size="lg"
                  />
                  <div class="upload-person-document-person-found__info">
                    <strong>{selectedPerson.value.fullName}</strong>
                    <div class="upload-person-document-person-found__meta">
                      <span>{selectedPerson.value.curp}</span>
                      <span>ID {selectedPerson.value.id}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    iconLeft="edit"
                    onClick$={() => {
                      selectedPerson.value = null;
                      personConfirmed.value = false;
                      personQuery.value = '';
                      personResults.value = [];
                    }}
                  >
                    {m.personChangeButton}
                  </Button>
                </div>
              )}

              <div class="upload-person-document-step-actions">
                <Button
                  iconRight="chevron-right"
                  disabled={!selectedPerson.value}
                  onClick$={goToStepTwo$}
                >
                  {m.continueButton}
                </Button>
              </div>
            </div>
          ) : (
            <div class="upload-person-document-layout">
              <Panel
                title={m.selectedPersonPanelTitle}
                description={m.selectedPersonPanelDescription}
              >
                <div q:slot="leading" class="upload-person-document-panel-icon">
                  <AppIcon intent="person" size="md" />
                </div>
                <div class="upload-person-document-person-card">
                  <Avatar
                    src={resolvePhotoUrl(selectedPerson.value?.photoUrl)}
                    name={selectedPerson.value?.fullName ?? ''}
                    size="lg"
                  />
                  <div class="upload-person-document-person-card__info">
                    <strong>{selectedPerson.value?.fullName}</strong>
                    <span>{selectedPerson.value?.curp}</span>
                    <small>ID {selectedPerson.value?.id}</small>
                  </div>
                  <Button
                    variant="ghost"
                    iconLeft="edit"
                    onClick$={() => {
                      personConfirmed.value = false;
                      contextMode.value = 'none';
                      clearContextSelection$();
                    }}
                  >
                    {m.personChangeButton}
                  </Button>
                </div>
              </Panel>

              <Panel
                title={m.contextPanelTitle}
                description={m.contextPanelDescription}
                density="compact"
              >
                <div
                  q:slot="leading"
                  class="upload-person-document-panel-icon upload-person-document-panel-icon--context"
                >
                  <AppIcon intent="group" size="md" />
                </div>

                <div class="upload-person-document-form">
                  <div class="upload-person-document-context-row">
                    <button
                      type="button"
                      class={[
                        'upload-person-document-context-btn',
                        contextMode.value === 'none' ? 'is-active' : '',
                      ]}
                      onClick$={() => setContextMode$('none')}
                    >
                      <span class="upload-person-document-context-btn__icon">
                        <AppIcon intent="person" size="sm" />
                      </span>
                      <span class="upload-person-document-context-btn__copy">
                        <strong>{m.contextNoneTitle}</strong>
                        <small>{m.contextNoneDescription}</small>
                      </span>
                    </button>

                    <button
                      type="button"
                      class={[
                        'upload-person-document-context-btn',
                        contextMode.value === 'student' ? 'is-active' : '',
                      ]}
                      onClick$={() => setContextMode$('student')}
                    >
                      <span class="upload-person-document-context-btn__icon">
                        <AppIcon intent="student" size="sm" />
                      </span>
                      <span class="upload-person-document-context-btn__copy">
                        <strong>{m.contextStudentTitle}</strong>
                        <small>{m.contextStudentDescription}</small>
                      </span>
                    </button>

                    <button
                      type="button"
                      class={[
                        'upload-person-document-context-btn',
                        contextMode.value === 'staff' ? 'is-active' : '',
                      ]}
                      onClick$={() => setContextMode$('staff')}
                    >
                      <span class="upload-person-document-context-btn__icon">
                        <AppIcon intent="staff" size="sm" />
                      </span>
                      <span class="upload-person-document-context-btn__copy">
                        <strong>{m.contextStaffTitle}</strong>
                        <small>{m.contextStaffDescription}</small>
                      </span>
                    </button>
                  </div>

                  {contextMode.value !== 'none' && (
                    <Field
                      label={
                        contextMode.value === 'student'
                          ? m.studentSearchLabel
                          : m.staffSearchLabel
                      }
                      optional
                      hint={
                        errorField.value === 'context'
                          ? errorMessage.value
                          : contextMode.value === 'student'
                            ? m.studentSearchHint
                            : m.staffSearchHint
                      }
                      error={
                        errorField.value === 'context'
                          ? errorMessage.value
                          : undefined
                      }
                    >
                      <SearchSelect
                        query={contextQuery.value}
                        options={contextOptions.value}
                        loading={searchingContext.value}
                        placeholder={
                          contextMode.value === 'student'
                            ? m.studentSearchPlaceholder
                            : m.staffSearchPlaceholder
                        }
                        filterMode="external"
                        emptyMessage={
                          shouldSearch(contextQuery.value)
                            ? contextMode.value === 'student'
                              ? m.studentNoResults
                              : m.staffNoResults
                            : contextMode.value === 'student'
                              ? m.studentSearchHint
                              : m.staffSearchHint
                        }
                        invalid={errorField.value === 'context'}
                        onQueryChange$={(query) => {
                          contextQuery.value = query;
                          if (errorField.value === 'context') {
                            clearValidation$();
                          }
                        }}
                        onSelect$={(option) => {
                          if (contextMode.value === 'student') {
                            const student = studentResults.value.find(
                              (item) => item.id === Number(option.value),
                            );
                            if (!student) return;
                            selectedStudent.value = student;
                          }

                          if (contextMode.value === 'staff') {
                            const staff = staffResults.value.find(
                              (item) => item.id === Number(option.value),
                            );
                            if (!staff) return;
                            selectedStaff.value = staff;
                          }

                          contextQuery.value = '';
                          studentResults.value = [];
                          staffResults.value = [];
                          clearValidation$();
                        }}
                        onClear$={() => {
                          selectedStudent.value = null;
                          selectedStaff.value = null;
                        }}
                      />
                    </Field>
                  )}

                  {contextMode.value === 'student' && selectedStudent.value && (
                    <div class="upload-person-document-context-found">
                      <span class="upload-person-document-context-found__icon">
                        <AppIcon intent="student" size="sm" />
                      </span>
                      <div class="upload-person-document-context-found__copy">
                        <strong>{selectedStudent.value.fullName}</strong>
                        <span>
                          {selectedStudent.value.studentCode ?? 'Sin matricula'}{' '}
                          - {selectedStudent.value.curp}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        iconLeft="close"
                        onClick$={() => {
                          selectedStudent.value = null;
                          contextQuery.value = '';
                        }}
                      >
                        {m.studentChangeButton}
                      </Button>
                    </div>
                  )}

                  {contextMode.value === 'staff' && selectedStaff.value && (
                    <div class="upload-person-document-context-found">
                      <span class="upload-person-document-context-found__icon">
                        <AppIcon intent="staff" size="sm" />
                      </span>
                      <div class="upload-person-document-context-found__copy">
                        <strong>{selectedStaff.value.fullName}</strong>
                        <span>
                          {selectedStaff.value.employeeCode ?? 'Sin codigo'} -{' '}
                          {selectedStaff.value.curp}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        iconLeft="close"
                        onClick$={() => {
                          selectedStaff.value = null;
                          contextQuery.value = '';
                        }}
                      >
                        {m.staffChangeButton}
                      </Button>
                    </div>
                  )}
                </div>
              </Panel>

              <Panel
                title={m.documentPanelTitle}
                description={m.documentPanelDescription}
                density="compact"
              >
                <div q:slot="leading" class="upload-person-document-panel-icon">
                  <AppIcon intent="upload" size="md" />
                </div>

                <div class="upload-person-document-form">
                  {generatedFileName.value && (
                    <div class="upload-person-document-filename">
                      <span class="upload-person-document-filename__label">
                        {m.generatedNameLabel}
                      </span>
                      <span class="upload-person-document-filename__value">
                        {generatedFileName.value}
                      </span>
                    </div>
                  )}

                  <div class="upload-person-document-grid upload-person-document-grid--pair">
                    <Field
                      label={m.fieldDocumentTypeLabel}
                      required
                      error={
                        errorField.value === 'documentType'
                          ? errorMessage.value
                          : undefined
                      }
                    >
                      <Select
                        name="document-type"
                        value={documentTypeId.value}
                        placeholder={m.fieldDocumentTypePlaceholder}
                        options={documentTypeOptions.value}
                        disabled={
                          loadingDocumentTypes.value ||
                          documentTypeOptions.value.length === 0
                        }
                        invalid={errorField.value === 'documentType'}
                        onChange$={(value) => {
                          documentTypeId.value = value;
                          if (errorField.value === 'documentType') {
                            clearValidation$();
                          }
                        }}
                      />
                    </Field>

                    <Field label={m.fieldDeliveryDateLabel} optional>
                      <DateInput
                        value={deliveryDate.value}
                        onInput$={(event) => {
                          deliveryDate.value = (
                            event.target as HTMLInputElement
                          ).value;
                        }}
                      />
                    </Field>
                  </div>

                  <Field label={m.fieldNotesLabel} optional>
                    <Input
                      type="text"
                      value={notes.value}
                      placeholder={m.fieldNotesPlaceholder}
                      onInput$={(event) => {
                        notes.value = (event.target as HTMLInputElement).value;
                      }}
                    />
                  </Field>

                  <div class="upload-person-document-replace-banner">
                    <span class="upload-person-document-replace-banner__icon">
                      <AppIcon intent="warning" size="sm" />
                    </span>
                    <div>
                      <strong>{m.replaceTitle}</strong>
                      <span>{m.replaceDescription}</span>
                    </div>
                  </div>

                  {loadDocumentTypesError.value && (
                    <div
                      class="upload-person-document-inline-error"
                      role="alert"
                    >
                      {loadDocumentTypesError.value}
                    </div>
                  )}

                  <Field
                    label={m.uploadLabel}
                    required
                    hint={m.uploadHelpText}
                    error={
                      errorField.value === 'file'
                        ? errorMessage.value
                        : undefined
                    }
                  >
                    <input
                      ref={hiddenFileInputRef}
                      type="file"
                      class="upload-person-document-file-input"
                      accept={ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(
                        ',',
                      )}
                      onChange$={(event) => {
                        const file =
                          (event.target as HTMLInputElement).files?.[0] ?? null;
                        validateFile$(file);
                      }}
                    />
                    <FileUpload
                      label={m.uploadLabel}
                      description={m.uploadDescription}
                      accept="PDF"
                      maxSizeLabel={m.uploadMaxSize}
                      files={fileItems.value}
                      invalid={errorField.value === 'file'}
                      error={
                        errorField.value === 'file'
                          ? errorMessage.value
                          : undefined
                      }
                      onBrowse$={() => hiddenFileInputRef.value?.click()}
                      onRemove$={() => {
                        selectedFile.value = null;
                        if (hiddenFileInputRef.value) {
                          hiddenFileInputRef.value.value = '';
                        }
                        if (errorField.value === 'file') {
                          clearValidation$();
                        }
                      }}
                    />
                  </Field>
                </div>
              </Panel>

              <div class="upload-person-document-actions">
                <Button
                  variant="secondary"
                  onClick$={async () => await nav(ROUTES.PERSONS_DOCUMENTS)}
                >
                  {m.cancelButton}
                </Button>
                <Button
                  iconLeft="upload"
                  loading={saving.value}
                  disabled={!canSubmit.value}
                  onClick$={submit$}
                >
                  {saving.value ? m.savingButton : m.saveButton}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Subir documento`,
};

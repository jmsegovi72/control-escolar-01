import {
  $,
  component$,
  useComputed$,
  useSignal,
  useTask$,
  useVisibleTask$,
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
import type {
  BulkUploadItemStatus,
  DocumentType,
} from '~/types/document.types';
import type { PersonListItem } from '~/types/person.types';
import type { StaffSearchResult } from '~/types/staff.types';
import type { StudentSearchResult } from '~/types/student.types';
import {
  ActionHeader,
  Avatar,
  Badge,
  Button,
  DateInput,
  Field,
  Input,
  Panel,
  SearchSelect,
  Select,
  StepIndicator,
} from '~/ui';
import { CreateResult, CreateResultRow } from '~/ui/composed/CreateResult';
import { AppIcon } from '~/ui/icons';
import { normalizeError } from '~/utils/api-error';
import './bulk-upload.css';

const m = messages.persons.documentsBulkUpload;
const DEFAULT_PERSON_AVATAR = '/avatars/user-default.svg';
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'csv',
  'zip',
  'rar',
  'json',
  'xml',
] as const;

type SubmissionMode = 'idle' | 'success' | 'error';
type RowContextMode = 'none' | 'student' | 'staff';
type DraftDocumentStatus = 'idle' | 'ready' | BulkUploadItemStatus;

type DraftDocumentRow = {
  id: number;
  documentTypeId: string;
  notes: string;
  file: File | null;
  status: DraftDocumentStatus;
  message: string;
  contextMode: RowContextMode;
  contextQuery: string;
  searchingContext: boolean;
  studentResults: StudentSearchResult[];
  staffResults: StaffSearchResult[];
  selectedStudent: StudentSearchResult | null;
  selectedStaff: StaffSearchResult | null;
};

type BulkSummaryItem = {
  id: number;
  documentTypeName: string;
  fileName: string;
  contextLabel: string;
  status: BulkUploadItemStatus;
  message: string;
};

type BulkSummary = {
  personName: string;
  deliveryDateLabel: string;
  total: number;
  created: number;
  replaced: number;
  failed: number;
  items: BulkSummaryItem[];
};

const createEmptyRow = (id: number): DraftDocumentRow => ({
  id,
  documentTypeId: '',
  notes: '',
  file: null,
  status: 'idle',
  message: '',
  contextMode: 'none',
  contextQuery: '',
  searchingContext: false,
  studentResults: [],
  staffResults: [],
  selectedStudent: null,
  selectedStaff: null,
});

const emptySummary: BulkSummary = {
  personName: '',
  deliveryDateLabel: '',
  total: 0,
  created: 0,
  replaced: 0,
  failed: 0,
  items: [],
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

const getFileExtension = (fileName: string): string => {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? '';
};

const formatBytes = (size: number): string => {
  if (!Number.isFinite(size) || size <= 0) return '0 KB';
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
};

const formatDeliveryDate = (value: string): string => {
  if (!value) return 'Hoy';

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const getStatusTone = (status: DraftDocumentStatus) => {
  switch (status) {
    case 'created':
    case 'replaced':
      return 'success' as const;
    case 'error':
      return 'danger' as const;
    case 'ready':
      return 'primary' as const;
    default:
      return 'neutral' as const;
  }
};

const getStatusLabel = (
  status: DraftDocumentStatus,
  hasFile: boolean,
): string => {
  switch (status) {
    case 'created':
      return m.itemStatusCreated;
    case 'replaced':
      return m.itemStatusReplaced;
    case 'error':
      return m.itemStatusError;
    case 'ready':
      return 'Listo';
    default:
      return hasFile ? 'Listo' : 'Pendiente';
  }
};

const getRowContextLabel = (row: DraftDocumentRow): string => {
  if (row.contextMode === 'student' && row.selectedStudent) {
    return `Estudiante - ${row.selectedStudent.fullName}`;
  }

  if (row.contextMode === 'staff' && row.selectedStaff) {
    return `Personal - ${row.selectedStaff.fullName}`;
  }

  return m.rowContextNoneTitle;
};

export default component$(() => {
  const nav = useNavigate();

  const personQuery = useSignal('');
  const personResults = useSignal<PersonListItem[]>([]);
  const searchingPerson = useSignal(false);
  const selectedPerson = useSignal<PersonListItem | null>(null);

  const documentTypes = useSignal<DocumentType[]>([]);
  const loadingDocumentTypes = useSignal(false);
  const loadDocumentTypesError = useSignal('');

  const deliveryDate = useSignal('');
  const rows = useSignal<DraftDocumentRow[]>([createEmptyRow(1)]);
  const nextRowId = useSignal(2);

  const saving = useSignal(false);
  const mode = useSignal<SubmissionMode>('idle');
  const submitError = useSignal('');
  const formError = useSignal('');
  const summary = useSignal<BulkSummary>({ ...emptySummary });

  const currentStep = useComputed$(() => {
    if (mode.value === 'success' || mode.value === 'error') return 3;
    return selectedPerson.value ? 2 : 1;
  });

  const stepTone = useComputed$(() => {
    if (mode.value === 'error') return 'error' as const;
    if (mode.value === 'success') {
      return summary.value.failed > 0
        ? ('error' as const)
        : ('success' as const);
    }
    return undefined;
  });

  const personOptions = useComputed$(() =>
    personResults.value.map((person) => ({
      value: String(person.id),
      label: person.fullName,
      description: `${person.curp} - ID ${person.id}`,
    })),
  );

  const duplicateTypeIds = useComputed$(() => {
    const seen = new Set<string>();
    const duplicated = new Set<string>();

    rows.value.forEach((row) => {
      if (!row.documentTypeId) return;
      if (seen.has(row.documentTypeId)) {
        duplicated.add(row.documentTypeId);
        return;
      }
      seen.add(row.documentTypeId);
    });

    return duplicated;
  });

  const allTypesUsed = useComputed$(() => {
    const selectedTypes = rows.value.filter((row) => row.documentTypeId).length;
    return (
      documentTypes.value.length > 0 &&
      selectedTypes >= documentTypes.value.length
    );
  });

  const hasIncompleteContext = useComputed$(() =>
    rows.value.some(
      (row) =>
        (row.contextMode === 'student' && !row.selectedStudent) ||
        (row.contextMode === 'staff' && !row.selectedStaff),
    ),
  );

  const getTypeOptionsForRow = (rowId: number) => {
    const usedByOthers = new Set(
      rows.value
        .filter((row) => row.id !== rowId && row.documentTypeId)
        .map((row) => row.documentTypeId),
    );

    return documentTypes.value.map((documentType) => ({
      value: String(documentType.id),
      label: documentType.name,
      disabled: usedByOthers.has(String(documentType.id)),
    }));
  };

  const getContextOptionsForRow = (row: DraftDocumentRow) => {
    if (row.contextMode === 'student') {
      return row.studentResults.map((student) => ({
        value: String(student.id),
        label: student.fullName,
        description: `${student.studentCode ?? 'Sin matricula'} - ${student.curp}`,
      }));
    }

    if (row.contextMode === 'staff') {
      return row.staffResults.map((staff) => ({
        value: String(staff.id),
        label: staff.fullName,
        description: `${staff.employeeCode ?? 'Sin codigo'} - ${staff.curp}`,
      }));
    }

    return [];
  };

  const loadDocumentTypes$ = $(async () => {
    loadingDocumentTypes.value = true;
    loadDocumentTypesError.value = '';

    try {
      documentTypes.value = await documentService.getDocumentTypes();
      if (documentTypes.value.length === 0) {
        loadDocumentTypesError.value = m.loadDocumentTypesEmpty;
      }
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

  useVisibleTask$(({ track }) => {
    track(() => selectedPerson.value?.id);

    if (documentTypes.value.length > 0) {
      return;
    }

    loadDocumentTypes$();
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

  const updateRow$ = $(
    (rowId: number, updater: (row: DraftDocumentRow) => DraftDocumentRow) => {
      rows.value = rows.value.map((row) =>
        row.id === rowId ? updater(row) : row,
      );
    },
  );

  const clearFormErrors$ = $(() => {
    formError.value = '';
    submitError.value = '';
  });

  const setRowContextMode$ = $((rowId: number, nextMode: RowContextMode) => {
    updateRow$(rowId, (row) => ({
      ...row,
      contextMode: nextMode,
      contextQuery: '',
      searchingContext: false,
      studentResults: [],
      staffResults: [],
      selectedStudent: null,
      selectedStaff: null,
    }));
    clearFormErrors$();
  });

  const addRow$ = $(() => {
    rows.value = [...rows.value, createEmptyRow(nextRowId.value)];
    nextRowId.value += 1;
    clearFormErrors$();
  });

  const clearRows$ = $(() => {
    rows.value = [createEmptyRow(1)];
    nextRowId.value = 2;
    clearFormErrors$();
  });

  const removeRow$ = $((rowId: number) => {
    if (rows.value.length === 1) {
      rows.value = [createEmptyRow(rowId)];
      clearFormErrors$();
      return;
    }

    rows.value = rows.value.filter((row) => row.id !== rowId);
    clearFormErrors$();
  });

  const validateFile$ = $((file: File | null): string => {
    if (!file) return m.errorRowFileRequired;

    const extension = getFileExtension(file.name);
    if (
      !ALLOWED_EXTENSIONS.includes(
        extension as (typeof ALLOWED_EXTENSIONS)[number],
      )
    ) {
      return m.errorRowFileInvalidType;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return m.errorRowFileTooLarge;
    }

    return '';
  });

  const assignFileToRow$ = $(async (rowId: number, file: File | null) => {
    const validationMessage = await validateFile$(file);

    updateRow$(rowId, (row) => {
      if (validationMessage) {
        return {
          ...row,
          file: null,
          status: 'error',
          message: validationMessage,
        };
      }

      return {
        ...row,
        file,
        status: file ? 'ready' : 'idle',
        message: file ? formatBytes(file.size) : '',
      };
    });

    clearFormErrors$();
  });

  const searchRowContext$ = $(async (rowId: number, rawQuery: string) => {
    const query = rawQuery.trim();

    updateRow$(rowId, (row) => ({
      ...row,
      contextQuery: rawQuery,
      selectedStudent: null,
      selectedStaff: null,
    }));

    if (!shouldSearch(query)) {
      updateRow$(rowId, (row) => ({
        ...row,
        studentResults: [],
        staffResults: [],
        searchingContext: false,
      }));
      return;
    }

    const personId = selectedPerson.value?.id;

    updateRow$(rowId, (row) => ({
      ...row,
      searchingContext: true,
      studentResults: row.contextMode === 'student' ? row.studentResults : [],
      staffResults: row.contextMode === 'staff' ? row.staffResults : [],
    }));

    try {
      const currentRow = rows.value.find((item) => item.id === rowId);
      if (!currentRow) return;

      if (currentRow.contextMode === 'student') {
        const response = await studentService.findMany({
          searchTerm: query,
          limit: 8,
          page: 1,
        });

        const results = response.data.filter(
          (item) =>
            !personId ||
            item.personId === undefined ||
            item.personId === personId,
        );

        updateRow$(rowId, (row) => ({
          ...row,
          studentResults: results,
          staffResults: [],
          searchingContext: false,
        }));
      }

      if (currentRow.contextMode === 'staff') {
        const response = /^\d+$/.test(query)
          ? {
              data: [await staffService.findOne(Number(query))],
            }
          : await staffService.findMany(query, 8, 1);

        const results = response.data
          .map((item) => ({
            ...item,
            employeeCode: item.employeeCode ?? item.paymentUniqueKey ?? null,
          }))
          .filter(
            (item) =>
              !personId ||
              item.personId === undefined ||
              item.personId === null ||
              item.personId === personId,
          );

        updateRow$(rowId, (row) => ({
          ...row,
          staffResults: results,
          studentResults: [],
          searchingContext: false,
        }));
      }
    } catch {
      updateRow$(rowId, (row) => ({
        ...row,
        studentResults: [],
        staffResults: [],
        searchingContext: false,
      }));
    }
  });

  const selectStudentForRow$ = $((rowId: number, studentId: number) => {
    updateRow$(rowId, (row) => {
      const selected =
        row.studentResults.find((item) => item.id === studentId) ?? null;
      return {
        ...row,
        selectedStudent: selected,
        selectedStaff: null,
        contextQuery: '',
      };
    });
    clearFormErrors$();
  });

  const selectStaffForRow$ = $((rowId: number, staffId: number) => {
    updateRow$(rowId, (row) => {
      const selected =
        row.staffResults.find((item) => item.id === staffId) ?? null;
      return {
        ...row,
        selectedStaff: selected,
        selectedStudent: null,
        contextQuery: '',
      };
    });
    clearFormErrors$();
  });

  const resetForSamePerson$ = $(() => {
    deliveryDate.value = '';
    clearRows$();
    mode.value = 'idle';
    summary.value = { ...emptySummary };
  });

  const retryFailedRows$ = $(() => {
    const failedRows = rows.value
      .filter((row) => row.status === 'error')
      .map((row) => ({
        ...row,
        status: row.file ? ('ready' as const) : ('idle' as const),
        message: row.file ? formatBytes(row.file.size) : '',
      }));

    rows.value = failedRows.length > 0 ? failedRows : [createEmptyRow(1)];
    nextRowId.value =
      (rows.value.reduce((max, row) => Math.max(max, row.id), 0) || 0) + 1;
    mode.value = 'idle';
    summary.value = { ...emptySummary };
    submitError.value = '';
  });

  const submitBulk$ = $(async () => {
    clearFormErrors$();

    if (!selectedPerson.value) {
      formError.value = m.errorPersonRequired;
      return;
    }

    if (rows.value.length === 0) {
      formError.value = m.errorRowsRequired;
      return;
    }

    if (duplicateTypeIds.value.size > 0) {
      formError.value = m.errorDuplicateTypes;
      return;
    }

    if (hasIncompleteContext.value) {
      formError.value = m.errorRowContextIncomplete;
      return;
    }

    const invalidContextRow = rows.value.some(
      (row) =>
        (row.contextMode === 'student' && row.selectedStaff) ||
        (row.contextMode === 'staff' && row.selectedStudent),
    );
    if (invalidContextRow) {
      formError.value = m.errorRowContextDuplicated;
      return;
    }

    const missingType = rows.value.some((row) => !row.documentTypeId);
    if (missingType) {
      formError.value = m.errorRowTypeRequired;
      return;
    }

    const missingFile = rows.value.some((row) => !row.file);
    if (missingFile) {
      formError.value = m.errorRowFileRequired;
      return;
    }

    const invalidFileRow = rows.value.find((row) => row.status === 'error');
    if (invalidFileRow) {
      formError.value = invalidFileRow.message || m.errorRowFileInvalidType;
      return;
    }

    saving.value = true;

    try {
      const results: BulkSummaryItem[] = [];
      let created = 0;
      let replaced = 0;
      let failed = 0;

      for (const row of rows.value) {
        const documentTypeName =
          documentTypes.value.find(
            (documentType) => String(documentType.id) === row.documentTypeId,
          )?.name ?? `#${row.documentTypeId}`;

        try {
          const response = await documentService.upload({
            personId: selectedPerson.value.id,
            documentTypeId: Number(row.documentTypeId),
            file: row.file as File,
            ...(deliveryDate.value ? { deliveryDate: deliveryDate.value } : {}),
            ...(row.notes.trim() ? { notes: row.notes.trim() } : {}),
            ...(row.contextMode === 'student' && row.selectedStudent
              ? { studentId: row.selectedStudent.id }
              : {}),
            ...(row.contextMode === 'staff' && row.selectedStaff
              ? { staffId: row.selectedStaff.id }
              : {}),
          });

          const normalizedMessage = response.message ?? '';
          const wasReplaced = /reemplaz/i.test(normalizedMessage);
          const status = wasReplaced
            ? ('replaced' as const)
            : ('created' as const);

          if (wasReplaced) {
            replaced += 1;
          } else {
            created += 1;
          }

          results.push({
            id: row.id,
            documentTypeName,
            fileName: row.file?.name ?? 'Sin archivo',
            contextLabel: getRowContextLabel(row),
            status,
            message: normalizedMessage || m.itemStatusCreated,
          });
        } catch (err) {
          failed += 1;
          results.push({
            id: row.id,
            documentTypeName,
            fileName: row.file?.name ?? 'Sin archivo',
            contextLabel: getRowContextLabel(row),
            status: 'error',
            message: normalizeError(err, m.saveErrorFallback).message,
          });
        }
      }

      rows.value = rows.value.map((row) => {
        const item = results.find((entry) => entry.id === row.id);
        if (!item) return row;

        return {
          ...row,
          status: item.status,
          message: item.message,
        };
      });

      summary.value = {
        personName: selectedPerson.value.fullName,
        deliveryDateLabel: formatDeliveryDate(deliveryDate.value),
        total: rows.value.length,
        created,
        replaced,
        failed,
        items: results,
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

      <StepIndicator
        q:slot="toolbar"
        steps={[
          { eyebrow: m.step1Eyebrow, label: m.step1Label },
          { eyebrow: m.step2Eyebrow, label: m.step2Label },
          { eyebrow: m.step3Eyebrow, label: m.step3Label },
        ]}
        current={currentStep.value}
        tone={stepTone.value}
      />

      <div class="bulk-person-document-page">
        <div class="bulk-person-document-page__content">
          {mode.value === 'success' ? (
            <CreateResult
              tone={summary.value.failed > 0 ? 'error' : 'success'}
              eyebrow={m.successEyebrow}
              title={m.successTitle}
              description={m.successDescription}
            >
              <CreateResultRow
                label={m.resultPersonLabel}
                value={summary.value.personName}
              />
              <CreateResultRow
                label={m.resultDeliveryDateLabel}
                value={summary.value.deliveryDateLabel}
              />
              <CreateResultRow
                label={m.resultTotalLabel}
                value={String(summary.value.total)}
              />
              <CreateResultRow
                label={m.resultCreatedLabel}
                value={String(summary.value.created)}
              />
              <CreateResultRow
                label={m.resultReplacedLabel}
                value={String(summary.value.replaced)}
              />
              <CreateResultRow
                label={m.resultFailedLabel}
                value={String(summary.value.failed)}
              />

              <div class="bulk-person-document-result-list">
                <div class="bulk-person-document-result-list__title">
                  {m.resultItemsTitle}
                </div>
                {summary.value.items.map((item) => (
                  <div
                    key={item.id}
                    class="bulk-person-document-result-item"
                    data-status={item.status}
                  >
                    <div class="bulk-person-document-result-item__copy">
                      <strong>{item.documentTypeName}</strong>
                      <span>{item.fileName}</span>
                      <small>{item.contextLabel}</small>
                      <small>{item.message}</small>
                    </div>
                    <Badge tone={getStatusTone(item.status)}>
                      {getStatusLabel(item.status, true)}
                    </Badge>
                  </div>
                ))}
              </div>

              <div q:slot="actions" class="bulk-person-document-result-actions">
                {summary.value.failed > 0 && (
                  <Button variant="secondary" onClick$={retryFailedRows$}>
                    {m.resultRetryFailed}
                  </Button>
                )}
                <Button variant="secondary" onClick$={resetForSamePerson$}>
                  {m.resultContinueSamePerson}
                </Button>
                <Button
                  iconRight="chevron-right"
                  onClick$={async () => await nav(ROUTES.PERSONS_DOCUMENTS)}
                >
                  {m.resultFinish}
                </Button>
              </div>
            </CreateResult>
          ) : mode.value === 'error' ? (
            <CreateResult
              tone="error"
              eyebrow={m.errorEyebrow}
              title={m.errorTitle}
              description={submitError.value || m.errorDescription}
              onRetry$={submitBulk$}
              retryLabel={m.errorRetry}
            >
              <div q:slot="actions" class="bulk-person-document-result-actions">
                <Button
                  variant="secondary"
                  onClick$={() => (mode.value = 'idle')}
                >
                  {m.errorBackToForm}
                </Button>
              </div>
            </CreateResult>
          ) : !selectedPerson.value ? (
            <div class="bulk-person-document-shell">
              <Panel
                title={m.searchPanelTitle}
                description={m.searchPanelDescription}
              >
                <Field
                  label={m.personSearchLabel}
                  required
                  hint={m.personSearchHint}
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

                      if (
                        documentTypes.value.length === 0 &&
                        !loadingDocumentTypes.value
                      ) {
                        await loadDocumentTypes$();
                      }
                    }}
                  />
                </Field>

                {loadDocumentTypesError.value && (
                  <div class="bulk-person-document-inline-error" role="alert">
                    {loadDocumentTypesError.value}
                  </div>
                )}
              </Panel>
            </div>
          ) : (
            <div class="bulk-person-document-layout">
              <Panel
                title={m.selectedPersonPanelTitle}
                description={m.selectedPersonPanelDescription}
              >
                <div q:slot="leading" class="bulk-person-document-panel-icon">
                  <AppIcon intent="person" size="md" />
                </div>
                <div class="bulk-person-document-person-card">
                  <Avatar
                    src={resolvePhotoUrl(selectedPerson.value.photoUrl)}
                    name={selectedPerson.value.fullName}
                    size="lg"
                  />
                  <div class="bulk-person-document-person-card__info">
                    <strong>{selectedPerson.value.fullName}</strong>
                    <span>{selectedPerson.value.curp}</span>
                    <small>ID {selectedPerson.value.id}</small>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick$={() => {
                      selectedPerson.value = null;
                      deliveryDate.value = '';
                      clearRows$();
                    }}
                  >
                    {m.personChangeButton}
                  </Button>
                </div>
              </Panel>

              <Panel
                title={m.deliveryPanelTitle}
                description={m.deliveryPanelDescription}
              >
                <div
                  q:slot="leading"
                  class="bulk-person-document-panel-icon bulk-person-document-panel-icon--context"
                >
                  <AppIcon intent="schedule" size="md" />
                </div>
                <Field label={m.deliveryDateLabel} hint={m.deliveryDateHint}>
                  <DateInput
                    value={deliveryDate.value}
                    onInput$={(event) => {
                      deliveryDate.value = (
                        event.target as HTMLInputElement
                      ).value;
                    }}
                  />
                </Field>
              </Panel>

              <Panel
                title={m.documentsPanelTitle}
                description={m.documentsPanelDescription}
              >
                <div q:slot="leading" class="bulk-person-document-panel-icon">
                  <AppIcon intent="list" size="md" />
                </div>

                <div class="bulk-person-document-toolbar">
                  <Badge tone="neutral">
                    {rows.value.length}{' '}
                    {rows.value.length === 1 ? 'documento' : 'documentos'}
                  </Badge>
                  <div class="bulk-person-document-row__header-actions">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={
                        rows.value.length === 1 &&
                        !rows.value[0]?.documentTypeId &&
                        !rows.value[0]?.file
                      }
                      onClick$={clearRows$}
                    >
                      {m.clearRowsButton}
                    </Button>
                    <Button
                      size="sm"
                      iconLeft="add"
                      disabled={
                        loadingDocumentTypes.value ||
                        documentTypes.value.length === 0 ||
                        allTypesUsed.value
                      }
                      onClick$={addRow$}
                    >
                      {m.addRowButton}
                    </Button>
                  </div>
                </div>

                {formError.value && (
                  <div class="bulk-person-document-inline-error" role="alert">
                    {formError.value}
                  </div>
                )}

                {duplicateTypeIds.value.size > 0 && (
                  <div class="bulk-person-document-warn" role="status">
                    <strong>{m.duplicateTypesTitle}</strong>
                    <span>{m.duplicateTypesDescription}</span>
                  </div>
                )}

                {loadDocumentTypesError.value && (
                  <div class="bulk-person-document-inline-error" role="alert">
                    {loadDocumentTypesError.value}
                  </div>
                )}

                <div class="bulk-person-document-rows">
                  {rows.value.map((row, index) => (
                    <article
                      key={row.id}
                      class="bulk-person-document-row"
                      data-status={row.status}
                    >
                      <div class="bulk-person-document-row__header">
                        <div class="bulk-person-document-row__title">
                          <span>{m.rowTitleLabel}</span>
                          <strong>#{index + 1}</strong>
                        </div>
                        <div class="bulk-person-document-row__header-actions">
                          <Badge tone={getStatusTone(row.status)}>
                            {getStatusLabel(row.status, Boolean(row.file))}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick$={() => removeRow$(row.id)}
                          >
                            {m.rowRemoveButton}
                          </Button>
                        </div>
                      </div>

                      <div class="bulk-person-document-row__grid">
                        <Field label={m.rowTypeLabel} required>
                          <Select
                            name={`bulk-document-type-${row.id}`}
                            value={row.documentTypeId}
                            disabled={
                              loadingDocumentTypes.value ||
                              documentTypes.value.length === 0
                            }
                            placeholder={
                              documentTypes.value.length === 0
                                ? m.rowTypeEmpty
                                : m.rowTypePlaceholder
                            }
                            options={getTypeOptionsForRow(row.id)}
                            onChange$={(value) => {
                              updateRow$(row.id, (currentRow) => ({
                                ...currentRow,
                                documentTypeId: value,
                              }));
                              clearFormErrors$();
                            }}
                          />
                        </Field>

                        <Field label={m.rowNotesLabel} optional>
                          <Input
                            id={`bulk-document-notes-${row.id}`}
                            type="text"
                            value={row.notes}
                            placeholder={m.rowNotesPlaceholder}
                            onInput$={(event) => {
                              const value = (event.target as HTMLInputElement)
                                .value;
                              updateRow$(row.id, (currentRow) => ({
                                ...currentRow,
                                notes: value,
                              }));
                            }}
                          />
                        </Field>
                      </div>

                      <div class="bulk-person-document-context-block">
                        <Field
                          label={m.rowContextLabel}
                          hint={m.rowContextHint}
                        >
                          <div class="bulk-person-document-context-row">
                            <button
                              type="button"
                              class={[
                                'bulk-person-document-context-btn',
                                row.contextMode === 'none' ? 'is-active' : '',
                              ].join(' ')}
                              onClick$={() =>
                                setRowContextMode$(row.id, 'none')
                              }
                            >
                              <span class="bulk-person-document-context-btn__icon">
                                <AppIcon intent="person" size="sm" />
                              </span>
                              <span class="bulk-person-document-context-btn__copy">
                                <strong>{m.rowContextNoneTitle}</strong>
                                <small>{m.rowContextNoneDescription}</small>
                              </span>
                            </button>

                            <button
                              type="button"
                              class={[
                                'bulk-person-document-context-btn',
                                row.contextMode === 'student'
                                  ? 'is-active'
                                  : '',
                              ].join(' ')}
                              onClick$={() =>
                                setRowContextMode$(row.id, 'student')
                              }
                            >
                              <span class="bulk-person-document-context-btn__icon">
                                <AppIcon intent="school" size="sm" />
                              </span>
                              <span class="bulk-person-document-context-btn__copy">
                                <strong>{m.rowContextStudentTitle}</strong>
                                <small>{m.rowContextStudentDescription}</small>
                              </span>
                            </button>

                            <button
                              type="button"
                              class={[
                                'bulk-person-document-context-btn',
                                row.contextMode === 'staff' ? 'is-active' : '',
                              ].join(' ')}
                              onClick$={() =>
                                setRowContextMode$(row.id, 'staff')
                              }
                            >
                              <span class="bulk-person-document-context-btn__icon">
                                <AppIcon intent="staff" size="sm" />
                              </span>
                              <span class="bulk-person-document-context-btn__copy">
                                <strong>{m.rowContextStaffTitle}</strong>
                                <small>{m.rowContextStaffDescription}</small>
                              </span>
                            </button>
                          </div>
                        </Field>

                        {row.contextMode !== 'none' && (
                          <div class="bulk-person-document-context-search">
                            <Field
                              label={
                                row.contextMode === 'student'
                                  ? m.studentSearchLabel
                                  : m.staffSearchLabel
                              }
                              required
                              hint={
                                row.contextMode === 'student'
                                  ? m.studentSearchHint
                                  : m.staffSearchHint
                              }
                            >
                              <SearchSelect
                                query={row.contextQuery}
                                options={getContextOptionsForRow(row)}
                                loading={row.searchingContext}
                                placeholder={
                                  row.contextMode === 'student'
                                    ? m.studentSearchPlaceholder
                                    : m.staffSearchPlaceholder
                                }
                                filterMode="external"
                                emptyMessage={
                                  shouldSearch(row.contextQuery)
                                    ? row.contextMode === 'student'
                                      ? m.studentNoResults
                                      : m.staffNoResults
                                    : row.contextMode === 'student'
                                      ? m.studentSearchHint
                                      : m.staffSearchHint
                                }
                                onQueryChange$={(query) =>
                                  searchRowContext$(row.id, query)
                                }
                                onSelect$={async (option) => {
                                  if (row.contextMode === 'student') {
                                    await selectStudentForRow$(
                                      row.id,
                                      Number(option.value),
                                    );
                                    return;
                                  }

                                  await selectStaffForRow$(
                                    row.id,
                                    Number(option.value),
                                  );
                                }}
                                onClear$={async () => {
                                  updateRow$(row.id, (currentRow) => ({
                                    ...currentRow,
                                    contextQuery: '',
                                    selectedStudent: null,
                                    selectedStaff: null,
                                  }));
                                }}
                              />
                            </Field>

                            {row.contextMode === 'student' &&
                              row.selectedStudent && (
                                <div class="bulk-person-document-context-found">
                                  <div class="bulk-person-document-context-found__icon">
                                    <AppIcon intent="school" size="sm" />
                                  </div>
                                  <div class="bulk-person-document-context-found__copy">
                                    <strong>{m.rowStudentSelectedLabel}</strong>
                                    <span>{row.selectedStudent.fullName}</span>
                                    <small>
                                      {row.selectedStudent.studentCode ??
                                        'Sin matricula'}{' '}
                                      - {row.selectedStudent.curp}
                                    </small>
                                  </div>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick$={() =>
                                      updateRow$(row.id, (currentRow) => ({
                                        ...currentRow,
                                        selectedStudent: null,
                                        contextQuery: '',
                                      }))
                                    }
                                  >
                                    {m.studentChangeButton}
                                  </Button>
                                </div>
                              )}

                            {row.contextMode === 'staff' &&
                              row.selectedStaff && (
                                <div class="bulk-person-document-context-found">
                                  <div class="bulk-person-document-context-found__icon">
                                    <AppIcon intent="staff" size="sm" />
                                  </div>
                                  <div class="bulk-person-document-context-found__copy">
                                    <strong>{m.rowStaffSelectedLabel}</strong>
                                    <span>{row.selectedStaff.fullName}</span>
                                    <small>
                                      {row.selectedStaff.employeeCode ??
                                        row.selectedStaff.paymentUniqueKey ??
                                        'Sin codigo'}{' '}
                                      - {row.selectedStaff.curp}
                                    </small>
                                  </div>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick$={() =>
                                      updateRow$(row.id, (currentRow) => ({
                                        ...currentRow,
                                        selectedStaff: null,
                                        contextQuery: '',
                                      }))
                                    }
                                  >
                                    {m.staffChangeButton}
                                  </Button>
                                </div>
                              )}
                          </div>
                        )}
                      </div>

                      <Field label={m.rowFileLabel} required>
                        <div class="bulk-person-document-file-box">
                          <div class="bulk-person-document-file-box__copy">
                            <strong>{row.file?.name ?? m.rowFileEmpty}</strong>
                            <span>{m.rowAllowedFormats}</span>
                            <small>
                              {row.file
                                ? `${formatBytes(row.file.size)}`
                                : m.rowMaxSize}
                            </small>
                          </div>

                          <div class="bulk-person-document-file-box__actions">
                            <input
                              id={`bulk-document-file-${row.id}`}
                              class="bulk-person-document-file-input"
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.json,.xml"
                              onChange$={(event) => {
                                const input = event.target as HTMLInputElement;
                                assignFileToRow$(
                                  row.id,
                                  input.files?.[0] ?? null,
                                );
                              }}
                            />
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick$={() => {
                                const input = document.getElementById(
                                  `bulk-document-file-${row.id}`,
                                ) as HTMLInputElement | null;
                                input?.click();
                              }}
                            >
                              {row.file
                                ? m.rowReplaceFileButton
                                : m.rowSelectFileButton}
                            </Button>
                          </div>
                        </div>
                      </Field>
                    </article>
                  ))}
                </div>

                <div class="bulk-person-document-actions">
                  <Button
                    variant="secondary"
                    onClick$={async () => await nav(ROUTES.PERSONS_DOCUMENTS)}
                  >
                    {m.cancelButton}
                  </Button>
                  <Button
                    iconLeft="upload"
                    loading={saving.value}
                    disabled={saving.value}
                    onClick$={submitBulk$}
                  >
                    {saving.value ? m.uploadingButton : m.uploadButton}
                  </Button>
                </div>
              </Panel>
            </div>
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

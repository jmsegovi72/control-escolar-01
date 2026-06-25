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
import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
import { catalogService } from '~/services/catalog/catalog.service';
import { studentService } from '~/services/student/student.service';
import type {
  EducationalProgram,
  StudentGeneration,
  StudentListItem,
  StudentStatus,
  UpdateStudentDto,
  ViewStudent,
} from '~/types/student.types';
import {
  ActionHeader,
  Button,
  ChoiceGroup,
  EmptyState,
  Field,
  Input,
  Panel,
  Select,
  SelectionStep,
  Toast,
} from '~/ui';
import { EditResult, EditResultRow } from '~/ui/composed/EditResult';
import { AppIcon } from '~/ui/icons';
import { normalizeError } from '~/utils/api-error';
import { studentsWorkflow } from '~/utils/students-workflow';
import '../create/create.css';
import './edit.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PERSON_ID_SEARCH_REGEX = /^\s*(?:id\s*:)?\d+\s*$/i;
const m = messages.students.edit;
const mc = messages.students.create;

type AcademicLevel = 'Licenciatura' | 'Maestría';

const PROGRAM_LEVEL_FILTERS: Record<AcademicLevel, string> = {
  Licenciatura: 'superior',
  Maestría: 'posgrado',
};

type StudentEditOriginal = {
  academicLevel: AcademicLevel;
  programId: string;
  generationId: string;
  statusId: string;
  codeNumber: string;
  email: string;
};

const emptyOriginal: StudentEditOriginal = {
  academicLevel: 'Licenciatura',
  programId: '',
  generationId: '',
  statusId: '',
  codeNumber: '',
  email: '',
};

const normalizeOptional = (value: string) => {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

const resolveAcademicLevel = (
  student: ViewStudent,
  matchedProgram?: EducationalProgram,
): AcademicLevel => {
  const level = student.educationLevel?.trim().toLowerCase();
  if (level?.includes('maestr')) return 'Maestría';
  if (level?.includes('licen')) return 'Licenciatura';

  const programLevel = matchedProgram?.level?.trim().toLowerCase();
  if (programLevel === 'posgrado') return 'Maestría';

  return 'Licenciatura';
};

const resolveProgramId = (
  student: ViewStudent,
  programs: EducationalProgram[],
): string => {
  if (student.educationalProgramId) return String(student.educationalProgramId);

  const matched = programs.find(
    (program) =>
      program.name === student.educationalProgram ||
      program.code === student.programCode,
  );

  return matched ? String(matched.id) : '';
};

const resolveStatusId = (
  student: ViewStudent,
  statuses: StudentStatus[],
): string => {
  if (student.statusId) return String(student.statusId);

  const matched = statuses.find(
    (status) =>
      status.status === student.statusDescription ||
      status.description === student.statusDescription ||
      status.key === student.statusKey ||
      status.statusKey === student.statusKey,
  );

  return matched ? String(matched.id) : '';
};

const resolveGenerationId = (
  student: ViewStudent,
  generations: StudentGeneration[],
  academicLevel: AcademicLevel,
): string => {
  if (student.generationId) return String(student.generationId);

  const generationText =
    student.generation === null || student.generation === undefined
      ? ''
      : String(student.generation).trim();
  const cycleText = student.educationCycle?.trim() ?? '';

  const matched = generations.find((generation) => {
    if (generation.generation === generationText) return true;
    if (generation.generationName === generationText) return true;
    if (!cycleText) return false;

    if (academicLevel === 'Licenciatura') {
      return generation.bachelorDegreeCycle?.trim() === cycleText;
    }

    return generation.mastersDegreeCycle?.trim() === cycleText;
  });

  return matched ? String(matched.id) : '';
};

export default component$(() => {
  const nav = useNavigate();
  const location = useLocation();

  const student = useSignal<ViewStudent | null>(null);
  const loading = useSignal(true);
  const saving = useSignal(false);
  const success = useSignal(false);
  const selectionMode = useSignal(false);

  const error = useSignal('');
  const errorField = useSignal('');
  const duplicateConflict = useSignal(false);
  const duplicateTitle = useSignal<string>(m.duplicateTitle);
  const duplicateMessage = useSignal('');
  const selectionError = useSignal('');
  const returnPath = useSignal<string>(ROUTES.STUDENTS);

  const personQuery = useSignal('');
  const studentResults = useSignal<StudentListItem[]>([]);
  const searchingPerson = useSignal(false);

  const educationalPrograms = useSignal<EducationalProgram[]>([]);
  const generations = useSignal<StudentGeneration[]>([]);
  const statuses = useSignal<StudentStatus[]>([]);

  const academicLevel = useSignal<AcademicLevel>('Licenciatura');
  const programId = useSignal('');
  const generationId = useSignal('');
  const statusId = useSignal('');
  const codeNumber = useSignal('');
  const institutionalEmail = useSignal('');

  const originalValues = useSignal<StudentEditOriginal>({ ...emptyOriginal });

  const filteredPrograms = useComputed$(() =>
    educationalPrograms.value.filter((program) => {
      const isCurrentProgram =
        String(program.id) === programId.value ||
        String(program.id) === originalValues.value.programId;

      if (isCurrentProgram) return true;

      const normalizedLevel = program.level?.trim().toLowerCase();
      const selectedLevel = PROGRAM_LEVEL_FILTERS[academicLevel.value];

      if (normalizedLevel !== selectedLevel) return false;

      if (academicLevel.value === 'Licenciatura') {
        return program.studyPlan?.trim() === '2022';
      }

      return true;
    }),
  );

  const programOptions = useComputed$(() =>
    filteredPrograms.value.map((program) => ({
      value: String(program.id),
      label: program.name,
    })),
  );

  const generationOptions = useComputed$(() =>
    generations.value.map((generation) => ({
      value: String(generation.id),
      label: generation.generation,
    })),
  );

  const statusOptions = useComputed$(() =>
    statuses.value.map((status) => ({
      value: String(status.id),
      label: status.status,
    })),
  );

  const hasChanges = useComputed$(() => {
    const original = originalValues.value;

    return (
      academicLevel.value !== original.academicLevel ||
      programId.value !== original.programId ||
      generationId.value !== original.generationId ||
      statusId.value !== original.statusId ||
      codeNumber.value.trim() !== original.codeNumber.trim() ||
      institutionalEmail.value.trim() !== original.email.trim()
    );
  });

  const isInactiveStudent = useComputed$(
    () => student.value?.isActive === false,
  );

  const isCurrentNewIncome = useComputed$(
    () => student.value?.statusId === 6 || student.value?.statusKey === 'NI',
  );

  const canEditProgramFields = useComputed$(
    () => !isInactiveStudent.value && isCurrentNewIncome.value,
  );

  const areGeneralFieldsLocked = useComputed$(() => isInactiveStudent.value);

  useVisibleTask$(async ({ track }) => {
    const idParam = track(() => location.url.searchParams.get('id'));

    loading.value = true;
    saving.value = false;
    success.value = false;
    selectionMode.value = false;
    error.value = '';
    errorField.value = '';
    duplicateConflict.value = false;
    duplicateTitle.value = m.duplicateTitle;
    duplicateMessage.value = '';
    selectionError.value = '';
    returnPath.value = studentsWorkflow.getReturnPath();
    student.value = null;
    personQuery.value = '';
    studentResults.value = [];
    searchingPerson.value = false;
    academicLevel.value = 'Licenciatura';
    programId.value = '';
    generationId.value = '';
    statusId.value = '';
    codeNumber.value = '';
    institutionalEmail.value = '';
    originalValues.value = { ...emptyOriginal };

    const [programsResult, generationsResult, statusesResult] =
      await Promise.allSettled([
        catalogService.getEducationalPrograms(),
        catalogService.getStudentGenerations(),
        catalogService.getStudentStatuses(),
      ]);

    if (programsResult.status === 'fulfilled') {
      educationalPrograms.value = programsResult.value;
    } else {
      educationalPrograms.value = [];
    }

    if (generationsResult.status === 'fulfilled') {
      generations.value = generationsResult.value;
    } else {
      generations.value = [];
    }

    if (statusesResult.status === 'fulfilled') {
      statuses.value = statusesResult.value;
    } else {
      statuses.value = [];
    }

    const id = idParam ? Number(idParam) : 0;

    if (!id) {
      selectionMode.value = true;
      loading.value = false;
      return;
    }

    try {
      const found = await studentService.findOne(id);
      student.value = found;

      const resolvedProgramId = resolveProgramId(
        found,
        educationalPrograms.value,
      );
      const matchedProgram = educationalPrograms.value.find(
        (program) => String(program.id) === resolvedProgramId,
      );
      const resolvedAcademicLevel = resolveAcademicLevel(found, matchedProgram);
      const resolvedGenerationId = resolveGenerationId(
        found,
        generations.value,
        resolvedAcademicLevel,
      );
      const resolvedStatusId = resolveStatusId(found, statuses.value);

      academicLevel.value = resolvedAcademicLevel;
      programId.value = resolvedProgramId;
      generationId.value = resolvedGenerationId;
      statusId.value = resolvedStatusId;
      codeNumber.value = found.studentCode ?? '';
      institutionalEmail.value = found.email ?? found.institutionalMail ?? '';

      originalValues.value = {
        academicLevel: resolvedAcademicLevel,
        programId: resolvedProgramId,
        generationId: resolvedGenerationId,
        statusId: resolvedStatusId,
        codeNumber: found.studentCode ?? '',
        email: found.email ?? found.institutionalMail ?? '',
      };
    } catch (err) {
      error.value = normalizeError(err, m.loadErrorFallback).message;
    } finally {
      loading.value = false;
    }
  });

  useTask$(async ({ track }) => {
    const query = track(() => personQuery.value.trim());

    if (query.length < 3) {
      studentResults.value = [];
      return;
    }

    if (PERSON_ID_SEARCH_REGEX.test(query)) {
      studentResults.value = [];
      selectionError.value = mc.personSearchErrorInvalidQuery;
      return;
    }

    searchingPerson.value = true;

    try {
      const result = await studentService.findMany({
        searchTerm: query,
        isActive: true,
        limit: 8,
        page: 1,
      });
      studentResults.value = result.data;
      selectionError.value = '';
    } catch (err) {
      studentResults.value = [];
      selectionError.value = normalizeError(
        err,
        mc.searchErrorFallback,
      ).message;
    } finally {
      searchingPerson.value = false;
    }
  });

  useTask$(({ track }) => {
    track(() => programId.value);
    duplicateConflict.value = false;
    duplicateTitle.value = m.duplicateTitle;
    duplicateMessage.value = '';
    if (errorField.value === 'programId') {
      errorField.value = '';
      error.value = '';
    }
  });

  useTask$(({ track }) => {
    track(() => academicLevel.value);
    track(() => programOptions.value);

    if (
      programId.value &&
      !programOptions.value.some((option) => option.value === programId.value)
    ) {
      programId.value = '';
      duplicateConflict.value = false;
      duplicateTitle.value = m.duplicateTitle;
      duplicateMessage.value = '';
      if (errorField.value === 'programId') {
        errorField.value = '';
        error.value = '';
      }
    }
  });

  const goBack$ = $(async () => {
    await nav(returnPath.value);
  });

  const saveChanges$ = $(async () => {
    const currentStudent = student.value;
    if (!currentStudent) return;

    error.value = '';
    errorField.value = '';
    duplicateConflict.value = false;
    duplicateTitle.value = m.duplicateTitle;
    duplicateMessage.value = '';

    if (!programId.value) {
      error.value = mc.errorProgramRequired;
      errorField.value = 'programId';
      return;
    }

    if (!generationId.value) {
      error.value = mc.errorGenerationRequired;
      errorField.value = 'generationId';
      return;
    }

    const emailValue = institutionalEmail.value.trim();
    if (emailValue && !EMAIL_REGEX.test(emailValue)) {
      error.value = mc.errorInstitutionalEmailInvalid;
      errorField.value = 'email';
      return;
    }

    const changes: UpdateStudentDto = {};
    const original = originalValues.value;

    if (programId.value !== original.programId) {
      changes.educationalProgramId = Number(programId.value);
    }
    if (generationId.value !== original.generationId) {
      changes.generationId = Number(generationId.value);
    }
    if (statusId.value !== original.statusId) {
      changes.statusId = statusId.value ? Number(statusId.value) : undefined;
    }
    if (codeNumber.value.trim() !== original.codeNumber.trim()) {
      changes.codeNumber = normalizeOptional(codeNumber.value);
    }
    if (institutionalEmail.value.trim() !== original.email.trim()) {
      changes.email = normalizeOptional(institutionalEmail.value);
    }

    if (Object.keys(changes).length === 0) {
      error.value = m.errorNoChanges;
      return;
    }

    saving.value = true;

    try {
      const updated = await studentService.update(currentStudent.id, changes);
      student.value = updated;
      success.value = true;
    } catch (err) {
      const normalized = normalizeError(err, m.saveErrorFallback);
      const lowered = normalized.message.toLowerCase();

      if (
        normalized.statusCode === 409 ||
        lowered.includes('unique') ||
        lowered.includes('duplic') ||
        (lowered.includes('programa') && lowered.includes('registr'))
      ) {
        duplicateConflict.value = true;
        duplicateTitle.value = m.duplicateTitle;
        duplicateMessage.value = normalized.message || m.duplicateDescription;
        error.value = normalized.message || m.duplicateDescription;
        errorField.value = 'programId';
      } else if (
        normalized.statusCode === 400 &&
        lowered.includes('inactivo')
      ) {
        duplicateConflict.value = true;
        duplicateTitle.value = m.inactiveErrorTitle;
        duplicateMessage.value = normalized.message;
        error.value = normalized.message;
        errorField.value = 'statusId';
      } else if (
        normalized.statusCode === 400 &&
        lowered.includes('no se permite cambiar') &&
        (lowered.includes('programa educativo') ||
          lowered.includes('generación'))
      ) {
        duplicateConflict.value = true;
        duplicateTitle.value = m.programRuleErrorTitle;
        duplicateMessage.value = normalized.message;
        error.value = normalized.message;
        errorField.value = 'programId';
      } else {
        error.value = normalized.message;
        errorField.value = normalized.invalidField ?? '';
      }
    } finally {
      saving.value = false;
    }
  });

  const currentStudent = student.value;

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
      <ActionHeader q:slot="hub-header" title={m.title} onBack$={goBack$} />

      <div class="create-student-page">
        <div class="create-student-page__content">
          <div class="create-student-form-card">
            {error.value && !errorField.value && !success.value && (
              <Toast tone="danger" title="Error">
                {error.value}
              </Toast>
            )}

            {loading.value && (
              <Panel title={m.loadingTitle} description={m.loadingDescription}>
                <div class="edit-student-loading" />
              </Panel>
            )}

            {!loading.value && success.value && currentStudent && (
              <div class="create-student-layout">
                <EditResult
                  eyebrow={m.successResultEyebrow}
                  title={m.successResultTitle}
                  description={m.successResultDescription}
                >
                  <EditResultRow
                    label={mc.resultNameLabel}
                    value={currentStudent.fullName}
                  />
                  <EditResultRow
                    label={mc.resultCurpLabel}
                    value={currentStudent.curp}
                  />
                  <EditResultRow
                    label={mc.resultProgramLabel}
                    value={currentStudent.educationalProgram}
                  />
                  <EditResultRow
                    label={mc.resultGenerationLabel}
                    value={currentStudent.generation}
                    fallback={mc.noDataLabel}
                  />
                  <EditResultRow
                    label={mc.resultCodeNumberLabel}
                    value={currentStudent.studentCode}
                    fallback={mc.noDataLabel}
                  />
                  <EditResultRow
                    label={mc.resultInstitutionalEmailLabel}
                    value={
                      currentStudent.email ?? currentStudent.institutionalMail
                    }
                    fallback={mc.noDataLabel}
                  />
                  <EditResultRow
                    label={mc.resultStatusLabel}
                    value={currentStudent.statusDescription}
                    fallback={mc.noDataLabel}
                  />

                  <div q:slot="actions">
                    <Button
                      variant="ghost"
                      iconLeft="view"
                      onClick$={async () => {
                        await nav(ROUTES.STUDENTS_EDIT);
                      }}
                    >
                      {m.successResultViewAnother}
                    </Button>
                    <Button
                      iconRight="chevron-right"
                      onClick$={async () => await nav(ROUTES.STUDENTS)}
                    >
                      {m.successResultFinish}
                    </Button>
                  </div>
                </EditResult>
              </div>
            )}

            {!loading.value && !success.value && selectionMode.value && (
              <div class="edit-student-search-shell">
                <SelectionStep
                  title={m.selectionTitle}
                  description={m.selectionDescription}
                  fieldLabel={mc.personSearchLabel}
                  fieldHint={m.fieldPersonSearchActiveHint}
                  placeholder={mc.personSearchPlaceholder}
                  emptyMessage={m.noResultsCriteria}
                  query={personQuery.value}
                  options={studentResults.value.map((student) => ({
                    value: String(student.id),
                    label: student.fullName,
                    description: student.curp,
                  }))}
                  loading={searchingPerson.value}
                  onQueryChange$={(query) => {
                    personQuery.value = query;
                    selectionError.value = '';
                  }}
                  onSelect$={async (option) => {
                    const selectedStudent = studentResults.value.find(
                      (item) => item.id === Number(option.value),
                    );
                    if (!selectedStudent) return;

                    try {
                      const found = await studentService.findOne(
                        selectedStudent.id,
                      );
                      await nav(`${ROUTES.STUDENTS_EDIT}?id=${found.id}`);
                    } catch (err) {
                      const normalized = normalizeError(
                        err,
                        m.loadErrorFallback,
                      );

                      if (normalized.statusCode === 404) {
                        selectionError.value = m.notFoundDescription.replace(
                          '{name}',
                          selectedStudent.fullName,
                        );
                      } else {
                        selectionError.value = normalized.message;
                      }
                    }
                  }}
                />

                {selectionError.value && (
                  <EmptyState
                    title={m.notFoundTitle}
                    description={selectionError.value}
                    tone="warning"
                    actionLabel={m.notFoundCreateAction}
                    onAction$={async () => {
                      await nav(ROUTES.STUDENTS_CREATE);
                    }}
                  />
                )}
              </div>
            )}

            {!loading.value && !success.value && currentStudent && (
              <div class="create-student-layout">
                <div class="create-student-person-card">
                  <div
                    class="create-student-person-card__icon"
                    aria-hidden="true"
                  >
                    <AppIcon intent="person" size="md" />
                  </div>
                  <div class="create-student-person-card__info">
                    <strong>{currentStudent.fullName}</strong>
                    <span>{currentStudent.curp}</span>
                  </div>
                  <Button
                    variant="ghost"
                    iconLeft="edit"
                    onClick$={async () => {
                      await nav(ROUTES.STUDENTS_EDIT);
                    }}
                  >
                    {mc.personChangeButton}
                  </Button>
                </div>

                <Panel
                  title={m.panelPersonTitle}
                  description={m.panelPersonDescription}
                >
                  <div q:slot="leading" class="create-student-form-header-icon">
                    <AppIcon intent="person" size="md" />
                  </div>

                  <div class="create-student-person-card__info">
                    <strong>{currentStudent.fullName}</strong>
                    <span>{currentStudent.curp}</span>
                  </div>
                </Panel>

                <Panel
                  title={m.panelAcademicTitle}
                  description={m.panelAcademicDescription}
                  density="compact"
                >
                  <div q:slot="leading" class="create-student-form-header-icon">
                    <AppIcon intent="list" size="md" />
                  </div>

                  <div class="create-student-form">
                    {isInactiveStudent.value && (
                      <div class="student-inline-info" role="status">
                        {m.inactiveHint}
                      </div>
                    )}

                    {duplicateConflict.value && duplicateMessage.value && (
                      <div class="student-warn-banner" role="alert">
                        <div
                          class="student-warn-banner__icon"
                          aria-hidden="true"
                        >
                          <AppIcon intent="warning" size="sm" />
                        </div>
                        <div>
                          <div class="student-warn-banner__title">
                            {duplicateTitle.value}
                          </div>
                          <div class="student-warn-banner__description">
                            {duplicateMessage.value}
                          </div>
                        </div>
                      </div>
                    )}

                    <Field
                      label={mc.fieldAcademicLevelLabel}
                      hint={
                        canEditProgramFields.value
                          ? mc.fieldAcademicLevelHint
                          : m.programLockedHint
                      }
                    >
                      <ChoiceGroup
                        name="student-edit-academic-level"
                        value={academicLevel.value}
                        disabled={!canEditProgramFields.value}
                        options={[
                          {
                            value: 'Licenciatura',
                            label: mc.academicLevelUndergraduate,
                            description:
                              mc.academicLevelUndergraduateDescription,
                          },
                          {
                            value: 'Maestría',
                            label: mc.academicLevelMasters,
                            description: mc.academicLevelMastersDescription,
                          },
                        ]}
                        onChange$={(value) => {
                          academicLevel.value = value as AcademicLevel;
                        }}
                      />
                    </Field>

                    <Field
                      label={mc.fieldProgramLabel}
                      required
                      hint={
                        canEditProgramFields.value
                          ? undefined
                          : m.programLockedHint
                      }
                      error={
                        errorField.value === 'programId' &&
                        !duplicateConflict.value
                          ? error.value
                          : undefined
                      }
                    >
                      <Select
                        name="student-edit-program"
                        value={programId.value}
                        disabled={
                          !canEditProgramFields.value ||
                          filteredPrograms.value.length === 0
                        }
                        placeholder={
                          filteredPrograms.value.length === 0
                            ? mc.fieldProgramEmptyFiltered
                            : mc.fieldProgramPlaceholder
                        }
                        options={programOptions.value}
                        invalid={errorField.value === 'programId'}
                        onChange$={(value) => {
                          programId.value = value;
                        }}
                      />
                    </Field>

                    <Field
                      label={mc.fieldGenerationLabel}
                      required
                      hint={
                        canEditProgramFields.value
                          ? undefined
                          : m.programLockedHint
                      }
                      error={
                        errorField.value === 'generationId'
                          ? error.value
                          : undefined
                      }
                    >
                      <Select
                        name="student-edit-generation"
                        value={generationId.value}
                        disabled={
                          !canEditProgramFields.value ||
                          generations.value.length === 0
                        }
                        placeholder={mc.fieldGenerationPlaceholder}
                        options={generationOptions.value}
                        invalid={errorField.value === 'generationId'}
                        onChange$={(value) => {
                          generationId.value = value;
                          if (errorField.value === 'generationId') {
                            errorField.value = '';
                            error.value = '';
                          }
                        }}
                      />
                    </Field>

                    <div class="create-student-grid create-student-grid--pair">
                      <Field label={mc.fieldCodeNumberLabel} optional>
                        <Input
                          id="student-edit-code-number"
                          type="text"
                          value={codeNumber.value}
                          disabled={areGeneralFieldsLocked.value}
                          placeholder={mc.fieldCodeNumberPlaceholder}
                          onInput$={(event) => {
                            codeNumber.value = (
                              event.target as HTMLInputElement
                            ).value;
                          }}
                        />
                      </Field>

                      <Field
                        label={mc.fieldInstitutionalEmailLabel}
                        optional
                        error={
                          errorField.value === 'email' ? error.value : undefined
                        }
                      >
                        <Input
                          id="student-edit-email"
                          type="email"
                          value={institutionalEmail.value}
                          disabled={areGeneralFieldsLocked.value}
                          placeholder={mc.fieldInstitutionalEmailPlaceholder}
                          invalid={errorField.value === 'email'}
                          onInput$={(event) => {
                            institutionalEmail.value = (
                              event.target as HTMLInputElement
                            ).value;
                            if (errorField.value === 'email') {
                              errorField.value = '';
                              error.value = '';
                            }
                          }}
                        />
                      </Field>
                    </div>

                    <Field label={mc.fieldStatusLabel} optional>
                      <Select
                        name="student-edit-status"
                        value={statusId.value}
                        disabled={statuses.value.length === 0}
                        placeholder={mc.fieldStatusPlaceholder}
                        options={statusOptions.value}
                        onChange$={(value) => {
                          statusId.value = value;
                        }}
                      />
                    </Field>

                    <div class="create-student-form-note">
                      <span>{mc.fieldCodeNumberHint}</span>
                    </div>
                  </div>
                </Panel>

                <div class="create-student-actions">
                  <Button variant="secondary" onClick$={goBack$}>
                    {m.actionCancel}
                  </Button>
                  <Button
                    iconLeft="save"
                    loading={saving.value}
                    disabled={saving.value || !hasChanges.value}
                    onClick$={saveChanges$}
                  >
                    {saving.value ? m.saving : m.actionSave}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Editar estudiante`,
};

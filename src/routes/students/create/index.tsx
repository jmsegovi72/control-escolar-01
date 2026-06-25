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
import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
import { catalogService } from '~/services/catalog/catalog.service';
import { personService } from '~/services/person/person.service';
import { studentService } from '~/services/student/student.service';
import type { PersonListItem, ViewPerson } from '~/types/person.types';
import type {
  CreateStudentDto,
  EducationalProgram,
  StudentGeneration,
  StudentStatus,
} from '~/types/student.types';
import {
  ActionHeader,
  Button,
  ChoiceGroup,
  Field,
  Input,
  Panel,
  Select,
  SelectionStep,
  StepIndicator,
} from '~/ui';
import { CreateResult, CreateResultRow } from '~/ui/composed/CreateResult';
import { AppIcon } from '~/ui/icons';
import { normalizeError } from '~/utils/api-error';
import './create.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PERSON_ID_SEARCH_REGEX = /^\s*(?:id\s*:)?\d+\s*$/i;
const m = messages.students.create;

type SubmitSummary = {
  fullName: string;
  curp: string;
  programName: string;
  generationName: string;
  codeNumber: string;
  email: string;
  statusName: string;
};

type AcademicLevel = 'Licenciatura' | 'Maestría';

const PROGRAM_LEVEL_FILTERS: Record<AcademicLevel, string> = {
  Licenciatura: 'superior',
  Maestría: 'posgrado',
};

const emptySummary: SubmitSummary = {
  fullName: '',
  curp: '',
  programName: '',
  generationName: '',
  codeNumber: '',
  email: '',
  statusName: '',
};

export default component$(() => {
  const nav = useNavigate();

  const personQuery = useSignal('');
  const personResults = useSignal<PersonListItem[]>([]);
  const searching = useSignal(false);
  const selectedPerson = useSignal<ViewPerson | null>(null);

  const educationalPrograms = useSignal<EducationalProgram[]>([]);
  const generations = useSignal<StudentGeneration[]>([]);
  const statuses = useSignal<StudentStatus[]>([]);
  const loadingCatalogs = useSignal(true);
  const catalogsError = useSignal('');
  const academicLevel = useSignal<AcademicLevel>('Licenciatura');

  const programId = useSignal('');
  const generationId = useSignal('');
  const statusId = useSignal('6');
  const codeNumber = useSignal('');
  const institutionalEmail = useSignal('');

  const saving = useSignal(false);
  const duplicateConflict = useSignal(false);
  const duplicateMessage = useSignal('');
  const error = useSignal('');
  const errorField = useSignal('');
  const success = useSignal(false);
  const summary = useSignal<SubmitSummary>({ ...emptySummary });

  useTask$(async () => {
    loadingCatalogs.value = true;
    catalogsError.value = '';

    const [programsResult, generationsResult, statusesResult] =
      await Promise.allSettled([
        catalogService.getEducationalPrograms(),
        catalogService.getStudentGenerations(),
        catalogService.getStudentStatuses(),
      ]);

    const catalogErrors: string[] = [];

    if (programsResult.status === 'fulfilled') {
      educationalPrograms.value = programsResult.value;
    } else {
      educationalPrograms.value = [];
      catalogErrors.push(
        normalizeError(programsResult.reason, m.loadingCatalogs).message,
      );
    }

    if (generationsResult.status === 'fulfilled') {
      generations.value = generationsResult.value;
    } else {
      generations.value = [];
      catalogErrors.push(
        normalizeError(generationsResult.reason, m.loadingCatalogs).message,
      );
    }

    if (statusesResult.status === 'fulfilled') {
      statuses.value = statusesResult.value;
      if (
        !statusesResult.value.some(
          (status) => String(status.id) === statusId.value,
        )
      ) {
        statusId.value = statusesResult.value[0]
          ? String(statusesResult.value[0].id)
          : '';
      }
    } else {
      statuses.value = [];
      statusId.value = '';
      catalogErrors.push(
        normalizeError(statusesResult.reason, m.loadingCatalogs).message,
      );
    }

    catalogsError.value = catalogErrors[0] ?? '';
    loadingCatalogs.value = false;
  });

  useTask$(async ({ track }) => {
    const query = track(() => personQuery.value.trim());

    if (query.length < 3) {
      personResults.value = [];
      return;
    }

    if (PERSON_ID_SEARCH_REGEX.test(query)) {
      personResults.value = [];
      error.value = m.personSearchErrorInvalidQuery;
      errorField.value = 'personSearch';
      return;
    }

    searching.value = true;

    try {
      const result = await personService.findMany({
        searchTerm: query,
        limit: 8,
        page: 1,
      });
      personResults.value = result.data;
      if (errorField.value === 'personSearch') {
        errorField.value = '';
        error.value = '';
      }
    } catch (err) {
      personResults.value = [];
      error.value = normalizeError(err, m.searchErrorFallback).message;
      errorField.value = 'personSearch';
    } finally {
      searching.value = false;
    }
  });

  useTask$(({ track }) => {
    track(() => programId.value);
    duplicateConflict.value = false;
    duplicateMessage.value = '';
    if (errorField.value === 'programId') {
      errorField.value = '';
      error.value = '';
    }
  });

  const currentStep = useComputed$(() =>
    success.value ? 3 : selectedPerson.value ? 2 : 1,
  );

  const stepTone = useComputed$(() => {
    if (success.value) return 'success' as const;
    if (error.value || duplicateConflict.value) return 'error' as const;
    return undefined;
  });

  const filteredPrograms = useComputed$(() =>
    educationalPrograms.value.filter((program) => {
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

  const canSave = useComputed$(
    () =>
      Boolean(programId.value) &&
      Boolean(generationId.value) &&
      !duplicateConflict.value &&
      !saving.value &&
      !loadingCatalogs.value,
  );

  useTask$(({ track }) => {
    track(() => academicLevel.value);
    track(() => programOptions.value);

    if (
      programId.value &&
      !programOptions.value.some((option) => option.value === programId.value)
    ) {
      programId.value = '';
      duplicateConflict.value = false;
      duplicateMessage.value = '';
      if (errorField.value === 'programId') {
        errorField.value = '';
        error.value = '';
      }
    }
  });

  const clearSelectedPerson$ = $(() => {
    selectedPerson.value = null;
    academicLevel.value = 'Licenciatura';
    personQuery.value = '';
    personResults.value = [];
    duplicateConflict.value = false;
    duplicateMessage.value = '';
    error.value = '';
    errorField.value = '';
    success.value = false;
    summary.value = { ...emptySummary };
    programId.value = '';
    generationId.value = '';
    statusId.value = statuses.value.some((status) => status.id === 6)
      ? '6'
      : statuses.value[0]
        ? String(statuses.value[0].id)
        : '';
    codeNumber.value = '';
    institutionalEmail.value = '';
  });

  const saveStudent$ = $(async () => {
    error.value = '';
    errorField.value = '';
    duplicateConflict.value = false;
    duplicateMessage.value = '';

    if (!selectedPerson.value) {
      error.value = m.personSearchErrorNotFound;
      errorField.value = 'personSearch';
      return;
    }

    if (!programId.value) {
      error.value = m.errorProgramRequired;
      errorField.value = 'programId';
      return;
    }

    if (!generationId.value) {
      error.value = m.errorGenerationRequired;
      errorField.value = 'generationId';
      return;
    }

    const emailValue = institutionalEmail.value.trim();
    if (emailValue && !EMAIL_REGEX.test(emailValue)) {
      error.value = m.errorInstitutionalEmailInvalid;
      errorField.value = 'email';
      return;
    }

    saving.value = true;

    const payload: CreateStudentDto = {
      personId: selectedPerson.value.id,
      educationalProgramId: Number(programId.value),
      generationId: Number(generationId.value),
      ...(statusId.value ? { statusId: Number(statusId.value) } : {}),
      ...(codeNumber.value.trim()
        ? { codeNumber: codeNumber.value.trim() }
        : {}),
      ...(emailValue ? { email: emailValue } : {}),
    };

    try {
      await studentService.create(payload);

      summary.value = {
        fullName: selectedPerson.value.fullName,
        curp: selectedPerson.value.curp,
        programName:
          programOptions.value.find(
            (option) => option.value === programId.value,
          )?.label ?? '',
        generationName:
          generationOptions.value.find(
            (option) => option.value === generationId.value,
          )?.label ?? '',
        codeNumber: codeNumber.value.trim(),
        email: emailValue,
        statusName:
          statusOptions.value.find((option) => option.value === statusId.value)
            ?.label ?? '',
      };
      success.value = true;
    } catch (err) {
      const normalized = normalizeError(err, m.saveErrorFallback);
      const lowered = normalized.message.toLowerCase();

      if (
        normalized.statusCode === 409 ||
        (normalized.statusCode === 400 &&
          lowered.includes('alumno activo') &&
          lowered.includes('programa')) ||
        lowered.includes('unique') ||
        lowered.includes('duplic') ||
        (lowered.includes('programa') && lowered.includes('registr'))
      ) {
        duplicateConflict.value = true;
        duplicateMessage.value = normalized.message || m.duplicateDescription;
        error.value = normalized.message || m.duplicateDescription;
        errorField.value = 'programId';
      } else {
        error.value = normalized.message;
        errorField.value = normalized.invalidField ?? '';
      }
    } finally {
      saving.value = false;
    }
  });

  return (
    <AuthenticatedShell
      eyebrow={m.eyebrow}
      title={success.value ? m.resultToolbarTitle : m.title}
      description={m.description}
      meta={m.meta}
      allowedUserTypes={['SUPER', 'CE']}
      accessDeniedDescription={m.accessDenied}
      fullWidth
    >
      <ActionHeader
        q:slot="hub-header"
        title={success.value ? m.resultToolbarTitle : m.title}
        onBack$={async () => await nav(ROUTES.STUDENTS)}
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

      <div class="create-student-page">
        <div class="create-student-page__content">
          {!success.value ? (
            <div class="create-student-form-card">
              {!selectedPerson.value ? (
                <>
                  <SelectionStep
                    title={m.panelPersonTitle}
                    description={m.panelPersonDescription}
                    fieldLabel={m.personSearchLabel}
                    fieldHint={m.personSearchHint}
                    placeholder={m.personSearchPlaceholder}
                    emptyMessage={m.personSearchErrorNotFound}
                    query={personQuery.value}
                    options={personResults.value.map((person) => ({
                      value: String(person.id),
                      label: person.fullName,
                      description: person.curp,
                    }))}
                    loading={searching.value}
                    onQueryChange$={(query) => {
                      personQuery.value = query;
                      if (errorField.value === 'personSearch') {
                        errorField.value = '';
                        error.value = '';
                      }
                    }}
                    onSelect$={async (option) => {
                      const selected = personResults.value.find(
                        (item) => item.id === Number(option.value),
                      );
                      if (!selected) return;

                      selectedPerson.value = {
                        id: selected.id,
                        curp: selected.curp,
                        fullName: selected.fullName,
                      } as ViewPerson;
                      personQuery.value = '';
                      personResults.value = [];
                      error.value = '';
                      errorField.value = '';
                    }}
                  />

                  {errorField.value === 'personSearch' && error.value && (
                    <div class="student-inline-error" role="alert">
                      {error.value}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div class="create-student-layout">
                    <div class="create-student-person-card">
                      <div
                        class="create-student-person-card__icon"
                        aria-hidden="true"
                      >
                        <AppIcon intent="person" size="md" />
                      </div>
                      <div class="create-student-person-card__info">
                        <strong>{selectedPerson.value?.fullName ?? ''}</strong>
                        <span>{selectedPerson.value?.curp ?? ''}</span>
                      </div>
                      <Button
                        variant="ghost"
                        iconLeft="close"
                        onClick$={clearSelectedPerson$}
                      >
                        {m.personChangeButton}
                      </Button>
                    </div>

                    <Panel
                      title={m.panelAcademicTitle}
                      description={m.panelAcademicDescription}
                      density="compact"
                    >
                      <div
                        q:slot="leading"
                        class="create-student-form-header-icon"
                      >
                        <AppIcon intent="list" size="md" />
                      </div>
                      <div class="create-student-form">
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
                                {m.duplicateTitle}
                              </div>
                              <div class="student-warn-banner__description">
                                {duplicateMessage.value}
                              </div>
                            </div>
                          </div>
                        )}

                        {catalogsError.value && (
                          <div class="student-inline-error" role="alert">
                            {catalogsError.value}
                          </div>
                        )}

                        <Field
                          label={m.fieldAcademicLevelLabel}
                          hint={m.fieldAcademicLevelHint}
                        >
                          <ChoiceGroup
                            name="student-academic-level"
                            value={academicLevel.value}
                            options={[
                              {
                                value: 'Licenciatura',
                                label: m.academicLevelUndergraduate,
                                description:
                                  m.academicLevelUndergraduateDescription,
                              },
                              {
                                value: 'Maestría',
                                label: m.academicLevelMasters,
                                description: m.academicLevelMastersDescription,
                              },
                            ]}
                            onChange$={(value) => {
                              academicLevel.value = value as AcademicLevel;
                            }}
                          />
                        </Field>

                        <Field
                          label={m.fieldProgramLabel}
                          required
                          error={
                            errorField.value === 'programId' &&
                            !duplicateConflict.value
                              ? error.value
                              : undefined
                          }
                        >
                          <Select
                            name="student-program"
                            value={programId.value}
                            disabled={
                              loadingCatalogs.value ||
                              filteredPrograms.value.length === 0
                            }
                            placeholder={
                              filteredPrograms.value.length === 0
                                ? m.fieldProgramEmptyFiltered
                                : m.fieldProgramPlaceholder
                            }
                            options={programOptions.value}
                            invalid={errorField.value === 'programId'}
                            onChange$={async (value) => {
                              programId.value = value;
                            }}
                          />
                        </Field>

                        <Field
                          label={m.fieldGenerationLabel}
                          required
                          error={
                            errorField.value === 'generationId'
                              ? error.value
                              : undefined
                          }
                        >
                          <Select
                            name="student-generation"
                            value={generationId.value}
                            disabled={
                              loadingCatalogs.value ||
                              generations.value.length === 0
                            }
                            placeholder={m.fieldGenerationPlaceholder}
                            options={generationOptions.value}
                            invalid={errorField.value === 'generationId'}
                            onChange$={async (value) => {
                              generationId.value = value;
                              if (errorField.value === 'generationId') {
                                errorField.value = '';
                                error.value = '';
                              }
                            }}
                          />
                        </Field>

                        <div class="create-student-grid create-student-grid--pair">
                          <Field label={m.fieldCodeNumberLabel} optional>
                            <Input
                              id="student-code-number"
                              type="text"
                              value={codeNumber.value}
                              placeholder={m.fieldCodeNumberPlaceholder}
                              onInput$={(event) => {
                                codeNumber.value = (
                                  event.target as HTMLInputElement
                                ).value;
                              }}
                            />
                          </Field>

                          <Field
                            label={m.fieldInstitutionalEmailLabel}
                            optional
                            error={
                              errorField.value === 'email'
                                ? error.value
                                : undefined
                            }
                          >
                            <Input
                              id="student-email"
                              type="email"
                              value={institutionalEmail.value}
                              placeholder={m.fieldInstitutionalEmailPlaceholder}
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

                        <Field label={m.fieldStatusLabel} optional>
                          <Select
                            name="student-status"
                            value={statusId.value}
                            disabled={
                              loadingCatalogs.value ||
                              statuses.value.length === 0
                            }
                            placeholder={m.fieldStatusPlaceholder}
                            options={statusOptions.value}
                            onChange$={async (value) => {
                              statusId.value = value;
                            }}
                          />
                        </Field>

                        <div class="create-student-form-note">
                          <span>{m.fieldCodeNumberHint}</span>
                        </div>
                      </div>
                    </Panel>

                    <div class="create-student-actions">
                      <Button
                        variant="secondary"
                        onClick$={async () => await nav(ROUTES.STUDENTS)}
                      >
                        {m.cancelButton}
                      </Button>
                      <Button
                        iconLeft="save"
                        loading={saving.value}
                        disabled={!canSave.value}
                        onClick$={saveStudent$}
                      >
                        {m.saveButton}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <CreateResult
              eyebrow={m.successEyebrow}
              title={m.successTitle}
              description={m.successDescription}
            >
              <CreateResultRow
                label={m.resultNameLabel}
                value={summary.value.fullName}
              />
              <CreateResultRow
                label={m.resultCurpLabel}
                value={summary.value.curp}
              />
              <CreateResultRow
                label={m.resultProgramLabel}
                value={summary.value.programName}
              />
              <CreateResultRow
                label={m.resultGenerationLabel}
                value={summary.value.generationName}
              />
              <CreateResultRow
                label={m.resultCodeNumberLabel}
                value={summary.value.codeNumber}
                fallback={m.noDataLabel}
              />
              <CreateResultRow
                label={m.resultInstitutionalEmailLabel}
                value={summary.value.email}
                fallback={m.noDataLabel}
              />
              <CreateResultRow
                label={m.resultStatusLabel}
                value={summary.value.statusName}
                fallback={m.noDataLabel}
              />

              <div q:slot="actions">
                <Button variant="secondary" onClick$={clearSelectedPerson$}>
                  {m.successCreateAnother}
                </Button>
                <Button
                  iconRight="chevron-right"
                  onClick$={async () => await nav(ROUTES.STUDENTS)}
                >
                  {m.backToHubButton}
                </Button>
              </div>
            </CreateResult>
          )}
        </div>
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Crear estudiante`,
};

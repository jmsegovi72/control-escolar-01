import {
  $,
  component$,
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
import { studentService } from '~/services/student/student.service';
import type { StudentListItem, ViewStudent } from '~/types/student.types';
import {
  ActionHeader,
  Avatar,
  Badge,
  Button,
  EmptyState,
  Panel,
  SelectionStep,
  Toast,
} from '~/ui';
import { normalizeError } from '~/utils/api-error';
import { studentsWorkflow } from '~/utils/students-workflow';
import './detail.css';

const m = messages.students.detail;
const DEFAULT_STUDENT_AVATAR = '/avatars/user-default.svg';

const resolveStudentPhotoUrl = (
  photoUrl: string | null | undefined,
): string => {
  if (!photoUrl) return DEFAULT_STUDENT_AVATAR;
  if (photoUrl.startsWith('http')) return photoUrl;

  const apiBase = ENV.API_URL.replace(/\/sices\/v\d+$/, '');
  return `${apiBase}/${photoUrl.replace(/^\/+/, '')}`;
};

const formatPhone = (value?: string | null) => {
  if (!value) return m.noData;

  const digits = value.replace(/\D/g, '');
  if (digits.length !== 10) return value;

  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const getSearchTypeLabel = (value: string) => {
  const trimmed = value.trim();

  if (/^\d+$/.test(trimmed)) return 'ID';
  if (trimmed.includes('@')) return 'correo institucional';
  if (/^sc:/i.test(trimmed) || /^SC[A-Z0-9]+$/i.test(trimmed)) {
    return 'matricula';
  }
  if (/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/i.test(trimmed)) return 'CURP';

  return 'criterio';
};

const getStatusTone = (student: ViewStudent) => {
  if (student.isActive === true) return 'success' as const;
  if (student.isActive === false) return 'danger' as const;
  return 'neutral' as const;
};

const getGenderLabel = (gender?: string | null) => {
  if (gender === 'H') return m.genderMale;
  if (gender === 'M') return m.genderFemale;
  return m.noData;
};

export default component$(() => {
  const nav = useNavigate();
  const location = useLocation();

  const student = useSignal<ViewStudent | null>(null);
  const selectionMode = useSignal(false);
  const loading = useSignal(false);
  const error = useSignal('');
  const notFound = useSignal(false);
  const searched = useSignal(false);
  const searchTerm = useSignal('');
  const appliedSearchTerm = useSignal('');
  const helperMessage = useSignal<string>(m.searchHint);
  const searchResults = useSignal<StudentListItem[]>([]);
  const searching = useSignal(false);
  const returnPath = useSignal<string>(ROUTES.STUDENTS);

  const runSearch$ = $(async (rawTerm?: string) => {
    const term = (rawTerm ?? searchTerm.value).trim();

    if (!term) {
      error.value = m.searchEmptyError;
      notFound.value = false;
      student.value = null;
      return;
    }

    loading.value = true;
    error.value = '';
    notFound.value = false;
    searched.value = true;
    appliedSearchTerm.value = term;
    helperMessage.value = m.searchHint;
    student.value = null;

    try {
      const found = await studentService.findOne(term);
      student.value = found;
      helperMessage.value = m.searchSuccessHint.replace(
        '{type}',
        getSearchTypeLabel(term),
      );
    } catch (err) {
      const normalized = normalizeError(err, messages.errors.notFound);

      if (normalized.statusCode === 404) {
        notFound.value = true;
        helperMessage.value = m.searchNotFoundHint.replace(
          '{type}',
          getSearchTypeLabel(term),
        );
        return;
      }

      error.value = normalized.message;
    } finally {
      loading.value = false;
    }
  });

  useVisibleTask$(async ({ track }) => {
    const idParam = track(() => location.url.searchParams.get('id'));
    const searchParam = track(() => location.url.searchParams.get('search'));

    const initialTerm = (searchParam || idParam || '').trim();

    selectionMode.value = false;
    returnPath.value = studentsWorkflow.getReturnPath();
    loading.value = false;
    error.value = '';
    notFound.value = false;
    searched.value = false;
    student.value = null;
    appliedSearchTerm.value = '';
    helperMessage.value = m.searchHint;
    searchTerm.value = initialTerm;
    searchResults.value = [];
    searching.value = false;

    if (!initialTerm) {
      selectionMode.value = true;
      return;
    }

    await runSearch$(initialTerm);
  });

  useTask$(async ({ track }) => {
    const query = track(() => searchTerm.value.trim());

    if (!selectionMode.value) return;

    if (query.length < 3) {
      searchResults.value = [];
      searching.value = false;
      return;
    }

    searching.value = true;

    try {
      const response = await studentService.findMany({
        limit: 8,
        page: 1,
        searchTerm: query,
      });
      searchResults.value = response.data;
    } catch {
      searchResults.value = [];
    } finally {
      searching.value = false;
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
      <ActionHeader
        q:slot="hub-header"
        title={m.title}
        onBack$={async () => await nav(returnPath.value)}
      />

      <div class="student-detail-page">
        <div class="student-detail__content">
          {loading.value && (
            <Panel title={m.loadingTitle} description={m.loadingDescription}>
              <div class="student-detail__loading" />
            </Panel>
          )}

          {!loading.value && error.value && (
            <Toast tone="danger" title="Error">
              {error.value}
            </Toast>
          )}

          {!loading.value && selectionMode.value && !currentStudent && (
            <div class="student-detail__search-shell">
              <SelectionStep
                title={m.selectionTitle}
                description={m.selectionDescription}
                fieldLabel={m.selectionFieldLabel}
                fieldHint={m.selectionFieldHint}
                placeholder={messages.persons.edit.searchPlaceholder}
                emptyMessage={m.selectionEmpty}
                query={searchTerm.value}
                options={searchResults.value.map((result) => ({
                  value: String(result.id),
                  label: result.fullName,
                  description: result.curp,
                }))}
                loading={searching.value}
                onQueryChange$={(query) => {
                  searchTerm.value = query;
                }}
                onSelect$={async (option) =>
                  await nav(`${ROUTES.STUDENTS_DETAIL}?id=${option.value}`)
                }
              />
            </div>
          )}

          {!loading.value &&
            !selectionMode.value &&
            !error.value &&
            !searched.value && (
              <div class="student-detail__state-shell">
                <EmptyState
                  title={m.initialTitle}
                  description={m.initialDescription}
                  tone="neutral"
                />
              </div>
            )}

          {!loading.value && !error.value && notFound.value && (
            <div class="student-detail__state-shell">
              <EmptyState
                title={m.notFoundTitle}
                description={m.notFoundDescription.replace(
                  '{term}',
                  appliedSearchTerm.value,
                )}
                tone="warning"
                actionLabel={m.actionCreate}
                onAction$={async () => await nav(ROUTES.STUDENTS_CREATE)}
              />
            </div>
          )}

          {!loading.value && currentStudent && (
            <article class="student-detail__result-card">
              <header class="student-detail__hero">
                <div class="student-detail__hero-avatar">
                  <Avatar
                    name={currentStudent.fullName}
                    src={resolveStudentPhotoUrl(currentStudent.photoUrl)}
                    size="xl"
                  />
                </div>

                <div class="student-detail__hero-copy">
                  <span class="student-detail__hero-eyebrow">{m.eyebrow}</span>
                  <h2>{currentStudent.fullName}</h2>
                  <p class="student-detail__hero-curp">{currentStudent.curp}</p>

                  <div class="student-detail__hero-badges">
                    <Badge
                      size="sm"
                      tone={
                        currentStudent.gender === 'M' ? 'danger' : 'primary'
                      }
                    >
                      {getGenderLabel(currentStudent.gender)}
                    </Badge>
                    <Badge size="sm" tone="neutral">
                      {currentStudent.age
                        ? `${currentStudent.age} ${m.yearsSuffix}`
                        : m.noData}
                    </Badge>
                    <Badge size="sm" tone={getStatusTone(currentStudent)}>
                      {currentStudent.statusDescription ??
                        (currentStudent.isActive
                          ? m.statusActive
                          : m.statusInactive)}
                    </Badge>
                    <Badge size="sm" tone="warning">
                      {currentStudent.currentSemester
                        ? `${currentStudent.currentSemester}${m.semesterSuffix}`
                        : m.noData}
                    </Badge>
                  </div>
                </div>
              </header>

              <div class="student-detail__body">
                <section class="student-detail__section">
                  <div class="student-detail__section-title">
                    {m.panelAcademicTitle}
                  </div>

                  <div class="student-detail__grid">
                    <div class="student-detail__field">
                      <span class="student-detail__field-label">
                        {m.fieldStudentCode}
                      </span>
                      <span class="student-detail__field-value student-detail__field-value--mono">
                        {currentStudent.studentCode ?? m.noData}
                      </span>
                    </div>

                    <div class="student-detail__field">
                      <span class="student-detail__field-label">
                        {m.fieldSemester}
                      </span>
                      <span class="student-detail__field-value">
                        {currentStudent.currentSemester ? (
                          <span class="student-detail__semester-display">
                            <span class="student-detail__semester-number">
                              {currentStudent.currentSemester}°
                            </span>
                            <span class="student-detail__semester-label">
                              semestre
                            </span>
                          </span>
                        ) : (
                          m.noData
                        )}
                      </span>
                    </div>

                    <div class="student-detail__field student-detail__field--full">
                      <span class="student-detail__field-label">
                        {m.fieldProgram}
                      </span>
                      <span class="student-detail__field-value">
                        {currentStudent.educationalProgram ?? m.noData}
                      </span>
                    </div>

                    <div class="student-detail__field">
                      <span class="student-detail__field-label">
                        {m.fieldAcademicDiscipline}
                      </span>
                      <span class="student-detail__field-value">
                        {currentStudent.academicDiscipline ?? m.noData}
                      </span>
                    </div>

                    <div class="student-detail__field">
                      <span class="student-detail__field-label">
                        {m.fieldEducationLevel}
                      </span>
                      <span class="student-detail__field-value">
                        {currentStudent.educationLevel ?? m.noData}
                      </span>
                    </div>

                    <div class="student-detail__field">
                      <span class="student-detail__field-label">
                        {m.fieldModality}
                      </span>
                      <span class="student-detail__field-value">
                        {currentStudent.modality ?? m.noData}
                      </span>
                    </div>

                    <div class="student-detail__field">
                      <span class="student-detail__field-label">
                        {m.fieldStudyPlan}
                      </span>
                      <span class="student-detail__field-value student-detail__field-value--mono">
                        {currentStudent.studyPlan ?? m.noData}
                      </span>
                    </div>

                    <div class="student-detail__field">
                      <span class="student-detail__field-label">
                        {m.fieldGeneration}
                      </span>
                      <span class="student-detail__field-value">
                        {currentStudent.educationCycle ??
                          currentStudent.generation ??
                          m.noData}
                      </span>
                    </div>

                    <div class="student-detail__field student-detail__field--full">
                      <span class="student-detail__field-label">
                        {m.fieldStatus}
                      </span>
                      <span class="student-detail__field-value">
                        <Badge size="sm" tone={getStatusTone(currentStudent)}>
                          {currentStudent.statusDescription ?? m.noData}
                        </Badge>
                      </span>
                    </div>
                  </div>
                </section>

                <section class="student-detail__section">
                  <div class="student-detail__section-title">
                    {m.panelContactTitle}
                  </div>

                  <div class="student-detail__grid">
                    <div class="student-detail__field student-detail__field--full">
                      <span class="student-detail__field-label">
                        {m.fieldEmail}
                      </span>
                      <span
                        class={[
                          'student-detail__field-value',
                          !currentStudent.institutionalMail
                            ? 'student-detail__field-value--empty'
                            : '',
                        ].join(' ')}
                      >
                        {currentStudent.institutionalMail ?? m.noEmail}
                      </span>
                    </div>

                    <div class="student-detail__field">
                      <span class="student-detail__field-label">
                        {m.fieldPhone}
                      </span>
                      <span class="student-detail__field-value student-detail__field-value--mono">
                        {formatPhone(currentStudent.phone)}
                      </span>
                    </div>

                    <div class="student-detail__field">
                      <span class="student-detail__field-label">
                        {m.fieldPersonId}
                      </span>
                      <span class="student-detail__field-value student-detail__field-value--mono">
                        #{currentStudent.personId}
                      </span>
                    </div>
                  </div>
                </section>

                <section class="student-detail__section">
                  <div class="student-detail__section-title">
                    {m.panelBirthTitle}
                  </div>

                  <div class="student-detail__grid">
                    <div class="student-detail__field">
                      <span class="student-detail__field-label">
                        {m.fieldBirthState}
                      </span>
                      <span class="student-detail__field-value">
                        {currentStudent.birthState ?? m.noData}
                      </span>
                    </div>

                    <div class="student-detail__field">
                      <span class="student-detail__field-label">
                        {m.fieldBirthMunicipality}
                      </span>
                      <span class="student-detail__field-value">
                        {currentStudent.birthMunicipality ?? m.noData}
                      </span>
                    </div>
                  </div>
                </section>
              </div>

              <div class="student-detail__actions">
                <Button
                  iconLeft="edit"
                  onClick$={async () =>
                    await nav(`${ROUTES.STUDENTS_EDIT}?id=${currentStudent.id}`)
                  }
                >
                  {m.actionEdit}
                </Button>

                <Button
                  variant="ghost"
                  iconLeft="view"
                  onClick$={async () => {
                    student.value = null;
                    selectionMode.value = true;
                    searched.value = false;
                    notFound.value = false;
                    error.value = '';
                    searchTerm.value = '';
                    appliedSearchTerm.value = '';
                    helperMessage.value = m.searchHint;
                    await nav(ROUTES.STUDENTS_DETAIL);
                  }}
                >
                  {m.actionViewAnother}
                </Button>
              </div>
            </article>
          )}
        </div>
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Ver estudiante`,
};

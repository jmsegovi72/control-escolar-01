import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useLocation, useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { PersonSearchPanel } from '~/components/persons';
import { appConfig } from '~/config/app.config';
import { ENV } from '~/config/env';
import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
import { personService } from '~/services/person/person.service';
import type { ViewPerson } from '~/types/person.types';
import { ActionHeader, Avatar, Badge, Button, Panel } from '~/ui';
import { normalizeError } from '~/utils/api-error';
import { personsWorkflow } from '~/utils/persons-workflow';
import './detail.css';

const DEFAULT_PERSON_AVATAR = '/avatars/user-default.svg';

const resolvePersonPhotoUrl = (photoUrl: string | null | undefined): string => {
  if (!photoUrl) return DEFAULT_PERSON_AVATAR;
  if (photoUrl.startsWith('http')) return photoUrl;
  const apiBase = ENV.API_URL.replace(/\/sices\/v\d+$/, '');
  return `${apiBase}/${photoUrl.replace(/^\/+/, '')}`;
};

const getAgeFromBirthDate = (birthDate?: string) => {
  if (!birthDate) return null;

  const normalized = birthDate.includes('/')
    ? birthDate.split('/').reverse().join('-')
    : birthDate;
  const parsed = new Date(`${normalized}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - parsed.getFullYear();
  const monthDiff = today.getMonth() - parsed.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < parsed.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

const getNationalityLabel = (nationality?: string) => {
  if (nationality === 'M' || nationality === 'MX') {
    return m.detail.nationalityMexican;
  }

  if (nationality === 'NE') {
    return m.detail.nationalityForeigner;
  }

  return nationality || m.detail.noData;
};

const m = messages.persons;

export default component$(() => {
  const nav = useNavigate();
  const location = useLocation();
  const person = useSignal<ViewPerson | null>(null);
  const loading = useSignal(true);
  const error = useSignal('');
  const returnPath = useSignal<string>(ROUTES.PERSONS);
  const selectionMode = useSignal(false);

  useVisibleTask$(async ({ track }) => {
    const idParam = track(() => location.url.searchParams.get('id'));
    const sourceParam = track(() => location.url.searchParams.get('source'));

    loading.value = true;
    error.value = '';
    returnPath.value = ROUTES.PERSONS;
    selectionMode.value = false;

    const id = idParam ? Number(idParam) : 0;
    const selectedPerson = personsWorkflow.getSelectedPerson();

    if (
      id &&
      sourceParam === 'table' &&
      selectedPerson &&
      selectedPerson.id === id
    ) {
      person.value = {
        ...selectedPerson,
        fullName: selectedPerson.fullName,
        curp: selectedPerson.curp,
        gender: selectedPerson.gender,
        birthDate: selectedPerson.birthDate ?? '',
        age: null,
        nationality: selectedPerson.nationality ?? '',
        birthState: selectedPerson.birthState ?? null,
        municipalityId: null,
        birthMunicipality: selectedPerson.birthMunicipality ?? null,
        phone: selectedPerson.phone,
        personalEmail: selectedPerson.personalEmail,
        rfc: selectedPerson.rfc ?? null,
        photoUrl: selectedPerson.photoUrl ?? null,
      } as ViewPerson;
      returnPath.value = personsWorkflow.getReturnPath();
      loading.value = false;
      return;
    }

    if (!id) {
      person.value = null;
      selectionMode.value = true;
      loading.value = false;
      return;
    }

    try {
      person.value = await personService.findOne(id);
    } catch (err) {
      person.value = null;
      error.value = normalizeError(
        err,
        messages.errors.loadPersonDetailFailed,
      ).message;
    } finally {
      loading.value = false;
    }
  });

  const goBack$ = $(async () => {
    await nav(returnPath.value);
  });

  const openManualDetail$ = $(async (personId: number) => {
    personsWorkflow.clear();
    await nav(`${ROUTES.PERSONS_DETAIL}?id=${personId}`);
  });

  const currentPerson = person.value;
  const age = getAgeFromBirthDate(currentPerson?.birthDate);

  return (
    <AuthenticatedShell
      eyebrow={m.detail.eyebrow}
      title={m.detail.title}
      description={m.detail.description}
      meta={m.detail.meta}
      allowedUserTypes={['SUPER', 'CE']}
      accessDeniedDescription={m.detail.accessDenied}
      fullWidth
    >
      <ActionHeader
        q:slot="hub-header"
        title={m.detail.title}
        onBack$={goBack$}
      />

      <div class="person-detail-page">
        <div class="person-detail__content">
          {loading.value && (
            <Panel
              title={m.common.loadingPanelTitle}
              description={m.common.loadingPanelDescription}
            >
              <div class="person-detail__loading" />
            </Panel>
          )}

          {!loading.value && error.value && (
            <Panel
              eyebrow={m.common.errorToastTitle}
              title={m.detail.errorTitle}
              description={error.value}
            >
              <div class="person-detail__actions">
                <Button variant="secondary" iconLeft="back" onClick$={goBack$}>
                  {m.common.backLabel}
                </Button>
                <Button
                  iconLeft="search"
                  onClick$={async () => await nav(ROUTES.PERSONS_SEARCH)}
                >
                  {m.common.goToSearchAction}
                </Button>
              </div>
            </Panel>
          )}

          {!loading.value && selectionMode.value && !currentPerson && (
            <div class="person-detail__search-shell">
              <PersonSearchPanel
                title={m.common.searchPersonTitle}
                description={m.detail.selectionDescription}
                fieldHint={m.common.fieldPersonHint}
                noResultsMessage={m.detail.noResultsCriteria}
                onSelect$={openManualDetail$}
              />
            </div>
          )}

          {!loading.value && currentPerson && (
            <article class="person-detail__result-card">
              <header class="person-detail__result-header">
                <Avatar
                  src={resolvePersonPhotoUrl(currentPerson.photoUrl)}
                  name={currentPerson.fullName}
                  size="xl"
                />

                <div class="person-detail__result-identity">
                  <h2>{currentPerson.fullName}</h2>
                  <p>{currentPerson.curp}</p>
                  <div class="person-detail__result-badges">
                    <Badge
                      tone={
                        currentPerson.gender === 'H' ? 'primary' : 'neutral'
                      }
                      class="person-detail__badge person-detail__badge--gender"
                    >
                      {currentPerson.gender === 'H'
                        ? m.detail.genderMale
                        : m.detail.genderFemale}
                    </Badge>
                    {age !== null && (
                      <Badge
                        tone="neutral"
                        class="person-detail__badge person-detail__badge--age"
                      >
                        {age} anos
                      </Badge>
                    )}
                  </div>
                </div>
              </header>

              <div class="person-detail__result-body">
                <section class="person-detail__section">
                  <div class="person-detail__section-title">
                    {m.detail.panelPersonalTitle}
                  </div>
                  <div class="person-detail__section-grid">
                    <div class="person-detail__field person-detail__field--full">
                      <span class="person-detail__field-label">
                        {m.detail.fieldCurp}
                      </span>
                      <span class="person-detail__field-value person-detail__field-value--mono">
                        {currentPerson.curp}
                      </span>
                    </div>
                    <div class="person-detail__field">
                      <span class="person-detail__field-label">
                        {m.detail.fieldRfc}
                      </span>
                      <span
                        class={[
                          'person-detail__field-value',
                          currentPerson.rfc
                            ? 'person-detail__field-value--mono'
                            : 'person-detail__field-value--empty',
                        ]}
                      >
                        {currentPerson.rfc || 'Sin RFC'}
                      </span>
                    </div>
                    <div class="person-detail__field">
                      <span class="person-detail__field-label">
                        {m.detail.fieldNationality}
                      </span>
                      <span class="person-detail__field-value">
                        {getNationalityLabel(currentPerson.nationality)}
                      </span>
                    </div>
                    <div class="person-detail__field">
                      <span class="person-detail__field-label">
                        {m.detail.fieldGender}
                      </span>
                      <span class="person-detail__field-value">
                        {currentPerson.gender === 'H'
                          ? m.detail.genderMale
                          : m.detail.genderFemale}
                      </span>
                    </div>
                    <div class="person-detail__field">
                      <span class="person-detail__field-label">
                        {m.detail.fieldBirthDate}
                      </span>
                      <span
                        class={[
                          'person-detail__field-value',
                          currentPerson.birthDate
                            ? ''
                            : 'person-detail__field-value--empty',
                        ]}
                      >
                        {currentPerson.birthDate || m.detail.noData}
                      </span>
                    </div>
                  </div>
                </section>

                <section class="person-detail__section">
                  <div class="person-detail__section-title">
                    {m.detail.panelContactTitle}
                  </div>
                  <div class="person-detail__section-grid">
                    <div class="person-detail__field">
                      <span class="person-detail__field-label">
                        {m.detail.fieldPhone}
                      </span>
                      <span
                        class={[
                          'person-detail__field-value',
                          currentPerson.phone
                            ? ''
                            : 'person-detail__field-value--empty',
                        ]}
                      >
                        {currentPerson.phone || m.detail.noData}
                      </span>
                    </div>
                    <div class="person-detail__field">
                      <span class="person-detail__field-label">
                        {m.detail.fieldEmail}
                      </span>
                      <span
                        class={[
                          'person-detail__field-value',
                          currentPerson.personalEmail
                            ? ''
                            : 'person-detail__field-value--empty',
                        ]}
                      >
                        {currentPerson.personalEmail || m.detail.noData}
                      </span>
                    </div>
                  </div>
                </section>

                {(currentPerson.birthMunicipality ||
                  currentPerson.birthState) && (
                  <section class="person-detail__section">
                    <div class="person-detail__section-title">
                      {m.detail.panelLocationTitle}
                    </div>
                    <div class="person-detail__section-grid">
                      <div class="person-detail__field">
                        <span class="person-detail__field-label">
                          {m.detail.fieldMunicipality}
                        </span>
                        <span
                          class={[
                            'person-detail__field-value',
                            currentPerson.birthMunicipality
                              ? ''
                              : 'person-detail__field-value--empty',
                          ]}
                        >
                          {currentPerson.birthMunicipality || m.detail.noData}
                        </span>
                      </div>
                      <div class="person-detail__field">
                        <span class="person-detail__field-label">
                          {m.detail.fieldState}
                        </span>
                        <span
                          class={[
                            'person-detail__field-value',
                            currentPerson.birthState
                              ? ''
                              : 'person-detail__field-value--empty',
                          ]}
                        >
                          {currentPerson.birthState || m.detail.noData}
                        </span>
                      </div>
                    </div>
                  </section>
                )}
              </div>

              <footer class="person-detail__result-actions">
                <Button
                  variant="ghost"
                  iconLeft="search"
                  onClick$={async () => await nav(ROUTES.PERSONS_DETAIL)}
                >
                  {m.common.searchOtherAction}
                </Button>
                <Button
                  iconLeft="edit"
                  onClick$={async () =>
                    await nav(`${ROUTES.PERSONS_EDIT}?id=${currentPerson.id}`)
                  }
                >
                  {m.detail.actionEdit}
                </Button>
              </footer>
            </article>
          )}
        </div>
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Detalle de persona`,
};

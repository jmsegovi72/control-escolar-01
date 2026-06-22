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
import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
import { demographicService } from '~/services/demographic/demographic.service';
import { personService } from '~/services/person/person.service';
import type { ViewDemographic } from '~/types/demographic.types';
import type { PersonListItem } from '~/types/person.types';
import {
  ActionHeader,
  Badge,
  Button,
  EmptyState,
  Panel,
  SelectionStep,
  Toast,
} from '~/ui';
import { AppIcon } from '~/ui/icons';
import { normalizeError } from '~/utils/api-error';
import { demographicsWorkflow } from '~/utils/demographics-workflow';
import './detail.css';

const m = messages.demographics.detail;
const me = messages.demographics.edit;
const mc = messages.demographics.create;

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
};

const genderLabel = (gender: string) =>
  gender === 'H'
    ? 'Masculino'
    : gender === 'M'
      ? 'Femenino'
      : 'No especificado';

const genderIconIntent = (gender: string) =>
  gender === 'H' ? 'gender-male' : gender === 'M' ? 'gender-female' : 'person';

export default component$(() => {
  const nav = useNavigate();
  const location = useLocation();

  const demographic = useSignal<ViewDemographic | null>(null);
  const loading = useSignal(true);
  const error = useSignal('');
  const returnPath = useSignal<string>(ROUTES.DEMOGRAPHICS);
  const selectionMode = useSignal(false);
  const noDemographicForPerson = useSignal('');

  const personQuery = useSignal('');
  const personResults = useSignal<PersonListItem[]>([]);
  const searchingPerson = useSignal(false);

  useVisibleTask$(async ({ track }) => {
    const idParam = track(() => location.url.searchParams.get('id'));

    loading.value = true;
    error.value = '';
    demographic.value = null;
    returnPath.value = ROUTES.DEMOGRAPHICS;
    selectionMode.value = false;
    noDemographicForPerson.value = '';
    personQuery.value = '';
    personResults.value = [];
    searchingPerson.value = false;

    const id = idParam ? Number(idParam) : 0;
    returnPath.value = demographicsWorkflow.getReturnPath();

    if (!id) {
      selectionMode.value = true;
      loading.value = false;
      return;
    }

    try {
      const found = await demographicService.findOne(id);
      if (!found) {
        error.value = messages.errors.notFound;
        return;
      }
      demographic.value = found;
    } catch (err) {
      error.value = normalizeError(
        err,
        'No se pudo cargar la demografía.',
      ).message;
    } finally {
      loading.value = false;
    }
  });

  useTask$(async ({ track }) => {
    const query = track(() => personQuery.value.trim());
    if (query.length < 3) {
      personResults.value = [];
      return;
    }
    searchingPerson.value = true;
    try {
      const res = await personService.findMany({
        searchTerm: query,
        hasDemographic: true,
        limit: 8,
        page: 1,
      });
      personResults.value = res.data;
    } catch {
      personResults.value = [];
    } finally {
      searchingPerson.value = false;
    }
  });

  const goBack$ = $(async () => {
    if (returnPath.value !== ROUTES.DEMOGRAPHICS) {
      await nav(returnPath.value);
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    await nav(ROUTES.DEMOGRAPHICS);
  });

  const current = demographic.value;

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

      <div class="demographic-detail-page">
        <div class="demographic-detail__content">
          {loading.value && (
            <Panel title={m.loadingTitle} description={m.loadingDescription}>
              <div class="demographic-detail__loading" />
            </Panel>
          )}

          {!loading.value && error.value && (
            <Toast tone="danger" title="Error" description={error.value} />
          )}

          {!loading.value &&
            selectionMode.value &&
            !noDemographicForPerson.value && (
              <div class="demographic-detail__search-shell">
                <SelectionStep
                  title={m.selectionTitle}
                  description={m.selectionDescription}
                  fieldLabel={mc.personSearchLabel}
                  fieldHint={m.fieldPersonHint}
                  placeholder={me.personSearchPlaceholder}
                  emptyMessage={m.noResultsCriteria}
                  query={personQuery.value}
                  options={personResults.value.map((p) => ({
                    value: String(p.id),
                    label: p.fullName,
                    description: p.curp,
                  }))}
                  loading={searchingPerson.value}
                  onQueryChange$={(q) => {
                    personQuery.value = q;
                    noDemographicForPerson.value = '';
                  }}
                  onSelect$={$(async (option) => {
                    const person = personResults.value.find(
                      (p) => p.id === Number(option.value),
                    );
                    if (!person) return;
                    const found = await demographicService.findOne(person.curp);
                    if (found) {
                      await nav(`${ROUTES.DEMOGRAPHICS_DETAIL}?id=${found.id}`);
                    } else {
                      noDemographicForPerson.value = person.fullName;
                    }
                  })}
                />
              </div>
            )}

          {!loading.value && noDemographicForPerson.value && (
            <div class="demographic-detail__search-shell">
              <EmptyState
                title={m.notFoundTitle}
                description={m.notFoundDescription.replace(
                  '{name}',
                  noDemographicForPerson.value,
                )}
                tone="warning"
              />
            </div>
          )}

          {!loading.value && current && (
            <article class="demographic-detail__result-card">
              <header class="demographic-detail__result-header">
                <div class="demographic-detail__avatar">
                  {initials(current.fullName)}
                </div>
                <div class="demographic-detail__identity">
                  <span class="demographic-detail__eyebrow">
                    {m.resultEyebrow}
                  </span>
                  <h2>{current.fullName}</h2>
                  <div class="demographic-detail__curp">{current.curp}</div>
                  <div class="demographic-detail__meta">
                    <Badge
                      tone="neutral"
                      size="sm"
                      class={`demographic-detail__badge ${
                        current.gender === 'H'
                          ? 'demographic-detail__badge--gender-m'
                          : current.gender === 'M'
                            ? 'demographic-detail__badge--gender-f'
                            : ''
                      }`}
                    >
                      <AppIcon
                        intent={genderIconIntent(current.gender)}
                        size="xs"
                      />
                      {genderLabel(current.gender)}
                    </Badge>
                    <Badge
                      tone="neutral"
                      size="sm"
                      class="demographic-detail__badge"
                    >
                      <AppIcon intent="schedule" size="xs" />
                      {current.age ?? m.resultNoValue} años
                    </Badge>
                  </div>
                  <p class="demographic-detail__id">
                    {m.resultRecordId}: {current.id} · {m.resultPersonId}:{' '}
                    {current.personId}
                  </p>
                </div>
              </header>

              <section class="demographic-detail__section">
                <div class="demographic-detail__section-title">
                  {m.sectionDemographicTitle}
                </div>
                <div class="demographic-detail__grid">
                  <div class="demographic-detail__field">
                    <span class="demographic-detail__field-label">
                      {m.fieldMaritalStatus}
                    </span>
                    <span
                      class={`demographic-detail__field-value${current.maritalStatus ? '' : ' demographic-detail__field-value--empty'}`}
                    >
                      {current.maritalStatus || m.resultNoValue}
                    </span>
                  </div>
                  <div class="demographic-detail__field">
                    <span class="demographic-detail__field-label">
                      {m.fieldSpecialCondition}
                    </span>
                    <span
                      class={`demographic-detail__field-value${
                        current.specialCondition &&
                        current.specialCondition !== 'Ninguna'
                          ? ''
                          : ' demographic-detail__field-value--empty'
                      }`}
                    >
                      {current.specialCondition === 'Ninguna'
                        ? m.resultNoValue
                        : (current.specialCondition ?? m.resultNoValue)}
                    </span>
                  </div>
                  <div class="demographic-detail__field">
                    <span class="demographic-detail__field-label">
                      {m.fieldIndigenous}
                    </span>
                    <span
                      class={`demographic-detail__bool ${
                        current.isIndigenous
                          ? 'demographic-detail__bool--yes'
                          : 'demographic-detail__bool--no'
                      }`}
                    >
                      <AppIcon
                        intent={current.isIndigenous ? 'check' : 'close'}
                        size="xs"
                      />
                      {current.isIndigenous ? m.yesLabel : m.noLabel}
                    </span>
                  </div>
                  <div class="demographic-detail__field">
                    <span class="demographic-detail__field-label">
                      {m.fieldAfroDescendant}
                    </span>
                    <span
                      class={`demographic-detail__bool ${
                        current.isAfroDescendant
                          ? 'demographic-detail__bool--yes'
                          : 'demographic-detail__bool--no'
                      }`}
                    >
                      <AppIcon
                        intent={current.isAfroDescendant ? 'check' : 'close'}
                        size="xs"
                      />
                      {current.isAfroDescendant ? m.yesLabel : m.noLabel}
                    </span>
                  </div>
                  <div class="demographic-detail__field">
                    <span class="demographic-detail__field-label">
                      {m.fieldIndigenousLanguage}
                    </span>
                    <span
                      class={`demographic-detail__field-value${
                        current.indigenousLanguage &&
                        current.indigenousLanguage !== 'Ninguna' &&
                        current.indigenousLanguage !== 'No aplica'
                          ? ''
                          : ' demographic-detail__field-value--empty'
                      }`}
                    >
                      {current.indigenousLanguage === 'Ninguna' ||
                      current.indigenousLanguage === 'No aplica'
                        ? m.resultNoValue
                        : (current.indigenousLanguage ?? m.resultNoValue)}
                    </span>
                  </div>
                  <div class="demographic-detail__field">
                    <span class="demographic-detail__field-label">
                      {m.fieldForeignLanguage}
                    </span>
                    <span
                      class={`demographic-detail__field-value${
                        current.foreignLanguage &&
                        current.foreignLanguage !== 'Ninguno'
                          ? ''
                          : ' demographic-detail__field-value--empty'
                      }`}
                    >
                      {current.foreignLanguage === 'Ninguno'
                        ? m.resultNoValue
                        : (current.foreignLanguage ?? m.resultNoValue)}
                    </span>
                  </div>
                </div>
              </section>

              <div class="demographic-detail__actions">
                <Button
                  variant="ghost"
                  iconLeft="edit"
                  onClick$={async () => {
                    await nav(`${ROUTES.DEMOGRAPHICS_EDIT}?id=${current.id}`);
                  }}
                >
                  {m.actionEdit}
                </Button>
                <Button
                  iconLeft="view"
                  onClick$={async () => {
                    await nav(ROUTES.DEMOGRAPHICS_DETAIL);
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
  title: `${appConfig.name} | Ver demografía`,
};

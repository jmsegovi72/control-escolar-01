import {
  $,
  component$,
  useComputed$,
  useSignal,
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
import type {
  UpdateDemographicDto,
  ViewDemographic,
} from '~/types/demographic.types';
import type { PersonListItem } from '~/types/person.types';
import {
  ActionHeader,
  Button,
  Field,
  Panel,
  Select,
  SelectionStep,
  Toast,
} from '~/ui';
import { EditResult, EditResultRow } from '~/ui/composed/EditResult';
import { AppIcon } from '~/ui/icons';
import { normalizeError } from '~/utils/api-error';
import { demographicsWorkflow } from '~/utils/demographics-workflow';
import './edit.css';

const m = messages.demographics.edit;
const mc = messages.demographics.create;
const mo = m.options;

const maritalStatusOptions = [
  { value: '', label: m.fieldMaritalStatusPlaceholder },
  { value: '1', label: mo.maritalStatuses.single },
  { value: '2', label: mo.maritalStatuses.married },
  { value: '3', label: mo.maritalStatuses.divorced },
  { value: '4', label: mo.maritalStatuses.widowed },
  { value: '5', label: mo.maritalStatuses.commonLaw },
  { value: '6', label: mo.maritalStatuses.separated },
  { value: '0', label: mo.maritalStatuses.unspecified },
];

const indigenousLanguageOptions = [
  { value: '', label: m.fieldIndigenousLanguagePlaceholder },
  { value: '1', label: mo.indigenousLanguages.none },
  { value: '2', label: mo.indigenousLanguages.nahuatl },
  { value: '3', label: mo.indigenousLanguages.maya },
  { value: '4', label: mo.indigenousLanguages.zapoteco },
  { value: '5', label: mo.indigenousLanguages.mixteco },
  { value: '6', label: mo.indigenousLanguages.otomi },
  { value: '7', label: mo.indigenousLanguages.totonaca },
  { value: '8', label: mo.indigenousLanguages.tzotzil },
  { value: '9', label: mo.indigenousLanguages.chol },
  { value: '10', label: mo.indigenousLanguages.mazahua },
];

const foreignLanguageOptions = [
  { value: '', label: m.fieldForeignLanguagePlaceholder },
  { value: '1', label: mo.foreignLanguages.none },
  { value: '2', label: mo.foreignLanguages.english },
  { value: '3', label: mo.foreignLanguages.french },
  { value: '4', label: mo.foreignLanguages.german },
  { value: '5', label: mo.foreignLanguages.portuguese },
  { value: '6', label: mo.foreignLanguages.italian },
  { value: '7', label: mo.foreignLanguages.mandarin },
  { value: '8', label: mo.foreignLanguages.japanese },
];

const specialConditionOptions = [
  { value: '', label: m.fieldSpecialConditionPlaceholder },
  { value: '1', label: mo.specialConditions.none },
  { value: '2', label: mo.specialConditions.visual },
  { value: '3', label: mo.specialConditions.hearing },
  { value: '4', label: mo.specialConditions.motor },
  { value: '5', label: mo.specialConditions.intellectual },
  { value: '6', label: mo.specialConditions.psychosocial },
];

const MARITAL_STATUS_ID_BY_LABEL: Record<string, string> = {
  'Soltero(a)': '1',
  'Soltero/a': '1',
  'Casado(a)': '2',
  'Casado/a': '2',
  'Divorciado(a)': '3',
  'Divorciado/a': '3',
  'Viudo(a)': '4',
  'Viudo/a': '4',
  'Unión libre': '5',
  'Union libre': '5',
  'Separado(a)': '6',
  'Separado/a': '6',
  'No especificado': '0',
};

const INDIGENOUS_LANGUAGE_ID_BY_LABEL: Record<string, string> = {
  Ninguna: '1',
  'No aplica': '1',
  Náhuatl: '2',
  Maya: '3',
  Zapoteco: '4',
  Mixteco: '5',
  Otomí: '6',
  Totonaca: '7',
  Tzotzil: '8',
  Chol: '9',
  Mazahua: '10',
};

const FOREIGN_LANGUAGE_ID_BY_LABEL: Record<string, string> = {
  Ninguno: '1',
  Inglés: '2',
  Francés: '3',
  Alemán: '4',
  Portugués: '5',
  Italiano: '6',
  Mandarín: '7',
  Japonés: '8',
};

const SPECIAL_CONDITION_ID_BY_LABEL: Record<string, string> = {
  Ninguna: '1',
  'Discapacidad visual': '2',
  'Discapacidad auditiva': '3',
  'Discapacidad motriz': '4',
  'Discapacidad intelectual': '5',
  'Discapacidad psicosocial': '6',
};

export default component$(() => {
  const nav = useNavigate();
  const location = useLocation();

  const demographic = useSignal<ViewDemographic | null>(null);
  const loading = useSignal(true);
  const saving = useSignal(false);
  const success = useSignal(false);
  const selectionMode = useSignal(false);
  const error = useSignal('');
  const personQuery = useSignal('');
  const personResults = useSignal<PersonListItem[]>([]);
  const searchingPerson = useSignal(false);
  const noDemographicForPerson = useSignal('');
  const returnPath = useSignal<string>(ROUTES.DEMOGRAPHICS);

  const maritalStatusId = useSignal('');
  const indigenousLanguageId = useSignal('');
  const foreignLanguageId = useSignal('');
  const specialConditionId = useSignal('');
  const isIndigenous = useSignal(false);
  const isAfroDescendant = useSignal(false);

  useVisibleTask$(async ({ track }) => {
    const idParam = track(() => location.url.searchParams.get('id'));

    loading.value = true;
    error.value = '';
    demographic.value = null;
    selectionMode.value = false;
    noDemographicForPerson.value = '';
    success.value = false;
    personQuery.value = '';
    personResults.value = [];
    searchingPerson.value = false;
    returnPath.value = demographicsWorkflow.getReturnPath();
    maritalStatusId.value = '';
    indigenousLanguageId.value = '';
    foreignLanguageId.value = '';
    specialConditionId.value = '';
    isIndigenous.value = false;
    isAfroDescendant.value = false;

    const id = idParam ? Number(idParam) : 0;

    if (!id) {
      selectionMode.value = true;
      loading.value = false;
      return;
    }

    try {
      const found = await demographicService.findOne(id);

      if (!found) {
        error.value = messages.errors.notFound;
        loading.value = false;
        return;
      }

      demographic.value = found;
      maritalStatusId.value = found.maritalStatus
        ? (MARITAL_STATUS_ID_BY_LABEL[found.maritalStatus] ?? '')
        : '';
      indigenousLanguageId.value = found.indigenousLanguage
        ? (INDIGENOUS_LANGUAGE_ID_BY_LABEL[found.indigenousLanguage] ?? '')
        : '';
      foreignLanguageId.value = found.foreignLanguage
        ? (FOREIGN_LANGUAGE_ID_BY_LABEL[found.foreignLanguage] ?? '')
        : '';
      specialConditionId.value = found.specialCondition
        ? (SPECIAL_CONDITION_ID_BY_LABEL[found.specialCondition] ?? '')
        : '';
      isIndigenous.value = found.isIndigenous;
      isAfroDescendant.value = found.isAfroDescendant;
    } catch (err) {
      error.value = normalizeError(err, m.saveError).message;
    } finally {
      loading.value = false;
    }
  });

  useVisibleTask$(async ({ track }) => {
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

  const hasChanges = useComputed$(() => {
    const current = demographic.value;
    if (!current) return false;

    return (
      maritalStatusId.value !==
        (current.maritalStatus
          ? (MARITAL_STATUS_ID_BY_LABEL[current.maritalStatus] ?? '')
          : '') ||
      indigenousLanguageId.value !==
        (current.indigenousLanguage
          ? (INDIGENOUS_LANGUAGE_ID_BY_LABEL[current.indigenousLanguage] ?? '')
          : '') ||
      foreignLanguageId.value !==
        (current.foreignLanguage
          ? (FOREIGN_LANGUAGE_ID_BY_LABEL[current.foreignLanguage] ?? '')
          : '') ||
      specialConditionId.value !==
        (current.specialCondition
          ? (SPECIAL_CONDITION_ID_BY_LABEL[current.specialCondition] ?? '')
          : '') ||
      isIndigenous.value !== current.isIndigenous ||
      isAfroDescendant.value !== current.isAfroDescendant
    );
  });

  const saveChanges$ = $(async () => {
    const current = demographic.value;
    if (!current) return;

    error.value = '';

    const changes: UpdateDemographicDto = {};

    const currentMaritalStatusId = current.maritalStatus
      ? (MARITAL_STATUS_ID_BY_LABEL[current.maritalStatus] ?? '')
      : '';
    const currentIndigenousLanguageId = current.indigenousLanguage
      ? (INDIGENOUS_LANGUAGE_ID_BY_LABEL[current.indigenousLanguage] ?? '')
      : '';
    const currentForeignLanguageId = current.foreignLanguage
      ? (FOREIGN_LANGUAGE_ID_BY_LABEL[current.foreignLanguage] ?? '')
      : '';
    const currentSpecialConditionId = current.specialCondition
      ? (SPECIAL_CONDITION_ID_BY_LABEL[current.specialCondition] ?? '')
      : '';

    if (maritalStatusId.value !== currentMaritalStatusId) {
      changes.maritalStatusId = maritalStatusId.value
        ? Number(maritalStatusId.value)
        : undefined;
    }
    if (indigenousLanguageId.value !== currentIndigenousLanguageId) {
      changes.indigenousLangId = indigenousLanguageId.value
        ? Number(indigenousLanguageId.value)
        : undefined;
    }
    if (foreignLanguageId.value !== currentForeignLanguageId) {
      changes.foreignLangId = foreignLanguageId.value
        ? Number(foreignLanguageId.value)
        : undefined;
    }
    if (specialConditionId.value !== currentSpecialConditionId) {
      changes.specialConditionId = specialConditionId.value
        ? Number(specialConditionId.value)
        : undefined;
    }
    if (isIndigenous.value !== current.isIndigenous) {
      changes.isIndigenous = isIndigenous.value;
    }
    if (isAfroDescendant.value !== current.isAfroDescendant) {
      changes.isAfroDescendant = isAfroDescendant.value;
    }

    if (Object.keys(changes).length === 0) {
      error.value = m.noChangesMessage;
      return;
    }

    saving.value = true;
    try {
      const updated = await demographicService.update(current.id, changes);
      demographic.value = updated;
      success.value = true;
    } catch (err) {
      error.value = normalizeError(err, m.saveError).message;
    } finally {
      saving.value = false;
    }
  });

  const currentDemographic = demographic.value;

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

      <div class="edit-demographics-page">
        <div class="edit-demographics-page__content">
          {error.value && (
            <Toast
              tone="danger"
              title={m.errorToastTitle}
              description={error.value}
            />
          )}

          {!loading.value && success.value && currentDemographic && (
            <div class="edit-demographics-layout">
              <EditResult
                eyebrow={m.successResultEyebrow}
                title={m.successResultTitle}
                description={m.successResultDescription}
              >
                <EditResultRow
                  label={m.resultPersonLabel}
                  value={currentDemographic.fullName}
                />
                <EditResultRow
                  label={m.resultCurpLabel}
                  value={currentDemographic.curp}
                />
                <EditResultRow
                  label={m.resultAgeLabel}
                  value={currentDemographic.age}
                  fallback={m.noDataLabel}
                />
                <EditResultRow
                  label={m.resultMaritalStatusLabel}
                  value={currentDemographic.maritalStatus}
                  fallback={m.noDataLabel}
                />
                <EditResultRow
                  label={m.resultIndigenousSelfLabel}
                  value={
                    currentDemographic.isIndigenous ? m.yesLabel : m.noLabel
                  }
                />
                <EditResultRow
                  label={m.resultAfroSelfLabel}
                  value={
                    currentDemographic.isAfroDescendant ? m.yesLabel : m.noLabel
                  }
                />
                <EditResultRow
                  label={m.resultIndigenousLanguageLabel}
                  value={currentDemographic.indigenousLanguage}
                  fallback={m.noDataLabel}
                />
                <EditResultRow
                  label={m.resultForeignLanguageLabel}
                  value={currentDemographic.foreignLanguage}
                  fallback={m.noDataLabel}
                />
                <EditResultRow
                  label={m.resultSpecialConditionLabel}
                  value={currentDemographic.specialCondition}
                  fallback={m.noDataLabel}
                />

                <div q:slot="actions">
                  <Button
                    variant="ghost"
                    iconLeft="view"
                    onClick$={async () => {
                      await nav(ROUTES.DEMOGRAPHICS_EDIT);
                    }}
                  >
                    {m.successResultViewAnother}
                  </Button>
                  <Button iconRight="chevron-right" onClick$={goBack$}>
                    {m.successResultFinish}
                  </Button>
                </div>
              </EditResult>
            </div>
          )}

          {loading.value && (
            <Panel title={m.loadingTitle} description={m.loadingDescription}>
              <div class="edit-demographics__loading" />
            </Panel>
          )}

          {!loading.value && selectionMode.value && (
            <div class="edit-demographics-search-shell">
              <SelectionStep
                title={m.selectionTitle}
                description={m.selectionDescription}
                fieldLabel={mc.personSearchLabel}
                fieldHint={m.fieldPersonHint}
                placeholder={m.personSearchPlaceholder}
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
                    await nav(`${ROUTES.DEMOGRAPHICS_EDIT}?id=${found.id}`);
                  } else {
                    noDemographicForPerson.value = person.fullName;
                  }
                })}
              />

              {noDemographicForPerson.value && (
                <Toast
                  tone="warning"
                  title={noDemographicForPerson.value}
                  description={m.noDemographicFound}
                />
              )}
            </div>
          )}

          {!loading.value && !success.value && currentDemographic && (
            <div class="edit-demographics-layout">
              <Panel
                title={m.panelPersonTitle}
                description={m.panelPersonDescription}
              >
                <div class="edit-demographics-person">
                  <div
                    class="edit-demographics-person__icon"
                    aria-hidden="true"
                  >
                    <AppIcon intent="person" size="md" />
                  </div>
                  <div class="edit-demographics-person__info">
                    <strong>{currentDemographic.fullName}</strong>
                    <span>{currentDemographic.curp}</span>
                    <small>ID demografía: {currentDemographic.id}</small>
                  </div>
                </div>
              </Panel>

              <Panel
                title={m.panelDataTitle}
                description={m.panelDataDescription}
                density="compact"
              >
                <div q:slot="leading" class="edit-demographics-panel__icon">
                  <AppIcon intent="dashboard" size="md" />
                </div>

                <div class="edit-demographics-form">
                  <Field label={m.fieldMaritalStatusLabel} optional>
                    <Select
                      value={maritalStatusId.value}
                      options={maritalStatusOptions}
                      onChange$={(value) => {
                        maritalStatusId.value = value;
                      }}
                    />
                  </Field>

                  <div class="edit-demographics-divider">
                    <span class="edit-demographics-divider__line" />
                    <span class="edit-demographics-divider__label">
                      {m.sectionSelfIdentification}
                    </span>
                    <span class="edit-demographics-divider__line" />
                  </div>

                  <button
                    type="button"
                    class={`edit-demographics-check-card${isIndigenous.value ? ' edit-demographics-check-card--checked' : ''}`}
                    onClick$={() => {
                      isIndigenous.value = !isIndigenous.value;
                    }}
                  >
                    <span class="edit-demographics-check-card__box">
                      <AppIcon intent="check" size="xs" />
                    </span>
                    <span class="edit-demographics-check-card__content">
                      <span class="edit-demographics-check-card__title">
                        {m.fieldIndigenousSelfLabel}
                      </span>
                      <span class="edit-demographics-check-card__description">
                        {m.fieldIndigenousSelfDescription}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    class={`edit-demographics-check-card${isAfroDescendant.value ? ' edit-demographics-check-card--checked' : ''}`}
                    onClick$={() => {
                      isAfroDescendant.value = !isAfroDescendant.value;
                    }}
                  >
                    <span class="edit-demographics-check-card__box">
                      <AppIcon intent="check" size="xs" />
                    </span>
                    <span class="edit-demographics-check-card__content">
                      <span class="edit-demographics-check-card__title">
                        {m.fieldAfroSelfLabel}
                      </span>
                      <span class="edit-demographics-check-card__description">
                        {m.fieldAfroSelfDescription}
                      </span>
                    </span>
                  </button>

                  <div class="edit-demographics-divider">
                    <span class="edit-demographics-divider__line" />
                    <span class="edit-demographics-divider__label">
                      {m.sectionLanguages}
                    </span>
                    <span class="edit-demographics-divider__line" />
                  </div>

                  <Field label={m.fieldIndigenousLanguageLabel} optional>
                    <Select
                      value={indigenousLanguageId.value}
                      options={indigenousLanguageOptions}
                      onChange$={(value) => {
                        indigenousLanguageId.value = value;
                      }}
                    />
                  </Field>

                  <Field label={m.fieldForeignLanguageLabel} optional>
                    <Select
                      value={foreignLanguageId.value}
                      options={foreignLanguageOptions}
                      onChange$={(value) => {
                        foreignLanguageId.value = value;
                      }}
                    />
                  </Field>

                  <div class="edit-demographics-divider">
                    <span class="edit-demographics-divider__line" />
                    <span class="edit-demographics-divider__label">
                      {m.sectionSpecialCondition}
                    </span>
                    <span class="edit-demographics-divider__line" />
                  </div>

                  <Field label={m.fieldSpecialConditionLabel} optional>
                    <Select
                      value={specialConditionId.value}
                      options={specialConditionOptions}
                      onChange$={(value) => {
                        specialConditionId.value = value;
                      }}
                    />
                  </Field>
                </div>
              </Panel>

              <div class="edit-demographics-actions">
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
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Editar demografía`,
};

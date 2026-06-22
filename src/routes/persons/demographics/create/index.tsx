import { $, component$, useSignal, useTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useNavigate } from '@builder.io/qwik-city';

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
  Button,
  Field,
  Panel,
  Select,
  SelectionStep,
  StepIndicator,
  Toast,
} from '~/ui';
import { CreateResult, CreateResultRow } from '~/ui/composed/CreateResult';
import { AppIcon } from '~/ui/icons';
import { normalizeError } from '~/utils/api-error';
import './create.css';

const m = messages.demographics.create;
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

export default component$(() => {
  const nav = useNavigate();

  const personQuery = useSignal('');
  const personResults = useSignal<PersonListItem[]>([]);
  const searchingPerson = useSignal(false);
  const selectedPerson = useSignal<PersonListItem | null>(null);
  const success = useSignal(false);
  const saving = useSignal(false);
  const createdDemographic = useSignal<ViewDemographic | null>(null);
  const error = useSignal('');
  const errorTitle = useSignal(m.errorToastTitle);
  const maritalStatusId = useSignal('');
  const indigenousLanguageId = useSignal('');
  const foreignLanguageId = useSignal('');
  const specialConditionId = useSignal('');
  const isIndigenous = useSignal(false);
  const isAfroDescendant = useSignal(false);

  const currentStep = success.value ? 3 : selectedPerson.value ? 2 : 1;

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
        hasDemographic: false,
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

  const resetSelection$ = $(() => {
    selectedPerson.value = null;
    personQuery.value = '';
    personResults.value = [];
    createdDemographic.value = null;
    error.value = '';
    errorTitle.value = m.errorToastTitle;
    maritalStatusId.value = '';
    indigenousLanguageId.value = '';
    foreignLanguageId.value = '';
    specialConditionId.value = '';
    isIndigenous.value = false;
    isAfroDescendant.value = false;
    success.value = false;
    saving.value = false;
  });

  const saveDemographic$ = $(async () => {
    if (!selectedPerson.value) return;

    saving.value = true;
    error.value = '';

    try {
      const created = await demographicService.create({
        personId: selectedPerson.value.id,
        isIndigenous: isIndigenous.value,
        isAfroDescendant: isAfroDescendant.value,
        ...(maritalStatusId.value
          ? { maritalStatusId: Number(maritalStatusId.value) }
          : {}),
        ...(indigenousLanguageId.value
          ? { indigenousLangId: Number(indigenousLanguageId.value) }
          : {}),
        ...(foreignLanguageId.value
          ? { foreignLangId: Number(foreignLanguageId.value) }
          : {}),
        ...(specialConditionId.value
          ? { specialConditionId: Number(specialConditionId.value) }
          : {}),
      });

      createdDemographic.value = created;
      success.value = true;
    } catch (err) {
      const normalized = normalizeError(err, m.saveError);
      if (
        normalized.invalidField === 'personId' &&
        normalized.statusCode === 409
      ) {
        errorTitle.value = m.errorToastTitle;
        error.value = m.conflictPersonMessage;
      } else {
        errorTitle.value = m.errorToastTitle;
        error.value = normalized.message;
      }
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
    >
      <ActionHeader
        q:slot="hub-header"
        title={m.title}
        onBack$={async () => await nav(ROUTES.DEMOGRAPHICS)}
      />

      <StepIndicator
        q:slot="toolbar"
        steps={[
          { eyebrow: m.step1Eyebrow, label: m.step1Label },
          { eyebrow: m.step2Eyebrow, label: m.step2Label },
          { eyebrow: m.step3Eyebrow, label: m.step3Label },
        ]}
        current={currentStep}
        tone={success.value ? 'success' : undefined}
      />

      <div class="create-demographics-page">
        <div class="create-demographics-page__content">
          <div class="create-demographics-card">
            {error.value && !success.value && (
              <Toast
                tone="danger"
                title={errorTitle.value}
                description={error.value}
              />
            )}

            {success.value && createdDemographic.value ? (
              <CreateResult
                eyebrow={m.successEyebrow}
                title={m.successTitle}
                description={m.successDescription}
              >
                <CreateResultRow
                  label={m.resultPersonLabel}
                  value={createdDemographic.value.fullName}
                />
                <CreateResultRow
                  label={m.resultCurpLabel}
                  value={createdDemographic.value.curp}
                />
                <CreateResultRow
                  label={m.resultAgeLabel}
                  value={createdDemographic.value.age}
                  fallback={m.noDataLabel}
                />
                <CreateResultRow
                  label={m.resultMaritalStatusLabel}
                  value={createdDemographic.value.maritalStatus}
                  fallback={m.noDataLabel}
                />
                <CreateResultRow
                  label={m.resultIndigenousSelfLabel}
                  value={
                    createdDemographic.value.isIndigenous
                      ? m.yesLabel
                      : m.noLabel
                  }
                />
                <CreateResultRow
                  label={m.resultAfroSelfLabel}
                  value={
                    createdDemographic.value.isAfroDescendant
                      ? m.yesLabel
                      : m.noLabel
                  }
                />
                <CreateResultRow
                  label={m.resultIndigenousLanguageLabel}
                  value={createdDemographic.value.indigenousLanguage}
                  fallback={m.noDataLabel}
                />
                <CreateResultRow
                  label={m.resultForeignLanguageLabel}
                  value={createdDemographic.value.foreignLanguage}
                  fallback={m.noDataLabel}
                />
                <CreateResultRow
                  label={m.resultSpecialConditionLabel}
                  value={createdDemographic.value.specialCondition}
                  fallback={m.noDataLabel}
                />

                <div q:slot="actions">
                  <Button variant="secondary" onClick$={resetSelection$}>
                    {m.successCreateAnother}
                  </Button>
                  <Button
                    iconRight="chevron-right"
                    onClick$={async () => await nav(ROUTES.DEMOGRAPHICS)}
                  >
                    {m.successFinish}
                  </Button>
                </div>
              </CreateResult>
            ) : !selectedPerson.value ? (
              <SelectionStep
                title={m.panelPersonTitle}
                description={m.panelPersonDescription}
                fieldLabel={m.personSearchLabel}
                fieldHint={m.personSearchHint}
                placeholder={m.personSearchPlaceholder}
                emptyMessage={m.personNoResults}
                query={personQuery.value}
                options={personResults.value.map((p) => ({
                  value: String(p.id),
                  label: p.fullName,
                  description: p.curp,
                }))}
                loading={searchingPerson.value}
                onQueryChange$={(q) => {
                  personQuery.value = q;
                }}
                onSelect$={(option) => {
                  const person = personResults.value.find(
                    (p) => p.id === Number(option.value),
                  );
                  if (!person) return;
                  selectedPerson.value = person;
                  personQuery.value = '';
                  personResults.value = [];
                }}
              />
            ) : (
              <div class="create-demographics-layout">
                <div class="create-demographics-person-card">
                  <div
                    class="create-demographics-person-card__icon"
                    aria-hidden="true"
                  >
                    <AppIcon intent="person" size="md" />
                  </div>
                  <div class="create-demographics-person-card__info">
                    <strong>{selectedPerson.value.fullName}</strong>
                    <span>{selectedPerson.value.curp}</span>
                  </div>
                  <Button
                    variant="ghost"
                    iconLeft="close"
                    onClick$={resetSelection$}
                  >
                    {m.personChangeButton}
                  </Button>
                </div>

                <Panel
                  title={m.panelDataTitle}
                  description={m.panelDataDescription}
                  density="compact"
                >
                  <div q:slot="leading" class="create-demographics-panel__icon">
                    <AppIcon intent="dashboard" size="md" />
                  </div>

                  <div class="create-demographics-form">
                    <Field label={m.fieldMaritalStatusLabel} optional>
                      <Select
                        value={maritalStatusId.value}
                        options={maritalStatusOptions}
                        onChange$={(value) => {
                          maritalStatusId.value = value;
                        }}
                      />
                    </Field>

                    <div class="create-demographics-divider">
                      <span class="create-demographics-divider__line" />
                      <span class="create-demographics-divider__label">
                        {m.sectionSelfIdentification}
                      </span>
                      <span class="create-demographics-divider__line" />
                    </div>

                    <button
                      type="button"
                      class={`create-demographics-check-card${isIndigenous.value ? ' create-demographics-check-card--checked' : ''}`}
                      onClick$={() => {
                        isIndigenous.value = !isIndigenous.value;
                      }}
                    >
                      <span class="create-demographics-check-card__box">
                        <AppIcon intent="check" size="xs" />
                      </span>
                      <span class="create-demographics-check-card__content">
                        <span class="create-demographics-check-card__title">
                          {m.fieldIndigenousSelfLabel}
                        </span>
                        <span class="create-demographics-check-card__description">
                          {m.fieldIndigenousSelfDescription}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      class={`create-demographics-check-card${isAfroDescendant.value ? ' create-demographics-check-card--checked' : ''}`}
                      onClick$={() => {
                        isAfroDescendant.value = !isAfroDescendant.value;
                      }}
                    >
                      <span class="create-demographics-check-card__box">
                        <AppIcon intent="check" size="xs" />
                      </span>
                      <span class="create-demographics-check-card__content">
                        <span class="create-demographics-check-card__title">
                          {m.fieldAfroSelfLabel}
                        </span>
                        <span class="create-demographics-check-card__description">
                          {m.fieldAfroSelfDescription}
                        </span>
                      </span>
                    </button>

                    <div class="create-demographics-divider">
                      <span class="create-demographics-divider__line" />
                      <span class="create-demographics-divider__label">
                        {m.sectionLanguages}
                      </span>
                      <span class="create-demographics-divider__line" />
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

                    <div class="create-demographics-divider">
                      <span class="create-demographics-divider__line" />
                      <span class="create-demographics-divider__label">
                        {m.sectionSpecialCondition}
                      </span>
                      <span class="create-demographics-divider__line" />
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

                <div class="create-demographics-actions">
                  <Button
                    variant="secondary"
                    onClick$={async () => await nav(ROUTES.DEMOGRAPHICS)}
                  >
                    {m.cancelButton}
                  </Button>
                  <Button
                    iconRight="chevron-right"
                    loading={saving.value}
                    disabled={saving.value}
                    onClick$={saveDemographic$}
                  >
                    {saving.value ? m.savingLabel : m.saveButton}
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
  title: `${appConfig.name} | Nuevo registro demográfico`,
};

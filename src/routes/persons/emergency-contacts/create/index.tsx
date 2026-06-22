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
import { emergencyContactService } from '~/services/emergency-contact/emergency-contact.service';
import { personService } from '~/services/person/person.service';
import type { NamedCatalogItem } from '~/types/catalog.types';
import type { ViewEmergencyContact } from '~/types/emergency-contact.types';
import type { PersonListItem } from '~/types/person.types';
import {
  ActionHeader,
  Button,
  Field,
  Input,
  Panel,
  Select,
  SelectionStep,
  StepIndicator,
  Toast,
} from '~/ui';
import { AppIcon } from '~/ui/icons';
import { normalizeError } from '~/utils/api-error';
import './create.css';

const m = messages.emergencyContacts.create;
const PHONE_REGEX = /^\d{10}$/;
const MAX_NAME_LENGTH = 97;

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length !== 10) return digits;
  return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
};

export default component$(() => {
  const nav = useNavigate();

  const personQuery = useSignal('');
  const personResults = useSignal<PersonListItem[]>([]);
  const searchingPerson = useSignal(false);
  const selectedPerson = useSignal<PersonListItem | null>(null);
  const existingContact = useSignal<ViewEmergencyContact | null>(null);
  const relationships = useSignal<NamedCatalogItem[]>([]);

  const fullName = useSignal('');
  const phone = useSignal('');
  const relationshipId = useSignal('');

  const createdContact = useSignal<ViewEmergencyContact | null>(null);
  const saving = useSignal(false);
  const success = useSignal(false);
  const error = useSignal('');
  const errorField = useSignal('');

  const currentStep = success.value
    ? 3
    : existingContact.value
      ? 1
      : selectedPerson.value
        ? 2
        : 1;
  const stepTone = success.value
    ? 'success'
    : error.value
      ? 'error'
      : undefined;

  const relationshipOptions = useComputed$(() => [
    { value: '', label: m.fieldRelationshipPlaceholder },
    ...relationships.value.map((item) => ({
      value: String(item.id),
      label: item.name,
    })),
  ]);

  const nameCountLabel = useComputed$(
    () => `${fullName.value.trim().length}/${MAX_NAME_LENGTH}`,
  );

  useTask$(async () => {
    try {
      relationships.value = await catalogService.getContactRelationships();
    } catch {
      relationships.value = [];
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
        hasEmergencyContact: false,
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

  const resetAll$ = $(() => {
    personQuery.value = '';
    personResults.value = [];
    selectedPerson.value = null;
    existingContact.value = null;
    fullName.value = '';
    phone.value = '';
    relationshipId.value = '';
    createdContact.value = null;
    saving.value = false;
    success.value = false;
    error.value = '';
    errorField.value = '';
  });

  const resetSelection$ = $(() => {
    selectedPerson.value = null;
    existingContact.value = null;
    fullName.value = '';
    phone.value = '';
    relationshipId.value = '';
    error.value = '';
    errorField.value = '';
  });

  const selectPerson$ = $(async (person: PersonListItem) => {
    selectedPerson.value = person;
    personQuery.value = '';
    personResults.value = [];
    existingContact.value = null;
    fullName.value = '';
    phone.value = '';
    relationshipId.value = '';
    error.value = '';
    errorField.value = '';

    const found = await emergencyContactService.findOne(person.curp);
    if (found) {
      existingContact.value = found;
      error.value = m.errorPersonHasContact;
    }
  });

  const saveEmergencyContact$ = $(async () => {
    if (!selectedPerson.value) return;

    error.value = '';
    errorField.value = '';

    const trimmedName = fullName.value.trim();
    const phoneDigits = phone.value.replace(/\D/g, '');

    if (!trimmedName) {
      error.value = m.errorFullNameRequired;
      errorField.value = 'fullName';
      return;
    }
    if (!phoneDigits) {
      error.value = m.errorPhoneRequired;
      errorField.value = 'phone';
      return;
    }
    if (!PHONE_REGEX.test(phoneDigits)) {
      error.value = m.errorPhoneInvalid;
      errorField.value = 'phone';
      return;
    }
    if (!relationshipId.value) {
      error.value = m.errorRelationshipRequired;
      errorField.value = 'relationshipId';
      return;
    }

    saving.value = true;
    try {
      const created = await emergencyContactService.create({
        fullName: trimmedName,
        phone: phoneDigits,
        personId: selectedPerson.value.id,
        relationshipId: Number(relationshipId.value),
      });

      createdContact.value = created;
      success.value = true;
    } catch (err) {
      const normalized = normalizeError(err, m.saveError);
      error.value = normalized.message;
      errorField.value = normalized.invalidField ?? '';
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
        onBack$={async () => await nav(ROUTES.EMERGENCY_CONTACTS)}
      />

      <StepIndicator
        q:slot="toolbar"
        steps={[
          { eyebrow: m.step1Eyebrow, label: m.step1Label },
          { eyebrow: m.step2Eyebrow, label: m.step2Label },
          { eyebrow: m.step3Eyebrow, label: m.step3Label },
        ]}
        current={currentStep}
        tone={stepTone}
      />

      <div class="create-emergency-contact-page">
        <div class="create-emergency-contact-page__content">
          <div class="create-emergency-contact-card">
            {error.value &&
              !success.value &&
              errorField.value === '' &&
              !existingContact.value && (
                <Toast
                  tone="danger"
                  title={m.errorToastTitle}
                  description={error.value}
                />
              )}

            {success.value && createdContact.value ? (
              <article class="create-emergency-contact-result">
                <div class="create-emergency-contact-result__top">
                  <div class="create-emergency-contact-result__icon">
                    <AppIcon intent="success" size="lg" />
                  </div>
                  <div class="create-emergency-contact-result__copy">
                    <span class="create-emergency-contact-result__eyebrow">
                      {m.successEyebrow}
                    </span>
                    <h2>{m.successTitle}</h2>
                    <p>{m.successDescription}</p>
                  </div>
                </div>

                <div class="create-emergency-contact-result__body">
                  <div class="create-emergency-contact-result__row">
                    <span>{m.resultPersonLabel}</span>
                    <strong>{createdContact.value.personName}</strong>
                  </div>
                  <div class="create-emergency-contact-result__row">
                    <span>{m.resultCurpLabel}</span>
                    <strong class="create-emergency-contact-result__mono">
                      {createdContact.value.personCurp}
                    </strong>
                  </div>
                  <div class="create-emergency-contact-result__row">
                    <span>{m.resultContactLabel}</span>
                    <strong>{createdContact.value.contactName}</strong>
                  </div>
                  <div class="create-emergency-contact-result__row">
                    <span>{m.resultPhoneLabel}</span>
                    <strong class="create-emergency-contact-result__mono">
                      {formatPhone(createdContact.value.contactPhone)}
                    </strong>
                  </div>
                  <div class="create-emergency-contact-result__row">
                    <span>{m.resultRelationshipLabel}</span>
                    <strong>{createdContact.value.relationship}</strong>
                  </div>
                </div>

                <div class="create-emergency-contact-result__actions">
                  <Button variant="secondary" onClick$={resetAll$}>
                    {m.successCreateAnother}
                  </Button>
                  <Button
                    iconRight="chevron-right"
                    onClick$={async () => await nav(ROUTES.EMERGENCY_CONTACTS)}
                  >
                    {m.successFinish}
                  </Button>
                </div>
              </article>
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
                onSelect$={async (option) => {
                  const person = personResults.value.find(
                    (p) => p.id === Number(option.value),
                  );
                  if (!person) return;
                  await selectPerson$(person);
                }}
              />
            ) : (
              <div class="create-emergency-contact-layout">
                <div class="create-emergency-contact-person-card">
                  <div
                    class="create-emergency-contact-person-card__avatar"
                    aria-hidden="true"
                  >
                    {getInitials(selectedPerson.value.fullName)}
                  </div>
                  <div class="create-emergency-contact-person-card__info">
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

                {existingContact.value ? (
                  <div class="create-emergency-contact-warning">
                    <div class="create-emergency-contact-warning__icon">
                      <AppIcon intent="warning" size="md" />
                    </div>
                    <div class="create-emergency-contact-warning__content">
                      <strong>{m.existingContactTitle}</strong>
                      <p>{m.existingContactDescription}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Panel
                      title={m.panelHolderTitle}
                      description={m.panelHolderDescription}
                    >
                      <div
                        q:slot="leading"
                        class="create-emergency-contact-panel__icon"
                      >
                        <AppIcon intent="person" size="md" />
                      </div>

                      <div class="create-emergency-contact-holder">
                        <span>{selectedPerson.value.fullName}</span>
                        <span>{selectedPerson.value.curp}</span>
                      </div>
                    </Panel>

                    <Panel
                      title={m.panelDataTitle}
                      description={m.panelDataDescription}
                      density="compact"
                    >
                      <div
                        q:slot="leading"
                        class="create-emergency-contact-panel__icon"
                      >
                        <AppIcon intent="phone" size="md" />
                      </div>

                      <div class="create-emergency-contact-form">
                        <Field
                          label={m.fieldFullNameLabel}
                          hint={
                            errorField.value === 'fullName'
                              ? undefined
                              : m.fieldFullNameHint
                          }
                          error={
                            errorField.value === 'fullName'
                              ? error.value
                              : undefined
                          }
                          required
                        >
                          <div class="create-emergency-contact-char-wrap">
                            <Input
                              value={fullName.value}
                              placeholder={m.fieldFullNamePlaceholder}
                              maxLength={MAX_NAME_LENGTH}
                              invalid={errorField.value === 'fullName'}
                              onInput$={(event) => {
                                fullName.value = (
                                  event.target as HTMLInputElement
                                ).value.slice(0, MAX_NAME_LENGTH);
                              }}
                            />
                            <span class="create-emergency-contact-char-count">
                              {nameCountLabel.value}
                            </span>
                          </div>
                        </Field>

                        <Field
                          label={m.fieldPhoneLabel}
                          hint={
                            errorField.value === 'phone'
                              ? undefined
                              : m.fieldPhoneHint
                          }
                          error={
                            errorField.value === 'phone'
                              ? error.value
                              : undefined
                          }
                          required
                        >
                          <Input
                            iconLeft="phone"
                            type="tel"
                            value={phone.value}
                            placeholder={m.fieldPhonePlaceholder}
                            maxLength={10}
                            invalid={errorField.value === 'phone'}
                            onInput$={(event) => {
                              phone.value = (
                                event.target as HTMLInputElement
                              ).value
                                .replace(/\D/g, '')
                                .slice(0, 10);
                            }}
                          />
                        </Field>

                        <Field
                          label={m.fieldRelationshipLabel}
                          error={
                            errorField.value === 'relationshipId'
                              ? error.value
                              : undefined
                          }
                          required
                        >
                          <Select
                            value={relationshipId.value}
                            options={relationshipOptions.value}
                            invalid={errorField.value === 'relationshipId'}
                            onChange$={(value) => {
                              relationshipId.value = value;
                            }}
                          />
                        </Field>
                      </div>
                    </Panel>

                    <div class="create-emergency-contact-actions">
                      <Button variant="secondary" onClick$={resetAll$}>
                        {m.cancelButton}
                      </Button>
                      <Button
                        iconRight="chevron-right"
                        loading={saving.value}
                        onClick$={saveEmergencyContact$}
                      >
                        {saving.value ? m.saving : m.saveButton}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Crear contacto de emergencia`,
};

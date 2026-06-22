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
import { emergencyContactService } from '~/services/emergency-contact/emergency-contact.service';
import { personService } from '~/services/person/person.service';
import type { NamedCatalogItem } from '~/types/catalog.types';
import type { ViewEmergencyContact } from '~/types/emergency-contact.types';
import type { PersonListItem } from '~/types/person.types';
import {
  ActionHeader,
  Button,
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
import '../create/create.css';

const m = messages.emergencyContacts.edit;
const mc = messages.emergencyContacts.create;
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
  const location = useLocation();

  // Estado de carga / modo
  const contact = useSignal<ViewEmergencyContact | null>(null);
  const loading = useSignal(true);
  const saving = useSignal(false);
  const error = useSignal('');
  const errorField = useSignal('');
  const success = useSignal(false);
  const selectionMode = useSignal(false);

  // Búsqueda de persona (modo selección)
  const personQuery = useSignal('');
  const personResults = useSignal<PersonListItem[]>([]);
  const searchingPerson = useSignal(false);

  // Catálogo de parentesco
  const relationships = useSignal<NamedCatalogItem[]>([]);

  // Campos del formulario
  const fullName = useSignal('');
  const phone = useSignal('');
  const relationshipId = useSignal('');

  // Carga de contacto + catálogos cuando cambia el ?id
  useVisibleTask$(async ({ track }) => {
    const idParam = track(() => location.url.searchParams.get('id'));

    loading.value = true;
    error.value = '';
    contact.value = null;
    selectionMode.value = false;
    success.value = false;
    fullName.value = '';
    phone.value = '';
    relationshipId.value = '';
    personQuery.value = '';
    personResults.value = [];
    searchingPerson.value = false;

    try {
      relationships.value = await catalogService.getContactRelationships();
    } catch {
      relationships.value = [];
    }

    const id = idParam ? Number(idParam) : 0;

    if (!id) {
      selectionMode.value = true;
      loading.value = false;
      return;
    }

    try {
      const found = await emergencyContactService.findOne(id);
      if (!found) {
        error.value = m.notFoundTitle;
        loading.value = false;
        return;
      }

      contact.value = found;
      fullName.value = found.contactName ?? '';
      phone.value = found.contactPhone ?? '';
      const matched = relationships.value.find(
        (r) => r.name === found.relationship,
      );
      relationshipId.value = matched ? String(matched.id) : '';
    } catch (err) {
      error.value = normalizeError(
        err,
        'No se pudo cargar el contacto de emergencia.',
      ).message;
    } finally {
      loading.value = false;
    }
  });

  // Auto-búsqueda de personas (modo selección)
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
        hasEmergencyContact: true,
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
    await nav(ROUTES.EMERGENCY_CONTACTS);
  });

  const currentContact = contact.value;

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

  const hasChanges = useComputed$(() => {
    const cc = contact.value;
    if (!cc) return false;

    const fullNameChanged =
      fullName.value.trim() !== (cc.contactName ?? '').trim();
    const phoneChanged = phone.value.trim() !== (cc.contactPhone ?? '').trim();
    const matchedOriginal = relationships.value.find(
      (r) => r.name === cc.relationship,
    );
    const relationshipChanged =
      relationshipId.value !==
      (matchedOriginal ? String(matchedOriginal.id) : '');

    return fullNameChanged || phoneChanged || relationshipChanged;
  });

  const saveChanges$ = $(async () => {
    if (!contact.value) return;

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

    const cc = contact.value;
    const matchedOriginal = relationships.value.find(
      (r) => r.name === cc.relationship,
    );
    const originalRelationshipId = matchedOriginal
      ? String(matchedOriginal.id)
      : '';

    const changes: Record<string, unknown> = {};
    if (trimmedName !== (cc.contactName ?? '').trim()) {
      changes.fullName = trimmedName;
    }
    if (phoneDigits !== (cc.contactPhone ?? '').trim()) {
      changes.phone = phoneDigits;
    }
    if (relationshipId.value !== originalRelationshipId) {
      changes.relationshipId = Number(relationshipId.value);
    }

    if (Object.keys(changes).length === 0) {
      error.value = m.errorNoChanges;
      return;
    }

    saving.value = true;
    try {
      const updated = await emergencyContactService.update(cc.id, changes);
      contact.value = updated;
      success.value = true;
    } catch (err) {
      const normalized = normalizeError(err, m.successToastTitle);
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
      fullWidth
    >
      <ActionHeader q:slot="hub-header" title={m.title} onBack$={goBack$} />

      <div class="create-emergency-contact-page">
        <div class="create-emergency-contact-page__content">
          <div class="create-emergency-contact-card">
            {error.value && !errorField.value && !success.value && (
              <Toast tone="danger" title="Error">
                {error.value}
              </Toast>
            )}

            {!loading.value && success.value && currentContact && (
              <div class="create-emergency-contact-layout">
                <EditResult
                  eyebrow={m.successResultEyebrow}
                  title={m.successResultTitle}
                  description={m.successResultDescription}
                >
                  <EditResultRow
                    label={mc.resultPersonLabel}
                    value={currentContact.personName}
                  />
                  <EditResultRow
                    label={mc.resultCurpLabel}
                    value={currentContact.personCurp}
                  />
                  <EditResultRow
                    label={mc.resultContactLabel}
                    value={currentContact.contactName}
                  />
                  <EditResultRow
                    label={mc.resultPhoneLabel}
                    value={formatPhone(currentContact.contactPhone)}
                  />
                  <EditResultRow
                    label={mc.resultRelationshipLabel}
                    value={currentContact.relationship}
                  />

                  <div q:slot="actions">
                    <Button
                      variant="ghost"
                      iconLeft="view"
                      onClick$={async () => {
                        await nav(ROUTES.EMERGENCY_CONTACTS_EDIT);
                      }}
                    >
                      {m.successResultViewAnother}
                    </Button>
                    <Button
                      iconRight="chevron-right"
                      onClick$={async () =>
                        await nav(ROUTES.EMERGENCY_CONTACTS)
                      }
                    >
                      {m.successResultFinish}
                    </Button>
                  </div>
                </EditResult>
              </div>
            )}

            {!loading.value && !success.value && selectionMode.value && (
              <div class="create-emergency-contact-search-shell">
                <SelectionStep
                  title={m.selectionTitle}
                  description={m.selectionDescription}
                  fieldLabel={mc.personSearchLabel}
                  fieldHint={m.fieldPersonHint}
                  placeholder={mc.personSearchPlaceholder}
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
                  }}
                  onSelect$={async (option) => {
                    const person = personResults.value.find(
                      (p) => p.id === Number(option.value),
                    );
                    if (!person) return;
                    const found = await emergencyContactService.findOne(
                      person.curp,
                    );
                    if (found) {
                      await nav(
                        `${ROUTES.EMERGENCY_CONTACTS_EDIT}?id=${found.id}`,
                      );
                    } else {
                      error.value = m.notFoundDescription.replace(
                        '{name}',
                        person.fullName,
                      );
                    }
                  }}
                />
                {error.value && (
                  <EmptyState
                    title={m.notFoundTitle}
                    description={error.value}
                    tone="warning"
                    actionLabel={m.notFoundCreateAction}
                    onAction$={async () => {
                      await nav(ROUTES.EMERGENCY_CONTACTS_CREATE);
                    }}
                  />
                )}
              </div>
            )}

            {!loading.value && !success.value && currentContact && (
              <div class="create-emergency-contact-layout">
                <div class="create-emergency-contact-person-card">
                  <div
                    class="create-emergency-contact-person-card__avatar"
                    aria-hidden="true"
                  >
                    {getInitials(currentContact.personName)}
                  </div>
                  <div class="create-emergency-contact-person-card__info">
                    <strong>{currentContact.personName}</strong>
                    <span>{currentContact.personCurp}</span>
                  </div>
                  <Button
                    variant="ghost"
                    iconLeft="edit"
                    onClick$={async () => {
                      await nav(ROUTES.EMERGENCY_CONTACTS_EDIT);
                    }}
                  >
                    {mc.personChangeButton}
                  </Button>
                </div>

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
                    <span>{currentContact.personName}</span>
                    <span>{currentContact.personCurp}</span>
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
                            if (errorField.value === 'fullName') {
                              error.value = '';
                              errorField.value = '';
                            }
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
                        errorField.value === 'phone' ? error.value : undefined
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
                          phone.value = (event.target as HTMLInputElement).value
                            .replace(/\D/g, '')
                            .slice(0, 10);
                          if (errorField.value === 'phone') {
                            error.value = '';
                            errorField.value = '';
                          }
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
                          if (errorField.value === 'relationshipId') {
                            error.value = '';
                            errorField.value = '';
                          }
                        }}
                      />
                    </Field>
                  </div>
                </Panel>

                <div class="create-emergency-contact-actions">
                  <Button variant="secondary" onClick$={goBack$}>
                    {m.actionCancel}
                  </Button>
                  <Button
                    iconRight="chevron-right"
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
  title: `${appConfig.name} | Editar contacto de emergencia`,
};

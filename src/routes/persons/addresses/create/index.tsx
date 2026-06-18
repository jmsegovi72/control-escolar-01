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
import { addressService } from '~/services/address/address.service';
import { catalogService } from '~/services/catalog/catalog.service';
import { personService } from '~/services/person/person.service';
import type { Settlement, StreetType } from '~/types/address.types';
import type { PersonListItem } from '~/types/person.types';
import {
  ActionHeader,
  Button,
  Field,
  Input,
  Panel,
  Select,
  SelectionStep,
  Toast,
} from '~/ui';
import { AppIcon } from '~/ui/icons';
import { normalizeError } from '~/utils/api-error';
import './create.css';

const m = messages.addresses.create;
const CP_REGEX = /^\d{5}$/;

export default component$(() => {
  const nav = useNavigate();

  // Fase 1 — Persona
  const personQuery = useSignal('');
  const personResults = useSignal<PersonListItem[]>([]);
  const searchingPerson = useSignal(false);
  const selectedPerson = useSignal<PersonListItem | null>(null);

  // Fase 2 — Código postal / asentamiento
  const cpInput = useSignal('');
  const settlements = useSignal<Settlement[]>([]);
  const searchingCp = useSignal(false);
  const selectedSettlement = useSignal<Settlement | null>(null);

  // Fase 2 — Tipos de calle (catálogo)
  const streetTypes = useSignal<StreetType[]>([]);

  // Fase 2 — Campos del domicilio
  const streetTypeId = useSignal(0);
  const street = useSignal('');
  const exteriorNumber = useSignal('');
  const interiorNumber = useSignal('');
  const block = useSignal('');
  const betweenStreets = useSignal('');

  // Estado global
  const saving = useSignal(false);
  const error = useSignal('');
  const errorField = useSignal('');
  const success = useSignal(false);

  useTask$(async () => {
    try {
      streetTypes.value = await catalogService.getStreetTypes();
    } catch {
      streetTypes.value = [];
    }
  });

  const streetTypeOptions = useComputed$(() => [
    { value: '', label: m.fieldStreetTypePlaceholder },
    ...streetTypes.value.map((t) => ({
      value: String(t.id),
      label: t.abbreviation ? `${t.abbreviation} — ${t.name}` : t.name,
    })),
  ]);

  // Auto-búsqueda de personas (mínimo 3 caracteres)
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

  // Auto-búsqueda de asentamientos al completar 5 dígitos
  useTask$(async ({ track }) => {
    const cp = track(() => cpInput.value);
    if (!CP_REGEX.test(cp)) {
      settlements.value = [];
      selectedSettlement.value = null;
      return;
    }
    searchingCp.value = true;
    settlements.value = [];
    selectedSettlement.value = null;
    try {
      settlements.value = await catalogService.getSettlements(cp);
    } catch {
      settlements.value = [];
    } finally {
      searchingCp.value = false;
    }
  });

  const resetAll$ = $(() => {
    selectedPerson.value = null;
    personQuery.value = '';
    personResults.value = [];
    cpInput.value = '';
    settlements.value = [];
    selectedSettlement.value = null;
    streetTypeId.value = 0;
    street.value = '';
    exteriorNumber.value = '';
    interiorNumber.value = '';
    block.value = '';
    betweenStreets.value = '';
    error.value = '';
    errorField.value = '';
  });

  const saveAddress$ = $(async () => {
    error.value = '';
    errorField.value = '';

    if (!selectedSettlement.value) {
      error.value = m.errorSettlementRequired;
      errorField.value = 'settlement';
      return;
    }
    if (!streetTypeId.value) {
      error.value = m.errorStreetTypeRequired;
      errorField.value = 'streetType';
      return;
    }
    if (!street.value.trim()) {
      error.value = m.errorStreetRequired;
      errorField.value = 'street';
      return;
    }

    saving.value = true;
    try {
      await addressService.create({
        personId: selectedPerson.value!.id,
        zipCodeId: selectedSettlement.value.id,
        streetTypeId: streetTypeId.value,
        street: street.value.trim(),
        exteriorNumber: exteriorNumber.value.trim() || undefined,
        interiorNumber: interiorNumber.value.trim() || undefined,
        block: block.value.trim() || undefined,
        betweenStreets: betweenStreets.value.trim() || undefined,
      });
      success.value = true;
    } catch (err) {
      const normalized = normalizeError(
        err,
        'No se pudo guardar la dirección.',
      );
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
      <div class="create-address-page">
        <ActionHeader
          title={m.title}
          onBack$={async () => await nav(ROUTES.ADDRESSES)}
        />

        <div class="create-address-page__content">
          {error.value && errorField.value === '' && (
            <Toast tone="danger" title="Error">
              {error.value}
            </Toast>
          )}

          {/* ── ÉXITO ── */}
          {success.value ? (
            <Panel
              eyebrow={m.successEyebrow}
              title={m.successTitle}
              description={m.successMessage}
            >
              <div class="create-address-success">
                <div class="create-address-success__icon" aria-hidden="true">
                  <AppIcon intent="check" size="lg" />
                </div>
                <div class="create-address-success__actions">
                  <Button variant="secondary" onClick$={resetAll$}>
                    {m.successNewButton}
                  </Button>
                  <Button
                    iconRight="chevron-right"
                    onClick$={async () => await nav(ROUTES.ADDRESSES)}
                  >
                    {m.successBackButton}
                  </Button>
                </div>
              </div>
            </Panel>

            /* ── FASE 1: Buscar persona ── */
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

            /* ── FASE 2: Formulario de dirección ── */
          ) : (
            <div class="create-address-layout">
              {/* Persona seleccionada — fija en la parte superior */}
              <div class="create-address-person-card">
                <div
                  class="create-address-person-card__icon"
                  aria-hidden="true"
                >
                  <AppIcon intent="person" size="md" />
                </div>
                <div class="create-address-person-card__info">
                  <strong>{selectedPerson.value.fullName}</strong>
                  <span>{selectedPerson.value.curp}</span>
                </div>
                <Button variant="ghost" iconLeft="close" onClick$={resetAll$}>
                  {m.personChangeButton}
                </Button>
              </div>

              {/* Búsqueda de código postal — mismo patrón que persona */}
              {!selectedSettlement.value ? (
                <SelectionStep
                  title={m.panelZipCodeTitle}
                  description={m.panelZipCodeDescription}
                  fieldLabel={m.fieldZipCodeLabel}
                  fieldHint={m.fieldZipCodeHint}
                  placeholder={m.fieldZipCodePlaceholder}
                  emptyMessage={
                    cpInput.value.length < 5
                      ? m.fieldZipCodeHint
                      : m.cpNoResults
                  }
                  query={cpInput.value}
                  options={settlements.value.map((s) => ({
                    value: String(s.id),
                    label: `${s.abbreviation} ${s.settlement}`,
                    description: `CP ${s.zipCode} · ${s.municipality}, ${s.stateName}`,
                  }))}
                  loading={searchingCp.value}
                  filterMode="external"
                  onQueryChange$={(q) => {
                    cpInput.value = q.replace(/\D/g, '').slice(0, 5);
                  }}
                  onSelect$={(option) => {
                    const s = settlements.value.find(
                      (s) => s.id === Number(option.value),
                    );
                    if (s) selectedSettlement.value = s;
                  }}
                />
              ) : (
                /* Asentamiento seleccionado */
                <div class="create-address-settlement-card">
                  <div
                    class="create-address-settlement-card__icon"
                    aria-hidden="true"
                  >
                    <AppIcon intent="pin" size="md" />
                  </div>
                  <div class="create-address-settlement-card__info">
                    <strong>
                      {selectedSettlement.value.abbreviation}{' '}
                      {selectedSettlement.value.settlement}
                    </strong>
                    <span>
                      CP {selectedSettlement.value.zipCode} ·{' '}
                      {selectedSettlement.value.municipality},{' '}
                      {selectedSettlement.value.stateName}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    iconLeft="close"
                    onClick$={() => {
                      selectedSettlement.value = null;
                      cpInput.value = '';
                      settlements.value = [];
                    }}
                  >
                    {m.settlementChangeButton}
                  </Button>
                </div>
              )}

              {/* Panel: Datos del domicilio — visible sólo cuando hay asentamiento */}
              {selectedSettlement.value && (
                <Panel
                  title={m.panelAddressTitle}
                  description={m.panelAddressDescription}
                  density="compact"
                >
                  <div class="create-address-form">
                    <div class="create-address-grid create-address-grid--street">
                      <Field
                        label={m.fieldStreetTypeLabel}
                        required
                        error={
                          errorField.value === 'streetType'
                            ? error.value
                            : undefined
                        }
                      >
                        <Select
                          value={
                            streetTypeId.value ? String(streetTypeId.value) : ''
                          }
                          options={streetTypeOptions.value}
                          invalid={errorField.value === 'streetType'}
                          onChange$={(val) => {
                            streetTypeId.value = Number(val);
                            errorField.value = '';
                          }}
                        />
                      </Field>
                      <Field
                        label={m.fieldStreetLabel}
                        required
                        error={
                          errorField.value === 'street'
                            ? error.value
                            : undefined
                        }
                      >
                        <Input
                          placeholder={m.fieldStreetPlaceholder}
                          value={street.value}
                          invalid={errorField.value === 'street'}
                          onInput$={(event) => {
                            street.value = (
                              event.target as HTMLInputElement
                            ).value;
                            errorField.value = '';
                          }}
                        />
                      </Field>
                    </div>

                    <div class="create-address-grid create-address-grid--numbers">
                      <Field label={m.fieldExteriorNumberLabel} optional>
                        <Input
                          placeholder={m.fieldExteriorNumberPlaceholder}
                          value={exteriorNumber.value}
                          onInput$={(event) => {
                            exteriorNumber.value = (
                              event.target as HTMLInputElement
                            ).value;
                          }}
                        />
                      </Field>
                      <Field label={m.fieldInteriorNumberLabel} optional>
                        <Input
                          placeholder={m.fieldInteriorNumberPlaceholder}
                          value={interiorNumber.value}
                          onInput$={(event) => {
                            interiorNumber.value = (
                              event.target as HTMLInputElement
                            ).value;
                          }}
                        />
                      </Field>
                      <Field label={m.fieldBlockLabel} optional>
                        <Input
                          placeholder={m.fieldBlockPlaceholder}
                          value={block.value}
                          onInput$={(event) => {
                            block.value = (
                              event.target as HTMLInputElement
                            ).value;
                          }}
                        />
                      </Field>
                    </div>

                    <Field label={m.fieldBetweenStreetsLabel} optional>
                      <Input
                        placeholder={m.fieldBetweenStreetsPlaceholder}
                        value={betweenStreets.value}
                        onInput$={(event) => {
                          betweenStreets.value = (
                            event.target as HTMLInputElement
                          ).value;
                        }}
                      />
                    </Field>
                  </div>
                </Panel>
              )}

              {selectedSettlement.value && (
                <div class="create-address-actions">
                  <Button
                    variant="secondary"
                    onClick$={async () => await nav(ROUTES.ADDRESSES)}
                  >
                    {m.cancelButton}
                  </Button>
                  <Button
                    iconLeft="save"
                    loading={saving.value}
                    disabled={saving.value}
                    onClick$={saveAddress$}
                  >
                    {saving.value ? m.saving : m.saveButton}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Nueva dirección`,
};

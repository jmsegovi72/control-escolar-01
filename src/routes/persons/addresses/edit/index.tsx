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
import { addressService } from '~/services/address/address.service';
import { catalogService } from '~/services/catalog/catalog.service';
import { personService } from '~/services/person/person.service';
import type {
  AddressListItem,
  Settlement,
  StreetType,
} from '~/types/address.types';
import type { PersonListItem } from '~/types/person.types';
import {
  Button,
  Field,
  Input,
  ModuleHeader,
  Panel,
  Select,
  SelectionStep,
  Toast,
  Toolbar,
} from '~/ui';
import { AppIcon } from '~/ui/icons';
import { normalizeError } from '~/utils/api-error';
import './edit.css';

const m = messages.addresses.edit;
const mc = messages.addresses.create;
const CP_REGEX = /^\d{5}$/;

export default component$(() => {
  const nav = useNavigate();
  const location = useLocation();

  // Estado de carga / modo
  const address = useSignal<AddressListItem | null>(null);
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
  const noAddressForPerson = useSignal('');

  // Catálogo de tipos de vialidad
  const streetTypes = useSignal<StreetType[]>([]);

  // Campos del formulario
  const streetTypeId = useSignal(0);
  const street = useSignal('');
  const exteriorNumber = useSignal('');
  const interiorNumber = useSignal('');
  const block = useSignal('');
  const betweenStreets = useSignal('');

  // Cambio de asentamiento (opcional)
  const changingSettlement = useSignal(false);
  const changedSettlement = useSignal<Settlement | null>(null);
  const cpInput = useSignal('');
  const settlements = useSignal<Settlement[]>([]);
  const searchingCp = useSignal(false);

  // Carga de dirección + catálogos cuando cambia el ?id
  useVisibleTask$(async ({ track }) => {
    const idParam = track(() => location.url.searchParams.get('id'));

    loading.value = true;
    error.value = '';
    address.value = null;
    selectionMode.value = false;
    noAddressForPerson.value = '';
    changedSettlement.value = null;
    changingSettlement.value = false;

    const id = idParam ? Number(idParam) : 0;

    if (!id) {
      selectionMode.value = true;
      try {
        streetTypes.value = await catalogService.getStreetTypes();
      } catch {
        streetTypes.value = [];
      }
      loading.value = false;
      return;
    }

    try {
      const [found, streetTypesData] = await Promise.all([
        addressService.findOne(id),
        catalogService.getStreetTypes(),
      ]);

      streetTypes.value = streetTypesData;

      if (!found) {
        error.value = messages.errors.notFound;
        loading.value = false;
        return;
      }

      address.value = found;
      street.value = found.street ?? '';
      exteriorNumber.value = found.exteriorNumber ?? '';
      interiorNumber.value = found.interiorNumber ?? '';
      block.value = found.block ?? '';
      betweenStreets.value = found.betweenStreets ?? '';

      const matched = streetTypesData.find(
        (t) =>
          t.name === found.streetType || t.abbreviation === found.streetType,
      );
      streetTypeId.value = matched?.id ?? 0;
    } catch (err) {
      error.value = normalizeError(
        err,
        'No se pudo cargar la dirección.',
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
      return;
    }
    searchingCp.value = true;
    settlements.value = [];
    try {
      settlements.value = await catalogService.getSettlements(cp);
    } catch {
      settlements.value = [];
    } finally {
      searchingCp.value = false;
    }
  });

  const goBack$ = $(async () => {
    await nav(ROUTES.ADDRESSES);
  });

  const saveChanges$ = $(async () => {
    if (!address.value) return;

    error.value = '';
    errorField.value = '';

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
      await addressService.update(address.value.id, {
        streetTypeId: streetTypeId.value,
        street: street.value.trim(),
        exteriorNumber: exteriorNumber.value.trim() || undefined,
        interiorNumber: interiorNumber.value.trim() || undefined,
        block: block.value.trim() || undefined,
        betweenStreets: betweenStreets.value.trim() || undefined,
        ...(changedSettlement.value
          ? { zipCodeId: changedSettlement.value.id }
          : {}),
      });
      success.value = true;
    } catch (err) {
      const normalized = normalizeError(err, messages.errors.saveChangesFailed);
      error.value = normalized.message;
      errorField.value = normalized.invalidField ?? '';
    } finally {
      saving.value = false;
    }
  });

  const streetTypeOptions = useComputed$(() => [
    { value: '', label: mc.fieldStreetTypePlaceholder },
    ...streetTypes.value.map((t) => ({
      value: String(t.id),
      label: t.abbreviation ? `${t.abbreviation} — ${t.name}` : t.name,
    })),
  ]);

  const currentAddress = address.value;

  return (
    <AuthenticatedShell
      eyebrow={m.eyebrow}
      title={m.title}
      description={m.description}
      meta={m.meta}
      allowedUserTypes={['SUPER', 'CE']}
      accessDeniedDescription={m.accessDenied}
    >
      <Toolbar q:slot="toolbar">
        <Button
          q:slot="leading"
          variant="ghost"
          iconLeft="back"
          onClick$={goBack$}
        >
          {m.toolbarBack}
        </Button>
        <span q:slot="center">{m.toolbarCenter}</span>
      </Toolbar>

      <div class="edit-address-page">
        <ModuleHeader
          tituloModulo={m.tituloModulo}
          accionActual={m.title}
          onBack$={goBack$}
        />

        {error.value && !errorField.value && (
          <Toast tone="danger" title="Error">
            {error.value}
          </Toast>
        )}

        {success.value && (
          <Toast tone="success" title={m.successToastTitle}>
            {m.successToastDescription}
          </Toast>
        )}

        {/* ── Cargando ── */}
        {loading.value && (
          <Panel title={m.loadingTitle} description={m.loadingDescription}>
            <div class="edit-address__loading" />
          </Panel>
        )}

        {/* ── Modo selección: buscar persona ── */}
        {!loading.value && selectionMode.value && (
          <>
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
                noAddressForPerson.value = '';
              }}
              onSelect$={$(async (option) => {
                const person = personResults.value.find(
                  (p) => p.id === Number(option.value),
                );
                if (!person) return;
                const found = await addressService.findOne(person.curp);
                if (found) {
                  await nav(`${ROUTES.ADDRESSES_EDIT}?id=${found.id}`);
                } else {
                  noAddressForPerson.value = person.fullName;
                }
              })}
            />

            {noAddressForPerson.value && (
              <Toast tone="warning" title={noAddressForPerson.value}>
                {m.noAddressFound}
              </Toast>
            )}
          </>
        )}

        {/* ── Formulario de edición ── */}
        {!loading.value && currentAddress && (
          <div class="edit-address-layout">
            {/* Persona titular */}
            <Panel
              title={m.panelPersonTitle}
              description={m.panelPersonDescription}
            >
              <div class="edit-address-person">
                <div class="edit-address-person__icon" aria-hidden="true">
                  <AppIcon intent="person" size="md" />
                </div>
                <div class="edit-address-person__info">
                  <strong>{currentAddress.fullName}</strong>
                  <span>{currentAddress.curp}</span>
                  <small>ID dirección: {currentAddress.id}</small>
                </div>
              </div>
            </Panel>

            {/* Asentamiento */}
            <Panel
              title={m.panelLocationTitle}
              description={m.panelLocationDescription}
            >
              {changingSettlement.value ? (
                <div class="edit-address-settlement-change">
                  <SelectionStep
                    title={mc.panelZipCodeTitle}
                    description={mc.panelZipCodeDescription}
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
                      if (s) {
                        changedSettlement.value = s;
                        changingSettlement.value = false;
                        cpInput.value = '';
                        settlements.value = [];
                      }
                    }}
                  />
                  <div class="edit-address-settlement-change__cancel">
                    <Button
                      variant="ghost"
                      iconLeft="close"
                      size="sm"
                      onClick$={() => {
                        changingSettlement.value = false;
                        cpInput.value = '';
                        settlements.value = [];
                      }}
                    >
                      {m.cancelSettlementChange}
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  class={[
                    'edit-address-settlement-card',
                    changedSettlement.value ? 'is-changed' : '',
                  ].join(' ')}
                >
                  <div
                    class="edit-address-settlement-card__icon"
                    aria-hidden="true"
                  >
                    <AppIcon intent="pin" size="md" />
                  </div>
                  <div class="edit-address-settlement-card__info">
                    <strong>
                      {changedSettlement.value
                        ? `${changedSettlement.value.abbreviation} ${changedSettlement.value.settlement}`
                        : `${currentAddress.settlementType} ${currentAddress.settlement}`}
                    </strong>
                    <span>
                      {changedSettlement.value
                        ? `CP ${changedSettlement.value.zipCode} · ${changedSettlement.value.municipality}, ${changedSettlement.value.stateName}`
                        : `CP ${currentAddress.zipCode} · ${currentAddress.municipalityName}, ${currentAddress.stateName}`}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    iconLeft="edit"
                    size="sm"
                    onClick$={() => {
                      changingSettlement.value = true;
                    }}
                  >
                    {m.settlementChangeButton}
                  </Button>
                </div>
              )}
            </Panel>

            {/* Datos del domicilio */}
            <Panel
              title={m.panelAddressTitle}
              description={m.panelAddressDescription}
              density="compact"
            >
              <div class="edit-address-form">
                <div class="edit-address-grid edit-address-grid--street">
                  <Field
                    label={mc.fieldStreetTypeLabel}
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
                    label={mc.fieldStreetLabel}
                    error={
                      errorField.value === 'street' ? error.value : undefined
                    }
                  >
                    <Input
                      placeholder={mc.fieldStreetPlaceholder}
                      value={street.value}
                      invalid={errorField.value === 'street'}
                      onInput$={(event) => {
                        street.value = (event.target as HTMLInputElement).value;
                        errorField.value = '';
                      }}
                    />
                  </Field>
                </div>

                <div class="edit-address-grid edit-address-grid--numbers">
                  <Field label={mc.fieldExteriorNumberLabel}>
                    <Input
                      placeholder={mc.fieldExteriorNumberPlaceholder}
                      value={exteriorNumber.value}
                      onInput$={(event) => {
                        exteriorNumber.value = (
                          event.target as HTMLInputElement
                        ).value;
                      }}
                    />
                  </Field>
                  <Field label={mc.fieldInteriorNumberLabel}>
                    <Input
                      placeholder={mc.fieldInteriorNumberPlaceholder}
                      value={interiorNumber.value}
                      onInput$={(event) => {
                        interiorNumber.value = (
                          event.target as HTMLInputElement
                        ).value;
                      }}
                    />
                  </Field>
                  <Field label={mc.fieldBlockLabel}>
                    <Input
                      placeholder={mc.fieldBlockPlaceholder}
                      value={block.value}
                      onInput$={(event) => {
                        block.value = (event.target as HTMLInputElement).value;
                      }}
                    />
                  </Field>
                </div>

                <Field label={mc.fieldBetweenStreetsLabel}>
                  <Input
                    placeholder={mc.fieldBetweenStreetsPlaceholder}
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

            <div class="edit-address-actions">
              <Button variant="secondary" onClick$={goBack$}>
                {m.actionCancel}
              </Button>
              <Button
                iconLeft="save"
                loading={saving.value}
                disabled={saving.value}
                onClick$={saveChanges$}
              >
                {saving.value ? m.saving : m.actionSave}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Editar dirección`,
};

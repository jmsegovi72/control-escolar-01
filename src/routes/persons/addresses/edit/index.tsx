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
  AddressInfo,
  Settlement,
  StreetType,
} from '~/types/address.types';
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
import { EditResult, EditResultRow } from '~/ui/composed/EditResult';
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
  const address = useSignal<AddressInfo | null>(null);
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
    success.value = false;
    personQuery.value = '';
    personResults.value = [];
    searchingPerson.value = false;
    street.value = '';
    streetTypeId.value = 0;
    exteriorNumber.value = '';
    interiorNumber.value = '';
    block.value = '';
    betweenStreets.value = '';
    cpInput.value = '';
    settlements.value = [];
    searchingCp.value = false;

    const id = idParam ? Number(idParam) : 0;

    if (!id) {
      selectionMode.value = true;
      if (streetTypes.value.length === 0) {
        try {
          streetTypes.value = await catalogService.getStreetTypes();
        } catch {
          streetTypes.value = [];
        }
      }
      loading.value = false;
      return;
    }

    try {
      const foundPromise = addressService.findOne(id);
      const streetTypesPromise =
        streetTypes.value.length === 0
          ? catalogService.getStreetTypes()
          : Promise.resolve(streetTypes.value);

      const [found, streetTypesData] = await Promise.all([
        foundPromise,
        streetTypesPromise,
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
      const currentAddress = address.value;
      if (!currentAddress) return;

      const changes: Record<string, unknown> = {};

      const streetChanged =
        street.value.trim() !== (currentAddress.street ?? '').trim();
      const exteriorChanged =
        exteriorNumber.value.trim() !==
        (currentAddress.exteriorNumber ?? '').trim();
      const interiorChanged =
        interiorNumber.value.trim() !==
        (currentAddress.interiorNumber ?? '').trim();
      const blockChanged =
        block.value.trim() !== (currentAddress.block ?? '').trim();
      const betweenChanged =
        betweenStreets.value.trim() !==
        (currentAddress.betweenStreets ?? '').trim();
      const originalStreetTypeId =
        streetTypes.value.find(
          (t) =>
            t.name === currentAddress.streetType ||
            t.abbreviation === currentAddress.streetType,
        )?.id ?? 0;
      const streetTypeChanged = streetTypeId.value !== originalStreetTypeId;
      const settlementChanged = changedSettlement.value !== null;

      if (streetTypeChanged) {
        changes.streetTypeId = streetTypeId.value;
      }
      if (streetChanged) {
        changes.street = street.value.trim();
      }
      if (exteriorChanged) {
        const v = exteriorNumber.value.trim();
        changes.exteriorNumber = v === '' ? null : v;
      }
      if (interiorChanged) {
        const v = interiorNumber.value.trim();
        changes.interiorNumber = v === '' ? null : v;
      }
      if (blockChanged) {
        const v = block.value.trim();
        changes.block = v === '' ? null : v;
      }
      if (betweenChanged) {
        const v = betweenStreets.value.trim();
        changes.betweenStreets = v === '' ? null : v;
      }
      if (settlementChanged && changedSettlement.value) {
        changes.zipCodeId = changedSettlement.value.id;
      }

      if (Object.keys(changes).length === 0) {
        error.value = 'No hay cambios para guardar.';
        errorField.value = '';
        saving.value = false;
        return;
      }

      const updated = await addressService.update(currentAddress.id, changes);
      address.value = updated;
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

  const hasChanges = useComputed$(() => {
    const ca = address.value;
    if (!ca) return false;

    const streetChanged = street.value.trim() !== (ca.street ?? '').trim();
    const exteriorChanged =
      exteriorNumber.value.trim() !== (ca.exteriorNumber ?? '').trim();
    const interiorChanged =
      interiorNumber.value.trim() !== (ca.interiorNumber ?? '').trim();
    const blockChanged = block.value.trim() !== (ca.block ?? '').trim();
    const betweenChanged =
      betweenStreets.value.trim() !== (ca.betweenStreets ?? '').trim();
    const originalStreetTypeId =
      streetTypes.value.find(
        (t) => t.name === ca.streetType || t.abbreviation === ca.streetType,
      )?.id ?? 0;
    const streetTypeChanged = streetTypeId.value !== originalStreetTypeId;
    const settlementChanged = changedSettlement.value !== null;

    const result =
      streetChanged ||
      exteriorChanged ||
      interiorChanged ||
      blockChanged ||
      betweenChanged ||
      streetTypeChanged ||
      settlementChanged;

    return result;
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

      <div class="edit-address-page">
        <div class="edit-address-page__content">
          {error.value && !errorField.value && (
            <Toast tone="danger" title="Error">
              {error.value}
            </Toast>
          )}

          {!loading.value && success.value && currentAddress && (
            <div class="edit-address-layout">
              <EditResult
                eyebrow={m.successResultEyebrow}
                title={m.successResultTitle}
                description={m.successResultDescription}
              >
                <EditResultRow
                  label={mc.successResultPersonLabel}
                  value={currentAddress.fullName}
                />
                <EditResultRow
                  label={mc.successResultStreetLabel}
                  value={`${currentAddress.streetType} ${currentAddress.street}`}
                />
                <EditResultRow
                  label={mc.successResultExteriorLabel}
                  value={currentAddress.exteriorNumber}
                  fallback={mc.successResultNoData}
                />
                <EditResultRow
                  label={mc.successResultInteriorLabel}
                  value={currentAddress.interiorNumber}
                  fallback={mc.successResultNoData}
                />
                <EditResultRow
                  label={mc.successResultBlockLabel}
                  value={currentAddress.block}
                  fallback={mc.successResultNoData}
                />
                <EditResultRow
                  label={mc.successResultBetweenStreetsLabel}
                  value={currentAddress.betweenStreets}
                  fallback={mc.successResultNoData}
                />
                <EditResultRow
                  label={mc.successResultZipCodeLabel}
                  value={currentAddress.zipCode}
                />
                <EditResultRow
                  label={mc.successResultSettlementLabel}
                  value={currentAddress.settlement}
                />
                <EditResultRow
                  label={mc.successResultSettlementTypeLabel}
                  value={currentAddress.settlementType}
                />
                <EditResultRow
                  label={mc.successResultLocalityLabel}
                  value={currentAddress.locality}
                  fallback={mc.successResultNoData}
                />
                <EditResultRow
                  label={mc.successResultMunicipalityLabel}
                  value={currentAddress.municipalityName}
                />
                <EditResultRow
                  label={mc.successResultMunicipalCapitalLabel}
                  value={currentAddress.municipalCapital}
                  fallback={mc.successResultNoData}
                />
                <EditResultRow
                  label={mc.successResultStateLabel}
                  value={currentAddress.stateName}
                />

                <div q:slot="actions">
                  <Button
                    variant="ghost"
                    iconLeft="view"
                    onClick$={async () => {
                      await nav(ROUTES.ADDRESSES_EDIT);
                    }}
                  >
                    {m.successResultViewAnother}
                  </Button>
                  <Button
                    iconRight="chevron-right"
                    onClick$={async () => await nav(ROUTES.ADDRESSES)}
                  >
                    {m.successResultFinish}
                  </Button>
                </div>
              </EditResult>
            </div>
          )}

          {/* ── Cargando ── */}
          {loading.value && (
            <Panel title={m.loadingTitle} description={m.loadingDescription}>
              <div class="edit-address__loading" />
            </Panel>
          )}

          {/* ── Modo selección: buscar persona ── */}
          {!loading.value && selectionMode.value && (
            <div class="edit-address-search-shell">
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
            </div>
          )}

          {/* ── Formulario de edición ── */}
          {!loading.value && !success.value && currentAddress && (
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
                          street.value = (
                            event.target as HTMLInputElement
                          ).value;
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
                          block.value = (
                            event.target as HTMLInputElement
                          ).value;
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
  title: `${appConfig.name} | Editar dirección`,
};

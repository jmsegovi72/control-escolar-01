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
import { addressService } from '~/services/address/address.service';
import { personService } from '~/services/person/person.service';
import type { AddressListItem } from '~/types/address.types';
import type { PersonListItem } from '~/types/person.types';
import {
  ActionHeader,
  Avatar,
  Button,
  EmptyState,
  Panel,
  SelectionStep,
  Toast,
} from '~/ui';
import { AppIcon } from '~/ui/icons';
import { addressesWorkflow } from '~/utils/addresses-workflow';
import { normalizeError } from '~/utils/api-error';
import './detail.css';

const m = messages.addresses.detail;
const mc = messages.addresses.create;

export default component$(() => {
  const nav = useNavigate();
  const location = useLocation();

  const address = useSignal<AddressListItem | null>(null);
  const loading = useSignal(true);
  const error = useSignal('');
  const returnPath = useSignal<string>(ROUTES.ADDRESSES);
  const selectionMode = useSignal(false);
  const noAddressForPerson = useSignal('');

  const personQuery = useSignal('');
  const personResults = useSignal<PersonListItem[]>([]);
  const searchingPerson = useSignal(false);

  useVisibleTask$(async ({ track }) => {
    const idParam = track(() => location.url.searchParams.get('id'));

    loading.value = true;
    error.value = '';
    address.value = null;
    returnPath.value = ROUTES.ADDRESSES;
    selectionMode.value = false;
    noAddressForPerson.value = '';
    personQuery.value = '';
    personResults.value = [];
    searchingPerson.value = false;

    const id = idParam ? Number(idParam) : 0;
    returnPath.value = addressesWorkflow.getReturnPath();

    if (!id) {
      selectionMode.value = true;
      loading.value = false;
      return;
    }

    try {
      const found = await addressService.findOne(id);
      if (!found) {
        error.value = messages.errors.notFound;
        return;
      }
      address.value = found;
    } catch (err) {
      error.value = normalizeError(
        err,
        'No se pudo cargar la dirección.',
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
    if (returnPath.value !== ROUTES.ADDRESSES) {
      await nav(returnPath.value);
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    await nav(ROUTES.ADDRESSES);
  });

  const current = address.value;

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

      <div class="address-detail-page">
        <div class="address-detail__content">
          {/* ── Cargando ── */}
          {loading.value && (
            <Panel title={m.loadingTitle} description={m.loadingDescription}>
              <div class="address-detail__loading" />
            </Panel>
          )}

          {/* ── Error ── */}
          {!loading.value && error.value && (
            <Toast tone="danger" title="Error">
              {error.value}
            </Toast>
          )}

          {/* ── Selección ── */}
          {!loading.value &&
            selectionMode.value &&
            !noAddressForPerson.value && (
              <div class="address-detail__search-shell">
                <SelectionStep
                  title={m.selectionTitle}
                  description={m.selectionDescription}
                  fieldLabel={mc.personSearchLabel}
                  fieldHint={m.fieldPersonHint}
                  placeholder={messages.persons.edit.searchPlaceholder}
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
                      await nav(`${ROUTES.ADDRESSES_DETAIL}?id=${found.id}`);
                    } else {
                      noAddressForPerson.value = person.fullName;
                    }
                  })}
                />
              </div>
            )}

          {/* ── No encontrado ── */}
          {!loading.value && noAddressForPerson.value && (
            <div class="address-detail__search-shell">
              <EmptyState
                title={m.notFoundTitle}
                description={m.notFoundDescription.replace(
                  '{name}',
                  noAddressForPerson.value,
                )}
                tone="warning"
                actionLabel={m.notFoundCreateAction}
                onAction$={async () => {
                  await nav(ROUTES.ADDRESSES_CREATE);
                }}
              />
            </div>
          )}

          {/* ── Detalle ── */}
          {!loading.value && current && (
            <article class="address-detail__result-card">
              <header class="address-detail__result-header">
                <div class="address-detail__icon" aria-hidden="true">
                  <AppIcon intent="pin" size="md" />
                </div>
                <div class="address-detail__result-identity">
                  <span class="address-detail__result-eyebrow">
                    {messages.addresses.detail.eyebrow}
                  </span>
                  <h2>{current.fullAddress ?? current.street}</h2>
                  <div class="address-detail__result-meta">
                    <span class="address-detail__result-pill">
                      CP {current.zipCode}
                    </span>
                    <span class="address-detail__result-divider">·</span>
                    <span class="address-detail__result-state">
                      {current.stateName}
                    </span>
                  </div>
                  <p class="address-detail__result-id">ID: {current.id}</p>
                </div>
              </header>

              <div class="address-detail__result-body">
                {/* ── Propietario ── */}
                <section class="address-detail__section">
                  <div class="address-detail__section-title">
                    {m.sectionOwnerTitle}
                  </div>
                  <div class="address-detail__owner-row">
                    <Avatar name={current.fullName} size="md" />
                    <div class="address-detail__owner-info">
                      <strong>{current.fullName}</strong>
                      <span>{current.curp}</span>
                    </div>
                  </div>
                </section>

                {/* ── Ubicación ── */}
                <section class="address-detail__section">
                  <div class="address-detail__section-title">
                    {m.sectionLocationTitle}
                  </div>
                  <div class="address-detail__section-grid">
                    <div class="address-detail__field">
                      <span class="address-detail__field-label">
                        {m.fieldZipCode}
                      </span>
                      <span class="address-detail__field-value address-detail__field-value--mono">
                        {current.zipCode}
                      </span>
                    </div>
                    <div class="address-detail__field">
                      <span class="address-detail__field-label">
                        {m.fieldSettlement}
                      </span>
                      <span class="address-detail__field-value">
                        {current.settlementType} {current.settlement}
                      </span>
                    </div>
                    <div class="address-detail__field">
                      <span class="address-detail__field-label">
                        {m.fieldLocality}
                      </span>
                      <span
                        class={`address-detail__field-value${current.locality ? '' : ' address-detail__field-value--empty'}`}
                      >
                        {current.locality || '—'}
                      </span>
                    </div>
                    <div class="address-detail__field">
                      <span class="address-detail__field-label">
                        {m.fieldMunicipality}
                      </span>
                      <span class="address-detail__field-value">
                        {current.municipalityName}
                      </span>
                    </div>
                    <div class="address-detail__field">
                      <span class="address-detail__field-label">
                        {m.fieldMunicipalCapital}
                      </span>
                      <span
                        class={`address-detail__field-value${current.municipalCapital ? '' : ' address-detail__field-value--empty'}`}
                      >
                        {current.municipalCapital || '—'}
                      </span>
                    </div>
                    <div class="address-detail__field">
                      <span class="address-detail__field-label">
                        {m.fieldState}
                      </span>
                      <span class="address-detail__field-value">
                        {current.stateName}
                      </span>
                    </div>
                  </div>
                </section>

                {/* ── Calle y número ── */}
                <section class="address-detail__section">
                  <div class="address-detail__section-title">
                    {m.sectionStreetTitle}
                  </div>
                  <div class="address-detail__section-grid">
                    <div class="address-detail__field">
                      <span class="address-detail__field-label">
                        {m.fieldStreetType}
                      </span>
                      <span class="address-detail__field-value">
                        {current.streetType}
                      </span>
                    </div>
                    <div class="address-detail__field">
                      <span class="address-detail__field-label">
                        {m.fieldStreet}
                      </span>
                      <span class="address-detail__field-value">
                        {current.street}
                      </span>
                    </div>
                    <div class="address-detail__field">
                      <span class="address-detail__field-label">
                        {m.fieldExteriorNumber}
                      </span>
                      <span class="address-detail__field-value">
                        {current.exteriorNumber}
                      </span>
                    </div>
                    <div class="address-detail__field">
                      <span class="address-detail__field-label">
                        {m.fieldInteriorNumber}
                      </span>
                      <span
                        class={`address-detail__field-value${current.interiorNumber ? '' : ' address-detail__field-value--empty'}`}
                      >
                        {current.interiorNumber || '—'}
                      </span>
                    </div>
                    <div class="address-detail__field">
                      <span class="address-detail__field-label">
                        {m.fieldBlock}
                      </span>
                      <span
                        class={`address-detail__field-value${current.block ? '' : ' address-detail__field-value--empty'}`}
                      >
                        {current.block || '—'}
                      </span>
                    </div>
                    <div class="address-detail__field">
                      <span class="address-detail__field-label">
                        {m.fieldBetweenStreets}
                      </span>
                      <span
                        class={`address-detail__field-value${current.betweenStreets ? '' : ' address-detail__field-value--empty'}`}
                      >
                        {current.betweenStreets || '—'}
                      </span>
                    </div>
                  </div>
                </section>
              </div>

              {/* ── Acciones ── */}
              <div class="address-detail__result-actions">
                <Button
                  variant="ghost"
                  iconLeft="edit"
                  onClick$={async () => {
                    await nav(`${ROUTES.ADDRESSES_EDIT}?id=${current.id}`);
                  }}
                >
                  {m.actionEdit}
                </Button>
                <Button
                  iconLeft="view"
                  onClick$={async () => {
                    await nav(ROUTES.ADDRESSES_DETAIL);
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
  title: `${appConfig.name} | Detalle de dirección`,
};

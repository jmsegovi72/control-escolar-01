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
  Button,
  Panel,
  SelectionStep,
  Toast,
  Toolbar,
} from '~/ui';
import { AppIcon } from '~/ui/icons';
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
  const returnPath = useSignal(ROUTES.ADDRESSES);
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
    selectionMode.value = false;
    noAddressForPerson.value = '';

    const id = idParam ? Number(idParam) : 0;

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
    await nav(returnPath.value);
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
    >
      <Toolbar q:slot="toolbar">
        <Button
          q:slot="leading"
          variant="ghost"
          iconLeft="back"
          onClick$={goBack$}
        >
          {m.etiquetaRegresar}
        </Button>
        {current && (
          <Button
            q:slot="actions"
            variant="primary"
            iconLeft="edit"
            onClick$={async () =>
              await nav(`${ROUTES.ADDRESSES_EDIT}?id=${current.id}`)
            }
          >
            {m.actionEdit}
          </Button>
        )}
      </Toolbar>

      <div class="detail-address-page">
        <ActionHeader title={m.title} onBack$={goBack$} />

        {/* ── Cargando ── */}
        {loading.value && (
          <Panel title={m.loadingTitle} description={m.loadingDescription}>
            <div class="detail-address__loading" />
          </Panel>
        )}

        {/* ── Error ── */}
        {!loading.value && error.value && (
          <Toast tone="danger" title="Error">
            {error.value}
          </Toast>
        )}

        {/* ── Selección ── */}
        {!loading.value && selectionMode.value && (
          <>
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
            {noAddressForPerson.value && (
              <Toast tone="warning" title={noAddressForPerson.value}>
                {m.noAddressFound}
              </Toast>
            )}
          </>
        )}

        {/* ── Detalle ── */}
        {!loading.value && current && (
          <div class="detail-address-layout">
            {/* ── Ficha 1: Persona ── */}
            <div class="detail-ficha">
              <div class="detail-ficha__header">
                <div
                  class="detail-ficha__icon detail-ficha__icon--person"
                  aria-hidden="true"
                >
                  <AppIcon intent="person" size="sm" />
                </div>
                <div>
                  <p class="detail-ficha__title">{m.panelPersonTitle}</p>
                  <p class="detail-ficha__subtitle">
                    {m.panelPersonDescription}
                  </p>
                </div>
              </div>
              <div class="detail-ficha__body">
                <div class="detail-field">
                  <span class="detail-field__label">{m.fieldFullName}</span>
                  <span class="detail-field__value">{current.fullName}</span>
                </div>
                <div class="detail-fields-row detail-fields-row--2">
                  <div class="detail-field">
                    <span class="detail-field__label">{m.fieldCurp}</span>
                    <span class="detail-field__value detail-field__value--mono">
                      {current.curp}
                    </span>
                  </div>
                  <div class="detail-field">
                    <span class="detail-field__label">{m.fieldId}</span>
                    <span class="detail-field__value">{current.id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Ficha 2: Dirección ── */}
            <div class="detail-ficha">
              <div class="detail-ficha__header">
                <div
                  class="detail-ficha__icon detail-ficha__icon--address"
                  aria-hidden="true"
                >
                  <AppIcon intent="pin" size="sm" />
                </div>
                <div>
                  <p class="detail-ficha__title">{m.panelAddressTitle}</p>
                  <p class="detail-ficha__subtitle">
                    {m.panelAddressDescription}
                  </p>
                </div>
              </div>
              <div class="detail-ficha__body">
                {/* Sección: Ubicación */}
                <div class="detail-ficha__section">
                  <div class="detail-fields-row detail-fields-row--4">
                    <div class="detail-field">
                      <span class="detail-field__label">{m.fieldZipCode}</span>
                      <span class="detail-field__value detail-field__value--mono">
                        {current.zipCode}
                      </span>
                    </div>
                    <div class="detail-field detail-field--span-2">
                      <span class="detail-field__label">
                        {m.fieldSettlement}
                      </span>
                      <span class="detail-field__value">
                        {current.settlementType} {current.settlement}
                      </span>
                    </div>
                    <div class="detail-field">
                      <span class="detail-field__label">
                        {m.fieldMunicipality}
                      </span>
                      <span class="detail-field__value">
                        {current.municipalityName}
                      </span>
                    </div>
                  </div>
                  <div class="detail-fields-row detail-fields-row--4">
                    <div class="detail-field detail-field--span-3">
                      <span class="detail-field__label">{m.fieldState}</span>
                      <span class="detail-field__value">
                        {current.stateName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sección: Calle y número */}
                <div class="detail-ficha__section">
                  <div class="detail-fields-row detail-fields-row--street">
                    <div class="detail-field">
                      <span class="detail-field__label">
                        {m.fieldStreetType}
                      </span>
                      <span class="detail-field__value">
                        {current.streetType}
                      </span>
                    </div>
                    <div class="detail-field">
                      <span class="detail-field__label">{m.fieldStreet}</span>
                      <span class="detail-field__value">{current.street}</span>
                    </div>
                  </div>
                  <div class="detail-fields-row detail-fields-row--3">
                    <div class="detail-field">
                      <span class="detail-field__label">
                        {m.fieldExteriorNumber}
                      </span>
                      <span class="detail-field__value">
                        {current.exteriorNumber || '—'}
                      </span>
                    </div>
                    <div class="detail-field">
                      <span class="detail-field__label">
                        {m.fieldInteriorNumber}
                      </span>
                      <span class="detail-field__value">
                        {current.interiorNumber || '—'}
                      </span>
                    </div>
                    <div class="detail-field">
                      <span class="detail-field__label">{m.fieldBlock}</span>
                      <span class="detail-field__value">
                        {current.block || '—'}
                      </span>
                    </div>
                  </div>
                  <div class="detail-field">
                    <span class="detail-field__label">
                      {m.fieldBetweenStreets}
                    </span>
                    <span class="detail-field__value">
                      {current.betweenStreets || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Detalle de dirección`,
};

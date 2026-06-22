import {
  $,
  component$,
  useComputed$,
  useSignal,
  useVisibleTask$,
} from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { appConfig } from '~/config/app.config';
import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
import { addressService } from '~/services/address/address.service';
import { catalogService } from '~/services/catalog/catalog.service';
import type { AddressListItem } from '~/types/address.types';
import type { Municipality, State } from '~/types/catalog.types';
import {
  ActionHeader,
  Button,
  DataTable,
  Field,
  Input,
  Panel,
  Select,
} from '~/ui';
import { AppIcon } from '~/ui/icons';
import { DEFAULT_DATA_TABLE_PAGE_SIZE_OPTIONS } from '~/ui/patterns/DataTable/data-table.config';
import type {
  DataTableAction,
  DataTableColumn,
} from '~/ui/patterns/DataTable/data-table.types';
import { addressesWorkflow } from '~/utils/addresses-workflow';
import { normalizeError } from '~/utils/api-error';
import { hasPermission } from '~/utils/permissions';
import { sessionStore } from '~/utils/session';
import './search.css';

const m = messages.addresses.search;

type AddressRow = Record<string, unknown> &
  AddressListItem & {
    exteriorNumberLabel: string;
    ownerLabel: string;
    fullAddressLabel: string;
  };

const toRow = (item: AddressListItem): AddressRow => ({
  ...item,
  exteriorNumberLabel: item.exteriorNumber || m.noData,
  ownerLabel: `${item.fullName} · ${item.curp}`,
  fullAddressLabel: item.fullAddress || `${item.streetType} ${item.street}`,
});

export default component$(() => {
  const nav = useNavigate();

  const states = useSignal<State[]>([]);
  const resultStates = useSignal<State[]>([]);
  const municipalities = useSignal<Municipality[]>([]);
  const resultMunicipalities = useSignal<
    { stateName: string; municipalityName: string }[]
  >([]);
  const rows = useSignal<AddressRow[]>([]);
  const total = useSignal(0);
  const page = useSignal(1);
  const limit = useSignal(10);
  const loading = useSignal(false);
  const searched = useSignal(false);
  const error = useSignal('');
  const canWrite = useSignal(false);
  const showFilters = useSignal(false);

  const searchTerm = useSignal('');
  const appliedSearchTerm = useSignal('');
  const fullName = useSignal('');
  const stateId = useSignal('');
  const stateName = useSignal('');
  const municipalityName = useSignal('');
  const zipCode = useSignal('');
  const street = useSignal('');
  const settlement = useSignal('');

  const stateOptions = useComputed$(() => {
    const source = states.value.length > 0 ? states.value : resultStates.value;

    return [
      { value: '', label: m.fieldStatePlaceholder },
      ...source.map((state) => ({
        value: String(state.id),
        label: state.name,
      })),
    ];
  });

  const municipalityOptions = useComputed$(() => {
    if (!stateId.value) {
      return [{ value: '', label: m.fieldMunicipalityDisabledPlaceholder }];
    }

    if (searched.value && resultMunicipalities.value.length > 0) {
      const filtered = resultMunicipalities.value.filter(
        (item) => item.stateName === stateName.value,
      );

      return [
        { value: '', label: m.fieldMunicipalityPlaceholder },
        ...filtered.map((item) => ({
          value: item.municipalityName,
          label: item.municipalityName,
        })),
      ];
    }

    return [
      { value: '', label: m.fieldMunicipalityPlaceholder },
      ...municipalities.value.map((item) => ({
        value: item.municipality,
        label: item.municipality,
      })),
    ];
  });

  const activeAdvancedFilterCount = useComputed$(() => {
    const values = [
      fullName.value.trim(),
      stateName.value.trim(),
      municipalityName.value.trim(),
      zipCode.value.trim(),
      street.value.trim(),
      settlement.value.trim(),
    ];

    return values.filter(Boolean).length;
  });

  const activeFilterCount = useComputed$(() => {
    return (
      activeAdvancedFilterCount.value + (appliedSearchTerm.value.trim() ? 1 : 0)
    );
  });

  const filtersInfo = useComputed$(() => {
    const count = activeFilterCount.value;
    const resultsCount = total.value;

    if (count === 0 && !searched.value) {
      return m.filtersInfoEmpty;
    }

    if (count === 0) {
      const resultWord =
        resultsCount === 1 ? m.resultWordSingular : m.resultWordPlural;
      return `Sin filtros activos · ${resultsCount} ${resultWord}`;
    }

    const filterWord = count === 1 ? m.filterWordSingular : m.filterWordPlural;
    const activeWord =
      count === 1 ? m.filtersInfoActiveSingular : m.filtersInfoActive;

    if (!searched.value) {
      return `${count} ${filterWord} ${activeWord} · ${m.filtersInfoReady}`;
    }

    const resultWord =
      resultsCount === 1 ? m.resultWordSingular : m.resultWordPlural;

    return `${count} ${filterWord} ${activeWord} · ${resultsCount} ${resultWord}`;
  });

  const activeChips = useComputed$(() => {
    const chips: Array<{ key: string; label: string }> = [];

    if (appliedSearchTerm.value.trim()) {
      chips.push({
        key: 'searchTerm',
        label: `Búsqueda: ${appliedSearchTerm.value}`,
      });
    }
    if (fullName.value.trim()) {
      chips.push({
        key: 'fullName',
        label: `Titular: ${fullName.value}`,
      });
    }
    if (stateName.value.trim()) {
      chips.push({
        key: 'stateName',
        label: `Estado: ${stateName.value}`,
      });
    }
    if (municipalityName.value.trim()) {
      chips.push({
        key: 'municipalityName',
        label: `Municipio: ${municipalityName.value}`,
      });
    }
    if (zipCode.value.trim()) {
      chips.push({
        key: 'zipCode',
        label: `CP: ${zipCode.value}`,
      });
    }
    if (street.value.trim()) {
      chips.push({
        key: 'street',
        label: `Calle: ${street.value}`,
      });
    }
    if (settlement.value.trim()) {
      chips.push({
        key: 'settlement',
        label: `Colonia: ${settlement.value}`,
      });
    }

    return chips;
  });

  const searchAddresses$ = $(async () => {
    loading.value = true;
    searched.value = true;
    error.value = '';

    try {
      const response = await addressService.findMany({
        searchTerm: appliedSearchTerm.value.trim() || undefined,
        fullName: fullName.value.trim() || undefined,
        stateName: stateName.value.trim() || undefined,
        municipalityName: municipalityName.value.trim() || undefined,
        zipCode: zipCode.value.trim() || undefined,
        street: street.value.trim() || undefined,
        settlement: settlement.value.trim() || undefined,
        page: page.value,
        limit: limit.value,
      });

      rows.value = response.data.map(toRow);
      total.value = response.total ?? response.meta?.totalRecords ?? 0;
      resultStates.value = [
        ...new Map(
          response.data
            .filter((item) => Boolean(item.stateId) && Boolean(item.stateName))
            .map((item) => [
              String(item.stateId),
              {
                id: item.stateId,
                code: '',
                name: item.stateName,
              },
            ]),
        ).values(),
      ].sort((a, b) => a.name.localeCompare(b.name));
      resultMunicipalities.value = [
        ...new Map(
          response.data
            .filter(
              (item) =>
                Boolean(item.stateName) && Boolean(item.municipalityName),
            )
            .map((item) => [
              `${item.stateName}|${item.municipalityName}`,
              {
                stateName: item.stateName,
                municipalityName: item.municipalityName,
              },
            ]),
        ).values(),
      ].sort((a, b) => a.municipalityName.localeCompare(b.municipalityName));
    } catch (err) {
      rows.value = [];
      total.value = 0;
      resultStates.value = [];
      resultMunicipalities.value = [];
      error.value = normalizeError(err, messages.errors.searchFailed).message;
    } finally {
      loading.value = false;
    }
  });

  const saveWorkContext$ = $((row: AddressRow) => {
    addressesWorkflow.save(
      {
        searchTerm: appliedSearchTerm.value,
        fullName: fullName.value,
        stateName: stateName.value,
        municipalityName: municipalityName.value,
        zipCode: zipCode.value,
        street: street.value,
        settlement: settlement.value,
        limit: limit.value,
        page: page.value,
      },
      row,
    );
  });

  const clearFilters$ = $(() => {
    searchTerm.value = '';
    appliedSearchTerm.value = '';
    fullName.value = '';
    stateId.value = '';
    stateName.value = '';
    municipalityName.value = '';
    zipCode.value = '';
    street.value = '';
    settlement.value = '';
    page.value = 1;
    rows.value = [];
    total.value = 0;
    searched.value = false;
    showFilters.value = false;
    error.value = '';
    resultStates.value = [];
    municipalities.value = [];
    resultMunicipalities.value = [];
    addressesWorkflow.clear();
  });

  const removeFilter$ = $(async (key: string) => {
    if (key === 'searchTerm') {
      searchTerm.value = '';
      appliedSearchTerm.value = '';
    }
    if (key === 'fullName') fullName.value = '';
    if (key === 'stateName') {
      stateId.value = '';
      stateName.value = '';
      municipalityName.value = '';
      municipalities.value = [];
    }
    if (key === 'municipalityName') municipalityName.value = '';
    if (key === 'zipCode') zipCode.value = '';
    if (key === 'street') street.value = '';
    if (key === 'settlement') settlement.value = '';

    page.value = 1;
    await searchAddresses$();
  });

  useVisibleTask$(async () => {
    canWrite.value = hasPermission(
      sessionStore.getPermissions(),
      'addresses',
      'write',
    );

    try {
      states.value = await catalogService.getStates();
    } catch {
      states.value = [];
    }

    const savedState = addressesWorkflow.getState();
    if (savedState?.filters) {
      searchTerm.value = savedState.filters.searchTerm;
      appliedSearchTerm.value = savedState.filters.searchTerm;
      fullName.value = savedState.filters.fullName;
      municipalityName.value = savedState.filters.municipalityName;
      zipCode.value = savedState.filters.zipCode;
      street.value = savedState.filters.street;
      settlement.value = savedState.filters.settlement;
      limit.value = savedState.filters.limit;
      page.value = savedState.filters.page;

      const matchedState = states.value.find(
        (state) => state.name === savedState.filters.stateName,
      );

      if (matchedState) {
        stateId.value = String(matchedState.id);
        stateName.value = matchedState.name;

        try {
          municipalities.value = await catalogService.getMunicipalities({
            stateId: matchedState.id,
          });
        } catch {
          municipalities.value = [];
        }
      } else {
        stateId.value = '';
        stateName.value = '';
      }

      showFilters.value = Boolean(
        savedState.filters.fullName ||
          savedState.filters.stateName ||
          savedState.filters.municipalityName ||
          savedState.filters.zipCode ||
          savedState.filters.street ||
          savedState.filters.settlement,
      );
      await searchAddresses$();
    }
  });

  useVisibleTask$(async ({ track }) => {
    const nextStateId = track(() => stateId.value);

    if (!nextStateId) {
      municipalities.value = [];
      return;
    }

    const selectedState =
      states.value.find((item) => String(item.id) === nextStateId) ?? null;
    stateName.value = selectedState?.name ?? '';

    try {
      municipalities.value = await catalogService.getMunicipalities({
        stateId: Number(nextStateId),
      });
    } catch {
      municipalities.value = [];
    }

    if (
      municipalityName.value &&
      !municipalities.value.some(
        (item) => item.municipality === municipalityName.value,
      ) &&
      !resultMunicipalities.value.some(
        (item) =>
          item.stateName === stateName.value &&
          item.municipalityName === municipalityName.value,
      )
    ) {
      municipalityName.value = '';
    }
  });

  const columns: DataTableColumn<AddressRow>[] = [
    { key: 'fullAddressLabel', label: m.columns.fullAddress, width: '22rem' },
    { key: 'street', label: m.columns.street, width: '12rem' },
    {
      key: 'exteriorNumberLabel',
      label: m.columns.exteriorNumber,
      width: '8rem',
    },
    { key: 'settlement', label: m.columns.settlement, width: '11rem' },
    { key: 'zipCode', label: m.columns.zipCode, width: '7rem' },
    {
      key: 'municipalityName',
      label: m.columns.municipalityName,
      width: '11rem',
    },
    { key: 'stateName', label: m.columns.stateName, width: '11rem' },
    { key: 'ownerLabel', label: m.columns.owner, width: '16rem' },
    { key: 'streetType', label: m.columns.streetType, width: '10rem' },
  ];

  const actions: DataTableAction<AddressRow>[] = [
    {
      label: m.actions.viewDetail,
      icon: 'view',
      onClick$: $(async (row) => {
        await saveWorkContext$(row);
        await nav(`${ROUTES.ADDRESSES_DETAIL}?id=${row.id}`);
      }),
    },
    ...(canWrite.value
      ? ([
          {
            label: m.actions.edit,
            icon: 'edit',
            onClick$: $(async (row) => {
              await saveWorkContext$(row);
              await nav(`${ROUTES.ADDRESSES_EDIT}?id=${row.id}`);
            }),
          },
        ] as DataTableAction<AddressRow>[])
      : []),
  ];

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
      <ActionHeader
        q:slot="hub-header"
        title={m.title}
        onBack$={$(() => {
          if (window.history.length > 1) {
            window.history.back();
            return;
          }

          void nav(ROUTES.ADDRESSES);
        })}
      />

      <div class="addresses-search-page">
        <div class="addresses-search-page__content">
          <section class="addresses-search__filters-panel">
            <form
              class="addresses-search__filters-form"
              preventdefault:submit
              onSubmit$={async () => {
                if (loading.value) return;
                appliedSearchTerm.value = searchTerm.value.trim();
                page.value = 1;
                await searchAddresses$();
              }}
            >
              <div class="addresses-search__filters-top">
                <div class="addresses-search__global">
                  <Input
                    iconLeft="search"
                    placeholder={m.searchPlaceholder}
                    value={searchTerm.value}
                    onInput$={(event) => {
                      searchTerm.value = (
                        event.target as HTMLInputElement
                      ).value;
                    }}
                  />
                </div>

                <div class="addresses-search__top-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    active={showFilters.value}
                    iconLeft="filter"
                    onClick$={() => {
                      showFilters.value = !showFilters.value;
                    }}
                  >
                    <span class="addresses-search__toggle-content">
                      <span>{m.advancedToggle}</span>
                      {activeAdvancedFilterCount.value > 0 && (
                        <span class="addresses-search__active-count">
                          {activeAdvancedFilterCount.value}
                        </span>
                      )}
                      <span
                        class="addresses-search__toggle-chevron"
                        data-open={showFilters.value ? 'true' : undefined}
                        aria-hidden="true"
                      >
                        <AppIcon intent="chevron-down" size="xs" />
                      </span>
                    </span>
                  </Button>

                  <Button type="submit" size="sm" iconLeft="search">
                    {m.applyFilters}
                  </Button>
                </div>
              </div>

              {activeChips.value.length > 0 && (
                <div class="addresses-search__chips">
                  {activeChips.value.map((chip) => (
                    <span key={chip.key} class="addresses-search__chip">
                      {chip.label}
                      <button
                        type="button"
                        aria-label={m.removeFilter}
                        onClick$={async () => await removeFilter$(chip.key)}
                      >
                        <AppIcon intent="close" size="xs" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div
                class="addresses-search__advanced"
                data-open={showFilters.value ? 'true' : undefined}
              >
                <div class="addresses-search__advanced-grid addresses-search__advanced-grid--three">
                  <Field label={m.fieldFullNameLabel}>
                    <Input
                      iconLeft="person"
                      placeholder={m.fieldFullNamePlaceholder}
                      value={fullName.value}
                      onInput$={(event) => {
                        fullName.value = (
                          event.target as HTMLInputElement
                        ).value;
                      }}
                    />
                  </Field>

                  <Field label={m.fieldStateLabel}>
                    <Select
                      iconLeft="pin"
                      value={stateId.value}
                      options={stateOptions.value}
                      onChange$={(value) => {
                        if (value !== stateId.value) {
                          municipalityName.value = '';
                        }
                        stateId.value = value;
                      }}
                    />
                  </Field>

                  <Field label={m.fieldMunicipalityLabel}>
                    <Select
                      iconLeft="pin"
                      placeholder={m.fieldMunicipalityPlaceholder}
                      value={municipalityName.value}
                      options={municipalityOptions.value}
                      disabled={!stateId.value}
                      onChange$={(value) => {
                        municipalityName.value = value;
                      }}
                    />
                  </Field>
                </div>

                <div class="addresses-search__advanced-grid addresses-search__advanced-grid--three">
                  <Field label={m.fieldZipCodeLabel}>
                    <Input
                      placeholder={m.fieldZipCodePlaceholder}
                      value={zipCode.value}
                      onInput$={(event) => {
                        zipCode.value = (
                          event.target as HTMLInputElement
                        ).value;
                      }}
                    />
                  </Field>

                  <Field label={m.fieldStreetLabel}>
                    <Input
                      placeholder={m.fieldStreetPlaceholder}
                      value={street.value}
                      onInput$={(event) => {
                        street.value = (event.target as HTMLInputElement).value;
                      }}
                    />
                  </Field>

                  <Field label={m.fieldSettlementLabel}>
                    <Input
                      placeholder={m.fieldSettlementPlaceholder}
                      value={settlement.value}
                      onInput$={(event) => {
                        settlement.value = (
                          event.target as HTMLInputElement
                        ).value;
                      }}
                    />
                  </Field>
                </div>
              </div>

              <div class="addresses-search__filters-footer">
                <span class="addresses-search__filters-info">
                  {filtersInfo.value}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick$={clearFilters$}
                >
                  {m.clearFilters}
                </Button>
              </div>
            </form>
          </section>

          {error.value && (
            <Panel variant="outlined" title="No se pudo buscar">
              {error.value}
            </Panel>
          )}

          <section class="addresses-search__table-card">
            <div class="addresses-search__table-meta">
              <strong>{m.tableTitle}</strong>
              <span>{m.tableDescription}</span>
            </div>

            <DataTable
              columns={columns}
              rows={rows.value}
              actions={actions}
              actionMode="menu"
              pagination={{
                page: page.value,
                limit: limit.value,
                total: total.value,
              }}
              loading={loading.value}
              pageSizeOptions={[...DEFAULT_DATA_TABLE_PAGE_SIZE_OPTIONS]}
              searchable={false}
              stickyHeader
              emptyTitle={searched.value ? m.emptyTitle : m.emptyIdleTitle}
              emptyDescription={
                searched.value ? m.emptyDescription : m.emptyIdleDescription
              }
              onPage$={$(async (nextPage: number) => {
                page.value = nextPage;
                await searchAddresses$();
              })}
              onLimit$={$(async (nextLimit: number) => {
                limit.value = nextLimit;
                page.value = 1;
                if (searched.value) {
                  await searchAddresses$();
                }
              })}
            />
          </section>
        </div>
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Búsqueda de direcciones`,
};

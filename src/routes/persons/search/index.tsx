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
import { personService } from '~/services/person/person.service';
import type {
  PersonListItem,
  PersonSearchCatalogs,
} from '~/types/person.types';
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
import { normalizeError } from '~/utils/api-error';
import { hasPermission } from '~/utils/permissions';
import { personsWorkflow } from '~/utils/persons-workflow';
import { sessionStore } from '~/utils/session';
import './search.css';

const m = messages.persons.search;

type PersonRow = Record<string, unknown> &
  PersonListItem & {
    genderLabel: string;
  };

const toRow = (person: PersonListItem): PersonRow => ({
  ...person,
  genderLabel: person.gender === 'H' ? m.genderMale : m.genderFemale,
});

export default component$(() => {
  const nav = useNavigate();
  const catalogs = useSignal<PersonSearchCatalogs>({
    states: [],
    municipalities: [],
  });
  const resultStates = useSignal<string[]>([]);
  const resultMunicipalities = useSignal<
    { birthState: string; birthMunicipality: string }[]
  >([]);
  const rows = useSignal<PersonRow[]>([]);
  const total = useSignal(0);
  const page = useSignal(1);
  const limit = useSignal(10);
  const loading = useSignal(false);
  const searched = useSignal(false);
  const showAdvanced = useSignal(false);
  const error = useSignal('');
  const searchTerm = useSignal('');
  const appliedSearch = useSignal('');
  const fullName = useSignal('');
  const curp = useSignal('');
  const gender = useSignal('');
  const birthState = useSignal('');
  const birthMunicipality = useSignal('');
  const canWrite = useSignal(false);

  const stateOptions = useComputed$(() => {
    const source =
      searched.value && resultStates.value.length > 0
        ? resultStates.value
        : catalogs.value.states;
    return [
      { value: '', label: m.filterBirthStatePlaceholder },
      ...source.map((s) => ({ value: s, label: s })),
    ];
  });

  const municipalityOptions = useComputed$(() => {
    if (searched.value && resultMunicipalities.value.length > 0) {
      const filtered = birthState.value
        ? resultMunicipalities.value.filter(
            (item) => item.birthState === birthState.value,
          )
        : resultMunicipalities.value;
      return [
        { value: '', label: m.filterBirthMunicipalityPlaceholder },
        ...filtered.map((item) => ({
          value: item.birthMunicipality,
          label: item.birthMunicipality,
        })),
      ];
    }
    const all = catalogs.value.municipalities;
    const filtered = birthState.value
      ? all.filter((item) => item.birthState === birthState.value)
      : all;
    return [
      { value: '', label: m.filterBirthMunicipalityPlaceholder },
      ...filtered.map((item) => ({
        value: item.birthMunicipality,
        label: item.birthMunicipality,
      })),
    ];
  });

  const activeAdvancedFilterCount = useComputed$(() => {
    const values = [
      fullName.value.trim(),
      curp.value.trim(),
      gender.value,
      birthState.value,
      birthMunicipality.value,
    ];

    return values.filter(Boolean).length;
  });

  const activeFilterCount = useComputed$(() => {
    return (
      activeAdvancedFilterCount.value + (appliedSearch.value.trim() ? 1 : 0)
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

    if (appliedSearch.value.trim()) {
      chips.push({
        key: 'searchTerm',
        label: `${m.filterGlobalLabel}: ${appliedSearch.value}`,
      });
    }
    if (fullName.value.trim()) {
      chips.push({
        key: 'fullName',
        label: `${m.filterNameLabel}: ${fullName.value}`,
      });
    }
    if (curp.value.trim()) {
      chips.push({ key: 'curp', label: `${m.filterCurpLabel}: ${curp.value}` });
    }
    if (gender.value) {
      chips.push({
        key: 'gender',
        label: `${m.filterGenderLabel}: ${
          gender.value === 'H' ? m.genderMale : m.genderFemale
        }`,
      });
    }
    if (birthState.value) {
      chips.push({
        key: 'birthState',
        label: `${m.filterBirthStateLabel}: ${birthState.value}`,
      });
    }
    if (birthMunicipality.value) {
      chips.push({
        key: 'birthMunicipality',
        label: `${m.filterBirthMunicipalityLabel}: ${birthMunicipality.value}`,
      });
    }

    return chips;
  });

  const searchPersons$ = $(async () => {
    loading.value = true;
    searched.value = true;
    error.value = '';
    try {
      const response = await personService.findMany({
        searchTerm: appliedSearch.value.trim() || undefined,
        fullName: fullName.value.trim() || undefined,
        curp: curp.value.trim() || undefined,
        gender: gender.value || undefined,
        stateName: birthState.value || undefined,
        municipalityName: birthMunicipality.value || undefined,
        limit: limit.value,
        page: page.value,
      });
      rows.value = response.data.map(toRow);
      total.value = response.total ?? response.meta?.totalRecords ?? 0;

      // Acumular estados y municipios únicos de los resultados visibles
      const newStates = [
        ...new Set([
          ...resultStates.value,
          ...response.data
            .map((p) => p.birthState)
            .filter((s): s is string => Boolean(s)),
        ]),
      ].sort();
      const existingMuniKeys = new Set(
        resultMunicipalities.value.map(
          (m) => `${m.birthState}|${m.birthMunicipality}`,
        ),
      );
      const newMunis = [
        ...resultMunicipalities.value,
        ...response.data
          .filter(
            (p) =>
              p.birthState &&
              p.birthMunicipality &&
              !existingMuniKeys.has(`${p.birthState}|${p.birthMunicipality}`),
          )
          .map((p) => ({
            birthState: p.birthState!,
            birthMunicipality: p.birthMunicipality!,
          })),
      ];
      resultStates.value = newStates;
      resultMunicipalities.value = newMunis;
    } catch (err) {
      rows.value = [];
      total.value = 0;
      error.value = normalizeError(err, messages.errors.searchFailed).message;
    } finally {
      loading.value = false;
    }
  });

  const saveWorkContext$ = $((row: PersonRow) => {
    personsWorkflow.save(
      {
        searchTerm: appliedSearch.value,
        fullName: fullName.value,
        curp: curp.value,
        gender: gender.value,
        birthState: birthState.value,
        birthMunicipality: birthMunicipality.value,
        limit: limit.value,
        page: page.value,
      },
      row,
    );
  });

  const clearFilters$ = $(() => {
    searchTerm.value = '';
    appliedSearch.value = '';
    fullName.value = '';
    curp.value = '';
    gender.value = '';
    birthState.value = '';
    birthMunicipality.value = '';
    page.value = 1;
    rows.value = [];
    total.value = 0;
    searched.value = false;
    showAdvanced.value = false;
    error.value = '';
    resultStates.value = [];
    resultMunicipalities.value = [];
    personsWorkflow.clear();
  });

  const removeFilter$ = $(async (key: string) => {
    if (key === 'searchTerm') {
      searchTerm.value = '';
      appliedSearch.value = '';
    }
    if (key === 'fullName') fullName.value = '';
    if (key === 'curp') curp.value = '';
    if (key === 'gender') gender.value = '';
    if (key === 'birthState') {
      birthState.value = '';
      birthMunicipality.value = '';
    }
    if (key === 'birthMunicipality') birthMunicipality.value = '';

    page.value = 1;
    await searchPersons$();
  });

  useVisibleTask$(async () => {
    canWrite.value = hasPermission(
      sessionStore.getPermissions(),
      'persons',
      'write',
    );

    try {
      catalogs.value = await personService.getSearchCatalogs();
    } catch {
      catalogs.value = { states: [], municipalities: [] };
    }

    const savedState = personsWorkflow.getState();
    if (savedState?.filters) {
      searchTerm.value = savedState.filters.searchTerm;
      appliedSearch.value = savedState.filters.searchTerm;
      fullName.value = savedState.filters.fullName;
      curp.value = savedState.filters.curp;
      gender.value = savedState.filters.gender;
      birthState.value = savedState.filters.birthState;
      birthMunicipality.value = savedState.filters.birthMunicipality;
      limit.value = savedState.filters.limit;
      page.value = savedState.filters.page;
      showAdvanced.value = Boolean(
        savedState.filters.fullName ||
          savedState.filters.curp ||
          savedState.filters.gender ||
          savedState.filters.birthState ||
          savedState.filters.birthMunicipality,
      );
      await searchPersons$();
    }
  });

  const columns: DataTableColumn<PersonRow>[] = [
    { key: 'fullName', label: m.columns.fullName, sortable: true },
    { key: 'curp', label: m.columns.curp },
    { key: 'genderLabel', label: m.columns.gender, width: '9rem' },
    { key: 'personalEmail', label: m.columns.email },
    { key: 'phone', label: m.columns.phone, width: '9rem' },
    { key: 'birthState', label: m.columns.birthState, width: '10rem' },
    {
      key: 'birthMunicipality',
      label: m.columns.birthMunicipality,
      width: '10rem',
    },
  ];

  const actions: DataTableAction<PersonRow>[] = [
    {
      label: m.actions.viewDetail,
      icon: 'view',
      onClick$: $(async (row) => {
        await saveWorkContext$(row);
        await nav(`${ROUTES.PERSONS_DETAIL}?id=${row.id}&source=table`);
      }),
    },
    ...(canWrite.value
      ? ([
          {
            label: m.actions.edit,
            icon: 'edit',
            onClick$: $(async (row) => {
              await saveWorkContext$(row);
              await nav(`${ROUTES.PERSONS_EDIT}?id=${row.id}`);
            }),
          },
        ] as DataTableAction<PersonRow>[])
      : []),
  ];

  const genderOptions = [
    { value: '', label: m.filterGenderPlaceholder },
    { value: 'H', label: m.genderMale },
    { value: 'M', label: m.genderFemale },
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
        onBack$={async () => await nav(ROUTES.PERSONS)}
      />

      <div class="persons-search">
        <div class="persons-search__content">
          <section class="persons-search__filters-panel">
            <form
              class="persons-search__filters-form"
              preventdefault:submit
              onSubmit$={async () => {
                if (loading.value) return;
                appliedSearch.value = searchTerm.value.trim();
                page.value = 1;
                resultStates.value = [];
                resultMunicipalities.value = [];
                await searchPersons$();
              }}
            >
              {activeChips.value.length > 0 && (
                <div class="persons-search__chips">
                  {activeChips.value.map((chip) => (
                    <span key={chip.key} class="persons-search__chip">
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

              <div class="persons-search__filters-top">
                <div class="persons-search__global">
                  <Input
                    iconLeft="search"
                    placeholder={m.filterGlobalPlaceholder}
                    value={searchTerm.value}
                    onInput$={(event) => {
                      searchTerm.value = (
                        event.target as HTMLInputElement
                      ).value;
                    }}
                  />
                </div>

                <div class="persons-search__top-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    active={showAdvanced.value}
                    iconLeft="filter"
                    onClick$={() => {
                      showAdvanced.value = !showAdvanced.value;
                    }}
                  >
                    <span class="persons-search__toggle-content">
                      <span>{m.advancedToggle}</span>
                      {activeAdvancedFilterCount.value > 0 && (
                        <span class="persons-search__active-count">
                          {activeAdvancedFilterCount.value}
                        </span>
                      )}
                      <span
                        class="persons-search__toggle-chevron"
                        data-open={showAdvanced.value ? 'true' : undefined}
                        aria-hidden="true"
                      >
                        <AppIcon intent="chevron-down" size="xs" />
                      </span>
                    </span>
                  </Button>

                  <Button
                    type="submit"
                    size="sm"
                    iconLeft="search"
                    loading={loading.value}
                  >
                    {m.applyFilters}
                  </Button>
                </div>
              </div>

              <div
                class="persons-search__advanced"
                data-open={showAdvanced.value ? 'true' : undefined}
              >
                <div class="persons-search__advanced-grid persons-search__advanced-grid--three">
                  <Field label={m.filterNameLabel}>
                    <Input
                      iconLeft="person"
                      placeholder={m.filterNamePlaceholder}
                      value={fullName.value}
                      onInput$={(event) => {
                        fullName.value = (
                          event.target as HTMLInputElement
                        ).value;
                      }}
                    />
                  </Field>

                  <Field label={m.filterCurpLabel}>
                    <Input
                      iconLeft="person"
                      placeholder={m.filterCurpPlaceholder}
                      value={curp.value}
                      onInput$={(event) => {
                        curp.value = (
                          event.target as HTMLInputElement
                        ).value.toUpperCase();
                      }}
                    />
                  </Field>

                  <Field label={m.filterGenderLabel}>
                    <Select
                      iconLeft="person"
                      value={gender.value}
                      options={genderOptions}
                      onChange$={(value) => {
                        gender.value = value;
                      }}
                    />
                  </Field>
                </div>

                <div class="persons-search__advanced-grid persons-search__advanced-grid--two">
                  <Field label={m.filterBirthStateLabel}>
                    <Select
                      iconLeft="pin"
                      value={birthState.value}
                      options={stateOptions.value}
                      onChange$={(value) => {
                        birthState.value = value;
                        birthMunicipality.value = '';
                      }}
                    />
                  </Field>

                  <Field label={m.filterBirthMunicipalityLabel}>
                    <Select
                      iconLeft="pin"
                      value={birthMunicipality.value}
                      options={municipalityOptions.value}
                      disabled={!birthState.value}
                      onChange$={(value) => {
                        birthMunicipality.value = value;
                      }}
                    />
                  </Field>
                </div>
              </div>

              <div class="persons-search__filters-footer">
                <span class="persons-search__filters-info">
                  {filtersInfo.value}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  iconLeft="cancel"
                  onClick$={clearFilters$}
                >
                  {m.clearFilters}
                </Button>
              </div>
            </form>
          </section>

          {error.value && (
            <Panel variant="outlined" title={m.errorPanelTitle}>
              {error.value}
            </Panel>
          )}

          <section class="persons-search__table-card">
            <div class="persons-search__table-meta">
              <strong>Resultados</strong>
              <span>{filtersInfo.value}</span>
            </div>

            <DataTable
              columns={columns}
              rows={rows.value}
              actions={actions}
              actionMode="menu"
              pageSizeOptions={[...DEFAULT_DATA_TABLE_PAGE_SIZE_OPTIONS]}
              pagination={{
                page: page.value,
                limit: limit.value,
                total: total.value,
              }}
              loading={loading.value}
              searchable={false}
              stickyHeader
              hasActiveFilters={activeFilterCount.value > 0}
              emptyTitle={searched.value ? m.tableEmptyTitle : m.tableIdleTitle}
              emptyDescription={
                searched.value
                  ? m.tableEmptyDescription
                  : m.tableIdleDescription
              }
              onPage$={$(async (nextPage) => {
                page.value = nextPage;
                await searchPersons$();
              })}
              onLimit$={$(async (nextLimit) => {
                limit.value = nextLimit;
                page.value = 1;
                await searchPersons$();
              })}
            />
          </section>
        </div>
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Búsqueda avanzada de personas`,
};

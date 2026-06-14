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
  Button,
  DataTable,
  Field,
  Input,
  ModuleHeader,
  Panel,
  Select,
  Toolbar,
} from '~/ui';
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
  const error = useSignal('');
  const searchTerm = useSignal('');
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

  const searchPersons$ = $(async () => {
    loading.value = true;
    searched.value = true;
    error.value = '';
    try {
      const response = await personService.findMany({
        searchTerm: searchTerm.value.trim() || undefined,
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
        searchTerm: searchTerm.value,
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
    fullName.value = '';
    curp.value = '';
    gender.value = '';
    birthState.value = '';
    birthMunicipality.value = '';
    page.value = 1;
    rows.value = [];
    total.value = 0;
    searched.value = false;
    error.value = '';
    resultStates.value = [];
    resultMunicipalities.value = [];
    personsWorkflow.clear();
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
      fullName.value = savedState.filters.fullName;
      curp.value = savedState.filters.curp;
      gender.value = savedState.filters.gender;
      birthState.value = savedState.filters.birthState;
      birthMunicipality.value = savedState.filters.birthMunicipality;
      limit.value = savedState.filters.limit;
      page.value = savedState.filters.page;
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
      <Toolbar q:slot="toolbar">
        <Button
          q:slot="leading"
          variant="ghost"
          iconLeft="back"
          onClick$={async () => await nav(ROUTES.PERSONS)}
        >
          {m.toolbarBack}
        </Button>
        <span q:slot="center">{m.toolbarCenter}</span>
        {canWrite.value && (
          <Button
            q:slot="actions"
            iconLeft="add"
            onClick$={async () => await nav(ROUTES.PERSONS_CREATE)}
          >
            {m.newPerson}
          </Button>
        )}
      </Toolbar>

      <div class="persons-search">
        <ModuleHeader
          tituloModulo={m.tituloModulo}
          accionActual={m.title}
          onBack$={async () => await nav(ROUTES.PERSONS)}
        />

        <Panel
          title={m.filterPanelTitle}
          description={m.filterPanelDescription}
          density="compact"
        >
          <form
            preventdefault:submit
            onSubmit$={async () => {
              if (loading.value) return;
              page.value = 1;
              resultStates.value = [];
              resultMunicipalities.value = [];
              await searchPersons$();
            }}
          >
            <div class="persons-search__filters">
              <Field label={m.filterGlobalLabel}>
                <Input
                  iconLeft="search"
                  placeholder={m.filterGlobalPlaceholder}
                  value={searchTerm.value}
                  onInput$={(event) => {
                    searchTerm.value = (event.target as HTMLInputElement).value;
                  }}
                />
              </Field>

              <Field label={m.filterNameLabel}>
                <Input
                  iconLeft="person"
                  placeholder={m.filterNamePlaceholder}
                  value={fullName.value}
                  onInput$={(event) => {
                    fullName.value = (event.target as HTMLInputElement).value;
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
                  onChange$={(value) => {
                    birthMunicipality.value = value;
                  }}
                />
              </Field>
            </div>

            <div class="persons-search__actions">
              <Button
                type="button"
                variant="secondary"
                iconLeft="cancel"
                onClick$={clearFilters$}
              >
                {m.clearButton}
              </Button>
              <Button type="submit" iconLeft="search" loading={loading.value}>
                {m.searchButton}
              </Button>
            </div>
          </form>
        </Panel>

        {error.value && (
          <Panel variant="outlined" title={m.errorPanelTitle}>
            {error.value}
          </Panel>
        )}

        {searched.value && (
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
            searchable={false}
            stickyHeader
            emptyTitle={m.tableEmptyTitle}
            emptyDescription={m.tableEmptyDescription}
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
        )}
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Búsqueda avanzada de personas`,
};

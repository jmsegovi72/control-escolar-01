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
import { catalogService } from '~/services/catalog/catalog.service';
import { demographicService } from '~/services/demographic/demographic.service';
import type { NamedCatalogItem } from '~/types/catalog.types';
import type { ViewDemographic } from '~/types/demographic.types';
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
import { demographicsWorkflow } from '~/utils/demographics-workflow';
import { hasPermission } from '~/utils/permissions';
import { sessionStore } from '~/utils/session';
import './search.css';

const m = messages.demographics.search;
const createOptions = messages.demographics.create.options;

type DemographicRow = Record<string, unknown> &
  ViewDemographic & {
    ageLabel: string;
    genderLabel: string;
    indigenousLabel: string;
    afroLabel: string;
    indigenousLanguageLabel: string;
    foreignLanguageLabel: string;
    specialConditionLabel: string;
  };

type BoolFilterValue = 'all' | 'true' | 'false';

const fallbackMaritalStatuses: NamedCatalogItem[] = [
  { id: 1, name: createOptions.maritalStatuses.single },
  { id: 2, name: createOptions.maritalStatuses.married },
  { id: 3, name: createOptions.maritalStatuses.divorced },
  { id: 4, name: createOptions.maritalStatuses.widowed },
  { id: 5, name: createOptions.maritalStatuses.commonLaw },
  { id: 6, name: createOptions.maritalStatuses.separated },
  { id: 7, name: createOptions.maritalStatuses.unspecified },
];

const fallbackIndigenousLanguages: NamedCatalogItem[] = [
  { id: 1, name: createOptions.indigenousLanguages.none },
  { id: 2, name: createOptions.indigenousLanguages.nahuatl },
  { id: 3, name: createOptions.indigenousLanguages.maya },
  { id: 4, name: createOptions.indigenousLanguages.zapoteco },
  { id: 5, name: createOptions.indigenousLanguages.mixteco },
  { id: 6, name: createOptions.indigenousLanguages.otomi },
  { id: 7, name: createOptions.indigenousLanguages.totonaca },
  { id: 8, name: createOptions.indigenousLanguages.tzotzil },
  { id: 9, name: createOptions.indigenousLanguages.chol },
  { id: 10, name: createOptions.indigenousLanguages.mazahua },
];

const fallbackForeignLanguages: NamedCatalogItem[] = [
  { id: 1, name: createOptions.foreignLanguages.none },
  { id: 2, name: createOptions.foreignLanguages.english },
  { id: 3, name: createOptions.foreignLanguages.french },
  { id: 4, name: createOptions.foreignLanguages.german },
  { id: 5, name: createOptions.foreignLanguages.portuguese },
  { id: 6, name: createOptions.foreignLanguages.italian },
  { id: 7, name: createOptions.foreignLanguages.mandarin },
  { id: 8, name: createOptions.foreignLanguages.japanese },
];

const fallbackSpecialConditions: NamedCatalogItem[] = [
  { id: 1, name: createOptions.specialConditions.none },
  { id: 2, name: createOptions.specialConditions.visual },
  { id: 3, name: createOptions.specialConditions.hearing },
  { id: 4, name: createOptions.specialConditions.motor },
  { id: 5, name: createOptions.specialConditions.intellectual },
  { id: 6, name: createOptions.specialConditions.psychosocial },
];

const toOptions = (items: NamedCatalogItem[], placeholder: string) => [
  { value: '', label: placeholder },
  ...items.map((item) => ({
    value: item.name,
    label: item.name,
  })),
];

const toRow = (item: ViewDemographic): DemographicRow => ({
  ...item,
  ageLabel: item.age === null ? m.noData : String(item.age),
  genderLabel: item.gender === 'H' ? m.genderMaleShort : m.genderFemaleShort,
  indigenousLabel: item.isIndigenous ? m.boolYes : m.boolNo,
  afroLabel: item.isAfroDescendant ? m.boolYes : m.boolNo,
  indigenousLanguageLabel:
    !item.indigenousLanguage || item.indigenousLanguage === 'Ninguna'
      ? m.noData
      : item.indigenousLanguage,
  foreignLanguageLabel:
    !item.foreignLanguage || item.foreignLanguage === 'Ninguno'
      ? m.noData
      : item.foreignLanguage,
  specialConditionLabel:
    !item.specialCondition || item.specialCondition === 'Ninguna'
      ? m.noData
      : item.specialCondition,
});

export default component$(() => {
  const nav = useNavigate();

  const rows = useSignal<DemographicRow[]>([]);
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
  const gender = useSignal('');
  const maritalStatus = useSignal('');
  const indigenousLanguage = useSignal('');
  const foreignLanguage = useSignal('');
  const specialCondition = useSignal('');
  const isIndigenous = useSignal<BoolFilterValue>('all');
  const isAfroDescendant = useSignal<BoolFilterValue>('all');

  const maritalStatuses = useSignal<NamedCatalogItem[]>([]);
  const indigenousLanguages = useSignal<NamedCatalogItem[]>([]);
  const foreignLanguages = useSignal<NamedCatalogItem[]>([]);
  const specialConditions = useSignal<NamedCatalogItem[]>([]);
  const resultMaritalStatuses = useSignal<string[]>([]);
  const resultIndigenousLanguages = useSignal<string[]>([]);
  const resultForeignLanguages = useSignal<string[]>([]);
  const resultSpecialConditions = useSignal<string[]>([]);

  const activeAdvancedFilterCount = useComputed$(() => {
    const values = [
      fullName.value.trim(),
      gender.value,
      maritalStatus.value,
      indigenousLanguage.value,
      foreignLanguage.value,
      specialCondition.value,
      isIndigenous.value !== 'all',
      isAfroDescendant.value !== 'all',
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
        label: `Nombre: ${appliedSearchTerm.value}`,
      });
    }
    if (fullName.value.trim()) {
      chips.push({
        key: 'fullName',
        label: `Nombre completo: ${fullName.value}`,
      });
    }
    if (gender.value) {
      chips.push({
        key: 'gender',
        label: `Género: ${gender.value === 'H' ? m.genderMale : m.genderFemale}`,
      });
    }
    if (maritalStatus.value) {
      chips.push({
        key: 'maritalStatus',
        label: `Estado civil: ${maritalStatus.value}`,
      });
    }
    if (indigenousLanguage.value) {
      chips.push({
        key: 'indigenousLanguage',
        label: `Lengua indígena: ${indigenousLanguage.value}`,
      });
    }
    if (foreignLanguage.value) {
      chips.push({
        key: 'foreignLanguage',
        label: `Idioma: ${foreignLanguage.value}`,
      });
    }
    if (specialCondition.value) {
      chips.push({
        key: 'specialCondition',
        label: `Condición: ${specialCondition.value}`,
      });
    }
    if (isIndigenous.value !== 'all') {
      chips.push({
        key: 'isIndigenous',
        label: `Indígena: ${
          isIndigenous.value === 'true' ? m.boolYes : m.boolNo
        }`,
      });
    }
    if (isAfroDescendant.value !== 'all') {
      chips.push({
        key: 'isAfroDescendant',
        label: `Afrodesc.: ${
          isAfroDescendant.value === 'true' ? m.boolYes : m.boolNo
        }`,
      });
    }

    return chips;
  });

  const maritalStatusOptions = useComputed$(() => {
    const source =
      searched.value && resultMaritalStatuses.value.length > 0
        ? resultMaritalStatuses.value.map((name, index) => ({
            id: index,
            name,
          }))
        : maritalStatuses.value.length > 0
          ? maritalStatuses.value
          : fallbackMaritalStatuses;
    return toOptions(source, m.fieldMaritalStatusPlaceholder);
  });
  const genderOptions = [
    { value: '', label: m.fieldGenderPlaceholder },
    { value: 'H', label: m.genderMale },
    { value: 'M', label: m.genderFemale },
  ];
  const indigenousLanguageOptions = useComputed$(() => {
    const source =
      searched.value && resultIndigenousLanguages.value.length > 0
        ? resultIndigenousLanguages.value.map((name, index) => ({
            id: index,
            name,
          }))
        : indigenousLanguages.value.length > 0
          ? indigenousLanguages.value
          : fallbackIndigenousLanguages;
    return toOptions(source, m.fieldIndigenousLanguagePlaceholder);
  });
  const foreignLanguageOptions = useComputed$(() => {
    const source =
      searched.value && resultForeignLanguages.value.length > 0
        ? resultForeignLanguages.value.map((name, index) => ({
            id: index,
            name,
          }))
        : foreignLanguages.value.length > 0
          ? foreignLanguages.value
          : fallbackForeignLanguages;
    return toOptions(source, m.fieldForeignLanguagePlaceholder);
  });
  const specialConditionOptions = useComputed$(() => {
    const source =
      searched.value && resultSpecialConditions.value.length > 0
        ? resultSpecialConditions.value.map((name, index) => ({
            id: index,
            name,
          }))
        : specialConditions.value.length > 0
          ? specialConditions.value
          : fallbackSpecialConditions;
    return toOptions(source, m.fieldSpecialConditionPlaceholder);
  });

  const searchDemographics$ = $(async () => {
    loading.value = true;
    searched.value = true;
    error.value = '';

    try {
      const response = await demographicService.findMany({
        searchTerm: appliedSearchTerm.value.trim() || undefined,
        fullName: fullName.value.trim() || undefined,
        gender: gender.value || undefined,
        maritalStatus: maritalStatus.value || undefined,
        indigenousLanguage: indigenousLanguage.value || undefined,
        foreignLanguage: foreignLanguage.value || undefined,
        specialCondition: specialCondition.value || undefined,
        isIndigenous:
          isIndigenous.value === 'all'
            ? undefined
            : isIndigenous.value === 'true',
        isAfroDescendant:
          isAfroDescendant.value === 'all'
            ? undefined
            : isAfroDescendant.value === 'true',
        page: page.value,
        limit: limit.value,
      });

      rows.value = response.data.map(toRow);
      total.value = response.total ?? response.meta?.totalRecords ?? 0;
      resultMaritalStatuses.value = [
        ...new Set(
          response.data
            .map((item) => item.maritalStatus)
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort();
      resultIndigenousLanguages.value = [
        ...new Set(
          response.data
            .map((item) => item.indigenousLanguage)
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort();
      resultForeignLanguages.value = [
        ...new Set(
          response.data
            .map((item) => item.foreignLanguage)
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort();
      resultSpecialConditions.value = [
        ...new Set(
          response.data
            .map((item) => item.specialCondition)
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort();
    } catch (err) {
      rows.value = [];
      total.value = 0;
      resultMaritalStatuses.value = [];
      resultIndigenousLanguages.value = [];
      resultForeignLanguages.value = [];
      resultSpecialConditions.value = [];
      error.value = normalizeError(err, messages.errors.searchFailed).message;
    } finally {
      loading.value = false;
    }
  });

  const saveWorkContext$ = $((row: DemographicRow) => {
    demographicsWorkflow.save(
      {
        searchTerm: appliedSearchTerm.value,
        fullName: fullName.value,
        gender: gender.value,
        maritalStatus: maritalStatus.value,
        indigenousLanguage: indigenousLanguage.value,
        foreignLanguage: foreignLanguage.value,
        specialCondition: specialCondition.value,
        isIndigenous: isIndigenous.value,
        isAfroDescendant: isAfroDescendant.value,
        limit: limit.value,
        page: page.value,
      },
      row,
    );
  });

  const cycleBool$ = $((target: 'indigenous' | 'afro') => {
    const current =
      target === 'indigenous' ? isIndigenous.value : isAfroDescendant.value;
    const next =
      current === 'all' ? 'true' : current === 'true' ? 'false' : 'all';

    if (target === 'indigenous') {
      isIndigenous.value = next;
      return;
    }

    isAfroDescendant.value = next;
  });

  const clearFilters$ = $(async () => {
    searchTerm.value = '';
    appliedSearchTerm.value = '';
    fullName.value = '';
    gender.value = '';
    maritalStatus.value = '';
    indigenousLanguage.value = '';
    foreignLanguage.value = '';
    specialCondition.value = '';
    isIndigenous.value = 'all';
    isAfroDescendant.value = 'all';
    page.value = 1;
    rows.value = [];
    total.value = 0;
    searched.value = false;
    resultMaritalStatuses.value = [];
    resultIndigenousLanguages.value = [];
    resultForeignLanguages.value = [];
    resultSpecialConditions.value = [];
    error.value = '';
    showFilters.value = false;
    demographicsWorkflow.clear();
  });

  const removeFilter$ = $(async (key: string) => {
    if (key === 'searchTerm') {
      searchTerm.value = '';
      appliedSearchTerm.value = '';
    }
    if (key === 'fullName') fullName.value = '';
    if (key === 'gender') gender.value = '';
    if (key === 'maritalStatus') maritalStatus.value = '';
    if (key === 'indigenousLanguage') indigenousLanguage.value = '';
    if (key === 'foreignLanguage') foreignLanguage.value = '';
    if (key === 'specialCondition') specialCondition.value = '';
    if (key === 'isIndigenous') isIndigenous.value = 'all';
    if (key === 'isAfroDescendant') isAfroDescendant.value = 'all';

    page.value = 1;
    await searchDemographics$();
  });

  useVisibleTask$(async () => {
    canWrite.value = hasPermission(
      sessionStore.getPermissions(),
      'persons',
      'write',
    );

    const [
      maritalStatusesResult,
      indigenousLanguagesResult,
      foreignLanguagesResult,
      specialConditionsResult,
    ] = await Promise.allSettled([
      catalogService.getMaritalStatuses(),
      catalogService.getIndigenousLanguages(),
      catalogService.getForeignLanguages(),
      catalogService.getSpecialConditions(),
    ]);

    maritalStatuses.value =
      maritalStatusesResult.status === 'fulfilled'
        ? maritalStatusesResult.value
        : [];
    indigenousLanguages.value =
      indigenousLanguagesResult.status === 'fulfilled'
        ? indigenousLanguagesResult.value
        : [];
    foreignLanguages.value =
      foreignLanguagesResult.status === 'fulfilled'
        ? foreignLanguagesResult.value
        : [];
    specialConditions.value =
      specialConditionsResult.status === 'fulfilled'
        ? specialConditionsResult.value
        : [];

    const savedState = demographicsWorkflow.getState();
    if (savedState?.filters) {
      searchTerm.value = savedState.filters.searchTerm;
      appliedSearchTerm.value = savedState.filters.searchTerm;
      fullName.value = savedState.filters.fullName;
      gender.value = savedState.filters.gender;
      maritalStatus.value = savedState.filters.maritalStatus;
      indigenousLanguage.value = savedState.filters.indigenousLanguage;
      foreignLanguage.value = savedState.filters.foreignLanguage;
      specialCondition.value = savedState.filters.specialCondition;
      isIndigenous.value = savedState.filters.isIndigenous;
      isAfroDescendant.value = savedState.filters.isAfroDescendant;
      limit.value = savedState.filters.limit;
      page.value = savedState.filters.page;
      showFilters.value = Boolean(
        savedState.filters.fullName ||
          savedState.filters.gender ||
          savedState.filters.maritalStatus ||
          savedState.filters.indigenousLanguage ||
          savedState.filters.foreignLanguage ||
          savedState.filters.specialCondition ||
          savedState.filters.isIndigenous !== 'all' ||
          savedState.filters.isAfroDescendant !== 'all',
      );
      await searchDemographics$();
    }
  });

  const columns: DataTableColumn<DemographicRow>[] = [
    { key: 'curp', label: m.columns.curp, width: '13rem' },
    { key: 'fullName', label: m.columns.fullName, width: '16rem' },
    { key: 'ageLabel', label: m.columns.age, width: '6rem', align: 'center' },
    {
      key: 'genderLabel',
      label: m.columns.gender,
      width: '7rem',
      align: 'center',
      badge: {
        toneMap: {
          [m.genderMaleShort]: 'primary',
          [m.genderFemaleShort]: 'danger',
        },
      },
    },
    { key: 'maritalStatus', label: m.columns.maritalStatus, width: '11rem' },
    {
      key: 'indigenousLabel',
      label: m.columns.isIndigenous,
      width: '8rem',
      align: 'center',
      badge: {
        toneMap: { [m.boolYes]: 'success', [m.boolNo]: 'neutral' },
      },
    },
    {
      key: 'afroLabel',
      label: m.columns.isAfroDescendant,
      width: '10rem',
      align: 'center',
      badge: {
        toneMap: { [m.boolYes]: 'success', [m.boolNo]: 'neutral' },
      },
    },
    {
      key: 'indigenousLanguageLabel',
      label: m.columns.indigenousLanguage,
      width: '11rem',
    },
    {
      key: 'foreignLanguageLabel',
      label: m.columns.foreignLanguage,
      width: '11rem',
    },
    {
      key: 'specialConditionLabel',
      label: m.columns.specialCondition,
      width: '12rem',
    },
  ];

  const actions: DataTableAction<DemographicRow>[] = [
    {
      label: m.actions.viewDetail,
      icon: 'view',
      onClick$: $(async (row) => {
        await saveWorkContext$(row);
        await nav(`${ROUTES.DEMOGRAPHICS_DETAIL}?id=${row.id}`);
      }),
    },
    ...(canWrite.value
      ? ([
          {
            label: m.actions.edit,
            icon: 'edit',
            onClick$: $(async (row) => {
              await saveWorkContext$(row);
              await nav(`${ROUTES.DEMOGRAPHICS_EDIT}?id=${row.id}`);
            }),
          },
        ] as DataTableAction<DemographicRow>[])
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

          void nav(ROUTES.DEMOGRAPHICS);
        })}
      />

      <div class="demographics-search-page">
        <div class="demographics-search-page__content">
          <section class="demographics-search__filters-panel">
            <form
              class="demographics-search__filters-form"
              preventdefault:submit
              onSubmit$={async () => {
                if (loading.value) return;
                appliedSearchTerm.value = searchTerm.value.trim();
                page.value = 1;
                await searchDemographics$();
              }}
            >
              <div class="demographics-search__filters-top">
                <div class="demographics-search__global">
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

                <div class="demographics-search__top-actions">
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
                    <span class="demographics-search__toggle-content">
                      <span>{m.advancedToggle}</span>
                      {activeAdvancedFilterCount.value > 0 && (
                        <span class="demographics-search__active-count">
                          {activeAdvancedFilterCount.value}
                        </span>
                      )}
                      <span
                        class="demographics-search__toggle-chevron"
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
                <div class="demographics-search__chips">
                  {activeChips.value.map((chip) => (
                    <span key={chip.key} class="demographics-search__chip">
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
                class="demographics-search__advanced"
                data-open={showFilters.value ? 'true' : undefined}
              >
                <div class="demographics-search__advanced-grid demographics-search__advanced-grid--three">
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

                  <Field label={m.fieldGenderLabel}>
                    <Select
                      iconLeft="person"
                      value={gender.value}
                      options={genderOptions}
                      onChange$={(value) => {
                        gender.value = value;
                      }}
                    />
                  </Field>

                  <Field label={m.fieldMaritalStatusLabel}>
                    <Select
                      value={maritalStatus.value}
                      options={maritalStatusOptions.value}
                      onChange$={(value) => {
                        maritalStatus.value = value;
                      }}
                    />
                  </Field>
                </div>

                <div class="demographics-search__advanced-grid demographics-search__advanced-grid--three">
                  <Field label={m.fieldIndigenousLanguageLabel}>
                    <Select
                      value={indigenousLanguage.value}
                      options={indigenousLanguageOptions.value}
                      onChange$={(value) => {
                        indigenousLanguage.value = value;
                      }}
                    />
                  </Field>

                  <Field label={m.fieldForeignLanguageLabel}>
                    <Select
                      value={foreignLanguage.value}
                      options={foreignLanguageOptions.value}
                      onChange$={(value) => {
                        foreignLanguage.value = value;
                      }}
                    />
                  </Field>

                  <Field label={m.fieldSpecialConditionLabel}>
                    <Select
                      value={specialCondition.value}
                      options={specialConditionOptions.value}
                      onChange$={(value) => {
                        specialCondition.value = value;
                      }}
                    />
                  </Field>
                </div>

                <div class="demographics-search__bool-group">
                  <span class="demographics-search__bool-label">
                    {m.fieldSelfIdentificationLabel}
                  </span>
                  <div class="demographics-search__bool-row">
                    <button
                      type="button"
                      class={[
                        'demographics-search__bool-btn',
                        isIndigenous.value !== 'all' ? 'is-active' : '',
                      ].join(' ')}
                      onClick$={async () => await cycleBool$('indigenous')}
                    >
                      <AppIcon intent="person" size="xs" />
                      {m.boolIndigenousLabel}:{' '}
                      {isIndigenous.value === 'all'
                        ? m.boolAll
                        : isIndigenous.value === 'true'
                          ? m.boolYes
                          : m.boolNo}
                    </button>

                    <button
                      type="button"
                      class={[
                        'demographics-search__bool-btn',
                        isAfroDescendant.value !== 'all' ? 'is-active' : '',
                      ].join(' ')}
                      onClick$={async () => await cycleBool$('afro')}
                    >
                      <AppIcon intent="person" size="xs" />
                      {m.boolAfroLabel}:{' '}
                      {isAfroDescendant.value === 'all'
                        ? m.boolAll
                        : isAfroDescendant.value === 'true'
                          ? m.boolYes
                          : m.boolNo}
                    </button>
                  </div>
                </div>

                <div class="demographics-search__filters-footer">
                  <span class="demographics-search__filters-info">
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
              </div>

              {!showFilters.value && (
                <div class="demographics-search__filters-footer">
                  <span class="demographics-search__filters-info">
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
              )}
            </form>
          </section>

          {error.value && (
            <Panel variant="outlined" title="Error">
              {error.value}
            </Panel>
          )}

          <section class="demographics-search__table-card">
            <div class="demographics-search__table-meta">
              <strong>Resultados</strong>
              <span>{filtersInfo.value}</span>
            </div>

            <DataTable
              columns={columns}
              rows={rows.value}
              actions={actions}
              actionMode="menu"
              loading={loading.value}
              searchable={false}
              hasActiveFilters={activeFilterCount.value > 0}
              emptyTitle={searched.value ? m.emptyTitle : m.emptyIdleTitle}
              emptyDescription={
                searched.value ? m.emptyDescription : m.emptyIdleDescription
              }
              stickyHeader
              pagination={{
                page: page.value,
                limit: limit.value,
                total: total.value,
              }}
              pageSizeOptions={[...DEFAULT_DATA_TABLE_PAGE_SIZE_OPTIONS]}
              onPage$={async (nextPage) => {
                page.value = nextPage;
                await searchDemographics$();
              }}
              onLimit$={async (nextLimit) => {
                limit.value = nextLimit;
                page.value = 1;
                await searchDemographics$();
              }}
            />
          </section>
        </div>
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Búsqueda avanzada de demografía`,
};

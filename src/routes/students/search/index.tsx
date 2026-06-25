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
import { studentService } from '~/services/student/student.service';
import type {
  Municipality,
  NamedCatalogItem,
  State,
} from '~/types/catalog.types';
import type {
  EducationalProgram,
  StudentGeneration,
  StudentSearchResult,
  StudentStatus,
} from '~/types/student.types';
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
import { sessionStore } from '~/utils/session';
import {
  type StudentSearchFilters,
  studentsWorkflow,
} from '~/utils/students-workflow';
import './search.css';

const m = messages.students.search;

type StudentRow = Record<string, unknown> &
  StudentSearchResult & {
    ageLabel: string;
    genderLabel: string;
    generationLabel: string;
    semesterLabel: string;
    statusLabel: string;
    emailLabel: string;
    phoneLabel: string;
  };

const toRow = (item: StudentSearchResult): StudentRow => ({
  ...item,
  ageLabel:
    item.age === null || item.age === undefined ? m.noData : String(item.age),
  genderLabel: item.gender === 'M' ? m.genderFemaleShort : m.genderMaleShort,
  generationLabel:
    item.generation === null || item.generation === undefined
      ? m.noData
      : String(item.generation),
  semesterLabel:
    item.currentSemester === null || item.currentSemester === undefined
      ? m.noData
      : String(item.currentSemester),
  statusLabel: item.statusDescription ?? m.noData,
  emailLabel: item.institutionalMail ?? m.noData,
  phoneLabel: item.phone ?? m.noData,
});

const toOptions = (items: NamedCatalogItem[], placeholder: string) => [
  { value: '', label: placeholder },
  ...items.map((item) => ({
    value: item.name,
    label: item.name,
  })),
];

const uniqueSortedValues = (
  values: Array<string | null | undefined>,
): string[] => {
  const normalized = values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  return [...new Set(normalized)].sort((a, b) => a.localeCompare(b));
};

const statusToneFromKey = (statusKey?: string | null) => {
  if (!statusKey) return 'neutral' as const;

  const normalized = statusKey.trim().toUpperCase();
  if (['AC', 'AL', 'NI', 'PR'].includes(normalized)) return 'success' as const;
  if (['BT'].includes(normalized)) return 'warning' as const;
  if (['BJ', 'BD', 'EG'].includes(normalized)) return 'danger' as const;
  return 'neutral' as const;
};

export default component$(() => {
  const nav = useNavigate();

  const states = useSignal<State[]>([]);
  const resultStates = useSignal<State[]>([]);
  const municipalities = useSignal<Municipality[]>([]);
  const resultMunicipalities = useSignal<
    { stateName: string; municipalityName: string }[]
  >([]);
  const academicDisciplines = useSignal<NamedCatalogItem[]>([]);
  const educationLevels = useSignal<NamedCatalogItem[]>([]);
  const educationalPrograms = useSignal<EducationalProgram[]>([]);
  const generations = useSignal<StudentGeneration[]>([]);
  const schoolYears = useSignal<NamedCatalogItem[]>([]);
  const statuses = useSignal<StudentStatus[]>([]);
  const rows = useSignal<StudentRow[]>([]);
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
  const firstName = useSignal('');
  const firstLastName = useSignal('');
  const secondLastName = useSignal('');
  const curp = useSignal('');
  const codeNumber = useSignal('');
  const academicDiscipline = useSignal('');
  const educationLevel = useSignal('');
  const generation = useSignal('');
  const semester = useSignal('');
  const schoolYear = useSignal('');
  const statusKey = useSignal('');
  const stateId = useSignal('');
  const stateName = useSignal('');
  const municipalityName = useSignal('');
  const isActive = useSignal('');

  const stateOptions = useComputed$(() => {
    const source = searched.value
      ? resultStates.value
      : states.value.length > 0
        ? states.value
        : resultStates.value;

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

  const academicDisciplineOptions = useComputed$(() =>
    searched.value
      ? [
          { value: '', label: m.fieldAcademicDisciplinePlaceholder },
          ...uniqueSortedValues(
            rows.value.map((row) => row.academicDiscipline),
          ).map((value) => ({
            value,
            label: value,
          })),
        ]
      : toOptions(
          academicDisciplines.value,
          m.fieldAcademicDisciplinePlaceholder,
        ),
  );
  const educationLevelOptions = useComputed$(() =>
    searched.value
      ? [
          { value: '', label: m.fieldEducationLevelPlaceholder },
          ...uniqueSortedValues(
            rows.value.map((row) => row.educationLevel),
          ).map((value) => ({
            value,
            label: value,
          })),
        ]
      : toOptions(educationLevels.value, m.fieldEducationLevelPlaceholder),
  );
  const generationOptions = useComputed$(() =>
    searched.value
      ? [
          { value: '', label: m.fieldGenerationPlaceholder },
          ...uniqueSortedValues(
            rows.value.map((row) => row.generationLabel),
          ).map((value) => ({
            value,
            label: value,
          })),
        ]
      : [
          { value: '', label: m.fieldGenerationPlaceholder },
          ...generations.value.map((item) => ({
            value: item.generation,
            label: item.generationName?.trim() || item.generation,
          })),
        ],
  );
  const schoolYearOptions = useComputed$(() =>
    searched.value
      ? [
          { value: '', label: m.fieldSchoolYearPlaceholder },
          ...uniqueSortedValues(
            rows.value.map((row) => row.educationCycle),
          ).map((value) => ({
            value,
            label: value,
          })),
        ]
      : toOptions(schoolYears.value, m.fieldSchoolYearPlaceholder),
  );
  const statusOptions = useComputed$(() =>
    searched.value
      ? [
          { value: '', label: m.fieldStatusPlaceholder },
          ...[
            ...new Map(
              rows.value
                .filter(
                  (row) =>
                    typeof row.statusKey === 'string' &&
                    row.statusKey.trim().length > 0 &&
                    typeof row.statusDescription === 'string' &&
                    row.statusDescription.trim().length > 0,
                )
                .map((row) => [
                  row.statusKey?.trim().toUpperCase() || '',
                  {
                    value: row.statusKey?.trim().toUpperCase() || '',
                    label: row.statusDescription?.trim() || '',
                  },
                ]),
            ).values(),
          ],
        ]
      : [
          { value: '', label: m.fieldStatusPlaceholder },
          ...statuses.value.map((item) => ({
            value: item.key?.trim() || item.statusKey?.trim() || '',
            label: item.description?.trim() || item.status,
          })),
        ].filter(
          (item) => item.value || item.label === m.fieldStatusPlaceholder,
        ),
  );
  const activeOptions = [
    { value: '', label: m.activeOptionAll },
    { value: 'true', label: m.activeOptionActive },
    { value: 'false', label: m.activeOptionInactive },
  ];

  const activeAdvancedFilterCount = useComputed$(() => {
    const values = [
      firstName.value.trim(),
      firstLastName.value.trim(),
      secondLastName.value.trim(),
      curp.value.trim(),
      codeNumber.value.trim(),
      academicDiscipline.value,
      educationLevel.value,
      generation.value,
      semester.value,
      schoolYear.value,
      statusKey.value,
      stateName.value.trim(),
      municipalityName.value.trim(),
      isActive.value,
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
        label: `Busqueda: ${appliedSearchTerm.value}`,
      });
    }
    if (firstName.value.trim()) {
      chips.push({ key: 'firstName', label: `Nombre: ${firstName.value}` });
    }
    if (firstLastName.value.trim()) {
      chips.push({
        key: 'firstLastName',
        label: `Primer apellido: ${firstLastName.value}`,
      });
    }
    if (secondLastName.value.trim()) {
      chips.push({
        key: 'secondLastName',
        label: `Segundo apellido: ${secondLastName.value}`,
      });
    }
    if (curp.value.trim())
      chips.push({ key: 'curp', label: `CURP: ${curp.value}` });
    if (codeNumber.value.trim()) {
      chips.push({
        key: 'codeNumber',
        label: `Matricula: ${codeNumber.value}`,
      });
    }
    if (academicDiscipline.value) {
      chips.push({
        key: 'academicDiscipline',
        label: `Disciplina: ${academicDiscipline.value}`,
      });
    }
    if (educationLevel.value) {
      chips.push({
        key: 'educationLevel',
        label: `Nivel: ${educationLevel.value}`,
      });
    }
    if (generation.value) {
      chips.push({
        key: 'generation',
        label: `Generacion: ${generation.value}`,
      });
    }
    if (semester.value) {
      chips.push({ key: 'semester', label: `Semestre: ${semester.value}` });
    }
    if (schoolYear.value) {
      chips.push({
        key: 'schoolYear',
        label: `Ciclo: ${schoolYear.value}`,
      });
    }
    if (statusKey.value) {
      chips.push({ key: 'statusKey', label: `Estatus: ${statusKey.value}` });
    }
    if (stateName.value.trim()) {
      chips.push({ key: 'stateName', label: `Estado: ${stateName.value}` });
    }
    if (municipalityName.value.trim()) {
      chips.push({
        key: 'municipalityName',
        label: `Municipio: ${municipalityName.value}`,
      });
    }
    if (isActive.value === 'true') {
      chips.push({ key: 'isActive', label: 'Situacion: Activos' });
    }
    if (isActive.value === 'false') {
      chips.push({ key: 'isActive', label: 'Situacion: Inactivos' });
    }

    return chips;
  });

  const searchStudents$ = $(async () => {
    loading.value = true;
    searched.value = true;
    error.value = '';

    try {
      const response = await studentService.findMany({
        searchTerm: appliedSearchTerm.value.trim() || undefined,
        firstName: firstName.value.trim() || undefined,
        firstLastName: firstLastName.value.trim() || undefined,
        secondLastName: secondLastName.value.trim() || undefined,
        curp: curp.value.trim() || undefined,
        codeNumber: codeNumber.value.trim() || undefined,
        academicDiscipline: academicDiscipline.value || undefined,
        educationLevel: educationLevel.value || undefined,
        generation: generation.value || undefined,
        semester: semester.value || undefined,
        schoolYear: schoolYear.value || undefined,
        statusKey: statusKey.value || undefined,
        stateName: stateName.value.trim() || undefined,
        municipalityName: municipalityName.value.trim() || undefined,
        isActive: isActive.value === '' ? undefined : isActive.value === 'true',
        page: page.value,
        limit: limit.value,
      });

      rows.value = response.data.map(toRow);
      total.value = response.total ?? response.meta?.totalRecords ?? 0;
      resultStates.value = [
        ...new Map(
          response.data
            .filter((item) => Boolean(item.birthState))
            .map((item, index) => {
              const stateName = item.birthState?.trim() ?? '';
              const matchedState = states.value.find(
                (state) =>
                  state.name.trim().toLowerCase() === stateName.toLowerCase(),
              );

              return [
                stateName || String(index),
                {
                  id: matchedState?.id ?? index + 1,
                  code: matchedState?.code ?? '',
                  name: stateName,
                },
              ];
            }),
        ).values(),
      ].sort((a, b) => a.name.localeCompare(b.name));
      resultMunicipalities.value = [
        ...new Map(
          response.data
            .filter(
              (item) =>
                Boolean(item.birthState) && Boolean(item.birthMunicipality),
            )
            .map((item) => [
              `${item.birthState}|${item.birthMunicipality}`,
              {
                stateName: item.birthState ?? '',
                municipalityName: item.birthMunicipality ?? '',
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

  const saveWorkContext$ = $((row?: StudentSearchResult) => {
    const filters: StudentSearchFilters = {
      searchTerm: appliedSearchTerm.value,
      firstName: firstName.value,
      firstLastName: firstLastName.value,
      secondLastName: secondLastName.value,
      curp: curp.value,
      codeNumber: codeNumber.value,
      academicDiscipline: academicDiscipline.value,
      educationLevel: educationLevel.value,
      generation: generation.value,
      semester: semester.value,
      schoolYear: schoolYear.value,
      statusKey: statusKey.value,
      stateName: stateName.value,
      municipalityName: municipalityName.value,
      isActive: isActive.value,
      limit: limit.value,
      page: page.value,
    };

    studentsWorkflow.save(filters, row);
  });

  const clearFilters$ = $(() => {
    searchTerm.value = '';
    appliedSearchTerm.value = '';
    firstName.value = '';
    firstLastName.value = '';
    secondLastName.value = '';
    curp.value = '';
    codeNumber.value = '';
    academicDiscipline.value = '';
    educationLevel.value = '';
    generation.value = '';
    semester.value = '';
    schoolYear.value = '';
    statusKey.value = '';
    stateId.value = '';
    stateName.value = '';
    municipalityName.value = '';
    isActive.value = '';
    page.value = 1;
    rows.value = [];
    total.value = 0;
    searched.value = false;
    showFilters.value = false;
    error.value = '';
    resultStates.value = [];
    municipalities.value = [];
    resultMunicipalities.value = [];
    studentsWorkflow.clear();
  });

  const removeFilter$ = $(async (key: string) => {
    if (key === 'searchTerm') {
      searchTerm.value = '';
      appliedSearchTerm.value = '';
    }
    if (key === 'firstName') firstName.value = '';
    if (key === 'firstLastName') firstLastName.value = '';
    if (key === 'secondLastName') secondLastName.value = '';
    if (key === 'curp') curp.value = '';
    if (key === 'codeNumber') codeNumber.value = '';
    if (key === 'academicDiscipline') academicDiscipline.value = '';
    if (key === 'educationLevel') educationLevel.value = '';
    if (key === 'generation') generation.value = '';
    if (key === 'semester') semester.value = '';
    if (key === 'schoolYear') schoolYear.value = '';
    if (key === 'statusKey') statusKey.value = '';
    if (key === 'stateName') {
      stateId.value = '';
      stateName.value = '';
      municipalityName.value = '';
      municipalities.value = [];
    }
    if (key === 'municipalityName') municipalityName.value = '';
    if (key === 'isActive') isActive.value = '';

    page.value = 1;
    await searchStudents$();
  });

  useVisibleTask$(async () => {
    canWrite.value = hasPermission(
      sessionStore.getPermissions(),
      'students',
      'write',
    );

    const [
      statesResult,
      disciplinesResult,
      programsResult,
      generationsResult,
      schoolYearsResult,
      statusesResult,
    ] = await Promise.allSettled([
      catalogService.getStates(),
      catalogService.getAcademicDisciplines(),
      catalogService.getEducationalPrograms(),
      catalogService.getStudentGenerations(),
      catalogService.getSchoolYears(),
      catalogService.getStudentStatuses(),
    ]);

    states.value =
      statesResult.status === 'fulfilled' ? statesResult.value : [];
    academicDisciplines.value =
      disciplinesResult.status === 'fulfilled' ? disciplinesResult.value : [];
    educationalPrograms.value =
      programsResult.status === 'fulfilled' ? programsResult.value : [];
    educationLevels.value = [
      ...new Map(
        educationalPrograms.value
          .filter(
            (program) =>
              typeof program.level === 'string' &&
              program.level.trim().length > 0,
          )
          .map((program, index) => [
            program.level?.trim().toLowerCase() || String(index),
            {
              id: index + 1,
              name: program.level?.trim() || '',
            },
          ]),
      ).values(),
    ].sort((a, b) => a.name.localeCompare(b.name));
    generations.value =
      generationsResult.status === 'fulfilled' ? generationsResult.value : [];
    schoolYears.value =
      schoolYearsResult.status === 'fulfilled' ? schoolYearsResult.value : [];
    statuses.value =
      statusesResult.status === 'fulfilled' ? statusesResult.value : [];

    const savedState = studentsWorkflow.getState();
    if (savedState?.filters) {
      searchTerm.value = savedState.filters.searchTerm;
      appliedSearchTerm.value = savedState.filters.searchTerm;
      firstName.value = savedState.filters.firstName;
      firstLastName.value = savedState.filters.firstLastName;
      secondLastName.value = savedState.filters.secondLastName;
      curp.value = savedState.filters.curp;
      codeNumber.value = savedState.filters.codeNumber;
      academicDiscipline.value = savedState.filters.academicDiscipline;
      educationLevel.value = savedState.filters.educationLevel;
      generation.value = savedState.filters.generation;
      semester.value = savedState.filters.semester;
      schoolYear.value = savedState.filters.schoolYear;
      statusKey.value = savedState.filters.statusKey;
      municipalityName.value = savedState.filters.municipalityName;
      isActive.value = savedState.filters.isActive;
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
        savedState.filters.firstName ||
          savedState.filters.firstLastName ||
          savedState.filters.secondLastName ||
          savedState.filters.curp ||
          savedState.filters.codeNumber ||
          savedState.filters.academicDiscipline ||
          savedState.filters.educationLevel ||
          savedState.filters.generation ||
          savedState.filters.semester ||
          savedState.filters.schoolYear ||
          savedState.filters.statusKey ||
          savedState.filters.stateName ||
          savedState.filters.municipalityName ||
          savedState.filters.isActive,
      );

      await searchStudents$();
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

  const statusToneMap = useComputed$(() => {
    const map: Record<string, 'neutral' | 'success' | 'warning' | 'danger'> =
      {};

    for (const row of rows.value) {
      map[row.statusLabel] = statusToneFromKey(row.statusKey);
    }

    return map;
  });

  const columns: DataTableColumn<StudentRow>[] = [
    {
      key: 'studentCode',
      label: m.columns.studentCode,
      width: '10rem',
    },
    {
      key: 'curp',
      label: m.columns.curp,
      width: '14rem',
    },
    {
      key: 'fullName',
      label: m.columns.fullName,
      width: '16rem',
    },
    {
      key: 'ageLabel',
      label: m.columns.age,
      width: '6rem',
      align: 'center',
    },
    {
      key: 'genderLabel',
      label: m.columns.gender,
      width: '6rem',
      align: 'center',
      badge: {
        toneMap: {
          [m.genderMaleShort]: 'primary',
          [m.genderFemaleShort]: 'danger',
        },
      },
    },
    {
      key: 'educationalProgram',
      label: m.columns.educationalProgram,
      width: '16rem',
    },
    {
      key: 'studyPlan',
      label: m.columns.studyPlan,
      width: '8rem',
    },
    {
      key: 'generationLabel',
      label: m.columns.generation,
      width: '8rem',
      align: 'center',
    },
    {
      key: 'semesterLabel',
      label: m.columns.currentSemester,
      width: '8rem',
      align: 'center',
    },
    {
      key: 'statusLabel',
      label: m.columns.statusDescription,
      width: '10rem',
      badge: {
        toneMap: statusToneMap.value,
      },
    },
    {
      key: 'emailLabel',
      label: m.columns.institutionalMail,
      width: '15rem',
    },
    {
      key: 'phoneLabel',
      label: m.columns.phone,
      width: '10rem',
    },
  ];

  const actions: DataTableAction<StudentRow>[] = [
    {
      label: m.actions.viewDetail,
      icon: 'view',
      onClick$: $(async (row) => {
        await saveWorkContext$(row);
        await nav(`${ROUTES.STUDENTS_DETAIL}?id=${row.id}`);
      }),
    },
    ...(canWrite.value
      ? ([
          {
            label: m.actions.edit,
            icon: 'edit',
            onClick$: $(async (row) => {
              await saveWorkContext$(row);
              await nav(`${ROUTES.STUDENTS_EDIT}?id=${row.id}`);
            }),
          },
        ] as DataTableAction<StudentRow>[])
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

          void nav(ROUTES.STUDENTS);
        })}
      />

      <div class="students-search-page">
        <div class="students-search-page__content">
          <section class="students-search__filters-panel">
            <form
              class="students-search__filters-form"
              preventdefault:submit
              onSubmit$={async () => {
                if (loading.value) return;
                appliedSearchTerm.value = searchTerm.value.trim();
                page.value = 1;
                await searchStudents$();
              }}
            >
              <div class="students-search__filters-top">
                <div class="students-search__global">
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

                <div class="students-search__top-actions">
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
                    <span class="students-search__toggle-content">
                      <span>{m.advancedToggle}</span>
                      {activeAdvancedFilterCount.value > 0 && (
                        <span class="students-search__active-count">
                          {activeAdvancedFilterCount.value}
                        </span>
                      )}
                      <span
                        class="students-search__toggle-chevron"
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
                <div class="students-search__chips">
                  {activeChips.value.map((chip) => (
                    <span key={chip.key} class="students-search__chip">
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
                class="students-search__advanced"
                data-open={showFilters.value ? 'true' : undefined}
              >
                <div class="students-search__section">
                  <div class="students-search__section-title">
                    {m.sectionPersonalTitle}
                  </div>

                  <div class="students-search__advanced-grid students-search__advanced-grid--three">
                    <Field label={m.fieldFirstNameLabel}>
                      <Input
                        placeholder={m.fieldFirstNamePlaceholder}
                        value={firstName.value}
                        onInput$={(event) => {
                          firstName.value = (
                            event.target as HTMLInputElement
                          ).value;
                        }}
                      />
                    </Field>

                    <Field label={m.fieldFirstLastNameLabel}>
                      <Input
                        placeholder={m.fieldFirstLastNamePlaceholder}
                        value={firstLastName.value}
                        onInput$={(event) => {
                          firstLastName.value = (
                            event.target as HTMLInputElement
                          ).value;
                        }}
                      />
                    </Field>

                    <Field label={m.fieldSecondLastNameLabel}>
                      <Input
                        placeholder={m.fieldSecondLastNamePlaceholder}
                        value={secondLastName.value}
                        onInput$={(event) => {
                          secondLastName.value = (
                            event.target as HTMLInputElement
                          ).value;
                        }}
                      />
                    </Field>
                  </div>

                  <div class="students-search__advanced-grid students-search__advanced-grid--three">
                    <Field label={m.fieldCurpLabel}>
                      <Input
                        placeholder={m.fieldCurpPlaceholder}
                        value={curp.value}
                        onInput$={(event) => {
                          curp.value = (event.target as HTMLInputElement).value;
                        }}
                      />
                    </Field>

                    <Field label={m.fieldCodeNumberLabel}>
                      <Input
                        placeholder={m.fieldCodeNumberPlaceholder}
                        value={codeNumber.value}
                        onInput$={(event) => {
                          codeNumber.value = (
                            event.target as HTMLInputElement
                          ).value;
                        }}
                      />
                    </Field>
                  </div>

                  <div class="students-search__section-divider" />
                </div>

                <div class="students-search__section">
                  <div class="students-search__section-title">
                    {m.sectionAcademicTitle}
                  </div>

                  <div class="students-search__advanced-grid students-search__advanced-grid--two">
                    <Field label={m.fieldAcademicDisciplineLabel}>
                      <Select
                        value={academicDiscipline.value}
                        options={academicDisciplineOptions.value}
                        onChange$={(value) => {
                          academicDiscipline.value = value;
                        }}
                      />
                    </Field>

                    <Field label={m.fieldEducationLevelLabel}>
                      <Select
                        value={educationLevel.value}
                        options={educationLevelOptions.value}
                        onChange$={(value) => {
                          educationLevel.value = value;
                        }}
                      />
                    </Field>
                  </div>

                  <div class="students-search__advanced-grid students-search__advanced-grid--three">
                    <Field label={m.fieldGenerationLabel}>
                      <Select
                        value={generation.value}
                        options={generationOptions.value}
                        onChange$={(value) => {
                          generation.value = value;
                        }}
                      />
                    </Field>

                    <Field label={m.fieldSemesterLabel}>
                      <Select
                        value={semester.value}
                        options={[
                          { value: '', label: m.fieldSemesterPlaceholder },
                          ...Array.from({ length: 12 }, (_, index) => ({
                            value: String(index + 1),
                            label: String(index + 1),
                          })),
                        ]}
                        onChange$={(value) => {
                          semester.value = value;
                        }}
                      />
                    </Field>
                  </div>

                  <div class="students-search__advanced-grid students-search__advanced-grid--three">
                    <Field label={m.fieldSchoolYearLabel}>
                      <Select
                        value={schoolYear.value}
                        options={schoolYearOptions.value}
                        onChange$={(value) => {
                          schoolYear.value = value;
                        }}
                      />
                    </Field>

                    <Field label={m.fieldStatusLabel}>
                      <Select
                        value={statusKey.value}
                        options={statusOptions.value}
                        onChange$={(value) => {
                          statusKey.value = value;
                        }}
                      />
                    </Field>

                    <Field label={m.fieldActiveLabel}>
                      <Select
                        value={isActive.value}
                        options={activeOptions}
                        onChange$={(value) => {
                          isActive.value = value;
                        }}
                      />
                    </Field>
                  </div>

                  <div class="students-search__section-divider" />
                </div>

                <div class="students-search__section">
                  <div class="students-search__section-title">
                    {m.sectionBirthLocationTitle}
                  </div>

                  <div class="students-search__advanced-grid students-search__advanced-grid--two">
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
                        value={municipalityName.value}
                        options={municipalityOptions.value}
                        disabled={!stateId.value}
                        onChange$={(value) => {
                          municipalityName.value = value;
                        }}
                      />
                    </Field>
                  </div>
                </div>
              </div>

              <div class="students-search__filters-footer">
                <span class="students-search__filters-info">
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

          <section class="students-search__table-card">
            <div class="students-search__table-meta">
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
                await searchStudents$();
              })}
              onLimit$={$(async (nextLimit: number) => {
                limit.value = nextLimit;
                page.value = 1;
                if (searched.value) {
                  await searchStudents$();
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
  title: `${appConfig.name} | Busqueda avanzada de estudiantes`,
};

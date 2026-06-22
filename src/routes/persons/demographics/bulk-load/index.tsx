import { $, component$, useSignal } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
import { demographicService } from '~/services/demographic/demographic.service';
import { personService } from '~/services/person/person.service';
import type { CreateDemographicDto } from '~/types/demographic.types';
import { ActionHeader, Button, DataTable, Panel } from '~/ui';
import { AppIcon } from '~/ui/icons';
import { normalizeError } from '~/utils/api-error';
import {
  parseCSV,
  standardizeRow,
  validateCSVHeaders,
} from '~/utils/csv.utils';
import '../../../bulk-load/bulk-load.css';

const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;

const m = messages.demographics.bulkLoad;

const HEADER_MAP = {
  curp: ['curp', 'curp_id'],
  maritalStatus: [
    'estado civil',
    'estado_civil',
    'estado',
    'civil',
    'maritalstatus',
    'marital_status',
  ],
  isIndigenous: [
    'indigena',
    'es indigena',
    'es_indigena',
    'isindigenous',
    'is_indigenous',
    'autoadscripcion indigena',
    'autoadscripcion_indigena',
  ],
  isAfroDescendant: [
    'afrodescendiente',
    'es afrodescendiente',
    'es_afrodescendiente',
    'isafrodescendant',
    'is_afrodescendant',
    'afro',
    'autoadscripcion afrodescendiente',
    'autoadscripcion_afrodescendiente',
  ],
  indigenousLanguage: [
    'lengua indigena',
    'lengua_indigena',
    'indigenouslanguage',
    'indigenous_language',
    'lengua',
  ],
  foreignLanguage: [
    'idioma extranjero',
    'idioma_extranjero',
    'foreignlanguage',
    'foreign_language',
    'idioma',
  ],
  specialCondition: [
    'condicion especial',
    'condicion_especial',
    'specialcondition',
    'special_condition',
    'condicion',
  ],
};

interface ImportRow {
  index: number;
  curp: string;
  maritalStatus: string;
  isIndigenous: string;
  isAfroDescendant: string;
  indigenousLanguage: string;
  foreignLanguage: string;
  specialCondition: string;

  // Campos derivados y validados
  personId?: number;
  personName?: string;
  maritalStatusId?: number;
  isIndigenousBool?: boolean;
  isAfroDescendantBool?: boolean;
  indigenousLangId?: number;
  foreignLangId?: number;
  specialConditionId?: number;

  selected: boolean;
  importStatus: 'valid' | 'warning' | 'invalid' | 'imported';
  observations: string[];
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .trim();
}

const mapMaritalStatus = (val: string): number | undefined => {
  const norm = normalizeText(val);
  if (!norm) return undefined;
  if (norm.includes('solter')) return 1;
  if (norm.includes('casad')) return 2;
  if (norm.includes('divorciad')) return 3;
  if (norm.includes('viud')) return 4;
  if (norm.includes('union libre')) return 5;
  if (norm.includes('separad')) return 6;
  if (
    norm.includes('no especificado') ||
    norm.includes('ningun') ||
    norm === '0'
  )
    return 0;
  return undefined;
};

const mapIndigenousLanguage = (val: string): number | undefined => {
  const norm = normalizeText(val);
  if (!norm) return undefined;
  if (norm.includes('ningun')) return 1;
  if (norm.includes('nahuatl')) return 2;
  if (norm.includes('maya')) return 3;
  if (norm.includes('zapotec')) return 4;
  if (norm.includes('mixtec')) return 5;
  if (norm.includes('otomi')) return 6;
  if (norm.includes('totonac')) return 7;
  if (norm.includes('tzotzil')) return 8;
  if (norm.includes('chol')) return 9;
  if (norm.includes('mazahua')) return 10;
  return undefined;
};

const mapForeignLanguage = (val: string): number | undefined => {
  const norm = normalizeText(val);
  if (!norm) return undefined;
  if (norm.includes('ningun')) return 1;
  if (norm.includes('ingle')) return 2;
  if (norm.includes('france')) return 3;
  if (norm.includes('aleman')) return 4;
  if (norm.includes('portugue')) return 5;
  if (norm.includes('italian')) return 6;
  if (norm.includes('mandarin') || norm.includes('chino')) return 7;
  if (norm.includes('japone')) return 8;
  return undefined;
};

const mapSpecialCondition = (val: string): number | undefined => {
  const norm = normalizeText(val);
  if (!norm) return undefined;
  if (norm.includes('ningun')) return 1;
  if (norm.includes('visual')) return 2;
  if (norm.includes('auditi')) return 3;
  if (norm.includes('motri') || norm.includes('motor')) return 4;
  if (norm.includes('intelectual')) return 5;
  if (norm.includes('psicosocial')) return 6;
  return undefined;
};

const mapBoolean = (val: string): boolean | undefined => {
  const norm = normalizeText(val);
  if (['si', 'sí', '1', 'true', 'yes', 'y'].includes(norm)) return true;
  if (['no', '0', 'false', 'n'].includes(norm)) return false;
  return undefined;
};

export default component$(() => {
  const nav = useNavigate();

  const step = useSignal<'upload' | 'review' | 'success' | 'error'>('upload');
  const rows = useSignal<ImportRow[]>([]);
  const validating = useSignal(false);
  const importing = useSignal(false);
  const errorMsg = useSignal('');
  const registeredCount = useSignal(0);

  const resetForm$ = $(() => {
    step.value = 'upload';
    rows.value = [];
    validating.value = false;
    importing.value = false;
    errorMsg.value = '';
    registeredCount.value = 0;
  });

  const runDuplicateAndApiChecks = $(async (parsedRows: ImportRow[]) => {
    // 1. Duplicados locales de CURP en el CSV
    const curpsInCSV = new Map<string, number[]>();
    parsedRows.forEach((r) => {
      if (r.importStatus !== 'invalid') {
        const key = r.curp.toUpperCase();
        if (!curpsInCSV.has(key)) curpsInCSV.set(key, []);
        curpsInCSV.get(key)!.push(r.index);
      }
    });

    curpsInCSV.forEach((indices) => {
      if (indices.length > 1) {
        indices.forEach((idx) => {
          parsedRows[idx].importStatus = 'invalid';
          parsedRows[idx].selected = false;
          if (
            !parsedRows[idx].observations.includes(
              'CURP duplicada dentro del archivo CSV',
            )
          ) {
            parsedRows[idx].observations.push(
              'CURP duplicada dentro del archivo CSV',
            );
          }
        });
      }
    });

    // 2. Consultar la existencia de personas y verificar si ya tienen demografía asignada
    const uniqueCurps = Array.from(
      new Set(
        parsedRows
          .filter((r) => r.importStatus !== 'invalid')
          .map((r) => r.curp.toUpperCase()),
      ),
    );

    const personInfoByCurp = new Map<
      string,
      { id: number; fullName: string }
    >();
    const hasDemographicByCurp = new Map<string, boolean>();

    await Promise.all(
      uniqueCurps.map(async (curp) => {
        try {
          // Primero, consultar general para ver si la persona existe
          const resAll = await personService.findMany({ curp, limit: 1 });
          if (resAll.data && resAll.data.length > 0) {
            const person = resAll.data[0];
            personInfoByCurp.set(curp, {
              id: person.id,
              fullName: person.fullName,
            });

            // Después, consultar con hasDemographic: false para ver si no tiene demografía
            const resNoDemo = await personService.findMany({
              curp,
              hasDemographic: false,
              limit: 1,
            });
            const hasNoDemo = resNoDemo.data && resNoDemo.data.length > 0;
            hasDemographicByCurp.set(curp, !hasNoDemo);
          }
        } catch {
          // No bloqueante
        }
      }),
    );

    // 3. Validaciones de base de datos por fila
    parsedRows.forEach((r) => {
      if (r.importStatus === 'invalid') return;

      const curpKey = r.curp.toUpperCase();
      const personData = personInfoByCurp.get(curpKey);

      if (!personData) {
        r.importStatus = 'invalid';
        r.selected = false;
        r.observations.push(
          'La CURP no está registrada en el padrón de personas.',
        );
      } else {
        r.personId = personData.id;
        r.personName = personData.fullName;

        // Comprobar si ya tiene demografía
        const alreadyHasDemographic =
          hasDemographicByCurp.get(curpKey) || false;
        if (alreadyHasDemographic) {
          r.importStatus = 'invalid';
          r.selected = false;
          r.observations.push(
            'La persona ya cuenta con datos demográficos registrados.',
          );
        }
      }
    });

    // Actualizar estados
    rows.value = parsedRows;
    step.value = 'review';
    validating.value = false;
  });

  const processFile = $(async (file: File) => {
    errorMsg.value = '';
    validating.value = true;

    const reader = new FileReader();
    reader.onload = $((e: ProgressEvent<FileReader>) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer) {
        errorMsg.value = m.errorCSVRequired;
        validating.value = false;
        return;
      }

      let text = '';
      try {
        const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
        text = utf8Decoder.decode(buffer);
      } catch {
        const ansiDecoder = new TextDecoder('windows-1252');
        text = ansiDecoder.decode(buffer);
      }

      const { headers, rows: rawRows } = parseCSV(text);
      if (headers.length === 0 || rawRows.length === 0) {
        errorMsg.value = m.errorCSVRequired;
        validating.value = false;
        return;
      }

      const required = ['curp', 'isIndigenous', 'isAfroDescendant'];
      const isValidFormat = validateCSVHeaders(headers, required, HEADER_MAP);
      if (!isValidFormat) {
        errorMsg.value = m.errorCSVFormat;
        validating.value = false;
        return;
      }

      const parsedRows: ImportRow[] = rawRows.map((rawRow, idx) => {
        const std = standardizeRow(rawRow, HEADER_MAP);

        const curpVal = (std.curp || '').trim().toUpperCase();
        const maritalVal = (std.maritalStatus || '').trim();
        const indigenousVal = (std.isIndigenous || '').trim();
        const afroVal = (std.isAfroDescendant || '').trim();
        const indigenousLangVal = (std.indigenousLanguage || '').trim();
        const foreignLangVal = (std.foreignLanguage || '').trim();
        const specialCondVal = (std.specialCondition || '').trim();

        const obs: string[] = [];
        let status: 'valid' | 'warning' | 'invalid' = 'valid';

        // Validaciones locales
        if (!curpVal) {
          obs.push('CURP es obligatoria');
          status = 'invalid';
        } else if (curpVal.length !== 18 || !CURP_REGEX.test(curpVal)) {
          obs.push('CURP con formato inválido');
          status = 'invalid';
        }

        // Booleanos obligatorios
        let isIndigenousBool: boolean | undefined;
        if (!indigenousVal) {
          obs.push('El campo Indígena es obligatorio');
          status = 'invalid';
        } else {
          isIndigenousBool = mapBoolean(indigenousVal);
          if (isIndigenousBool === undefined) {
            obs.push(
              `Valor de autoadscripción indígena "${indigenousVal}" no válido. Debe ser Sí o No.`,
            );
            status = 'invalid';
          }
        }

        let isAfroDescendantBool: boolean | undefined;
        if (!afroVal) {
          obs.push('El campo Afrodescendiente es obligatorio');
          status = 'invalid';
        } else {
          isAfroDescendantBool = mapBoolean(afroVal);
          if (isAfroDescendantBool === undefined) {
            obs.push(
              `Valor de autoadscripción afrodescendiente "${afroVal}" no válido. Debe ser Sí o No.`,
            );
            status = 'invalid';
          }
        }

        // Mapeos de catálogos estáticos opcionales
        let maritalStatusId: number | undefined;
        if (maritalVal) {
          maritalStatusId = mapMaritalStatus(maritalVal);
          if (maritalStatusId === undefined) {
            obs.push(`Estado civil "${maritalVal}" no válido.`);
            status = 'invalid';
          }
        }

        let indigenousLangId: number | undefined;
        if (indigenousLangVal) {
          indigenousLangId = mapIndigenousLanguage(indigenousLangVal);
          if (indigenousLangId === undefined) {
            obs.push(`Lengua indígena "${indigenousLangVal}" no válida.`);
            status = 'invalid';
          }
        }

        let foreignLangId: number | undefined;
        if (foreignLangVal) {
          foreignLangId = mapForeignLanguage(foreignLangVal);
          if (foreignLangId === undefined) {
            obs.push(`Idioma extranjero "${foreignLangVal}" no válido.`);
            status = 'invalid';
          }
        }

        let specialConditionId: number | undefined;
        if (specialCondVal) {
          specialConditionId = mapSpecialCondition(specialCondVal);
          if (specialConditionId === undefined) {
            obs.push(`Condición especial "${specialCondVal}" no válida.`);
            status = 'invalid';
          }
        }

        return {
          index: idx,
          curp: curpVal,
          maritalStatus: maritalVal,
          isIndigenous: indigenousVal,
          isAfroDescendant: afroVal,
          indigenousLanguage: indigenousLangVal,
          foreignLanguage: foreignLangVal,
          specialCondition: specialCondVal,

          maritalStatusId,
          isIndigenousBool,
          isAfroDescendantBool,
          indigenousLangId,
          foreignLangId,
          specialConditionId,

          selected: status !== 'invalid',
          importStatus: status,
          observations: obs,
        };
      });

      runDuplicateAndApiChecks(parsedRows);
    });
    reader.readAsArrayBuffer(file);
  });

  const onFileSelect$ = $(async (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      await processFile(input.files[0]);
    }
  });

  const onDrop$ = $(async (event: DragEvent) => {
    event.preventDefault();
    if (
      event.dataTransfer &&
      event.dataTransfer.files &&
      event.dataTransfer.files[0]
    ) {
      await processFile(event.dataTransfer.files[0]);
    }
  });

  const onClickZone$ = $(() => {
    const input = document.getElementById('csv-file-input') as HTMLInputElement;
    if (input) {
      input.click();
    }
  });

  const downloadTemplate$ = $(() => {
    const headers = [
      'CURP',
      'Estado civil',
      'Indígena',
      'Afrodescendiente',
      'Lengua indígena',
      'Idioma extranjero',
      'Condición especial',
    ];
    const exampleRow = [
      'AAAA000000HDFRRR00',
      'Soltero/a',
      'No',
      'No',
      'Ninguna',
      'Inglés',
      'Ninguna',
    ];

    const csvContent =
      '\uFEFF' + [headers.join(','), exampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_demografia.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  const onRowSelect$ = $((selectedRow: any, checked: boolean) => {
    rows.value = rows.value.map((r) => {
      if (r.index === selectedRow.index) {
        return { ...r, selected: checked };
      }
      return r;
    });
  });

  const onSelectAll$ = $((checked: boolean) => {
    rows.value = rows.value.map((r) => {
      if (r.importStatus === 'invalid' || r.importStatus === 'imported') {
        return r;
      }
      return { ...r, selected: checked };
    });
  });

  const handleImport$ = $(async () => {
    const selectedRows = rows.value.filter(
      (r) =>
        r.selected &&
        r.importStatus !== 'invalid' &&
        r.importStatus !== 'imported',
    );
    if (selectedRows.length === 0) return;

    importing.value = true;
    errorMsg.value = '';

    const demographicsDto: CreateDemographicDto[] = selectedRows.map((r) => ({
      personId: r.personId!,
      maritalStatusId: r.maritalStatusId,
      isIndigenous: r.isIndigenousBool!,
      isAfroDescendant: r.isAfroDescendantBool!,
      indigenousLangId: r.indigenousLangId,
      foreignLangId: r.foreignLangId,
      specialConditionId: r.specialConditionId,
    }));

    try {
      // Intentar importación por lote
      await demographicService.createMany({ demographics: demographicsDto });
      registeredCount.value = selectedRows.length;
      step.value = 'success';
    } catch (err) {
      const errorResponse = (err as any)?.response;
      // Fallback a importación secuencial si el lote da 404 (no soportado) o error equivalente
      if (errorResponse?.status === 404) {
        try {
          let count = 0;
          for (const dto of demographicsDto) {
            await demographicService.create(dto);
            count++;
          }
          registeredCount.value = count;
          step.value = 'success';
          return;
        } catch (fallbackErr) {
          const normalized = normalizeError(
            fallbackErr,
            'Error al registrar datos demográficos de forma individual.',
          );
          errorMsg.value = normalized.message;
          step.value = 'error';
          return;
        }
      }

      const normalized = normalizeError(
        err,
        messages.errors.createDemographicFailed ||
          'Error al registrar registros.',
      );
      errorMsg.value = normalized.message;
      step.value = 'error';
    } finally {
      importing.value = false;
    }
  });

  // Stats
  const totalCount = rows.value.length;
  const validCount = rows.value.filter(
    (r) => r.importStatus === 'valid',
  ).length;
  const warningCount = rows.value.filter(
    (r) => r.importStatus === 'warning',
  ).length;
  const invalidCount = rows.value.filter(
    (r) => r.importStatus === 'invalid',
  ).length;
  const readyCount = rows.value.filter(
    (r) => r.selected && r.importStatus !== 'invalid',
  ).length;

  const columns = [
    {
      key: 'importStatusLabel',
      label: 'Estado',
      align: 'center' as const,
      width: '9%',
      badge: {
        toneMap: {
          Válido: 'success' as const,
          Advertencia: 'warning' as const,
          Error: 'danger' as const,
          Importado: 'neutral' as const,
        },
      },
    },
    {
      key: 'curp',
      label: m.columns.curp,
      width: '15%',
    },
    {
      key: 'fullName',
      label: m.columns.fullName,
      width: '18%',
    },
    {
      key: 'selfIdentification',
      label: 'Autoadscripción',
      width: '15%',
    },
    {
      key: 'demographicSummary',
      label: 'Datos Demográficos',
      width: '23%',
    },
    {
      key: 'observations',
      label: m.columns.observations,
      width: '20%',
    },
  ];

  const tableRows = rows.value.map((r) => {
    let statusLabel = 'Válido';
    if (r.importStatus === 'warning') statusLabel = 'Advertencia';
    if (r.importStatus === 'invalid') statusLabel = 'Error';
    if (r.importStatus === 'imported') statusLabel = 'Importado';

    const formattedObs = r.observations
      .map((obs) => {
        return `❌ Error: ${obs}`;
      })
      .join(', ');

    const selfIdentification = `Indígena: ${r.isIndigenous || '—'}, Afro: ${r.isAfroDescendant || '—'}`;
    const demographicSummary =
      [
        r.maritalStatus ? `Est. Civil: ${r.maritalStatus}` : '',
        r.indigenousLanguage ? `Lengua: ${r.indigenousLanguage}` : '',
        r.foreignLanguage ? `Idioma: ${r.foreignLanguage}` : '',
        r.specialCondition ? `Condición: ${r.specialCondition}` : '',
      ]
        .filter(Boolean)
        .join(' | ') || 'Sin datos';

    return {
      ...r,
      fullName: r.personName || 'No identificado',
      selfIdentification,
      demographicSummary,
      importStatusLabel: statusLabel,
      observations: formattedObs,
    };
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
      <ActionHeader
        q:slot="hub-header"
        title={m.title}
        onBack$={async () => await nav(ROUTES.DEMOGRAPHICS)}
      />

      <div class="bulk-load-page">
        <div class="bulk-load-page__content">
          {/* loader */}
          {validating.value && (
            <div class="bulk-load-page__card">
              <Panel>
                <div class="import-success-panel">
                  <div class="import-success-icon import-spin">
                    <AppIcon intent="refresh" size="lg" />
                  </div>
                  <h2>Procesando y validando archivo...</h2>
                  <p>
                    Por favor espera un momento mientras validamos los formatos
                    y personas en la base de datos.
                  </p>
                </div>
              </Panel>
            </div>
          )}

          {/* step 1: upload */}
          {!validating.value && step.value === 'upload' && (
            <div class="bulk-load-page__card">
              {errorMsg.value && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <Panel density="compact">
                    <div
                      class="import-alert-banner error"
                      style={{ margin: 0 }}
                    >
                      <strong>Error de validación del archivo:</strong>{' '}
                      {errorMsg.value}
                    </div>
                  </Panel>
                </div>
              )}

              <Panel
                title={m.uploadPanelTitle}
                description={m.uploadPanelSubtitle}
              >
                <div
                  style={{
                    marginBottom: 'var(--space-4)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    iconLeft="download"
                    onClick$={downloadTemplate$}
                  >
                    Descargar plantilla CSV
                  </Button>
                </div>

                <input
                  type="file"
                  accept=".csv"
                  id="csv-file-input"
                  style={{ display: 'none' }}
                  onChange$={onFileSelect$}
                />

                <div
                  class="import-upload-zone"
                  onDragOver$={(e) => e.preventDefault()}
                  onDrop$={onDrop$}
                  onClick$={onClickZone$}
                >
                  <div class="import-upload-icon">
                    <AppIcon intent="upload" size="xl" />
                  </div>
                  <div class="import-upload-text">{m.uploadZoneTitle}</div>
                  <div class="import-upload-subtext">
                    {m.uploadZoneSubtitle}
                  </div>
                </div>

                <div class="import-upload-info">
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Guía de Campos del Archivo CSV de Demografía:
                  </span>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 'var(--space-4)',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-1)',
                    }}
                  >
                    <li>
                      <strong>Requeridos:</strong> CURP (Persona titular),
                      Indígena (Sí o No), Afrodescendiente (Sí o No).
                    </li>
                    <li>
                      <strong>Opcionales (Catálogos):</strong> Estado civil (Ej:
                      Soltero/a, Casado/a, Unión libre), Lengua indígena (Ej:
                      Náhuatl, Maya), Idioma extranjero (Ej: Inglés, Francés),
                      Condición especial (Ej: Discapacidad visual, Discapacidad
                      auditiva).
                    </li>
                    <li
                      style={{
                        listStyleType: 'none',
                        marginTop: 'var(--space-2)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <em>
                        * Nota: La persona asociada a la CURP debe existir
                        previamente en el padrón y no contar con datos
                        demográficos ya registrados.
                      </em>
                    </li>
                  </ul>
                </div>
              </Panel>
            </div>
          )}

          {/* step 2: review */}
          {!validating.value && step.value === 'review' && (
            <div class="bulk-load-page__review">
              <div class="import-stats">
                <div class="import-stat-card valid">
                  <div class="import-stat-number valid">{validCount}</div>
                  <div class="import-stat-label">{m.statsValid}</div>
                </div>
                <div class="import-stat-card warning">
                  <div class="import-stat-number warning">{warningCount}</div>
                  <div class="import-stat-label">{m.statsWarning}</div>
                </div>
                <div class="import-stat-card invalid">
                  <div class="import-stat-number invalid">{invalidCount}</div>
                  <div class="import-stat-label">{m.statsError}</div>
                </div>
                <div class="import-stat-card">
                  <div class="import-stat-number">{readyCount}</div>
                  <div class="import-stat-label">{m.statsReady}</div>
                </div>
              </div>

              <Panel
                title={`Registros cargados (${totalCount})`}
                description="Selecciona los registros demográficos válidos que deseas asociar a las personas."
              >
                <DataTable
                  columns={columns}
                  rows={tableRows}
                  selectable={true}
                  emptyTitle={m.tableEmpty}
                  onRowSelect$={onRowSelect$}
                  onSelectAll$={onSelectAll$}
                />

                <div class="import-actions">
                  <Button variant="ghost" onClick$={resetForm$}>
                    {m.actionCancel}
                  </Button>
                  <Button
                    variant="primary"
                    disabled={readyCount === 0 || importing.value}
                    onClick$={handleImport$}
                  >
                    {importing.value ? m.actionImporting : m.actionImport}
                  </Button>
                </div>
              </Panel>
            </div>
          )}

          {/* step 3: success */}
          {!validating.value && step.value === 'success' && (
            <div class="bulk-load-page__card">
              <Panel>
                <div class="import-success-panel">
                  <div class="import-success-icon">
                    <AppIcon intent="success" size="lg" />
                  </div>
                  <h2>{m.successTitle}</h2>
                  <p>
                    Se han registrado exitosamente {registeredCount.value}{' '}
                    {registeredCount.value === 1
                      ? 'registro demográfico'
                      : 'registros demográficos'}{' '}
                    en el sistema.
                  </p>
                  <div class="import-success-actions">
                    <Button
                      onClick$={async () => await nav(ROUTES.DEMOGRAPHICS)}
                    >
                      {m.successFinish}
                    </Button>
                    <Button variant="ghost" onClick$={resetForm$}>
                      {m.successUploadAnother}
                    </Button>
                  </div>
                </div>
              </Panel>
            </div>
          )}

          {/* step 4: error */}
          {!validating.value && step.value === 'error' && (
            <div class="bulk-load-page__card">
              <Panel>
                <div class="import-success-panel">
                  <div
                    class="import-success-icon"
                    style={{
                      backgroundColor: 'var(--color-danger-light)',
                      color: 'var(--color-danger)',
                    }}
                  >
                    <AppIcon intent="cancel" size="lg" />
                  </div>
                  <h2>{m.errorTitle}</h2>
                  <p style={{ marginBottom: 'var(--space-md)' }}>
                    {m.errorDetails} {errorMsg.value}
                  </p>
                  <div class="import-success-actions">
                    <Button
                      onClick$={async () => {
                        step.value = 'review';
                      }}
                    >
                      {m.errorBack}
                    </Button>
                    <Button variant="ghost" onClick$={resetForm$}>
                      {m.errorCancel}
                    </Button>
                  </div>
                </div>
              </Panel>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: m.title,
  meta: [
    {
      name: 'description',
      content: m.description,
    },
  ],
};

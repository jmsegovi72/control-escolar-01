import { $, component$, useSignal } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
import { addressService } from '~/services/address/address.service';
import { catalogService } from '~/services/catalog/catalog.service';
import { personService } from '~/services/person/person.service';
import type { CreateAddressDto } from '~/types/address.types';
import { ActionHeader, Button, DataTable, Panel } from '~/ui';
import { AppIcon } from '~/ui/icons';
import { normalizeError } from '~/utils/api-error';
import {
  normalizeHeader,
  parseCSV,
  standardizeRow,
  validateCSVHeaders,
} from '~/utils/csv.utils';
import '../../bulk-load/bulk-load.css';

const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
const CP_REGEX = /^\d{5}$/;

const m = messages.addresses.bulkLoad;

const HEADER_MAP = {
  curp: ['curp', 'curp_id'],
  streetType: [
    'tipo de vialidad',
    'tipo_vialidad',
    'vialidad',
    'streettype',
    'street_type',
  ],
  street: ['calle', 'street', 'nombre calle', 'nombre_calle'],
  exteriorNumber: [
    'numero exterior',
    'num exterior',
    'num_exterior',
    'exterior_number',
    'ext_num',
    'ext',
  ],
  interiorNumber: [
    'numero interior',
    'num interior',
    'num_interior',
    'interior_number',
    'int_num',
    'int',
  ],
  block: ['manzana', 'block', 'mz'],
  betweenStreets: ['entre calles', 'between_streets', 'betweenstreets'],
  zipCode: ['codigo postal', 'cp', 'zipcode', 'zip_code'],
  settlement: ['asentamiento', 'colonia', 'settlement', 'col'],
};

interface ImportRow {
  index: number;
  curp: string;
  streetType: string;
  street: string;
  exteriorNumber?: string;
  interiorNumber?: string;
  block?: string;
  betweenStreets?: string;
  zipCode: string;
  settlement: string;

  // Campos derivados y validados
  personId?: number;
  personName?: string;
  streetTypeId?: number;
  zipCodeId?: number;
  stateName?: string;
  municipalityName?: string;

  selected: boolean;
  importStatus: 'valid' | 'warning' | 'invalid' | 'imported';
  observations: string[];
}

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

    // Cargar catálogos
    let streetTypes: any[] = [];
    try {
      streetTypes = await catalogService.getStreetTypes();
    } catch {
      streetTypes = [];
    }

    // 2. Agrupar consultas de códigos postales únicos para reducir peticiones de catálogos
    const uniqueZipCodes = Array.from(
      new Set(
        parsedRows
          .filter((r) => r.importStatus !== 'invalid')
          .map((r) => r.zipCode),
      ),
    );

    const settlementsByZip = new Map<string, any[]>();
    await Promise.all(
      uniqueZipCodes.map(async (zip) => {
        try {
          const list = await catalogService.getSettlements(zip);
          settlementsByZip.set(zip, list);
        } catch {
          settlementsByZip.set(zip, []);
        }
      }),
    );

    // 3. Consultar la existencia de personas y verificar si ya tienen dirección asignada
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
    const hasAddressByCurp = new Map<string, boolean>();

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

            // Después, consultar con hasAddress: false para ver si no tiene dirección
            const resNoAddress = await personService.findMany({
              curp,
              hasAddress: false,
              limit: 1,
            });
            const hasNoAddress =
              resNoAddress.data && resNoAddress.data.length > 0;
            hasAddressByCurp.set(curp, !hasNoAddress);
          }
        } catch {
          // No bloqueante
        }
      }),
    );

    // 4. Validaciones combinadas por fila
    parsedRows.forEach((r) => {
      if (r.importStatus === 'invalid') return;

      // a. Tipo de vialidad
      const normStreetType = normalizeHeader(r.streetType);
      const matchedStreetType = streetTypes.find(
        (t) =>
          normalizeHeader(t.name) === normStreetType ||
          (t.abbreviation &&
            normalizeHeader(t.abbreviation) === normStreetType),
      );

      if (!matchedStreetType) {
        r.importStatus = 'invalid';
        r.selected = false;
        r.observations.push(
          `Tipo de vialidad "${r.streetType}" no válido. Ej: Calle, Avenida.`,
        );
      } else {
        r.streetTypeId = matchedStreetType.id;
        r.streetType = matchedStreetType.name; // Estandarizar nombre
      }

      // b. Asentamiento por CP
      const cpSettlements = settlementsByZip.get(r.zipCode) || [];
      if (cpSettlements.length === 0) {
        r.importStatus = 'invalid';
        r.selected = false;
        r.observations.push(
          `Código postal ${r.zipCode} no existe en el catálogo.`,
        );
      } else {
        const normSettlement = normalizeHeader(r.settlement);
        const matchedSettlement = cpSettlements.find(
          (s) => normalizeHeader(s.settlement) === normSettlement,
        );

        if (!matchedSettlement) {
          r.importStatus = 'invalid';
          r.selected = false;
          r.observations.push(
            `El asentamiento "${r.settlement}" no pertenece al C.P. ${r.zipCode}.`,
          );
        } else {
          r.zipCodeId = matchedSettlement.id;
          r.settlement = matchedSettlement.settlement; // Estandarizar nombre
          r.stateName = matchedSettlement.stateName;
          r.municipalityName = matchedSettlement.municipalityName;
        }
      }

      // c. Persona en el sistema
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

        // Comprobar si ya tiene dirección
        const alreadyHasAddress = hasAddressByCurp.get(curpKey) || false;
        if (alreadyHasAddress) {
          r.importStatus = 'invalid';
          r.selected = false;
          r.observations.push(
            'La persona ya cuenta con un domicilio registrado.',
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

      const required = [
        'curp',
        'streetType',
        'street',
        'zipCode',
        'settlement',
      ];
      const isValidFormat = validateCSVHeaders(headers, required, HEADER_MAP);
      if (!isValidFormat) {
        errorMsg.value = m.errorCSVFormat;
        validating.value = false;
        return;
      }

      const parsedRows: ImportRow[] = rawRows.map((rawRow, idx) => {
        const std = standardizeRow(rawRow, HEADER_MAP);

        const curpVal = (std.curp || '').trim().toUpperCase();
        const streetTypeVal = (std.streetType || '').trim();
        const streetVal = (std.street || '').trim();
        const extVal = (std.exteriorNumber || '').trim();
        const intVal = (std.interiorNumber || '').trim();
        const blockVal = (std.block || '').trim();
        const betweenVal = (std.betweenStreets || '').trim();
        const zipVal = (std.zipCode || '').trim();
        const settlementVal = (std.settlement || '').trim();

        const obs: string[] = [];
        let status: 'valid' | 'warning' | 'invalid' = 'valid';

        if (!curpVal) {
          obs.push('CURP es obligatoria');
          status = 'invalid';
        } else if (curpVal.length !== 18 || !CURP_REGEX.test(curpVal)) {
          obs.push('CURP con formato inválido');
          status = 'invalid';
        }

        if (!streetTypeVal) {
          obs.push('Tipo de vialidad es obligatorio');
          status = 'invalid';
        }

        if (!streetVal) {
          obs.push('Calle es obligatoria');
          status = 'invalid';
        }

        if (!zipVal) {
          obs.push('Código postal es obligatorio');
          status = 'invalid';
        } else if (!CP_REGEX.test(zipVal)) {
          obs.push('Código postal debe ser de 5 dígitos');
          status = 'invalid';
        }

        if (!settlementVal) {
          obs.push('Asentamiento es obligatorio');
          status = 'invalid';
        }

        return {
          index: idx,
          curp: curpVal,
          streetType: streetTypeVal,
          street: streetVal,
          exteriorNumber: extVal || undefined,
          interiorNumber: intVal || undefined,
          block: blockVal || undefined,
          betweenStreets: betweenVal || undefined,
          zipCode: zipVal,
          settlement: settlementVal,
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
      'Tipo de vialidad',
      'Calle',
      'Número exterior',
      'Número interior',
      'Manzana',
      'Entre calles',
      'Código postal',
      'Asentamiento',
    ];
    const exampleRow = [
      'AAAA000000HDFRRR00',
      'Calle',
      'Reforma',
      '123',
      '4B',
      'MZ 17',
      'Revolución y Libertad',
      '97000',
      'Centro',
    ];

    const csvContent =
      '\uFEFF' + [headers.join(','), exampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_direcciones.csv');
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

    const addressesDto: CreateAddressDto[] = selectedRows.map((r) => ({
      personId: r.personId!,
      streetTypeId: r.streetTypeId!,
      street: r.street,
      exteriorNumber: r.exteriorNumber,
      interiorNumber: r.interiorNumber,
      block: r.block,
      betweenStreets: r.betweenStreets,
      zipCodeId: r.zipCodeId!,
    }));

    try {
      // Intentar importación por lote
      await addressService.createMany({ addresses: addressesDto });
      registeredCount.value = selectedRows.length;
      step.value = 'success';
    } catch (err) {
      const errorResponse = (err as any)?.response;
      // Fallback a importación secuencial si el lote da 404 (no soportado) o error equivalente
      if (errorResponse?.status === 404) {
        try {
          let count = 0;
          for (const dto of addressesDto) {
            await addressService.create(dto);
            count++;
          }
          registeredCount.value = count;
          step.value = 'success';
          return;
        } catch (fallbackErr) {
          const normalized = normalizeError(
            fallbackErr,
            'Error al registrar direcciones de forma individual.',
          );
          errorMsg.value = normalized.message;
          step.value = 'error';
          return;
        }
      }

      const normalized = normalizeError(
        err,
        messages.errors.createAddressFailed || 'Error al registrar registros.',
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
      width: '18%',
    },
    {
      key: 'fullName',
      label: m.columns.fullName,
      width: '20%',
    },
    {
      key: 'streetAddress',
      label: 'Calle y Núm.',
      width: '23%',
    },
    {
      key: 'settlementInfo',
      label: 'Ubicación',
      width: '20%',
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

    const streetAddress =
      `${r.streetType} ${r.street}${r.exteriorNumber ? ` No. ${r.exteriorNumber}` : ''}${r.interiorNumber ? ` Int. ${r.interiorNumber}` : ''}`.trim();
    const settlementInfo = `${r.settlement}, CP ${r.zipCode}`;

    return {
      ...r,
      fullName: r.personName || 'No identificado',
      streetAddress,
      settlementInfo,
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
        onBack$={async () => await nav(ROUTES.ADDRESSES)}
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
                    Guía de Campos del Archivo CSV de Direcciones:
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
                      <strong>Requeridos:</strong> CURP (Persona titular), Tipo
                      de vialidad (Ej: Calle, Avenida), Calle (Nombre), Código
                      postal (5 dígitos), Asentamiento (Colonia).
                    </li>
                    <li>
                      <strong>Opcionales:</strong> Número exterior, Número
                      interior, Manzana, Entre calles.
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
                        previamente en el padrón y no contar con un domicilio ya
                        registrado.
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
                description="Selecciona las direcciones válidas que deseas asociar a las personas."
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
                    {registeredCount.value === 1 ? 'dirección' : 'direcciones'}{' '}
                    en el sistema.
                  </p>
                  <div class="import-success-actions">
                    <Button onClick$={async () => await nav(ROUTES.ADDRESSES)}>
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

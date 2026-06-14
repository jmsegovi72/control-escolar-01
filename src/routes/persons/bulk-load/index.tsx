import { $, component$, useSignal } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
import { catalogService } from '~/services/catalog/catalog.service';
import { personService } from '~/services/person/person.service';
import type { CreatePersonDto } from '~/types/person.types';
import { Button, DataTable, ModuleHeader, Panel, Toolbar } from '~/ui';
import { AppIcon } from '~/ui/icons';
import { normalizeError } from '~/utils/api-error';
import {
  parseCSV,
  standardizeRow,
  validateCSVHeaders,
} from '~/utils/csv.utils';
import './bulk-load.css';

const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;

const m = messages.persons.bulkLoad;

const HEADER_MAP = {
  curp: ['curp', 'curp_id'],
  firstName: ['nombre', 'nombres', 'firstname', 'first_name'],
  firstLastName: [
    'primer apellido',
    'primer_apellido',
    'paterno',
    'firstlastname',
  ],
  phone: ['telefono', 'teléfono', 'celular', 'phone', 'tel'],
  email: ['correo', 'correo electrónico', 'email', 'mail'],
  secondLastName: ['segundo apellido', 'materno', 'secondlastname'],
  municipalityId: ['municipalityid', 'municipio'],
  homoclave: ['homoclave', 'homo'],
};

type CurpData = {
  gender: 'H' | 'M';
  birthDate: Date;
  nationality: 'M' | 'NE';
  stateCode: string;
};

const extractDataFromCURP = (curp: string): CurpData => {
  const gender = curp.charAt(10) as 'H' | 'M';
  const year = curp.substring(4, 6);
  const month = curp.substring(6, 8);
  const day = curp.substring(8, 10);
  const currentYY = new Date().getFullYear() % 100;
  const fullYear = Number(year) <= currentYY ? `20${year}` : `19${year}`;
  const birthDate = new Date(`${fullYear}-${month}-${day}`);
  if (isNaN(birthDate.getTime())) {
    throw new Error('La CURP contiene una fecha inválida.');
  }
  const stateCode = curp.substring(11, 13);
  const nationality: 'M' | 'NE' = stateCode === 'NE' ? 'NE' : 'M';
  return { gender, birthDate, nationality, stateCode };
};

interface ImportRow {
  index: number;
  firstName: string;
  firstLastName: string;
  secondLastName?: string;
  curp: string;
  gender: 'H' | 'M';
  phone: string;
  email: string;
  municipalityId?: number;
  birthDate?: string;
  homoclave?: string;
  nationality?: string;
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

  const runDuplicateChecks = $(async (parsedRows: ImportRow[]) => {
    // 1. CSV local duplicates
    const curpsInCSV = new Map<string, number[]>();
    const emailsInCSV = new Map<string, number[]>();

    parsedRows.forEach((r) => {
      if (r.importStatus !== 'invalid') {
        if (!curpsInCSV.has(r.curp)) curpsInCSV.set(r.curp, []);
        curpsInCSV.get(r.curp)!.push(r.index);

        if (!emailsInCSV.has(r.email)) emailsInCSV.set(r.email, []);
        emailsInCSV.get(r.email)!.push(r.index);
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

    emailsInCSV.forEach((indices) => {
      if (indices.length > 1) {
        indices.forEach((idx) => {
          parsedRows[idx].importStatus = 'invalid';
          parsedRows[idx].selected = false;
          if (
            !parsedRows[idx].observations.includes(
              'Correo electrónico duplicado dentro del archivo CSV',
            )
          ) {
            parsedRows[idx].observations.push(
              'Correo electrónico duplicado dentro del archivo CSV',
            );
          }
        });
      }
    });

    // 2. Fetch valid municipalities for unique states
    const uniqueStateCodes = Array.from(
      new Set(
        parsedRows
          .filter(
            (r) =>
              r.importStatus !== 'invalid' && r.municipalityId !== undefined,
          )
          .map((r) => {
            try {
              return extractDataFromCURP(r.curp).stateCode;
            } catch {
              return '';
            }
          })
          .filter((code) => code !== ''),
      ),
    );

    const municipalitiesByState = new Map<string, number[]>();
    await Promise.all(
      uniqueStateCodes.map(async (code) => {
        try {
          const municipalities = await catalogService.getMunicipalities({
            stateCode: code,
          });
          municipalitiesByState.set(
            code,
            municipalities.map((m) => m.id),
          );
        } catch {
          // non-blocking
        }
      }),
    );

    // Validate municipalityId against derived stateCode
    parsedRows.forEach((r) => {
      if (r.importStatus === 'invalid' || r.municipalityId === undefined)
        return;

      try {
        const { stateCode } = extractDataFromCURP(r.curp);
        const validIds = municipalitiesByState.get(stateCode) || [];
        if (!validIds.includes(r.municipalityId)) {
          r.importStatus = 'invalid';
          r.selected = false;
          r.observations.push(
            `Municipio ID ${r.municipalityId} no pertenece al estado de la CURP (${stateCode})`,
          );
        }
      } catch {
        // already format validated
      }
    });

    // 3. Database duplicates (only for format-valid/municipality-valid rows)
    const dbCheckPromises = parsedRows.map(async (r) => {
      if (r.importStatus === 'invalid') return;

      // Check CURP
      try {
        await personService.findOne(r.curp);
        r.importStatus = 'invalid';
        r.selected = false;
        r.observations.push('CURP ya registrada en la base de datos');
      } catch {
        // 404 is expected for new records
      }

      // Check email
      try {
        await personService.findOne(r.email);
        r.importStatus = 'invalid';
        r.selected = false;
        r.observations.push(
          'Correo electrónico ya registrado en la base de datos',
        );
      } catch {
        // 404 expected
      }
    });

    await Promise.all(dbCheckPromises);

    // Update states
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

      const required = ['curp', 'firstName', 'firstLastName', 'phone', 'email'];
      const isValidFormat = validateCSVHeaders(headers, required, HEADER_MAP);
      if (!isValidFormat) {
        errorMsg.value = m.errorCSVFormat;
        validating.value = false;
        return;
      }

      const parsedRows: ImportRow[] = rawRows.map((rawRow, idx) => {
        const std = standardizeRow(rawRow, HEADER_MAP);

        const curpVal = (std.curp || '').trim().toUpperCase();
        const firstNameVal = (std.firstName || '').trim();
        const firstLastNameVal = (std.firstLastName || '').trim();
        const secondLastNameVal = (std.secondLastName || '').trim();
        const phoneVal = (std.phone || '').trim();
        const emailVal = (std.email || '').trim();
        const homoVal = (std.homoclave || '').trim();
        const munVal = std.municipalityId
          ? Number(std.municipalityId)
          : undefined;

        const obs: string[] = [];
        let status: 'valid' | 'warning' | 'invalid' = 'valid';

        if (!firstNameVal) {
          obs.push('Nombre es obligatorio');
          status = 'invalid';
        }
        if (!firstLastNameVal) {
          obs.push('Primer apellido es obligatorio');
          status = 'invalid';
        }
        if (!curpVal) {
          obs.push('CURP es obligatoria');
          status = 'invalid';
        } else if (curpVal.length !== 18 || !CURP_REGEX.test(curpVal)) {
          obs.push('CURP con formato inválido');
          status = 'invalid';
        }
        if (!phoneVal) {
          obs.push('Teléfono es obligatorio');
          status = 'invalid';
        } else if (!PHONE_REGEX.test(phoneVal)) {
          obs.push('Teléfono debe ser de 10 dígitos');
          status = 'invalid';
        }
        if (!emailVal) {
          obs.push('Correo electrónico es obligatorio');
          status = 'invalid';
        } else if (!EMAIL_REGEX.test(emailVal)) {
          obs.push('Correo electrónico inválido');
          status = 'invalid';
        }
        if (homoVal && homoVal.length !== 3) {
          obs.push('Homoclave debe ser de 3 caracteres');
          status = 'invalid';
        } else if (!homoVal) {
          if (status === 'valid') {
            status = 'warning';
            obs.push('Homoclave ausente (se generará RFC temporal)');
          }
        }

        let gender: 'H' | 'M' = 'H';
        let birthDate = '';
        let nationality = '';

        if (status !== 'invalid') {
          try {
            const ext = extractDataFromCURP(curpVal);
            gender = ext.gender;
            birthDate = ext.birthDate.toISOString().split('T')[0];
            nationality = ext.nationality;
          } catch {
            obs.push('CURP contiene fecha inválida');
            status = 'invalid';
          }
        }

        return {
          index: idx,
          firstName: firstNameVal,
          firstLastName: firstLastNameVal,
          secondLastName: secondLastNameVal || undefined,
          curp: curpVal,
          gender,
          phone: phoneVal,
          email: emailVal,
          municipalityId: munVal,
          birthDate: birthDate || undefined,
          homoclave: homoVal || undefined,
          nationality: nationality || undefined,
          selected: status !== 'invalid',
          importStatus: status,
          observations: obs,
        };
      });

      runDuplicateChecks(parsedRows);
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
      'Primer Apellido',
      'Segundo Apellido',
      'Nombre',
      'Correo',
      'Teléfono',
      'Municipio',
      'Homoclave',
    ];
    const exampleRow = [
      'AAAA000000HDFRRR00',
      'Pérez',
      'Gómez',
      'Juan',
      'juan.perez@example.com',
      '5512345678',
      '10',
      'AAA',
    ];

    const csvContent =
      '\uFEFF' + [headers.join(','), exampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_personas.csv');
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

    const personsDto: CreatePersonDto[] = selectedRows.map((r) => ({
      firstName: r.firstName,
      firstLastName: r.firstLastName,
      secondLastName: r.secondLastName,
      curp: r.curp,
      gender: r.gender,
      phone: r.phone,
      email: r.email,
      municipalityId: r.municipalityId,
      birthDate: r.birthDate,
      homoclave: r.homoclave,
      nationality: r.nationality,
    }));

    try {
      await personService.createMany({ persons: personsDto });
      registeredCount.value = selectedRows.length;
      step.value = 'success';
    } catch (err) {
      const normalized = normalizeError(
        err,
        messages.errors.createPersonFailed || 'Error al registrar registros.',
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
      width: '10%',
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
      width: '20%',
    },
    {
      key: 'fullName',
      label: m.columns.fullName,
      width: '25%',
    },
    {
      key: 'email',
      label: m.columns.email,
      width: '20%',
    },
    {
      key: 'phone',
      label: m.columns.phone,
      width: '15%',
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
        if (obs.includes('Homoclave ausente')) {
          return obs;
        }
        return `❌ Error: ${obs}`;
      })
      .join(', ');

    return {
      ...r,
      fullName:
        `${r.firstName} ${r.firstLastName} ${r.secondLastName || ''}`.trim(),
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
      fullWidth={step.value === 'review' && !validating.value}
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
      </Toolbar>

      <div class="import-container">
        <ModuleHeader
          tituloModulo={m.tituloModulo}
          accionActual={m.title}
          onBack$={async () => await nav(ROUTES.PERSONS)}
        />

        {/* loader */}
        {validating.value && (
          <Panel>
            <div class="import-success-panel">
              <div class="import-success-icon import-spin">
                <AppIcon intent="refresh" size="lg" />
              </div>
              <h2>Procesando y validando archivo...</h2>
              <p>
                Por favor espera un momento mientras validamos los formatos y
                duplicados.
              </p>
            </div>
          </Panel>
        )}

        {/* step 1: upload */}
        {!validating.value && step.value === 'upload' && (
          <div>
            {errorMsg.value && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <Panel density="compact">
                  <div class="import-alert-banner error" style={{ margin: 0 }}>
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
                <div class="import-upload-subtext">{m.uploadZoneSubtitle}</div>
              </div>

              <div class="import-upload-info">
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Guía de Campos del Archivo CSV:
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
                    <strong>Requeridos:</strong> CURP (18 caracteres), Nombre,
                    Primer Apellido, Teléfono (10 dígitos), Correo.
                  </li>
                  <li>
                    <strong>Opcionales:</strong> Segundo Apellido, Municipio
                    (ID), Homoclave.
                  </li>
                  <li
                    style={{
                      listStyleType: 'none',
                      marginTop: 'var(--space-2)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <em>
                      * Nota: El Género, Fecha de Nacimiento y Nacionalidad se
                      obtienen automáticamente a partir de la CURP.
                    </em>
                  </li>
                </ul>
              </div>
            </Panel>
          </div>
        )}

        {/* step 2: review */}
        {!validating.value && step.value === 'review' && (
          <div>
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
              description="Selecciona los registros válidos que deseas registrar en el padrón."
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
          <Panel>
            <div class="import-success-panel">
              <div class="import-success-icon">
                <AppIcon intent="success" size="lg" />
              </div>
              <h2>{m.successTitle}</h2>
              <p>
                Se han registrado exitosamente {registeredCount.value}{' '}
                {registeredCount.value === 1 ? 'persona' : 'personas'} en el
                padrón del sistema.
              </p>
              <div class="import-success-actions">
                <Button onClick$={async () => await nav(ROUTES.PERSONS)}>
                  {m.successFinish}
                </Button>
                <Button variant="ghost" onClick$={resetForm$}>
                  {m.successUploadAnother}
                </Button>
              </div>
            </div>
          </Panel>
        )}

        {/* step 4: error */}
        {!validating.value && step.value === 'error' && (
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
        )}
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

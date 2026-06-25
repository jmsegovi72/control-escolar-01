import { $, component$, useSignal } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
import { catalogService } from '~/services/catalog/catalog.service';
import { personService } from '~/services/person/person.service';
import { studentService } from '~/services/student/student.service';
import type { CreateStudentDto } from '~/types/student.types';
import { ActionHeader, Button, DataTable, Panel } from '~/ui';
import { AppIcon } from '~/ui/icons';
import { normalizeError } from '~/utils/api-error';
import {
  parseCSV,
  standardizeRow,
  validateCSVHeaders,
} from '~/utils/csv.utils';
import '../../persons/bulk-load/bulk-load.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const m = messages.students.bulkLoad;

const HEADER_MAP = {
  personId: [
    'personid',
    'person_id',
    'id persona',
    'id_persona',
    'persona_id',
    'persona',
  ],
  generationId: [
    'generationid',
    'generation_id',
    'generacion',
    'id generacion',
    'id_generacion',
    'generacion_id',
  ],
  educationalProgramId: [
    'educationalprogramid',
    'educational_program_id',
    'programa educativo',
    'programa_educativo',
    'programa',
    'id programa',
    'id_programa',
    'educationalprogram',
    'educational_program',
  ],
  statusId: [
    'statusid',
    'status_id',
    'estatus',
    'id estatus',
    'id_estatus',
    'estatus_id',
    'status',
  ],
  codeNumber: [
    'matricula',
    'codenumber',
    'code_number',
    'codigo',
    'control',
    'numero control',
    'numero_control',
  ],
  email: [
    'email institucional',
    'email_institucional',
    'correo institucional',
    'correo_institucional',
    'email',
    'correo',
    'mail',
  ],
};

interface ImportRow {
  index: number;
  personIdRaw: string;
  generationIdRaw: string;
  educationalProgramIdRaw: string;
  statusIdRaw: string;
  codeNumberRaw: string;
  emailRaw: string;

  // Campos convertidos y validados
  personId?: number;
  personName?: string;
  personCurp?: string;
  generationId?: number;
  generationName?: string;
  educationalProgramId?: number;
  programName?: string;
  statusId?: number;
  statusName?: string;
  codeNumber?: string;
  email?: string;

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
    // 1. Duplicados locales de personId en el CSV
    const personIdsInCSV = new Map<number, number[]>();
    parsedRows.forEach((r) => {
      if (r.importStatus !== 'invalid' && r.personId) {
        const key = r.personId;
        if (!personIdsInCSV.has(key)) personIdsInCSV.set(key, []);
        personIdsInCSV.get(key)!.push(r.index);
      }
    });

    personIdsInCSV.forEach((indices) => {
      if (indices.length > 1) {
        indices.forEach((idx) => {
          parsedRows[idx].importStatus = 'invalid';
          parsedRows[idx].selected = false;
          const otherIdx = indices.find((i) => i !== idx)!;
          parsedRows[idx].observations.push(
            `personId duplicado en fila ${otherIdx + 1}`,
          );
        });
      }
    });

    // Cargar catálogos
    let catalogPrograms: any[] = [];
    let catalogGenerations: any[] = [];
    let catalogStatuses: any[] = [];

    try {
      const [prog, gen, stat] = await Promise.all([
        catalogService.getEducationalPrograms(),
        catalogService.getStudentGenerations(),
        catalogService.getStudentStatuses(),
      ]);
      catalogPrograms = prog;
      catalogGenerations = gen;
      catalogStatuses = stat;
    } catch {
      // Ignorar errores de carga
    }

    // 2. Validar IDs contra catálogos
    parsedRows.forEach((r) => {
      if (r.importStatus === 'invalid') return;

      // Generación
      const genMatched = catalogGenerations.find(
        (g) => g.id === r.generationId,
      );
      if (!genMatched) {
        r.importStatus = 'invalid';
        r.selected = false;
        r.observations.push(
          `El ID de generación "${r.generationIdRaw}" no pertenece al catálogo.`,
        );
      } else {
        r.generationName = genMatched.generation;
      }

      // Programa Educativo
      const progMatched = catalogPrograms.find(
        (p) => p.id === r.educationalProgramId,
      );
      if (!progMatched) {
        r.importStatus = 'invalid';
        r.selected = false;
        r.observations.push(
          `El ID de programa "${r.educationalProgramIdRaw}" no pertenece al catálogo.`,
        );
      } else {
        r.programName = progMatched.name;
      }

      // Estatus (default 6 si no viene)
      const statusIdToUse = r.statusId ?? 6;
      const statMatched = catalogStatuses.find((s) => s.id === statusIdToUse);
      if (!statMatched) {
        r.importStatus = 'invalid';
        r.selected = false;
        r.observations.push(
          `El ID de estatus "${r.statusIdRaw}" no pertenece al catálogo.`,
        );
      } else {
        r.statusId = statusIdToUse;
        r.statusName = statMatched.status;
      }
    });

    // 3. Validar existencia de personas en base de datos
    const rowsToCheck = parsedRows.filter((r) => r.importStatus !== 'invalid');

    await Promise.all(
      rowsToCheck.map(async (r) => {
        try {
          // Verificar si la persona existe
          const person = await personService.findOne(r.personId!);
          r.personName = person.fullName;
          r.personCurp = person.curp;
        } catch {
          r.importStatus = 'invalid';
          r.selected = false;
          r.observations.push(
            `La persona con ID ${r.personId} no está registrada en el padrón.`,
          );
        }
      }),
    );

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

      const required = ['personId', 'generationId', 'educationalProgramId'];
      const isValidFormat = validateCSVHeaders(headers, required, HEADER_MAP);
      if (!isValidFormat) {
        errorMsg.value = m.errorCSVFormat;
        validating.value = false;
        return;
      }

      const parsedRows: ImportRow[] = rawRows.map((rawRow, idx) => {
        const std = standardizeRow(rawRow, HEADER_MAP);

        const personIdVal = (std.personId || '').trim();
        const generationIdVal = (std.generationId || '').trim();
        const educationalProgramIdVal = (std.educationalProgramId || '').trim();
        const statusIdVal = (std.statusId || '').trim();
        const codeNumberVal = (std.codeNumber || '').trim();
        const emailVal = (std.email || '').trim();

        const obs: string[] = [];
        let status: 'valid' | 'warning' | 'invalid' = 'valid';

        // 1. Validación de personId
        let personIdNum: number | undefined;
        if (!personIdVal) {
          obs.push('ID de persona inválido');
          status = 'invalid';
        } else {
          personIdNum = Number(personIdVal);
          if (
            Number.isNaN(personIdNum) ||
            personIdNum <= 0 ||
            !Number.isInteger(personIdNum)
          ) {
            obs.push('ID de persona inválido');
            status = 'invalid';
          }
        }

        // 2. Validación de generationId
        let generationIdNum: number | undefined;
        if (!generationIdVal) {
          obs.push('ID de generación inválido');
          status = 'invalid';
        } else {
          generationIdNum = Number(generationIdVal);
          if (
            Number.isNaN(generationIdNum) ||
            generationIdNum <= 0 ||
            !Number.isInteger(generationIdNum)
          ) {
            obs.push('ID de generación inválido');
            status = 'invalid';
          }
        }

        // 3. Validación de educationalProgramId
        let educationalProgramIdNum: number | undefined;
        if (!educationalProgramIdVal) {
          obs.push('ID de programa inválido');
          status = 'invalid';
        } else {
          educationalProgramIdNum = Number(educationalProgramIdVal);
          if (
            Number.isNaN(educationalProgramIdNum) ||
            educationalProgramIdNum <= 0 ||
            !Number.isInteger(educationalProgramIdNum)
          ) {
            obs.push('ID de programa inválido');
            status = 'invalid';
          }
        }

        // 4. Validación opcional de statusId
        let statusIdNum: number | undefined;
        if (statusIdVal) {
          statusIdNum = Number(statusIdVal);
          if (
            Number.isNaN(statusIdNum) ||
            statusIdNum <= 0 ||
            !Number.isInteger(statusIdNum)
          ) {
            obs.push('ID de estatus inválido');
            status = 'invalid';
          }
        }

        // 5. Validación opcional de email
        if (emailVal && !EMAIL_REGEX.test(emailVal)) {
          obs.push('Email inválido');
          status = 'invalid';
        }

        return {
          index: idx,
          personIdRaw: personIdVal,
          generationIdRaw: generationIdVal,
          educationalProgramIdRaw: educationalProgramIdVal,
          statusIdRaw: statusIdVal,
          codeNumberRaw: codeNumberVal,
          emailRaw: emailVal,

          personId: personIdNum,
          generationId: generationIdNum,
          educationalProgramId: educationalProgramIdNum,
          statusId: statusIdNum,
          codeNumber: codeNumberVal || undefined,
          email: emailVal || undefined,

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
      'personId',
      'generationId',
      'educationalProgramId',
      'statusId',
      'Matrícula',
      'Email institucional',
    ];
    const exampleRow = ['42', '1', '5', '6', 'SC2024001', 'juan@alumno.edu.mx'];

    const csvContent =
      '\uFEFF' + [headers.join(','), exampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_estudiantes.csv');
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

    const studentsDto: CreateStudentDto[] = selectedRows.map((r) => ({
      personId: r.personId!,
      generationId: r.generationId!,
      educationalProgramId: r.educationalProgramId!,
      statusId: r.statusId,
      codeNumber: r.codeNumber,
      email: r.email,
    }));

    try {
      // Intentar importación por lote
      await studentService.createMany({ students: studentsDto });
      registeredCount.value = selectedRows.length;
      step.value = 'success';
    } catch (err) {
      const errorResponse = (err as any)?.response;
      // Fallback a importación secuencial si el lote da 404 (no soportado) o error equivalente
      if (errorResponse?.status === 404) {
        try {
          let count = 0;
          for (const dto of studentsDto) {
            await studentService.create(dto);
            count++;
          }
          registeredCount.value = count;
          step.value = 'success';
          return;
        } catch (fallbackErr) {
          const normalized = normalizeError(
            fallbackErr,
            'Error al registrar estudiantes de forma individual.',
          );
          errorMsg.value = normalized.message;
          step.value = 'error';
          return;
        }
      }

      const normalized = normalizeError(
        err,
        messages.errors.createStudentFailed || 'Error al registrar registros.',
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
      key: 'personId',
      label: m.columns.personId,
      width: '9%',
    },
    {
      key: 'personName',
      label: m.columns.fullName,
      width: '17%',
    },
    {
      key: 'generationName',
      label: m.columns.generation,
      width: '10%',
    },
    {
      key: 'programName',
      label: m.columns.program,
      width: '18%',
    },
    {
      key: 'statusName',
      label: m.columns.status,
      width: '10%',
    },
    {
      key: 'codeNumber',
      label: m.columns.codeNumber,
      width: '10%',
    },
    {
      key: 'email',
      label: m.columns.email,
      width: '10%',
    },
    {
      key: 'observations',
      label: m.columns.observations,
      width: '7%',
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

    return {
      ...r,
      personName: r.personName || 'No identificado',
      generationName: r.generationName || `ID: ${r.generationIdRaw}`,
      programName: r.programName || `ID: ${r.educationalProgramIdRaw}`,
      statusName:
        r.statusName ||
        (r.statusIdRaw ? `ID: ${r.statusIdRaw}` : 'Nuevo Ingreso'),
      codeNumber: r.codeNumber || '—',
      email: r.email || '—',
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
        onBack$={async () => await nav(ROUTES.STUDENTS)}
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
                    Guía de Campos del Archivo CSV de Estudiantes:
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
                      <strong>Requeridos:</strong> ID Persona (Debe existir
                      previamente), ID Generación (Número entero), ID Programa
                      Educativo (Número entero).
                    </li>
                    <li>
                      <strong>Opcionales:</strong> ID Estatus (Default: 6 -
                      Nuevo Ingreso), Matrícula, Email institucional.
                    </li>
                    <li
                      style={{
                        listStyleType: 'none',
                        marginTop: 'var(--space-2)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <em>
                        * Nota: Cada persona debe ser única en el archivo y no
                        puede tener ya un estudiante activo asignado para evitar
                        conflictos de unicidad.
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
                description="Selecciona los estudiantes válidos que deseas registrar en el sistema."
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
                    {registeredCount.value === 1 ? 'estudiante' : 'estudiantes'}{' '}
                    en el sistema.
                  </p>
                  <div class="import-success-actions">
                    <Button onClick$={async () => await nav(ROUTES.STUDENTS)}>
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

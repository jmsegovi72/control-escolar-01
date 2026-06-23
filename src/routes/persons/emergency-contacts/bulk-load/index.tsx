import { $, component$, useSignal } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
import { catalogService } from '~/services/catalog/catalog.service';
import { emergencyContactService } from '~/services/emergency-contact/emergency-contact.service';
import { personService } from '~/services/person/person.service';
import type { CreateEmergencyContactDto } from '~/types/emergency-contact.types';
import { ActionHeader, Button, DataTable, Panel } from '~/ui';
import { AppIcon } from '~/ui/icons';
import { normalizeError } from '~/utils/api-error';
import {
  parseCSV,
  standardizeRow,
  validateCSVHeaders,
} from '~/utils/csv.utils';
import '../../bulk-load/bulk-load.css';

const PHONE_REGEX = /^\d{10}$/;
const MAX_NAME_LENGTH = 97;

const m = messages.emergencyContacts.bulkLoad;

const HEADER_MAP = {
  personId: [
    'personid',
    'person_id',
    'id persona',
    'id_persona',
    'persona_id',
    'persona',
  ],
  fullName: [
    'nombre completo',
    'nombre_completo',
    'nombre',
    'fullname',
    'full_name',
    'contactname',
    'contact_name',
  ],
  phone: [
    'telefono',
    'tel',
    'celular',
    'phone',
    'contactphone',
    'contact_phone',
  ],
  relationshipId: [
    'id parentesco',
    'id_parentesco',
    'parentesco_id',
    'parentescoid',
    'relationshipid',
    'relationship_id',
    'id relacion',
    'id_relacion',
  ],
};

interface ImportRow {
  index: number;
  personIdRaw: string;
  fullName: string;
  phone: string;
  relationshipIdRaw: string;

  // Campos convertidos y validados
  personId?: number;
  personName?: string;
  personCurp?: string;
  phoneDigits?: string;
  relationshipId?: number;
  relationshipName?: string;

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

    // Cargar catálogo de parentescos
    let catalogRelationships: any[] = [];
    try {
      catalogRelationships = await catalogService.getContactRelationships();
    } catch {
      catalogRelationships = [];
    }

    // 2. Validar relationshipId contra el catálogo
    parsedRows.forEach((r) => {
      if (r.importStatus === 'invalid') return;
      const matched = catalogRelationships.find(
        (c) => c.id === r.relationshipId,
      );
      if (!matched) {
        r.importStatus = 'invalid';
        r.selected = false;
        r.observations.push(
          `El ID de parentesco "${r.relationshipIdRaw}" no pertenece al catálogo.`,
        );
      } else {
        r.relationshipName = matched.name;
      }
    });

    // 3. Validar existencia de personas y no duplicidad de contacto en base de datos
    const rowsToCheck = parsedRows.filter((r) => r.importStatus !== 'invalid');

    await Promise.all(
      rowsToCheck.map(async (r) => {
        try {
          // Verificar si la persona existe
          const person = await personService.findOne(r.personId!);
          r.personName = person.fullName;
          r.personCurp = person.curp;

          // Verificar si ya tiene contacto de emergencia
          const contact = await emergencyContactService.findOne(
            r.personCurp || r.personId!,
          );
          if (contact) {
            r.importStatus = 'invalid';
            r.selected = false;
            r.observations.push(
              'La persona ya cuenta con un contacto de emergencia registrado.',
            );
          }
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

      const required = ['personId', 'fullName', 'phone', 'relationshipId'];
      const isValidFormat = validateCSVHeaders(headers, required, HEADER_MAP);
      if (!isValidFormat) {
        errorMsg.value = m.errorCSVFormat;
        validating.value = false;
        return;
      }

      const parsedRows: ImportRow[] = rawRows.map((rawRow, idx) => {
        const std = standardizeRow(rawRow, HEADER_MAP);

        const personIdVal = (std.personId || '').trim();
        const fullNameVal = (std.fullName || '').trim();
        const phoneVal = (std.phone || '').trim();
        const relationshipIdVal = (std.relationshipId || '').trim();

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

        // 2. Validación de fullName
        if (!fullNameVal) {
          obs.push('Nombre requerido');
          status = 'invalid';
        } else if (fullNameVal.length > MAX_NAME_LENGTH) {
          obs.push(
            `El nombre no puede superar los ${MAX_NAME_LENGTH} caracteres`,
          );
          status = 'invalid';
        }

        // 3. Validación de phone
        const phoneDigits = phoneVal.replace(/\D/g, '');
        if (!phoneVal) {
          obs.push('Teléfono debe tener 10 dígitos');
          status = 'invalid';
        } else if (!PHONE_REGEX.test(phoneDigits)) {
          obs.push('Teléfono debe tener 10 dígitos');
          status = 'invalid';
        }

        // 4. Validación de relationshipId
        let relationshipIdNum: number | undefined;
        if (!relationshipIdVal) {
          obs.push('ID de parentesco inválido');
          status = 'invalid';
        } else {
          relationshipIdNum = Number(relationshipIdVal);
          if (
            Number.isNaN(relationshipIdNum) ||
            relationshipIdNum <= 0 ||
            !Number.isInteger(relationshipIdNum)
          ) {
            obs.push('ID de parentesco inválido');
            status = 'invalid';
          }
        }

        return {
          index: idx,
          personIdRaw: personIdVal,
          fullName: fullNameVal,
          phone: phoneVal,
          relationshipIdRaw: relationshipIdVal,

          personId: personIdNum,
          phoneDigits,
          relationshipId: relationshipIdNum,

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
      'Nombre completo',
      'Teléfono',
      'ID Parentesco',
    ];
    const exampleRow = ['42', 'María López García', '9991234567', '1'];

    const csvContent =
      '\uFEFF' + [headers.join(','), exampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_contactos_emergencia.csv');
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

    const contactsDto: CreateEmergencyContactDto[] = selectedRows.map((r) => ({
      personId: r.personId!,
      fullName: r.fullName,
      phone: r.phoneDigits!,
      relationshipId: r.relationshipId!,
    }));

    try {
      // Intentar importación por lote
      await emergencyContactService.createMany({
        emergencyContacts: contactsDto,
      });
      registeredCount.value = selectedRows.length;
      step.value = 'success';
    } catch (err) {
      const errorResponse = (err as any)?.response;
      // Fallback a importación secuencial si el lote da 404 (no soportado) o error equivalente
      if (errorResponse?.status === 404) {
        try {
          let count = 0;
          for (const dto of contactsDto) {
            await emergencyContactService.create(dto);
            count++;
          }
          registeredCount.value = count;
          step.value = 'success';
          return;
        } catch (fallbackErr) {
          const normalized = normalizeError(
            fallbackErr,
            'Error al registrar contactos de emergencia de forma individual.',
          );
          errorMsg.value = normalized.message;
          step.value = 'error';
          return;
        }
      }

      const normalized = normalizeError(
        err,
        messages.errors.createEmergencyContactFailed ||
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
      key: 'personId',
      label: m.columns.personId,
      width: '12%',
    },
    {
      key: 'personName',
      label: 'Titular',
      width: '20%',
    },
    {
      key: 'fullName',
      label: m.columns.fullName,
      width: '20%',
    },
    {
      key: 'phone',
      label: m.columns.phone,
      width: '14%',
    },
    {
      key: 'relationship',
      label: m.columns.relationship,
      width: '12%',
    },
    {
      key: 'observations',
      label: m.columns.observations,
      width: '13%',
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
      relationship: r.relationshipName || `ID: ${r.relationshipIdRaw}`,
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
        onBack$={async () => await nav(ROUTES.EMERGENCY_CONTACTS)}
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
                    Guía de Campos del Archivo CSV de Contactos de Emergencia:
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
                      previamente), Nombre completo (Máx 97 caracteres),
                      Teléfono (10 dígitos), ID Parentesco (Número entero).
                    </li>
                    <li
                      style={{
                        listStyleType: 'none',
                        marginTop: 'var(--space-2)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <em>
                        * Nota: Cada persona solo puede tener un contacto de
                        emergencia registrado. Si intentas cargar duplicados
                        locales de persona o personas que ya tienen contacto
                        asignado, se marcarán como error.
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
                description="Selecciona los contactos de emergencia válidos que deseas registrar en el sistema."
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
                      ? 'contacto de emergencia'
                      : 'contactos de emergencia'}{' '}
                    en el sistema.
                  </p>
                  <div class="import-success-actions">
                    <Button
                      onClick$={async () =>
                        await nav(ROUTES.EMERGENCY_CONTACTS)
                      }
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

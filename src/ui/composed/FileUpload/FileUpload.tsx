import { component$ } from '@builder.io/qwik';

import { AppIcon } from '~/ui/icons';
import { Button } from '~/ui/primitives/Button/Button';
import type { FileUploadProps } from './file-upload.types';
import './file-upload.css';

export const FileUpload = component$<FileUploadProps>(
  ({
    label,
    description,
    mode = 'document',
    accept,
    multiple,
    disabled,
    invalid,
    error,
    helpText,
    maxSizeLabel,
    templateLabel,
    files = [],
    onBrowse$,
    onTemplate$,
    onRemove$,
  }) => {
    const hasFiles = files.length > 0;
    const icon = mode === 'bulk' ? 'upload' : 'download';

    return (
      <section
        class="ui-file-upload"
        data-mode={mode}
        data-invalid={invalid || error ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
      >
        <div class="ui-file-upload__dropzone">
          <span class="ui-file-upload__icon" aria-hidden="true">
            <AppIcon intent={icon} size="lg" />
          </span>

          <div class="ui-file-upload__copy">
            <h2>{label}</h2>
            {description && <p>{description}</p>}
            <span>
              {accept ? `Formatos: ${accept}` : 'Selecciona un archivo valido'}
              {maxSizeLabel ? ` · ${maxSizeLabel}` : ''}
              {multiple ? ' · permite multiples archivos' : ''}
            </span>
          </div>

          <div class="ui-file-upload__actions">
            {templateLabel && (
              <Button
                size="sm"
                variant="secondary"
                iconLeft="download"
                disabled={disabled}
                onClick$={() => onTemplate$?.()}
              >
                {templateLabel}
              </Button>
            )}
            <Button
              size="sm"
              iconLeft="upload"
              disabled={disabled}
              onClick$={() => onBrowse$?.()}
            >
              {mode === 'bulk' ? 'Seleccionar archivo' : 'Cargar documento'}
            </Button>
          </div>
        </div>

        {(helpText || error) && (
          <div class="ui-file-upload__message">
            <AppIcon intent={error ? 'warning' : 'info'} size="sm" />
            <span>{error ?? helpText}</span>
          </div>
        )}

        {hasFiles && (
          <div class="ui-file-upload__files">
            {files.map((file) => (
              <div
                key={file.id}
                class="ui-file-upload__file"
                data-status={file.status}
              >
                <span class="ui-file-upload__file-icon" aria-hidden="true">
                  <AppIcon
                    intent={file.status === 'error' ? 'warning' : 'check'}
                    size="sm"
                  />
                </span>
                <span class="ui-file-upload__file-copy">
                  <strong>{file.name}</strong>
                  {(file.sizeLabel || file.message) && (
                    <small>{file.message ?? file.sizeLabel}</small>
                  )}
                </span>
                <button
                  type="button"
                  class="ui-file-upload__remove"
                  aria-label={`Quitar ${file.name}`}
                  disabled={disabled}
                  onClick$={() => onRemove$?.(file)}
                >
                  <AppIcon intent="close" size="xs" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  },
);

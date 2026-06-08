import { component$ } from '@builder.io/qwik';

import type { TextareaProps } from './textarea.types';
import './textarea.css';

export const Textarea = component$<TextareaProps>(
  ({
    variant = 'box',
    size = 'md',
    invalid,
    fullWidth = true,
    resize = 'vertical',
    disabled,
    readOnly,
    rows = 4,
    ...props
  }) => {
    return (
      <span
        class="ui-textarea-shell"
        data-variant={variant}
        data-size={size}
        data-invalid={invalid ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
        data-readonly={readOnly ? 'true' : undefined}
        data-full-width={fullWidth ? 'true' : undefined}
        data-resize={resize}
      >
        <textarea
          {...props}
          class="ui-textarea"
          disabled={disabled}
          readOnly={readOnly}
          rows={rows}
          aria-invalid={invalid ? 'true' : undefined}
        />
      </span>
    );
  },
);

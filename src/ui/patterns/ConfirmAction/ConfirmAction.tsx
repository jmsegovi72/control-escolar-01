import { component$ } from '@builder.io/qwik';

import { Dialog } from '~/ui/composed/Dialog/Dialog';
import { Button } from '~/ui/primitives/Button/Button';
import type { ButtonVariant } from '~/ui/primitives/Button/button.types';
import type { ConfirmActionProps } from './confirm-action.types';

const confirmVariant = {
  neutral: 'primary',
  danger: 'danger',
  warning: 'warning',
  success: 'success',
} satisfies Record<string, ButtonVariant>;

export const ConfirmAction = component$<ConfirmActionProps>(
  ({
    open,
    title,
    description,
    details,
    tone = 'neutral',
    size = 'sm',
    icon,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    loading,
    onConfirm$,
    onCancel$,
  }) => {
    return (
      <Dialog
        open={open}
        title={title}
        description={description}
        tone={tone}
        size={size}
        icon={icon}
        onClose$={onCancel$}
      >
        {details && <p class="page-copy">{details}</p>}

        <Button
          q:slot="footer"
          variant="secondary"
          disabled={loading}
          onClick$={() => onCancel$?.()}
        >
          {cancelLabel}
        </Button>
        <Button
          q:slot="footer"
          variant={confirmVariant[tone]}
          loading={loading}
          iconLeft={tone === 'danger' ? 'delete' : 'check'}
          onClick$={() => onConfirm$?.()}
        >
          {confirmLabel}
        </Button>
      </Dialog>
    );
  },
);

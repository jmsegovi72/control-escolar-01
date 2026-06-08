import type { QRL } from '@builder.io/qwik';

import type { DialogSize, DialogTone } from '~/ui/composed/Dialog/dialog.types';
import type { IconIntent } from '~/ui/icons';

export type ConfirmActionProps = {
  open?: boolean;
  title: string;
  description?: string;
  details?: string;
  tone?: DialogTone;
  size?: DialogSize;
  icon?: IconIntent;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm$?: QRL<() => void>;
  onCancel$?: QRL<() => void>;
};

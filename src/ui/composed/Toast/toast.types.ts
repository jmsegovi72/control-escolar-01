import type { QRL } from '@builder.io/qwik';

import type { IconIntent } from '~/ui/icons';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export type ToastPlacement = 'inline' | 'floating';

export type ToastProps = {
  title: string;
  description?: string;
  tone?: ToastTone;
  icon?: IconIntent;
  actionLabel?: string;
  dismissible?: boolean;
  progress?: number;
  placement?: ToastPlacement;
  onAction$?: QRL<() => void>;
  onDismiss$?: QRL<() => void>;
};

import type { QRL } from '@builder.io/qwik';

import type { IconIntent } from '~/ui/icons';

export type EmptyStateTone = 'neutral' | 'info' | 'warning' | 'danger';

export type EmptyStateSize = 'sm' | 'md' | 'lg';

export type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: IconIntent;
  tone?: EmptyStateTone;
  size?: EmptyStateSize;
  actionLabel?: string;
  secondaryActionLabel?: string;
  onAction$?: QRL<() => void>;
  onSecondaryAction$?: QRL<() => void>;
};

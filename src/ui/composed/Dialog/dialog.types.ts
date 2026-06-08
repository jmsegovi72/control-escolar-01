import type { QRL } from '@builder.io/qwik';

import type { IconIntent } from '~/ui/icons';

export type DialogTone = 'neutral' | 'danger' | 'warning' | 'success';

export type DialogSize = 'sm' | 'md' | 'lg';

export type DialogProps = {
  open?: boolean;
  title: string;
  description?: string;
  tone?: DialogTone;
  size?: DialogSize;
  icon?: IconIntent;
  closeLabel?: string;
  onClose$?: QRL<() => void>;
};

import type { QRL } from '@builder.io/qwik';

import type { IconIntent } from '~/ui/icons';

export type DetailDrawerPlacement = 'right' | 'left';

export type DetailDrawerPresentation = 'overlay' | 'inline';

export type DetailDrawerSize = 'sm' | 'md' | 'lg';

export type DetailDrawerTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

export type DetailDrawerProps = {
  open?: boolean;
  title: string;
  description?: string;
  meta?: string;
  icon?: IconIntent;
  tone?: DetailDrawerTone;
  size?: DetailDrawerSize;
  placement?: DetailDrawerPlacement;
  presentation?: DetailDrawerPresentation;
  closeLabel?: string;
  onClose$?: QRL<() => void>;
};

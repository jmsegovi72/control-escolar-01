import type { QwikIntrinsicElements } from '@builder.io/qwik';

import type { IconIntent } from '~/ui/icons';

export type InputVariant = 'line' | 'box' | 'quiet';

export type InputSize = 'sm' | 'md' | 'lg';

export type InputProps = Omit<QwikIntrinsicElements['input'], 'size'> & {
  variant?: InputVariant;
  size?: InputSize;
  invalid?: boolean;
  fullWidth?: boolean;
  iconLeft?: IconIntent;
  iconRight?: IconIntent;
};

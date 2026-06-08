import type { QwikIntrinsicElements } from '@builder.io/qwik';

import type { IconIntent } from '~/ui/icons';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'ghost'
  | 'link';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ButtonProps = QwikIntrinsicElements['button'] & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  active?: boolean;
  iconLeft?: IconIntent;
  iconRight?: IconIntent;
};

import type { JSXChildren } from '@builder.io/qwik';

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type BadgeSize = 'sm' | 'md';

export type BadgeProps = {
  tone?: BadgeTone;
  size?: BadgeSize;
  children?: JSXChildren;
};

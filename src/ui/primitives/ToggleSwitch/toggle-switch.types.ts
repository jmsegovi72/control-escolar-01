import type { JSXChildren, QwikIntrinsicElements } from '@builder.io/qwik';

export type ToggleSwitchSize = 'sm' | 'md' | 'lg';

export type ToggleSwitchProps = Omit<
  QwikIntrinsicElements['input'],
  'children' | 'size' | 'type'
> & {
  children?: JSXChildren;
  description?: string;
  invalid?: boolean;
  showState?: boolean;
  offLabel?: string;
  onLabel?: string;
  size?: ToggleSwitchSize;
};

import type { JSXChildren, QwikIntrinsicElements } from '@builder.io/qwik';

export type CheckboxSize = 'sm' | 'md' | 'lg';

export type CheckboxProps = Omit<
  QwikIntrinsicElements['input'],
  'children' | 'size' | 'type'
> & {
  children?: JSXChildren;
  invalid?: boolean;
  size?: CheckboxSize;
};

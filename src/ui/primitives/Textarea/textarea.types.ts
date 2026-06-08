import type { QwikIntrinsicElements } from '@builder.io/qwik';

import type { InputSize, InputVariant } from '../Input/input.types';

export type TextareaResize = 'none' | 'vertical';

export type TextareaProps = Omit<QwikIntrinsicElements['textarea'], 'size'> & {
  variant?: InputVariant;
  size?: InputSize;
  invalid?: boolean;
  fullWidth?: boolean;
  resize?: TextareaResize;
};

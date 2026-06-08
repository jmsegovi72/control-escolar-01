import type { JSXChildren } from '@builder.io/qwik';

export type FieldVariant = 'default' | 'compact';

export type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  htmlFor?: string;
  variant?: FieldVariant;
  children?: JSXChildren;
};

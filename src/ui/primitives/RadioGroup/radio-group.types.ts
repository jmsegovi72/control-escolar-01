import type { QRL } from '@builder.io/qwik';

export type RadioGroupSize = 'sm' | 'md' | 'lg';

export type RadioGroupDirection = 'row' | 'column';

export type RadioOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type RadioGroupProps = {
  options: RadioOption[];
  value?: string;
  name: string;
  size?: RadioGroupSize;
  direction?: RadioGroupDirection;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  onChange$?: QRL<(value: string) => void>;
};

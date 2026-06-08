import type { QRL } from '@builder.io/qwik';

export type ChoiceGroupSize = 'sm' | 'md' | 'lg';

export type ChoiceGroupDirection = 'row' | 'column';

export type ChoiceOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type ChoiceGroupProps = {
  options: ChoiceOption[];
  value?: string;
  name: string;
  size?: ChoiceGroupSize;
  direction?: ChoiceGroupDirection;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  onChange$?: QRL<(value: string) => void>;
};

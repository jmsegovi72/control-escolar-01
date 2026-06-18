import type { QRL } from '@builder.io/qwik';

import type { IconIntent } from '~/ui/icons';
import type { InputSize, InputVariant } from '../Input/input.types';

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = {
  options: SelectOption[];
  value?: string;
  name?: string;
  placeholder?: string;
  variant?: InputVariant;
  size?: InputSize;
  invalid?: boolean;
  fullWidth?: boolean;
  iconLeft?: IconIntent;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  onChange$?: QRL<(value: string) => void>;
};

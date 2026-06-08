import type {
  InputSize,
  InputVariant,
} from '~/ui/primitives/Input/input.types';

export type DateRangeInputProps = {
  startValue?: string;
  endValue?: string;
  startLabel?: string;
  endLabel?: string;
  startName?: string;
  endName?: string;
  min?: string;
  max?: string;
  variant?: InputVariant;
  size?: InputSize;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  hint?: string;
  error?: string;
};

import type { InputProps } from '~/ui/primitives/Input/input.types';

export type DateInputProps = Omit<InputProps, 'type' | 'iconLeft'> & {
  showIcon?: boolean;
};

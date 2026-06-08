import type { IconIntent } from '~/ui/icons';
import type { ButtonProps } from '../Button/button.types';

export type IconButtonProps = Omit<
  ButtonProps,
  'children' | 'iconLeft' | 'iconRight' | 'fullWidth'
> & {
  icon: IconIntent;
  label: string;
};

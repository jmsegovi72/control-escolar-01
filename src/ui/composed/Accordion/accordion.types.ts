import type { IconIntent } from '~/ui/icons';

export type AccordionVariant = 'default' | 'subtle' | 'outlined';

export type AccordionSize = 'sm' | 'md' | 'lg';

export type AccordionTone = 'neutral' | 'primary' | 'warning' | 'danger';

export type AccordionProps = {
  title: string;
  description?: string;
  open?: boolean;
  disabled?: boolean;
  icon?: IconIntent;
  variant?: AccordionVariant;
  size?: AccordionSize;
  tone?: AccordionTone;
};

import type { JSXChildren } from '@builder.io/qwik';
import type { IconIntent } from '~/ui/icons';

export type PanelVariant = 'default' | 'subtle' | 'outlined';

export type PanelDensity = 'comfortable' | 'compact';

export type PanelProps = {
  title?: string;
  eyebrow?: string;
  description?: string;
  icon?: IconIntent;
  variant?: PanelVariant;
  density?: PanelDensity;
  children?: JSXChildren;
};

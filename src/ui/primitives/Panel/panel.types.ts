import type { JSXChildren } from '@builder.io/qwik';

export type PanelVariant = 'default' | 'subtle' | 'outlined';

export type PanelDensity = 'comfortable' | 'compact';

export type PanelProps = {
  title?: string;
  eyebrow?: string;
  description?: string;
  variant?: PanelVariant;
  density?: PanelDensity;
  children?: JSXChildren;
};

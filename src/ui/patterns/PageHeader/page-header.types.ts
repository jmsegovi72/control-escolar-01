import type { JSXChildren } from '@builder.io/qwik';

export type PageHeaderDensity = 'comfortable' | 'compact';

export type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: string;
  density?: PageHeaderDensity;
  children?: JSXChildren;
};

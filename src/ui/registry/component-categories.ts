import type { ComponentCategory } from './component-registry.types';

export const componentCategories: Record<ComponentCategory, string> = {
  primitive: 'Primitives',
  composed: 'Composed',
  pattern: 'Patterns',
};

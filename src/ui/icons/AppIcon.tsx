import { component$ } from '@builder.io/qwik';
import type { IconContext, IconIntent, IconSize } from './icon-intents';
import { iconMap } from './icon-map';

type AppIconProps = {
  intent: IconIntent;
  context?: IconContext;
  size?: IconSize;
  color?: string;
  class?: string;
  title?: string;
};

const sizeMap = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export const AppIcon = component$<AppIconProps>(
  ({ intent, context = 'default', size = 'md', color, class: className }) => {
    const definition = iconMap[intent];
    const Icon = definition.contexts?.[context] ?? definition.default;
    const resolvedSize = typeof size === 'number' ? size : sizeMap[size];

    return <Icon class={className} color={color} size={resolvedSize} />;
  },
);

import type { IconIntent } from '~/ui/icons';

export type StatusTone = 'online' | 'warning' | 'offline' | 'neutral';

export type StatusIndicatorSize = 'sm' | 'md';

export type StatusIndicatorItem = {
  id: string;
  label: string;
  value?: string;
  description?: string;
  tone?: StatusTone;
  icon?: IconIntent;
};

export type StatusIndicatorProps = StatusIndicatorItem & {
  size?: StatusIndicatorSize;
  compact?: boolean;
};

export type SystemHealthProps = {
  items: StatusIndicatorItem[];
  title?: string;
  description?: string;
  size?: StatusIndicatorSize;
  compact?: boolean;
  orientation?: 'horizontal' | 'vertical';
};

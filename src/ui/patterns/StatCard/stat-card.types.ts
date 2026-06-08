import type { IconIntent } from '~/ui/icons';

export type StatCardTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type StatTrendDirection = 'up' | 'down' | 'flat';

export type StatTrend = {
  value: string;
  direction?: StatTrendDirection;
  label?: string;
};

export type StatCardProps = {
  label: string;
  value: string | number;
  description?: string;
  icon?: IconIntent;
  tone?: StatCardTone;
  trend?: StatTrend;
  loading?: boolean;
};

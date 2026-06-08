import type { IconIntent } from '~/ui/icons';

export type TabsVariant = 'line' | 'contained' | 'pills';

export type TabsSize = 'sm' | 'md' | 'lg';

export type TabsOrientation = 'horizontal' | 'vertical';

export type TabItem = {
  id: string;
  label: string;
  icon?: IconIntent;
  badge?: string | number;
  disabled?: boolean;
};

export type TabsProps = {
  items: TabItem[];
  activeTab: string;
  variant?: TabsVariant;
  size?: TabsSize;
  orientation?: TabsOrientation;
  fullWidth?: boolean;
};

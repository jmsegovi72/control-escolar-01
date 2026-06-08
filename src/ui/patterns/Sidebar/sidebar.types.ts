import type { QRL } from '@builder.io/qwik';

import type { UserMenuAction } from '~/ui/composed/UserMenu/user-menu.types';
import type { IconIntent } from '~/ui/icons';

export type SidebarBrand = {
  name: string;
  shortName?: string;
  subtitle?: string;
};

export type SidebarClock = {
  time: string;
  date?: string;
  label?: string;
};

export type SidebarStatusTone = 'online' | 'warning' | 'offline' | 'neutral';

export type SidebarStatusItem = {
  id: string;
  label: string;
  value?: string;
  tone: SidebarStatusTone;
};

export type SidebarSessionStatus = {
  label?: string;
  remaining: string;
  tone?: SidebarStatusTone;
};

export type SidebarSystemStatus = {
  items?: SidebarStatusItem[];
  session?: SidebarSessionStatus;
};

export type SidebarUser = {
  name: string;
  role?: string;
  initials?: string;
  avatarUrl?: string;
  status?: string;
  meta?: string;
};

export type SidebarItem = {
  id: string;
  label: string;
  icon: IconIntent;
  href?: string;
  badge?: string | number;
  active?: boolean;
  open?: boolean;
  disabled?: boolean;
  children?: SidebarItem[];
};

export type SidebarSection = {
  id: string;
  label?: string;
  items: SidebarItem[];
};

export type SidebarProps = {
  brand: SidebarBrand;
  sections: SidebarSection[];
  activeItem?: string;
  openItems?: string[];
  collapsed?: boolean;
  clock?: SidebarClock;
  systemStatus?: SidebarSystemStatus;
  user?: SidebarUser;
  userActions?: UserMenuAction[];
  userMenuSessionLabel?: string;
  footerItems?: SidebarItem[];
  onNavigate$?: QRL<(item: SidebarItem) => void>;
  onToggleItem$?: QRL<(item: SidebarItem, open: boolean) => void>;
  onToggleCollapse$?: QRL<() => void>;
};

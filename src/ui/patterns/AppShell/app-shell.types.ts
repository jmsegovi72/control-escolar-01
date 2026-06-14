import type { QRL } from '@builder.io/qwik';

export type AppShellDensity = 'comfortable' | 'compact';
export type AppShellHeaderVariant = 'stacked' | 'inline';

export type AppShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: string;
  density?: AppShellDensity;
  headerVariant?: AppShellHeaderVariant;
  sidebarOpen?: boolean;
  sidebarToggleLabel?: string;
  onToggleSidebar$?: QRL<() => void>;
};

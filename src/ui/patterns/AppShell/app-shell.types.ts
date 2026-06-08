import type { QRL } from '@builder.io/qwik';

export type AppShellDensity = 'comfortable' | 'compact';

export type AppShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: string;
  density?: AppShellDensity;
  sidebarOpen?: boolean;
  sidebarToggleLabel?: string;
  onToggleSidebar$?: QRL<() => void>;
};

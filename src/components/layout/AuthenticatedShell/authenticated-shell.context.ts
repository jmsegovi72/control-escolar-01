import { createContextId } from '@builder.io/qwik';

import type { SidebarStatusTone } from '~/ui/patterns/Sidebar/sidebar.types';

export type AuthenticatedShellSystemStatus = {
  backend: {
    value: string;
    tone: SidebarStatusTone;
  };
  database: {
    value: string;
    tone: SidebarStatusTone;
  };
  session: {
    remaining: string;
    tone: SidebarStatusTone;
  };
};

export const AuthenticatedShellSystemStatusContext =
  createContextId<AuthenticatedShellSystemStatus>(
    'layout.authenticated-shell.system-status',
  );

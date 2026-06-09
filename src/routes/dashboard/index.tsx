import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { appConfig } from '~/config/app.config';
import { messages } from '~/config/messages';
import { Panel, StatCard } from '~/ui';
import './dashboard.css';

export default component$(() => {
  return (
    <AuthenticatedShell
      eyebrow={appConfig.name}
      title={messages.dashboard.title}
      description={messages.dashboard.description}
      meta={messages.dashboard.meta}
    >
      <div class="dashboard-summary">
        <StatCard
          label={messages.dashboard.statSession}
          value={messages.dashboard.statSessionValue}
          tone="success"
          icon="lock"
        />
        <StatCard
          label={messages.dashboard.statBackend}
          value={messages.dashboard.statBackendValue}
          tone="neutral"
          icon="settings"
        />
        <StatCard
          label={messages.dashboard.statNextModule}
          value={messages.dashboard.statNextModuleValue}
          tone="info"
          icon="user-settings"
        />
      </div>

      <Panel
        title={messages.dashboard.panelTitle}
        description={messages.dashboard.panelDescription}
      >
        {messages.dashboard.panelContent}
      </Panel>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Dashboard`,
};

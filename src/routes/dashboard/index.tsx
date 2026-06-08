import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useNavigate } from '@builder.io/qwik-city';

import { appConfig } from '~/config/app.config';
import { authService } from '~/services/auth/auth.service';
import { Button, PageHeader, Panel } from '~/ui';
import { sessionStore } from '~/utils/session';

export default component$(() => {
  const nav = useNavigate();
  const userName = useSignal('');

  useVisibleTask$(async () => {
    if (authService.requiresPasswordChange()) {
      await nav('/change-password');
      return;
    }

    if (!authService.isAuthenticated()) {
      await nav('/login');
      return;
    }

    userName.value = sessionStore.getUser()?.fullName ?? 'Usuario';
  });

  return (
    <main class="app-frame">
      <div class="page-shell">
        <PageHeader
          eyebrow={appConfig.name}
          title="Dashboard"
          description={`Bienvenido, ${userName.value || 'Usuario'}. Esta sera la entrada principal del sistema.`}
        >
          <Button
            q:slot="actions"
            variant="secondary"
            iconLeft="logout"
            onClick$={async () => {
              authService.logout();
              await nav('/login');
            }}
          >
            Cerrar sesion
          </Button>
        </PageHeader>

        <Panel
          title="Sesion activa"
          description="Primer destino despues del login."
        >
          El login ya puede enviar aqui una sesion normal. Despues construiremos
          el dashboard real con sidebar, estado del sistema y modulos.
        </Panel>
      </div>
    </main>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Dashboard`,
};

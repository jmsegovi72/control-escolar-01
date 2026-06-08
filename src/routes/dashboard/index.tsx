import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { appConfig } from '~/config/app.config';
import { Panel, StatCard } from '~/ui';
import './dashboard.css';

export default component$(() => {
  return (
    <AuthenticatedShell
      eyebrow={appConfig.name}
      title="Dashboard"
      description="Entrada principal del sistema. Desde aqui iremos montando los modulos reales."
      meta="Vista inicial"
    >
      <div class="dashboard-summary">
        <StatCard label="Sesion" value="Activa" tone="success" icon="lock" />
        <StatCard
          label="Backend"
          value="Por validar"
          tone="neutral"
          icon="settings"
        />
        <StatCard
          label="Modulo siguiente"
          value="Usuarios"
          tone="info"
          icon="user-settings"
        />
      </div>

      <Panel
        title="Estructura autenticada"
        description="El dashboard ya usa el AppShell y Sidebar del almacen UI."
      >
        Esta pantalla ya vive dentro del esqueleto real de la aplicacion. El
        siguiente paso natural es construir el modulo de usuarios dentro de esta
        misma estructura.
      </Panel>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Dashboard`,
};

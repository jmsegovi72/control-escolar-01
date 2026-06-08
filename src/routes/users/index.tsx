import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { appConfig } from '~/config/app.config';
import { Button, EmptyState, Panel, Toolbar } from '~/ui';

export default component$(() => {
  return (
    <AuthenticatedShell
      eyebrow="Administracion"
      title="Usuarios"
      description="Gestion de cuentas, acceso inicial, bloqueo y restablecimiento administrado."
      meta="Modulo SUPER"
    >
      <Toolbar q:slot="toolbar">
        <span q:slot="leading">Preparacion del modulo</span>
        <span q:slot="center">
          Primero montamos la estructura; despues conectamos listado, filtros y
          acciones.
        </span>
        <Button q:slot="actions" iconLeft="add" disabled>
          Nuevo usuario
        </Button>
      </Toolbar>

      <Panel
        title="Usuarios del sistema"
        description="Esta sera la pantalla donde integraremos la tabla, filtros por columna y acciones por fila."
      >
        <EmptyState
          icon="user-settings"
          title="Modulo listo para construir"
          description="La ruta ya esta dentro del AppShell con Sidebar. El siguiente paso sera definir columnas, acciones y flujo de alta."
          tone="info"
        />
      </Panel>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Usuarios`,
};

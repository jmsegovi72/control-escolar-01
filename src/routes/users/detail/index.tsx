import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useLocation, useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { appConfig } from '~/config/app.config';
import { ENV } from '~/config/env';
import { userService } from '~/services/user/user.service';
import type { UserListItem } from '~/types/user.types';
import { Badge, Button, Field, Input, PageReturn, Panel, Toolbar } from '~/ui';
import { normalizeError } from '~/utils/api-error';
import { usersWorkflow } from '~/utils/users-workflow';
import './detail.css';

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

const getPhotoUrl = (user: UserListItem) => {
  if (!user.photoUrl) {
    return user.userTypeCode === 'SUPER'
      ? '/avatars/admin-default.svg'
      : '/avatars/user-default.svg';
  }

  if (
    user.photoUrl.startsWith('http') ||
    user.photoUrl.startsWith('/avatars/')
  ) {
    return user.photoUrl;
  }

  const apiBase = ENV.API_URL.replace(/\/sices\/v\d+$/, '');
  return `${apiBase}/${user.photoUrl.replace(/^\/+/, '')}`;
};

export default component$(() => {
  const nav = useNavigate();
  const location = useLocation();
  const user = useSignal<UserListItem | null>(null);
  const loading = useSignal(true);
  const error = useSignal('');
  const loadedFromContext = useSignal(false);
  const originLabel = useSignal('Acceso directo');
  const originDescription = useSignal(
    'El detalle se abrio con un identificador en la URL.',
  );
  const returnLabel = useSignal('Regresar');
  const returnPath = useSignal('/users');
  const searchTerm = useSignal('');
  const searchResults = useSignal<UserListItem[]>([]);
  const searching = useSignal(false);
  const selectionMode = useSignal(false);

  useVisibleTask$(async ({ track }) => {
    const idParam = track(() => location.url.searchParams.get('id'));
    const sourceParam = track(() => location.url.searchParams.get('source'));

    loading.value = true;
    error.value = '';
    originLabel.value = 'Acceso directo';
    originDescription.value =
      'El detalle se abrio con un identificador en la URL.';
    returnLabel.value = 'Regresar';
    returnPath.value = '/users';
    selectionMode.value = false;

    const id = idParam ? Number(idParam) : 0;
    const selectedUser = usersWorkflow.getSelectedUser();

    if (
      id &&
      sourceParam === 'table' &&
      selectedUser &&
      selectedUser.id === id
    ) {
      user.value = selectedUser;
      loadedFromContext.value = true;
      originLabel.value = 'Busqueda avanzada';
      originDescription.value =
        'Llegaste desde una fila del DataTable; se conserva la busqueda para regresar.';
      returnLabel.value = 'Regresar';
      returnPath.value = usersWorkflow.getReturnPath();
      loading.value = false;
      return;
    }

    if (!id) {
      user.value = null;
      loadedFromContext.value = false;
      selectionMode.value = true;
      originLabel.value = 'Seleccion manual';
      originDescription.value =
        'Busca y selecciona el usuario que quieres consultar.';
      returnLabel.value = 'Regresar';
      returnPath.value = '/users';
      loading.value = false;
      return;
    }

    try {
      user.value = await userService.findById(id);
      loadedFromContext.value = false;
      originLabel.value = 'Acceso directo';
      originDescription.value =
        'Llegaste por URL directa; no hay una tabla previa para restaurar.';
      returnLabel.value = 'Regresar';
      returnPath.value = '/users';
    } catch (err) {
      user.value = null;
      error.value = normalizeError(
        err,
        'No se pudo cargar el detalle del usuario',
      ).message;
    } finally {
      loading.value = false;
    }
  });

  useVisibleTask$(async ({ track }) => {
    const query = track(() => searchTerm.value.trim());
    const shouldSearch = track(() => selectionMode.value);

    if (!shouldSearch || query.length < 3) {
      searchResults.value = [];
      searching.value = false;
      return;
    }

    searching.value = true;

    try {
      const response = await userService.findMany({
        limit: 8,
        page: 1,
        searchTerm: query,
      });
      searchResults.value = response.data;
    } catch {
      searchResults.value = [];
    } finally {
      searching.value = false;
    }
  });

  const goBack$ = $(async () => {
    await nav(returnPath.value);
  });

  const openManualDetail$ = $(async (userId: number) => {
    usersWorkflow.clear();
    await nav(`/users/detail?id=${userId}`);
  });

  const currentUser = user.value;

  return (
    <AuthenticatedShell
      eyebrow="Administracion"
      title="Detalle de usuario"
      description="Consulta datos generales, permisos y estado de acceso."
      meta="Usuarios"
      allowedUserTypes={['SUPER']}
      accessDeniedDescription="El detalle de usuarios esta reservado para cuentas SUPER."
    >
      <Toolbar q:slot="toolbar">
        <Button
          q:slot="leading"
          variant="ghost"
          iconLeft="back"
          onClick$={goBack$}
        >
          {returnLabel.value}
        </Button>
        <Button
          q:slot="actions"
          variant="secondary"
          iconLeft="search"
          onClick$={async () => await nav('/users/search')}
        >
          Buscar usuarios
        </Button>
      </Toolbar>

      <div class="user-detail">
        <PageReturn
          eyebrow="Modulo de usuarios"
          title="Detalle de usuario"
          buttonLabel={returnLabel.value}
          onClick$={goBack$}
        />

        {loading.value && (
          <Panel title="Cargando usuario" description="Consultando datos...">
            <div class="user-detail__loading" />
          </Panel>
        )}

        {!loading.value && error.value && (
          <Panel
            eyebrow="Revision necesaria"
            title="No se puede mostrar el usuario"
            description={error.value}
          >
            <div class="user-detail__actions">
              <Button variant="secondary" iconLeft="back" onClick$={goBack$}>
                Volver
              </Button>
              <Button
                iconLeft="search"
                onClick$={async () => await nav('/users/search')}
              >
                Ir a busqueda
              </Button>
            </div>
          </Panel>
        )}

        {!loading.value && selectionMode.value && !currentUser && (
          <Panel
            title="Seleccionar usuario"
            description="Busca por nombre o usuario para abrir su detalle."
          >
            <div class="user-detail__selector">
              <Field
                label="Usuario"
                hint="Escribe al menos 3 caracteres para buscar."
              >
                <Input
                  iconLeft="search"
                  placeholder="Nombre o usuario"
                  value={searchTerm.value}
                  onInput$={(event) => {
                    searchTerm.value = (event.target as HTMLInputElement).value;
                  }}
                />
              </Field>

              {searching.value && (
                <div class="user-detail__loading" aria-label="Buscando" />
              )}

              {searchTerm.value.trim().length >= 3 &&
                !searching.value &&
                searchResults.value.length === 0 && (
                  <p class="user-detail__empty">
                    No se encontraron usuarios con ese criterio.
                  </p>
                )}

              {searchResults.value.length > 0 && (
                <div class="user-detail__results">
                  {searchResults.value.map((result) => (
                    <button
                      type="button"
                      class="user-detail__result-card"
                      key={result.id}
                      onClick$={async () => await openManualDetail$(result.id)}
                    >
                      <div class="user-detail__result-info">
                        <strong>{result.fullName}</strong>
                        <span>{result.username}</span>
                      </div>
                      <Badge tone={result.isActive ? 'success' : 'danger'}>
                        {result.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Panel>
        )}

        {!loading.value && currentUser && (
          <div class="user-detail__layout">
            <div class="user-detail__profile-card">
              <div class="user-detail__avatar-wrapper">
                {currentUser.photoUrl ? (
                  <img
                    src={getPhotoUrl(currentUser)}
                    alt={currentUser.fullName}
                  />
                ) : (
                  <span>{getInitials(currentUser.fullName)}</span>
                )}
              </div>
              <div class="user-detail__profile-info">
                <h2>{currentUser.fullName}</h2>
                <p>{currentUser.username}</p>
              </div>
              <div class="user-detail__profile-badges">
                <Badge tone={currentUser.isActive ? 'success' : 'danger'}>
                  {currentUser.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
                <Badge tone={currentUser.firstLogin ? 'warning' : 'success'}>
                  {currentUser.firstLogin
                    ? 'Primer acceso pendiente'
                    : 'Acceso completado'}
                </Badge>
              </div>
            </div>

            <Panel
              title="Información de Cuenta"
              description="Datos de acceso y registro"
            >
              <dl class="user-detail__info-grid">
                <div>
                  <dt>ID de registro</dt>
                  <dd>{currentUser.id}</dd>
                </div>
                <div>
                  <dt>Usuario / Correo</dt>
                  <dd>{currentUser.username}</dd>
                </div>
                <div>
                  <dt>Nombre Completo</dt>
                  <dd>{currentUser.fullName}</dd>
                </div>
              </dl>
            </Panel>

            <div class="user-detail__actions-card">
              <h3>Acciones de cuenta</h3>
              <div class="user-detail__action-list">
                <Button
                  variant="primary"
                  iconLeft="edit"
                  fullWidth
                  onClick$={async () =>
                    await nav(`/users/edit?id=${currentUser.id}`)
                  }
                >
                  Editar datos
                </Button>
                <Button
                  variant="secondary"
                  iconLeft="toggle"
                  fullWidth
                  onClick$={async () =>
                    await nav(`/users/toggle?id=${currentUser.id}`)
                  }
                >
                  {currentUser.isActive
                    ? 'Desactivar cuenta'
                    : 'Activar cuenta'}
                </Button>
                <Button
                  variant="secondary"
                  iconLeft="unlock"
                  fullWidth
                  onClick$={async () =>
                    await nav(`/users/unlock?id=${currentUser.id}`)
                  }
                >
                  Desbloquear cuenta
                </Button>
                <Button
                  variant="secondary"
                  iconLeft="login-reset"
                  fullWidth
                  onClick$={async () =>
                    await nav(`/users/reset-login?id=${currentUser.id}`)
                  }
                >
                  Restablecer acceso
                </Button>
              </div>
            </div>

            <Panel
              title="Rol y Permisos asignados"
              description="Nivel de acceso en la plataforma de control escolar"
            >
              <dl class="user-detail__info-grid">
                <div>
                  <dt>Rol Principal</dt>
                  <dd>{currentUser.roleName}</dd>
                </div>
                <div>
                  <dt>Descripción del Rol</dt>
                  <dd>
                    {currentUser.roleDescription || 'Sin descripción asignada.'}
                  </dd>
                </div>
                <div>
                  <dt>Tipo de Usuario</dt>
                  <dd>{currentUser.userTypeName}</dd>
                </div>
                <div>
                  <dt>Alcance del Tipo</dt>
                  <dd>
                    {currentUser.userTypeDescription ||
                      'Sin descripción de alcance.'}
                  </dd>
                </div>
              </dl>
            </Panel>
          </div>
        )}
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Detalle de usuario`,
};

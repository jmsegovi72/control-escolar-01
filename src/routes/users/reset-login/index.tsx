import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useLocation, useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { appConfig } from '~/config/app.config';
import { userService } from '~/services/user/user.service';
import type { UserListItem } from '~/types/user.types';
import {
  Badge,
  Button,
  ConfirmAction,
  Field,
  Input,
  PageReturn,
  Panel,
  Toast,
  Toolbar,
} from '~/ui';
import { normalizeError } from '~/utils/api-error';
import { usersWorkflow } from '~/utils/users-workflow';
import './reset-login.css';

export default component$(() => {
  const nav = useNavigate();
  const location = useLocation();
  const user = useSignal<UserListItem | null>(null);
  const loading = useSignal(true);
  const saving = useSignal(false);
  const confirmOpen = useSignal(false);
  const error = useSignal('');
  const successMessage = useSignal('');
  const tempPassword = useSignal('');
  const searchTerm = useSignal('');
  const searchResults = useSignal<UserListItem[]>([]);
  const searching = useSignal(false);
  const selectionMode = useSignal(false);
  const returnPath = useSignal('/users');

  useVisibleTask$(async ({ track }) => {
    const idParam = track(() => location.url.searchParams.get('id'));
    const sourceParam = track(() => location.url.searchParams.get('source'));
    const id = idParam ? Number(idParam) : 0;

    loading.value = true;
    error.value = '';
    successMessage.value = '';
    tempPassword.value = '';
    confirmOpen.value = false;
    selectionMode.value = false;
    returnPath.value = '/users';

    if (sourceParam === 'table') {
      returnPath.value = usersWorkflow.getReturnPath();
    }

    if (!id) {
      user.value = null;
      selectionMode.value = true;
      loading.value = false;
      return;
    }

    try {
      const selectedUser = usersWorkflow.getSelectedUser();
      if (sourceParam === 'table' && selectedUser?.id === id) {
        user.value = selectedUser;
      } else {
        user.value = await userService.findById(id);
      }
    } catch (err) {
      user.value = null;
      error.value = normalizeError(
        err,
        'No se pudo cargar el usuario para resetear login',
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

  const openManualUser$ = $(async (userId: number) => {
    usersWorkflow.clear();
    await nav(`/users/reset-login?id=${userId}`);
  });

  const resetLogin$ = $(async () => {
    if (!user.value) return;

    saving.value = true;
    error.value = '';
    successMessage.value = '';
    tempPassword.value = '';

    try {
      const response = await userService.resetLogin(user.value.id);
      successMessage.value =
        response.message || 'Primer login restablecido correctamente.';
      tempPassword.value = response.tempPassword ?? '';
      confirmOpen.value = false;
      user.value = { ...user.value, firstLogin: true };
    } catch (err) {
      error.value = normalizeError(
        err,
        'No se pudo resetear el primer login',
      ).message;
    } finally {
      saving.value = false;
    }
  });

  const currentUser = user.value;

  return (
    <AuthenticatedShell
      eyebrow="Administracion"
      title="Resetear login"
      description="Restablece el flujo de primer acceso de un usuario."
      meta="Usuarios"
      allowedUserTypes={['SUPER']}
      accessDeniedDescription="Resetear login esta reservado para cuentas SUPER."
    >
      <Toolbar q:slot="toolbar">
        <Button
          q:slot="leading"
          variant="ghost"
          iconLeft="back"
          onClick$={goBack$}
        >
          Regresar
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

      <div class="reset-login-page">
        <PageReturn
          eyebrow="Modulo de usuarios"
          title="Resetear login"
          buttonLabel="Regresar"
          onClick$={goBack$}
        />

        {loading.value && (
          <Panel title="Cargando usuario" description="Consultando datos...">
            <div class="reset-login__loading" />
          </Panel>
        )}

        {!loading.value && error.value && (
          <Toast tone="danger" title="Revision necesaria">
            {error.value}
          </Toast>
        )}

        {!loading.value && successMessage.value && (
          <Panel
            eyebrow="Reset completado"
            title={successMessage.value}
            description="Entrega la contrasena temporal solo al usuario correspondiente."
          >
            <div class="reset-login__success">
              {tempPassword.value ? (
                <div>
                  <span>Contrasena temporal</span>
                  <strong>{tempPassword.value}</strong>
                </div>
              ) : (
                <p>El backend no regreso una contrasena temporal.</p>
              )}
              <div class="reset-login__actions">
                <Button variant="secondary" iconLeft="back" onClick$={goBack$}>
                  Regresar
                </Button>
                <Button
                  iconLeft="search"
                  onClick$={async () => await nav('/users/search')}
                >
                  Buscar otro
                </Button>
              </div>
            </div>
          </Panel>
        )}

        {!loading.value &&
          selectionMode.value &&
          !currentUser &&
          !successMessage.value && (
            <Panel
              title="Seleccionar usuario"
              description="Busca por nombre o usuario para resetear su primer login."
            >
              <div class="reset-login__selector">
                <Field
                  label="Usuario"
                  hint="Escribe al menos 3 caracteres para buscar."
                >
                  <Input
                    iconLeft="search"
                    placeholder="Nombre o usuario"
                    value={searchTerm.value}
                    onInput$={(event) => {
                      searchTerm.value = (
                        event.target as HTMLInputElement
                      ).value;
                    }}
                  />
                </Field>

                {searching.value && (
                  <div class="reset-login__loading" aria-label="Buscando" />
                )}

                {searchTerm.value.trim().length >= 3 &&
                  !searching.value &&
                  searchResults.value.length === 0 && (
                    <p class="reset-login__empty">
                      No se encontraron usuarios con ese criterio.
                    </p>
                  )}

                {searchResults.value.length > 0 && (
                  <div class="reset-login__results">
                    {searchResults.value.map((result) => (
                      <button
                        type="button"
                        class="reset-login__result-card"
                        key={result.id}
                        onClick$={async () => await openManualUser$(result.id)}
                      >
                        <div class="reset-login__result-info">
                          <strong>{result.fullName}</strong>
                          <span>{result.username}</span>
                        </div>
                        <Badge tone={result.firstLogin ? 'warning' : 'success'}>
                          {result.firstLogin
                            ? 'Primer login pendiente'
                            : 'Primer login completado'}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Panel>
          )}

        {!loading.value && currentUser && !successMessage.value && (
          <>
            <Panel
              eyebrow="Usuario seleccionado"
              title={currentUser.fullName}
              description="Confirma que este es el usuario correcto antes de resetear el primer login."
            >
              <div class="reset-login__summary">
                <dl>
                  <div>
                    <dt>ID</dt>
                    <dd>{currentUser.id}</dd>
                  </div>
                  <div>
                    <dt>Usuario</dt>
                    <dd>{currentUser.username}</dd>
                  </div>
                  <div>
                    <dt>Rol</dt>
                    <dd>{currentUser.roleName}</dd>
                  </div>
                  <div>
                    <dt>Primer login</dt>
                    <dd>
                      <Badge
                        tone={currentUser.firstLogin ? 'warning' : 'success'}
                      >
                        {currentUser.firstLogin ? 'Pendiente' : 'Completado'}
                      </Badge>
                    </dd>
                  </div>
                </dl>
              </div>
            </Panel>

            <Panel
              title="Confirmacion"
              description="Esta accion forzara al usuario a cambiar contrasena en su siguiente acceso."
            >
              <div class="reset-login__actions">
                <Button
                  variant="secondary"
                  iconLeft="search"
                  onClick$={async () => await nav('/users/reset-login')}
                >
                  Cambiar usuario
                </Button>
                <Button
                  variant="danger"
                  iconLeft="login-reset"
                  disabled={saving.value}
                  onClick$={() => {
                    confirmOpen.value = true;
                  }}
                >
                  Resetear login
                </Button>
              </div>
            </Panel>

            <ConfirmAction
              open={confirmOpen.value}
              tone="danger"
              icon="login-reset"
              title="Resetear primer login"
              description={`Se reseteara el primer login de ${currentUser.fullName}.`}
              details="El usuario debera usar la contrasena temporal y cambiarla al iniciar sesion."
              confirmLabel="Resetear"
              loading={saving.value}
              onCancel$={() => {
                confirmOpen.value = false;
              }}
              onConfirm$={resetLogin$}
            />
          </>
        )}
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Resetear login`,
};

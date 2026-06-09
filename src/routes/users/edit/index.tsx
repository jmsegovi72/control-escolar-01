import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useLocation, useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { appConfig } from '~/config/app.config';
import { ENV } from '~/config/env';
import { catalogService } from '~/services/catalog/catalog.service';
import { userService } from '~/services/user/user.service';
import type { Role, UserType } from '~/types/catalog.types';
import type { UserListItem } from '~/types/user.types';
import {
  Badge,
  Button,
  Field,
  Input,
  PageReturn,
  Panel,
  Select,
  Toast,
  Toolbar,
} from '~/ui';
import { AppIcon } from '~/ui/icons';
import { normalizeError } from '~/utils/api-error';
import { usersWorkflow } from '~/utils/users-workflow';
import './edit.css';

const getPhotoUrl = (photoUrl: string | null, userTypeCode: string) => {
  if (!photoUrl) {
    return userTypeCode === 'SUPER'
      ? '/avatars/admin-default.svg'
      : '/avatars/user-default.svg';
  }

  if (photoUrl.startsWith('http') || photoUrl.startsWith('/avatars/')) {
    return photoUrl;
  }

  const apiBase = ENV.API_URL.replace(/\/sices\/v\d+$/, '');
  return `${apiBase}/${photoUrl.replace(/^\/+/, '')}`;
};

export default component$(() => {
  const nav = useNavigate();
  const location = useLocation();
  const user = useSignal<UserListItem | null>(null);
  const loading = useSignal(true);
  const saving = useSignal(false);
  const error = useSignal('');
  const errorField = useSignal('');
  const success = useSignal(false);
  const roles = useSignal<Role[]>([]);
  const userTypes = useSignal<UserType[]>([]);

  // Form Fields Signals
  const username = useSignal('');
  const roleId = useSignal(0);
  const userTypeId = useSignal(0);
  const photoFile = useSignal<File | null>(null);
  const photoPreview = useSignal('');

  // Selector Mode Signals (when id is missing)
  const selectionMode = useSignal(false);
  const searchTerm = useSignal('');
  const searchResults = useSignal<UserListItem[]>([]);
  const searching = useSignal(false);

  const returnPath = useSignal('/users');

  useVisibleTask$(async ({ track }) => {
    const idParam = track(() => location.url.searchParams.get('id'));
    const sourceParam = track(() => location.url.searchParams.get('source'));

    loading.value = true;
    error.value = '';
    selectionMode.value = false;
    returnPath.value = '/users';

    if (sourceParam === 'table') {
      returnPath.value = usersWorkflow.getReturnPath();
    }

    // Load Catalogs
    try {
      const [rolesData, userTypesData] = await Promise.all([
        catalogService.getRoles(),
        catalogService.getUserTypes(),
      ]);
      roles.value = rolesData;
      userTypes.value = userTypesData;
    } catch (err) {
      error.value = normalizeError(
        err,
        'No se pudieron cargar los catálogos escolares',
      ).message;
      loading.value = false;
      return;
    }

    const id = idParam ? Number(idParam) : 0;

    if (!id) {
      user.value = null;
      selectionMode.value = true;
      loading.value = false;
      return;
    }

    try {
      // Try to load from workflow first to conserve network requests
      const selectedUser = usersWorkflow.getSelectedUser();
      if (sourceParam === 'table' && selectedUser && selectedUser.id === id) {
        user.value = selectedUser;
      } else {
        user.value = await userService.findById(id);
      }

      if (user.value) {
        username.value = user.value.username;
        roleId.value = user.value.roleId;
        userTypeId.value = user.value.userTypeId;
        photoPreview.value = user.value.photoUrl
          ? getPhotoUrl(user.value.photoUrl, user.value.userTypeCode)
          : '';
      }
    } catch (err) {
      user.value = null;
      error.value = normalizeError(
        err,
        'No se pudo cargar el detalle del usuario para edición',
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

  const openManualEdit$ = $(async (userId: number) => {
    usersWorkflow.clear();
    await nav(`/users/edit?id=${userId}`);
  });

  const saveChanges$ = $(async () => {
    if (!user.value) return;

    error.value = '';
    errorField.value = '';

    if (!username.value.trim()) {
      error.value = 'El usuario o correo es requerido.';
      errorField.value = 'username';
      return;
    }

    if (!roleId.value) {
      error.value = 'El rol es requerido.';
      errorField.value = 'roleId';
      return;
    }

    if (!userTypeId.value) {
      error.value = 'El tipo de usuario es requerido.';
      errorField.value = 'userTypeId';
      return;
    }

    saving.value = true;

    try {
      await userService.updateUser(user.value.id, {
        username: username.value.trim(),
        roleId: roleId.value,
        userTypeId: userTypeId.value,
      });

      if (photoFile.value) {
        await userService.uploadPhoto(user.value.id, photoFile.value);
      }

      success.value = true;
      // Wait a brief moment to show success state before returning
      setTimeout(async () => {
        await nav(returnPath.value);
      }, 1500);
    } catch (err) {
      const normalized = normalizeError(err, 'Error al guardar cambios');
      error.value = normalized.message;
      errorField.value = normalized.invalidField ?? '';
    } finally {
      saving.value = false;
    }
  });

  const roleOptions = roles.value.map((role) => ({
    value: String(role.id),
    label: role.name,
  }));

  const userTypeOptions = userTypes.value.map((userType) => ({
    value: String(userType.id),
    label: userType.name,
  }));

  const currentUser = user.value;

  return (
    <AuthenticatedShell
      eyebrow="Administracion"
      title="Editar usuario"
      description="Modifica credenciales, rol y estado de foto de un usuario existente."
      meta="Edicion de cuenta"
      allowedUserTypes={['SUPER']}
      accessDeniedDescription="Editar usuarios esta reservado para cuentas SUPER."
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
        <span q:slot="center">
          Guarda cambios para actualizar los permisos de acceso inmediatamente.
        </span>
      </Toolbar>

      <div class="edit-user-page">
        <PageReturn
          eyebrow="Modulo de usuarios"
          title="Editar usuario"
          buttonLabel="Regresar"
          onClick$={goBack$}
        />

        {error.value && (
          <Toast tone="danger" title="Revision necesaria">
            {error.value}
          </Toast>
        )}

        {success.value && (
          <Toast tone="success" title="Cambios guardados">
            Los cambios del usuario se guardaron con éxito. Redirigiendo...
          </Toast>
        )}

        {loading.value && (
          <Panel
            title="Cargando datos"
            description="Buscando usuario en el sistema..."
          >
            <div class="edit-user__loading" />
          </Panel>
        )}

        {!loading.value && selectionMode.value && !currentUser && (
          <Panel
            title="Seleccionar usuario"
            description="Busca por nombre o usuario para editar su informacion."
          >
            <div class="edit-user-layout">
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
                <div class="edit-user__loading" aria-label="Buscando" />
              )}

              {searchTerm.value.trim().length >= 3 &&
                !searching.value &&
                searchResults.value.length === 0 && (
                  <p class="edit-user-person span">
                    No se encontraron usuarios con ese criterio.
                  </p>
                )}

              {searchResults.value.length > 0 && (
                <div class="edit-user__results">
                  {searchResults.value.map((result) => (
                    <article class="edit-user__result" key={result.id}>
                      <div>
                        <strong>{result.fullName}</strong>
                        <span>{result.username}</span>
                      </div>
                      <Badge tone={result.isActive ? 'success' : 'danger'}>
                        {result.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <Button
                        size="sm"
                        iconLeft="edit"
                        onClick$={async () => await openManualEdit$(result.id)}
                      >
                        Editar
                      </Button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </Panel>
        )}

        {!loading.value && currentUser && (
          <div class="edit-user-layout">
            <Panel
              title="1. Persona asociada"
              description="Datos personales ligados a la cuenta de usuario (Modo lectura)."
            >
              <div class="edit-user-person">
                <div class="edit-user-person__avatar" aria-hidden="true">
                  <AppIcon intent="person" size="md" />
                </div>
                <div>
                  <strong>{currentUser.fullName}</strong>
                  <span>{currentUser.username}</span>
                  <small>ID registro: {currentUser.id}</small>
                </div>
              </div>
            </Panel>

            <Panel
              title="2. Acceso y Permisos"
              description="Configura los accesos y el rol que tendrá el usuario."
            >
              <div class="edit-user-form">
                <Field
                  label="Usuario o correo"
                  required
                  error={
                    errorField.value === 'username'
                      ? 'Usuario no válido o ya en uso.'
                      : undefined
                  }
                >
                  <Input
                    iconLeft="mail"
                    value={username.value}
                    invalid={errorField.value === 'username'}
                    placeholder="correo@escuela.edu"
                    onInput$={(event) => {
                      username.value = (event.target as HTMLInputElement).value;
                    }}
                  />
                </Field>

                <div class="edit-user-grid">
                  <Field
                    label="Rol asignado"
                    required
                    error={
                      errorField.value === 'roleId'
                        ? 'El rol es requerido.'
                        : undefined
                    }
                  >
                    <Select
                      iconLeft="user-settings"
                      value={roleId.value ? String(roleId.value) : ''}
                      options={roleOptions}
                      placeholder="Selecciona rol"
                      invalid={errorField.value === 'roleId'}
                      onChange$={(value) => {
                        roleId.value = Number(value);
                      }}
                    />
                  </Field>

                  <Field
                    label="Tipo de usuario"
                    required
                    error={
                      errorField.value === 'userTypeId'
                        ? 'El tipo es requerido.'
                        : undefined
                    }
                  >
                    <Select
                      iconLeft="person"
                      value={userTypeId.value ? String(userTypeId.value) : ''}
                      options={userTypeOptions}
                      placeholder="Selecciona tipo"
                      invalid={errorField.value === 'userTypeId'}
                      onChange$={(value) => {
                        userTypeId.value = Number(value);
                      }}
                    />
                  </Field>
                </div>
              </div>
            </Panel>

            <Panel
              title="3. Fotografía de perfil"
              description="Sube una nueva foto para actualizar la imagen de perfil."
            >
              <div class="edit-user-photo">
                <div class="edit-user-photo__preview">
                  {photoPreview.value ? (
                    <img src={photoPreview.value} alt="Vista previa" />
                  ) : (
                    <AppIcon intent="person" size="lg" />
                  )}
                </div>
                <div>
                  <input
                    id="user-photo"
                    class="edit-user-photo__input"
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange$={(event) => {
                      const file = (event.target as HTMLInputElement)
                        .files?.[0];
                      if (!file) return;
                      photoFile.value = file;
                      photoPreview.value = URL.createObjectURL(file);
                    }}
                  />
                  <label class="edit-user-photo__button" for="user-photo">
                    {photoPreview.value ? 'Cambiar foto' : 'Subir foto'}
                  </label>
                  {photoFile.value && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick$={() => {
                        photoFile.value = null;
                        photoPreview.value = currentUser.photoUrl
                          ? getPhotoUrl(
                              currentUser.photoUrl,
                              currentUser.userTypeCode,
                            )
                          : '';
                      }}
                    >
                      Restablecer original
                    </Button>
                  )}
                </div>
              </div>
            </Panel>

            <div class="edit-user-actions">
              <Button variant="secondary" onClick$={goBack$}>
                Cancelar
              </Button>
              <Button
                iconLeft="save"
                loading={saving.value}
                onClick$={saveChanges$}
              >
                Guardar cambios
              </Button>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Editar usuario`,
};

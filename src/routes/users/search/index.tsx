import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { appConfig } from '~/config/app.config';
import { catalogService } from '~/services/catalog/catalog.service';
import { userService } from '~/services/user/user.service';
import type { Role, UserType } from '~/types/catalog.types';
import type { UserListItem } from '~/types/user.types';
import {
  Button,
  DataTable,
  Field,
  Input,
  PageReturn,
  Panel,
  Select,
  Toolbar,
} from '~/ui';
import type {
  DataTableAction,
  DataTableColumn,
} from '~/ui/patterns/DataTable/data-table.types';
import { normalizeError } from '~/utils/api-error';
import { usersWorkflow } from '~/utils/users-workflow';
import './search.css';

type UserRow = Record<string, unknown> &
  UserListItem & {
    activeLabel: string;
    firstLoginLabel: string;
  };

const toRow = (user: UserListItem): UserRow => ({
  ...user,
  activeLabel: user.isActive ? 'Activo' : 'Inactivo',
  firstLoginLabel: user.firstLogin ? 'Pendiente' : 'Completado',
});

export default component$(() => {
  const nav = useNavigate();
  const rows = useSignal<UserRow[]>([]);
  const total = useSignal(0);
  const page = useSignal(1);
  const limit = useSignal(10);
  const loading = useSignal(false);
  const searched = useSignal(false);
  const error = useSignal('');
  const roles = useSignal<Role[]>([]);
  const userTypes = useSignal<UserType[]>([]);
  const searchTerm = useSignal('');
  const fullName = useSignal('');
  const roleName = useSignal('');
  const userTypeName = useSignal('');
  const isActive = useSignal('');
  const isFirstLogin = useSignal('');

  const roleOptions = roles.value.map((role) => ({
    value: role.name,
    label: role.name,
  }));

  const userTypeOptions = userTypes.value.map((userType) => ({
    value: userType.name,
    label: userType.name,
  }));

  const activeOptions = [
    { value: 'true', label: 'Activo' },
    { value: 'false', label: 'Inactivo' },
  ];

  const firstLoginOptions = [
    { value: 'true', label: 'Pendiente' },
    { value: 'false', label: 'Completado' },
  ];

  const hasActiveFilters =
    Boolean(searchTerm.value) ||
    Boolean(fullName.value) ||
    Boolean(roleName.value) ||
    Boolean(userTypeName.value) ||
    Boolean(isActive.value) ||
    Boolean(isFirstLogin.value);

  const saveWorkContext$ = $((row: UserRow) => {
    usersWorkflow.save(
      {
        fullName: fullName.value,
        isActive: isActive.value,
        isFirstLogin: isFirstLogin.value,
        limit: limit.value,
        page: page.value,
        roleName: roleName.value,
        searchTerm: searchTerm.value,
        userTypeName: userTypeName.value,
      },
      row,
    );
  });

  const searchUsers$ = $(async () => {
    loading.value = true;
    searched.value = true;
    error.value = '';

    try {
      const response = await userService.findMany({
        page: page.value,
        limit: limit.value,
        searchTerm: searchTerm.value || undefined,
        fullName: fullName.value || undefined,
        roleName: roleName.value || undefined,
        userTypeName: userTypeName.value || undefined,
        isActive: isActive.value === '' ? undefined : isActive.value === 'true',
        isFirstLogin:
          isFirstLogin.value === '' ? undefined : isFirstLogin.value === 'true',
      });

      rows.value = response.data.map(toRow);
      total.value = response.meta?.totalRecords ?? response.total ?? 0;
    } catch (err) {
      rows.value = [];
      total.value = 0;
      error.value = normalizeError(
        err,
        'No se pudo realizar la busqueda',
      ).message;
    } finally {
      loading.value = false;
    }
  });

  const clearFilters$ = $(() => {
    searchTerm.value = '';
    fullName.value = '';
    roleName.value = '';
    userTypeName.value = '';
    isActive.value = '';
    isFirstLogin.value = '';
    page.value = 1;
    rows.value = [];
    total.value = 0;
    searched.value = false;
    error.value = '';
    usersWorkflow.clear();
  });

  useVisibleTask$(async () => {
    try {
      const [rolesData, userTypesData] = await Promise.all([
        catalogService.getRoles(),
        catalogService.getUserTypes(),
      ]);
      roles.value = rolesData;
      userTypes.value = userTypesData;
    } catch {
      roles.value = [];
      userTypes.value = [];
    }

    const savedState = usersWorkflow.getState();
    if (savedState?.filters) {
      fullName.value = savedState.filters.fullName;
      isActive.value = savedState.filters.isActive;
      isFirstLogin.value = savedState.filters.isFirstLogin;
      limit.value = savedState.filters.limit;
      page.value = savedState.filters.page;
      roleName.value = savedState.filters.roleName;
      searchTerm.value = savedState.filters.searchTerm;
      userTypeName.value = savedState.filters.userTypeName;
      await searchUsers$();
    }
  });

  const columns: DataTableColumn<UserRow>[] = [
    {
      key: 'fullName',
      label: 'Nombre completo',
      sortable: true,
      filter: { type: 'text', placeholder: 'Nombre' },
    },
    {
      key: 'username',
      label: 'Usuario',
      filter: { type: 'text', placeholder: 'Usuario' },
    },
    {
      key: 'roleName',
      label: 'Rol',
      filter: {
        type: 'select',
        placeholder: 'Todos',
        options: roleOptions,
      },
    },
    {
      key: 'userTypeName',
      label: 'Tipo',
      filter: {
        type: 'select',
        placeholder: 'Todos',
        options: userTypeOptions,
      },
    },
    {
      key: 'activeLabel',
      label: 'Estado',
      align: 'center',
      width: '8rem',
      badge: {
        toneMap: {
          Activo: 'success',
          Inactivo: 'danger',
        },
      },
      filter: {
        type: 'select',
        placeholder: 'Todos',
        options: activeOptions,
      },
    },
    {
      key: 'firstLoginLabel',
      label: 'Primer login',
      align: 'center',
      width: '9rem',
      badge: {
        toneMap: {
          Pendiente: 'warning',
          Completado: 'success',
        },
      },
      filter: {
        type: 'select',
        placeholder: 'Todos',
        options: firstLoginOptions,
      },
    },
  ];

  const actions: DataTableAction<UserRow>[] = [
    {
      label: 'Ver detalle',
      icon: 'view',
      onClick$: $(async (row) => {
        await saveWorkContext$(row);
        await nav(`/users/detail?id=${row.id}&source=table`);
      }),
    },
    {
      label: 'Editar',
      icon: 'edit',
      onClick$: $(async (row) => {
        await saveWorkContext$(row);
        await nav(`/users/edit?id=${row.id}`);
      }),
    },
    {
      label: 'Activar / Desactivar',
      icon: 'toggle',
      tone: 'primary',
      onClick$: $(async (row) => {
        await saveWorkContext$(row);
        await nav(`/users/toggle?id=${row.id}`);
      }),
    },
    {
      label: 'Desbloquear',
      icon: 'unlock',
      onClick$: $(async (row) => {
        await saveWorkContext$(row);
        await nav(`/users/unlock?id=${row.id}`);
      }),
    },
    {
      label: 'Resetear login',
      icon: 'login-reset',
      tone: 'danger',
      onClick$: $(async (row) => {
        await saveWorkContext$(row);
        await nav(`/users/reset-login?id=${row.id}&source=table`);
      }),
    },
  ];

  return (
    <AuthenticatedShell
      eyebrow="Administracion"
      title="Busqueda avanzada"
      description="Consulta usuarios por filtros y ejecuta acciones administrativas."
      meta="Usuarios"
      allowedUserTypes={['SUPER']}
      accessDeniedDescription="La busqueda de usuarios esta reservada para cuentas SUPER."
    >
      <Toolbar q:slot="toolbar">
        <Button
          q:slot="leading"
          variant="ghost"
          iconLeft="back"
          onClick$={async () => await nav('/users')}
        >
          Regresar
        </Button>
        <span q:slot="center">
          Desde aqui puedes filtrar usuarios y volver al flujo anterior.
        </span>
        <Button
          q:slot="actions"
          iconLeft="add"
          onClick$={async () => await nav('/users/create')}
        >
          Nuevo usuario
        </Button>
      </Toolbar>

      <div class="users-search">
        <PageReturn
          eyebrow="Modulo de usuarios"
          title="Busqueda avanzada"
          buttonLabel="Regresar"
          onClick$={async () => await nav('/users')}
        />

        <Panel
          title="Filtros"
          description="Combina criterios para localizar cuentas del sistema."
          density="compact"
        >
          <form
            preventdefault:submit
            onSubmit$={async () => {
              if (loading.value) return;
              page.value = 1;
              await searchUsers$();
            }}
          >
            <div class="users-search__filters">
              <Field label="Busqueda global">
                <Input
                  iconLeft="search"
                  placeholder="Nombre o usuario"
                  value={searchTerm.value}
                  onInput$={(event) => {
                    searchTerm.value = (event.target as HTMLInputElement).value;
                  }}
                />
              </Field>

              <Field label="Nombre completo">
                <Input
                  iconLeft="person"
                  placeholder="Ej. Segovia Chan"
                  value={fullName.value}
                  onInput$={(event) => {
                    fullName.value = (event.target as HTMLInputElement).value;
                  }}
                />
              </Field>

              <Field label="Rol">
                <Select
                  iconLeft="user-settings"
                  value={roleName.value}
                  options={roleOptions}
                  placeholder="Todos"
                  onChange$={(value) => {
                    roleName.value = value;
                  }}
                />
              </Field>

              <Field label="Tipo">
                <Select
                  iconLeft="person"
                  value={userTypeName.value}
                  options={userTypeOptions}
                  placeholder="Todos"
                  onChange$={(value) => {
                    userTypeName.value = value;
                  }}
                />
              </Field>

              <Field label="Estado">
                <Select
                  iconLeft="toggle"
                  value={isActive.value}
                  options={activeOptions}
                  placeholder="Todos"
                  onChange$={(value) => {
                    isActive.value = value;
                  }}
                />
              </Field>

              <Field label="Primer login">
                <Select
                  iconLeft="lock"
                  value={isFirstLogin.value}
                  options={firstLoginOptions}
                  placeholder="Todos"
                  onChange$={(value) => {
                    isFirstLogin.value = value;
                  }}
                />
              </Field>
            </div>

            <div class="users-search__actions">
              <Button
                type="button"
                variant="secondary"
                iconLeft="cancel"
                onClick$={clearFilters$}
              >
                Limpiar
              </Button>
              <Button type="submit" iconLeft="search" loading={loading.value}>
                Buscar
              </Button>
            </div>
          </form>
        </Panel>

        {error.value && (
          <Panel variant="outlined" title="No se pudo buscar">
            {error.value}
          </Panel>
        )}

        {searched.value && (
          <DataTable
            columns={columns}
            rows={rows.value}
            actions={actions}
            actionMode="menu"
            pagination={{
              page: page.value,
              limit: limit.value,
              total: total.value,
            }}
            loading={loading.value}
            searchable={false}
            hasActiveFilters={hasActiveFilters}
            stickyHeader
            maxHeight="calc(100vh - 32rem)"
            emptyTitle="Sin usuarios"
            emptyDescription="No se encontraron usuarios con los criterios seleccionados."
            onFilter$={$(async (change) => {
              if (change.key === 'fullName') fullName.value = change.value;
              if (change.key === 'username') searchTerm.value = change.value;
              if (change.key === 'roleName') roleName.value = change.value;
              if (change.key === 'userTypeName')
                userTypeName.value = change.value;
              if (change.key === 'activeLabel') isActive.value = change.value;
              if (change.key === 'firstLoginLabel') {
                isFirstLogin.value = change.value;
              }
              page.value = 1;
              await searchUsers$();
            })}
            onClearFilters$={clearFilters$}
            onPage$={$(async (nextPage) => {
              page.value = nextPage;
              await searchUsers$();
            })}
            onLimit$={$(async (nextLimit) => {
              limit.value = nextLimit;
              page.value = 1;
              await searchUsers$();
            })}
          />
        )}
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Busqueda avanzada`,
};

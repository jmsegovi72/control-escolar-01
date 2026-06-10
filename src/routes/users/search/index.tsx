import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { appConfig } from '~/config/app.config';
import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
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
  activeLabel: user.isActive
    ? messages.users.search.statusActive
    : messages.users.search.statusInactive,
  firstLoginLabel: user.firstLogin
    ? messages.users.search.firstLoginPending
    : messages.users.search.firstLoginCompleted,
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
    { value: 'true', label: messages.users.search.statusActive },
    { value: 'false', label: messages.users.search.statusInactive },
  ];

  const firstLoginOptions = [
    { value: 'true', label: messages.users.search.firstLoginPending },
    { value: 'false', label: messages.users.search.firstLoginCompleted },
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
      error.value = normalizeError(err, messages.errors.searchFailed).message;
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
      label: messages.users.search.columns.fullName,
      sortable: true,
      filter: {
        type: 'text',
        placeholder: messages.users.search.columns.fullNamePlaceholder,
      },
    },
    {
      key: 'username',
      label: messages.users.search.columns.username,
      filter: {
        type: 'text',
        placeholder: messages.users.search.columns.usernamePlaceholder,
      },
    },
    {
      key: 'roleName',
      label: messages.users.search.columns.role,
      filter: {
        type: 'select',
        placeholder: messages.users.search.filterRolePlaceholder,
        options: roleOptions,
      },
    },
    {
      key: 'userTypeName',
      label: messages.users.search.columns.type,
      filter: {
        type: 'select',
        placeholder: messages.users.search.filterTypePlaceholder,
        options: userTypeOptions,
      },
    },
    {
      key: 'activeLabel',
      label: messages.users.search.columns.status,
      align: 'center',
      width: '8rem',
      badge: {
        toneMap: {
          [messages.users.search.statusActive]: 'success',
          [messages.users.search.statusInactive]: 'danger',
        },
      },
      filter: {
        type: 'select',
        placeholder: messages.users.search.filterStatusPlaceholder,
        options: activeOptions,
      },
    },
    {
      key: 'firstLoginLabel',
      label: messages.users.search.columns.firstLogin,
      align: 'center',
      width: '9rem',
      badge: {
        toneMap: {
          [messages.users.search.firstLoginPending]: 'warning',
          [messages.users.search.firstLoginCompleted]: 'success',
        },
      },
      filter: {
        type: 'select',
        placeholder: messages.users.search.filterFirstLoginPlaceholder,
        options: firstLoginOptions,
      },
    },
  ];

  const actions: DataTableAction<UserRow>[] = [
    {
      label: messages.users.search.actions.viewDetail,
      icon: 'view',
      onClick$: $(async (row) => {
        await saveWorkContext$(row);
        await nav(`${ROUTES.USERS_DETAIL}?id=${row.id}&source=table`);
      }),
    },
    {
      label: messages.users.search.actions.edit,
      icon: 'edit',
      onClick$: $(async (row) => {
        await saveWorkContext$(row);
        await nav(`${ROUTES.USERS_EDIT}?id=${row.id}`);
      }),
    },
    {
      label: messages.users.search.actions.toggle,
      icon: 'toggle',
      tone: 'primary',
      onClick$: $(async (row) => {
        await saveWorkContext$(row);
        await nav(`${ROUTES.USERS_TOGGLE}?id=${row.id}`);
      }),
    },
    {
      label: messages.users.search.actions.unlock,
      icon: 'unlock',
      onClick$: $(async (row) => {
        await saveWorkContext$(row);
        await nav(`${ROUTES.USERS_UNLOCK}?id=${row.id}`);
      }),
    },
    {
      label: messages.users.search.actions.resetLogin,
      icon: 'login-reset',
      tone: 'danger',
      onClick$: $(async (row) => {
        await saveWorkContext$(row);
        await nav(`${ROUTES.USERS_RESET_LOGIN}?id=${row.id}&source=table`);
      }),
    },
  ];

  return (
    <AuthenticatedShell
      eyebrow={messages.users.search.eyebrow}
      title={messages.users.search.title}
      description={messages.users.search.description}
      meta={messages.users.search.meta}
      allowedUserTypes={['SUPER']}
      accessDeniedDescription={messages.users.search.accessDenied}
      fullWidth
    >
      <Toolbar q:slot="toolbar">
        <Button
          q:slot="leading"
          variant="ghost"
          iconLeft="back"
          onClick$={async () => await nav(ROUTES.USERS)}
        >
          {messages.users.search.toolbarBack}
        </Button>
        <span q:slot="center">{messages.users.search.toolbarCenter}</span>
        <Button
          q:slot="actions"
          iconLeft="add"
          onClick$={async () => await nav(ROUTES.USERS_CREATE)}
        >
          {messages.users.search.newUser}
        </Button>
      </Toolbar>

      <div class="users-search">
        <PageReturn
          eyebrow={messages.users.search.pageReturnEyebrow}
          title={messages.users.search.title}
          buttonLabel={messages.users.search.pageReturnLabel}
          onClick$={async () => await nav(ROUTES.USERS)}
        />

        <Panel
          title={messages.users.search.filterPanelTitle}
          description={messages.users.search.filterPanelDescription}
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
              <Field label={messages.users.search.filterGlobalLabel}>
                <Input
                  iconLeft="search"
                  placeholder={messages.users.search.filterGlobalPlaceholder}
                  value={searchTerm.value}
                  onInput$={(event) => {
                    searchTerm.value = (event.target as HTMLInputElement).value;
                  }}
                />
              </Field>

              <Field label={messages.users.search.filterNameLabel}>
                <Input
                  iconLeft="person"
                  placeholder={messages.users.search.filterNamePlaceholder}
                  value={fullName.value}
                  onInput$={(event) => {
                    fullName.value = (event.target as HTMLInputElement).value;
                  }}
                />
              </Field>

              <Field label={messages.users.search.filterRoleLabel}>
                <Select
                  iconLeft="user-settings"
                  value={roleName.value}
                  options={roleOptions}
                  placeholder={messages.users.search.filterRolePlaceholder}
                  onChange$={(value) => {
                    roleName.value = value;
                  }}
                />
              </Field>

              <Field label={messages.users.search.filterTypeLabel}>
                <Select
                  iconLeft="person"
                  value={userTypeName.value}
                  options={userTypeOptions}
                  placeholder={messages.users.search.filterTypePlaceholder}
                  onChange$={(value) => {
                    userTypeName.value = value;
                  }}
                />
              </Field>

              <Field label={messages.users.search.filterStatusLabel}>
                <Select
                  iconLeft="toggle"
                  value={isActive.value}
                  options={activeOptions}
                  placeholder={messages.users.search.filterStatusPlaceholder}
                  onChange$={(value) => {
                    isActive.value = value;
                  }}
                />
              </Field>

              <Field label={messages.users.search.filterFirstLoginLabel}>
                <Select
                  iconLeft="lock"
                  value={isFirstLogin.value}
                  options={firstLoginOptions}
                  placeholder={
                    messages.users.search.filterFirstLoginPlaceholder
                  }
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
                {messages.users.search.clearButton}
              </Button>
              <Button type="submit" iconLeft="search" loading={loading.value}>
                {messages.users.search.searchButton}
              </Button>
            </div>
          </form>
        </Panel>

        {error.value && (
          <Panel
            variant="outlined"
            title={messages.users.search.errorPanelTitle}
          >
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
            emptyTitle={messages.users.search.tableEmptyTitle}
            emptyDescription={messages.users.search.tableEmptyDescription}
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

import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useLocation, useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { UserSearchPanel } from '~/components/users';
import { appConfig } from '~/config/app.config';
import { messages } from '~/config/messages';
import { userService } from '~/services/user/user.service';
import type { UserListItem } from '~/types/user.types';
import {
  Avatar,
  Badge,
  Button,
  PageReturn,
  Panel,
  Toolbar,
} from '~/ui';
import { normalizeError } from '~/utils/api-error';
import { resolvePhotoUrl } from '~/utils/user-photo';
import { usersWorkflow } from '~/utils/users-workflow';
import './detail.css';

export default component$(() => {
  const nav = useNavigate();
  const location = useLocation();
  const user = useSignal<UserListItem | null>(null);
  const loading = useSignal(true);
  const error = useSignal('');
  const loadedFromContext = useSignal(false);
  const originLabel = useSignal<string>(messages.users.detail.originDirect);
  const originDescription = useSignal<string>(
    messages.users.detail.originDirectDescription,
  );
  const returnLabel = useSignal<string>(messages.users.detail.pageReturnLabel);
  const returnPath = useSignal('/users');
  const selectionMode = useSignal(false);

  useVisibleTask$(async ({ track }) => {
    const idParam = track(() => location.url.searchParams.get('id'));
    const sourceParam = track(() => location.url.searchParams.get('source'));

    loading.value = true;
    error.value = '';
    originLabel.value = messages.users.detail.originDirect;
    originDescription.value = messages.users.detail.originDirectDescription;
    returnLabel.value = messages.users.detail.pageReturnLabel;
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
      originLabel.value = messages.users.detail.originTable;
      originDescription.value = messages.users.detail.originTableDescription;
      returnLabel.value = messages.users.detail.pageReturnLabel;
      returnPath.value = usersWorkflow.getReturnPath();
      loading.value = false;
      return;
    }

    if (!id) {
      user.value = null;
      loadedFromContext.value = false;
      selectionMode.value = true;
      originLabel.value = messages.users.detail.originManual;
      originDescription.value = messages.users.detail.originManualDescription;
      returnLabel.value = messages.users.detail.pageReturnLabel;
      returnPath.value = '/users';
      loading.value = false;
      return;
    }

    try {
      user.value = await userService.findById(id);
      loadedFromContext.value = false;
      originLabel.value = messages.users.detail.originUrl;
      originDescription.value = messages.users.detail.originUrlDescription;
      returnLabel.value = messages.users.detail.pageReturnLabel;
      returnPath.value = '/users';
    } catch (err) {
      user.value = null;
      error.value = normalizeError(
        err,
        messages.errors.loadUserDetailFailed,
      ).message;
    } finally {
      loading.value = false;
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
      eyebrow={messages.users.detail.eyebrow}
      title={messages.users.detail.title}
      description={messages.users.detail.description}
      meta={messages.users.detail.meta}
      allowedUserTypes={['SUPER']}
      accessDeniedDescription={messages.users.detail.accessDenied}
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
          {messages.users.common.searchUsersAction}
        </Button>
      </Toolbar>

      <div class="user-detail">
        <PageReturn
          eyebrow={messages.users.detail.pageReturnEyebrow}
          title={messages.users.detail.title}
          buttonLabel={returnLabel.value}
          onClick$={goBack$}
        />

        {loading.value && (
          <Panel
            title={messages.users.common.loadingPanelTitle}
            description={messages.users.common.loadingPanelDescription}
          >
            <div class="user-detail__loading" />
          </Panel>
        )}

        {!loading.value && error.value && (
          <Panel
            eyebrow={messages.users.common.errorToastTitle}
            title={messages.users.detail.errorTitle}
            description={error.value}
          >
            <div class="user-detail__actions">
              <Button variant="secondary" iconLeft="back" onClick$={goBack$}>
                {messages.users.common.backLabel}
              </Button>
              <Button
                iconLeft="search"
                onClick$={async () => await nav('/users/search')}
              >
                {messages.users.common.goToSearchAction}
              </Button>
            </div>
          </Panel>
        )}

        {!loading.value && selectionMode.value && !currentUser && (
          <UserSearchPanel
            title={messages.users.common.searchUserTitle}
            description={messages.users.detail.selectionDescription}
            fieldHint={messages.users.common.fieldUserHint}
            noResultsMessage={messages.users.detail.noResultsCriteria}
            badgeField="isActive"
            badgeTrueLabel={messages.users.detail.resultActive}
            badgeFalseLabel={messages.users.detail.resultInactive}
            badgeTrueTone="success"
            badgeFalseTone="danger"
            onSelect$={openManualDetail$}
          />
        )}

        {!loading.value && currentUser && (
          <div class="user-detail__layout">
            <div class="user-detail__profile-card">
              <Avatar
                src={resolvePhotoUrl(currentUser)}
                name={currentUser.fullName}
                size="xl"
              />
              <div class="user-detail__profile-info">
                <h2>{currentUser.fullName}</h2>
                <p>{currentUser.username}</p>
              </div>
              <div class="user-detail__profile-badges">
                <Badge tone={currentUser.isActive ? 'success' : 'danger'}>
                  {currentUser.isActive
                    ? messages.users.detail.resultActive
                    : messages.users.detail.resultInactive}
                </Badge>
                <Badge tone={currentUser.firstLogin ? 'warning' : 'success'}>
                  {currentUser.firstLogin
                    ? messages.users.detail.firstLoginPending
                    : messages.users.detail.firstLoginCompleted}
                </Badge>
              </div>
            </div>

            <Panel
              title={messages.users.detail.panelAccountTitle}
              description={messages.users.detail.panelAccountDescription}
            >
              <dl class="user-detail__info-grid">
                <div>
                  <dt>{messages.users.detail.fieldId}</dt>
                  <dd>{currentUser.id}</dd>
                </div>
                <div>
                  <dt>{messages.users.detail.fieldUsername}</dt>
                  <dd>{currentUser.username}</dd>
                </div>
                <div>
                  <dt>{messages.users.detail.fieldFullName}</dt>
                  <dd>{currentUser.fullName}</dd>
                </div>
              </dl>
            </Panel>

            <div class="user-detail__actions-card">
              <h3>{messages.users.detail.accountActionsTitle}</h3>
              <div class="user-detail__action-list">
                <Button
                  variant="primary"
                  iconLeft="edit"
                  fullWidth
                  onClick$={async () =>
                    await nav(`/users/edit?id=${currentUser.id}`)
                  }
                >
                  {messages.users.detail.actionEdit}
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
                    ? messages.users.detail.actionDeactivate
                    : messages.users.detail.actionActivate}
                </Button>
                <Button
                  variant="secondary"
                  iconLeft="unlock"
                  fullWidth
                  onClick$={async () =>
                    await nav(`/users/unlock?id=${currentUser.id}`)
                  }
                >
                  {messages.users.detail.actionUnlock}
                </Button>
                <Button
                  variant="secondary"
                  iconLeft="login-reset"
                  fullWidth
                  onClick$={async () =>
                    await nav(`/users/reset-login?id=${currentUser.id}`)
                  }
                >
                  {messages.users.detail.actionResetAccess}
                </Button>
              </div>
            </div>

            <Panel
              title={messages.users.detail.panelRolesTitle}
              description={messages.users.detail.panelRolesDescription}
            >
              <dl class="user-detail__info-grid">
                <div>
                  <dt>{messages.users.detail.rolePrincipal}</dt>
                  <dd>{currentUser.roleName}</dd>
                </div>
                <div>
                  <dt>{messages.users.detail.roleDescription}</dt>
                  <dd>
                    {currentUser.roleDescription ||
                      messages.users.detail.roleNoDescription}
                  </dd>
                </div>
                <div>
                  <dt>{messages.users.detail.userType}</dt>
                  <dd>{currentUser.userTypeName}</dd>
                </div>
                <div>
                  <dt>{messages.users.detail.userTypeScope}</dt>
                  <dd>
                    {currentUser.userTypeDescription ||
                      messages.users.detail.userTypeNoDescription}
                  </dd>
                </div>
              </dl>
            </Panel>

            <div class="user-detail__footer-actions">
              <Button
                variant="secondary"
                iconLeft="search"
                onClick$={async () => await nav('/users/detail')}
              >
                {messages.users.common.searchOtherAction}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Detalle de usuario`,
};

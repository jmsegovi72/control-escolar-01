import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useLocation, useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { UserSearchPanel } from '~/components/users';
import { appConfig } from '~/config/app.config';
import { messages } from '~/config/messages';
import { userService } from '~/services/user/user.service';
import type { ToggleUserResult, UserListItem } from '~/types/user.types';
import {
  ActionHeader,
  Avatar,
  Badge,
  Button,
  ConfirmAction,
  Panel,
  Toast,
  Toolbar,
} from '~/ui';
import { normalizeError } from '~/utils/api-error';
import { resolvePhotoUrl } from '~/utils/user-photo';
import { usersWorkflow } from '~/utils/users-workflow';
import './toggle.css';

export default component$(() => {
  const nav = useNavigate();
  const location = useLocation();
  const user = useSignal<UserListItem | null>(null);
  const loading = useSignal(true);
  const saving = useSignal(false);
  const confirmOpen = useSignal(false);
  const error = useSignal('');
  const toggleResult = useSignal<ToggleUserResult | null>(null);
  const actionError = useSignal('');
  const selectionMode = useSignal(false);
  const returnPath = useSignal('/users');

  useVisibleTask$(async ({ track }) => {
    const idParam = track(() => location.url.searchParams.get('id'));
    const sourceParam = track(() => location.url.searchParams.get('source'));
    const id = idParam ? Number(idParam) : 0;

    loading.value = true;
    error.value = '';
    toggleResult.value = null;
    actionError.value = '';
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
        messages.errors.loadUserDetailFailed,
      ).message;
    } finally {
      loading.value = false;
    }
  });

  const goBack$ = $(async () => {
    await nav(returnPath.value);
  });

  const openManualUser$ = $(async (userId: number) => {
    usersWorkflow.clear();
    await nav(`/users/toggle?id=${userId}`);
  });

  const toggleUser$ = $(async () => {
    if (!user.value) return;

    saving.value = true;
    actionError.value = '';

    try {
      const response = await userService.toggleUser(user.value.id);
      toggleResult.value = response;
      confirmOpen.value = false;
      user.value = { ...user.value, isActive: response.isActive };
    } catch (err) {
      confirmOpen.value = false;
      actionError.value = normalizeError(
        err,
        messages.errors.toggleFailed,
      ).message;
    } finally {
      saving.value = false;
    }
  });

  const m = messages.users.toggle;
  const currentUser = user.value;
  const willDeactivate = currentUser?.isActive ?? false;

  return (
    <AuthenticatedShell
      eyebrow={m.eyebrow}
      title={m.title}
      description={m.description}
      meta={m.meta}
      allowedUserTypes={['SUPER']}
      accessDeniedDescription={m.accessDenied}
    >
      <Toolbar q:slot="toolbar">
        <Button
          q:slot="leading"
          variant="ghost"
          iconLeft="back"
          onClick$={goBack$}
        >
          {messages.users.common.backLabel}
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

      <div class="toggle-page">
        <ActionHeader title={m.title} onBack$={goBack$} />

        {loading.value && (
          <Panel title={m.loadingTitle} description={m.loadingDescription}>
            <div class="toggle__loading" />
          </Panel>
        )}

        {!loading.value && error.value && (
          <Toast tone="danger" title={m.errorToastTitle}>
            {error.value}
          </Toast>
        )}

        {!loading.value && selectionMode.value && !currentUser && (
          <UserSearchPanel
            title={m.selectionTitle}
            description={m.selectionDescription}
            fieldHint={m.fieldUserHint}
            noResultsMessage={m.noResultsCriteria}
            badgeField="isActive"
            badgeTrueLabel={m.badgeActive}
            badgeFalseLabel={m.badgeInactive}
            badgeTrueTone="success"
            badgeFalseTone="danger"
            onSelect$={openManualUser$}
          />
        )}

        {!loading.value && currentUser && (
          <>
            <Panel
              eyebrow={m.selectedEyebrow}
              title={currentUser.fullName}
              description={m.selectedDescription}
            >
              <Avatar
                q:slot="leading"
                src={resolvePhotoUrl(currentUser)}
                name={currentUser.fullName}
                size="xl"
              />
              <div class="toggle__summary">
                <dl>
                  <div>
                    <dt>{m.fieldId}</dt>
                    <dd>{currentUser.id}</dd>
                  </div>
                  <div>
                    <dt>{m.fieldUser}</dt>
                    <dd>{currentUser.username}</dd>
                  </div>
                  <div>
                    <dt>{m.fieldRole}</dt>
                    <dd>{currentUser.roleName}</dd>
                  </div>
                  <div>
                    <dt>{m.fieldStatus}</dt>
                    <dd>
                      <Badge tone={currentUser.isActive ? 'success' : 'danger'}>
                        {currentUser.isActive ? m.badgeActive : m.badgeInactive}
                      </Badge>
                    </dd>
                  </div>
                </dl>
              </div>
            </Panel>

            {!toggleResult.value && !actionError.value && (
              <>
                <Panel
                  title={
                    willDeactivate
                      ? m.confirmTitleDeactivate
                      : m.confirmTitleActivate
                  }
                  description={
                    willDeactivate
                      ? m.confirmDescriptionDeactivate
                      : m.confirmDescriptionActivate
                  }
                >
                  <div class="toggle__actions">
                    <Button
                      variant="secondary"
                      iconLeft="search"
                      onClick$={async () => await nav('/users/toggle')}
                    >
                      {m.changeUser}
                    </Button>
                    <Button
                      variant={willDeactivate ? 'danger' : 'primary'}
                      iconLeft="toggle"
                      disabled={saving.value}
                      onClick$={() => {
                        confirmOpen.value = true;
                      }}
                    >
                      {willDeactivate ? m.deactivateButton : m.activateButton}
                    </Button>
                  </div>
                </Panel>

                <ConfirmAction
                  open={confirmOpen.value}
                  tone={willDeactivate ? 'danger' : 'neutral'}
                  icon="toggle"
                  title={
                    willDeactivate
                      ? m.confirmDialogTitleDeactivate
                      : m.confirmDialogTitleActivate
                  }
                  description={(willDeactivate
                    ? m.confirmDialogDescriptionDeactivate
                    : m.confirmDialogDescriptionActivate
                  ).replace('{fullName}', currentUser.fullName)}
                  details={m.confirmDialogDetails}
                  confirmLabel={
                    willDeactivate
                      ? m.confirmDialogLabelDeactivate
                      : m.confirmDialogLabelActivate
                  }
                  loading={saving.value}
                  onCancel$={() => {
                    confirmOpen.value = false;
                  }}
                  onConfirm$={toggleUser$}
                />
              </>
            )}

            {toggleResult.value && (
              <Panel
                eyebrow={m.resultEyebrow}
                title={
                  toggleResult.value.message ||
                  (toggleResult.value.isActive
                    ? m.resultTitleActivated
                    : m.resultTitleDeactivated)
                }
                description={(toggleResult.value.isActive
                  ? m.resultDescriptionActivated
                  : m.resultDescriptionDeactivated
                ).replace('{fullName}', currentUser.fullName)}
              >
                <div class="toggle__result-summary">
                  <Badge
                    tone={toggleResult.value.isActive ? 'success' : 'danger'}
                  >
                    {toggleResult.value.isActive
                      ? m.badgeActive
                      : m.badgeInactive}
                  </Badge>
                </div>
                <div class="toggle__actions">
                  <Button
                    variant="secondary"
                    iconLeft="search"
                    onClick$={async () => await nav('/users/toggle')}
                  >
                    {m.toggleOther}
                  </Button>
                </div>
              </Panel>
            )}

            {actionError.value && (
              <Panel
                eyebrow={m.errorEyebrow}
                title={m.errorTitle}
                description={actionError.value}
              >
                <div class="toggle__actions">
                  <Button
                    variant="secondary"
                    iconLeft="search"
                    onClick$={async () => await nav('/users/toggle')}
                  >
                    {m.toggleOther}
                  </Button>
                </div>
              </Panel>
            )}
          </>
        )}
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Activar / Desactivar usuario`,
};

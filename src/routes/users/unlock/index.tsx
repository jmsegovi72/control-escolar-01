import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useLocation, useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { UserSearchPanel } from '~/components/users';
import { appConfig } from '~/config/app.config';
import { messages } from '~/config/messages';
import { userService } from '~/services/user/user.service';
import type { UnlockUserResult, UserListItem } from '~/types/user.types';
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
import './unlock.css';

export default component$(() => {
  const nav = useNavigate();
  const location = useLocation();
  const user = useSignal<UserListItem | null>(null);
  const loading = useSignal(true);
  const saving = useSignal(false);
  const confirmOpen = useSignal(false);
  const error = useSignal('');
  const unlockResult = useSignal<UnlockUserResult | null>(null);
  const actionError = useSignal('');
  const selectionMode = useSignal(false);
  const returnPath = useSignal('/users');

  useVisibleTask$(async ({ track }) => {
    const idParam = track(() => location.url.searchParams.get('id'));
    const sourceParam = track(() => location.url.searchParams.get('source'));
    const id = idParam ? Number(idParam) : 0;

    loading.value = true;
    error.value = '';
    unlockResult.value = null;
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
    await nav(`/users/unlock?id=${userId}`);
  });

  const unlockUser$ = $(async () => {
    if (!user.value) return;

    saving.value = true;
    actionError.value = '';

    try {
      const response = await userService.unlockUser(user.value.id);
      unlockResult.value = response;
      confirmOpen.value = false;
    } catch (err) {
      confirmOpen.value = false;
      actionError.value = normalizeError(
        err,
        messages.errors.unlockFailed,
      ).message;
    } finally {
      saving.value = false;
    }
  });

  const m = messages.users.unlock;
  const currentUser = user.value;

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

      <div class="unlock-page">
        <ActionHeader title={m.title} onBack$={goBack$} />

        {loading.value && (
          <Panel title={m.loadingTitle} description={m.loadingDescription}>
            <div class="unlock__loading" />
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
            filters={{ isActive: true, isLocked: true }}
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
              <div class="unlock__summary">
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
                    <dt>{messages.users.detail.resultActive}</dt>
                    <dd>
                      <Badge tone={currentUser.isActive ? 'success' : 'danger'}>
                        {currentUser.isActive
                          ? messages.users.detail.resultActive
                          : messages.users.detail.resultInactive}
                      </Badge>
                    </dd>
                  </div>
                </dl>
              </div>
            </Panel>

            {!unlockResult.value && !actionError.value && (
              <>
                <Panel
                  title={m.confirmTitle}
                  description={m.confirmDescription}
                >
                  <div class="unlock__actions">
                    <Button
                      variant="secondary"
                      iconLeft="search"
                      onClick$={async () => await nav('/users/unlock')}
                    >
                      {m.changeUser}
                    </Button>
                    <Button
                      variant="primary"
                      iconLeft="unlock"
                      disabled={saving.value}
                      onClick$={() => {
                        confirmOpen.value = true;
                      }}
                    >
                      {m.unlockButton}
                    </Button>
                  </div>
                </Panel>

                <ConfirmAction
                  open={confirmOpen.value}
                  tone="neutral"
                  icon="unlock"
                  title={m.confirmDialogTitle}
                  description={m.confirmDialogDescription.replace(
                    '{fullName}',
                    currentUser.fullName,
                  )}
                  details={m.confirmDialogDetails}
                  confirmLabel={m.confirmDialogLabel}
                  loading={saving.value}
                  onCancel$={() => {
                    confirmOpen.value = false;
                  }}
                  onConfirm$={unlockUser$}
                />
              </>
            )}

            {unlockResult.value && (
              <Panel
                eyebrow={m.resultEyebrow}
                title={unlockResult.value.message || m.resultTitle}
                description={m.resultDescription.replace(
                  '{fullName}',
                  currentUser.fullName,
                )}
              >
                <div class="unlock__result-data">
                  <dl>
                    <div>
                      <dt>{m.resultAttemptsLabel}</dt>
                      <dd>{unlockResult.value.loginAttempts}</dd>
                    </div>
                    <div>
                      <dt>{m.resultLockedUntilLabel}</dt>
                      <dd>
                        {unlockResult.value.lockedUntil
                          ? unlockResult.value.lockedUntil
                          : m.resultLockedUntilNone}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div class="unlock__actions">
                  <Button
                    variant="secondary"
                    iconLeft="search"
                    onClick$={async () => await nav('/users/unlock')}
                  >
                    {m.unlockOther}
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
                <div class="unlock__actions">
                  <Button
                    variant="secondary"
                    iconLeft="search"
                    onClick$={async () => await nav('/users/unlock')}
                  >
                    {m.unlockOther}
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
  title: `${appConfig.name} | Desbloquear usuario`,
};

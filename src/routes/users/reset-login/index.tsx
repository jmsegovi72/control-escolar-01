import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useLocation, useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { UserSearchPanel } from '~/components/users';
import { appConfig } from '~/config/app.config';
import { messages } from '~/config/messages';
import { userService } from '~/services/user/user.service';
import type { ResetLoginResult, UserListItem } from '~/types/user.types';
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
import './reset-login.css';

export default component$(() => {
  const nav = useNavigate();
  const location = useLocation();
  const user = useSignal<UserListItem | null>(null);
  const loading = useSignal(true);
  const saving = useSignal(false);
  const confirmOpen = useSignal(false);
  const error = useSignal('');
  const resetResult = useSignal<ResetLoginResult | null>(null);
  const actionError = useSignal('');
  const selectionMode = useSignal(false);
  const returnPath = useSignal('/users');

  useVisibleTask$(async ({ track }) => {
    const idParam = track(() => location.url.searchParams.get('id'));
    const sourceParam = track(() => location.url.searchParams.get('source'));
    const id = idParam ? Number(idParam) : 0;

    loading.value = true;
    error.value = '';
    resetResult.value = null;
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
    await nav(`/users/reset-login?id=${userId}`);
  });

  const resetLogin$ = $(async () => {
    if (!user.value) return;

    saving.value = true;
    actionError.value = '';

    try {
      const response = await userService.resetLogin(user.value.id);
      resetResult.value = response;
      confirmOpen.value = false;
      user.value = { ...user.value, firstLogin: true };
    } catch (err) {
      confirmOpen.value = false;
      actionError.value = normalizeError(
        err,
        messages.errors.resetLoginFailed,
      ).message;
    } finally {
      saving.value = false;
    }
  });

  const m = messages.users.resetLogin;
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

      <div class="reset-login-page">
        <ActionHeader title={m.title} onBack$={goBack$} />

        {loading.value && (
          <Panel title={m.loadingTitle} description={m.loadingDescription}>
            <div class="reset-login__loading" />
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
            filters={{ isActive: true, isFirstLogin: false }}
            badgeField="firstLogin"
            badgeTrueLabel={m.firstLoginPending}
            badgeFalseLabel={m.firstLoginCompleted}
            badgeTrueTone="warning"
            badgeFalseTone="success"
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
              <div class="reset-login__summary">
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
                    <dt>{m.fieldFirstLogin}</dt>
                    <dd>
                      <Badge
                        tone={currentUser.firstLogin ? 'warning' : 'success'}
                      >
                        {currentUser.firstLogin
                          ? m.badgePending
                          : m.badgeCompleted}
                      </Badge>
                    </dd>
                  </div>
                </dl>
              </div>
            </Panel>

            {!resetResult.value && !actionError.value && (
              <>
                <Panel
                  title={m.confirmTitle}
                  description={m.confirmDescription}
                >
                  <div class="reset-login__actions">
                    <Button
                      variant="secondary"
                      iconLeft="search"
                      onClick$={async () => await nav('/users/reset-login')}
                    >
                      {m.changeUser}
                    </Button>
                    <Button
                      variant="danger"
                      iconLeft="login-reset"
                      disabled={saving.value}
                      onClick$={() => {
                        confirmOpen.value = true;
                      }}
                    >
                      {m.resetButton}
                    </Button>
                  </div>
                </Panel>

                <ConfirmAction
                  open={confirmOpen.value}
                  tone="danger"
                  icon="login-reset"
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
                  onConfirm$={resetLogin$}
                />
              </>
            )}

            {resetResult.value && (
              <Panel
                eyebrow={m.resultEyebrow}
                title={
                  resetResult.value.message || messages.users.resetLoginSuccess
                }
                description={messages.users.resetLoginResultDescription.replace(
                  '{fullName}',
                  currentUser.fullName,
                )}
              >
                <div class="reset-login__success">
                  <span>{m.resultTempPasswordLabel}</span>
                  <strong>{resetResult.value.tempPassword}</strong>
                </div>
                <div class="reset-login__actions">
                  <Button
                    variant="secondary"
                    iconLeft="search"
                    onClick$={async () => await nav('/users/reset-login')}
                  >
                    {m.resetOther}
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
                <div class="reset-login__actions">
                  <Button
                    variant="secondary"
                    iconLeft="search"
                    onClick$={async () => await nav('/users/reset-login')}
                  >
                    {m.resetOther}
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
  title: `${appConfig.name} | Resetear login`,
};

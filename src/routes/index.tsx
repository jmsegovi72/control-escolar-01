import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useNavigate } from '@builder.io/qwik-city';

import { appConfig } from '~/config/app.config';
import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
import { authService } from '~/services/auth/auth.service';
import type { LoginCredentials } from '~/types/auth.types';
import { isFirstLoginResponse } from '~/types/auth.types';
import { Button, Checkbox, Dialog, Field, Input } from '~/ui';
import { AppIcon } from '~/ui/icons';
import { normalizeError } from '~/utils/api-error';
import { sessionStore } from '~/utils/session';
import './login.css';

export default component$(() => {
  const nav = useNavigate();
  const credentials = useSignal<LoginCredentials>({
    login: '',
    password: '',
  });
  const rememberDevice = useSignal(false);
  const error = useSignal('');
  const isLocked = useSignal(false);
  const lockoutRemaining = useSignal('');
  const isLoading = useSignal(false);
  const sessionExpired = useSignal(false);
  const showHelp = useSignal(false);
  const showPassword = useSignal(false);
  const showLockoutDialog = useSignal(false);
  const showExpiredDialog = useSignal(false);
  const showDisabledAccountDialog = useSignal(false);
  const expiredReason = useSignal<'session' | 'temporary' | null>(null);

  useVisibleTask$(async () => {
    const params = new URLSearchParams(window.location.search);
    const expiredParam = params.get('expired');
    expiredReason.value =
      expiredParam === 'temporary'
        ? 'temporary'
        : expiredParam
          ? 'session'
          : null;
    sessionExpired.value = expiredReason.value !== null;
    showExpiredDialog.value = sessionExpired.value;

    if (authService.isAuthenticated()) {
      await nav(ROUTES.DASHBOARD);
      return;
    }

    if (
      authService.requiresPasswordChange() &&
      expiredReason.value !== 'temporary'
    ) {
      await nav(ROUTES.CHANGE_PASSWORD);
    }
  });

  return (
    <main class="login-page">
      <section class="login-brand" aria-label="Presentacion del sistema">
        <div class="login-brand__mark" aria-hidden="true">
          {appConfig.initials}
        </div>

        <div class="login-brand__content">
          <p class="login-kicker">{appConfig.description}</p>
          <h1 class="login-title">
            {messages.auth.login.welcome.replace('{name}', appConfig.name)}
          </h1>
          <p class="login-copy">{messages.auth.login.copy}</p>
        </div>
      </section>

      <section class="login-panel" aria-label="Inicio de sesion">
        <div class="login-card">
          <header class="login-access">
            <p class="login-access__system">{appConfig.name}</p>
            <span class="login-access__icon" aria-hidden="true">
              <AppIcon intent="lock" size="xl" />
            </span>
            <h2 class="login-access__title">{messages.auth.login.formTitle}</h2>
            <p class="login-access__copy">{messages.auth.login.formCopy}</p>
          </header>

          <form
            class="login-form"
            preventdefault:submit
            onSubmit$={async () => {
              error.value = '';
              isLocked.value = false;
              lockoutRemaining.value = '';

              if (
                !credentials.value.login.trim() ||
                !credentials.value.password
              ) {
                error.value = messages.auth.login.validationError;
                return;
              }

              isLoading.value = true;

              try {
                sessionStore.clear();
                const response = await authService.login(credentials.value);
                authService.saveSession(response);

                if (isFirstLoginResponse(response)) {
                  await nav(ROUTES.CHANGE_PASSWORD);
                } else {
                  await nav(ROUTES.DASHBOARD);
                }
              } catch (loginError) {
                const normalized = normalizeError(
                  loginError,
                  'Error al iniciar sesion.',
                );

                credentials.value = {
                  ...credentials.value,
                  password: '',
                };

                if (isDisabledAccountError(normalized)) {
                  showDisabledAccountDialog.value = true;
                  error.value = normalized.message;
                  return;
                }

                if (normalized.status === 403) {
                  isLocked.value = true;
                  showLockoutDialog.value = true;
                  lockoutRemaining.value =
                    normalized.lockout?.remainingText ?? '';
                  error.value = normalized.message;
                  return;
                }

                error.value =
                  normalized.status === undefined
                    ? messages.auth.login.connectionError.replace(
                        '{message}',
                        normalized.message,
                      )
                    : normalized.message;
              } finally {
                isLoading.value = false;
              }
            }}
          >
            {sessionExpired.value && (
              <div class="login-alert" data-variant="warning" role="alert">
                <AppIcon intent="warning" size="sm" />
                <span>{messages.auth.login.sessionExpiredMessage}</span>
              </div>
            )}

            {error.value &&
              !isLocked.value &&
              !showDisabledAccountDialog.value && (
                <div class="login-alert" data-variant="danger" role="alert">
                  <AppIcon intent="warning" size="sm" />
                  <span>{error.value}</span>
                </div>
              )}

            <Field
              label={messages.auth.login.usernameLabel}
              required
              htmlFor="login"
              disabled={isLocked.value}
            >
              <Input
                id="login"
                type="text"
                name="email"
                placeholder={messages.auth.login.usernamePlaceholder}
                autoComplete="username"
                inputMode="email"
                iconLeft="mail"
                value={credentials.value.login}
                disabled={isLocked.value || isLoading.value}
                onInput$={(event) => {
                  credentials.value = {
                    ...credentials.value,
                    login: (event.target as HTMLInputElement).value,
                  };
                  error.value = '';
                  isLocked.value = false;
                  lockoutRemaining.value = '';
                }}
              />
            </Field>

            <Field
              label={messages.auth.login.passwordLabel}
              required
              htmlFor="password"
              disabled={isLocked.value}
            >
              <div class="login-password-field">
                <Input
                  id="password"
                  type={showPassword.value ? 'text' : 'password'}
                  name="password"
                  placeholder={messages.auth.login.passwordPlaceholder}
                  autoComplete="current-password"
                  iconLeft="lock"
                  value={credentials.value.password}
                  disabled={isLocked.value || isLoading.value}
                  onInput$={(event) => {
                    credentials.value = {
                      ...credentials.value,
                      password: (event.target as HTMLInputElement).value,
                    };
                    error.value = '';
                    isLocked.value = false;
                    lockoutRemaining.value = '';
                  }}
                />
                <button
                  class="login-password-toggle"
                  type="button"
                  disabled={isLocked.value || isLoading.value}
                  aria-label={
                    showPassword.value
                      ? messages.auth.login.hidePassword
                      : messages.auth.login.showPassword
                  }
                  onClick$={() => {
                    showPassword.value = !showPassword.value;
                  }}
                >
                  {showPassword.value
                    ? messages.auth.login.hidePassword
                    : messages.auth.login.showPassword}
                </button>
              </div>
            </Field>

            {isLocked.value && (
              <div class="login-lockout-note">
                <AppIcon intent="schedule" size="sm" />
                <div>
                  <strong>{error.value}</strong>
                  <span>{messages.auth.login.lockoutNote}</span>
                </div>
              </div>
            )}

            <Dialog
              open={showLockoutDialog.value}
              title={messages.auth.login.dialogs.lockout.title}
              description={error.value}
              tone="warning"
              icon="lock"
              closeLabel={messages.auth.login.dialogs.lockout.closeLabel}
              onClose$={() => {
                showLockoutDialog.value = false;
              }}
            >
              <p class="login-dialog-copy">
                {messages.auth.login.dialogs.lockout.description}
              </p>
              <Button
                q:slot="footer"
                type="button"
                onClick$={() => {
                  showLockoutDialog.value = false;
                }}
              >
                {messages.auth.login.dialogs.lockout.closeLabel}
              </Button>
            </Dialog>

            <Dialog
              open={showExpiredDialog.value}
              title={
                expiredReason.value === 'temporary'
                  ? messages.auth.login.dialogs.expired.temporaryTitle
                  : messages.auth.login.dialogs.expired.sessionTitle
              }
              description={
                expiredReason.value === 'temporary'
                  ? messages.auth.login.dialogs.expired.temporaryDescription
                  : messages.auth.login.dialogs.expired.sessionDescription
              }
              tone="warning"
              icon="warning"
              closeLabel={messages.auth.login.dialogs.expired.closeLabel}
              onClose$={() => {
                showExpiredDialog.value = false;
              }}
            >
              <p class="login-dialog-copy">
                {expiredReason.value === 'temporary'
                  ? messages.auth.login.dialogs.expired.temporaryAction
                  : messages.auth.login.dialogs.expired.sessionAction}
              </p>
              <Button
                q:slot="footer"
                type="button"
                onClick$={() => {
                  showExpiredDialog.value = false;
                }}
              >
                {messages.auth.login.dialogs.expired.closeLabel}
              </Button>
            </Dialog>

            <Dialog
              open={showDisabledAccountDialog.value}
              title={messages.auth.login.dialogs.disabledAccount.title}
              description={error.value}
              tone="danger"
              icon="warning"
              closeLabel={
                messages.auth.login.dialogs.disabledAccount.closeLabel
              }
              onClose$={() => {
                showDisabledAccountDialog.value = false;
              }}
            >
              <p class="login-dialog-copy">
                {messages.auth.login.dialogs.disabledAccount.description}
              </p>
              <Button
                q:slot="footer"
                type="button"
                onClick$={() => {
                  showDisabledAccountDialog.value = false;
                }}
              >
                {messages.auth.login.dialogs.disabledAccount.closeLabel}
              </Button>
            </Dialog>

            <div class="login-form__row">
              <Checkbox
                name="remember"
                checked={rememberDevice.value}
                disabled={isLocked.value || isLoading.value}
                onChange$={(event) => {
                  rememberDevice.value = (
                    event.target as HTMLInputElement
                  ).checked;
                }}
              >
                {messages.auth.login.rememberDevice}
              </Checkbox>
              <button
                class="login-link"
                type="button"
                onClick$={() => {
                  showHelp.value = !showHelp.value;
                }}
              >
                {messages.auth.login.recoverPassword}
              </button>
            </div>

            {showHelp.value && (
              <div class="login-help-note">
                <AppIcon intent="info" size="sm" />
                <span>{messages.auth.login.helpText}</span>
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              iconRight="chevron-right"
              loading={isLoading.value}
              disabled={isLocked.value}
            >
              {isLoading.value
                ? messages.auth.login.loadingLabel
                : messages.auth.login.submitLabel}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Login`,
  meta: [
    {
      name: 'description',
      content: `Acceso al sistema ${appConfig.name}`,
    },
  ],
};

type LoginErrorClassifierInput = {
  message: string;
  code?: string;
  status?: number;
  statusCode?: number;
};

function isDisabledAccountError(error: LoginErrorClassifierInput): boolean {
  const message = error.message.toLocaleLowerCase();
  const code = error.code?.toLocaleLowerCase();

  return (
    message.includes('desactivada') ||
    message.includes('desactivado') ||
    message.includes('inactiva') ||
    message.includes('inactivo') ||
    code === 'account_disabled' ||
    code === 'user_disabled' ||
    code === 'inactive_user'
  );
}

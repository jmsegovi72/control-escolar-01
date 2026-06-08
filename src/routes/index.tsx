import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useNavigate } from '@builder.io/qwik-city';

import { appConfig } from '~/config/app.config';
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
      await nav('/dashboard');
      return;
    }

    if (
      authService.requiresPasswordChange() &&
      expiredReason.value !== 'temporary'
    ) {
      await nav('/change-password');
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
          <h1 class="login-title">Bienvenido a {appConfig.name}</h1>
          <p class="login-copy">
            Gestion escolar con acceso seguro para el trabajo administrativo.
          </p>
        </div>

        <div class="login-health" aria-label="Estado inicial del sistema">
          <div class="login-health__item">
            <span class="login-health__label">API</span>
            <span class="login-health__value">Pendiente de conectar</span>
          </div>
          <div class="login-health__item">
            <span class="login-health__label">Base de datos</span>
            <span class="login-health__value">Sin verificar</span>
          </div>
          <div class="login-health__item">
            <span class="login-health__label">Sesion</span>
            <span class="login-health__value">No iniciada</span>
          </div>
        </div>
      </section>

      <section class="login-panel" aria-label="Inicio de sesion">
        <div class="login-card">
          <header class="login-access">
            <p class="login-access__system">{appConfig.name}</p>
            <span class="login-access__icon" aria-hidden="true">
              <AppIcon intent="lock" size="xl" />
            </span>
            <h2 class="login-access__title">Iniciar sesion</h2>
            <p class="login-access__copy">
              Usa tus credenciales para entrar al sistema.
            </p>
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
                error.value = 'Ingresa tu correo y contrasena.';
                return;
              }

              isLoading.value = true;

              try {
                sessionStore.clear();
                const response = await authService.login(credentials.value);
                authService.saveSession(response);

                if (isFirstLoginResponse(response)) {
                  await nav('/change-password');
                } else {
                  await nav('/dashboard');
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
                    ? `No se pudo conectar con el servidor. ${normalized.message}`
                    : normalized.message;
              } finally {
                isLoading.value = false;
              }
            }}
          >
            {sessionExpired.value && (
              <div class="login-alert" data-variant="warning" role="alert">
                <AppIcon intent="warning" size="sm" />
                <span>
                  Tu sesion o acceso temporal expiro. Inicia sesion nuevamente o
                  contacta al administrador.
                </span>
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
              label="Usuario o correo"
              required
              htmlFor="login"
              disabled={isLocked.value}
            >
              <Input
                id="login"
                type="text"
                name="email"
                placeholder="usuario o correo"
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
              label="Contrasena"
              required
              htmlFor="password"
              disabled={isLocked.value}
            >
              <div class="login-password-field">
                <Input
                  id="password"
                  type={showPassword.value ? 'text' : 'password'}
                  name="password"
                  placeholder="Ingresa tu contrasena"
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
                      ? 'Ocultar contrasena'
                      : 'Mostrar contrasena'
                  }
                  onClick$={() => {
                    showPassword.value = !showPassword.value;
                  }}
                >
                  {showPassword.value ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </Field>

            {isLocked.value && (
              <div class="login-lockout-note">
                <AppIcon intent="schedule" size="sm" />
                <div>
                  <strong>{error.value}</strong>
                  <span>
                    Si necesitas acceso antes, presentate con el administrador.
                  </span>
                </div>
              </div>
            )}

            <Dialog
              open={showLockoutDialog.value}
              title="Cuenta bloqueada temporalmente"
              description={error.value}
              tone="warning"
              icon="lock"
              closeLabel="Entendido"
              onClose$={() => {
                showLockoutDialog.value = false;
              }}
            >
              <p class="login-dialog-copy">
                Si necesitas acceso antes, presentate con el administrador.
              </p>
              <Button
                q:slot="footer"
                type="button"
                onClick$={() => {
                  showLockoutDialog.value = false;
                }}
              >
                Entendido
              </Button>
            </Dialog>

            <Dialog
              open={showExpiredDialog.value}
              title={
                expiredReason.value === 'temporary'
                  ? 'Acceso temporal expirado'
                  : 'Sesion expirada'
              }
              description={
                expiredReason.value === 'temporary'
                  ? 'El tiempo para cambiar tu contrasena termino.'
                  : 'Tu sesion expiro.'
              }
              tone="warning"
              icon="warning"
              closeLabel="Volver al login"
              onClose$={() => {
                showExpiredDialog.value = false;
              }}
            >
              <p class="login-dialog-copy">
                {expiredReason.value === 'temporary'
                  ? 'Inicia sesion nuevamente con la contrasena temporal proporcionada por el administrador o solicita una nueva.'
                  : 'Inicia sesion nuevamente para continuar trabajando.'}
              </p>
              <Button
                q:slot="footer"
                type="button"
                onClick$={() => {
                  showExpiredDialog.value = false;
                }}
              >
                Volver al login
              </Button>
            </Dialog>

            <Dialog
              open={showDisabledAccountDialog.value}
              title="Cuenta desactivada"
              description={error.value}
              tone="danger"
              icon="warning"
              closeLabel="Entendido"
              onClose$={() => {
                showDisabledAccountDialog.value = false;
              }}
            >
              <p class="login-dialog-copy">
                Contacta al administrador para revisar el acceso de esta cuenta.
              </p>
              <Button
                q:slot="footer"
                type="button"
                onClick$={() => {
                  showDisabledAccountDialog.value = false;
                }}
              >
                Entendido
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
                Recordar este equipo
              </Checkbox>
              <button
                class="login-link"
                type="button"
                onClick$={() => {
                  showHelp.value = !showHelp.value;
                }}
              >
                Recuperar contrasena
              </button>
            </div>

            {showHelp.value && (
              <div class="login-help-note">
                <AppIcon intent="info" size="sm" />
                <span>
                  Contacta al administrador para generar una contrasena temporal
                  y activar el cambio obligatorio.
                </span>
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              iconRight="chevron-right"
              loading={isLoading.value}
              disabled={isLocked.value}
            >
              {isLoading.value ? 'Validando acceso' : 'Entrar al sistema'}
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

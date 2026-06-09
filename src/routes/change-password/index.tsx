import {
  component$,
  useComputed$,
  useSignal,
  useVisibleTask$,
} from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useNavigate } from '@builder.io/qwik-city';

import { appConfig } from '~/config/app.config';
import { messages } from '~/config/messages';
import { authService } from '~/services/auth/auth.service';
import type { ChangePasswordCredentials } from '~/types/auth.types';
import { Button, Field, Input } from '~/ui';
import { AppIcon } from '~/ui/icons';
import { normalizeError } from '~/utils/api-error';
import {
  allowedPasswordSpecialCharacters,
  getPasswordRules,
  isValidPassword,
} from '~/utils/password-rules';
import './change-password.css';

export default component$(() => {
  const nav = useNavigate();
  const form = useSignal<ChangePasswordCredentials>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const error = useSignal('');
  const errorField = useSignal('');
  const isLoading = useSignal(false);
  const showPasswords = useSignal(false);

  const passwordRules = useComputed$(() =>
    getPasswordRules(form.value.newPassword),
  );
  const passwordsMatch = useComputed$(
    () =>
      !!form.value.confirmPassword &&
      form.value.newPassword === form.value.confirmPassword,
  );

  useVisibleTask$(async () => {
    if (authService.isAuthenticated()) {
      await nav('/dashboard');
      return;
    }

    if (!authService.requiresPasswordChange()) {
      await nav('/login');
    }
  });

  return (
    <main class="change-password-page">
      <section
        class="change-password-card"
        aria-label={messages.auth.changePassword.title}
      >
        <header class="change-password-header">
          <p class="change-password-header__system">{appConfig.name}</p>
          <span class="change-password-header__icon" aria-hidden="true">
            <AppIcon intent="unlock" size="xl" />
          </span>
          <h1 class="change-password-header__title">
            {messages.auth.changePassword.title}
          </h1>
          <p class="change-password-header__copy">
            {messages.auth.changePassword.copy}
          </p>
        </header>

        <div class="change-password-alert">
          <AppIcon intent="warning" size="sm" />
          <span>{messages.auth.changePassword.alert}</span>
        </div>

        {error.value && (
          <div class="change-password-error" role="alert">
            <AppIcon intent="warning" size="sm" />
            <span>{error.value}</span>
          </div>
        )}

        <form
          class="change-password-form"
          preventdefault:submit
          onSubmit$={async () => {
            error.value = '';
            errorField.value = '';

            if (!form.value.currentPassword) {
              error.value = messages.auth.changePassword.errors.missingCurrent;
              errorField.value = 'currentPassword';
              return;
            }

            if (!isValidPassword(form.value.newPassword)) {
              error.value = messages.auth.changePassword.errors.invalidNew;
              errorField.value = 'newPassword';
              return;
            }

            if (form.value.newPassword !== form.value.confirmPassword) {
              error.value = messages.auth.changePassword.errors.mismatch;
              errorField.value = 'confirmPassword';
              return;
            }

            if (form.value.currentPassword === form.value.newPassword) {
              error.value = messages.auth.changePassword.errors.sameAsCurrent;
              errorField.value = 'newPassword';
              return;
            }

            isLoading.value = true;

            try {
              const response = await authService.changePassword(form.value);
              authService.saveChangedPasswordSession(response);
              await nav('/dashboard');
            } catch (changePasswordError) {
              const normalized = normalizeError(
                changePasswordError,
                messages.errors.changePasswordFailed,
              );
              error.value = normalized.message;
              errorField.value = normalized.invalidField ?? '';
            } finally {
              isLoading.value = false;
            }
          }}
        >
          <div class="change-password-visibility">
            <span>{messages.auth.changePassword.visibilityLabel}</span>
            <button
              type="button"
              disabled={isLoading.value}
              onClick$={() => {
                showPasswords.value = !showPasswords.value;
              }}
            >
              {showPasswords.value
                ? messages.auth.changePassword.hidePasswords
                : messages.auth.changePassword.showPasswords}
            </button>
          </div>

          <Field
            label={messages.auth.changePassword.currentPasswordLabel}
            required
            htmlFor="currentPassword"
            error={
              errorField.value === 'currentPassword'
                ? messages.auth.changePassword.errors.fieldError
                : undefined
            }
          >
            <Input
              id="currentPassword"
              type={showPasswords.value ? 'text' : 'password'}
              name="currentPassword"
              placeholder={
                messages.auth.changePassword.currentPasswordPlaceholder
              }
              autoComplete="current-password"
              iconLeft="lock"
              value={form.value.currentPassword}
              invalid={errorField.value === 'currentPassword'}
              disabled={isLoading.value}
              onInput$={(event) => {
                form.value = {
                  ...form.value,
                  currentPassword: (event.target as HTMLInputElement).value,
                };
                error.value = '';
                errorField.value = '';
              }}
            />
          </Field>

          <Field
            label={messages.auth.changePassword.newPasswordLabel}
            required
            htmlFor="newPassword"
            error={
              errorField.value === 'newPassword'
                ? messages.auth.changePassword.errors.fieldError
                : undefined
            }
          >
            <Input
              id="newPassword"
              type={showPasswords.value ? 'text' : 'password'}
              name="newPassword"
              placeholder={messages.auth.changePassword.newPasswordPlaceholder}
              autoComplete="new-password"
              iconLeft="unlock"
              value={form.value.newPassword}
              invalid={
                errorField.value === 'newPassword' ||
                (!!form.value.newPassword &&
                  !isValidPassword(form.value.newPassword))
              }
              disabled={isLoading.value}
              onInput$={(event) => {
                form.value = {
                  ...form.value,
                  newPassword: (event.target as HTMLInputElement).value,
                };
                error.value = '';
                errorField.value = '';
              }}
            />
          </Field>

          <div
            class="password-rules"
            aria-label={messages.auth.changePassword.rulesLabel}
          >
            <PasswordRule
              valid={passwordRules.value.hasUpperCase}
              label={messages.auth.changePassword.rules.upperCase}
            />
            <PasswordRule
              valid={passwordRules.value.hasLowerCase}
              label={messages.auth.changePassword.rules.lowerCase}
            />
            <PasswordRule
              valid={passwordRules.value.hasNumber}
              label={messages.auth.changePassword.rules.number}
            />
            <PasswordRule
              valid={passwordRules.value.hasAllowedSpecialChar}
              label={messages.auth.changePassword.rules.specialChar.replace(
                '{chars}',
                allowedPasswordSpecialCharacters,
              )}
            />
            <PasswordRule
              valid={passwordRules.value.hasOnlyAllowedCharacters}
              label={messages.auth.changePassword.rules.onlyAllowed}
            />
            <PasswordRule
              valid={passwordRules.value.hasValidLength}
              label={messages.auth.changePassword.rules.validLength}
            />
          </div>

          <Field
            label={messages.auth.changePassword.confirmPasswordLabel}
            required
            htmlFor="confirmPassword"
            error={
              errorField.value === 'confirmPassword'
                ? messages.auth.changePassword.errors.fieldError
                : undefined
            }
          >
            <Input
              id="confirmPassword"
              type={showPasswords.value ? 'text' : 'password'}
              name="confirmPassword"
              placeholder={
                messages.auth.changePassword.confirmPasswordPlaceholder
              }
              autoComplete="new-password"
              iconLeft={passwordsMatch.value ? 'success' : 'lock'}
              value={form.value.confirmPassword}
              invalid={
                errorField.value === 'confirmPassword' ||
                (!!form.value.confirmPassword && !passwordsMatch.value)
              }
              disabled={isLoading.value}
              onInput$={(event) => {
                form.value = {
                  ...form.value,
                  confirmPassword: (event.target as HTMLInputElement).value,
                };
                error.value = '';
                errorField.value = '';
              }}
            />
          </Field>

          <Button
            type="submit"
            fullWidth
            loading={isLoading.value}
            iconRight="chevron-right"
          >
            {isLoading.value
              ? messages.auth.changePassword.loadingLabel
              : messages.auth.changePassword.submitLabel}
          </Button>
        </form>
      </section>
    </main>
  );
});

type PasswordRuleProps = {
  valid: boolean;
  label: string;
};

export const PasswordRule = component$<PasswordRuleProps>(
  ({ valid, label }) => {
    return (
      <span class="password-rule" data-valid={valid ? 'true' : 'false'}>
        <AppIcon intent={valid ? 'success' : 'close'} size="xs" />
        {label}
      </span>
    );
  },
);

export const head: DocumentHead = {
  title: `${appConfig.name} | Cambiar contrasena`,
  meta: [
    {
      name: 'description',
      content: `Cambio obligatorio de contrasena en ${appConfig.name}`,
    },
  ],
};

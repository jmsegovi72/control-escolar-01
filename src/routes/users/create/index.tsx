import {
  $,
  component$,
  useSignal,
  useTask$,
  useVisibleTask$,
} from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { appConfig } from '~/config/app.config';
import { messages } from '~/config/messages';
import { catalogService } from '~/services/catalog/catalog.service';
import { userService } from '~/services/user/user.service';
import type { Role, UserType } from '~/types/catalog.types';
import type { Person } from '~/types/person.types';
import type { CreateUserDto } from '~/types/user.types';
import {
  Button,
  Checkbox,
  Field,
  Input,
  PageReturn,
  Panel,
  SearchSelect,
  Select,
  Toast,
  Toolbar,
} from '~/ui';
import { AppIcon } from '~/ui/icons';
import { normalizeError } from '~/utils/api-error';
import './create.css';

const emptyForm: CreateUserDto = {
  username: '',
  roleId: 0,
  userTypeId: 0,
  personId: 0,
};

const personName = (person: Person) =>
  person.fullName ??
  `${person.firstName} ${person.firstLastName} ${person.secondLastName}`.trim();

export default component$(() => {
  const nav = useNavigate();
  const roles = useSignal<Role[]>([]);
  const userTypes = useSignal<UserType[]>([]);
  const searchQuery = useSignal('');
  const searchResults = useSignal<Person[]>([]);
  const searching = useSignal(false);
  const selectedPerson = useSignal<Person | null>(null);
  const form = useSignal<CreateUserDto>({ ...emptyForm });
  const loadingCatalogs = useSignal(true);
  const saving = useSignal(false);
  const error = useSignal('');
  const errorField = useSignal('');
  const success = useSignal(false);
  const tempPassword = useSignal('');
  const customUsername = useSignal(false);
  const customPassword = useSignal(false);
  const showPassword = useSignal(false);
  const photoFile = useSignal<File | null>(null);
  const photoPreview = useSignal('');

  useVisibleTask$(async () => {
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
        messages.errors.loadCatalogsFailed,
      ).message;
    } finally {
      loadingCatalogs.value = false;
    }
  });

  useTask$(async ({ track }) => {
    const query = track(() => searchQuery.value.trim());

    if (query.length < 3) {
      searchResults.value = [];
      return;
    }

    searching.value = true;

    try {
      searchResults.value = await userService.searchPersons(query);
    } catch {
      searchResults.value = [];
    } finally {
      searching.value = false;
    }
  });

  const resetSelection$ = $(() => {
    selectedPerson.value = null;
    form.value = { ...emptyForm };
    searchQuery.value = '';
    searchResults.value = [];
    customUsername.value = false;
    customPassword.value = false;
    photoFile.value = null;
    photoPreview.value = '';
    error.value = '';
    errorField.value = '';
  });

  const createUser$ = $(async () => {
    error.value = '';
    errorField.value = '';

    if (!selectedPerson.value) {
      error.value = messages.users.create.validationPersonRequired;
      return;
    }

    if (!form.value.roleId) {
      error.value = messages.users.create.validationRole;
      errorField.value = 'roleId';
      return;
    }

    if (!form.value.userTypeId) {
      error.value = messages.users.create.validationUserType;
      errorField.value = 'userTypeId';
      return;
    }

    if (!form.value.username.trim()) {
      error.value = messages.users.create.validationUsername;
      errorField.value = 'username';
      return;
    }

    saving.value = true;

    try {
      const response = await userService.createUser({
        ...form.value,
        username: form.value.username.trim(),
        password: customPassword.value ? form.value.password : undefined,
      });

      if (photoFile.value && response.userId) {
        await userService.uploadPhoto(response.userId, photoFile.value);
      }

      tempPassword.value = response.tempPassword;
      success.value = true;
      await resetSelection$();
    } catch (err) {
      const normalized = normalizeError(err, messages.errors.createUserFailed);
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

  return (
    <AuthenticatedShell
      eyebrow={messages.users.create.eyebrow}
      title={messages.users.create.title}
      description={messages.users.create.description}
      meta={messages.users.create.meta}
      allowedUserTypes={['SUPER']}
      accessDeniedDescription={messages.users.create.accessDenied}
    >
      <Toolbar q:slot="toolbar">
        <Button
          q:slot="leading"
          variant="ghost"
          iconLeft="back"
          onClick$={async () => await nav('/users')}
        >
          {messages.users.create.toolbarBack}
        </Button>
        <span q:slot="center">{messages.users.create.toolbarCenter}</span>
      </Toolbar>

      <div class="create-user-page">
        <PageReturn
          eyebrow={messages.users.create.pageReturnEyebrow}
          title={messages.users.create.title}
          buttonLabel={messages.users.create.pageReturnLabel}
          onClick$={async () => await nav('/users')}
        />

        {error.value && (
          <Toast tone="danger" title={messages.users.common.errorToastTitle}>
            {error.value}
          </Toast>
        )}

        {success.value ? (
          <Panel
            eyebrow={messages.users.create.successEyebrow}
            title={messages.users.create.successTitle}
            description={messages.users.create.successDescription}
          >
            <div class="create-user-success">
              <div class="create-user-success__icon" aria-hidden="true">
                <AppIcon intent="success" size="lg" />
              </div>
              <div>
                <span>{messages.users.create.successTempPasswordLabel}</span>
                <strong>{tempPassword.value}</strong>
              </div>
              <div class="create-user-success__actions">
                <Button
                  variant="secondary"
                  onClick$={async () => {
                    success.value = false;
                    tempPassword.value = '';
                    await nav('/users');
                  }}
                >
                  {messages.users.create.successFinish}
                </Button>
                <Button
                  iconLeft="add"
                  onClick$={() => {
                    success.value = false;
                    tempPassword.value = '';
                  }}
                >
                  {messages.users.create.successCreateAnother}
                </Button>
              </div>
            </div>
          </Panel>
        ) : (
          <div class="create-user-layout">
            <Panel
              title={messages.users.create.panelPersonTitle}
              description={messages.users.create.panelPersonDescription}
            >
              {!selectedPerson.value ? (
                <Field
                  label={messages.users.create.fieldPersonLabel}
                  required
                  hint={messages.users.create.fieldPersonHint}
                >
                  <SearchSelect
                    query={searchQuery.value}
                    options={searchResults.value.map((person) => ({
                      value: String(person.id),
                      label: personName(person),
                      description: `${person.personalEmail} | ${person.curp}`,
                    }))}
                    loading={searching.value}
                    placeholder={messages.users.create.searchPlaceholder}
                    emptyMessage={
                      searchQuery.value.length < 3
                        ? messages.users.create.emptySearchShort
                        : messages.users.create.emptySearchNotFound
                    }
                    onQueryChange$={(query) => {
                      searchQuery.value = query;
                      error.value = '';
                    }}
                    onSelect$={(option) => {
                      const person = searchResults.value.find(
                        (item) => item.id === Number(option.value),
                      );

                      if (!person) return;

                      selectedPerson.value = person;
                      form.value = {
                        ...emptyForm,
                        personId: person.id,
                        username: person.personalEmail,
                      };
                      searchQuery.value = '';
                      searchResults.value = [];
                    }}
                    onClear$={resetSelection$}
                  />
                </Field>
              ) : (
                <div class="create-user-person">
                  <div class="create-user-person__avatar" aria-hidden="true">
                    <AppIcon intent="person" size="md" />
                  </div>
                  <div>
                    <strong>{personName(selectedPerson.value)}</strong>
                    <span>{selectedPerson.value.personalEmail}</span>
                    <small>{selectedPerson.value.curp}</small>
                  </div>
                  <Button
                    variant="ghost"
                    iconLeft="close"
                    onClick$={resetSelection$}
                  >
                    {messages.users.create.personChange}
                  </Button>
                </div>
              )}
            </Panel>

            <Panel
              title={messages.users.create.panelAccessTitle}
              description={messages.users.create.panelAccessDescription}
            >
              <div class="create-user-form">
                <Field
                  label={messages.users.create.labelUsername}
                  required
                  error={
                    errorField.value === 'username'
                      ? messages.users.create.errorUsernameInvalid
                      : undefined
                  }
                >
                  <Input
                    iconLeft="mail"
                    value={form.value.username}
                    disabled={!selectedPerson.value || !customUsername.value}
                    invalid={errorField.value === 'username'}
                    placeholder={messages.users.create.placeholderUsername}
                    onInput$={(event) => {
                      form.value = {
                        ...form.value,
                        username: (event.target as HTMLInputElement).value,
                      };
                    }}
                  />
                </Field>

                <Checkbox
                  checked={customUsername.value}
                  disabled={!selectedPerson.value}
                  onChange$={(event) => {
                    const checked = (event.target as HTMLInputElement).checked;
                    customUsername.value = checked;

                    if (!checked && selectedPerson.value) {
                      form.value = {
                        ...form.value,
                        username: selectedPerson.value.personalEmail,
                      };
                    }
                  }}
                >
                  {messages.users.create.editUsernameCheckbox}
                </Checkbox>

                <div class="create-user-grid">
                  <Field
                    label={messages.users.create.labelRole}
                    required
                    error={
                      errorField.value === 'roleId'
                        ? messages.users.create.errorRoleRequired
                        : undefined
                    }
                  >
                    <Select
                      iconLeft="user-settings"
                      value={form.value.roleId ? String(form.value.roleId) : ''}
                      options={roleOptions}
                      placeholder={
                        loadingCatalogs.value
                          ? messages.users.create.placeholderRoleLoading
                          : messages.users.create.placeholderRole
                      }
                      disabled={!selectedPerson.value || loadingCatalogs.value}
                      invalid={errorField.value === 'roleId'}
                      onChange$={(value) => {
                        form.value = { ...form.value, roleId: Number(value) };
                      }}
                    />
                  </Field>

                  <Field
                    label={messages.users.create.labelUserType}
                    required
                    error={
                      errorField.value === 'userTypeId'
                        ? messages.users.create.errorUserTypeRequired
                        : undefined
                    }
                  >
                    <Select
                      iconLeft="person"
                      value={
                        form.value.userTypeId
                          ? String(form.value.userTypeId)
                          : ''
                      }
                      options={userTypeOptions}
                      placeholder={
                        loadingCatalogs.value
                          ? messages.users.create.placeholderUserTypeLoading
                          : messages.users.create.placeholderUserType
                      }
                      disabled={!selectedPerson.value || loadingCatalogs.value}
                      invalid={errorField.value === 'userTypeId'}
                      onChange$={(value) => {
                        form.value = {
                          ...form.value,
                          userTypeId: Number(value),
                        };
                      }}
                    />
                  </Field>
                </div>

                <div class="create-user-password">
                  <Checkbox
                    checked={customPassword.value}
                    disabled={!selectedPerson.value}
                    onChange$={(event) => {
                      const checked = (event.target as HTMLInputElement)
                        .checked;
                      customPassword.value = checked;

                      if (!checked) {
                        form.value = { ...form.value, password: undefined };
                      }
                    }}
                  >
                    {messages.users.create.assignPasswordCheckbox}
                  </Checkbox>

                  {customPassword.value ? (
                    <div class="create-user-password__field">
                      <Field
                        label={messages.users.create.fieldPasswordLabel}
                        required
                      >
                        <Input
                          iconLeft="lock"
                          type={showPassword.value ? 'text' : 'password'}
                          value={form.value.password ?? ''}
                          placeholder={
                            messages.users.create.passwordPlaceholder
                          }
                          onInput$={(event) => {
                            form.value = {
                              ...form.value,
                              password: (event.target as HTMLInputElement)
                                .value,
                            };
                          }}
                        />
                      </Field>
                      <Button
                        type="button"
                        variant="ghost"
                        iconLeft={showPassword.value ? 'lock' : 'view'}
                        onClick$={() => {
                          showPassword.value = !showPassword.value;
                        }}
                      >
                        {showPassword.value
                          ? messages.users.create.passwordHide
                          : messages.users.create.passwordShow}
                      </Button>
                    </div>
                  ) : (
                    <p>
                      <AppIcon intent="lock" size="sm" />
                      {messages.users.create.autoPasswordHint}
                    </p>
                  )}
                </div>
              </div>
            </Panel>

            <Panel
              title={messages.users.create.panelPhotoTitle}
              description={messages.users.create.panelPhotoDescription}
              density="compact"
            >
              <div class="create-user-photo">
                <div class="create-user-photo__preview">
                  {photoPreview.value ? (
                    <img src={photoPreview.value} alt="Vista previa" />
                  ) : (
                    <AppIcon intent="person" size="lg" />
                  )}
                </div>
                <div>
                  <input
                    id="user-photo"
                    class="create-user-photo__input"
                    type="file"
                    accept="image/png,image/jpeg"
                    disabled={!selectedPerson.value}
                    onChange$={(event) => {
                      const file = (event.target as HTMLInputElement)
                        .files?.[0];
                      if (!file) return;
                      photoFile.value = file;
                      photoPreview.value = URL.createObjectURL(file);
                    }}
                  />
                  <label class="create-user-photo__button" for="user-photo">
                    {photoFile.value
                      ? messages.users.create.photoChange
                      : messages.users.create.photoSelect}
                  </label>
                  {photoFile.value && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick$={() => {
                        photoFile.value = null;
                        photoPreview.value = '';
                      }}
                    >
                      {messages.users.create.photoRemove}
                    </Button>
                  )}
                </div>
              </div>
            </Panel>
          </div>
        )}

        {!success.value && (
          <div class="create-user-actions">
            <Button
              variant="secondary"
              onClick$={async () => await nav('/users')}
            >
              {messages.users.create.actionCancel}
            </Button>
            <Button
              iconLeft="save"
              loading={saving.value}
              disabled={!selectedPerson.value || saving.value}
              onClick$={createUser$}
            >
              {messages.users.create.actionCreate}
            </Button>
          </div>
        )}
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Crear usuario`,
};

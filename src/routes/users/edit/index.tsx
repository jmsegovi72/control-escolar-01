import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useLocation, useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { UserSearchPanel } from '~/components/users';
import { appConfig } from '~/config/app.config';
import { messages } from '~/config/messages';
import { catalogService } from '~/services/catalog/catalog.service';
import { userService } from '~/services/user/user.service';
import type { Role, UserType } from '~/types/catalog.types';
import type { UserListItem } from '~/types/user.types';
import {
  Avatar,
  Button,
  Field,
  Input,
  PageReturn,
  Panel,
  Select,
  Toast,
  Toolbar,
} from '~/ui';
import { normalizeError } from '~/utils/api-error';
import { resolvePhotoUrl } from '~/utils/user-photo';
import { usersWorkflow } from '~/utils/users-workflow';
import './edit.css';

export default component$(() => {
  const nav = useNavigate();
  const location = useLocation();
  const user = useSignal<UserListItem | null>(null);
  const loading = useSignal(true);
  const saving = useSignal(false);
  const error = useSignal('');
  const errorField = useSignal('');
  const success = useSignal(false);
  const roles = useSignal<Role[]>([]);
  const userTypes = useSignal<UserType[]>([]);
  const selectionMode = useSignal(false);
  const returnPath = useSignal('/users');

  const username = useSignal('');
  const roleId = useSignal(0);
  const userTypeId = useSignal(0);
  const photoFile = useSignal<File | null>(null);
  const photoPreview = useSignal('');

  useVisibleTask$(async ({ track }) => {
    const idParam = track(() => location.url.searchParams.get('id'));
    const sourceParam = track(() => location.url.searchParams.get('source'));

    loading.value = true;
    error.value = '';
    selectionMode.value = false;
    returnPath.value = '/users';

    if (sourceParam === 'table') {
      returnPath.value = usersWorkflow.getReturnPath();
    }

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
      loading.value = false;
      return;
    }

    const id = idParam ? Number(idParam) : 0;

    if (!id) {
      user.value = null;
      selectionMode.value = true;
      loading.value = false;
      return;
    }

    try {
      const selectedUser = usersWorkflow.getSelectedUser();
      if (sourceParam === 'table' && selectedUser && selectedUser.id === id) {
        user.value = selectedUser;
      } else {
        user.value = await userService.findById(id);
      }

      if (user.value) {
        username.value = user.value.username;
        roleId.value = user.value.roleId;
        userTypeId.value = user.value.userTypeId;
        photoPreview.value = resolvePhotoUrl(user.value);
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

  const openManualEdit$ = $(async (userId: number) => {
    usersWorkflow.clear();
    await nav(`/users/edit?id=${userId}`);
  });

  const saveChanges$ = $(async () => {
    if (!user.value) return;

    error.value = '';
    errorField.value = '';

    if (!username.value.trim()) {
      error.value = messages.users.edit.validationUsername;
      errorField.value = 'username';
      return;
    }

    if (!roleId.value) {
      error.value = messages.users.edit.validationRole;
      errorField.value = 'roleId';
      return;
    }

    if (!userTypeId.value) {
      error.value = messages.users.edit.validationUserType;
      errorField.value = 'userTypeId';
      return;
    }

    saving.value = true;

    try {
      await userService.updateUser(user.value.id, {
        username: username.value.trim(),
        roleId: roleId.value,
        userTypeId: userTypeId.value,
      });

      if (photoFile.value) {
        await userService.uploadPhoto(user.value.id, photoFile.value);
      }

      success.value = true;
      setTimeout(async () => {
        await nav(returnPath.value);
      }, 1500);
    } catch (err) {
      const normalized = normalizeError(err, messages.errors.saveChangesFailed);
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

  const currentUser = user.value;

  return (
    <AuthenticatedShell
      eyebrow={messages.users.edit.eyebrow}
      title={messages.users.edit.title}
      description={messages.users.edit.description}
      meta={messages.users.edit.meta}
      allowedUserTypes={['SUPER']}
      accessDeniedDescription={messages.users.edit.accessDenied}
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
        <span q:slot="center">{messages.users.edit.toolbarCenter}</span>
      </Toolbar>

      <div class="edit-user-page">
        <PageReturn
          eyebrow={messages.users.edit.pageReturnEyebrow}
          title={messages.users.edit.title}
          buttonLabel={messages.users.edit.pageReturnLabel}
          onClick$={goBack$}
        />

        {error.value && (
          <Toast tone="danger" title={messages.users.common.errorToastTitle}>
            {error.value}
          </Toast>
        )}

        {success.value && (
          <Toast tone="success" title={messages.users.edit.successToastTitle}>
            {messages.users.edit.successToastDescription}
          </Toast>
        )}

        {loading.value && (
          <Panel
            title={messages.users.common.loadingTitle}
            description={messages.users.common.loadingDescription}
          >
            <div class="edit-user__loading" />
          </Panel>
        )}

        {!loading.value && selectionMode.value && !currentUser && (
          <UserSearchPanel
            title={messages.users.edit.selectionTitle}
            description={messages.users.edit.selectionDescription}
            fieldHint={messages.users.common.fieldUserHint}
            noResultsMessage={messages.users.common.noResultsCriteria}
            badgeField="isActive"
            badgeTrueLabel={messages.users.detail.resultActive}
            badgeFalseLabel={messages.users.detail.resultInactive}
            badgeTrueTone="success"
            badgeFalseTone="danger"
            onSelect$={openManualEdit$}
          />
        )}

        {!loading.value && currentUser && (
          <div class="edit-user-layout">
            <Panel
              title={messages.users.edit.panelPersonTitle}
              description={messages.users.edit.panelPersonDescription}
            >
              <div class="edit-user-person">
                <Avatar
                  src={resolvePhotoUrl(currentUser)}
                  name={currentUser.fullName}
                  size="sm"
                />
                <div>
                  <strong>{currentUser.fullName}</strong>
                  <span>{currentUser.username}</span>
                  <small>ID registro: {currentUser.id}</small>
                </div>
              </div>
            </Panel>

            <Panel
              title={messages.users.edit.panelAccessTitle}
              description={messages.users.edit.panelAccessDescription}
            >
              <div class="edit-user-form">
                <Field
                  label={messages.users.edit.labelUsername}
                  error={
                    errorField.value === 'username'
                      ? messages.users.edit.errorUsernameInvalid
                      : undefined
                  }
                >
                  <Input
                    iconLeft="mail"
                    value={username.value}
                    invalid={errorField.value === 'username'}
                    placeholder={messages.users.edit.placeholderUsername}
                    onInput$={(event) => {
                      username.value = (event.target as HTMLInputElement).value;
                    }}
                  />
                </Field>

                <div class="edit-user-grid">
                  <Field
                    label={messages.users.edit.labelRole}
                    error={
                      errorField.value === 'roleId'
                        ? messages.users.edit.errorRoleRequired
                        : undefined
                    }
                  >
                    <Select
                      iconLeft="user-settings"
                      value={roleId.value ? String(roleId.value) : ''}
                      options={roleOptions}
                      placeholder={messages.users.edit.placeholderRole}
                      invalid={errorField.value === 'roleId'}
                      onChange$={(value) => {
                        roleId.value = Number(value);
                      }}
                    />
                  </Field>

                  <Field
                    label={messages.users.edit.labelUserType}
                    error={
                      errorField.value === 'userTypeId'
                        ? messages.users.edit.errorUserTypeRequired
                        : undefined
                    }
                  >
                    <Select
                      iconLeft="person"
                      value={userTypeId.value ? String(userTypeId.value) : ''}
                      options={userTypeOptions}
                      placeholder={messages.users.edit.placeholderUserType}
                      invalid={errorField.value === 'userTypeId'}
                      onChange$={(value) => {
                        userTypeId.value = Number(value);
                      }}
                    />
                  </Field>
                </div>
              </div>
            </Panel>

            <Panel
              title={messages.users.edit.panelPhotoTitle}
              description={messages.users.edit.panelPhotoDescription}
            >
              <div class="edit-user-photo">
                <div class="edit-user-photo__preview">
                  <img src={photoPreview.value} alt="Vista previa" />
                </div>
                <div>
                  <input
                    id="user-photo"
                    class="edit-user-photo__input"
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange$={(event) => {
                      const file = (event.target as HTMLInputElement)
                        .files?.[0];
                      if (!file) return;
                      photoFile.value = file;
                      photoPreview.value = URL.createObjectURL(file);
                    }}
                  />
                  <label class="edit-user-photo__button" for="user-photo">
                    {photoPreview.value
                      ? messages.users.edit.photoChange
                      : messages.users.edit.photoUpload}
                  </label>
                  {photoFile.value && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick$={() => {
                        photoFile.value = null;
                        photoPreview.value = resolvePhotoUrl(currentUser);
                      }}
                    >
                      {messages.users.edit.photoRestore}
                    </Button>
                  )}
                </div>
              </div>
            </Panel>

            <div class="edit-user-actions">
              <Button variant="secondary" onClick$={goBack$}>
                {messages.users.edit.actionCancel}
              </Button>
              <Button
                iconLeft="save"
                loading={saving.value}
                onClick$={saveChanges$}
              >
                {messages.users.edit.actionSave}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Editar usuario`,
};

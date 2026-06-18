import {
  $,
  component$,
  useSignal,
  useTask$,
  useVisibleTask$,
} from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useLocation, useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { PersonSearchPanel } from '~/components/persons';
import { appConfig } from '~/config/app.config';
import { ENV } from '~/config/env';
import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
import { personService } from '~/services/person/person.service';
import type { PersonDetail } from '~/types/person.types';
import {
  ActionHeader,
  Button,
  DateInput,
  Field,
  Input,
  Panel,
  Select,
  Toast,
} from '~/ui';
import { AppIcon } from '~/ui/icons';
import { normalizeError } from '~/utils/api-error';
import {
  CURP_REGEX,
  CURP_STATE_MAP,
  CURP_STATE_OPTIONS,
  extractDataFromCURP,
} from '~/utils/curp';
import '../create/create.css';
import './edit.css';

const DEFAULT_PERSON_AVATAR = '/avatars/user-default.svg';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;

const m = messages.persons.edit;
const mc = messages.persons.create;

const getPhotoUrl = (photoUrl: string | null | undefined): string => {
  if (!photoUrl) return DEFAULT_PERSON_AVATAR;
  if (photoUrl.startsWith('http')) return photoUrl;
  const apiBase = ENV.API_URL.replace(/\/sices\/v\d+$/, '');
  return `${apiBase}/${photoUrl.replace(/^\/+/, '')}`;
};

const getDerivedValuesFromCurp = (value: string) => {
  const extracted = extractDataFromCURP(value);
  return {
    gender: extracted.gender,
    birthDate: extracted.birthDate.toISOString().split('T')[0],
    nationality: extracted.nationality,
    stateCode: extracted.stateCode,
    stateLabel: CURP_STATE_MAP[extracted.stateCode] ?? '',
  };
};

const normalizeBirthDate = (value?: string) => {
  if (!value) return '';
  return value.includes('/') ? value.split('/').reverse().join('-') : value;
};

export default component$(() => {
  const nav = useNavigate();
  const location = useLocation();

  const person = useSignal<PersonDetail | null>(null);
  const loading = useSignal(true);
  const noSelection = useSignal(false);
  const saving = useSignal(false);
  const error = useSignal('');
  const errorField = useSignal('');
  const success = useSignal(false);

  const originalCurp = useSignal('');
  const curpEditable = useSignal(false);
  const curp = useSignal('');
  const curpError = useSignal('');
  const gender = useSignal('');
  const birthDate = useSignal('');
  const nationality = useSignal('');
  const stateCode = useSignal('');

  const firstName = useSignal('');
  const firstLastName = useSignal('');
  const secondLastName = useSignal('');
  const homoclave = useSignal('');
  const phone = useSignal('');
  const email = useSignal('');

  const photoFile = useSignal<File | null>(null);
  const photoPreview = useSignal('');

  const genderOptions = [
    { value: 'H', label: mc.optionMale },
    { value: 'M', label: mc.optionFemale },
  ];

  const nationalityOptions = [
    { value: 'M', label: mc.optionMexican },
    { value: 'NE', label: mc.optionForeigner },
  ];

  useTask$(({ track }) => {
    const editable = track(() => curpEditable.value);
    const rawValue = track(() => curp.value);
    const trimmed = rawValue.trim();

    if (!editable) {
      curpError.value = '';
      return;
    }

    curpError.value = '';

    if (!trimmed) {
      gender.value = '';
      birthDate.value = '';
      nationality.value = '';
      stateCode.value = '';
      return;
    }

    if (trimmed.length < 18) return;

    if (trimmed.length > 18) {
      curpError.value = mc.curpErrorLength;
      return;
    }

    if (!CURP_REGEX.test(trimmed)) {
      curpError.value = mc.curpErrorFormat;
      return;
    }

    try {
      const derived = getDerivedValuesFromCurp(trimmed);
      gender.value = derived.gender;
      birthDate.value = derived.birthDate;
      nationality.value = derived.nationality;
      stateCode.value = derived.stateCode;
    } catch {
      curpError.value = mc.curpErrorDate;
    }
  });

  useVisibleTask$(async ({ track }) => {
    const idParam = track(() => location.url.searchParams.get('id'));

    loading.value = true;
    error.value = '';
    success.value = false;

    const id = idParam ? Number(idParam) : 0;

    if (!id) {
      person.value = null;
      noSelection.value = true;
      loading.value = false;
      return;
    }

    noSelection.value = false;

    try {
      const data = await personService.findOne(id);
      person.value = data;

      originalCurp.value = data.curp;
      curpEditable.value = false;
      curp.value = data.curp;
      curpError.value = '';
      firstName.value = data.firstName;
      firstLastName.value = data.firstLastName;
      secondLastName.value = data.secondLastName ?? '';
      homoclave.value =
        data.rfc && data.rfc.length === 13 ? data.rfc.substring(10) : '';
      phone.value = data.phone ?? '';
      email.value = data.personalEmail ?? '';

      const derived = getDerivedValuesFromCurp(data.curp);
      gender.value = data.gender ?? derived.gender;
      birthDate.value = normalizeBirthDate(data.birthDate) || derived.birthDate;
      nationality.value = data.nationality ?? derived.nationality;
      stateCode.value = derived.stateCode;

      photoFile.value = null;
      photoPreview.value = '';
    } catch (err) {
      person.value = null;
      error.value = normalizeError(
        err,
        messages.errors.loadPersonDetailFailed,
      ).message;
    } finally {
      loading.value = false;
    }
  });

  const clearFieldError$ = $((field: string) => {
    if (errorField.value === field) {
      errorField.value = '';
      error.value = '';
    }
  });

  const goBack$ = $(async () => {
    if (person.value?.id) {
      await nav(`${ROUTES.PERSONS_DETAIL}?id=${person.value.id}`);
      return;
    }

    await nav(ROUTES.PERSONS);
  });

  const saveChanges$ = $(async () => {
    if (!person.value) return;

    error.value = '';
    errorField.value = '';
    success.value = false;

    const trimmedCurp = curp.value.trim().toUpperCase();
    const fn = firstName.value.trim().toUpperCase();
    const fln = firstLastName.value.trim().toUpperCase();
    const sln = secondLastName.value.trim().toUpperCase();
    const p = phone.value.trim();
    const em = email.value.trim();

    if (!trimmedCurp || trimmedCurp.length !== 18) {
      error.value = mc.curpErrorLength;
      errorField.value = 'curp';
      return;
    }
    if (!CURP_REGEX.test(trimmedCurp)) {
      error.value = mc.curpErrorFormat;
      errorField.value = 'curp';
      return;
    }

    try {
      const derived = getDerivedValuesFromCurp(trimmedCurp);
      gender.value = derived.gender;
      birthDate.value = derived.birthDate;
      nationality.value = derived.nationality;
      stateCode.value = derived.stateCode;
    } catch {
      error.value = mc.curpErrorDate;
      errorField.value = 'curp';
      return;
    }

    if (!fn || fn.length < 2 || fn.length > 45) {
      error.value = mc.errorFirstNameRequired;
      errorField.value = 'firstName';
      return;
    }
    if (!fln || fln.length < 2 || fln.length > 25) {
      error.value = mc.errorFirstLastNameRequired;
      errorField.value = 'firstLastName';
      return;
    }
    if (sln && sln.length > 25) {
      error.value = mc.errorSecondLastNameLength;
      errorField.value = 'secondLastName';
      return;
    }
    if (!p) {
      error.value = mc.errorPhoneRequired;
      errorField.value = 'phone';
      return;
    }
    if (!PHONE_REGEX.test(p)) {
      error.value = mc.errorPhoneInvalid;
      errorField.value = 'phone';
      return;
    }
    if (!em) {
      error.value = mc.errorEmailRequired;
      errorField.value = 'email';
      return;
    }
    if (!EMAIL_REGEX.test(em)) {
      error.value = mc.errorEmailInvalid;
      errorField.value = 'email';
      return;
    }

    saving.value = true;

    try {
      if (trimmedCurp !== originalCurp.value) {
        try {
          const existing = await personService.findOne(trimmedCurp);
          if (existing.id !== person.value.id) {
            error.value = mc.curpErrorDuplicate;
            errorField.value = 'curp';
            saving.value = false;
            return;
          }
        } catch (err) {
          const normalized = normalizeError(err, '');
          if (normalized.statusCode !== 404) {
            error.value = mc.curpErrorCheck;
            errorField.value = 'curp';
            saving.value = false;
            return;
          }
        }
      }

      await personService.update(person.value.id, {
        ...(trimmedCurp !== originalCurp.value && { curp: trimmedCurp }),
        firstName: fn,
        firstLastName: fln,
        ...(sln && { secondLastName: sln }),
        gender: gender.value as 'H' | 'M',
        phone: p,
        email: em,
        ...(birthDate.value && { birthDate: birthDate.value }),
        ...(nationality.value && { nationality: nationality.value }),
        ...(homoclave.value.trim() && {
          homoclave: homoclave.value.trim().toUpperCase(),
        }),
      });

      if (photoFile.value) {
        try {
          await personService.uploadPhoto(person.value.id, photoFile.value);
        } catch {
          // La foto es opcional; si falla, no bloquea la edicion principal.
        }
      }

      originalCurp.value = trimmedCurp;
      curp.value = trimmedCurp;
      curpEditable.value = false;
      curpError.value = '';

      person.value = {
        ...person.value,
        curp: trimmedCurp,
        firstName: fn,
        firstLastName: fln,
        secondLastName: sln || undefined,
        fullName: [fn, fln, sln].filter(Boolean).join(' '),
        gender: gender.value as 'H' | 'M',
        birthDate: birthDate.value || undefined,
        nationality: nationality.value || undefined,
        phone: p,
        personalEmail: em,
        photoUrl: photoPreview.value || person.value.photoUrl,
      };

      success.value = true;
    } catch (err) {
      const normalized = normalizeError(
        err,
        messages.errors.updatePersonFailed,
      );
      error.value = normalized.message;
      errorField.value = normalized.invalidField ?? '';
    } finally {
      saving.value = false;
    }
  });

  const currentPerson = person.value;
  const currentPhoto =
    photoPreview.value || getPhotoUrl(currentPerson?.photoUrl);

  return (
    <AuthenticatedShell
      eyebrow={m.eyebrow}
      title={m.title}
      description={m.description}
      meta={m.meta}
      allowedUserTypes={['SUPER', 'CE']}
      accessDeniedDescription={m.accessDenied}
      fullWidth
    >
      <ActionHeader q:slot="hub-header" title={m.title} onBack$={goBack$} />

      <div class="edit-person-page">
        <div class="edit-person__content">
          {loading.value && (
            <Panel title={m.loadingTitle} description={m.loadingDescription}>
              <div class="edit-person__loading" />
            </Panel>
          )}

          {!loading.value && noSelection.value && (
            <div class="edit-person__search-shell">
              <PersonSearchPanel
                title={m.selectionTitle}
                description={m.selectionDescription}
                fieldHint={m.fieldPersonHint}
                noResultsMessage={m.noResultsCriteria}
                onSelect$={async (personId) => {
                  await nav(`${ROUTES.PERSONS_EDIT}?id=${personId}`);
                }}
              />
            </div>
          )}

          {!loading.value && currentPerson && (
            <div class="create-person-card">
              <div class="create-person-layout">
                {error.value && (
                  <Toast
                    tone="danger"
                    title={messages.persons.common.errorToastTitle}
                    description={error.value}
                  />
                )}

                {success.value && (
                  <Toast
                    tone="success"
                    title={m.successToastTitle}
                    description={m.successToastDescription}
                  />
                )}

                <Panel
                  icon="person"
                  title={mc.panelIdTitle}
                  description={mc.panelIdDescription}
                >
                  <div class="create-person-form">
                    {!curpEditable.value ? (
                      <div class="create-person-curp-readonly">
                        <strong>{curp.value}</strong>
                        <Button
                          variant="link"
                          size="sm"
                          onClick$={() => {
                            curpEditable.value = true;
                            errorField.value = '';
                            error.value = '';
                            curpError.value = '';
                          }}
                        >
                          {mc.actionChangeCurp}
                        </Button>
                      </div>
                    ) : (
                      <Field
                        label={mc.labelCurp}
                        required
                        hint={!curpError.value ? mc.hintCurp : undefined}
                        error={
                          errorField.value === 'curp'
                            ? error.value || curpError.value
                            : curpError.value || undefined
                        }
                      >
                        <div class="create-person-curp-field">
                          <Input
                            variant="line"
                            value={curp.value}
                            placeholder={mc.placeholderCurp}
                            maxLength={18}
                            invalid={
                              errorField.value === 'curp' || !!curpError.value
                            }
                            onInput$={(e) => {
                              curp.value = (
                                e.target as HTMLInputElement
                              ).value.toUpperCase();
                              clearFieldError$('curp');
                              curpError.value = '';
                            }}
                          />
                          <span
                            class="create-person-curp-field__count"
                            data-complete={
                              curp.value.length === 18 ? 'true' : 'false'
                            }
                          >
                            {curp.value.length}/18
                          </span>
                        </div>
                      </Field>
                    )}

                    <Field label={mc.labelHomoclave} hint={mc.hintHomoclave}>
                      <Input
                        variant="line"
                        value={homoclave.value}
                        placeholder={mc.placeholderHomoclave}
                        onInput$={(e) => {
                          const raw = (e.target as HTMLInputElement).value;
                          homoclave.value = raw
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, '')
                            .slice(0, 3);
                        }}
                      />
                    </Field>

                    <div class="create-person-derived">
                      <p class="create-person-derived__title">
                        {mc.derivedSectionTitle}
                      </p>
                      <div class="create-person-derived-grid">
                        <div class="create-person-derived-item">
                          <span>{mc.labelGender}</span>
                          <Select
                            variant="line"
                            value={gender.value}
                            options={genderOptions}
                            readOnly
                            invalid={errorField.value === 'gender'}
                            onChange$={(v) => {
                              gender.value = v;
                              clearFieldError$('gender');
                            }}
                          />
                        </div>

                        <div class="create-person-derived-item">
                          <span>{mc.labelBirthDate}</span>
                          <DateInput
                            variant="line"
                            value={birthDate.value}
                            readOnly
                            onInput$={(e) => {
                              birthDate.value = (
                                e.target as HTMLInputElement
                              ).value;
                            }}
                          />
                        </div>

                        <div class="create-person-derived-item">
                          <span>{mc.labelNationality}</span>
                          <Select
                            variant="line"
                            value={nationality.value}
                            options={nationalityOptions}
                            readOnly
                            onChange$={(v) => {
                              nationality.value = v;
                            }}
                          />
                        </div>

                        <div class="create-person-derived-item">
                          <span>{mc.labelState}</span>
                          <Select
                            variant="line"
                            value={stateCode.value}
                            options={CURP_STATE_OPTIONS}
                            readOnly
                            onChange$={(v) => {
                              stateCode.value = v;
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Panel>

                <Panel icon="person" title={mc.panelNameTitle}>
                  <div class="create-person-form">
                    <Field
                      label={mc.labelFirstName}
                      required
                      error={
                        errorField.value === 'firstName'
                          ? mc.errorFirstNameRequired
                          : undefined
                      }
                    >
                      <Input
                        variant="line"
                        value={firstName.value}
                        placeholder={mc.placeholderFirstName}
                        invalid={errorField.value === 'firstName'}
                        onInput$={(e) => {
                          firstName.value = (
                            e.target as HTMLInputElement
                          ).value.toUpperCase();
                          clearFieldError$('firstName');
                        }}
                      />
                    </Field>

                    <div class="create-person-grid">
                      <Field
                        label={mc.labelFirstLastName}
                        required
                        error={
                          errorField.value === 'firstLastName'
                            ? mc.errorFirstLastNameRequired
                            : undefined
                        }
                      >
                        <Input
                          variant="line"
                          value={firstLastName.value}
                          placeholder={mc.placeholderFirstLastName}
                          invalid={errorField.value === 'firstLastName'}
                          onInput$={(e) => {
                            firstLastName.value = (
                              e.target as HTMLInputElement
                            ).value.toUpperCase();
                            clearFieldError$('firstLastName');
                          }}
                        />
                      </Field>

                      <Field
                        label={mc.labelSecondLastName}
                        optional
                        error={
                          errorField.value === 'secondLastName'
                            ? mc.errorSecondLastNameLength
                            : undefined
                        }
                      >
                        <Input
                          variant="line"
                          value={secondLastName.value}
                          placeholder={mc.placeholderSecondLastName}
                          invalid={errorField.value === 'secondLastName'}
                          onInput$={(e) => {
                            secondLastName.value = (
                              e.target as HTMLInputElement
                            ).value.toUpperCase();
                            clearFieldError$('secondLastName');
                          }}
                        />
                      </Field>
                    </div>
                  </div>
                </Panel>

                <Panel icon="mail" title={mc.panelContactTitle}>
                  <div class="create-person-grid">
                    <Field
                      label={mc.labelPhone}
                      required
                      hint={mc.hintPhone}
                      error={
                        errorField.value === 'phone'
                          ? phone.value
                            ? mc.errorPhoneInvalid
                            : mc.errorPhoneRequired
                          : undefined
                      }
                    >
                      <Input
                        variant="line"
                        iconLeft="phone"
                        type="tel"
                        value={phone.value}
                        placeholder={mc.placeholderPhone}
                        invalid={errorField.value === 'phone'}
                        onInput$={(e) => {
                          phone.value = (e.target as HTMLInputElement).value
                            .replace(/\D/g, '')
                            .slice(0, 10);
                          clearFieldError$('phone');
                        }}
                      />
                    </Field>

                    <Field
                      label={mc.labelEmail}
                      required
                      error={
                        errorField.value === 'email'
                          ? email.value
                            ? mc.errorEmailInvalid
                            : mc.errorEmailRequired
                          : undefined
                      }
                    >
                      <Input
                        variant="line"
                        iconLeft="mail"
                        type="email"
                        value={email.value}
                        placeholder={mc.placeholderEmail}
                        invalid={errorField.value === 'email'}
                        onInput$={(e) => {
                          email.value = (e.target as HTMLInputElement).value;
                          clearFieldError$('email');
                        }}
                      />
                    </Field>
                  </div>
                </Panel>

                <Panel
                  icon="person"
                  title={mc.panelPhotoTitle}
                  description={m.panelPhotoDescription}
                >
                  <div class="create-person-photo">
                    <div class="create-person-photo__preview">
                      {currentPhoto !== DEFAULT_PERSON_AVATAR ? (
                        <img src={currentPhoto} alt={currentPerson.fullName} />
                      ) : (
                        <AppIcon intent="person" size="lg" />
                      )}
                    </div>
                    <div class="create-person-photo__controls">
                      <input
                        id="person-photo-edit"
                        class="create-person-photo__input"
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
                      <label
                        class="create-person-photo__button"
                        for="person-photo-edit"
                      >
                        {photoFile.value ? m.photoChange : m.photoUpload}
                      </label>
                      <span>{mc.photoHint}</span>
                      {photoFile.value && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick$={() => {
                            photoFile.value = null;
                            photoPreview.value = '';
                          }}
                        >
                          {m.photoRestore}
                        </Button>
                      )}
                    </div>
                  </div>
                </Panel>

                <div class="create-person-actions">
                  <Button variant="secondary" onClick$={goBack$}>
                    {m.actionCancel}
                  </Button>
                  <Button
                    iconRight="chevron-right"
                    loading={saving.value}
                    onClick$={saveChanges$}
                  >
                    {m.actionSave}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Editar persona`,
};

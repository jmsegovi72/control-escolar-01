import { $, component$, useSignal, useTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { appConfig } from '~/config/app.config';
import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
import { personService } from '~/services/person/person.service';
import type { ViewPerson } from '~/types/person.types';
import {
  ActionHeader,
  Button,
  DateInput,
  Field,
  Input,
  Panel,
  Select,
  StepIndicator,
  Toast,
} from '~/ui';
import { CreateResult, CreateResultRow } from '~/ui/composed/CreateResult';
import { AppIcon } from '~/ui/icons';
import { normalizeError } from '~/utils/api-error';
import {
  CURP_REGEX,
  CURP_STATE_OPTIONS,
  type CurpData,
  extractDataFromCURP,
} from '~/utils/curp';
import './create.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;

const m = messages.persons.create;

export default component$(() => {
  const nav = useNavigate();

  // Resultado del backend
  const address = useSignal<ViewPerson | null>(null);

  const curp = useSignal('');
  const curpValidating = useSignal(false);
  const curpValid = useSignal(false);
  const curpError = useSignal('');

  const showForm = useSignal(false);
  const resultTone = useSignal<'success' | 'error' | ''>('');

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

  const saving = useSignal(false);
  const error = useSignal('');
  const errorField = useSignal('');
  const photoFile = useSignal<File | null>(null);
  const photoPreview = useSignal('');

  useTask$(({ track, cleanup }) => {
    const value = track(() => curp.value);

    curpValid.value = false;
    curpError.value = '';
    curpValidating.value = false;

    const trimmed = value.trim();

    if (trimmed.length < 18) return;

    if (trimmed.length > 18) {
      curpError.value = m.curpErrorLength;
      return;
    }

    if (!CURP_REGEX.test(trimmed)) {
      curpError.value = m.curpErrorFormat;
      return;
    }

    let extracted: CurpData;
    try {
      extracted = extractDataFromCURP(trimmed);
    } catch {
      curpError.value = m.curpErrorDate;
      return;
    }

    curpValidating.value = true;

    const timer = setTimeout(async () => {
      try {
        await personService.findOne(trimmed);
        curpError.value = m.curpErrorDuplicate;
        curpValidating.value = false;
      } catch (err) {
        const normalized = normalizeError(err, '');
        if (normalized.statusCode === 404) {
          gender.value = extracted.gender;
          birthDate.value = extracted.birthDate.toISOString().split('T')[0];
          nationality.value = extracted.nationality;
          stateCode.value = extracted.stateCode;
          curpValid.value = true;
        } else {
          curpError.value = m.curpErrorCheck;
        }
        curpValidating.value = false;
      }
    }, 600);

    cleanup(() => {
      clearTimeout(timer);
    });
  });

  const resetAll$ = $(() => {
    curp.value = '';
    curpValid.value = false;
    curpError.value = '';
    curpValidating.value = false;
    showForm.value = false;
    resultTone.value = '';
    gender.value = '';
    birthDate.value = '';
    nationality.value = '';
    stateCode.value = '';
    firstName.value = '';
    firstLastName.value = '';
    secondLastName.value = '';
    homoclave.value = '';
    phone.value = '';
    email.value = '';
    error.value = '';
    errorField.value = '';
    photoFile.value = null;
    photoPreview.value = '';
  });

  const clearFieldError$ = $((field: string) => {
    if (errorField.value === field) {
      errorField.value = '';
      error.value = '';
    }
  });

  const createPerson$ = $(async () => {
    error.value = '';
    errorField.value = '';
    resultTone.value = '';

    const fn = firstName.value.trim().toUpperCase();
    const fln = firstLastName.value.trim().toUpperCase();
    const sln = secondLastName.value.trim().toUpperCase();
    const c = curp.value.trim();
    const p = phone.value.trim();
    const em = email.value.trim();

    if (!fn || fn.length < 2 || fn.length > 45) {
      error.value = m.errorFirstNameRequired;
      errorField.value = 'firstName';
      return;
    }
    if (!fln || fln.length < 2 || fln.length > 25) {
      error.value = m.errorFirstLastNameRequired;
      errorField.value = 'firstLastName';
      return;
    }
    if (sln && sln.length > 25) {
      error.value = m.errorSecondLastNameLength;
      errorField.value = 'secondLastName';
      return;
    }
    if (!gender.value) {
      error.value = m.errorGenderRequired;
      errorField.value = 'gender';
      return;
    }
    if (!p) {
      error.value = m.errorPhoneRequired;
      errorField.value = 'phone';
      return;
    }
    if (!PHONE_REGEX.test(p)) {
      error.value = m.errorPhoneInvalid;
      errorField.value = 'phone';
      return;
    }
    if (!em) {
      error.value = m.errorEmailRequired;
      errorField.value = 'email';
      return;
    }
    if (!EMAIL_REGEX.test(em)) {
      error.value = m.errorEmailInvalid;
      errorField.value = 'email';
      return;
    }

    saving.value = true;
    try {
      const created = await personService.create({
        firstName: fn,
        firstLastName: fln,
        ...(sln && { secondLastName: sln }),
        curp: c,
        gender: gender.value as 'H' | 'M',
        phone: p,
        email: em,
        ...(birthDate.value && { birthDate: birthDate.value }),
        ...(nationality.value && { nationality: nationality.value }),
        ...(homoclave.value.trim() && {
          homoclave: homoclave.value.trim().toUpperCase(),
        }),
      });
      if (photoFile.value && created.id) {
        try {
          await personService.uploadPhoto(created.id, photoFile.value);
        } catch {
          // La foto es opcional; si falla, no bloquea el registro principal.
        }
      }
      address.value = created;
      resultTone.value = 'success';
    } catch (err) {
      const normalized = normalizeError(
        err,
        messages.errors.createPersonFailed,
      );
      error.value = normalized.message;
      errorField.value = normalized.invalidField ?? '';
      resultTone.value = 'error';
    } finally {
      saving.value = false;
    }
  });

  const genderOptions = [
    { value: 'H', label: m.optionMale },
    { value: 'M', label: m.optionFemale },
  ];

  const nationalityOptions = [
    { value: 'M', label: m.optionMexican },
    { value: 'NE', label: m.optionForeigner },
  ];

  const currentStep = resultTone.value ? 3 : showForm.value ? 2 : 1;
  const stepTone =
    resultTone.value === 'success'
      ? 'success'
      : resultTone.value === 'error'
        ? 'error'
        : showForm.value
          ? error.value
            ? 'error'
            : undefined
          : curpError.value
            ? 'error'
            : undefined;
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
      <ActionHeader
        q:slot="hub-header"
        title={m.title}
        onBack$={async () => await nav(ROUTES.PERSONS)}
      />

      <StepIndicator
        q:slot="toolbar"
        steps={[
          { eyebrow: m.step1Eyebrow, label: m.step1Label },
          { eyebrow: m.step2Eyebrow, label: m.step2Label },
          { eyebrow: m.step3Eyebrow, label: m.step3Label },
        ]}
        current={currentStep}
        tone={stepTone}
      />

      <div class="create-person-page">
        <div class="create-person-stage">
          {!showForm.value && !resultTone.value && (
            <div class="create-person-card">
              <Panel
                icon="person"
                title={m.curpStepTitle}
                description={m.curpStepDescription}
              >
                <div class="create-person-form">
                  <Field
                    label={m.labelCurp}
                    required
                    hint={
                      !curpError.value &&
                      !curpValid.value &&
                      !curpValidating.value
                        ? m.hintCurp
                        : undefined
                    }
                    error={curpError.value || undefined}
                  >
                    <div class="create-person-curp-field">
                      <Input
                        variant="line"
                        value={curp.value}
                        placeholder={m.placeholderCurp}
                        maxLength={18}
                        invalid={!!curpError.value}
                        onInput$={(e) => {
                          curp.value = (
                            e.target as HTMLInputElement
                          ).value.toUpperCase();
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

                  {curpValidating.value && (
                    <p class="create-person-curp-status">
                      <span class="create-person-spinner" aria-hidden="true" />
                      {m.curpValidatingMsg}
                    </p>
                  )}

                  {curpValid.value && !curpValidating.value && (
                    <p class="create-person-curp-status" data-tone="success">
                      <AppIcon intent="check" size="sm" />
                      {m.curpAvailable}
                    </p>
                  )}

                  <Button
                    fullWidth
                    size="lg"
                    disabled={!curpValid.value || curpValidating.value}
                    loading={curpValidating.value}
                    onClick$={() => {
                      showForm.value = true;
                      error.value = '';
                      errorField.value = '';
                    }}
                  >
                    {m.actionGoToPersonData}
                  </Button>
                </div>
              </Panel>
            </div>
          )}

          {showForm.value && !resultTone.value && (
            <div class="create-person-card">
              <div class="create-person-layout">
                {error.value && !resultTone.value && (
                  <Toast
                    tone="danger"
                    title={messages.persons.common.errorToastTitle}
                    description={error.value}
                  />
                )}

                <Panel
                  icon="person"
                  title={m.panelIdTitle}
                  description={m.panelIdDescription}
                >
                  <div class="create-person-form">
                    <div class="create-person-curp-readonly">
                      <strong>{curp.value}</strong>
                      <Button
                        variant="link"
                        size="sm"
                        onClick$={() => {
                          showForm.value = false;
                          error.value = '';
                          errorField.value = '';
                        }}
                      >
                        {m.actionChangeCurp}
                      </Button>
                    </div>

                    <div class="create-person-derived">
                      <p class="create-person-derived__title">
                        {m.derivedSectionTitle}
                      </p>
                      <div class="create-person-derived-grid">
                        <div class="create-person-derived-item">
                          <span>{m.labelGender}</span>
                          <Select
                            variant="line"
                            value={gender.value}
                            options={genderOptions}
                            invalid={errorField.value === 'gender'}
                            readOnly
                            onChange$={(v) => {
                              gender.value = v;
                              clearFieldError$('gender');
                            }}
                          />
                        </div>

                        <div class="create-person-derived-item">
                          <span>{m.labelBirthDate}</span>
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
                          <span>{m.labelNationality}</span>
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
                          <span>{m.labelState}</span>
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

                <Panel icon="person" title={m.panelNameTitle}>
                  <div class="create-person-form">
                    <Field
                      label={m.labelFirstName}
                      required
                      error={
                        errorField.value === 'firstName'
                          ? m.errorFirstNameRequired
                          : undefined
                      }
                    >
                      <Input
                        variant="line"
                        value={firstName.value}
                        placeholder={m.placeholderFirstName}
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
                        label={m.labelFirstLastName}
                        required
                        error={
                          errorField.value === 'firstLastName'
                            ? m.errorFirstLastNameRequired
                            : undefined
                        }
                      >
                        <Input
                          variant="line"
                          value={firstLastName.value}
                          placeholder={m.placeholderFirstLastName}
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
                        label={m.labelSecondLastName}
                        optional
                        error={
                          errorField.value === 'secondLastName'
                            ? m.errorSecondLastNameLength
                            : undefined
                        }
                      >
                        <Input
                          variant="line"
                          value={secondLastName.value}
                          placeholder={m.placeholderSecondLastName}
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

                <Panel icon="mail" title={m.panelContactTitle}>
                  <div class="create-person-grid">
                    <Field
                      label={m.labelPhone}
                      required
                      hint={m.hintPhone}
                      error={
                        errorField.value === 'phone'
                          ? phone.value
                            ? m.errorPhoneInvalid
                            : m.errorPhoneRequired
                          : undefined
                      }
                    >
                      <Input
                        variant="line"
                        iconLeft="phone"
                        type="tel"
                        value={phone.value}
                        placeholder={m.placeholderPhone}
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
                      label={m.labelEmail}
                      required
                      error={
                        errorField.value === 'email'
                          ? email.value
                            ? m.errorEmailInvalid
                            : m.errorEmailRequired
                          : undefined
                      }
                    >
                      <Input
                        variant="line"
                        iconLeft="mail"
                        type="email"
                        value={email.value}
                        placeholder={m.placeholderEmail}
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
                  title={m.panelPhotoTitle}
                  description={m.panelPhotoDescription}
                >
                  <div class="create-person-photo">
                    <div class="create-person-photo__preview">
                      {photoPreview.value ? (
                        <img src={photoPreview.value} alt={m.photoPreviewAlt} />
                      ) : (
                        <AppIcon intent="person" size="lg" />
                      )}
                    </div>
                    <div class="create-person-photo__controls">
                      <input
                        id="person-photo"
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
                        for="person-photo"
                      >
                        {photoFile.value ? m.photoChange : m.photoSelect}
                      </label>
                      <span>{m.photoHint}</span>
                      {photoFile.value && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick$={() => {
                            photoFile.value = null;
                            photoPreview.value = '';
                          }}
                        >
                          {m.photoRemove}
                        </Button>
                      )}
                    </div>
                  </div>
                </Panel>

                <div class="create-person-actions">
                  <Button variant="secondary" onClick$={resetAll$}>
                    {m.actionCancel}
                  </Button>
                  <Button
                    iconRight="chevron-right"
                    loading={saving.value}
                    onClick$={createPerson$}
                  >
                    {m.actionSave}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {resultTone.value && address.value && (
            <div class="create-person-card">
              <CreateResult
                tone={resultTone.value}
                eyebrow={
                  resultTone.value === 'success'
                    ? m.successEyebrow
                    : m.errorResultEyebrow
                }
                title={
                  resultTone.value === 'success'
                    ? m.successTitle
                    : m.errorResultTitle
                }
                description={
                  resultTone.value === 'success'
                    ? m.successDescription
                    : error.value
                }
                onRetry$={
                  resultTone.value === 'error' ? createPerson$ : undefined
                }
                retryLabel={m.errorRetry}
              >
                <CreateResultRow
                  label={m.resultCurp}
                  value={address.value?.curp}
                />
                <CreateResultRow
                  label={m.resultName}
                  value={address.value?.fullName}
                  fallback={m.resultNoData}
                />
                <CreateResultRow
                  label={m.resultGender}
                  value={
                    address.value?.gender === 'H'
                      ? m.optionMale
                      : address.value?.gender === 'M'
                        ? m.optionFemale
                        : null
                  }
                />
                <CreateResultRow
                  label={m.resultBirthDate}
                  value={
                    address.value?.birthDate
                      ? address.value.birthDate.split('T')[0]
                      : null
                  }
                />
                <CreateResultRow
                  label={m.resultPhone}
                  value={address.value?.phone}
                  fallback={m.resultNoData}
                />
                <CreateResultRow
                  label={m.resultEmail}
                  value={address.value?.personalEmail}
                  fallback={m.resultNoData}
                />

                <div q:slot="actions">
                  {resultTone.value === 'success' ? (
                    <>
                      <Button variant="secondary" onClick$={resetAll$}>
                        {m.successCreateAnother}
                      </Button>
                      <Button
                        iconRight="chevron-right"
                        onClick$={async () => await nav(ROUTES.PERSONS)}
                      >
                        {m.successFinish}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick$={() => {
                        resultTone.value = '';
                        error.value = '';
                      }}
                    >
                      {m.errorBackToForm}
                    </Button>
                  )}
                </div>
              </CreateResult>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Crear persona`,
};

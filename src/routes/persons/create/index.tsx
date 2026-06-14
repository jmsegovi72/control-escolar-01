import { $, component$, useSignal, useTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { appConfig } from '~/config/app.config';
import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
import { personService } from '~/services/person/person.service';
import {
  Button,
  DateInput,
  DerivedField,
  Field,
  Input,
  ModuleHeader,
  Panel,
  Select,
  Toast,
  Toolbar,
} from '~/ui';
import { AppIcon } from '~/ui/icons';
import { normalizeError } from '~/utils/api-error';
import {
  CURP_REGEX,
  CURP_STATE_OPTIONS,
  CurpData,
  extractDataFromCURP,
} from '~/utils/curp';
import './create.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;

const m = messages.persons.create;

export default component$(() => {
  const nav = useNavigate();

  // ── Paso 1: CURP ──
  const curp = useSignal('');
  const curpValidating = useSignal(false);
  const curpValid = useSignal(false);
  const curpError = useSignal('');

  // ── Paso 2: Formulario ──
  const showForm = useSignal(false);

  // Campos derivados de CURP
  const gender = useSignal('');
  const birthDate = useSignal('');
  const nationality = useSignal('');
  const stateCode = useSignal('');

  // Campos manuales
  const firstName = useSignal('');
  const firstLastName = useSignal('');
  const secondLastName = useSignal('');
  const homoclave = useSignal('');
  const phone = useSignal('');
  const email = useSignal('');

  const saving = useSignal(false);
  const error = useSignal('');
  const errorField = useSignal('');
  const success = useSignal(false);
  const photoFile = useSignal<File | null>(null);
  const photoPreview = useSignal('');

  // Validación automática de CURP — mismo patrón que el buscador de personas en users/create
  useTask$(async ({ track }) => {
    const value = track(() => curp.value);

    curpValid.value = false;
    curpError.value = '';

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

    try {
      await personService.findOne(trimmed);
      curpError.value = m.curpErrorDuplicate;
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
    } finally {
      curpValidating.value = false;
    }
  });

  const createPerson$ = $(async () => {
    error.value = '';
    errorField.value = '';

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
          // photo upload failure is non-blocking
        }
      }
      success.value = true;
    } catch (err) {
      const normalized = normalizeError(
        err,
        messages.errors.createPersonFailed,
      );
      error.value = normalized.message;
      errorField.value = normalized.invalidField ?? '';
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

  return (
    <AuthenticatedShell
      eyebrow={m.eyebrow}
      title={m.title}
      description={m.description}
      meta={m.meta}
      allowedUserTypes={['SUPER', 'CE']}
      accessDeniedDescription={m.accessDenied}
    >
      <Toolbar q:slot="toolbar">
        <Button
          q:slot="leading"
          variant="ghost"
          iconLeft="back"
          onClick$={async () => await nav(ROUTES.PERSONS)}
        >
          {m.toolbarBack}
        </Button>
        <span q:slot="center">{m.toolbarCenter}</span>
      </Toolbar>

      <div class="create-person-page">
        <ModuleHeader
          tituloModulo={m.tituloModulo}
          accionActual={m.title}
          onBack$={async () => await nav(ROUTES.PERSONS)}
        />

        {error.value && (
          <Toast
            tone="danger"
            title={messages.persons.common.errorToastTitle}
            description={error.value}
          />
        )}

        {/* ── Estado de éxito ── */}
        {success.value ? (
          <Panel
            eyebrow={m.successEyebrow}
            title={m.successTitle}
            description={m.successDescription}
          >
            <div class="create-person-success">
              <div class="create-person-success__icon" aria-hidden="true">
                <AppIcon intent="success" size="lg" />
              </div>
              <div class="create-person-success__actions">
                <Button
                  variant="secondary"
                  onClick$={async () => await nav(ROUTES.PERSONS)}
                >
                  {m.successFinish}
                </Button>
                <Button
                  iconLeft="add"
                  onClick$={() => {
                    curp.value = '';
                    curpValid.value = false;
                    curpError.value = '';
                    showForm.value = false;
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
                    success.value = false;
                    photoFile.value = null;
                    photoPreview.value = '';
                  }}
                >
                  {m.successCreateAnother}
                </Button>
              </div>
            </div>
          </Panel>
        ) : !showForm.value ? (
          /* ── Paso 1: Verificar CURP ── */
          <Panel title={m.curpStepTitle} description={m.curpStepDescription}>
            <div class="create-person-form">
              <div class="create-person-grid create-person-grid--curp">
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
                  <Input
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
                </Field>
              </div>

              {curpValidating.value && (
                <p class="create-person-curp-status create-person-curp-status--loading">
                  {m.curpValidatingMsg}
                </p>
              )}

              {curpValid.value && !curpValidating.value && (
                <p class="create-person-curp-status create-person-curp-status--valid">
                  <AppIcon intent="check" size="sm" />
                  {m.curpAvailable}
                </p>
              )}
            </div>
          </Panel>
        ) : (
          /* ── Paso 2: Formulario completo ── */
          <div class="create-person-layout">
            {/* Panel: Identificación */}
            <Panel title={m.panelIdTitle} description={m.panelIdDescription}>
              <div class="create-person-form">
                {/* CURP (readonly) + Homoclave */}
                <div class="create-person-grid create-person-grid--curp">
                  <Field label={m.labelCurp}>
                    <Input value={curp.value} disabled />
                  </Field>

                  <Field label={m.labelHomoclave} hint={m.hintHomoclave}>
                    <Input
                      value={homoclave.value}
                      placeholder={m.placeholderHomoclave}
                      onInput$={(e) => {
                        const raw = (e.target as HTMLInputElement).value;
                        homoclave.value = raw
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, '')
                          .slice(0, 3);
                      }}
                    />
                  </Field>
                </div>

                {/* Datos derivados de CURP */}
                <div class="create-person-derived">
                  <p class="create-person-derived__title">
                    {m.derivedSectionTitle}
                  </p>

                  <div class="create-person-derived-grid">
                    <DerivedField label={m.labelGender} optional>
                      <Select
                        value={gender.value}
                        options={genderOptions}
                        invalid={errorField.value === 'gender'}
                        onChange$={(v) => {
                          gender.value = v;
                        }}
                      />
                    </DerivedField>

                    <DerivedField label={m.labelBirthDate} optional>
                      <DateInput
                        value={birthDate.value}
                        onInput$={(e) => {
                          birthDate.value = (
                            e.target as HTMLInputElement
                          ).value;
                        }}
                      />
                    </DerivedField>

                    <DerivedField label={m.labelNationality} optional>
                      <Select
                        value={nationality.value}
                        options={nationalityOptions}
                        onChange$={(v) => {
                          nationality.value = v;
                        }}
                      />
                    </DerivedField>

                    <DerivedField label={m.labelState} optional>
                      <Select
                        value={stateCode.value}
                        options={CURP_STATE_OPTIONS}
                        onChange$={(v) => {
                          stateCode.value = v;
                        }}
                      />
                    </DerivedField>
                  </div>
                </div>
              </div>
            </Panel>

            {/* Panel: Nombre */}
            <Panel
              title={m.panelNameTitle}
              description={m.panelNameDescription}
            >
              <div class="create-person-form">
                <div class="create-person-grid create-person-grid--thirds">
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
                      iconLeft="person"
                      value={firstName.value}
                      placeholder={m.placeholderFirstName}
                      invalid={errorField.value === 'firstName'}
                      onInput$={(e) => {
                        firstName.value = (
                          e.target as HTMLInputElement
                        ).value.toUpperCase();
                      }}
                    />
                  </Field>

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
                      iconLeft="person"
                      value={firstLastName.value}
                      placeholder={m.placeholderFirstLastName}
                      invalid={errorField.value === 'firstLastName'}
                      onInput$={(e) => {
                        firstLastName.value = (
                          e.target as HTMLInputElement
                        ).value.toUpperCase();
                      }}
                    />
                  </Field>

                  <Field
                    label={m.labelSecondLastName}
                    hint={m.hintSecondLastName}
                    error={
                      errorField.value === 'secondLastName'
                        ? m.errorSecondLastNameLength
                        : undefined
                    }
                  >
                    <Input
                      iconLeft="person"
                      value={secondLastName.value}
                      placeholder={m.placeholderSecondLastName}
                      invalid={errorField.value === 'secondLastName'}
                      onInput$={(e) => {
                        secondLastName.value = (
                          e.target as HTMLInputElement
                        ).value.toUpperCase();
                      }}
                    />
                  </Field>
                </div>
              </div>
            </Panel>

            {/* Panel: Contacto */}
            <Panel
              title={m.panelContactTitle}
              description={m.panelContactDescription}
            >
              <div class="create-person-form">
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
                      iconLeft="phone"
                      type="tel"
                      value={phone.value}
                      placeholder={m.placeholderPhone}
                      invalid={errorField.value === 'phone'}
                      onInput$={(e) => {
                        phone.value = (e.target as HTMLInputElement).value
                          .replace(/\D/g, '')
                          .slice(0, 10);
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
                      iconLeft="mail"
                      type="email"
                      value={email.value}
                      placeholder={m.placeholderEmail}
                      invalid={errorField.value === 'email'}
                      onInput$={(e) => {
                        email.value = (e.target as HTMLInputElement).value;
                      }}
                    />
                  </Field>
                </div>
              </div>
            </Panel>

            {/* Panel: Foto */}
            <Panel
              title={m.panelPhotoTitle}
              description={m.panelPhotoDescription}
              density="compact"
            >
              <div class="create-person-photo">
                <div class="create-person-photo__preview">
                  {photoPreview.value ? (
                    <img src={photoPreview.value} alt="Vista previa" />
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
                  <label class="create-person-photo__button" for="person-photo">
                    {photoFile.value ? m.photoChange : m.photoSelect}
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
                      {m.photoRemove}
                    </Button>
                  )}
                </div>
              </div>
            </Panel>
          </div>
        )}

        {/* ── Botonera ── */}
        {!success.value && (
          <div class="create-person-actions">
            <Button
              variant="secondary"
              onClick$={async () => {
                if (showForm.value) {
                  showForm.value = false;
                  error.value = '';
                  errorField.value = '';
                } else {
                  await nav(ROUTES.PERSONS);
                }
              }}
            >
              {m.actionCancel}
            </Button>

            {!showForm.value ? (
              <Button
                iconLeft="person"
                disabled={!curpValid.value || curpValidating.value}
                loading={curpValidating.value}
                onClick$={() => {
                  showForm.value = true;
                  error.value = '';
                  errorField.value = '';
                }}
              >
                {m.actionRegister}
              </Button>
            ) : (
              <Button
                iconLeft="save"
                loading={saving.value}
                onClick$={createPerson$}
              >
                {m.actionSave}
              </Button>
            )}
          </div>
        )}
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Crear persona`,
};

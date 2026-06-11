import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useLocation, useNavigate } from '@builder.io/qwik-city';

import { AuthenticatedShell } from '~/components/layout/AuthenticatedShell/AuthenticatedShell';
import { PersonSearchPanel } from '~/components/persons';
import { appConfig } from '~/config/app.config';
import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
import { personService } from '~/services/person/person.service';
import type { PersonListItem } from '~/types/person.types';
import {
  Button,
  DerivedField,
  Field,
  Input,
  PageReturn,
  Panel,
  Toast,
  Toolbar,
} from '~/ui';
import { AppIcon } from '~/ui/icons';
import { normalizeError } from '~/utils/api-error';
import './edit.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;

const m = messages.persons.edit;
const mc = messages.persons.create;

const CURP_STATE_MAP: Record<string, string> = {
  AS: 'Aguascalientes', BC: 'Baja California', BS: 'Baja California Sur',
  CC: 'Campeche', CS: 'Chiapas', CH: 'Chihuahua', CL: 'Coahuila de Zaragoza',
  CM: 'Colima', DF: 'Ciudad de México', DG: 'Durango', GT: 'Guanajuato',
  GR: 'Guerrero', HG: 'Hidalgo', JC: 'Jalisco', MC: 'Estado de México',
  MN: 'Michoacán', MS: 'Morelos', NT: 'Nayarit', NL: 'Nuevo León',
  OC: 'Oaxaca', PL: 'Puebla', QT: 'Querétaro', QR: 'Quintana Roo',
  SP: 'San Luis Potosí', SL: 'Sinaloa', SR: 'Sonora', TC: 'Tabasco',
  TS: 'Tamaulipas', TL: 'Tlaxcala', VZ: 'Veracruz', YN: 'Yucatán',
  ZS: 'Zacatecas', NE: 'Extranjero',
};

const deriveCurpDisplay = (curp: string) => {
  if (!curp || curp.length < 13) return { gender: '', birthDate: '', nationality: '', stateName: '' };
  const g = curp.charAt(10);
  const yr = curp.substring(4, 6);
  const mo = curp.substring(6, 8);
  const dy = curp.substring(8, 10);
  const sc = curp.substring(11, 13);
  const fy = Number(yr) <= new Date().getFullYear() % 100 ? `20${yr}` : `19${yr}`;
  return {
    gender: g === 'H' ? mc.optionMale : g === 'M' ? mc.optionFemale : '',
    birthDate: `${dy}/${mo}/${fy}`,
    nationality: sc === 'NE' ? mc.optionForeigner : mc.optionMexican,
    stateName: CURP_STATE_MAP[sc] ?? '',
  };
};

export default component$(() => {
  const nav = useNavigate();
  const location = useLocation();

  const person = useSignal<PersonListItem | null>(null);
  const loading = useSignal(true);
  const noSelection = useSignal(false);
  const saving = useSignal(false);
  const error = useSignal('');
  const errorField = useSignal('');
  const success = useSignal(false);

  const firstName = useSignal('');
  const firstLastName = useSignal('');
  const secondLastName = useSignal('');
  const curpValue = useSignal('');
  const curpEditable = useSignal(false);
  const homoclave = useSignal('');
  const phone = useSignal('');
  const email = useSignal('');

  useVisibleTask$(async ({ track }) => {
    const idParam = track(() => location.url.searchParams.get('id'));

    loading.value = true;
    error.value = '';

    const id = idParam ? Number(idParam) : 0;

    if (!id) {
      noSelection.value = true;
      loading.value = false;
      return;
    }
    noSelection.value = false;

    try {
      const data = await personService.findOne(id);
      person.value = data;

      firstName.value = data.firstName;
      firstLastName.value = data.firstLastName;
      secondLastName.value = data.secondLastName ?? '';
      curpValue.value = data.curp;
      curpEditable.value = false;
      homoclave.value =
        data.rfc && data.rfc.length === 13 ? data.rfc.substring(10) : '';
      phone.value = data.personalPhone ?? '';
      email.value = data.personalEmail ?? '';
    } catch (err) {
      error.value = normalizeError(
        err,
        messages.errors.loadPersonDetailFailed,
      ).message;
    } finally {
      loading.value = false;
    }
  });

  const saveChanges$ = $(async () => {
    if (!person.value) return;

    error.value = '';
    errorField.value = '';

    const fn = firstName.value.trim().toUpperCase();
    const fln = firstLastName.value.trim().toUpperCase();
    const sln = secondLastName.value.trim().toUpperCase();
    const p = phone.value.trim();
    const em = email.value.trim();

    if (fn && (fn.length < 2 || fn.length > 45)) {
      error.value = mc.errorFirstNameRequired;
      errorField.value = 'firstName';
      return;
    }
    if (fln && (fln.length < 2 || fln.length > 25)) {
      error.value = mc.errorFirstLastNameRequired;
      errorField.value = 'firstLastName';
      return;
    }
    if (sln && sln.length > 25) {
      error.value = mc.errorSecondLastNameLength;
      errorField.value = 'secondLastName';
      return;
    }
    if (p && !PHONE_REGEX.test(p)) {
      error.value = mc.errorPhoneInvalid;
      errorField.value = 'phone';
      return;
    }
    if (em && !EMAIL_REGEX.test(em)) {
      error.value = mc.errorEmailInvalid;
      errorField.value = 'email';
      return;
    }

    saving.value = true;
    try {
      await personService.update(person.value.id, {
        ...(fn && { firstName: fn }),
        ...(fln && { firstLastName: fln }),
        ...(sln && { secondLastName: sln }),
        ...(p && { phone: p }),
        ...(em && { email: em }),
        ...(homoclave.value.trim() && {
          homoclave: homoclave.value.trim().toUpperCase(),
        }),
      });
      success.value = true;
      setTimeout(async () => {
        await nav(ROUTES.PERSONS);
      }, 1500);
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

      <div class="edit-person-page">
        <PageReturn
          eyebrow={m.pageReturnEyebrow}
          title={m.title}
          buttonLabel={m.pageReturnLabel}
          onClick$={async () => await nav(ROUTES.PERSONS)}
        />

        {error.value && (
          <Toast tone="danger" title={messages.users.common.errorToastTitle}>
            {error.value}
          </Toast>
        )}

        {success.value && (
          <Toast tone="success" title={m.successToastTitle}>
            {m.successToastDescription}
          </Toast>
        )}

        {loading.value && (
          <Panel title={m.loadingTitle} description={m.loadingDescription}>
            <div class="edit-person__loading" />
          </Panel>
        )}

        {!loading.value && noSelection.value && (
          <PersonSearchPanel
            title={m.selectionTitle}
            description={m.selectionDescription}
            fieldHint={m.fieldPersonHint}
            noResultsMessage={m.noResultsCriteria}
            onSelect$={async (personId) => {
              await nav(`${ROUTES.PERSONS_EDIT}?id=${personId}`);
            }}
          />
        )}

        {!loading.value && currentPerson && (
          <div class="edit-person-layout">
            {/* Resumen */}
            <Panel title={m.panelSummaryTitle}>
              <div class="edit-person-summary">
                <div class="edit-person-summary__icon" aria-hidden="true">
                  <AppIcon intent="person" size="md" />
                </div>
                <div>
                  <strong>{currentPerson.fullName}</strong>
                  <span>{currentPerson.curp}</span>
                  <small>ID: {currentPerson.id}</small>
                </div>
              </div>
            </Panel>

            {/* Panel: Identificación */}
            <Panel title={m.panelIdTitle} description={m.panelIdDescription}>
              <div class="edit-person-form">
                {/* CURP (derivado, desbloqueable) + Homoclave */}
                <div class="edit-person-grid edit-person-grid--curp">
                  <DerivedField
                    label={mc.labelCurp}
                    optional
                    initialEnabled={false}
                    onChange$={(v) => { curpEditable.value = v; }}
                  >
                    <Input
                      value={curpValue.value}
                      maxLength={18}
                      disabled={!curpEditable.value}
                      onInput$={(e) => {
                        curpValue.value = (e.target as HTMLInputElement).value.toUpperCase();
                      }}
                    />
                  </DerivedField>

                  <Field label={mc.labelHomoclave} hint={mc.hintHomoclave}>
                    <Input
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
                </div>

                {/* Datos derivados */}
                <div class="edit-person-derived">
                  <p class="edit-person-derived__title">
                    {mc.derivedSectionTitle}
                  </p>

                  <div class="edit-person-derived-grid">
                    {(() => {
                      const d = deriveCurpDisplay(currentPerson.curp);
                      return (
                        <>
                          <Field label={mc.labelGender}>
                            <Input value={d.gender} disabled />
                          </Field>

                          <Field label={mc.labelBirthDate}>
                            <Input value={d.birthDate} disabled />
                          </Field>

                          <Field label={mc.labelNationality}>
                            <Input value={d.nationality} disabled />
                          </Field>

                          <Field label={mc.labelState} hint={m.hintStateReadonly}>
                            <Input value={d.stateName} disabled />
                          </Field>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </Panel>

            {/* Panel: Nombre */}
            <Panel
              title={mc.panelNameTitle}
              description={mc.panelNameDescription}
            >
              <div class="edit-person-form">
                <div class="edit-person-grid edit-person-grid--thirds">
                  <Field
                    label={mc.labelFirstName}
                    error={
                      errorField.value === 'firstName'
                        ? mc.errorFirstNameRequired
                        : undefined
                    }
                  >
                    <Input
                      iconLeft="person"
                      value={firstName.value}
                      placeholder={mc.placeholderFirstName}
                      invalid={errorField.value === 'firstName'}
                      onInput$={(e) => {
                        firstName.value = (e.target as HTMLInputElement).value.toUpperCase();
                      }}
                    />
                  </Field>

                  <Field
                    label={mc.labelFirstLastName}
                    error={
                      errorField.value === 'firstLastName'
                        ? mc.errorFirstLastNameRequired
                        : undefined
                    }
                  >
                    <Input
                      iconLeft="person"
                      value={firstLastName.value}
                      placeholder={mc.placeholderFirstLastName}
                      invalid={errorField.value === 'firstLastName'}
                      onInput$={(e) => {
                        firstLastName.value = (
                          e.target as HTMLInputElement
                        ).value.toUpperCase();
                      }}
                    />
                  </Field>

                  <Field
                    label={mc.labelSecondLastName}
                    hint={mc.hintSecondLastName}
                    error={
                      errorField.value === 'secondLastName'
                        ? mc.errorSecondLastNameLength
                        : undefined
                    }
                  >
                    <Input
                      iconLeft="person"
                      value={secondLastName.value}
                      placeholder={mc.placeholderSecondLastName}
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
              title={mc.panelContactTitle}
              description={mc.panelContactDescription}
            >
              <div class="edit-person-form">
                <div class="edit-person-grid">
                  <Field
                    label={mc.labelPhone}
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
                      iconLeft="phone"
                      type="tel"
                      value={phone.value}
                      placeholder={mc.placeholderPhone}
                      invalid={errorField.value === 'phone'}
                      onInput$={(e) => {
                        phone.value = (e.target as HTMLInputElement).value
                          .replace(/\D/g, '')
                          .slice(0, 10);
                      }}
                    />
                  </Field>

                  <Field
                    label={mc.labelEmail}
                    error={
                      errorField.value === 'email'
                        ? email.value
                          ? mc.errorEmailInvalid
                          : mc.errorEmailRequired
                        : undefined
                    }
                  >
                    <Input
                      iconLeft="mail"
                      type="email"
                      value={email.value}
                      placeholder={mc.placeholderEmail}
                      invalid={errorField.value === 'email'}
                      onInput$={(e) => {
                        email.value = (e.target as HTMLInputElement).value;
                      }}
                    />
                  </Field>
                </div>
              </div>
            </Panel>

            <div class="edit-person-actions">
              <Button
                variant="secondary"
                onClick$={async () => await nav(ROUTES.PERSONS)}
              >
                {m.actionCancel}
              </Button>
              <Button
                iconLeft="save"
                loading={saving.value}
                onClick$={saveChanges$}
              >
                {m.actionSave}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Editar persona`,
};

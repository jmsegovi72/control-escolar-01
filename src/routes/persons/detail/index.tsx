import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
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
import { Avatar, Button, PageReturn, Panel, Toolbar } from '~/ui';
import { normalizeError } from '~/utils/api-error';
import { personsWorkflow } from '~/utils/persons-workflow';
import './detail.css';

const DEFAULT_PERSON_AVATAR = '/avatars/user-default.svg';

const resolvePersonPhotoUrl = (photoUrl: string | null | undefined): string => {
  if (!photoUrl) return DEFAULT_PERSON_AVATAR;
  if (photoUrl.startsWith('http')) return photoUrl;
  const apiBase = ENV.API_URL.replace(/\/sices\/v\d+$/, '');
  return `${apiBase}/${photoUrl.replace(/^\/+/, '')}`;
};

const m = messages.persons;

export default component$(() => {
  const nav = useNavigate();
  const location = useLocation();
  const person = useSignal<PersonDetail | null>(null);
  const loading = useSignal(true);
  const error = useSignal('');
  const returnLabel = useSignal<string>(m.detail.pageReturnLabel);
  const returnPath = useSignal<string>(ROUTES.PERSONS);
  const selectionMode = useSignal(false);

  useVisibleTask$(async ({ track }) => {
    const idParam = track(() => location.url.searchParams.get('id'));
    const sourceParam = track(() => location.url.searchParams.get('source'));

    loading.value = true;
    error.value = '';
    returnLabel.value = m.detail.pageReturnLabel;
    returnPath.value = ROUTES.PERSONS;
    selectionMode.value = false;

    const id = idParam ? Number(idParam) : 0;
    const selectedPerson = personsWorkflow.getSelectedPerson();

    if (
      id &&
      sourceParam === 'table' &&
      selectedPerson &&
      selectedPerson.id === id
    ) {
      person.value = {
        ...selectedPerson,
        isActive: selectedPerson.isActive ?? true,
      } as PersonDetail;
      returnPath.value = personsWorkflow.getReturnPath();
      loading.value = false;
      return;
    }

    if (!id) {
      person.value = null;
      selectionMode.value = true;
      loading.value = false;
      return;
    }

    try {
      person.value = await personService.findOne(id);
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

  const goBack$ = $(async () => {
    await nav(returnPath.value);
  });

  const openManualDetail$ = $(async (personId: number) => {
    personsWorkflow.clear();
    await nav(`${ROUTES.PERSONS_DETAIL}?id=${personId}`);
  });

  const currentPerson = person.value;

  return (
    <AuthenticatedShell
      eyebrow={m.detail.eyebrow}
      title={m.detail.title}
      description={m.detail.description}
      meta={m.detail.meta}
      allowedUserTypes={['SUPER', 'CE']}
      accessDeniedDescription={m.detail.accessDenied}
    >
      <Toolbar q:slot="toolbar">
        <Button
          q:slot="leading"
          variant="ghost"
          iconLeft="back"
          onClick$={goBack$}
        >
          {returnLabel.value}
        </Button>
        <Button
          q:slot="actions"
          variant="secondary"
          iconLeft="search"
          onClick$={async () => await nav(ROUTES.PERSONS_SEARCH)}
        >
          {m.common.searchPersonsAction}
        </Button>
      </Toolbar>

      <div class="person-detail">
        <PageReturn
          eyebrow={m.detail.pageReturnEyebrow}
          title={m.detail.title}
          buttonLabel={returnLabel.value}
          onClick$={goBack$}
        />

        {loading.value && (
          <Panel
            title={m.common.loadingPanelTitle}
            description={m.common.loadingPanelDescription}
          >
            <div class="person-detail__loading" />
          </Panel>
        )}

        {!loading.value && error.value && (
          <Panel
            eyebrow={m.common.errorToastTitle}
            title={m.detail.errorTitle}
            description={error.value}
          >
            <div class="person-detail__actions">
              <Button variant="secondary" iconLeft="back" onClick$={goBack$}>
                {m.common.backLabel}
              </Button>
              <Button
                iconLeft="search"
                onClick$={async () => await nav(ROUTES.PERSONS_SEARCH)}
              >
                {m.common.goToSearchAction}
              </Button>
            </div>
          </Panel>
        )}

        {!loading.value && selectionMode.value && !currentPerson && (
          <PersonSearchPanel
            title={m.common.searchPersonTitle}
            description={m.detail.selectionDescription}
            fieldHint={m.common.fieldPersonHint}
            noResultsMessage={m.detail.noResultsCriteria}
            onSelect$={openManualDetail$}
          />
        )}

        {!loading.value && currentPerson && (
          <>
            <div class="person-detail__layout">
              <div class="person-detail__profile-card">
                <Avatar
                  src={resolvePersonPhotoUrl(currentPerson.photoUrl)}
                  name={currentPerson.fullName}
                  size="xl"
                />
                <div class="person-detail__profile-info">
                  <h2>{currentPerson.fullName}</h2>
                  <p>{currentPerson.curp}</p>
                </div>
                <div class="person-detail__profile-actions">
                  <Button
                    variant="primary"
                    iconLeft="edit"
                    fullWidth
                    onClick$={async () =>
                      await nav(`${ROUTES.PERSONS_EDIT}?id=${currentPerson.id}`)
                    }
                  >
                    {m.detail.actionEdit}
                  </Button>
                </div>
              </div>

              <div class="person-detail__panels">
                <Panel
                  title={m.detail.panelPersonalTitle}
                  description={m.detail.panelPersonalDescription}
                >
                  <dl class="person-detail__info-grid">
                    <div>
                      <dt>{m.detail.fieldId}</dt>
                      <dd>{currentPerson.id}</dd>
                    </div>
                    <div>
                      <dt>{m.detail.fieldCurp}</dt>
                      <dd>{currentPerson.curp}</dd>
                    </div>
                    <div>
                      <dt>{m.detail.fieldFullName}</dt>
                      <dd>{currentPerson.fullName}</dd>
                    </div>
                    <div>
                      <dt>{m.detail.fieldGender}</dt>
                      <dd>
                        {currentPerson.gender === 'H'
                          ? m.detail.genderMale
                          : m.detail.genderFemale}
                      </dd>
                    </div>
                    {currentPerson.birthDate && (
                      <div>
                        <dt>{m.detail.fieldBirthDate}</dt>
                        <dd>{currentPerson.birthDate}</dd>
                      </div>
                    )}
                    {currentPerson.nationality && (
                      <div>
                        <dt>{m.detail.fieldNationality}</dt>
                        <dd>
                          {currentPerson.nationality === 'M'
                            ? m.detail.nationalityMexican
                            : m.detail.nationalityForeigner}
                        </dd>
                      </div>
                    )}
                    {currentPerson.rfc && (
                      <div>
                        <dt>{m.detail.fieldRfc}</dt>
                        <dd>{currentPerson.rfc}</dd>
                      </div>
                    )}
                  </dl>
                </Panel>

                <Panel
                  title={m.detail.panelContactTitle}
                  description={m.detail.panelContactDescription}
                >
                  <dl class="person-detail__info-grid">
                    <div>
                      <dt>{m.detail.fieldPhone}</dt>
                      <dd>{currentPerson.phone || m.detail.noData}</dd>
                    </div>
                    <div>
                      <dt>{m.detail.fieldEmail}</dt>
                      <dd>{currentPerson.personalEmail || m.detail.noData}</dd>
                    </div>
                  </dl>
                </Panel>

                {(currentPerson.birthMunicipality ||
                  currentPerson.birthState) && (
                  <Panel
                    title={m.detail.panelLocationTitle}
                    description={m.detail.panelLocationDescription}
                  >
                    <dl class="person-detail__info-grid">
                      {currentPerson.birthMunicipality && (
                        <div>
                          <dt>{m.detail.fieldMunicipality}</dt>
                          <dd>{currentPerson.birthMunicipality}</dd>
                        </div>
                      )}
                      {currentPerson.birthState && (
                        <div>
                          <dt>{m.detail.fieldState}</dt>
                          <dd>{currentPerson.birthState}</dd>
                        </div>
                      )}
                    </dl>
                  </Panel>
                )}
              </div>
            </div>

            <div class="person-detail__footer-actions">
              <Button
                variant="secondary"
                iconLeft="search"
                onClick$={async () => await nav(ROUTES.PERSONS_DETAIL)}
              >
                {m.common.searchOtherAction}
              </Button>
            </div>
          </>
        )}
      </div>
    </AuthenticatedShell>
  );
});

export const head: DocumentHead = {
  title: `${appConfig.name} | Detalle de persona`,
};

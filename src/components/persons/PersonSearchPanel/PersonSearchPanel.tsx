import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';

import { messages } from '~/config/messages';
import { personService } from '~/services/person/person.service';
import type { PersonListItem } from '~/types/person.types';
import { Field, Input, Panel } from '~/ui';
import type { PersonSearchPanelProps } from './person-search-panel.types';
import './person-search-panel.css';

const m = messages.persons.edit;

export const PersonSearchPanel = component$<PersonSearchPanelProps>(({
  title,
  description,
  fieldHint,
  noResultsMessage,
  onSelect$,
}) => {
  const searchTerm = useSignal('');
  const searchResults = useSignal<PersonListItem[]>([]);
  const searching = useSignal(false);

  useVisibleTask$(async ({ track }) => {
    const query = track(() => searchTerm.value.trim());

    if (query.length < 3) {
      searchResults.value = [];
      searching.value = false;
      return;
    }

    searching.value = true;

    try {
      const response = await personService.findMany({
        limit: 8,
        page: 1,
        searchTerm: query,
      });
      searchResults.value = response.data;
    } catch {
      searchResults.value = [];
    } finally {
      searching.value = false;
    }
  });

  return (
    <Panel title={title} description={description}>
      <div class="person-search-panel">
        <Field label={m.fieldPersonLabel} hint={fieldHint}>
          <Input
            iconLeft="search"
            placeholder={m.searchPlaceholder}
            value={searchTerm.value}
            onInput$={(event) => {
              searchTerm.value = (event.target as HTMLInputElement).value;
            }}
          />
        </Field>

        {searching.value && (
          <div class="person-search-panel__loading" aria-label="Buscando" />
        )}

        {searchTerm.value.trim().length >= 3 &&
          !searching.value &&
          searchResults.value.length === 0 && (
            <p class="person-search-panel__empty">{noResultsMessage}</p>
          )}

        {searchResults.value.length > 0 && (
          <div class="person-search-panel__results">
            {searchResults.value.map((result) => (
              <button
                type="button"
                class="person-search-panel__result-card"
                key={result.id}
                onClick$={async () => await onSelect$(result.id)}
              >
                <strong>{result.fullName}</strong>
                <span>{result.curp}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
});

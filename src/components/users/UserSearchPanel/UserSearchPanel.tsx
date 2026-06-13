import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';

import { messages } from '~/config/messages';
import { userService } from '~/services/user/user.service';
import type { UserListItem } from '~/types/user.types';
import { Badge, Field, Input, Panel } from '~/ui';
import type { UserSearchPanelProps } from './user-search-panel.types';
import './user-search-panel.css';

export const UserSearchPanel = component$<UserSearchPanelProps>(
  ({
    title,
    description,
    fieldHint,
    noResultsMessage,
    filters,
    limit = 8,
    badgeField,
    badgeTrueLabel,
    badgeFalseLabel,
    badgeTrueTone = 'success',
    badgeFalseTone = 'danger',
    onSelect$,
  }) => {
    const searchTerm = useSignal('');
    const searchResults = useSignal<UserListItem[]>([]);
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
        const response = await userService.findMany({
          limit,
          page: 1,
          searchTerm: query,
          ...(filters ?? {}),
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
        <div class="user-search-panel">
          <Field label={messages.users.common.fieldUserLabel} hint={fieldHint}>
            <Input
              iconLeft="search"
              placeholder={messages.users.common.searchPlaceholder}
              value={searchTerm.value}
              onInput$={(event) => {
                searchTerm.value = (event.target as HTMLInputElement).value;
              }}
            />
          </Field>

          {searching.value && (
            <div class="user-search-panel__loading" aria-label="Buscando" />
          )}

          {searchTerm.value.trim().length >= 3 &&
            !searching.value &&
            searchResults.value.length === 0 && (
              <p class="user-search-panel__empty">{noResultsMessage}</p>
            )}

          {searchResults.value.length > 0 && (
            <div class="user-search-panel__results">
              {searchResults.value.map((result) => {
                const showBadge =
                  !!badgeField && !!badgeTrueLabel && !!badgeFalseLabel;
                const flagValue =
                  badgeField === 'isActive'
                    ? result.isActive
                    : result.firstLogin;
                return (
                  <button
                    type="button"
                    class="user-search-panel__result-card"
                    data-has-badge={showBadge ? 'true' : undefined}
                    key={result.id}
                    onClick$={async () => await onSelect$(result.id)}
                  >
                    <div class="user-search-panel__result-info">
                      <strong>{result.fullName}</strong>
                      <span>{result.username}</span>
                    </div>
                    {showBadge && (
                      <Badge tone={flagValue ? badgeTrueTone : badgeFalseTone}>
                        {flagValue ? badgeTrueLabel : badgeFalseLabel}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Panel>
    );
  },
);

import { $, component$, useSignal } from '@builder.io/qwik';

import { useFloatingMenu } from '~/ui/hooks/useFloatingMenu';
import { AppIcon } from '~/ui/icons';
import { Input } from '~/ui/primitives/Input/Input';
import type { SearchSelectProps } from './search-select.types';
import './search-select.css';

export const SearchSelect = component$<SearchSelectProps>(
  ({
    options,
    query = '',
    value,
    placeholder = 'Buscar...',
    emptyMessage = 'No se encontraron resultados',
    loading,
    disabled,
    required,
    invalid,
    variant = 'line',
    size = 'md',
    iconLeft = 'search',
    filterMode = 'client',
    onQueryChange$,
    onSelect$,
    onClear$,
  }) => {
    const { open, anchorRef, openFromRef$, leftStyle } = useFloatingMenu();
    const currentQuery = useSignal(query);
    const selectedValue = useSignal(value ?? '');

    const filteredOptions =
      filterMode === 'external'
        ? options
        : options.filter((option) => {
            const normalizedQuery = currentQuery.value.trim().toLowerCase();
            if (!normalizedQuery) return true;
            return `${option.label} ${option.description ?? ''}`
              .toLowerCase()
              .includes(normalizedQuery);
          });

    const selectOption$ = $(async (optionValue: string) => {
      const option = options.find((item) => item.value === optionValue);
      if (!option || option.disabled) return;
      selectedValue.value = option.value;
      currentQuery.value = option.label;
      open.value = false;
      await onSelect$?.(option);
    });

    const clear$ = $(async () => {
      selectedValue.value = '';
      currentQuery.value = '';
      open.value = false;
      await onClear$?.();
      await onQueryChange$?.('');
    });

    return (
      <div
        class="ui-search-select"
        data-open={open.value ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
        document:onClick$={$((event) => {
          const target = event.target as HTMLElement;
          if (target.closest('.ui-search-select')) return;
          open.value = false;
        })}
        document:onKeydown$={$((event) => {
          if ((event as KeyboardEvent).key === 'Escape') {
            open.value = false;
          }
        })}
      >
        {selectedValue.value && (
          <input
            type="hidden"
            value={selectedValue.value}
            required={required}
          />
        )}

        <div class="ui-search-select__control" ref={anchorRef}>
          <Input
            variant={variant}
            size={size}
            iconLeft={iconLeft}
            iconRight={selectedValue.value ? 'close' : undefined}
            placeholder={placeholder}
            value={currentQuery.value}
            disabled={disabled}
            invalid={invalid || (required && !selectedValue.value)}
            onFocus$={openFromRef$}
            onInput$={async (event) => {
              const nextQuery = (event.target as HTMLInputElement).value;
              currentQuery.value = nextQuery;
              selectedValue.value = '';
              await openFromRef$();
              await onQueryChange$?.(nextQuery);
            }}
          />
          {selectedValue.value && (
            <button
              type="button"
              class="ui-search-select__clear"
              aria-label="Limpiar seleccion"
              onClick$={clear$}
            />
          )}
        </div>

        {open.value && (
          <div
            class="ui-search-select__menu"
            role="listbox"
            style={leftStyle.value}
          >
            {loading ? (
              <div class="ui-search-select__state">
                <span class="ui-search-select__spinner" />
                Buscando...
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  class="ui-search-select__option"
                  data-selected={
                    option.value === selectedValue.value ? 'true' : undefined
                  }
                  disabled={option.disabled}
                  role="option"
                  aria-selected={
                    option.value === selectedValue.value ? 'true' : 'false'
                  }
                  onClick$={() => selectOption$(option.value)}
                >
                  <span class="ui-search-select__option-main">
                    {option.label}
                  </span>
                  {option.description && (
                    <span class="ui-search-select__option-description">
                      {option.description}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div class="ui-search-select__state">
                <AppIcon intent="info" size="sm" />
                {emptyMessage}
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);

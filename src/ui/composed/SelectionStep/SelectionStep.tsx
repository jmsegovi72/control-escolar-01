import { component$ } from '@builder.io/qwik';

import { SearchSelect } from '~/ui/composed/SearchSelect/SearchSelect';
import { Field } from '~/ui/primitives/Field/Field';
import { Panel } from '~/ui/primitives/Panel/Panel';
import type { SelectionStepProps } from './selection-step.types';

export const SelectionStep = component$<SelectionStepProps>(
  ({
    title,
    description,
    fieldLabel,
    fieldHint,
    placeholder = 'Buscar...',
    emptyMessage = 'No se encontraron resultados.',
    options,
    loading,
    query,
    filterMode = 'client',
    onQueryChange$,
    onSelect$,
  }) => {
    return (
      <Panel title={title} description={description}>
        <Field label={fieldLabel} required hint={fieldHint}>
          <SearchSelect
            query={query}
            options={options}
            loading={loading}
            placeholder={placeholder}
            filterMode={filterMode}
            emptyMessage={
              (query?.trim().length ?? 0) < 3 ? fieldHint : emptyMessage
            }
            onQueryChange$={onQueryChange$}
            onSelect$={onSelect$}
          />
        </Field>
      </Panel>
    );
  },
);

import {
  component$,
  Slot,
  useContextProvider,
  useSignal,
} from '@builder.io/qwik';
import { DerivedFieldEnabledCtx } from './derived-field.context';
import type { DerivedFieldProps } from './derived-field.types';
import './derived-field.css';

export const DerivedField = component$<DerivedFieldProps>(
  ({
    label,
    required = false,
    optional = false,
    initialEnabled,
    onChange$,
  }) => {
    const enabled = useSignal(initialEnabled ?? !optional);

    useContextProvider(DerivedFieldEnabledCtx, enabled);

    return (
      <div class="ui-derived-field">
        <div class="ui-derived-field__label">
          {optional && (
            <input
              type="checkbox"
              class="ui-derived-field__checkbox"
              checked={enabled.value}
              onChange$={async (e) => {
                enabled.value = (e.target as HTMLInputElement).checked;
                await onChange$?.(enabled.value);
              }}
            />
          )}
          <span>
            {label}
            {required && <span class="ui-derived-field__asterisk">*</span>}
          </span>
        </div>
        <div class={!enabled.value ? 'ui-derived-field__disabled' : undefined}>
          <Slot />
        </div>
      </div>
    );
  },
);

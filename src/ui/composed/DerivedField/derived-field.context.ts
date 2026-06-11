import { createContextId } from '@builder.io/qwik';
import type { Signal } from '@builder.io/qwik';

export const DerivedFieldEnabledCtx = createContextId<Signal<boolean>>(
  'ui.derived-field.enabled',
);

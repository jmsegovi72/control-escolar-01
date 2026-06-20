import { component$, type PropFunction } from '@builder.io/qwik';
import { AppIcon } from '~/ui/icons';
import './step-indicator.css';

export interface Step {
  eyebrow: string;
  label: string;
}

export interface StepIndicatorProps {
  steps: Step[];
  current: number;
  tone?: 'success' | 'error';
  onStepClick$?: PropFunction<(step: number) => void>;
}

export const StepIndicator = component$<StepIndicatorProps>(
  ({ steps, current, tone, onStepClick$ }) => {
    return (
      <div
        class="ui-step-indicator"
        aria-label="Progreso del formulario"
        role="navigation"
      >
        {steps.map((item, index) => {
          const stepNum = index + 1;
          const isLast = tone && stepNum === steps.length;
          const done = stepNum < current || (isLast && tone === 'success');
          const connectorDone = stepNum <= current;
          const active =
            stepNum === current &&
            !(isLast && (tone === 'success' || tone === 'error'));
          const stepTone = isLast && tone === 'error' ? 'error' : 'default';
          const clickable = done && onStepClick$;

          return (
            <>
              {index > 0 && (
                <span
                  class="ui-step-indicator__connector"
                  data-done={connectorDone ? 'true' : undefined}
                />
              )}
              <button
                type="button"
                class="ui-step-indicator__item"
                data-active={active ? 'true' : undefined}
                data-done={done ? 'true' : undefined}
                data-tone={stepTone !== 'default' ? stepTone : undefined}
                disabled={!clickable}
                onClick$={clickable ? () => onStepClick$(stepNum) : undefined}
              >
                <span class="ui-step-indicator__num">
                  {done ? <AppIcon intent="check" size="xs" /> : stepNum}
                </span>
                <span class="ui-step-indicator__text">
                  <span>{item.eyebrow}</span>
                  <strong>{item.label}</strong>
                </span>
              </button>
            </>
          );
        })}
      </div>
    );
  },
);

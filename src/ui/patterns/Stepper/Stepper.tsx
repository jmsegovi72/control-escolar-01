import { component$ } from '@builder.io/qwik';

import { AppIcon } from '~/ui/icons';
import type { StepperProps, StepStatus } from './stepper.types';
import './stepper.css';

const statusIcon: Record<StepStatus, 'check' | 'warning' | 'chevron-right'> = {
  complete: 'check',
  current: 'chevron-right',
  pending: 'chevron-right',
  error: 'warning',
};

export const Stepper = component$<StepperProps>(
  ({ steps, activeStep, orientation = 'horizontal', size = 'md' }) => {
    return (
      <nav
        class="ui-stepper"
        data-orientation={orientation}
        data-size={size}
        aria-label="Progreso"
      >
        <ol class="ui-stepper__list">
          {steps.map((step, index) => {
            const status =
              step.status ??
              (step.id === activeStep
                ? 'current'
                : activeStep &&
                    index < steps.findIndex((item) => item.id === activeStep)
                  ? 'complete'
                  : 'pending');

            return (
              <li
                key={step.id}
                class="ui-stepper__item"
                data-status={status}
                aria-current={status === 'current' ? 'step' : undefined}
              >
                <span class="ui-stepper__marker" aria-hidden="true">
                  {step.icon ? (
                    <AppIcon intent={step.icon} size="sm" />
                  ) : (
                    <AppIcon intent={statusIcon[status]} size="sm" />
                  )}
                </span>
                <span class="ui-stepper__copy">
                  <span class="ui-stepper__label">{step.label}</span>
                  {step.description && (
                    <span class="ui-stepper__description">
                      {step.description}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  },
);

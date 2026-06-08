import type { IconIntent } from '~/ui/icons';

export type StepperOrientation = 'horizontal' | 'vertical';

export type StepperSize = 'sm' | 'md';

export type StepStatus = 'complete' | 'current' | 'pending' | 'error';

export type StepperStep = {
  id: string;
  label: string;
  description?: string;
  status?: StepStatus;
  icon?: IconIntent;
};

export type StepperProps = {
  steps: StepperStep[];
  activeStep?: string;
  orientation?: StepperOrientation;
  size?: StepperSize;
};

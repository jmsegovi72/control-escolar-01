export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left';

export type TooltipProps = {
  content: string;
  placement?: TooltipPlacement;
  disabled?: boolean;
};

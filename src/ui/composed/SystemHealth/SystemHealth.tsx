import { component$ } from '@builder.io/qwik';

import { AppIcon } from '~/ui/icons';
import type {
  StatusIndicatorProps,
  StatusTone,
  SystemHealthProps,
} from './system-health.types';
import './system-health.css';

const toneIcon: Record<StatusTone, 'check' | 'warning' | 'info'> = {
  online: 'check',
  warning: 'warning',
  offline: 'warning',
  neutral: 'info',
};

export const StatusIndicator = component$<StatusIndicatorProps>(
  ({
    label,
    value,
    description,
    tone = 'neutral',
    icon,
    size = 'md',
    compact,
  }) => {
    return (
      <div
        class="ui-status-indicator"
        data-tone={tone}
        data-size={size}
        data-compact={compact ? 'true' : undefined}
      >
        <span class="ui-status-indicator__dot" aria-hidden="true" />
        {!compact && (
          <span class="ui-status-indicator__icon" aria-hidden="true">
            <AppIcon intent={icon ?? toneIcon[tone]} size="sm" />
          </span>
        )}
        <span class="ui-status-indicator__copy">
          <span>{label}</span>
          {value && <strong>{value}</strong>}
          {description && <small>{description}</small>}
        </span>
      </div>
    );
  },
);

export const SystemHealth = component$<SystemHealthProps>(
  ({
    items,
    title = 'Estado del sistema',
    description,
    size = 'md',
    compact,
    orientation = 'horizontal',
  }) => {
    return (
      <section
        class="ui-system-health"
        data-orientation={orientation}
        data-compact={compact ? 'true' : undefined}
      >
        {!compact && (
          <header class="ui-system-health__header">
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </header>
        )}

        <div class="ui-system-health__items">
          {items.map((item) => (
            <StatusIndicator
              key={item.id}
              {...item}
              size={size}
              compact={compact}
            />
          ))}
        </div>
      </section>
    );
  },
);

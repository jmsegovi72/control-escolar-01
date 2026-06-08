import { component$ } from '@builder.io/qwik';
import { Skeleton } from '~/ui/composed/Skeleton/Skeleton';
import { AppIcon } from '~/ui/icons';
import type { StatCardProps } from './stat-card.types';
import './stat-card.css';

const trendSymbol = {
  up: '+',
  down: '-',
  flat: '',
};

export const StatCard = component$<StatCardProps>(
  ({
    label,
    value,
    description,
    icon = 'info',
    tone = 'neutral',
    trend,
    loading,
  }) => {
    return (
      <section
        class="ui-stat-card"
        data-tone={tone}
        data-loading={loading ? 'true' : undefined}
      >
        <div class="ui-stat-card__top">
          <span class="ui-stat-card__icon" aria-hidden="true">
            <AppIcon intent={icon} size="sm" />
          </span>
          {trend && !loading && (
            <span
              class="ui-stat-card__trend"
              data-direction={trend.direction ?? 'flat'}
            >
              {trendSymbol[trend.direction ?? 'flat']}
              {trend.value}
            </span>
          )}
        </div>

        <div class="ui-stat-card__body">
          <span class="ui-stat-card__label">{label}</span>
          {loading ? (
            <Skeleton variant="text" rows={2} animated />
          ) : (
            <>
              <strong class="ui-stat-card__value">{value}</strong>
              {(description || trend?.label) && (
                <span class="ui-stat-card__description">
                  {description ?? trend?.label}
                </span>
              )}
            </>
          )}
        </div>
      </section>
    );
  },
);

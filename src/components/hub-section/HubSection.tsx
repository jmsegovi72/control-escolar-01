import { component$, Slot } from '@builder.io/qwik';
import './hub-section.css';

export interface HubSectionProps {
  title: string;
  count: number;
}

export const HubSection = component$<HubSectionProps>(({ title, count }) => {
  return (
    <section class="hub-section">
      <header class="hub-section__label">
        <span class="hub-section__title">{title}</span>
        <span class="hub-section__line" aria-hidden="true" />
        <span class="hub-section__count">{count}</span>
      </header>
      <Slot />
    </section>
  );
});

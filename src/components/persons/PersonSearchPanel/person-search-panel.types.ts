import type { PropFunction } from '@builder.io/qwik';

export interface PersonSearchPanelProps {
  title: string;
  description: string;
  fieldHint: string;
  noResultsMessage: string;
  onSelect$: PropFunction<(personId: number) => void>;
}

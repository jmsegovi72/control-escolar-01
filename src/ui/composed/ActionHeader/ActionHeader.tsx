import { component$, type PropFunction } from '@builder.io/qwik';
import { Button } from '../../primitives/Button/Button';
import './action-header.css';

export interface ActionHeaderProps {
  title: string;
  onBack$?: PropFunction<() => void | Promise<void>>;
}

export const ActionHeader = component$<ActionHeaderProps>(
  ({ title, onBack$ }) => {
    return (
      <nav class="ui-action-header" aria-label="Navegacion de pagina">
        <div class="ui-action-header__start">
          {onBack$ && (
            <Button variant="secondary" iconLeft="back" onClick$={onBack$}>
              Regresar
            </Button>
          )}
        </div>
        <strong class="ui-action-header__title">{title}</strong>
        <div class="ui-action-header__end" />
      </nav>
    );
  },
);

import { component$, type PropFunction } from '@builder.io/qwik';
import { Button } from '../../primitives/Button/Button';
import './page-return.css';

export interface PageReturnProps {
  eyebrow?: string;
  title: string;
  buttonLabel?: string;
  iconLeft?: string;
  onClick$?: PropFunction<() => void | Promise<void>>;
}

export const PageReturn = component$<PageReturnProps>(
  ({
    eyebrow = 'MODULO DE USUARIOS',
    title,
    buttonLabel = 'Regresar',
    iconLeft = 'back',
    onClick$,
  }) => {
    return (
      <nav class="ui-page-return" aria-label="Navegacion de pagina">
        <div class="ui-page-return__heading">
          {eyebrow && <span class="ui-page-return__eyebrow">{eyebrow}</span>}
          <strong class="ui-page-return__title">{title}</strong>
        </div>
        <Button
          variant="secondary"
          iconLeft={iconLeft as any}
          onClick$={onClick$}
        >
          {buttonLabel}
        </Button>
      </nav>
    );
  },
);

import { component$, type PropFunction } from '@builder.io/qwik';
import { Button } from '../../primitives/Button/Button';
import './module-header.css';

export interface ModuleHeaderProps {
  tituloModulo?: string;
  accionActual: string;
  onBack$?: PropFunction<() => void | Promise<void>>;
}

export const ModuleHeader = component$<ModuleHeaderProps>(
  ({ tituloModulo = 'MÓDULO DE USUARIOS', accionActual, onBack$ }) => {
    return (
      <nav class="ui-module-header" aria-label="Navegacion de pagina">
        <div class="ui-module-header__heading">
          {tituloModulo && (
            <span class="ui-module-header__eyebrow">{tituloModulo}</span>
          )}
          <strong class="ui-module-header__title">{accionActual}</strong>
        </div>
        <Button variant="secondary" iconLeft="back" onClick$={onBack$}>
          Regresar
        </Button>
      </nav>
    );
  },
);

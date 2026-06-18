import { $, component$, useSignal } from '@builder.io/qwik';

import { useFloatingMenu } from '~/ui/hooks/useFloatingMenu';
import { AppIcon } from '~/ui/icons';
import { Badge } from '~/ui/primitives/Badge/Badge';
import { Button } from '~/ui/primitives/Button/Button';
import { Checkbox } from '~/ui/primitives/Checkbox/Checkbox';
import { IconButton } from '~/ui/primitives/IconButton/IconButton';
import { Input } from '~/ui/primitives/Input/Input';
import { Select } from '~/ui/primitives/Select/Select';
import { DEFAULT_DATA_TABLE_PAGE_SIZE_OPTIONS } from './data-table.config';
import type { DataTableProps } from './data-table.types';
import './data-table.css';

const getCellValue = <T extends Record<string, unknown>>(
  row: T,
  key: keyof T | string,
) => {
  const value = row[key as keyof T];

  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'boolean') {
    return value ? 'Si' : 'No';
  }

  return String(value);
};

export const DataTable = component$(
  <T extends Record<string, unknown>>(props: DataTableProps<T>) => {
    const openActionIndex = useSignal<number | null>(null);
    const { menuTop, menuRight, openFromElement$ } = useFloatingMenu();

    const hasActions = !!props.actions?.length;
    const actionMode = props.actionMode ?? 'auto';
    const hasColumnFilters = props.columns.some((column) => column.filter);
    const pageSizeOptions =
      props.pageSizeOptions ?? DEFAULT_DATA_TABLE_PAGE_SIZE_OPTIONS;
    const totalPages = props.pagination
      ? Math.max(1, Math.ceil(props.pagination.total / props.pagination.limit))
      : 1;
    const visiblePages = props.pagination
      ? Array.from({ length: totalPages }, (_, index) => index + 1).filter(
          (page) =>
            page === 1 ||
            page === totalPages ||
            Math.abs(page - props.pagination!.page) <= 1,
        )
      : [];
    const startRecord = props.pagination
      ? props.pagination.total === 0
        ? 0
        : (props.pagination.page - 1) * props.pagination.limit + 1
      : 0;
    const endRecord = props.pagination
      ? Math.min(
          props.pagination.page * props.pagination.limit,
          props.pagination.total,
        )
      : 0;

    return (
      <section
        class="ui-data-table"
        document:onClick$={$((event) => {
          const target = event.target as HTMLElement;

          if (
            target.closest('.ui-data-table__menu-button') ||
            target.closest('.ui-data-table__action-dropdown')
          ) {
            return;
          }

          openActionIndex.value = null;
        })}
        document:onKeydown$={$((event) => {
          if ((event as KeyboardEvent).key === 'Escape') {
            openActionIndex.value = null;
          }
        })}
      >
        {props.searchable !== false && (
          <div class="ui-data-table__toolbar">
            <Input
              variant="quiet"
              size="sm"
              iconLeft="search"
              placeholder={props.searchPlaceholder ?? 'Buscar...'}
              onInput$={(event) => {
                props.onSearch$?.((event.target as HTMLInputElement).value);
              }}
            />
            {props.hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                iconLeft="cancel"
                onClick$={() => props.onClearFilters$?.()}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        )}

        <div
          class="ui-data-table__scroll"
          data-sticky={props.stickyHeader ? 'true' : undefined}
          style={props.maxHeight ? { maxHeight: props.maxHeight } : undefined}
        >
          <table class="ui-data-table__table">
            <thead>
              <tr>
                {props.selectable && (
                  <th class="ui-data-table__select-cell">
                    <Checkbox
                      aria-label="Seleccionar todos"
                      size="sm"
                      checked={
                        props.rows.length > 0 &&
                        props.rows.every(
                          (r) =>
                            (r as any).selected === true ||
                            (r as any).importStatus === 'invalid' ||
                            (r as any).importStatus === 'imported',
                        )
                      }
                      onChange$={(event) => {
                        props.onSelectAll$?.(
                          (event.target as HTMLInputElement).checked,
                        );
                      }}
                    />
                  </th>
                )}
                {props.columns.map((column) => (
                  <th
                    key={String(column.key)}
                    class={[
                      column.align ? `is-${column.align}` : '',
                      column.sortable ? 'is-sortable' : '',
                    ].join(' ')}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    <span class="ui-data-table__heading">
                      {column.label}
                      {column.sortable && (
                        <AppIcon intent="chevron-down" size="xs" />
                      )}
                    </span>
                  </th>
                ))}
                {hasActions && <th class="ui-data-table__actions-cell" />}
              </tr>

              {hasColumnFilters && (
                <tr class="ui-data-table__filter-row">
                  {props.selectable && <th />}
                  {props.columns.map((column) => (
                    <th key={`${String(column.key)}-filter`}>
                      {column.filter?.type === 'text' && (
                        <Input
                          variant="quiet"
                          size="sm"
                          placeholder={column.filter.placeholder ?? 'Filtrar'}
                          onInput$={(event) => {
                            props.onFilter$?.({
                              key: String(column.key),
                              value: (event.target as HTMLInputElement).value,
                            });
                          }}
                        />
                      )}
                      {column.filter?.type === 'select' && (
                        <Select
                          variant="quiet"
                          size="sm"
                          placeholder={column.filter.placeholder ?? 'Todos'}
                          options={column.filter.options}
                          onChange$={(value) => {
                            props.onFilter$?.({
                              key: String(column.key),
                              value,
                            });
                          }}
                        />
                      )}
                    </th>
                  ))}
                  {hasActions && <th />}
                </tr>
              )}
            </thead>

            <tbody>
              {props.loading ? (
                <tr>
                  <td
                    colSpan={
                      props.columns.length +
                      (props.selectable ? 1 : 0) +
                      (hasActions ? 1 : 0)
                    }
                  >
                    <div class="ui-data-table__state">Cargando...</div>
                  </td>
                </tr>
              ) : props.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      props.columns.length +
                      (props.selectable ? 1 : 0) +
                      (hasActions ? 1 : 0)
                    }
                  >
                    <div class="ui-data-table__state">
                      <AppIcon intent="info" size="lg" />
                      <strong>
                        {props.emptyTitle ?? 'No se encontraron registros'}
                      </strong>
                      {props.emptyDescription && (
                        <span>{props.emptyDescription}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                props.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {props.selectable && (
                      <td class="ui-data-table__select-cell">
                        <Checkbox
                          aria-label={`Seleccionar fila ${rowIndex + 1}`}
                          size="sm"
                          checked={(row as any).selected === true}
                          disabled={
                            (row as any).importStatus === 'invalid' ||
                            (row as any).importStatus === 'imported'
                          }
                          onChange$={(event) => {
                            props.onRowSelect$?.(
                              row,
                              (event.target as HTMLInputElement).checked,
                            );
                          }}
                        />
                      </td>
                    )}
                    {props.columns.map((column) => {
                      const value = getCellValue(row, column.key);
                      const badgeTone =
                        typeof column.badge === 'object'
                          ? (column.badge.toneMap?.[value] ??
                            column.badge.tone ??
                            'neutral')
                          : 'neutral';

                      return (
                        <td
                          key={String(column.key)}
                          class={column.align ? `is-${column.align}` : ''}
                        >
                          {column.badge ? (
                            <Badge size="sm" tone={badgeTone}>
                              {value}
                            </Badge>
                          ) : (
                            value
                          )}
                        </td>
                      );
                    })}
                    {hasActions && (
                      <td class="ui-data-table__actions-cell">
                        {actionMode === 'inline' ||
                        (actionMode === 'auto' &&
                          props.actions?.length === 1) ? (
                          <div class="ui-data-table__actions">
                            {props.actions?.map((action) => (
                              <IconButton
                                key={action.label}
                                label={action.label}
                                icon={action.icon}
                                size="sm"
                                variant={
                                  action.tone === 'danger' ? 'danger' : 'ghost'
                                }
                                onClick$={() => action.onClick$?.(row)}
                              />
                            ))}
                          </div>
                        ) : (
                          <div class="ui-data-table__action-menu">
                            <button
                              type="button"
                              class="ui-data-table__menu-button"
                              aria-label={`Acciones de fila ${rowIndex + 1}`}
                              aria-expanded={
                                openActionIndex.value === rowIndex
                                  ? 'true'
                                  : 'false'
                              }
                              onClick$={$(async (event) => {
                                event.stopPropagation();
                                if (openActionIndex.value === rowIndex) {
                                  openActionIndex.value = null;
                                  return;
                                }
                                const btn = (
                                  event.target as HTMLElement
                                ).closest('button');
                                if (btn) await openFromElement$(btn);
                                openActionIndex.value = rowIndex;
                              })}
                            >
                              <span />
                              <span />
                              <span />
                            </button>

                            {openActionIndex.value === rowIndex && (
                              <div
                                class="ui-data-table__action-dropdown"
                                style={`top:${menuTop.value}px;right:${menuRight.value}px`}
                              >
                                {props.actions?.map((action) => (
                                  <button
                                    key={action.label}
                                    type="button"
                                    class="ui-data-table__action-item"
                                    data-tone={action.tone}
                                    onClick$={async (event) => {
                                      event.stopPropagation();
                                      openActionIndex.value = null;
                                      await action.onClick$?.(row);
                                    }}
                                  >
                                    <AppIcon intent={action.icon} size="sm" />
                                    <span>{action.label}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {props.pagination && (
          <footer class="ui-data-table__footer">
            <span>
              Mostrando {startRecord}-{endRecord} de {props.pagination.total}{' '}
              registros
            </span>
            <div class="ui-data-table__page-size">
              <span>Mostrar</span>
              <Select
                variant="quiet"
                size="sm"
                value={String(props.pagination.limit)}
                options={pageSizeOptions.map((option) => ({
                  value: String(option),
                  label: String(option),
                }))}
                onChange$={(value) => props.onLimit$?.(Number(value))}
              />
              <span>registros</span>
            </div>
            <div class="ui-data-table__pagination">
              <IconButton
                label="Pagina anterior"
                icon="chevron-left"
                size="sm"
                variant="secondary"
                disabled={props.pagination.page <= 1}
                onClick$={() => props.onPage$?.(props.pagination!.page - 1)}
              />
              {visiblePages.map((page, index) => {
                const previousPage = visiblePages[index - 1];
                const showGap = previousPage && page - previousPage > 1;

                return (
                  <>
                    {showGap && (
                      <span class="ui-data-table__page-gap">...</span>
                    )}
                    <button
                      key={page}
                      type="button"
                      class="ui-data-table__page-button"
                      data-active={
                        page === props.pagination!.page ? 'true' : undefined
                      }
                      onClick$={() => props.onPage$?.(page)}
                    >
                      {page}
                    </button>
                  </>
                );
              })}
              <IconButton
                label="Pagina siguiente"
                icon="chevron-right"
                size="sm"
                variant="secondary"
                disabled={props.pagination.page >= totalPages}
                onClick$={() => props.onPage$?.(props.pagination!.page + 1)}
              />
            </div>
          </footer>
        )}
      </section>
    );
  },
);

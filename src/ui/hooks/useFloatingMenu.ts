import { $, useSignal } from '@builder.io/qwik';

/**
 * Shared hook for all dropdown/menu components.
 * Uses position: fixed + getBoundingClientRect so the menu escapes
 * any overflow:hidden/auto ancestor (e.g. the app shell scroll container).
 *
 * Usage with a fixed anchor ref (Select, SearchSelect):
 *   const menu = useFloatingMenu();
 *   <div ref={menu.anchorRef}>
 *   <button onClick$={menu.toggleFromRef$} />   // or openFromRef$
 *   <div style={menu.leftStyle.value} />
 *
 * Usage with a dynamic element (DataTable per-row buttons):
 *   const menu = useFloatingMenu();
 *   onClick$={$((e) => {
 *     const btn = (e.target as HTMLElement).closest('button')!;
 *     menu.openFromElement$(btn);
 *   })}
 *   <div style={menu.rightStyle.value} />
 */
export const useFloatingMenu = () => {
  const open = useSignal(false);
  const anchorRef = useSignal<Element>();
  const menuTop = useSignal(0);
  const menuLeft = useSignal(0);
  const menuRight = useSignal(0);
  const menuWidth = useSignal(0);

  // For fixed-anchor components (Select, SearchSelect)
  const openFromRef$ = $(() => {
    if (!anchorRef.value) return;
    const rect = (anchorRef.value as HTMLElement).getBoundingClientRect();
    menuTop.value = rect.bottom + 4;
    menuLeft.value = rect.left;
    menuRight.value = document.documentElement.clientWidth - rect.right;
    menuWidth.value = rect.width;
    open.value = true;
  });

  const toggleFromRef$ = $(() => {
    if (!open.value && anchorRef.value) {
      const rect = (anchorRef.value as HTMLElement).getBoundingClientRect();
      menuTop.value = rect.bottom + 4;
      menuLeft.value = rect.left;
      menuRight.value = document.documentElement.clientWidth - rect.right;
      menuWidth.value = rect.width;
    }
    open.value = !open.value;
  });

  // For dynamic-anchor components (DataTable per-row buttons)
  const openFromElement$ = $((el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    menuTop.value = rect.bottom + 4;
    menuLeft.value = rect.left;
    menuRight.value = document.documentElement.clientWidth - rect.right;
    menuWidth.value = rect.width;
    open.value = true;
  });

  // Computed style strings used in inline style prop
  const leftStyle = {
    get value() {
      return `top:${menuTop.value}px;left:${menuLeft.value}px;width:${menuWidth.value}px`;
    },
  };

  const rightStyle = {
    get value() {
      return `top:${menuTop.value}px;right:${menuRight.value}px`;
    },
  };

  return {
    open,
    anchorRef,
    menuTop,
    menuLeft,
    menuRight,
    menuWidth,
    openFromRef$,
    toggleFromRef$,
    openFromElement$,
    leftStyle,
    rightStyle,
  };
};

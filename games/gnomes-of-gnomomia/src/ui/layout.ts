// Screen layout shared by the UI modules: when to use the compact (phone) layout, the bottom stack it builds
// (hotbar, then chat log, then side panel), the top-left dock (online pill, chat and bag buttons), and a long-press
// helper, since iOS never fires contextmenu on a touch.
import { UI } from '../config';

/** A touch screen (phone or tablet). Tap targets get bigger and the composer moves to the top. */
export const TOUCH = typeof matchMedia === 'function' && (matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0);

/** Phones, either way up: narrow or short screens get the compact layout. */
export function compact(): boolean {
  return innerWidth < 700 || innerHeight < 500;
}

/** Narrow (portrait phone): the chat log takes the full width, so the side panel sits above it. */
export function narrow(): boolean {
  return innerWidth < 700;
}

/** Edge offsets that clear a notch or home bar (index.html sets viewport-fit=cover). */
export const EDGE = {
  left: 'max(8px, env(safe-area-inset-left))',
  right: 'max(8px, env(safe-area-inset-right))',
  bottom: 'max(8px, env(safe-area-inset-bottom))',
};

/** Hotbar slot size: smaller on very narrow phones so all eight slots fit. */
export function slotPx(): number {
  return innerWidth < 390 ? 34 : 40;
}

/** Height of the hotbar box: slot, 4 px padding and 2 px border on each side. */
export function hotbarHeight(): number {
  return slotPx() + 12;
}

/** Compact chat log height. */
export function chatLogHeight(): number {
  return innerHeight < 500 ? 72 : 86;
}

/** `bottom` (CSS) of something stacked `above` px over the bottom edge. */
export function fromBottom(above: number): string {
  return `calc(${EDGE.bottom} + ${above}px)`;
}

/** Runs fn now and whenever the screen is resized or turned. */
export function onLayout(fn: () => void): void {
  window.addEventListener('resize', fn);
  window.addEventListener('orientationchange', fn);
  fn();
}

let dockEl: HTMLDivElement | null = null;

/** The top-left row under the hover text: the online pill, the chat button and (compact) the bag button. */
export function dock(parent: HTMLElement): HTMLDivElement {
  if (dockEl) return dockEl;
  dockEl = document.createElement('div');
  Object.assign(dockEl.style, {
    position: 'absolute', left: EDGE.left, top: '30px', display: 'flex', gap: '6px', alignItems: 'stretch',
    pointerEvents: 'none', zIndex: '5',
  } satisfies Partial<CSSStyleDeclaration>);
  dockEl.id = 'dock';
  parent.appendChild(dockEl);
  // The orbs and XP bar take the top-right 192 px down to about 96 px: on a narrow phone the dock goes under them.
  const el = dockEl;
  onLayout(() => {
    el.style.top = innerWidth < 440 ? '96px' : '30px';
  });
  return dockEl;
}

/** Bottom edge of the dock in CSS pixels, for things that open under it. */
export function dockBottom(): number {
  return dockEl ? dockEl.getBoundingClientRect().bottom : 56;
}

/** A square dock button with an emoji face. */
export function dockButton(parent: HTMLElement, face: string, title: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.textContent = face;
  b.title = title;
  b.setAttribute('aria-label', title);
  const px = TOUCH ? 38 : 26;
  Object.assign(b.style, {
    pointerEvents: 'auto', cursor: 'pointer', width: `${px}px`, minHeight: `${px}px`, padding: '0',
    fontSize: TOUCH ? '18px' : '14px', lineHeight: '1', background: UI.panelBg,
    color: UI.text, border: `2px solid ${UI.border}`, boxSizing: 'border-box', touchAction: 'manipulation',
  } satisfies Partial<CSSStyleDeclaration>);
  parent.appendChild(b);
  return b;
}

const LONG_PRESS_MS = 500;
const LONG_PRESS_PX = 10;
/** Until this time (ms), a contextmenu event is the browser's own echo of a long press we already handled. */
let echoUntil = 0;

/**
 * Calls fn on a right-click, and on a touch held still for LONG_PRESS_MS. The click that ends a long press is
 * swallowed, so a held hotbar slot opens its menu without also casting.
 */
export function onMenu(el: HTMLElement, fn: (x: number, y: number) => void): void {
  let timer: number | undefined;
  let start: { x: number; y: number } | null = null;
  let fired = false;
  const cancel = (): void => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    start = null;
  };
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    cancel();
    fired = false;
    start = { x: e.clientX, y: e.clientY };
    const { x, y } = start;
    timer = window.setTimeout(() => {
      timer = undefined;
      fired = true;
      echoUntil = performance.now() + 800;
      fn(x, y);
    }, LONG_PRESS_MS);
  });
  el.addEventListener('pointermove', (e) => {
    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > LONG_PRESS_PX) cancel();
  });
  el.addEventListener('pointerup', cancel);
  el.addEventListener('pointercancel', cancel);
  el.addEventListener('click', (e) => {
    if (!fired) return;
    fired = false;
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);
  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (performance.now() < echoUntil || timer !== undefined) return;
    fn(e.clientX, e.clientY);
  });
}

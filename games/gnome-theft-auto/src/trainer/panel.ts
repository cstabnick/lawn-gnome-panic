// The Save Trainer pop-out panel: tabs from listTrainerSections(), a scrolling body that builds the chosen tab, the
// "Trained save" badge, touch and gamepad control. The DOM is built on the first open only; no frame loop runs while closed.
import { firstPad } from '@lawn/gamepad';
import { KEYS } from '../keys';
import { readTrainerMark } from './mark';
import { listTrainerSections } from './registry';
import { button, note, TRAINER_CSS } from './ui';
import type { TrainerCtx } from './types';

const TAB_KEY = 'gta-trainer-tab';

type Pad = NonNullable<ReturnType<typeof firstPad>>;
interface PadState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  lb: boolean;
  rb: boolean;
  a: boolean;
  b: boolean;
  start: boolean;
}

let root: HTMLDivElement | null = null;
let tabBar: HTMLDivElement | null = null;
let body: HTMLDivElement | null = null;
let badge: HTMLSpanElement | null = null;
let ctxRef: TrainerCtx | null = null;
let currentTab: string | null = null;
let open = false;
let padPrev: PadState = emptyPad();
let rafId = 0;

function emptyPad(): PadState {
  return { up: false, down: false, left: false, right: false, lb: false, rb: false, a: false, b: false, start: false };
}

function readPad(p: Pad): PadState {
  const btn = (i: number): boolean => p.buttons[i]?.pressed === true;
  const y = p.axes[1] ?? 0;
  return {
    up: btn(12) || y < -0.6,
    down: btn(13) || y > 0.6,
    left: btn(14),
    right: btn(15),
    lb: btn(4),
    rb: btn(5),
    a: btn(0),
    b: btn(1),
    start: btn(9),
  };
}

function savedTab(): string | null {
  try {
    return localStorage.getItem(TAB_KEY);
  } catch {
    return null;
  }
}

function rememberTab(id: string): void {
  try {
    localStorage.setItem(TAB_KEY, id);
  } catch {
    // storage blocked: the tab just is not remembered
  }
}

function paintBadge(): void {
  if (badge) badge.style.display = readTrainerMark() ? 'inline-block' : 'none';
}

function paintTabs(): void {
  if (!tabBar) return;
  tabBar.replaceChildren(
    ...listTrainerSections().map((s) => {
      const b = button(s.label, () => showTab(s.id));
      b.dataset.tab = s.id;
      b.style.flex = 'none';
      b.style.whiteSpace = 'nowrap';
      return b;
    }),
  );
}

/** Build the DOM once: style, root, header (title, badge, close), tab bar, body. */
function buildOnce(ctx: TrainerCtx): void {
  if (root) return;
  const style = document.createElement('style');
  style.textContent = TRAINER_CSS;
  document.head.append(style);

  const el = document.createElement('div');
  el.id = 'gta-trainer';

  const header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 8px 6px 12px;flex:none;';

  const title = document.createElement('strong');
  title.textContent = 'Save Trainer';
  title.style.cssText = 'flex:1 1 auto;font-size:16px;min-width:0;';

  const pill = document.createElement('span');
  pill.textContent = 'Trained save';
  pill.style.cssText = 'display:none;background:#ffd23f;color:#111;border-radius:999px;padding:2px 8px;font-size:11px;white-space:nowrap;';
  badge = pill;

  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = '✕';
  close.setAttribute('aria-label', 'Close trainer');
  close.style.cssText = 'min-width:44px;min-height:44px;background:transparent;border:0;color:#fff;font-size:18px;cursor:pointer;';
  close.addEventListener('click', () => closeTrainerPanel());

  header.append(title, pill, close);

  tabBar = document.createElement('div');
  tabBar.style.cssText = 'display:flex;gap:6px;overflow-x:auto;padding:0 10px 8px;flex:none;';

  body = document.createElement('div');
  body.style.cssText = 'flex:1 1 auto;min-height:0;overflow-y:auto;padding:0 10px 10px;touch-action:pan-y;overscroll-behavior:contain;';

  el.append(header, tabBar, body);
  ctx.ui.append(el);
  root = el;

  // Keep touches, clicks and wheel on the panel from reaching the game underneath (stick, camera drag, pointer lock).
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  el.addEventListener('wheel', (e) => e.stopPropagation());
  el.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });

  window.addEventListener('keydown', (e) => {
    if (open && e.code === KEYS.close) closeTrainerPanel();
  });
}

/** Empty the body and build the section `id` into it. */
function showTab(id: string): void {
  if (!root || !ctxRef || !body || !tabBar) return;
  const section = listTrainerSections().find((s) => s.id === id);
  if (!section) return;
  for (const b of tabBar.querySelectorAll<HTMLButtonElement>('button')) b.classList.toggle('on', b.dataset.tab === id);

  body.replaceChildren();
  const holder = document.createElement('div');
  body.append(holder);
  try {
    section.build(holder, ctxRef);
  } catch (err) {
    holder.append(note('This tab failed: ' + (err instanceof Error ? err.message : String(err))));
    console.error(err);
  }
  currentTab = id;
  rememberTab(id);
  body.scrollTop = 0;
  paintBadge();
}

/** Focusable, visible controls inside `container`. */
function focusablesIn(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('button, select, input, textarea')].filter((el) => el.offsetParent !== null);
}

function focusFirstInBody(): void {
  if (!body) return;
  const first = focusablesIn(body)[0];
  if (first) first.focus();
}

function moveFocus(dir: 1 | -1): void {
  if (!root) return;
  const list = focusablesIn(root);
  if (!list.length) return;
  const i = list.indexOf(document.activeElement as HTMLElement);
  const next = i < 0 ? list[dir > 0 ? 0 : list.length - 1] : list[(i + dir + list.length) % list.length];
  next.focus();
  next.scrollIntoView({ block: 'nearest' });
}

function switchTab(dir: 1 | -1): void {
  if (!tabBar) return;
  const ids = [...tabBar.querySelectorAll<HTMLButtonElement>('button')].map((b) => b.dataset.tab ?? '');
  if (!ids.length) return;
  const i = currentTab ? ids.indexOf(currentTab) : -1;
  const next = ids[i < 0 ? (dir > 0 ? 0 : ids.length - 1) : (i + dir + ids.length) % ids.length];
  showTab(next);
  focusFirstInBody();
}

function activate(): void {
  if (!root) return;
  const el = document.activeElement;
  if (!(el instanceof HTMLElement) || !root.contains(el)) return;
  if (el instanceof HTMLSelectElement) {
    if (!el.options.length) return;
    el.selectedIndex = (el.selectedIndex + 1) % el.options.length;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    el.click();
  }
}

function pollPad(): void {
  rafId = 0;
  if (!open) return;
  const p = firstPad();
  if (p) {
    const cur = readPad(p);
    const edge = (k: keyof PadState): boolean => cur[k] && !padPrev[k];
    if (edge('up')) moveFocus(-1);
    if (edge('down')) moveFocus(1);
    if (edge('left') || edge('lb')) switchTab(-1);
    if (edge('right') || edge('rb')) switchTab(1);
    if (edge('a')) activate();
    if (edge('b') || edge('start')) {
      closeTrainerPanel();
      return;
    }
    padPrev = cur;
  }
  rafId = requestAnimationFrame(pollPad);
}

/** Snapshot the pad at open (a button already held does not count) and start the loop. */
function startPad(): void {
  const p = firstPad();
  padPrev = p ? readPad(p) : emptyPad();
  if (!rafId) rafId = requestAnimationFrame(pollPad);
}

export function openTrainerPanel(ctx: TrainerCtx, tab?: string): void {
  ctxRef = ctx;
  buildOnce(ctx);
  if (!root || !tabBar || !body) return;

  paintTabs();
  paintBadge();
  const sections = listTrainerSections();
  const ids = new Set(sections.map((s) => s.id));
  const saved = savedTab();
  const pick =
    tab && ids.has(tab) ? tab
    : currentTab && ids.has(currentTab) ? currentTab
    : saved && ids.has(saved) ? saved
    : sections[0]?.id;

  open = true;
  root.classList.add('open');
  document.body.dataset.options = 'open';
  if (document.pointerLockElement) document.exitPointerLock();
  if (pick) showTab(pick);
  if (firstPad()) tabBar.querySelector<HTMLButtonElement>('button.on')?.focus({ preventScroll: true });
  startPad();
}

export function closeTrainerPanel(): void {
  if (!open) return;
  open = false;
  if (root) {
    if (root.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
    root.classList.remove('open');
  }
  document.body.dataset.options = '';
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
}

export function isTrainerOpen(): boolean {
  return open;
}

/** Empty the shown tab and build it again (a section calls this after a change that alters what it lists). */
export function refreshTrainerTab(): void {
  if (!open || !body || !currentTab) return;
  const top = body.scrollTop;
  showTab(currentTab);
  body.scrollTop = top;
}

export function toggleTrainer(ctx: TrainerCtx, tab?: string): void {
  if (!open) {
    openTrainerPanel(ctx, tab);
    return;
  }
  if (tab && tab !== currentTab) {
    ctxRef = ctx;
    showTab(tab);
    return;
  }
  closeTrainerPanel();
}

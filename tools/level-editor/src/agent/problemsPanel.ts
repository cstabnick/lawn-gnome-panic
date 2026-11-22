// The Problems window: a header button "Problems (n)" that opens a list of collectProblems(ctx); clicking a row selects the item
// and flies the camera to it.
import type { EditorContext } from '../context';
import { collectProblems } from './problems';
import type { Problem } from './types';

const DEBOUNCE_MS = 300;
const FLY_DISTANCE = 40;

// Injected once on mount: the editor's own stylesheet is left alone.
const CSS = `
#le-problems { margin-left: auto; }
#le-problems.bad { border-color: #ff7a7a; color: #ff7a7a; }
.le-problems { position: fixed; top: 44px; right: 8px; width: 360px; max-width: calc(100vw - 16px); max-height: 60vh; overflow-y: auto;
  background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 8px; z-index: 50; box-shadow: 0 6px 20px rgba(0,0,0,.4); }
.le-problems .le-problems-top { margin-bottom: 6px; }
.le-problems .le-problems-row { display: flex; gap: 6px; padding: 4px; border-radius: 4px; cursor: pointer; }
.le-problems .le-problems-row:hover { background: #2e323b; }
.le-problems .le-mark-error { color: #ff7a7a; font-weight: bold; }
.le-problems .le-mark-warning { color: #e8c15a; font-weight: bold; }
.le-problems .le-problems-empty { color: var(--dim); padding: 4px; }
`;

let styled = false;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Mounts the button into `head` (the #le-head bar) and the list window into document.body. refresh() re-runs the checks. */
export function mountProblems(ctx: EditorContext, head: HTMLElement): { refresh(reach?: boolean): void } {
  if (!styled) {
    styled = true;
    const style = el('style');
    style.textContent = CSS;
    document.head.append(style);
  }

  const button = el('button');
  button.id = 'le-problems';
  button.type = 'button';
  head.append(button);

  let win: HTMLDivElement | null = null;
  let problems: Problem[] = [];
  let timer: number | undefined;

  function close(): void {
    win?.remove();
    win = null;
  }

  function focusRow(p: Problem): void {
    if (p.zone !== ctx.zone) ctx.setZone(p.zone as EditorContext['zone']);
    if (p.x !== undefined && p.z !== undefined) ctx.viewport.focus(p.x, p.z, FLY_DISTANCE);
    if (p.ref) ctx.select(p.ref);
  }

  function renderWindow(): void {
    if (!win) return;
    const top = el('div', 'le-problems-top');
    const reachBtn = el('button', undefined, 'Check reachability too');
    reachBtn.type = 'button';
    reachBtn.addEventListener('click', () => refresh(true));
    top.append(reachBtn);
    win.replaceChildren(top);
    if (problems.length === 0) {
      win.append(el('div', 'le-problems-empty', 'No problems in this level.'));
      return;
    }
    for (const p of problems) {
      const row = el('div', 'le-problems-row');
      row.append(el('span', p.severity === 'error' ? 'le-mark-error' : 'le-mark-warning', p.severity === 'error' ? '✕' : '!'), el('span', undefined, p.msg));
      row.addEventListener('click', () => focusRow(p));
      win.append(row);
    }
  }

  function refresh(reach = false): void {
    problems = collectProblems(ctx, { reach });
    const errors = problems.filter((p) => p.severity === 'error').length;
    button.textContent = `Problems (${problems.length})`;
    button.classList.toggle('bad', errors > 0);
    renderWindow();
  }

  button.addEventListener('click', () => {
    if (win) {
      close();
      return;
    }
    win = el('div', 'le-problems');
    document.body.append(win);
    renderWindow();
  });

  // Live: a change to the level or a zone switch re-runs the cheap checks (not reachability).
  const schedule = (): void => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => refresh(), DEBOUNCE_MS);
  };
  ctx.events.changed.on(schedule);
  ctx.events.zone.on(schedule);

  refresh();
  return { refresh };
}

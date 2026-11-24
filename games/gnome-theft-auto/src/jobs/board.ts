// Sim jobs: the phone's Jobs app panel (the job board). Lists the four jobs with level, XP and perks, signs on or off,
// buys a licence, and calls a player cab (a real online driver) to a named place. DOM only; runtime.ts feeds it a view.
import { firstPad } from '@lawn/gamepad';
import { KEYS } from '../keys';
import type { RiderPhase } from './cabCalls';
import type { JobId } from './types';

export interface BoardRow {
  job: JobId;
  title: string;
  icon: string;
  employer: string;
  blurb: string;
  level: number;
  xpInto: number;
  xpNeed: number;
  licensed: boolean;
  /** Acorns to sign on (0 = free). */
  licence: number;
  onDuty: boolean;
  /** Why "Go on duty" cannot run now ("Get in a boat first."), or null when it can. */
  blocked: string | null;
  perks: string[];
  done: number;
  earned: number;
}

export interface BoardView {
  rows: BoardRow[];
  /** My player-cab call (rider side). */
  cab: { phase: RiderPhase; driver: string | null; dest: string | null };
  /** Where a cab can take me. */
  places: { id: string; name: string }[];
  /** On taxi duty: open player calls ("Bess -> Clay-Mart, 230 m"). */
  calls: { key: string; label: string }[];
  /** Online with other players (the cab section says "Online only" otherwise). */
  online: boolean;
  shiftEarned: number;
}

export interface BoardActions {
  duty(job: JobId): void;
  offDuty(): void;
  buyLicence(job: JobId): void;
  callCab(dest: string): void;
  cancelCab(): void;
  takeCall(key: string): void;
}

export interface JobBoard {
  open(view: BoardView): void;
  /** Redraw with a new view while open (no-op when closed). */
  refresh(view: BoardView): void;
  close(): void;
  isOpen(): boolean;
}

const STYLE_ID = 'gta-job-board-css';
const CSS = `
#gta-job-board{position:fixed;right:calc(env(safe-area-inset-right) + 10px);top:calc(env(safe-area-inset-top) + 60px);z-index:37;width:min(340px,calc(100vw - 24px));max-height:78vh;overflow-y:auto;box-sizing:border-box;display:none;flex-direction:column;gap:8px;padding:12px;background:#14181c;border:2px solid rgba(255,255,255,.25);border-radius:18px;color:#fff;font-family:system-ui,sans-serif;pointer-events:auto;touch-action:pan-y;}
#gta-job-board .gta-jb-head{display:flex;align-items:center;justify-content:space-between;gap:8px;}
#gta-job-board .gta-jb-h{font-weight:700;font-size:18px;}
#gta-job-board .gta-jb-x{width:44px;height:44px;box-sizing:border-box;border-radius:50%;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;font-size:18px;line-height:1;padding:0;cursor:pointer;touch-action:manipulation;}
#gta-job-board .gta-jb-sec{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:rgba(255,255,255,.7);margin-top:4px;}
#gta-job-board .gta-jb-card{display:flex;flex-direction:column;gap:6px;padding:10px;border:1px solid rgba(255,255,255,.15);border-radius:12px;background:#1f252b;}
#gta-job-board .gta-jb-top{display:flex;align-items:center;gap:10px;}
#gta-job-board .gta-jb-icon{font-size:22px;flex:0 0 auto;}
#gta-job-board .gta-jb-names{display:flex;flex-direction:column;min-width:0;}
#gta-job-board .gta-jb-name{font-weight:700;font-size:15px;}
#gta-job-board .gta-jb-emp{font-size:12px;color:rgba(255,255,255,.7);}
#gta-job-board .gta-jb-lv{font-size:12px;font-weight:700;}
#gta-job-board .gta-jb-xp{height:6px;border-radius:3px;background:rgba(255,255,255,.15);overflow:hidden;}
#gta-job-board .gta-jb-xpf{height:100%;background:#7cf0ff;}
#gta-job-board .gta-jb-stats{font-size:12px;color:rgba(255,255,255,.8);}
#gta-job-board .gta-jb-blurb{font-size:12px;color:rgba(255,255,255,.75);}
#gta-job-board .gta-jb-perks{margin:0;padding-left:18px;font-size:12px;color:rgba(255,255,255,.85);}
#gta-job-board .gta-jb-note{font-size:13px;color:rgba(255,255,255,.75);}
#gta-job-board .gta-jb-why{font-size:12px;color:#ffb36b;}
#gta-job-board .gta-jb-btn{min-height:44px;width:100%;box-sizing:border-box;padding:8px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.3);background:#2a323a;color:#fff;font:700 14px system-ui,sans-serif;text-align:center;cursor:pointer;touch-action:manipulation;}
#gta-job-board .gta-jb-btn:disabled{opacity:.45;cursor:not-allowed;}
#gta-job-board .gta-jb-foot{font-size:13px;font-weight:700;text-align:right;color:#ffd23f;}
`;

function injectCss(): void {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = CSS;
  document.head.append(s);
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function btn(label: string, onClick: () => void, extra = ''): HTMLButtonElement {
  const b = el('button', extra ? `gta-jb-btn ${extra}` : 'gta-jb-btn', label);
  b.type = 'button';
  b.addEventListener('click', () => onClick());
  return b;
}

function card(r: BoardRow, actions: BoardActions): HTMLElement {
  const c = el('div', 'gta-jb-card');
  const top = el('div', 'gta-jb-top');
  const names = el('div', 'gta-jb-names');
  names.append(el('div', 'gta-jb-name', r.title), el('div', 'gta-jb-emp', r.employer));
  top.append(el('span', 'gta-jb-icon', r.icon), names);

  const xp = el('div', 'gta-jb-xp');
  const fill = el('div', 'gta-jb-xpf');
  const pct = r.xpNeed <= 0 ? 100 : Math.max(0, Math.min(100, (r.xpInto / r.xpNeed) * 100));
  fill.style.width = `${pct}%`;
  xp.append(fill);

  c.append(
    top,
    el('div', 'gta-jb-lv', `Lv ${r.level}`),
    xp,
    el('div', 'gta-jb-stats', `Done: ${r.done} · Earned: ${r.earned} 🌰`),
    el('div', 'gta-jb-blurb', r.blurb),
  );
  if (r.perks.length > 0) {
    const ul = el('ul', 'gta-jb-perks');
    for (const p of r.perks) ul.append(el('li', '', p));
    c.append(ul);
  }

  if (r.onDuty) {
    c.append(btn('Go off duty', () => actions.offDuty()));
  } else if (!r.licensed && r.licence > 0) {
    c.append(btn(`Licence ${r.licence} 🌰`, () => actions.buyLicence(r.job)));
  } else {
    const b = btn('Go on duty', () => actions.duty(r.job));
    if (r.blocked !== null) {
      b.disabled = true;
      c.append(b, el('div', 'gta-jb-why', r.blocked));
    } else {
      c.append(b);
    }
  }
  return c;
}

export function createJobBoard(ui: HTMLElement, actions: BoardActions): JobBoard {
  injectCss();

  const panel = el('div', 'gta-jb-panel');
  panel.id = 'gta-job-board';
  const head = el('div', 'gta-jb-head');
  const closeBtn = el('button', 'gta-jb-x', '✕');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close');
  head.append(el('div', 'gta-jb-h', 'Jobs'), closeBtn);
  const body = el('div', 'gta-jb-body');
  panel.append(head, body);
  panel.style.display = 'none';
  ui.append(panel);

  let view: BoardView | null = null;
  let opened = false;
  let focus = 0;
  let raf = 0;
  let padPrev: boolean[] = [];

  // Taps on the panel must not reach the game underneath.
  panel.addEventListener('pointerdown', (e) => e.stopPropagation());
  closeBtn.addEventListener('click', () => close());

  function focusables(): HTMLButtonElement[] {
    return Array.from(panel.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
  }

  // The focus ring shows only with a gamepad connected.
  function highlight(): void {
    const items = focusables();
    const ring = firstPad() !== null;
    if (focus >= items.length) focus = Math.max(0, items.length - 1);
    for (const b of panel.querySelectorAll<HTMLButtonElement>('button')) b.style.outline = '';
    const cur = items[focus];
    if (ring && cur) cur.style.outline = '3px solid #7cf0ff';
  }

  function move(d: number): void {
    const items = focusables();
    if (items.length === 0) return;
    focus = (focus + d + items.length) % items.length;
    highlight();
  }

  function render(): void {
    const v = view;
    if (!v) return;
    const nodes: HTMLElement[] = v.rows.map((r) => card(r, actions));

    nodes.push(el('div', 'gta-jb-sec', 'Call a cab'));
    if (!v.online) {
      nodes.push(el('div', 'gta-jb-note', 'Online only: another player on taxi duty drives you.'));
    } else {
      const dest = v.cab.dest ?? 'your stop';
      const driver = v.cab.driver ?? 'A driver';
      switch (v.cab.phase) {
        case 'idle':
          for (const p of v.places) nodes.push(btn(p.name, () => actions.callCab(p.id)));
          break;
        case 'calling':
          nodes.push(el('div', 'gta-jb-note', `Waiting for a driver to ${dest}...`));
          nodes.push(btn('Cancel', () => actions.cancelCab()));
          break;
        case 'assigned':
          nodes.push(el('div', 'gta-jb-note', `${driver} is on the way`));
          nodes.push(btn('Cancel', () => actions.cancelCab()));
          break;
        case 'riding':
          nodes.push(el('div', 'gta-jb-note', `Riding with ${driver} to ${dest}`));
          break;
      }
    }

    if (v.calls.length > 0) {
      nodes.push(el('div', 'gta-jb-sec', 'Player calls'));
      for (const c of v.calls) nodes.push(btn(c.label, () => actions.takeCall(c.key)));
    }

    nodes.push(el('div', 'gta-jb-foot', `This shift: ${v.shiftEarned} 🌰`));
    body.replaceChildren(...nodes);
  }

  function poll(): void {
    raf = 0;
    if (!opened) return;
    const p = firstPad();
    const down = p ? p.buttons.map((b) => b.pressed) : [];
    const press = (i: number): boolean => !!down[i] && !padPrev[i];
    if (press(12)) move(-1);
    if (press(13)) move(1);
    if (press(0)) {
      focusables()[focus]?.click();
      highlight();
    }
    if (press(1)) {
      close();
      return;
    }
    padPrev = down;
    raf = requestAnimationFrame(poll);
  }

  function open(v: BoardView): void {
    view = v;
    render();
    // Start the focus on the first job button, not the close button.
    const items = focusables();
    const first = items.findIndex((b) => body.contains(b));
    focus = first >= 0 ? first : 0;
    panel.style.display = 'flex';
    opened = true;
    highlight();
    // Buttons already held when it opened must not count as new presses.
    const p = firstPad();
    padPrev = p ? p.buttons.map((b) => b.pressed) : [];
    if (!raf) raf = requestAnimationFrame(poll);
  }

  function refresh(v: BoardView): void {
    if (!opened) return;
    view = v;
    const keep = panel.scrollTop;
    render();
    highlight();
    panel.scrollTop = keep;
  }

  function close(): void {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    opened = false;
    panel.style.display = 'none';
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === KEYS.close && opened) close();
  });

  return { open, refresh, close, isOpen: () => opened };
}

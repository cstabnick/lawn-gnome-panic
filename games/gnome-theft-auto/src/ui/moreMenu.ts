// The More menu: one ☰ button (Tab on a keyboard, View on a pad) opens a grid of everything that is not a core action:
// phone, emotes, quest journal, map, taxi, Pocket Kit, party, the three nature journals, mute, options, plus a "Here"
// row with the contextual dock actions. Up to three tiles can be pinned (long-press or pad X); pinned tiles also show
// as one-tap buttons beside ☰ (not in the minimal touch layout).

import { firstPad } from '@lawn/gamepad';
import {
  ACTIONS, actionDef, isAvailable, isRegistered, onActionsChange, padBinding, registerAction, runAction, type ActionId,
} from './actions';
import { KEYS, MOVE_KEYS, isTyping } from '../keys';
import { ensureGlyphStyle, glyphText } from './glyphs';
import { currentGlyphSet, onInputSourceChange, type GlyphSet } from './inputSource';
import { visibleDockActions } from './dock';
import { ensureButtonStyle } from './style';

export interface MoreMenu {
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
}

const PINS_KEY = 'gta-more-pins';
const MAX_PINS = 3;
const DEFAULT_PINS: readonly ActionId[] = ['phone', 'journal'];
const LONG_PRESS_MS = 500;
const MOVE_SLOP_PX = 10;
const STICK_DEAD = 0.6;

export const MORE_CSS = `
#gta-more-btn{position:fixed;right:calc(env(safe-area-inset-right) + 10px);
top:calc(env(safe-area-inset-top) + max(18px,4vw) + var(--gta-map,128px) + 8px);z-index:30;width:44px;height:44px;}
#gta-more-pins{position:fixed;right:calc(env(safe-area-inset-right) + 158px);
top:calc(env(safe-area-inset-top) + max(18px,4vw) + var(--gta-map,128px) + 8px);z-index:30;display:flex;
flex-direction:row-reverse;gap:8px;pointer-events:none;}
#gta-more-pins .gta-btn{width:44px;height:44px;}
body[data-touch-layout="minimal"] #gta-more-pins{display:none}
body.gta-in-scene #gta-more-btn, body.gta-in-scene #gta-more-pins{display:none!important}
#gta-more{position:fixed;inset:0;z-index:44;display:none;align-items:center;justify-content:center;pointer-events:auto;
background:rgba(0,0,0,.45);box-sizing:border-box;
padding:calc(env(safe-area-inset-top) + 16px) calc(env(safe-area-inset-right) + 16px) calc(env(safe-area-inset-bottom) + 16px) calc(env(safe-area-inset-left) + 16px);}
#gta-more .gta-more-card{box-sizing:border-box;width:min(92vw,520px);
max-height:calc(100dvh - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom));overflow-y:auto;
-webkit-overflow-scrolling:touch;background:rgba(14,16,18,.95);border:2px solid rgba(255,255,255,.6);border-radius:16px;
padding:12px;color:#fff;font:600 13px system-ui,sans-serif;}
#gta-more .gta-more-head{display:flex;align-items:center;justify-content:space-between;margin:0 0 8px 4px;}
#gta-more .gta-more-title{font-size:16px;}
#gta-more .gta-more-x{width:44px;height:44px;min-width:44px;border-radius:12px;border:2px solid rgba(255,255,255,.3);
background:rgba(255,255,255,.08);color:#fff;font:600 18px system-ui,sans-serif;cursor:pointer;}
#gta-more .gta-more-h{font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.7;margin:10px 4px 6px;}
#gta-more .gta-more-grid{display:grid;gap:8px;}
#gta-more .gta-more-tile{position:relative;min-height:72px;border-radius:12px;background:rgba(255,255,255,.08);
border:2px solid rgba(255,255,255,.2);color:#fff;font:600 12px system-ui,sans-serif;display:flex;flex-direction:column;
align-items:center;justify-content:center;gap:2px;padding:6px 4px;cursor:pointer;touch-action:manipulation;
-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;}
#gta-more .gta-more-ic{font-size:26px;line-height:1;}
#gta-more .gta-more-lbl{text-align:center;line-height:1.15;}
#gta-more .gta-more-hint{font-size:10px;opacity:.7;}
#gta-more .gta-more-pin{position:absolute;top:2px;right:4px;font-size:11px;}
#gta-more .gta-more-tile.gta-more-ring{outline:3px solid #7cf0ff;outline-offset:1px;}
`;

function injectCss(): void {
  if (document.getElementById('gta-more-style')) return;
  const s = document.createElement('style');
  s.id = 'gta-more-style';
  s.textContent = MORE_CSS;
  document.head.append(s);
}

function elm<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function loadPins(valid: ReadonlySet<ActionId>): ActionId[] {
  try {
    const raw = localStorage.getItem(PINS_KEY);
    if (raw === null) return [...DEFAULT_PINS];
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return [...DEFAULT_PINS];
    const out: ActionId[] = [];
    for (const x of v) {
      if (typeof x === 'string' && valid.has(x as ActionId) && !out.includes(x as ActionId)) out.push(x as ActionId);
    }
    return out.slice(-MAX_PINS);
  } catch {
    return [...DEFAULT_PINS];
  }
}

function savePins(pins: readonly ActionId[]): void {
  try {
    localStorage.setItem(PINS_KEY, JSON.stringify(pins));
  } catch {
    // Storage blocked: the pins hold for this session.
  }
}

type Pad = NonNullable<ReturnType<typeof firstPad>>;

/** The pad controls this menu reads, as booleans: D-pad or stick past the dead zone, A, X, and B or View. */
interface PadEdge { u: boolean; d: boolean; l: boolean; r: boolean; a: boolean; x: boolean; b: boolean; }
const NO_EDGE: PadEdge = { u: false, d: false, l: false, r: false, a: false, x: false, b: false };

function padEdge(p: Pad): PadEdge {
  const pr = (i: number): boolean => !!p.buttons[i]?.pressed;
  const x = p.axes[0] ?? 0;
  const y = p.axes[1] ?? 0;
  return {
    u: pr(12) || y < -STICK_DEAD,
    d: pr(13) || y > STICK_DEAD,
    l: pr(14) || x < -STICK_DEAD,
    r: pr(15) || x > STICK_DEAD,
    a: pr(0),
    x: pr(2),
    b: pr(1) || pr(8),
  };
}

function columns(): number {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w < 360) return 3;
  if (w > h && h < 500) return 6;
  return 4;
}

const inKeys = (list: readonly string[], code: string): boolean => list.includes(code);

interface Tile { id: ActionId; el: HTMLButtonElement; }

/** Builds the ☰ button, the pinned row and the grid under `ui`. Listens for KEYS.more and the 'gta:more' window event. */
export function createMoreMenu(ui: HTMLElement): MoreMenu {
  ensureButtonStyle();
  ensureGlyphStyle();
  injectCss();

  const valid = new Set<ActionId>(ACTIONS.map((a) => a.id));
  let pins = loadPins(valid);
  let isOpen = false;
  let focus = 0;
  let cols = 4;
  let tiles: Tile[] = [];
  let padPrev: PadEdge = NO_EDGE;
  let set: GlyphSet = currentGlyphSet();

  const btn = elm('button', 'gta-btn gta-btn--icon', '☰');
  btn.id = 'gta-more-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'More');

  const pinRow = elm('div', '');
  pinRow.id = 'gta-more-pins';

  const panel = elm('div', '');
  panel.id = 'gta-more';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'More');
  const card = elm('div', 'gta-more-card');
  const head = elm('div', 'gta-more-head');
  const title = elm('span', 'gta-more-title', 'More');
  const closeX = elm('button', 'gta-more-x', '✕');
  closeX.type = 'button';
  closeX.setAttribute('aria-label', 'Close');
  head.append(title, closeX);
  const list = elm('div', '');
  card.append(head, list);
  panel.append(card);
  ui.append(btn, pinRow, panel);

  const usable = (id: ActionId): boolean => isRegistered(id) && isAvailable(id);

  function updateGlyph(): void {
    if (set === 'touch') btn.removeAttribute('data-glyph');
    else btn.setAttribute('data-glyph', glyphText('more', set));
  }

  function updateRing(): void {
    const ring = set !== 'touch';
    tiles.forEach((t, i) => t.el.classList.toggle('gta-more-ring', ring && i === focus));
  }

  function setFocus(i: number): void {
    if (!tiles.length) return;
    focus = Math.max(0, Math.min(tiles.length - 1, i));
    updateRing();
    const el = tiles[focus]?.el;
    if (el) {
      el.focus({ preventScroll: true });
      el.scrollIntoView?.({ block: 'nearest' });
    }
  }

  function renderPins(): void {
    pinRow.replaceChildren();
    for (const id of pins) {
      if (!isRegistered(id)) continue;
      const def = actionDef(id);
      const b = elm('button', 'gta-btn gta-btn--icon', def.icon);
      b.type = 'button';
      b.title = def.label;
      b.setAttribute('aria-label', def.label);
      b.addEventListener('click', () => { runAction(id); });
      pinRow.append(b);
    }
  }

  function togglePin(id: ActionId): void {
    pins = pins.includes(id) ? pins.filter((p) => p !== id) : [...pins, id].slice(-MAX_PINS);
    savePins(pins);
    renderPins();
    if (isOpen) renderBody();
  }

  function hintFor(id: ActionId): string {
    const def = actionDef(id);
    if (set === 'touch') return '';
    if (set === 'keyboard') return 'key' in def.kb ? glyphText(id, set) : '';
    const b = padBinding(id);
    return b === 'more' || b === 'options' ? '' : glyphText(id, set);
  }

  function makeTile(id: ActionId): Tile {
    const def = actionDef(id);
    const el = elm('button', 'gta-more-tile');
    el.type = 'button';
    el.title = def.label;
    el.setAttribute('aria-label', def.label);
    el.append(elm('span', 'gta-more-ic', def.icon), elm('span', 'gta-more-lbl', def.label));
    const hint = hintFor(id);
    if (hint) el.append(elm('span', 'gta-more-hint', hint));
    if (pins.includes(id)) {
      const pin = elm('span', 'gta-more-pin', '📌');
      pin.setAttribute('aria-hidden', 'true');
      el.append(pin);
    }

    let timer = 0;
    let sx = 0;
    let sy = 0;
    let fired = false;
    const cancel = (): void => {
      if (timer) { clearTimeout(timer); timer = 0; }
    };
    el.addEventListener('pointerdown', (e) => {
      fired = false;
      sx = e.clientX;
      sy = e.clientY;
      cancel();
      timer = window.setTimeout(() => {
        timer = 0;
        fired = true;
        togglePin(id);
      }, LONG_PRESS_MS);
    });
    el.addEventListener('pointermove', (e) => {
      if (timer && Math.hypot(e.clientX - sx, e.clientY - sy) > MOVE_SLOP_PX) cancel();
    });
    el.addEventListener('pointerup', cancel);
    el.addEventListener('pointercancel', cancel);
    el.addEventListener('click', (e) => {
      if (fired) {
        // The long press already pinned it: this click is its release, not a pick.
        fired = false;
        e.preventDefault();
        return;
      }
      close();
      runAction(id);
    });
    return { id, el };
  }

  function gridOf(ids: readonly ActionId[]): HTMLElement {
    const g = elm('div', 'gta-more-grid');
    g.style.gridTemplateColumns = `repeat(${cols},1fr)`;
    for (const id of ids) {
      const t = makeTile(id);
      tiles.push(t);
      g.append(t.el);
    }
    return g;
  }

  function renderBody(): void {
    cols = columns();
    tiles = [];
    list.replaceChildren();
    const dock = visibleDockActions().filter(usable);
    if (dock.length) {
      list.append(elm('div', 'gta-more-h', 'Here'), gridOf(dock));
      list.append(elm('div', 'gta-more-h', 'More'));
    }
    list.append(gridOf(ACTIONS.filter((a) => a.inMore && usable(a.id)).map((a) => a.id)));
    focus = Math.max(0, Math.min(focus, tiles.length - 1));
    updateRing();
  }

  function open(): void {
    if (isOpen) return;
    isOpen = true;
    focus = 0;
    renderBody();
    panel.style.display = 'flex';
    document.body.dataset.more = 'open';
    if (document.pointerLockElement) document.exitPointerLock();
    // Buttons already held when it opened (the View press itself) must not count as new presses.
    const p = firstPad();
    padPrev = p ? padEdge(p) : NO_EDGE;
    setFocus(0);
    requestAnimationFrame(pollPad);
  }

  function close(): void {
    if (!isOpen) return;
    isOpen = false;
    panel.style.display = 'none';
    document.body.dataset.more = '';
  }

  function toggle(): void {
    if (isOpen) close();
    else open();
  }

  function move(delta: number): void {
    setFocus(focus + delta);
  }

  // Gamepad: while open the panel owns the pad (input.ts reads body[data-more]). D-pad or stick moves, A presses,
  // X pins, B or View closes.
  function pollPad(): void {
    if (!isOpen) return;
    const p = firstPad();
    if (p) {
      const now = padEdge(p);
      const was = padPrev;
      if (now.u && !was.u) move(-cols);
      if (now.d && !was.d) move(cols);
      if (now.l && !was.l) move(-1);
      if (now.r && !was.r) move(1);
      if (now.a && !was.a) tiles[focus]?.el.click();
      if (now.x && !was.x) {
        const t = tiles[focus];
        if (t) togglePin(t.id);
      }
      padPrev = now;
      if (now.b && !was.b) { close(); return; }
    }
    requestAnimationFrame(pollPad);
  }

  // Keyboard, on the window: Tab toggles; while open the arrows move, Enter presses, Escape closes.
  window.addEventListener('keydown', (e) => {
    if (isTyping(e) || e.repeat) return;
    if (e.code === KEYS.more) {
      e.preventDefault();
      toggle();
      return;
    }
    if (!isOpen) return;
    if (e.code === KEYS.close) {
      e.preventDefault();
      close();
    } else if (e.code === KEYS.confirm) {
      e.preventDefault();
      tiles[focus]?.el.click();
    } else if (inKeys(MOVE_KEYS.forward, e.code)) {
      e.preventDefault();
      move(-cols);
    } else if (inKeys(MOVE_KEYS.back, e.code)) {
      e.preventDefault();
      move(cols);
    } else if (inKeys(MOVE_KEYS.left, e.code)) {
      e.preventDefault();
      move(-1);
    } else if (inKeys(MOVE_KEYS.right, e.code)) {
      e.preventDefault();
      move(1);
    }
  });

  window.addEventListener('gta:more', toggle);
  window.addEventListener('resize', () => { if (isOpen) renderBody(); });

  // Keep touches and clicks on these from starting the stick, camera drag or pointer lock underneath.
  for (const n of [btn, pinRow, panel]) n.addEventListener('pointerdown', (e) => e.stopPropagation());
  panel.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });
  btn.addEventListener('click', toggle);
  closeX.addEventListener('click', close);
  panel.addEventListener('click', (e) => { if (e.target === panel) close(); });

  onInputSourceChange((s) => {
    set = s;
    updateGlyph();
    if (isOpen) renderBody();
    else updateRing();
  });
  onActionsChange(() => {
    renderPins();
    if (isOpen) renderBody();
  });

  registerAction('more', { run: toggle });
  updateGlyph();
  renderPins();

  return { open, close, toggle, isOpen: () => isOpen };
}

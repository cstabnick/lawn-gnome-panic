// The Gnomlet (L94): the gnome's tablet, which replaced the More menu and the phone list. One ☰ button (Tab on a
// keyboard, View on a pad, P for the phone) opens a home screen of apps from the registry (registry.ts): every former
// More tile (bridged from ui/actions.ts, so keyboard and pad shortcuts still work), every phone app (phone.addApp is a
// shim onto the registry), Options and the toys. Up to three apps can be pinned (long-press, or X on a pad); pins show
// in the tablet's dock and as one-tap buttons beside ☰ (not in the minimal touch layout). A "Here" row on the home
// screen lists the contextual dock actions on screen when it opened.
//
// Apps with `open(root)` run inside the tablet screen (Options, Gnomey Bird); apps with `run()` close the tablet first.
// While open, body[data-more="open"] tells input.ts and the pad reader to leave the game alone.

import { firstPad } from '@lawn/gamepad';
import { ACTIONS, actionDef, isAvailable, isRegistered, onActionsChange, registerAction, runAction, type ActionId } from '../ui/actions';
import { KEYS, MOVE_KEYS } from '../keys';
import { ensureGlyphStyle, glyphText } from '../ui/glyphs';
import { currentGlyphSet, onInputSourceChange, type GlyphSet } from '../ui/inputSource';
import { visibleDockActions } from '../ui/dock';
import { ensureButtonStyle } from '../ui/style';
import {
  GNOMLET_GROUPS, getGnomletApp, listGnomletApps, onGnomletAppsChange, registerGnomletApp,
  type GnomletApp, type GnomletCtx, type GnomletGroup,
} from './registry';

export interface Gnomlet {
  /** Opens the home screen, or straight into an app. */
  open(appId?: string): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
  /** The app open inside the tablet, or null on the home screen / closed. */
  current(): string | null;
}

const PINS_KEY = 'gta-more-pins';
const MAX_PINS = 3;
const DEFAULT_PINS: readonly string[] = ['taxi', 'journal'];
const LONG_PRESS_MS = 500;
const MOVE_SLOP_PX = 10;
const STICK_DEAD = 0.6;

/** Former More tiles that become apps, with their home-screen group. 'phone' and 'options' are not bridged: phone apps
 *  are on the home screen themselves, and Options is a real in-tablet app (options.ts). */
export const BRIDGED: readonly { id: ActionId; group: GnomletGroup; order: number }[] = [
  { id: 'taxi', group: 'phone', order: 10 },
  { id: 'bag', group: 'money', order: 10 },
  { id: 'journal', group: 'journals', order: 10 },
  { id: 'birdJournal', group: 'journals', order: 20 },
  { id: 'huntJournal', group: 'journals', order: 30 },
  { id: 'fishJournal', group: 'journals', order: 40 },
  { id: 'map', group: 'world', order: 10 },
  { id: 'modKit', group: 'world', order: 20 },
  { id: 'emote', group: 'fun', order: 10 },
  { id: 'party', group: 'fun', order: 20 },
  { id: 'mute', group: 'system', order: 30 },
  { id: 'firstPerson', group: 'system', order: 40 },
  { id: 'trainer', group: 'system', order: 50 },
];

export const GNOMLET_CSS = `
#gta-more-btn{position:fixed;right:calc(env(safe-area-inset-right) + 10px);
top:calc(env(safe-area-inset-top) + max(18px,4vw) + var(--gta-map,128px) + 8px);z-index:30;width:44px;height:44px;}
#gta-more-pins{position:fixed;right:calc(env(safe-area-inset-right) + 158px);
top:calc(env(safe-area-inset-top) + max(18px,4vw) + var(--gta-map,128px) + 8px);z-index:30;display:flex;
flex-direction:row-reverse;gap:8px;pointer-events:none;}
#gta-more-pins .gta-btn{width:44px;height:44px;}
body[data-touch-layout="minimal"] #gta-more-pins{display:none}
body.gta-in-scene #gta-more-btn, body.gta-in-scene #gta-more-pins{display:none!important}
#gta-gnomlet{position:fixed;inset:0;z-index:44;display:none;align-items:center;justify-content:center;pointer-events:auto;
background:rgba(0,0,0,.5);box-sizing:border-box;
padding:calc(env(safe-area-inset-top) + 8px) calc(env(safe-area-inset-right) + 8px) calc(env(safe-area-inset-bottom) + 8px) calc(env(safe-area-inset-left) + 8px);}
#gta-gnomlet .gnl-tab{box-sizing:border-box;display:flex;flex-direction:column;width:min(100%,780px);height:min(100%,560px);
border:9px solid #23252b;border-radius:28px;overflow:hidden;color:#fff;font:600 13px system-ui,sans-serif;
background:radial-gradient(circle at 18% 12%,rgba(255,210,63,.16),transparent 40%),radial-gradient(circle at 85% 90%,rgba(124,240,255,.12),transparent 45%),linear-gradient(160deg,#1f4a35,#16302a 55%,#122126);
box-shadow:0 0 0 2px #4a4d55,0 18px 50px rgba(0,0,0,.55);}
@media (orientation:portrait) and (max-width:700px){#gta-gnomlet .gnl-tab{height:min(100%,780px);}}
#gta-gnomlet .gnl-bar{display:flex;align-items:center;gap:6px;min-height:48px;padding:0 6px;background:rgba(0,0,0,.32);flex:0 0 auto;}
#gta-gnomlet .gnl-title{flex:1;min-width:0;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
#gta-gnomlet .gnl-title b{color:#ffd23f;font-weight:800;}
#gta-gnomlet .gnl-clock{font-size:12px;opacity:.75;font-variant-numeric:tabular-nums;padding:0 4px;}
#gta-gnomlet .gnl-icon-btn{width:44px;height:44px;min-width:44px;border-radius:12px;border:2px solid rgba(255,255,255,.25);
background:rgba(255,255,255,.08);color:#fff;font:700 18px system-ui,sans-serif;cursor:pointer;touch-action:manipulation;padding:0;}
#gta-gnomlet .gnl-icon-btn[hidden]{display:none;}
#gta-gnomlet .gnl-screen{flex:1 1 auto;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:10px 12px 14px;box-sizing:border-box;}
#gta-gnomlet .gnl-screen, #gta-gnomlet .gnl-screen *{touch-action:pan-y;}
#gta-gnomlet .gnl-screen canvas, #gta-gnomlet .gnl-screen [data-gnl-touch="none"]{touch-action:none;}
#gta-gnomlet .gnl-h{font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.7;margin:10px 4px 6px;}
#gta-gnomlet .gnl-h:first-child{margin-top:2px;}
#gta-gnomlet .gnl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(76px,1fr));gap:6px;}
#gta-gnomlet .gnl-app{position:relative;min-height:88px;border-radius:14px;border:2px solid transparent;background:none;color:#fff;
font:600 12px system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:4px;
padding:6px 2px;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none;
-webkit-user-select:none;-webkit-touch-callout:none;}
#gta-gnomlet .gnl-app:active .gnl-ic{transform:scale(.94);}
#gta-gnomlet .gnl-ic{display:flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:15px;font-size:28px;
line-height:1;background:linear-gradient(160deg,rgba(255,255,255,.24),rgba(255,255,255,.08));box-shadow:inset 0 0 0 1px rgba(255,255,255,.18),0 3px 8px rgba(0,0,0,.3);}
#gta-gnomlet .gnl-lbl{text-align:center;line-height:1.15;}
#gta-gnomlet .gnl-detail{font-size:10px;font-weight:400;opacity:.7;text-align:center;line-height:1.15;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
#gta-gnomlet .gnl-hint{font-size:10px;opacity:.6;}
#gta-gnomlet .gnl-badge{position:absolute;top:2px;left:calc(50% + 14px);min-width:18px;height:18px;padding:0 4px;box-sizing:border-box;
border-radius:9px;background:#e8453c;font:800 11px/18px system-ui,sans-serif;text-align:center;}
#gta-gnomlet .gnl-pin{position:absolute;top:2px;right:6px;font-size:11px;}
#gta-gnomlet .gnl-dock{display:flex;justify-content:center;gap:12px;padding:6px;background:rgba(0,0,0,.25);flex:0 0 auto;}
#gta-gnomlet .gnl-dock:empty{display:none;}
#gta-gnomlet .gnl-dock .gnl-app{min-height:0;width:64px;padding:4px 0;}
#gta-gnomlet .gnl-dock .gnl-lbl,#gta-gnomlet .gnl-dock .gnl-detail,#gta-gnomlet .gnl-dock .gnl-hint{display:none;}
#gta-gnomlet .gnl-ring{outline:3px solid #7cf0ff;outline-offset:1px;border-radius:10px;}
#gta-gnomlet .gnl-tip{font-size:11px;font-weight:400;opacity:.6;text-align:center;margin-top:14px;}
@media (max-height:500px){#gta-gnomlet .gnl-tab{height:100%;width:min(100%,900px);border-width:6px;border-radius:20px;}
#gta-gnomlet .gnl-bar{min-height:44px;}#gta-gnomlet .gnl-app{min-height:76px;}#gta-gnomlet .gnl-ic{width:44px;height:44px;font-size:24px;}}
`;

let instance: Gnomlet | null = null;

/** Opens the tablet (home, or straight into an app). No-op before createGnomlet. */
export function openGnomlet(appId?: string): void { instance?.open(appId); }
export function closeGnomlet(): void { instance?.close(); }
export function isGnomletOpen(): boolean { return instance?.isOpen() ?? false; }
/** Closes the tablet if it shows this app, else opens it on this app (O / Start for Options). */
export function toggleGnomletApp(appId: string): void {
  if (!instance) return;
  if (instance.isOpen() && instance.current() === appId) instance.close();
  else instance.open(appId);
}

function injectCss(): void {
  if (document.getElementById('gta-gnomlet-style')) return;
  const s = document.createElement('style');
  s.id = 'gta-gnomlet-style';
  s.textContent = GNOMLET_CSS;
  document.head.append(s);
}

function elm<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function loadPins(): string[] {
  try {
    const raw = localStorage.getItem(PINS_KEY);
    if (raw === null) return [...DEFAULT_PINS];
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return [...DEFAULT_PINS];
    return [...new Set(v.filter((x): x is string => typeof x === 'string'))].slice(-MAX_PINS);
  } catch {
    return [...DEFAULT_PINS];
  }
}

function savePins(pins: readonly string[]): void {
  try { localStorage.setItem(PINS_KEY, JSON.stringify(pins)); } catch { /* the pins hold for this session */ }
}

type Pad = NonNullable<ReturnType<typeof firstPad>>;
interface PadEdge { u: boolean; d: boolean; l: boolean; r: boolean; a: boolean; x: boolean; b: boolean; menu: boolean; }
const NO_EDGE: PadEdge = { u: false, d: false, l: false, r: false, a: false, x: false, b: false, menu: false };
function padEdge(p: Pad): PadEdge {
  const pr = (i: number): boolean => !!p.buttons[i]?.pressed;
  const x = p.axes[0] ?? 0;
  const y = p.axes[1] ?? 0;
  return {
    u: pr(12) || y < -STICK_DEAD, d: pr(13) || y > STICK_DEAD, l: pr(14) || x < -STICK_DEAD, r: pr(15) || x > STICK_DEAD,
    a: pr(0), x: pr(2), b: pr(1), menu: pr(8) || pr(9),
  };
}

/** The element nearest to `from` in a direction (dx, dy are -1, 0 or 1), by centre distance with a sideways penalty. */
export function nearestInDirection<T extends { x: number; y: number }>(from: T, list: readonly T[], dx: number, dy: number): T | null {
  let best: T | null = null;
  let bestScore = Infinity;
  for (const c of list) {
    if (c === from) continue;
    const vx = c.x - from.x;
    const vy = c.y - from.y;
    const along = vx * dx + vy * dy;
    if (along <= 4) continue;
    const across = Math.abs(dx !== 0 ? vy : vx);
    const score = along + across * 2.5;
    if (score < bestScore) { bestScore = score; best = c; }
  }
  return best;
}

const isRange = (e: Element | null): e is HTMLInputElement => e instanceof HTMLInputElement && e.type === 'range';

/** Builds the ☰ button, the pinned row and the tablet under `ui`. Call once, early (before modules add phone apps). */
export function createGnomlet(ui: HTMLElement): Gnomlet {
  ensureButtonStyle();
  ensureGlyphStyle();
  injectCss();

  for (const b of BRIDGED) {
    if (getGnomletApp(b.id)) continue;
    const def = actionDef(b.id);
    registerGnomletApp({
      id: b.id, label: def.label, icon: def.icon, group: b.group, order: b.order,
      available: () => isRegistered(b.id) && isAvailable(b.id),
      run: () => { runAction(b.id); },
    });
  }

  let pins = loadPins();
  let isOpen = false;
  let appId: string | null = null;
  let cleanup: (() => void) | null = null;
  let focusEl: HTMLElement | null = null;
  let padPrev: PadEdge = NO_EDGE;
  let set: GlyphSet = currentGlyphSet();
  let here: ActionId[] = [];
  let clockTimer = 0;

  const btn = elm('button', 'gta-btn gta-btn--icon', '☰');
  btn.id = 'gta-more-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Gnomlet');
  const pinRow = elm('div', '');
  pinRow.id = 'gta-more-pins';

  const panel = elm('div', '');
  panel.id = 'gta-gnomlet';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Gnomlet');
  const tab = elm('div', 'gnl-tab');
  const bar = elm('div', 'gnl-bar');
  const backBtn = elm('button', 'gnl-icon-btn', '‹');
  backBtn.type = 'button';
  backBtn.setAttribute('aria-label', 'Back');
  const title = elm('div', 'gnl-title');
  const clock = elm('span', 'gnl-clock');
  const homeBtn = elm('button', 'gnl-icon-btn', '⌂');
  homeBtn.type = 'button';
  homeBtn.setAttribute('aria-label', 'Home');
  const closeX = elm('button', 'gnl-icon-btn', '✕');
  closeX.type = 'button';
  closeX.setAttribute('aria-label', 'Close');
  bar.append(backBtn, title, clock, homeBtn, closeX);
  const screen = elm('div', 'gnl-screen');
  const dock = elm('div', 'gnl-dock');
  tab.append(bar, screen, dock);
  panel.append(tab);
  ui.append(btn, pinRow, panel);

  const ctx: GnomletCtx = {
    close: () => close(),
    home: () => goHome(),
    setTitle: (t) => { title.textContent = t; },
  };

  function paintClock(): void {
    const d = new Date();
    clock.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  function updateGlyph(): void {
    if (set === 'touch') btn.removeAttribute('data-glyph');
    else btn.setAttribute('data-glyph', glyphText('more', set));
  }

  function hintFor(id: string): string {
    if (set === 'touch' || !ACTIONS.some((a) => a.id === id)) return '';
    const def = actionDef(id as ActionId);
    if (set === 'keyboard') return 'key' in def.kb ? glyphText(def.id, set) : '';
    return '';
  }

  /** Runs or opens an app (a tile, a pin or a shortcut). */
  function launch(id: string): void {
    const app = getGnomletApp(id);
    if (!app) return;
    if (app.available && !app.available()) return;
    if (app.open) { open(id); return; }
    close();
    app.run?.();
  }

  function renderPins(): void {
    pinRow.replaceChildren();
    for (const id of pins) {
      const app = getGnomletApp(id);
      if (!app) continue;
      const b = elm('button', 'gta-btn gta-btn--icon', app.icon);
      b.type = 'button';
      b.title = app.label;
      b.setAttribute('aria-label', app.label);
      b.addEventListener('click', () => launch(id));
      pinRow.append(b);
    }
  }

  function togglePin(id: string): void {
    pins = pins.includes(id) ? pins.filter((p) => p !== id) : [...pins, id].slice(-MAX_PINS);
    savePins(pins);
    renderPins();
    if (isOpen && !appId) renderHome();
  }

  function tile(app: Pick<GnomletApp, 'id' | 'label' | 'icon' | 'detail' | 'badge'>, onPick: () => void, pinnable: boolean): HTMLButtonElement {
    const el = elm('button', 'gnl-app');
    el.type = 'button';
    el.dataset.app = app.id;
    el.title = app.label;
    el.setAttribute('aria-label', app.label);
    const ic = elm('span', 'gnl-ic', app.icon);
    el.append(ic, elm('span', 'gnl-lbl', app.label));
    const detail = app.detail?.() ?? '';
    if (detail) el.append(elm('span', 'gnl-detail', detail));
    const hint = hintFor(app.id);
    if (hint) el.append(elm('span', 'gnl-hint', hint));
    const badge = app.badge?.();
    if (badge !== undefined && badge !== null && badge !== '' && badge !== 0) el.append(elm('span', 'gnl-badge', String(badge)));
    if (pinnable && pins.includes(app.id)) {
      const pin = elm('span', 'gnl-pin', '📌');
      pin.setAttribute('aria-hidden', 'true');
      el.append(pin);
    }
    let timer = 0;
    let sx = 0;
    let sy = 0;
    let fired = false;
    const cancel = (): void => { if (timer) { clearTimeout(timer); timer = 0; } };
    if (pinnable) {
      el.addEventListener('pointerdown', (e) => {
        fired = false;
        sx = e.clientX;
        sy = e.clientY;
        cancel();
        timer = window.setTimeout(() => { timer = 0; fired = true; togglePin(app.id); }, LONG_PRESS_MS);
      });
      el.addEventListener('pointermove', (e) => {
        if (timer && Math.hypot(e.clientX - sx, e.clientY - sy) > MOVE_SLOP_PX) cancel();
      });
      el.addEventListener('pointerup', cancel);
      el.addEventListener('pointercancel', cancel);
    }
    el.addEventListener('click', (e) => {
      if (fired) { fired = false; e.preventDefault(); return; } // the long press already pinned it
      onPick();
    });
    return el;
  }

  function renderHome(): void {
    screen.replaceChildren();
    title.innerHTML = '<b>Gnomlet</b>';
    backBtn.hidden = true;
    homeBtn.hidden = true;
    const apps = listGnomletApps();
    const hereApps = here.filter((id) => isRegistered(id) && isAvailable(id));
    if (hereApps.length) {
      screen.append(elm('div', 'gnl-h', 'Here'));
      const g = elm('div', 'gnl-grid');
      for (const id of hereApps) {
        const def = actionDef(id);
        g.append(tile({ id, label: def.label, icon: def.icon }, () => { close(); runAction(id); }, false));
      }
      screen.append(g);
    }
    for (const grp of GNOMLET_GROUPS) {
      const list = apps.filter((a) => (a.group ?? 'world') === grp.id);
      if (!list.length) continue;
      screen.append(elm('div', 'gnl-h', grp.title));
      const g = elm('div', 'gnl-grid');
      for (const a of list) g.append(tile(a, () => launch(a.id), true));
      screen.append(g);
    }
    screen.append(elm('div', 'gnl-tip', set === 'touch' ? 'Hold an app to pin it beside ☰.' : set === 'keyboard' ? 'Arrows move, Enter opens, Esc closes.' : 'A opens, X pins, B closes.'));
    dock.replaceChildren();
    for (const id of pins) {
      const a = getGnomletApp(id);
      if (a && (!a.available || a.available())) dock.append(tile(a, () => launch(id), true));
    }
    screen.scrollTop = 0;
  }

  function focusables(): HTMLElement[] {
    const scope = appId ? [screen] : [screen, dock];
    const out: HTMLElement[] = [];
    for (const s of scope) {
      for (const e of s.querySelectorAll<HTMLElement>('button, input, select, summary, [data-gnl-focus]')) {
        if ((e as HTMLButtonElement).disabled || e.offsetParent === null) continue;
        out.push(e);
      }
    }
    return out;
  }

  function setFocus(e: HTMLElement | null): void {
    focusEl?.classList.remove('gnl-ring');
    focusEl = e;
    if (!e) return;
    if (set !== 'touch') e.classList.add('gnl-ring');
    e.focus({ preventScroll: true });
    e.scrollIntoView?.({ block: 'nearest' });
  }

  function move(dx: number, dy: number): void {
    const list = focusables();
    if (!list.length) return;
    if (!focusEl || !list.includes(focusEl)) { setFocus(list[0]); return; }
    if (dx !== 0 && isRange(focusEl)) {
      const r = focusEl;
      r.value = String(Number(r.value) + dx * Number(r.step || 5));
      r.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    const pts = list.map((e) => {
      const b = e.getBoundingClientRect();
      return { e, x: b.left + b.width / 2, y: b.top + b.height / 2 };
    });
    const from = pts.find((p) => p.e === focusEl)!;
    const next = nearestInDirection(from, pts, dx, dy);
    if (next) setFocus(next.e);
  }

  function closeApp(): void {
    const c = cleanup;
    cleanup = null;
    appId = null;
    try { c?.(); } catch (err) { console.warn('gnomlet app cleanup', err); }
  }

  function goHome(): void {
    closeApp();
    renderHome();
    setFocus(focusables()[0] ?? null);
  }

  function showApp(id: string): void {
    const app = getGnomletApp(id);
    if (!app?.open) { goHome(); return; }
    closeApp();
    appId = id;
    screen.replaceChildren();
    dock.replaceChildren();
    title.textContent = app.label;
    backBtn.hidden = false;
    homeBtn.hidden = false;
    const root = elm('div', 'gnl-app-root');
    root.dataset.app = id;
    screen.append(root);
    screen.scrollTop = 0;
    const c = app.open(root, ctx);
    cleanup = typeof c === 'function' ? c : null;
    setFocus(focusables()[0] ?? null);
  }

  function open(id?: string): void {
    if (!isOpen) {
      here = visibleDockActions();
      isOpen = true;
      panel.style.display = 'flex';
      document.body.dataset.more = 'open';
      if (document.pointerLockElement) document.exitPointerLock();
      paintClock();
      clockTimer = window.setInterval(paintClock, 15000);
      // Buttons already held when it opened (the View or Start press itself) must not count as new presses.
      const p = firstPad();
      padPrev = p ? padEdge(p) : NO_EDGE;
      requestAnimationFrame(pollPad);
    }
    if (id && getGnomletApp(id)?.open) showApp(id);
    else if (id) launch(id);
    else goHome();
  }

  function close(): void {
    if (!isOpen) return;
    closeApp();
    isOpen = false;
    panel.style.display = 'none';
    document.body.dataset.more = '';
    window.clearInterval(clockTimer);
    setFocus(null);
    screen.replaceChildren();
  }

  function back(): void {
    if (appId) goHome();
    else close();
  }

  function toggle(): void {
    if (isOpen) close();
    else open();
  }

  // Gamepad: while open the tablet owns the pad (input.ts reads body[data-more]). D-pad or stick moves, A presses, X pins
  // (home screen), B goes back, View or Start closes.
  function pollPad(): void {
    if (!isOpen) return;
    const p = firstPad();
    if (p) {
      const now = padEdge(p);
      const was = padPrev;
      padPrev = now;
      if (now.u && !was.u) move(0, -1);
      if (now.d && !was.d) move(0, 1);
      if (now.l && !was.l) move(-1, 0);
      if (now.r && !was.r) move(1, 0);
      if (now.a && !was.a) focusEl?.click();
      if (now.x && !was.x && !appId) {
        const id = focusEl?.dataset.app;
        if (id && getGnomletApp(id)) togglePin(id);
      }
      if (now.b && !was.b) back();
      else if (now.menu && !was.menu) close();
    }
    if (isOpen) requestAnimationFrame(pollPad);
  }

  const arrows = (list: readonly string[]): string[] => list.filter((k) => k.startsWith('Arrow'));
  // Keyboard, on the window: Tab toggles; while open the arrows move (WASD too on the home screen), Enter presses,
  // Escape goes back. Typing in a text field inside an app is left alone.
  window.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement | null;
    const typing = !!t && (t.tagName === 'TEXTAREA' || t.isContentEditable || (t.tagName === 'INPUT' && !isRange(t)));
    if (typing || e.repeat) return;
    if (e.code === KEYS.more) {
      e.preventDefault();
      toggle();
      return;
    }
    if (!isOpen) return;
    const keys = (k: readonly string[]): readonly string[] => (appId ? arrows(k) : k);
    if (e.code === KEYS.close) {
      e.preventDefault();
      e.stopImmediatePropagation();
      back();
    } else if (e.code === KEYS.confirm) {
      e.preventDefault();
      focusEl?.click();
    } else if (keys(MOVE_KEYS.forward).includes(e.code)) {
      e.preventDefault();
      move(0, -1);
    } else if (keys(MOVE_KEYS.back).includes(e.code)) {
      e.preventDefault();
      move(0, 1);
    } else if (keys(MOVE_KEYS.left).includes(e.code)) {
      e.preventDefault();
      move(-1, 0);
    } else if (keys(MOVE_KEYS.right).includes(e.code)) {
      e.preventDefault();
      move(1, 0);
    }
  });

  window.addEventListener('gta:more', toggle);
  window.addEventListener('resize', () => { if (isOpen && !appId) renderHome(); });

  // Keep touches and clicks on these from starting the stick, camera drag or pointer lock underneath; let it scroll.
  for (const n of [btn, pinRow, panel]) n.addEventListener('pointerdown', (e) => e.stopPropagation());
  panel.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });
  btn.addEventListener('click', toggle);
  closeX.addEventListener('click', () => close());
  backBtn.addEventListener('click', () => back());
  homeBtn.addEventListener('click', () => goHome());
  panel.addEventListener('click', (e) => { if (e.target === panel) close(); });

  onInputSourceChange((s) => {
    set = s;
    updateGlyph();
    if (isOpen && !appId) renderHome();
  });
  const redraw = (): void => {
    renderPins();
    if (isOpen && !appId) renderHome();
  };
  onActionsChange(redraw);
  onGnomletAppsChange(redraw);

  registerAction('more', { run: toggle });
  updateGlyph();
  renderPins();

  const api: Gnomlet = { open, close, toggle, isOpen: () => isOpen, current: () => appId };
  instance = api;
  return api;
}

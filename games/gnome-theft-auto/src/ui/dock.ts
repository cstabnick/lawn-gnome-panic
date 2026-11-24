// The dock: one column for contextual buttons (Store, Handling, Pay 'n' Glaze, Slipway, Fish, Binoculars). A button
// is on screen only while its action is possible; the module that owns it still shows and hides it. The dock places
// them all in one spot (above the touch Fire button, clear of the minimap), gives them one style, and shows the key
// or pad glyph that triggers each. D-pad up (the 'context' action) presses the top visible button that has no pad
// control of its own.
import type { PadButtonName, PadFamily } from '@lawn/gamepad';
import { glyphColor, glyphLabel } from '@lawn/gamepad';
import type { CameraMode } from '../types';
import { type ActionId, padBinding } from './actions';
import { ensureButtonStyle } from './style';
import { glyphText } from './glyphs';
import { currentGlyphSet, onInputSourceChange, type GlyphSet } from './inputSource';

const DOCK_ID = 'gta-dock';
const DOCK_STYLE_ID = 'gta-dock-style';
const DOCK_CSS = `
#gta-dock{position:fixed;z-index:21;display:flex;flex-direction:column;align-items:flex-end;gap:8px;pointer-events:none;
  right:calc(env(safe-area-inset-right) + 16px);bottom:calc(env(safe-area-inset-bottom) + 16px);}
body[data-input="touch"] #gta-dock{right:calc(env(safe-area-inset-right) + max(24px,9vw));bottom:calc(env(safe-area-inset-bottom) + max(24px,7vh) + 184px);}
@media (max-height:500px){body[data-input="touch"] #gta-dock{flex-direction:row-reverse;align-items:flex-end;right:calc(env(safe-area-inset-right) + max(24px,9vw) + 400px);bottom:calc(env(safe-area-inset-bottom) + max(16px,4vh) + 12px);}}
body[data-touch-layout="left-handed"][data-input="touch"] #gta-dock{right:auto;left:calc(env(safe-area-inset-left) + max(24px,9vw));align-items:flex-start;}
body.gta-in-scene #gta-dock{display:none!important;}
#gta-dock .gta-dock-btn{font-size:15px;}
#gta-dock > .gta-dock-btn{position:relative!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;transform:none!important;margin:0!important;}
`;

/** Inline position styles a module may have set on its button before docking; the dock lays them out now. */
const POSITION_PROPS = ['position', 'left', 'right', 'top', 'bottom', 'transform', 'z-index'] as const;

interface DockEntry {
  button: HTMLElement;
  action: ActionId;
  /** The last badge state written, so repaints touch the DOM only when something changed. */
  paintedKey: string | null;
}

const entries: DockEntry[] = [];
let listening = false;

function currentMode(): CameraMode {
  return ((typeof document !== 'undefined' && document.body.dataset.mode) || 'foot') as CameraMode;
}

function dockEl(): HTMLElement | null {
  // Tests stub a bare document: no getElementById means no dock (the button is then just not mounted).
  return typeof document === 'undefined' || typeof document.getElementById !== 'function' ? null : document.getElementById(DOCK_ID);
}

/** Creates the dock container under `ui` once (idempotent) and returns it. */
export function createDock(ui: HTMLElement): HTMLElement {
  const existing = dockEl();
  if (existing) return existing;
  ensureButtonStyle();
  if (!document.getElementById(DOCK_STYLE_ID)) {
    const s = document.createElement('style');
    s.id = DOCK_STYLE_ID;
    s.textContent = DOCK_CSS;
    document.head.appendChild(s);
  }
  const dock = document.createElement('div');
  dock.id = DOCK_ID;
  // A tap on a dock button must not also start the touch stick or a camera drag.
  dock.addEventListener('pointerdown', (e) => e.stopPropagation());
  ui.appendChild(dock);
  if (!listening) {
    listening = true;
    window.addEventListener('gta:context', () => pressTopDock());
    window.addEventListener('gta:mode', () => repaintAll());
    onInputSourceChange(() => repaintAll());
  }
  return dock;
}

/** The badge (data-glyph and --glyph-bg) for an action on a device in a mode. */
function badgeFor(action: ActionId, set: GlyphSet, mode: CameraMode): { glyph: string | null; bg: string | null } {
  if (set === 'touch') return { glyph: null, bg: null };
  if (set === 'keyboard') return { glyph: glyphText(action, 'keyboard', mode), bg: null };
  const f: PadFamily = set;
  const b = padBinding(action, mode);
  if (b === 'more') return { glyph: glyphLabel(f, 'select'), bg: '#2a2f36' };
  if (b === 'options') return { glyph: glyphLabel(f, 'start'), bg: '#2a2f36' };
  const btn: PadButtonName = b;
  return { glyph: glyphLabel(f, btn), bg: glyphColor(f, btn) ?? '#2a2f36' };
}

function paint(entry: DockEntry, set: GlyphSet, mode: CameraMode): void {
  const key = `${set}|${mode}`;
  if (entry.paintedKey === key) return;
  entry.paintedKey = key;
  const { glyph, bg } = badgeFor(entry.action, set, mode);
  const el = entry.button;
  if (glyph === null) {
    if (el.hasAttribute('data-glyph')) el.removeAttribute('data-glyph');
  } else if (el.getAttribute('data-glyph') !== glyph) {
    el.setAttribute('data-glyph', glyph);
  }
  if (bg === null) {
    if (el.style.getPropertyValue('--glyph-bg') !== '') el.style.removeProperty('--glyph-bg');
  } else if (el.style.getPropertyValue('--glyph-bg') !== bg) {
    el.style.setProperty('--glyph-bg', bg);
  }
}

function repaintAll(): void {
  const set = currentGlyphSet();
  const mode = currentMode();
  for (const e of entries) paint(e, set, mode);
}

/** Moves `button` into the dock (call once, right after creating it). The owning module keeps its click handler and
 * keeps toggling `button.style.display`; the dock adds the shared `gta-btn gta-dock-btn` classes and a
 * `data-glyph` attribute for the key / pad hint, and drops inline position styles. If the dock does not exist yet it is
 * created under document.getElementById('ui').
 */
export function dockButton(button: HTMLElement, action: ActionId): void {
  const ui = dockEl() ? null : typeof document?.getElementById === 'function' ? document.getElementById('ui') : null;
  const dock = dockEl() ?? (ui ? createDock(ui) : null);
  if (!dock) return;
  for (const p of POSITION_PROPS) button.style.removeProperty(p);
  button.classList.add('gta-btn', 'gta-btn--pill', 'gta-dock-btn');
  dock.appendChild(button);
  if (!entries.some((e) => e.button === button)) {
    const entry: DockEntry = { button, action, paintedKey: null };
    entries.push(entry);
    paint(entry, currentGlyphSet(), currentMode());
  }
}

function isVisible(button: HTMLElement): boolean {
  return button.style.display !== 'none' && button.offsetParent !== null;
}

/** Presses the top visible dock button whose action has no pad control of its own. Returns whether one was pressed. */
export function pressTopDock(): boolean {
  const mode = currentMode();
  for (const e of entries) {
    if (isVisible(e.button) && padBinding(e.action, mode) === 'up') {
      e.button.click();
      return true;
    }
  }
  return false;
}

/** The dock actions on screen right now, top first (the More menu lists them under "Here"). */
export function visibleDockActions(): ActionId[] {
  return entries.filter((e) => isVisible(e.button)).map((e) => e.action);
}

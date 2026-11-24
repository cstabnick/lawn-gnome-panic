// GTA's glyph adapter: turns an action (ui/actions.ts) into what the current device shows for it, and fills {action}
// tokens in hint text. Keyboard: key caps ('E', 'Tab', 'Click'). Pad: the family's glyph (@lawn/gamepad glyphs).
// Touch: no glyph; tokens become the touch words ('Fire', '☰ › Phone').
import { glyphLabel, glyphName, glyphSvg, type PadButtonName, type PadFamily } from '@lawn/gamepad';
import { KEYS, MOVE_KEYS, keyLabel } from '../keys';
import type { CameraMode } from '../types';
import { ACTIONS, actionDef, padBinding, type ActionId } from './actions';
import { currentGlyphSet, type GlyphSet } from './inputSource';

const ACTION_IDS = new Set<string>(ACTIONS.map((a) => a.id));

/** `{actionId}` tokens; a double brace `{{Name}}` is gold-name markup and stays as it is. */
const TOKEN = /(?<!\{)\{([a-zA-Z]+)\}(?!\})/g;

function isActionId(name: string): name is ActionId {
  return ACTION_IDS.has(name);
}

function currentMode(): CameraMode {
  if (typeof document === 'undefined') return 'foot';
  const dataset = document.body?.dataset;
  return ((dataset?.mode as CameraMode) || 'foot');
}

function resolve(set?: GlyphSet, mode?: CameraMode): { set: GlyphSet; mode: CameraMode } {
  return { set: set ?? currentGlyphSet(), mode: mode ?? currentMode() };
}

/** Escapes the five HTML-significant characters. */
export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const KEY_NAMES: Record<string, string> = {
  Space: 'Space',
  Tab: 'Tab',
  Escape: 'Esc',
  Enter: 'Enter',
  ShiftLeft: 'Shift',
  ShiftRight: 'Shift',
  Backquote: '`',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
};

function keyName(code: string): string {
  return KEY_NAMES[code] ?? keyLabel(code);
}

/** Plain text for an action on a device: 'E', 'Y', '△', 'WASD', 'Mouse', or the touch words. Never contains HTML. */
export function glyphText(action: ActionId, set?: GlyphSet, mode?: CameraMode): string {
  const r = resolve(set, mode);
  const def = actionDef(action);
  if (r.set === 'touch') return def.touchText;
  if (r.set === 'keyboard') {
    const kb = def.kb;
    if ('key' in kb) return keyName(KEYS[kb.key]);
    if ('move' in kb) {
      if (action === 'move') return 'WASD';
      return keyName(MOVE_KEYS[kb.move][0]);
    }
    if ('mouse' in kb) {
      if (kb.mouse === 'left') return 'Click';
      if (kb.mouse === 'right') return 'Right mouse';
      return 'Mouse';
    }
    if (kb.via === 'more') return `${keyName(KEYS.more)} › ${def.label}`;
    return `${keyName(KEYS.options)} › ${def.label}`;
  }
  const family: PadFamily = r.set;
  const b = padBinding(action, r.mode);
  if (b === 'more') return `${glyphLabel(family, 'select')} › ${def.label}`;
  if (b === 'options') return `${glyphLabel(family, 'start')} › ${def.label}`;
  return glyphLabel(family, b);
}

function padButtonSpan(family: PadFamily, b: PadButtonName): string {
  return `<span class="gta-glyph" title="${esc(glyphName(family, b))}">${glyphSvg(family, b, 18)}</span>`;
}

/** HTML for an action: '' on touch, `<kbd class="gta-key">E</kbd>` on keyboard, `<span class="gta-glyph">svg</span>` on a pad. */
export function glyphHtml(action: ActionId, set?: GlyphSet, mode?: CameraMode): string {
  const r = resolve(set, mode);
  if (r.set === 'touch') return '';
  if (r.set === 'keyboard') return `<kbd class="gta-key">${esc(glyphText(action, r.set, r.mode))}</kbd>`;
  const family: PadFamily = r.set;
  const def = actionDef(action);
  const b = padBinding(action, r.mode);
  if (b === 'more') return `${padButtonSpan(family, 'select')} › ${esc(def.label)}`;
  if (b === 'options') return `${padButtonSpan(family, 'start')} › ${esc(def.label)}`;
  return padButtonSpan(family, b);
}

/** Replaces every {actionId} token with glyphText(). Unknown tokens stay as they are. */
export function fillHint(text: string, set?: GlyphSet, mode?: CameraMode): string {
  const r = resolve(set, mode);
  return text.replace(TOKEN, (token, name: string) => (isActionId(name) ? glyphText(name, r.set, r.mode) : token));
}

/** Like fillHint but returns HTML: the text is escaped, tokens become glyphHtml() (touch: the escaped touch words). */
export function fillHintHtml(text: string, set?: GlyphSet, mode?: CameraMode): string {
  const r = resolve(set, mode);
  let out = '';
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const index = m.index ?? 0;
    out += esc(text.slice(last, index));
    const name = m[1];
    if (isActionId(name)) {
      out += r.set === 'touch' ? esc(actionDef(name).touchText) : glyphHtml(name, r.set, r.mode);
    } else {
      out += esc(m[0]);
    }
    last = index + m[0].length;
  }
  out += esc(text.slice(last));
  return out;
}

export interface ControlRow {
  id: ActionId;
  label: string;
  /** glyphHtml(), or for touch the escaped touch words. */
  html: string;
}

/** The mode a pad glyph is drawn for when the controls list shows every mode. */
function firstModeOf(id: ActionId): CameraMode {
  const keys = Object.keys(actionDef(id).pad).filter((k) => k !== 'any');
  return (keys[0] as CameraMode | undefined) ?? 'foot';
}

/** The controls list for a device: every listed action that applies in `mode` ('all' = every mode), in table order. */
export function controlsFor(set: GlyphSet, mode: CameraMode | 'all' = 'all'): ControlRow[] {
  const rows: ControlRow[] = [];
  for (const a of ACTIONS) {
    if (a.listed === false) continue;
    if (mode !== 'all' && a.pad[mode] === undefined && a.pad.any === undefined) continue;
    const effective: CameraMode = mode === 'all' ? firstModeOf(a.id) : mode;
    const html = set === 'touch' ? esc(a.touchText) : glyphHtml(a.id, set, effective);
    rows.push({ id: a.id, label: a.label, html });
  }
  return rows;
}

let styleAdded = false;

/** Adds the .gta-key / .gta-glyph styles once. */
export function ensureGlyphStyle(): void {
  if (styleAdded || typeof document === 'undefined') return;
  if (document.getElementById('gta-glyph-style')) {
    styleAdded = true;
    return;
  }
  const style = document.createElement('style');
  style.id = 'gta-glyph-style';
  style.textContent =
    '.gta-key{display:inline-block;min-width:1.5em;padding:0 .35em;box-sizing:border-box;border:1.5px solid rgba(255,255,255,.85);border-bottom-width:3px;border-radius:5px;background:rgba(255,255,255,.14);color:#fff;font:800 .82em/1.35 system-ui,sans-serif;text-align:center;vertical-align:middle;text-shadow:none;}' +
    '.gta-glyph{display:inline-flex;vertical-align:middle;line-height:0;margin:0 .1em;}' +
    '.gta-glyph svg{width:1.35em;height:1.35em;}';
  document.head.appendChild(style);
  styleAdded = true;
}

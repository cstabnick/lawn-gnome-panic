// Controller glyphs: which family a pad belongs to (from its Gamepad.id) and how each standard-layout button is drawn
// for that family. Self-made vector shapes only (letters, PlayStation-style ✕ ○ □ △ shapes, rounded bumpers): no logos.
// Pure: nothing here touches the DOM, so games and tests can call it anywhere.
import { STEAM_PAD_ID } from './steam';

/** The pad families with their own glyph set. 'generic' draws Xbox-style letters. */
export type PadFamily = 'xbox' | 'playstation' | 'switch' | 'steam' | 'generic';

/** Every standard-layout control a game can ask a glyph for. Index = W3C standard mapping button index (sticks: -1). */
export type PadButtonName =
  | 'south' | 'east' | 'west' | 'north'
  | 'lb' | 'rb' | 'lt' | 'rt'
  | 'select' | 'start' | 'l3' | 'r3'
  | 'up' | 'down' | 'left' | 'right'
  | 'home' | 'lstick' | 'rstick' | 'dpad';

export const PAD_FAMILIES: readonly PadFamily[] = ['xbox', 'playstation', 'switch', 'steam', 'generic'];

export const PAD_BUTTON_NAMES: readonly PadButtonName[] = [
  'south', 'east', 'west', 'north', 'lb', 'rb', 'lt', 'rt', 'select', 'start', 'l3', 'r3',
  'up', 'down', 'left', 'right', 'home', 'lstick', 'rstick', 'dpad',
];

/** Standard-mapping button index of each control; -1 for the sticks and the whole d-pad (axes / several buttons). */
export const PAD_BUTTON_INDEX: Readonly<Record<PadButtonName, number>> = {
  south: 0, east: 1, west: 2, north: 3, lb: 4, rb: 5, lt: 6, rt: 7, select: 8, start: 9, l3: 10, r3: 11,
  up: 12, down: 13, left: 14, right: 15, home: 16, lstick: -1, rstick: -1, dpad: -1,
};

/** The family of a pad from its `Gamepad.id` (and the Steam Controller's WebHID id). Unknown ids are 'generic'. */
export function padFamily(id: string): PadFamily {
  if (id === STEAM_PAD_ID) return 'steam';
  const s = id.toLowerCase();
  if (/steam|28de/.test(s)) return 'steam';
  if (/xbox|xinput|045e|microsoft/.test(s)) return 'xbox';
  if (/dualsense|dualshock|playstation|054c|sony/.test(s) || s.startsWith('wireless controller')) return 'playstation';
  if (/nintendo|switch|pro controller|joy-con|057e/.test(s)) return 'switch';
  return 'generic';
}

type LabelMap = Readonly<Record<PadButtonName, string>>;
type NameMap = Readonly<Record<PadButtonName, string>>;

const XBOX_LABELS: LabelMap = {
  south: 'A', east: 'B', west: 'X', north: 'Y', lb: 'LB', rb: 'RB', lt: 'LT', rt: 'RT',
  select: 'View', start: 'Menu', l3: 'LS', r3: 'RS', up: '↑', down: '↓', left: '←', right: '→',
  home: 'Home', lstick: 'L', rstick: 'R', dpad: 'D-pad',
};

const XBOX_NAMES: NameMap = {
  south: 'A button', east: 'B button', west: 'X button', north: 'Y button', lb: 'Left bumper', rb: 'Right bumper',
  lt: 'Left trigger', rt: 'Right trigger', select: 'View button', start: 'Menu button',
  l3: 'Left stick press', r3: 'Right stick press', up: 'D-pad up', down: 'D-pad down', left: 'D-pad left',
  right: 'D-pad right', home: 'Home button', lstick: 'Left stick', rstick: 'Right stick', dpad: 'D-pad',
};

const LABELS: Record<PadFamily, LabelMap> = {
  xbox: XBOX_LABELS,
  generic: { ...XBOX_LABELS, select: 'Back', start: 'Start' },
  steam: { ...XBOX_LABELS, home: 'Steam' },
  playstation: {
    south: '✕', east: '○', west: '□', north: '△', lb: 'L1', rb: 'R1', lt: 'L2', rt: 'R2',
    select: 'Create', start: 'Options', l3: 'L3', r3: 'R3', up: '↑', down: '↓', left: '←', right: '→',
    home: 'PS', lstick: 'L', rstick: 'R', dpad: 'D-pad',
  },
  switch: {
    south: 'B', east: 'A', west: 'Y', north: 'X', lb: 'L', rb: 'R', lt: 'ZL', rt: 'ZR',
    select: '−', start: '+', l3: 'LS', r3: 'RS', up: '↑', down: '↓', left: '←', right: '→',
    home: 'Home', lstick: 'L', rstick: 'R', dpad: 'D-pad',
  },
};

const NAMES: Record<PadFamily, NameMap> = {
  xbox: XBOX_NAMES,
  generic: { ...XBOX_NAMES, select: 'Back button', start: 'Start button' },
  steam: { ...XBOX_NAMES, home: 'Steam button' },
  playstation: {
    ...XBOX_NAMES,
    south: 'Cross button', east: 'Circle button', west: 'Square button', north: 'Triangle button',
    lb: 'L1 button', rb: 'R1 button', lt: 'L2 trigger', rt: 'R2 trigger',
    select: 'Create button', start: 'Options button', home: 'PS button',
  },
  switch: {
    ...XBOX_NAMES,
    south: 'B button', east: 'A button', west: 'Y button', north: 'X button',
    lb: 'L button', rb: 'R button', lt: 'ZL button', rt: 'ZR button',
    select: 'Minus button', start: 'Plus button', home: 'Home button',
  },
};

/** Short text for a control in a family: 'A', '✕', 'LB', 'L1', 'ZL', 'View', 'Create', '−', 'LS', 'D-pad'. Never empty. */
export function glyphLabel(family: PadFamily, button: PadButtonName): string {
  return LABELS[family][button];
}

/** The spoken name for screen readers and title attributes: 'A button', 'Cross button', 'Left bumper', 'L2 trigger'. */
export function glyphName(family: PadFamily, button: PadButtonName): string {
  return NAMES[family][button];
}

const XBOX_FACE_COLOURS: Partial<Record<PadButtonName, string>> = {
  south: '#3fae29', east: '#e0362c', west: '#2a6fdb', north: '#f2b705',
};

const PS_FACE_COLOURS: Partial<Record<PadButtonName, string>> = {
  south: '#7fa6ff', east: '#ff6b6b', west: '#ff8ad8', north: '#3fd6a0',
};

/** The fill colour of a face button glyph (CSS colour), or null for controls drawn in plain white on dark. */
export function glyphColor(family: PadFamily, button: PadButtonName): string | null {
  if (family === 'xbox' || family === 'generic') return XBOX_FACE_COLOURS[button] ?? null;
  if (family === 'playstation') return PS_FACE_COLOURS[button] ?? null;
  return null;
}

const FACE: readonly PadButtonName[] = ['south', 'east', 'west', 'north'];
const DPAD_ARMS: readonly PadButtonName[] = ['up', 'down', 'left', 'right'];

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function text(x: number, y: number, fontSize: number, fill: string, label: string, extra = ''): string {
  return `<text x="${x}" y="${y}" font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="800" text-anchor="middle" fill="${fill}"${extra}>${esc(label)}</text>`;
}

function faceBody(family: PadFamily, button: PadButtonName): string {
  const colour = glyphColor(family, button);
  if (family === 'playstation') {
    const stroke = colour ?? '#fff';
    const shape: Record<string, string> = {
      south: `<path d="M7 7L17 17M17 7L7 17" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round"/>`,
      east: `<circle cx="12" cy="12" r="5.5" fill="none" stroke="${stroke}" stroke-width="2.2"/>`,
      west: `<rect x="7" y="7" width="10" height="10" fill="none" stroke="${stroke}" stroke-width="2.2"/>`,
      north: `<polygon points="12,6 18,17 6,17" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linejoin="round"/>`,
    };
    return `<circle cx="12" cy="12" r="11" fill="#1d1f24"/>${shape[button]}`;
  }
  if (family === 'xbox' || family === 'generic') {
    return `<circle cx="12" cy="12" r="11" fill="${colour ?? '#2a2f36'}"/>${text(12, 16.5, 13, '#fff', glyphLabel(family, button))}`;
  }
  // steam and switch: dark disc, white letter
  return `<circle cx="12" cy="12" r="11" fill="#2a2f36"/>${text(12, 16.5, 13, '#fff', glyphLabel(family, button))}`;
}

function bodyFor(family: PadFamily, button: PadButtonName): string {
  if (FACE.includes(button)) return faceBody(family, button);
  const label = glyphLabel(family, button);
  if (button === 'lb' || button === 'rb') {
    return `<rect x="1" y="6" width="22" height="12" rx="5" fill="#2a2f36" stroke="#fff" stroke-width="1"/>${text(12, 14.5, 9, '#fff', label)}`;
  }
  if (button === 'lt' || button === 'rt') {
    return `<path d="M3 22V10a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8v12z" fill="#2a2f36" stroke="#fff" stroke-width="1"/>${text(12, 15.5, 9, '#fff', label)}`;
  }
  if (button === 'select' || button === 'start' || button === 'home') {
    const fit = label.length > 4 ? ' textLength="20" lengthAdjust="spacingAndGlyphs"' : '';
    return `<rect x="1" y="7" width="22" height="10" rx="5" fill="#2a2f36" stroke="#fff" stroke-width="1"/>${text(12, 14.2, 6.5, '#fff', label, fit)}`;
  }
  if (button === 'lstick' || button === 'rstick' || button === 'l3' || button === 'r3') {
    const chevron = button === 'l3' || button === 'r3'
      ? '<path d="M9.5 15.5L12 18L14.5 15.5" fill="none" stroke="#fff" stroke-width="1.2"/>'
      : '';
    return `<circle cx="12" cy="12" r="10" fill="#2a2f36" stroke="#fff" stroke-width="1"/>`
      + `<circle cx="12" cy="12" r="6" fill="none" stroke="#fff" stroke-width="1"/>`
      + `${text(12, 11.5, 8, '#fff', label)}${chevron}`;
  }
  // d-pad: a plus, with the pressed arm lit (dpad = whole pad, no arm lit)
  const plus = '<path d="M8 1H16V8H23V16H16V23H8V16H1V8H8Z" fill="#2a2f36" stroke="#fff" stroke-width="1"/>';
  const arms: Partial<Record<PadButtonName, string>> = {
    up: '<rect x="8" y="1" width="8" height="7" fill="#fff"/>',
    down: '<rect x="8" y="16" width="8" height="7" fill="#fff"/>',
    left: '<rect x="1" y="8" width="7" height="8" fill="#fff"/>',
    right: '<rect x="16" y="8" width="7" height="8" fill="#fff"/>',
  };
  return plus + (DPAD_ARMS.includes(button) ? arms[button] ?? '' : '');
}

/**
 * The glyph as an inline SVG string, `size` px square (default 22), with `role="img"` and an `aria-label` of
 * glyphName(). Self-contained (no external refs, no ids that could clash), safe to set as innerHTML.
 */
export function glyphSvg(family: PadFamily, button: PadButtonName, size = 22): string {
  const open = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" role="img" aria-label="${esc(glyphName(family, button))}">`;
  return open + bodyFor(family, button) + '</svg>';
}

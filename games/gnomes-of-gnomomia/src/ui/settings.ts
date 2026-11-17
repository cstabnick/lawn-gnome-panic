// Settings screen (modal): minimap options, audio, graphics, camera controls, quick actions, and keybindings.
import { UI } from '../config';
import { say } from '../events';
import { saveGame } from '../save';
import { onSettingsChange, resetSettings, settings, updateSettings, type Settings } from '../settings';
import { unstuckPlayer } from '../zones';
import { TOUCH, dock, dockButton } from './layout';

let overlay: HTMLDivElement;
let panel: HTMLDivElement;
let settingsBtn: HTMLButtonElement;
let open = false;

const syncFns: Array<(s: Settings) => void> = [];

function make<K extends keyof HTMLElementTagNameMap>(
  parent: HTMLElement,
  tag: K,
  css: Partial<CSSStyleDeclaration> = {},
  text?: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  Object.assign(el.style, css);
  if (text !== undefined) el.textContent = text;
  parent.appendChild(el);
  return el;
}

function addSection(parent: HTMLElement, title: string): HTMLDivElement {
  make(parent, 'div', {
    color: UI.gold, fontWeight: 'bold', fontSize: '13px', marginTop: '10px', marginBottom: '4px',
    paddingBottom: '2px', borderBottom: `1px solid ${UI.borderLight}`,
  }, title);
  return make(parent, 'div', { display: 'flex', flexDirection: 'column', gap: '6px' });
}

function addToggle(
  parent: HTMLElement,
  label: string,
  get: (s: Settings) => boolean,
  onChange: (val: boolean) => void,
): void {
  const row = make(parent, 'label', {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
    cursor: 'pointer', fontSize: '13px', color: UI.text, minHeight: TOUCH ? '32px' : '22px',
  });
  make(row, 'span', {}, label);
  const input = make(row, 'input', {
    width: TOUCH ? '20px' : '16px', height: TOUCH ? '20px' : '16px',
    accentColor: UI.gold, cursor: 'pointer', margin: '0',
  });
  input.type = 'checkbox';
  input.checked = get(settings);
  input.onchange = () => onChange(input.checked);
  syncFns.push((s) => {
    input.checked = get(s);
  });
}

function addSlider(
  parent: HTMLElement,
  label: string,
  min: number,
  max: number,
  step: number,
  get: (s: Settings) => number,
  format: (v: number) => string,
  onChange: (val: number) => void,
): void {
  const row = make(parent, 'div', {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
    fontSize: '13px', color: UI.text, minHeight: TOUCH ? '32px' : '24px',
  });
  make(row, 'span', { flex: '1 1 auto' }, label);
  const right = make(row, 'div', { display: 'flex', alignItems: 'center', gap: '8px', flex: '0 0 auto' });
  const input = make(right, 'input', {
    width: '110px', accentColor: UI.gold, cursor: 'pointer', margin: '0',
  });
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(get(settings));
  const valEl = make(right, 'span', {
    width: '42px', textAlign: 'right', color: UI.textDim, fontSize: '12px', fontVariantNumeric: 'tabular-nums',
  }, format(get(settings)));
  input.oninput = () => {
    const v = Number(input.value);
    valEl.textContent = format(v);
    onChange(v);
  };
  syncFns.push((s) => {
    const v = get(s);
    input.value = String(v);
    valEl.textContent = format(v);
  });
}

function addActionBtn(parent: HTMLElement, label: string, onClick: () => void): HTMLButtonElement {
  const b = make(parent, 'button', {
    flex: '1 1 auto', font: 'inherit', fontSize: '12px', fontWeight: 'bold',
    padding: TOUCH ? '8px 10px' : '5px 10px', cursor: 'pointer',
    background: UI.panelBgDark, color: UI.text, border: `1px solid ${UI.borderLight}`,
    touchAction: 'manipulation',
  }, label);
  b.onclick = onClick;
  return b;
}

export function isSettingsOpen(): boolean {
  return open;
}

export function openSettings(): void {
  if (open) return;
  open = true;
  overlay.style.display = 'flex';
  settingsBtn.style.borderColor = UI.gold;
}

export function closeSettings(): void {
  if (!open) return;
  open = false;
  overlay.style.display = 'none';
  settingsBtn.style.borderColor = UI.border;
}

export function toggleSettings(): void {
  if (open) closeSettings();
  else openSettings();
}

export function createSettings(root: HTMLElement): void {
  overlay = make(root, 'div', {
    position: 'absolute', inset: '0', display: 'none', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.55)', pointerEvents: 'auto', zIndex: '50', padding: '12px', boxSizing: 'border-box',
  });
  overlay.id = 'settings-overlay';
  overlay.addEventListener('pointerdown', (e) => {
    if (e.target === overlay) closeSettings();
  });

  panel = make(overlay, 'div', {
    width: 'min(420px, 100%)', maxHeight: 'min(540px, 90vh)', display: 'flex', flexDirection: 'column',
    background: UI.panelBg, border: `2px solid ${UI.border}`,
    boxShadow: `0 0 0 1px ${UI.borderLight}, 0 8px 24px rgba(0,0,0,0.75)`,
    fontFamily: UI.font, color: UI.text, boxSizing: 'border-box',
  });
  panel.id = 'settings-panel';

  // Header
  const header = make(panel, 'div', {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px',
    background: UI.panelBgDark, borderBottom: `2px solid ${UI.border}`,
  });
  make(header, 'div', { color: UI.gold, fontWeight: 'bold', fontSize: '15px' }, '⚙️ Settings');
  const closeBtn = make(header, 'button', {
    background: 'transparent', border: `1px solid ${UI.borderLight}`, color: UI.text,
    font: 'inherit', fontSize: '13px', fontWeight: 'bold', width: TOUCH ? '32px' : '24px',
    height: TOUCH ? '32px' : '24px', cursor: 'pointer', padding: '0', lineHeight: '1',
  }, '✕');
  closeBtn.title = 'Close (Esc)';
  closeBtn.onclick = closeSettings;

  // Scrollable body
  const body = make(panel, 'div', {
    padding: '4px 12px 12px', overflowY: 'auto', flex: '1 1 auto', minHeight: '0',
  });

  const minimapSec = addSection(body, 'Minimap & Display');
  addToggle(minimapSec, 'Show minimap (N)', (s) => s.showMinimap, (v) => updateSettings({ showMinimap: v }));
  addToggle(minimapSec, 'Rotate minimap with camera', (s) => s.minimapRotate, (v) => updateSettings({ minimapRotate: v }));
  addSlider(
    minimapSec, 'Minimap zoom', 0.6, 2.0, 0.1,
    (s) => s.minimapZoom, (v) => `${v.toFixed(1)}×`,
    (v) => updateSettings({ minimapZoom: v }),
  );
  addToggle(minimapSec, 'Shadows', (s) => s.shadows, (v) => updateSettings({ shadows: v }));
  addToggle(minimapSec, 'High-DPI rendering', (s) => s.highDpi, (v) => updateSettings({ highDpi: v }));
  addToggle(minimapSec, 'Player name plates', (s) => s.showPlates, (v) => updateSettings({ showPlates: v }));

  const audioSec = addSection(body, 'Audio');
  addToggle(audioSec, 'Mute all sound (M)', (s) => s.muted, (v) => updateSettings({ muted: v }));
  addSlider(
    audioSec, 'Master volume', 0, 1, 0.05,
    (s) => s.volume, (v) => `${Math.round(v * 100)}%`,
    (v) => updateSettings({ volume: v }),
  );
  addToggle(audioSec, 'Music', (s) => !s.musicMuted, (v) => updateSettings({ musicMuted: !v }));
  addSlider(
    audioSec, 'Music volume', 0, 1, 0.05,
    (s) => s.musicVolume, (v) => `${Math.round(v * 100)}%`,
    (v) => updateSettings({ musicVolume: v }),
  );

  const camSec = addSection(body, 'Camera');
  addSlider(
    camSec, 'Camera sensitivity', 0.5, 2.0, 0.1,
    (s) => s.cameraSpeed, (v) => `${v.toFixed(1)}×`,
    (v) => updateSettings({ cameraSpeed: v }),
  );
  addToggle(camSec, 'Invert vertical drag', (s) => s.invertY, (v) => updateSettings({ invertY: v }));

  const actionsSec = addSection(body, 'Actions');
  const btnRow = make(actionsSec, 'div', { display: 'flex', gap: '6px', flexWrap: 'wrap' });
  addActionBtn(btnRow, 'Save now', () => {
    saveGame();
    say('Game saved.', UI.good);
  });
  addActionBtn(btnRow, 'Unstuck', () => {
    closeSettings();
    unstuckPlayer();
  });
  addActionBtn(btnRow, 'Reset defaults', () => {
    resetSettings();
    say('Settings reset to defaults.', UI.textDim);
  });

  const keysSec = addSection(body, 'Controls');
  const grid = make(keysSec, 'div', {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px',
    fontSize: '12px', color: UI.textDim,
  });
  const binds: [string, string][] = [
    ['Click', 'Walk / Interact'],
    ['Right/Mid-drag · Arrows', 'Orbit camera'],
    ['Wheel / Pinch', 'Zoom camera'],
    ['1–8', 'Hotbar slots'],
    ['I / E / C / J', 'Bag / Gear / Stats / Quests'],
    ['B / T / L', 'Spells / Talents / Lore'],
    ['N / M', 'Minimap / Mute'],
    ['Enter / O', 'Chat / Settings'],
  ];
  for (const [k, desc] of binds) {
    const line = make(grid, 'div');
    make(line, 'span', { color: UI.textWhite, fontWeight: 'bold' }, k);
    make(line, 'span', {}, ` · ${desc}`);
  }

  // Dock button
  settingsBtn = dockButton(dock(root), '⚙️', 'Settings (O)');
  settingsBtn.id = 'settings-btn';
  settingsBtn.onclick = toggleSettings;

  // Hotkeys: O toggles settings; Escape closes it.
  window.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    if (e.key === 'Escape' && open) {
      closeSettings();
    } else if (e.key.toLowerCase() === 'o') {
      toggleSettings();
    }
  });

  onSettingsChange((s) => {
    for (const fn of syncFns) fn(s);
  });
}

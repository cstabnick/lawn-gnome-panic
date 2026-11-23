// The sound settings (music-ui-and-tech.md 2.4): one slider per bus, a mute switch, a Test button and the iOS ringer note.
// Settings are per device. The SOUND button sits under the top-right HUD, away from the touch block.
import type { Audio } from '../audio';
import type { AudioSettings } from '../audio/settings';

type SliderKey = Exclude<keyof AudioSettings, 'muted'>;

const ROWS: readonly { key: SliderKey; label: string; note?: string }[] = [
  { key: 'master', label: 'Master' },
  { key: 'sfx', label: 'World sounds', note: 'footsteps and the wind' },
  { key: 'ui', label: 'Interface', note: 'taps, panels, toasts' },
  { key: 'voices', label: 'Voices', note: 'no voices yet' },
  { key: 'music', label: 'Music', note: 'arrives in a later update' },
];

const BUTTON = 'min-height:44px;min-width:44px;padding:8px 12px;border-radius:8px;border:1px solid #56614a;' +
  'background:#2d3a25;color:#eee;font:14px system-ui,sans-serif;cursor:pointer;touch-action:manipulation';

export interface AudioPanel {
  root: HTMLElement;
  toggle(): void;
  open(): void;
  close(): void;
  isOpen(): boolean;
}

export function createAudioPanel(ui: HTMLElement, audio: Audio): AudioPanel {
  const root = document.createElement('div');
  root.id = 'dayg-audio';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Sound settings');
  root.style.cssText = 'position:fixed;inset:0;z-index:53;display:none;align-items:center;justify-content:center;' +
    'background:rgba(0,0,0,.6);padding:12px;box-sizing:border-box;color:#eee;font:14px system-ui,sans-serif;user-select:none';

  const card = document.createElement('div');
  card.style.cssText = 'width:100%;max-width:420px;max-height:100%;overflow:auto;box-sizing:border-box;padding:16px;' +
    'border-radius:12px;background:#1a2116;border:1px solid #2f3a28';

  const head = document.createElement('div');
  head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:12px';
  const title = document.createElement('div');
  title.textContent = 'Sound';
  title.style.cssText = 'font-size:18px;font-weight:700';
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = '✕';
  close.setAttribute('aria-label', 'Close sound settings');
  close.style.cssText = BUTTON + ';width:48px;height:48px;font-size:22px;padding:0';
  head.append(title, close);
  card.append(head);

  const sliders = {} as Record<SliderKey, { input: HTMLInputElement; value: HTMLElement }>;
  for (const row of ROWS) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'margin-bottom:12px';
    const label = document.createElement('div');
    label.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:4px';
    const name = document.createElement('span');
    name.textContent = row.label;
    const value = document.createElement('span');
    value.style.cssText = 'opacity:.8;font-variant-numeric:tabular-nums';
    label.append(name, value);
    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = '100';
    input.step = '1';
    input.style.cssText = 'width:100%;height:32px;margin:0;touch-action:pan-y';
    input.setAttribute('aria-label', row.label);
    input.addEventListener('input', () => {
      audio.setSettings({ ...audio.getSettings(), [row.key]: Number(input.value) });
      value.textContent = `${input.value}`;
    });
    wrap.append(label, input);
    if (row.note) {
      const note = document.createElement('div');
      note.textContent = row.note;
      note.style.cssText = 'font-size:12px;opacity:.6';
      wrap.append(note);
    }
    sliders[row.key] = { input, value };
    card.append(wrap);
  }

  const mute = document.createElement('label');
  mute.style.cssText = 'display:flex;align-items:center;gap:10px;min-height:44px;margin-bottom:8px';
  const muteBox = document.createElement('input');
  muteBox.type = 'checkbox';
  muteBox.style.cssText = 'width:24px;height:24px;margin:0';
  mute.append(muteBox, 'Mute everything');
  muteBox.addEventListener('change', () => { audio.setSettings({ ...audio.getSettings(), muted: muteBox.checked }); });
  card.append(mute);

  const testBtn = document.createElement('button');
  testBtn.type = 'button';
  testBtn.textContent = 'Test sound';
  testBtn.style.cssText = BUTTON;
  testBtn.addEventListener('click', () => { audio.unlock(); audio.test(); });
  card.append(testBtn);

  const note = document.createElement('p');
  note.style.cssText = 'font-size:12px;opacity:.7;margin:14px 0 0';
  note.textContent = 'Game sound plays through the iPhone ringer switch, like the music. Settings are kept on this device.';
  card.append(note);

  root.append(card);
  ui.appendChild(root);

  const button = document.createElement('button');
  button.id = 'dayg-audio-btn';
  button.type = 'button';
  button.textContent = '🔊';
  button.setAttribute('aria-label', 'Sound settings');
  button.style.cssText = BUTTON + ';position:absolute;top:calc(120px + env(safe-area-inset-top));' +
    'right:calc(8px + env(safe-area-inset-right));width:48px;height:48px;padding:0;font-size:20px;z-index:40;box-sizing:border-box';
  ui.appendChild(button);

  let open = false;
  function sync(): void {
    const s = audio.getSettings();
    for (const row of ROWS) {
      sliders[row.key].input.value = String(s[row.key]);
      sliders[row.key].value.textContent = String(s[row.key]);
    }
    muteBox.checked = s.muted;
  }
  function setOpen(on: boolean): void {
    open = on;
    root.style.display = on ? 'flex' : 'none';
    if (on) {
      if (document.pointerLockElement) document.exitPointerLock();
      sync();
      audio.unlock();
    }
  }

  button.addEventListener('click', (e) => { e.stopPropagation(); setOpen(!open); });
  close.addEventListener('click', (e) => { e.stopPropagation(); setOpen(false); });
  window.addEventListener('keydown', (e) => { if (open && e.key === 'Escape') setOpen(false); });

  return {
    root,
    toggle() { setOpen(!open); },
    open() { setOpen(true); },
    close() { setOpen(false); },
    isOpen: () => open,
  };
}

import { PALETTE, type Swatch } from '@lawn/prefabs';
import { getMyGnome } from '@lawn/gnome';
import { DEFAULT_SETTINGS, loadSettings, updateSettings, type Settings } from '../settings';
import { TINT_SWATCHES, el, makeBtn } from '../ui';

function sectionTitle(text: string): HTMLElement {
  return el('div', { margin: '14px 0 6px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.06em', color: 'var(--accent)', textTransform: 'uppercase' }, text);
}

function swatchRow(current: Swatch, onPick: (s: Swatch) => void): HTMLElement {
  const row = el('div', { display: 'flex', flexWrap: 'wrap', gap: '6px' });
  for (const sw of TINT_SWATCHES) {
    const hex = `#${PALETTE[sw].toString(16).padStart(6, '0')}`;
    const b = el('button', {
      width: '44px',
      height: '44px',
      borderRadius: '10px',
      border: sw === current ? '3px solid var(--accent)' : '1px solid #0008',
      background: hex,
      cursor: 'pointer',
    });
    b.type = 'button';
    b.title = sw;
    b.setAttribute('aria-label', sw);
    b.onclick = () => onPick(sw);
    row.append(b);
  }
  return row;
}

/**
 * The Dressing Room panel: dress the gnome you stand on and the camera, and set the mouse. The standing mirror in the room
 * shows the result. `onChange` fires after every edit (the lab redraws the mirror).
 */
export function renderOptions(container: HTMLElement, onChange: (s: Settings) => void): void {
  container.replaceChildren();
  container.id = 'options';
  const wrap = el('div', { padding: '18px', display: 'flex', flexDirection: 'column' });
  container.append(wrap);

  const redraw = (): void => renderOptions(container, onChange);
  const set = (patch: Partial<Settings>): void => {
    onChange(updateSettings(patch));
    redraw();
  };
  const s = loadSettings();

  wrap.append(
    el('h2', { margin: '0', fontSize: '22px', color: 'var(--accent)' }, 'Dressing Room'),
    el(
      'div',
      { color: 'var(--dim)', fontSize: '13px', lineHeight: '1.45', marginTop: '4px' },
      'In the mirror: you, standing on the shoulders of your carrier gnome and holding the camera. That pair is the viewpoint you walk around the house with.',
    ),
  );

  const mine = getMyGnome();
  const you = el('div', { marginTop: '10px', padding: '10px 12px', borderRadius: '10px', background: '#162018', border: '1px solid var(--line)', fontSize: '13px', lineHeight: '1.45' });
  you.append(
    el('strong', {}, mine ? `You: ${mine.name || 'your gnome'}` : 'You: Gnorman, the default gnome'),
    document.createElement('br'),
    document.createTextNode(mine ? 'The gnome on top is the one you made in the Gnome Creator.' : 'Make your own gnome and it appears up there.'),
  );
  const link = el('a', { color: 'var(--accent)', display: 'inline-block', marginTop: '6px', minHeight: '44px', lineHeight: '44px', fontWeight: '700' }, 'Open the Gnome Creator →');
  link.href = '../gnome-creator/';
  you.append(document.createElement('br'), link);
  wrap.append(you);

  wrap.append(sectionTitle('Carrier gnome: coat'), swatchRow(s.carrierCoat, (v) => set({ carrierCoat: v })));
  wrap.append(sectionTitle('Carrier gnome: hat (kept under the rider)'), swatchRow(s.carrierHat, (v) => set({ carrierHat: v })));
  wrap.append(sectionTitle('Camera colour'), swatchRow(s.cameraColor, (v) => set({ cameraColor: v })));

  wrap.append(sectionTitle('Mouse look (during the ride)'));
  const sens = el('div', { display: 'flex', alignItems: 'center', gap: '10px' });
  const slider = el('input', { flex: '1', minHeight: '44px' });
  slider.type = 'range';
  slider.min = '0.4';
  slider.max = '2.5';
  slider.step = '0.1';
  slider.value = String(s.mouseSens);
  slider.setAttribute('aria-label', 'Mouse sensitivity');
  const readout = el('span', { minWidth: '44px', textAlign: 'right', fontWeight: '700' }, `${s.mouseSens.toFixed(1)}x`);
  slider.oninput = () => {
    readout.textContent = `${Number(slider.value).toFixed(1)}x`;
  };
  slider.onchange = () => {
    onChange(updateSettings({ mouseSens: Number(slider.value) }));
  };
  sens.append(el('span', { color: 'var(--dim)', fontSize: '13px' }, 'Speed'), slider, readout);
  wrap.append(sens);

  const toggles = el('div', { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' });
  toggles.append(
    makeBtn(s.invertY ? '↕ Invert Y: On' : '↕ Invert Y: Off', () => set({ invertY: !s.invertY }), s.invertY),
    makeBtn(s.bob ? '🚶 Walking bob: On' : '🚶 Walking bob: Off', () => set({ bob: !s.bob }), s.bob),
  );
  wrap.append(sectionTitle('Camera'), toggles);

  const reset = makeBtn('Reset to defaults', () => set({ ...DEFAULT_SETTINGS }));
  reset.style.marginTop = '18px';
  reset.style.alignSelf = 'flex-start';
  wrap.append(reset);
}

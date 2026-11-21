import { PALETTE, type Swatch } from '@lawn/prefabs';
import { getMyGnome } from '@lawn/gnome';
import { DEFAULT_SETTINGS, loadSettings, updateSettings, type Settings } from '../settings';
import { PANE_PAD, TINT_SWATCHES, el, makeBtn, paneHead } from '../ui';

/** A titled card; options are grouped into these instead of one long list. */
function card(icon: string, title: string, note?: string): HTMLElement {
  const c = el('section', { background: '#162018', border: '1px solid var(--line)', borderRadius: '14px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' });
  const head = el('div', { display: 'flex', alignItems: 'center', gap: '8px' });
  head.append(el('span', { fontSize: '20px' }, icon), el('strong', { fontSize: '15px' }, title));
  c.append(head);
  if (note) c.append(el('div', { fontSize: '12px', color: 'var(--dim)', lineHeight: '1.45', marginTop: '-4px' }, note));
  return c;
}

/** A label on the left, a control on the right (or under it when the control is wide). */
function field(label: string, hint: string | null, control: HTMLElement, stacked = false): HTMLElement {
  const row = el('div', { display: 'flex', flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'center', justifyContent: 'space-between', gap: stacked ? '6px' : '12px' });
  const text = el('div', { minWidth: '0' });
  text.append(el('div', { fontSize: '13px', fontWeight: '700' }, label));
  if (hint) text.append(el('div', { fontSize: '11px', color: 'var(--dim)', marginTop: '1px' }, hint));
  row.append(text, control);
  return row;
}

function swatches(current: Swatch, onPick: (s: Swatch) => void): HTMLElement {
  const row = el('div', { display: 'flex', flexWrap: 'wrap', gap: '6px' });
  for (const sw of TINT_SWATCHES) {
    const hex = `#${PALETTE[sw].toString(16).padStart(6, '0')}`;
    const on = sw === current;
    const b = el('button', {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      border: on ? '3px solid #fff' : '2px solid #0008',
      boxShadow: on ? '0 0 0 2px var(--accent)' : 'none',
      background: hex,
      cursor: 'pointer',
    });
    b.type = 'button';
    b.title = sw;
    b.setAttribute('aria-label', sw);
    b.setAttribute('aria-pressed', String(on));
    b.onclick = () => onPick(sw);
    row.append(b);
  }
  return row;
}

/** An on/off switch (not a button that changes its label). */
function toggle(on: boolean, label: string, onChange: (v: boolean) => void): HTMLElement {
  const b = el('button', {
    position: 'relative',
    width: '56px',
    height: '44px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    flex: '0 0 auto',
    padding: '0',
  });
  b.type = 'button';
  b.setAttribute('role', 'switch');
  b.setAttribute('aria-checked', String(on));
  b.setAttribute('aria-label', label);
  const track = el('span', { position: 'absolute', left: '0', top: '10px', width: '56px', height: '26px', borderRadius: '999px', background: on ? 'var(--accent)' : '#2e4033', transition: 'background 120ms' });
  const knob = el('span', { position: 'absolute', top: '13px', left: on ? '33px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: on ? '#18231a' : '#9fb49c', transition: 'left 120ms' });
  b.append(track, knob);
  b.onclick = () => onChange(!on);
  return b;
}

/**
 * The Dressing Room panel, in cards: who is in the mirror, how they are dressed, and how the mouse and camera behave.
 * `onChange` fires after every edit (the lab redraws the mirror).
 */
export function renderOptions(container: HTMLElement, onChange: (s: Settings) => void): void {
  container.replaceChildren();
  container.id = 'options';
  const wrap = el('div', { padding: PANE_PAD, display: 'flex', flexDirection: 'column', gap: '12px' });
  container.append(wrap);

  const redraw = (): void => renderOptions(container, onChange);
  const set = (patch: Partial<Settings>): void => {
    onChange(updateSettings(patch));
    redraw();
  };
  const s = loadSettings();

  wrap.append(paneHead({ eyebrow: 'Dressing Room', title: 'Options', hint: 'Look in the mirror →' }));

  // 1. Who you are.
  const mine = getMyGnome();
  const who = card('🧑‍🎤', mine ? `You: ${mine.name || 'your gnome'}` : 'You: Gnorman', mine ? 'The gnome on top is the one you made in the Gnome Creator.' : 'The default gnome. Make your own and it stands on top instead.');
  const link = el('a', { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: '44px', padding: '0 14px', borderRadius: '10px', border: '1px solid var(--accent)', color: 'var(--accent)', fontWeight: '800', fontSize: '13px', textDecoration: 'none', alignSelf: 'flex-start' }, '🎨 Open the Gnome Creator');
  link.href = '../gnome-creator/';
  who.append(link);
  wrap.append(who);

  // 2. How the carrier and camera are dressed.
  const look = card('🧥', 'Carrier & camera', 'You ride on a plain gnome\'s shoulders and hold the camera. Pick what they wear.');
  look.append(
    field('Carrier coat', null, swatches(s.carrierCoat, (v) => set({ carrierCoat: v })), true),
    field('Carrier hat', 'hidden under you, but it is there', swatches(s.carrierHat, (v) => set({ carrierHat: v })), true),
    field('Camera body', null, swatches(s.cameraColor, (v) => set({ cameraColor: v })), true),
  );
  wrap.append(look);

  // 3. Controls.
  const controls = card('🖱️', 'Controls', 'The ride captures the mouse: click to capture, move to look, click to snap, Esc to release.');
  const slider = el('input', { width: '100%', minHeight: '44px' });
  slider.type = 'range';
  slider.min = '0.4';
  slider.max = '2.5';
  slider.step = '0.1';
  slider.value = String(s.mouseSens);
  slider.setAttribute('aria-label', 'Mouse sensitivity');
  const readout = el('strong', { minWidth: '44px', textAlign: 'right', color: 'var(--accent)' }, `${s.mouseSens.toFixed(1)}x`);
  slider.oninput = () => {
    readout.textContent = `${Number(slider.value).toFixed(1)}x`;
  };
  slider.onchange = () => {
    onChange(updateSettings({ mouseSens: Number(slider.value) }));
  };
  const sensRow = el('div', { display: 'flex', alignItems: 'center', gap: '10px' });
  sensRow.append(el('span', { fontSize: '11px', color: 'var(--dim)' }, 'slow'), slider, el('span', { fontSize: '11px', color: 'var(--dim)' }, 'fast'), readout);
  controls.append(
    field('Look speed', null, sensRow, true),
    field('Invert vertical look', 'push up to look down', toggle(s.invertY, 'Invert vertical look', (v) => set({ invertY: v }))),
  );
  wrap.append(controls);

  // 4. Camera feel.
  const feel = card('🚶', 'Walking');
  feel.append(field('Head bob', 'a little bounce as the camera walks through the house', toggle(s.bob, 'Head bob', (v) => set({ bob: v }))));
  wrap.append(feel);

  const reset = makeBtn('↺ Reset to defaults', () => set({ ...DEFAULT_SETTINGS }));
  reset.style.alignSelf = 'flex-start';
  wrap.append(reset);
}

// Options: no floating button. It opens from the More menu (☰ › Options), O, or Start on a pad. The panel holds the
// Touch layout picker, a controls list for the device in use, Driving realism (the physics family every ground vehicle
// uses: a fun extra, not a primary control), the radio, dialogue, map, sound, cloud and the Save Trainer.
import { firstPad } from '@lawn/gamepad';
import { TUNES, getTune, type Tune } from './simdrive';
import type { TimeMode } from './atmosphere';
import { getRadioText, setRadioText } from './radio/prefs';
import { TEXT_SPEEDS, getTextSpeed, setTextSpeed, type TextSpeed } from './cutscene/textSpeed';
import { KEYS } from './keys';
import { getMapPlayers, setMapPlayers } from './mapPrefs';
import { mountSoundOptions } from './sound/volumeUi';
import { mountCloudStatus } from './cloudSave';
import { mountWaveOptions } from './waveOptions';
import { mountViewOptions } from './viewPrefs';
import { registerAction } from './ui/actions';
import { getTouchLayout, setTouchLayout, TOUCH_LAYOUTS, type TouchLayout } from './ui/style';
import { controlsFor, esc } from './ui/glyphs';
import { currentGlyphSet, onInputSourceChange } from './ui/inputSource';

const LAYOUT_TEXT: Record<TouchLayout, { label: string; desc: string }> = {
  standard: { label: 'Standard', desc: 'Every button' },
  minimal: { label: 'Minimal', desc: 'Fewer buttons, no pinned shortcuts' },
  'left-handed': { label: 'Left-handed', desc: 'Stick on the right, buttons on the left' },
};

/** Builds the settings panel. Returns the Controls slot inside it, for the Steam Controller button. */
export function createOptions(
  ui: HTMLElement,
  onPickMode: (t: Tune) => void,
  onPickTime?: (mode: TimeMode) => void,
): HTMLElement {
  const style = document.createElement('style');
  style.textContent = `
    #gta-options{position:fixed;right:calc(env(safe-area-inset-right) + 10px);top:calc(env(safe-area-inset-top) + max(18px,4vw) + var(--gta-map,128px) + 8px);z-index:30;display:flex;flex-direction:column;align-items:flex-end;gap:6px;font:600 14px system-ui,sans-serif;color:#fff;pointer-events:none;}
    #gta-options button{font:inherit;color:#fff;touch-action:manipulation;}
    #gta-options .gta-opt-panel{display:none;flex-direction:column;gap:6px;padding:10px;border-radius:12px;background:rgba(20,20,20,.88);width:min(86vw,330px);max-height:calc(100dvh - env(safe-area-inset-top) - 260px);overflow-y:auto;touch-action:pan-y;pointer-events:auto;box-sizing:border-box;}
    #gta-options .gta-opt-head{display:flex;align-items:center;justify-content:space-between;font-size:16px;}
    #gta-options .gta-opt-close{width:44px;height:44px;margin:-8px -8px -8px 0;border:0;background:none;font-size:20px;}
    #gta-options h3{margin:4px 0 0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#ffd23f;}
    #gta-options .gta-opt-note{font-weight:400;font-size:12px;opacity:.8;line-height:1.3;}
    #gta-options .gta-opt-list{display:grid;grid-template-columns:1fr;gap:6px;}
    #gta-options .gta-opt-mode{min-height:48px;padding:6px 12px;text-align:left;border-radius:8px;border:2px solid rgba(255,255,255,.3);background:rgba(255,255,255,.08);}
    #gta-options .gta-opt-mode small{display:block;font-weight:400;font-size:12px;opacity:.8;margin-top:1px;}
    #gta-options .gta-opt-controls{display:grid;grid-template-columns:1fr auto;gap:4px 10px;align-items:center;font-size:12px;}
    @media (max-height:520px){#gta-options .gta-opt-panel{position:fixed;top:calc(env(safe-area-inset-top) + 8px);right:calc(env(safe-area-inset-right) + 64px);width:min(72vw,480px);max-height:calc(100dvh - env(safe-area-inset-top) - 16px);}#gta-options .gta-opt-list{grid-template-columns:1fr 1fr;}}
  `;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'gta-options';
  const panel = document.createElement('div');
  panel.className = 'gta-opt-panel';
  // Controls holds the Steam Controller button (it only shows when one is in use).
  panel.innerHTML = '<div class="gta-opt-head"><span>Options</span><button type="button" class="gta-opt-close" aria-label="Close options">✕</button></div>'
    + '<h3>Controls</h3><div class="gta-opt-extras"></div>';
  const extras = panel.querySelector<HTMLElement>('.gta-opt-extras') as HTMLElement;
  root.append(panel);
  ui.appendChild(root);

  const buttons = new Map<string, HTMLButtonElement>();

  // Touch layout: standard / minimal / left-handed (ui/style.ts). Lit by its own paint, not by mark().
  const layoutHead = document.createElement('div');
  layoutHead.className = 'gta-opt-note';
  layoutHead.style.fontWeight = '700';
  layoutHead.textContent = 'Touch layout';
  const layoutList = document.createElement('div');
  layoutList.className = 'gta-opt-list';
  const layoutBtns = new Map<TouchLayout, HTMLButtonElement>();
  for (const id of TOUCH_LAYOUTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'gta-opt-mode';
    b.innerHTML = `${LAYOUT_TEXT[id].label}<small>${LAYOUT_TEXT[id].desc}</small>`;
    b.addEventListener('click', () => { setTouchLayout(id); paintLayout(); });
    layoutBtns.set(id, b);
    buttons.set(`layout-${id}`, b);
    layoutList.appendChild(b);
  }
  const paintLayout = (): void => {
    const cur = getTouchLayout();
    layoutBtns.forEach((b, id) => { b.style.borderColor = id === cur ? '#ffd23f' : 'rgba(255,255,255,.3)'; });
  };
  window.addEventListener('gta:touch-layout', paintLayout);
  paintLayout();

  // Your controls: the actions for the device in use (keyboard keys, pad glyphs, or the touch words).
  const ctlHead = document.createElement('div');
  ctlHead.className = 'gta-opt-note';
  ctlHead.style.fontWeight = '700';
  const ctlList = document.createElement('div');
  ctlList.className = 'gta-opt-controls';
  const paintControls = (): void => {
    const set = currentGlyphSet();
    const device = set === 'touch' ? 'touch' : set === 'keyboard' ? 'keyboard' : 'gamepad';
    ctlHead.textContent = `Your controls (${device})`;
    ctlList.innerHTML = controlsFor(set, 'all')
      .map((r) => `<span>${esc(r.label)}</span><span>${r.html}</span>`)
      .join('');
  };

  panel.append(layoutHead, layoutList, ctlHead, ctlList);
  panel.insertAdjacentHTML('beforeend', '<h3>Cheats</h3><div class="gta-opt-note">Just for fun. Driving realism changes how every ground vehicle handles; each still drives like itself.</div>');

  const addGroup = (title: string, group: Tune['group']): void => {
    const h = document.createElement('div');
    h.className = 'gta-opt-note';
    h.style.fontWeight = '700';
    h.textContent = title;
    const list = document.createElement('div');
    list.className = 'gta-opt-list';
    for (const t of TUNES.filter((x) => x.group === group)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'gta-opt-mode';
      b.innerHTML = `${t.name}<small>${t.blurb}</small>`;
      b.addEventListener('click', () => { onPickMode(t); mark(); });
      buttons.set(t.id, b);
      list.appendChild(b);
    }
    panel.append(h, list);
  };
  addGroup('Driving realism', 'realism');
  addGroup('Silly handling', 'silly');
  // Radio: the station and DJ text that floats over the screen. Off keeps the music and hides the words.
  const radioHead = document.createElement('div');
  radioHead.className = 'gta-opt-note';
  radioHead.style.fontWeight = '700';
  radioHead.textContent = 'Radio';
  const radioList = document.createElement('div');
  radioList.className = 'gta-opt-list';
  const radioBtn = document.createElement('button');
  radioBtn.type = 'button';
  radioBtn.className = 'gta-opt-mode';
  const paintRadio = (): void => {
    radioBtn.innerHTML = `Radio text: ${getRadioText() ? 'on' : 'off'}<small>Station, DJ, adverts and bulletins as floating text. Off keeps the music and hides the words.</small>`;
  };
  paintRadio();
  radioBtn.addEventListener('click', () => { setRadioText(!getRadioText()); paintRadio(); });
  buttons.set('radio-text', radioBtn);
  radioList.appendChild(radioBtn);
  panel.append(radioHead, radioList);

  // Dialogue: how fast cutscene lines type out (kept per browser).
  const dlgHead = document.createElement('div');
  dlgHead.className = 'gta-opt-note';
  dlgHead.style.fontWeight = '700';
  dlgHead.textContent = 'Dialogue';
  const dlgList = document.createElement('div');
  dlgList.className = 'gta-opt-list';
  const speedBtn = document.createElement('button');
  speedBtn.type = 'button';
  speedBtn.className = 'gta-opt-mode';
  const speedLabels: Record<TextSpeed, string> = { slow: 'Slow', normal: 'Normal', fast: 'Fast', instant: 'Instant' };
  const paintSpeed = (): void => {
    speedBtn.innerHTML = `Text speed: ${speedLabels[getTextSpeed()]}<small>How fast cutscene lines type out. Tap a line to finish it; tap again for the next.</small>`;
  };
  paintSpeed();
  speedBtn.addEventListener('click', () => {
    const i = TEXT_SPEEDS.indexOf(getTextSpeed());
    setTextSpeed(TEXT_SPEEDS[(i + 1) % TEXT_SPEEDS.length]);
    paintSpeed();
  });
  buttons.set('text-speed', speedBtn);
  dlgList.appendChild(speedBtn);
  panel.append(dlgHead, dlgList);

  // Multiplayer: other online players on the minimap and big map. On by default; off hides them from both maps (their names still show over their heads).
  const mpHead = document.createElement('div');
  mpHead.className = 'gta-opt-note';
  mpHead.style.fontWeight = '700';
  mpHead.textContent = 'Multiplayer';
  const mpList = document.createElement('div');
  mpList.className = 'gta-opt-list';
  const mapPlayersBtn = document.createElement('button');
  mapPlayersBtn.type = 'button';
  mapPlayersBtn.className = 'gta-opt-mode';
  const paintMapPlayers = (): void => {
    mapPlayersBtn.innerHTML = `Players on the map: ${getMapPlayers() ? 'on' : 'off'}<small>Other online players as dots on the minimap and big map. Off hides them from both.</small>`;
  };
  paintMapPlayers();
  mapPlayersBtn.addEventListener('click', () => { setMapPlayers(!getMapPlayers()); paintMapPlayers(); });
  buttons.set('map-players', mapPlayersBtn);
  mpList.appendChild(mapPlayersBtn);
  panel.append(mpHead, mpList);
  if (onPickTime) {
    const timeHead = document.createElement('div');
    timeHead.className = 'gta-opt-note';
    timeHead.style.fontWeight = '700';
    timeHead.textContent = 'Time of Day';
    const timeList = document.createElement('div');
    timeList.className = 'gta-opt-list';
    const modes: { id: TimeMode; label: string; desc: string }[] = [
      { id: 'auto', label: 'Auto Cycle', desc: 'Smooth 6-minute day, golden hour & neon night.' },
      { id: 'noon', label: 'Noon', desc: 'Crisp midday garden sun.' },
      { id: 'golden', label: 'Golden Hour', desc: 'Warm sunset glow across Turfton.' },
      { id: 'night', label: 'Neon Night', desc: 'Streetlamps, headlights & Greenhouse neon.' },
    ];
    let curTime: TimeMode = 'auto';
    const timeBtns: { id: TimeMode; el: HTMLButtonElement }[] = [];
    const paintTime = (): void => {
      for (const tb of timeBtns) tb.el.style.borderColor = tb.id === curTime ? '#ffd23f' : 'rgba(255,255,255,.3)';
    };
    for (const m of modes) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'gta-opt-mode';
      b.innerHTML = `${m.label}<small>${m.desc}</small>`;
      b.addEventListener('click', () => {
        curTime = m.id;
        onPickTime(m.id);
        paintTime();
      });
      timeBtns.push({ id: m.id, el: b });
      timeList.appendChild(b);
    }
    paintTime();
    panel.append(timeHead, timeList);
  }

  // Sound: mute and the World, Ambience and Voices sliders (src/sound/volumeUi.ts).
  mountSoundOptions(panel);
  // View: screen shake off / low / normal, first person (src/viewPrefs.ts).
  mountViewOptions(panel);
  // Water waves: off / low / high (src/waveOptions.ts).
  mountWaveOptions(panel);
  // Cloud save: synced / syncing / offline (src/cloudSave.ts).
  mountCloudStatus(panel);

  // Save Trainer (src/trainer/): save export / import / reset moved there, with character, spawn, world and cutscene tools.
  const trHeading = document.createElement('h3');
  trHeading.textContent = 'Experimental';
  const trList = document.createElement('div');
  trList.className = 'gta-opt-list';
  const trainerBtn = document.createElement('button');
  trainerBtn.type = 'button';
  trainerBtn.className = 'gta-opt-mode';
  trainerBtn.innerHTML = 'Save Trainer<small>Export, import or reset your save; edit the character, spawn things, play cutscenes.'
    + (currentGlyphSet() === 'keyboard' ? ' F9 or ` too.' : '') + '</small>';
  trainerBtn.addEventListener('click', () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent('gta:trainer'));
  });
  buttons.set('trainer', trainerBtn);
  trList.append(trainerBtn);
  panel.append(trHeading, trList);

  // The tune buttons get the gold border of the picked tune; the touch layout buttons paint themselves (paintLayout).
  const mark = (): void => buttons.forEach((b, id) => {
    if (id.startsWith('layout-')) return;
    b.style.borderColor = id === getTune().id ? '#ffd23f' : 'rgba(255,255,255,.3)';
  });

  // Gamepad: while open the panel owns the pad (input.ts reads body[data-options]); D-pad or stick picks, A selects, B / Start close.
  const ids = [...buttons.keys()];
  let focus = 0;
  let isOpen = false;
  let padPrev: boolean[] = [];
  // The focus ring is for the pad; with a mouse or touch it only gets in the way.
  const showFocus = (): void => buttons.forEach((b, id) => { b.style.outline = id === ids[focus] && firstPad() ? '3px solid #7cf0ff' : 'none'; });
  function pollPad(): void {
    if (!isOpen) return;
    const p = firstPad();
    if (p) {
      const down = p.buttons.map((b) => b.pressed);
      const y = p.axes[1] ?? 0;
      const up = down[12] || y < -0.6;
      const dn = down[13] || y > 0.6;
      const wasUp = padPrev[12] || padPrev[100];
      const wasDn = padPrev[13] || padPrev[101];
      down[100] = y < -0.6;
      down[101] = y > 0.6;
      if (up && !wasUp) { focus = (focus + ids.length - 1) % ids.length; showFocus(); }
      if (dn && !wasDn) { focus = (focus + 1) % ids.length; showFocus(); }
      if (down[0] && !padPrev[0]) buttons.get(ids[focus])?.click();
      if ((down[1] && !padPrev[1]) || (down[9] && !padPrev[9])) { setOpen(false); return; }
      padPrev = down;
    }
    requestAnimationFrame(pollPad);
  }
  function setOpen(open: boolean): void {
    isOpen = open;
    panel.style.display = open ? 'flex' : 'none';
    document.body.dataset.options = open ? 'open' : '';
    if (open) {
      if (document.pointerLockElement) document.exitPointerLock();
      paintLayout();
      paintControls();
      focus = Math.max(0, ids.indexOf(getTune().id));
      showFocus();
      // Buttons already held when it opened (the Start press itself) must not count as new presses.
      const p = firstPad();
      padPrev = p ? p.buttons.map((b) => b.pressed) : [];
      requestAnimationFrame(pollPad);
    }
  }
  const toggle = (): void => setOpen(!isOpen);
  window.addEventListener('gta:options', toggle);
  registerAction('options', { run: toggle });
  // The controls list follows the device while the panel is open (a pad plugged in, a key pressed).
  onInputSourceChange(() => { if (isOpen) paintControls(); });
  // Keep touches and clicks on the panel from starting the stick, camera drag or pointer lock underneath, and let it scroll.
  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  panel.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });
  panel.querySelector('.gta-opt-close')?.addEventListener('click', () => setOpen(false));
  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
    if (e.code === KEYS.options && !e.repeat) toggle();
  });
  mark();
  return extras;
}

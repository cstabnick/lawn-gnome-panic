// The Sound section of the Options panel: a mute toggle (the touch and pad way to mute) and the World and Ambience
// volume sliders, and the Voices slider (voice/speech.ts).

import { isGameMuted, setMuted } from '../audio';
import { getWorldVolume, setWorldVolume, getAmbienceVolume, setAmbienceVolume } from './bus';
import { getVoiceVolume, setVoiceVolume } from '../voice/speech';
import { registerAction } from '../ui/actions';
import { esc, fillHint } from '../ui/glyphs';
import { onInputSourceChange } from '../ui/inputSource';

const STYLE_ID = 'gta-sound-style';

const STYLE = `
#gta-options .gta-snd-row{display:flex;flex-direction:column;justify-content:center;gap:4px;min-height:44px;box-sizing:border-box;padding:4px 0;}
#gta-options .gta-snd-top{display:flex;align-items:center;justify-content:space-between;font-size:14px;}
#gta-options .gta-snd-pct{font-variant-numeric:tabular-nums;opacity:.9;}
#gta-options .gta-snd-row input[type="range"]{display:block;width:100%;height:32px;margin:0;accent-color:#ffd23f;touch-action:pan-y;}
`;

/** The one-line note under the sliders; {mute} is the mute key, a pad glyph or the touch words. */
const NOTE = 'World: other vehicles, gunfire, animals, footsteps. Ambience: wind, birds, city hum, water. Voices: gnomes talking, in scenes, on the phone and in the street. {mute} mutes everything.';

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLE;
  document.head.appendChild(style);
}

function makeRow(
  name: string,
  ariaLabel: string,
  get: () => number,
  set: (v: number) => void,
): HTMLLabelElement {
  const row = document.createElement('label');
  row.className = 'gta-snd-row';

  const top = document.createElement('div');
  top.className = 'gta-snd-top';
  const label = document.createElement('span');
  label.textContent = name;
  const pct = document.createElement('span');
  pct.className = 'gta-snd-pct';
  top.append(label, pct);

  const input = document.createElement('input');
  input.type = 'range';
  input.min = '0';
  input.max = '100';
  input.step = '5';
  input.value = String(Math.round(get() * 100));
  input.setAttribute('aria-label', ariaLabel);
  pct.textContent = `${input.value}%`;

  input.addEventListener('input', () => {
    const value = Number(input.value);
    set(value / 100);
    pct.textContent = `${value}%`;
  });
  input.addEventListener('keydown', (e) => e.stopPropagation());

  row.append(top, input);
  return row;
}

/** Append the Sound section (heading + mute + sliders) to the Options panel element. */
export function mountSoundOptions(panel: HTMLElement): void {
  ensureStyle();

  const heading = document.createElement('div');
  heading.className = 'gta-opt-note';
  heading.style.fontWeight = '700';
  heading.textContent = 'Sound';

  // Mute: the same switch as the mute key, so a phone or a pad can silence the game too. Also the More menu's Mute.
  const muteList = document.createElement('div');
  muteList.className = 'gta-opt-list';
  const muteBtn = document.createElement('button');
  muteBtn.type = 'button';
  muteBtn.className = 'gta-opt-mode';
  muteBtn.dataset.opt = 'mute';
  const paintMute = (): void => {
    muteBtn.innerHTML = `Sound: ${isGameMuted() ? 'muted' : 'on'}<small>Everything, the radio too (${esc(fillHint('{mute}'))}).</small>`;
    muteBtn.setAttribute('aria-pressed', String(isGameMuted()));
  };
  const toggleMute = (): void => { setMuted(!isGameMuted()); paintMute(); };
  paintMute();
  muteBtn.addEventListener('click', toggleMute);
  window.addEventListener('gta:muted', paintMute);
  muteList.appendChild(muteBtn);
  registerAction('mute', { run: toggleMute });

  const worldRow = makeRow('World sounds', 'World sounds volume', getWorldVolume, setWorldVolume);
  const ambienceRow = makeRow('Ambience', 'Ambience volume', getAmbienceVolume, setAmbienceVolume);
  const voicesRow = makeRow('Voices', 'Voices volume', getVoiceVolume, setVoiceVolume);

  const note = document.createElement('div');
  note.className = 'gta-opt-note';
  const paintNote = (): void => { note.textContent = fillHint(NOTE); };
  paintNote();

  // The key caps and pad glyphs in the mute text follow the device in use.
  onInputSourceChange(() => { paintMute(); paintNote(); });

  panel.append(heading, muteList, worldRow, ambienceRow, voicesRow, note);
}

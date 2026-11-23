// The Sound section of the Options panel: a mute toggle (the touch and pad way to mute) and the World and Ambience
// volume sliders.

import { isGameMuted, setMuted } from '../audio';
import { keyLabel, KEYS } from '../keys';
import { getWorldVolume, setWorldVolume, getAmbienceVolume, setAmbienceVolume } from './bus';

const STYLE_ID = 'gta-sound-style';

const STYLE = `
#gta-options .gta-snd-row{display:flex;flex-direction:column;justify-content:center;gap:4px;min-height:44px;box-sizing:border-box;padding:4px 0;}
#gta-options .gta-snd-top{display:flex;align-items:center;justify-content:space-between;font-size:14px;}
#gta-options .gta-snd-pct{font-variant-numeric:tabular-nums;opacity:.9;}
#gta-options .gta-snd-row input[type="range"]{display:block;width:100%;height:32px;margin:0;accent-color:#ffd23f;touch-action:pan-y;}
`;

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

/** Append the Sound section (heading + two sliders) to the Options panel element. */
export function mountSoundOptions(panel: HTMLElement): void {
  ensureStyle();

  const heading = document.createElement('div');
  heading.className = 'gta-opt-note';
  heading.style.fontWeight = '700';
  heading.textContent = 'Sound';

  // Mute: the same switch as the keyboard's mute key, so a phone or a pad can silence the game too.
  const muteList = document.createElement('div');
  muteList.className = 'gta-opt-list';
  const muteBtn = document.createElement('button');
  muteBtn.type = 'button';
  muteBtn.className = 'gta-opt-mode';
  muteBtn.dataset.opt = 'mute';
  const paintMute = (): void => {
    muteBtn.innerHTML = `Sound: ${isGameMuted() ? 'muted' : 'on'}<small>Everything, the radio too. Keyboard: ${keyLabel(KEYS.mute)}.</small>`;
    muteBtn.setAttribute('aria-pressed', String(isGameMuted()));
  };
  paintMute();
  muteBtn.addEventListener('click', () => { setMuted(!isGameMuted()); paintMute(); });
  window.addEventListener('gta:muted', paintMute);
  muteList.appendChild(muteBtn);

  const worldRow = makeRow('World sounds', 'World sounds volume', getWorldVolume, setWorldVolume);
  const ambienceRow = makeRow('Ambience', 'Ambience volume', getAmbienceVolume, setAmbienceVolume);

  const note = document.createElement('div');
  note.className = 'gta-opt-note';
  note.textContent =
    `World: other vehicles, gunfire, animals, footsteps. Ambience: wind, birds, city hum, water. ${keyLabel(KEYS.mute)} mutes everything.`;

  panel.append(heading, muteList, worldRow, ambienceRow, note);
}

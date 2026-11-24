// View options, kept per browser: how much the screen shakes (off / low / normal) and whether the camera starts in first
// person. Changing either fires `gta:view-prefs`. The values are read once and kept, so per-frame code never touches storage.
// mountViewOptions adds the two rows to the Options panel (options.ts).

export type ShakeLevel = 'off' | 'low' | 'normal';
export const SHAKE_LEVELS: readonly ShakeLevel[] = ['off', 'low', 'normal'];
/** Multiplier on every camera shake per level (camera.ts multiplies it with its own SHAKE_SCALE). */
export const SHAKE_FACTOR: Record<ShakeLevel, number> = { off: 0, low: 0.5, normal: 1 };

const SHAKE_KEY = 'gta.shake';
const FIRST_KEY = 'gta.firstPerson';

function read(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* per-session only */ }
}

let shake: ShakeLevel = ((): ShakeLevel => {
  const s = read(SHAKE_KEY);
  return s === 'off' || s === 'low' || s === 'normal' ? s : 'normal';
})();
let firstPerson = read(FIRST_KEY) === 'on';

const changed = (): void => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('gta:view-prefs'));
};

export const getShakeLevel = (): ShakeLevel => shake;
export function setShakeLevel(level: ShakeLevel): void {
  shake = level;
  write(SHAKE_KEY, level);
  changed();
}

/** The saved first-person preference (the V key and the touch button flip it too, through setFirstPersonPref). */
export const getFirstPersonPref = (): boolean => firstPerson;
export function setFirstPersonPref(on: boolean): void {
  firstPerson = on;
  write(FIRST_KEY, on ? 'on' : 'off');
  changed();
}

const LABEL: Record<ShakeLevel, string> = { off: 'Off', low: 'Low', normal: 'Normal' };

/** Adds the "View" rows (screen shake, first person) to the Options panel. */
export function mountViewOptions(panel: HTMLElement): void {
  const head = document.createElement('div');
  head.className = 'gta-opt-note';
  head.style.fontWeight = '700';
  head.textContent = 'View';
  const list = document.createElement('div');
  list.className = 'gta-opt-list';

  const shakeBtn = document.createElement('button');
  shakeBtn.type = 'button';
  shakeBtn.className = 'gta-opt-mode';
  shakeBtn.dataset.opt = 'shake';
  const fpBtn = document.createElement('button');
  fpBtn.type = 'button';
  fpBtn.className = 'gta-opt-mode';
  fpBtn.dataset.opt = 'first-person';

  const paint = (): void => {
    shakeBtn.innerHTML = `Screen shake: ${LABEL[shake]}<small>How much crashes, blasts and landings shake the camera.</small>`;
    fpBtn.innerHTML = `First person: ${firstPerson ? 'on' : 'off'}<small>See through your gnome's eyes, on foot and driving. V or the eye button switches it too.</small>`;
  };
  shakeBtn.addEventListener('click', () => {
    setShakeLevel(SHAKE_LEVELS[(SHAKE_LEVELS.indexOf(shake) + 1) % SHAKE_LEVELS.length]);
  });
  fpBtn.addEventListener('click', () => setFirstPersonPref(!firstPerson));
  window.addEventListener('gta:view-prefs', paint);
  paint();
  list.append(shakeBtn, fpBtn);
  panel.append(head, list);
}

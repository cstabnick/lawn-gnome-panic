// View options, kept per browser: how much the screen shakes (off / low / normal) and whether the camera starts in first
// person. Changing either fires `gta:view-prefs`. The values are read once and kept, so per-frame code never touches storage.
// registerViewOptions adds the two rows to the Options registry (optionsRegistry.ts).
import { registerOption } from './optionsRegistry';

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

/** Registers the "View" rows (screen shake, first person) with the Options registry (options.ts renders them). */
export function registerViewOptions(): void {
  registerOption({
    section: 'view', id: 'shake', label: 'Screen shake', kind: 'cycle', order: 10, watch: 'gta:view-prefs',
    desc: 'How much crashes, blasts and landings shake the camera.',
    values: SHAKE_LEVELS.map((id) => ({ id, label: LABEL[id] })),
    get: () => shake,
    set: (id) => setShakeLevel(id as ShakeLevel),
  });
  registerOption({
    section: 'view', id: 'first-person', label: 'First person', kind: 'toggle', order: 20, watch: 'gta:view-prefs',
    desc: "See through your gnome's eyes, on foot and driving. V or the eye button switches it too.",
    get: () => firstPerson,
    set: setFirstPersonPref,
  });
}

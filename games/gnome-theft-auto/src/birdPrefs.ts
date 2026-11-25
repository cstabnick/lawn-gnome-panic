// Bird sound prefs, kept per browser: "Bird alerts" (the ♪ call arrow and its chime) and "Bird sounds" (flock calls,
// the flush whoosh and the birdsong ambience beds). Changing either fires `gta:bird-prefs`. Values are read once and
// kept, so per-frame code never touches storage. The two Options rows are registered at import time.
import { registerOption } from './optionsRegistry';

const ALERTS_KEY = 'gta.birdAlerts';
const SOUNDS_KEY = 'gta.birdSounds';

/** Ambience spot ids that are birds (ambience.ts skips these when bird sounds are off). */
export const BIRD_AMBIENCE_IDS: readonly string[] = ['bird-chirp', 'bird-song', 'crow'];

function read(key: string): string | null {
  try { return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null; } catch { return null; }
}
function write(key: string, value: string): void {
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, value); } catch { /* per-session only */ }
}

let alerts = read(ALERTS_KEY) !== 'off';
let sounds = read(SOUNDS_KEY) !== 'off';

const changed = (): void => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('gta:bird-prefs'));
};

export const getBirdAlerts = (): boolean => alerts;
export function setBirdAlerts(on: boolean): void {
  alerts = on;
  write(ALERTS_KEY, on ? 'on' : 'off');
  changed();
}

export const getBirdSounds = (): boolean => sounds;
export function setBirdSounds(on: boolean): void {
  sounds = on;
  write(SOUNDS_KEY, on ? 'on' : 'off');
  changed();
}

/** Whether an alert chime may play: alerts on AND sounds on. */
export function birdAlertSoundOn(): boolean {
  return alerts && sounds;
}

registerOption({
  section: 'audio', id: 'bird-alerts', label: 'Bird alerts', order: 50, kind: 'toggle', watch: 'gta:bird-prefs',
  desc: 'The ♪ arrow when a bird calls nearby, and its chime.',
  get: getBirdAlerts,
  set: setBirdAlerts,
});
registerOption({
  section: 'audio', id: 'bird-sounds', label: 'Bird sounds', order: 60, kind: 'toggle', watch: 'gta:bird-prefs',
  desc: 'Bird calls, flushing flocks and birdsong in the air. Off also silences the alerts.',
  get: getBirdSounds,
  set: setBirdSounds,
});

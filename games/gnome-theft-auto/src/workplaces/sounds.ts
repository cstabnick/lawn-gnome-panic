// E24 workplace sounds (STUB: recipes added by their E24 issue): synthesized one-shots on the world sound bus
// (sound/bus.ts registerSound). Runtimes call registerWorkSounds() once, then play2d(id) / playAt(id, pos) from '../sound/bus'.
export const WORK_SOUND_IDS = [
  // chef
  'chef-chop', 'chef-sizzle', 'chef-stir', 'chef-pour', 'chef-bell', 'chef-ticket',
  // mechanic
  'mech-air-wrench', 'mech-spray', 'mech-keys',
  // comedy
  'crowd-groan', 'crowd-boo', 'crowd-cough', 'crowd-sigh', 'pity-clap', 'comedy-rimshot', 'tomato-splat', 'tomato-whoosh',
] as const;
export type WorkSoundId = (typeof WORK_SOUND_IDS)[number];

let registered = false;

/** Register every WORK_SOUND_IDS recipe (idempotent). */
export function registerWorkSounds(): void {
  if (registered) return;
  registered = true;
}

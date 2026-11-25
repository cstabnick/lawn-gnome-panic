// E25 workplace sounds (bin round, fire brigade, Gnomazon): synthesized one-shots on the world sound bus
// (sound/bus.ts registerSound). No audio files. Runtimes call registerJobs3Sounds() once, then play2d(id) / playAt(id, pos).
// STUB: issue 19 adds a recipe per id.

export const JOBS3_SOUND_IDS = [
  // garbage
  'bin-arm-hydraulic', 'bin-clank', 'bin-tip', 'bin-spill', 'bin-set-down', 'lorry-reverse-beep',
  // firefighter
  'fire-bell', 'fire-crackle', 'hose-spray', 'hose-splash', 'steam-hiss', 'ladder-clunk', 'rescue-cheer', 'cat-meow',
  // gnomazon
  'tape-screech', 'scanner-beep', 'box-thud', 'conveyor-clunk', 'kippy-chime', 'kippy-error', 'quota-fanfare',
] as const;
export type Jobs3SoundId = (typeof JOBS3_SOUND_IDS)[number];

/** Register every JOBS3_SOUND_IDS recipe once (idempotent). */
export function registerJobs3Sounds(): void {}

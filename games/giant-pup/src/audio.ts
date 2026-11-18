// STUB: synthesized sound effects (WebAudio, no files). Filled in by its own issue; keep these signatures.
export type Sfx =
  | 'bark' | 'woof' | 'whine' | 'pant' | 'squeak' | 'slurp' | 'crunch'
  | 'splash' | 'scrub' | 'pop' | 'throw' | 'happy' | 'snore' | 'click' | 'fail';

/** Call from a user gesture (pointerdown); safe to call many times. */
export function unlockAudio(): void {}
export function play(sfx: Sfx): void { void sfx; }
export function setMuted(muted: boolean): void { void muted; }
export function isMuted(): boolean { return false; }

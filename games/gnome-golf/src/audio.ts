// STUB: replaced by its epic 2 issue. Keep the exported signatures.
import type { Ctx, SfxName, System } from './config';

/** Create/resume the AudioContext. Call from a user gesture (the title button, the first swing tap). */
export function startAudio(): void {}

/** Play a one-shot sound. volume 0..1 (default 1). Safe to call before startAudio (does nothing). */
export function sfx(_name: SfxName, _volume = 1): void {}

/** The audio system: flight event sounds, mower engine during 'drive', ambient sea and birds. */
export function createAudioSystem(_ctx: Ctx): System {
  return { update() {} };
}

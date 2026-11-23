// Shot sounds for the Ammu-Gnation mods (suppressed, heavy, kazoo, squeaky duck), synthesized with Web Audio on the game's
// audio output (audio.ts getAudioOutput). Self-contained: audio.ts is not edited. STUB: the gun-sounds issue fills it in.
import { play } from './audio';
import type { GunSoundId } from './gunMods';
import type { GunKind } from './types';

/** Play one shot of `gun` with the sound its mods give. Silent until the audio is unlocked. */
export function playGunShot(gun: GunKind, sound: GunSoundId): void {
  void sound;
  play(gun === 'shotgun' ? 'shotgun' : 'gunshot');
}

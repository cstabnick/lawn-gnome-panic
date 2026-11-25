// Reactive Tone.js music controller for Gnomelock using @lawn/music + @arcade/volume.
import {
  buildGnomeFrontTrack,
  buildTwilightNocturne,
  playSong,
  setMuted,
  setMusicVolume,
  stopSong,
  type GnomeFrontHooks,
} from '@lawn/music';
import { volumeStore } from './audio';
import type { Team } from './sim/config';

export interface BattleMusicContext {
  lead: () => Team | null;
  intensity: () => number;
  combine: () => boolean;
}

let activeHooks: Partial<GnomeFrontHooks> = {};
let volumeBound = false;

function syncVolume(): void {
  const g = volumeStore.effective('music');
  setMuted(g <= 0.001);
  setMusicVolume(Math.max(0.01, g));
}

function ensureVolumeSync(): void {
  if (volumeBound) return;
  volumeBound = true;
  syncVolume();
  volumeStore.subscribe(() => syncVolume());
}

export function startLobbyMusic(seed = 1042): void {
  ensureVolumeSync();
  activeHooks = {};
  playSong((T, keep, out) => buildTwilightNocturne(T, keep, out, seed));
}

export function startBattleMusic(ctx: BattleMusicContext, seed = 2048): void {
  ensureVolumeSync();
  const hooks: Partial<GnomeFrontHooks> = {};
  activeHooks = hooks;
  playSong((T, keep, out) =>
    buildGnomeFrontTrack(T, keep, out, seed, {
      lead: ctx.lead,
      intensity: ctx.intensity,
      combine: ctx.combine,
      hooks,
    }),
  );
}

export function playMusicStinger(mine: boolean): void {
  activeHooks.flag?.(mine);
}

export function stopGameMusic(): void {
  activeHooks = {};
  stopSong();
}

// The music controller: plays the game's three @lawn/music themes and passes intensity and pickups to them.
import {
  buildFcHoldMusic, buildFcShellshore, buildFcSynergyLoop, playSong, setMusicBoost, setMuteKey,
  setMuted as setMusicMuted, setSongMuffled, stopSong, type FcMusicHooks,
} from '@lawn/music';
import { MUSIC_MUTE_KEY } from './config';

/** dB added to the shared music level for this game (+3 dB: a bit louder). */
const MUSIC_BOOST_DB = 3;
import type { MusicController, TrackId } from './types';

const BUILDERS = {
  'hold-music': buildFcHoldMusic,
  'synergy-loop': buildFcSynergyLoop,
  shellshore: buildFcShellshore,
} satisfies Record<TrackId, unknown>;

/** Fixed so the music is the same every run. */
const SEED = 20261122;

export function createMusic(): MusicController {
  try { setMuteKey(MUSIC_MUTE_KEY); } catch { /* ignore */ }
  // Louder than the shared level: this game's songs sat under the sound effects.
  try { setMusicBoost(MUSIC_BOOST_DB); } catch { /* ignore */ }
  let current: TrackId | null = null;
  let level = 0;
  let hooks: FcMusicHooks | null = null;

  return {
    play(track) {
      if (track === current) return;
      current = track;
      hooks = null;
      try {
        playSong((T, keep, out) => {
          hooks = BUILDERS[track](T, keep, out, SEED, { intensity: () => level });
        });
      } catch { /* audio never throws into the game */ }
    },
    intensity(x) {
      level = Math.min(1, Math.max(0, Number.isFinite(x) ? x : 0));
    },
    pickup() {
      try { hooks?.pickup(); } catch { /* ignore */ }
    },
    muffle(on) {
      try { setSongMuffled(on); } catch { /* ignore */ }
    },
    stop() {
      try { stopSong(); } catch { /* ignore */ }
      current = null;
      hooks = null;
    },
    setMuted(m) {
      try { setMusicMuted(m); } catch { /* ignore */ }
    },
    current: () => current,
  };
}

// Gnome Billiards music: an upbeat casino jazz track from @lawn/music (the Gnomecino's pool table). It starts on the
// first tap or key, since browsers only let sound start after one, and follows the game's sound toggle and #mute.
import { buildGnomecinoPool, playSong, setMusicVolume, setMuteKey, setMuted, stopSong } from '@lawn/music';

const MUTE_KEY = 'gnome-billiards-music-muted';

export interface PoolMusic {
  /** Music on or off, following the sound button (and M). */
  setOn(on: boolean): void;
}

function urlMuted(): boolean {
  try {
    return location.hash.toLowerCase().includes('mute');
  } catch {
    return false;
  }
}

export function initPoolMusic(): PoolMusic {
  setMuteKey(MUTE_KEY);
  setMusicVolume(0.8);
  let on = !urlMuted();
  let unlocked = false;
  let playing = false;

  const seed = Math.floor(Math.random() * 0x7fffffff) >>> 0;

  const sync = (): void => {
    if (!on) {
      if (playing) stopSong();
      playing = false;
      setMuted(true);
      return;
    }
    setMuted(false);
    if (unlocked && !playing) {
      playing = true;
      playSong((T, keep, out) => buildGnomecinoPool(T, keep, out, seed));
    }
  };

  const unlock = (): void => {
    if (unlocked) return;
    unlocked = true;
    sync();
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });

  return {
    setOn(v) {
      on = v;
      sync();
    },
  };
}

// Gnome Blackjack lounge music controller: jazzy piano & upright bass from @lawn/music,
// synced with the shared @arcade/volume store.
import { buildBlackjackJazz, playSong, setMusicVolume, setMuteKey, setMuted } from '@lawn/music';
import { volume } from './volume';

const MUTE_KEY = 'gnome-blackjack-music-muted';

function urlMuted(): boolean {
  try {
    return location.hash.toLowerCase().includes('mute');
  } catch {
    return false;
  }
}

export interface MusicController {
  start(): void;
  /** Syncs the lounge music seed for the current table/lobby; restarts the track if already playing a different seed. */
  setSeed(nextSeed: number): void;
}

export function initMusic(initialSeed = Math.floor(Math.random() * 0x7fffffff)): MusicController {
  setMuteKey(MUTE_KEY);
  let seed = initialSeed >>> 0;
  let activeSeed: number | null = null;

  const syncMusic = (): void => {
    const gain = urlMuted() ? 0 : volume.effective('music');
    setMusicVolume(gain);
    setMuted(gain <= 0.0001);
  };
  syncMusic();
  volume.subscribe(syncMusic);

  let started = false;
  const playCurrent = (): void => {
    if (urlMuted()) return;
    activeSeed = seed;
    const s = seed;
    playSong((T, keep, out) => buildBlackjackJazz(T, keep, out, s));
  };

  const start = (): void => {
    if (started || urlMuted()) return;
    started = true;
    playCurrent();
  };

  const setSeed = (nextSeed: number): void => {
    const normalized = nextSeed >>> 0;
    if (normalized === seed && (!started || activeSeed === normalized)) return;
    seed = normalized;
    if (started && activeSeed !== seed) playCurrent();
  };

  window.addEventListener('pointerdown', start, { once: true });
  window.addEventListener('keydown', (e) => {
    start();
    if (e.repeat) return;
    if (e.target instanceof HTMLElement && e.target.closest('input, textarea')) return;
    if (e.key === 'n' || e.key === 'N') volume.toggleMute('music');
    else if (e.key === 'm' || e.key === 'M') volume.toggleMute('master');
  });

  return { start, setSeed };
}

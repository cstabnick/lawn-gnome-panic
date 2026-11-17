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

export function initMusic(): () => void {
  setMuteKey(MUTE_KEY);
  const seed = Math.floor(Math.random() * 0x7fffffff);

  const syncMusic = (): void => {
    const gain = urlMuted() ? 0 : volume.effective('music');
    setMusicVolume(gain);
    setMuted(gain <= 0.0001);
  };
  syncMusic();
  volume.subscribe(syncMusic);

  let started = false;
  const start = (): void => {
    if (started || urlMuted()) return;
    started = true;
    playSong((T, keep, out) => buildBlackjackJazz(T, keep, out, seed));
  };

  window.addEventListener('pointerdown', start, { once: true });
  window.addEventListener('keydown', (e) => {
    start();
    if (e.repeat) return;
    if (e.target instanceof HTMLElement && e.target.closest('input, textarea')) return;
    if (e.key === 'n' || e.key === 'N') volume.toggleMute('music');
    else if (e.key === 'm' || e.key === 'M') volume.toggleMute('master');
  });

  return start;
}

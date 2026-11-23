// Club Gnome area music: each place plays its own generated track from @lawn/music (see
// packages/music/src/themes/clubGnome.ts). Walking into another place switches the song; coming back to a place
// you have been in plays its other track, so a visit does not always sound the same. While a game is open over the
// town the town music stops (the game has its own), and it starts again when you come back.
import { createVolumeButton, createVolumeStore } from '@arcade/volume';
import { clubGnomeSong, clubGnomeTracks, playSong, setMusicVolume, setMuteKey, setMuted, stopSong } from '@lawn/music';
import type { MapId } from './config';

const AREA_OF: Record<MapId, 'town' | 'gnomecino' | 'arcade' | 'park'> = {
  town: 'town',
  gnomecino: 'gnomecino',
  arcade: 'arcade',
  park: 'park',
  // Acorn Row and its shops have no songs of their own yet: they play the square's.
  row: 'town',
  market: 'town',
  salon: 'town',
};

export const volume = createVolumeStore({ storageKey: 'club-gnome-volume' });

export interface Music {
  /** The player is in this map now (or back in it): play a track for it. */
  setMap(id: MapId): void;
  /** A game opened over the town: stop the music. */
  pause(): void;
  /** The game closed: start the current map's track again. */
  resume(): void;
  /** Puts the volume button into `host` (the HUD's top-right group). */
  mountButton(host: HTMLElement): void;
}

function urlMuted(): boolean {
  try {
    return location.hash.toLowerCase().includes('mute');
  } catch {
    return false;
  }
}

export function createMusic(): Music {
  setMuteKey('club-gnome-music-muted');
  const sync = (): void => {
    const gain = urlMuted() ? 0 : volume.effective('music');
    setMusicVolume(gain);
    setMuted(gain <= 0.0001);
  };
  sync();
  volume.subscribe(sync);

  const seed = Math.floor(Math.random() * 0x7fffffff);
  /** How many times each area has started a track, so the next visit plays the next one. */
  const visits = new Map<string, number>();
  let current: MapId | null = null;
  let paused = false;
  /** Browsers only let sound start after a tap or key; until then we wait. */
  let unlocked = false;
  let playingMap: MapId | null = null;

  const play = (id: MapId): void => {
    if (!unlocked || paused || urlMuted()) return;
    if (playingMap === id) return;
    playingMap = id;
    const area = AREA_OF[id];
    const tracks = clubGnomeTracks(area);
    const n = visits.get(area) ?? 0;
    visits.set(area, n + 1);
    // The first track of an area is picked from the seed; later visits step through the rest.
    const track = tracks[(seed + n) % tracks.length];
    playSong(clubGnomeSong((seed ^ (n * 0x9e3779b1)) >>> 0, track.id));
  };

  const unlock = (): void => {
    if (unlocked) return;
    unlocked = true;
    if (current) play(current);
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', (e) => {
    unlock();
    if (e.repeat) return;
    if (e.target instanceof HTMLElement && e.target.closest('input, textarea')) return;
    if (e.key === 'n' || e.key === 'N') volume.toggleMute('music');
    else if (e.key === 'm' || e.key === 'M') volume.toggleMute('master');
  });

  return {
    setMap(id) {
      current = id;
      play(id);
    },
    pause() {
      paused = true;
      playingMap = null;
      stopSong();
    },
    resume() {
      paused = false;
      if (current) play(current);
    },
    mountButton(host) {
      createVolumeButton(host, volume, { title: 'Volume (M mute all, N mute music)' });
    },
  };
}

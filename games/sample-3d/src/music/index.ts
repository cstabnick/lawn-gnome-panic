/**
 * Game music: a generated jungle or desert track per run, and a composed menu theme, from @lawn/music
 * (packages/music, where the generators and their design notes live).
 */
import {
  buildDesertSands,
  buildMenuTheme,
  buildRunTrack,
  playSong,
  setMusicVolume,
  setMuteKey,
  setMuted,
  setSongMuffled,
  stopSong,
  trackInfo,
  type TrackInfo,
} from '@lawn/music';
import type { WorldTheme } from '../config';
import { volume } from '../volume';

export type { TrackInfo };

setMuteKey('lgp-music-muted');

function syncMusicVolume(): void {
  const eff = volume.effective('music');
  setMusicVolume(eff);
  setMuted(eff <= 0);
}

syncMusicVolume();
volume.subscribe(syncMusicVolume);

/**
 * Starts a brand new run track and returns its made-up name. Call once per run.
 * Pass a shared seed (online matches) so every player gets the same track and name (not beat-synced).
 */
export function startMusic(
  seed: number = Math.floor(Math.random() * 2 ** 31),
  theme: WorldTheme = 'lawn',
): TrackInfo {
  setSongMuffled(false);
  if (theme === 'desert') {
    playSong((T, keep, out) => buildDesertSands(T, keep, out, seed));
    return trackInfo(seed, 'desert');
  }
  playSong((T, keep, out) => buildRunTrack(T, keep, out, seed));
  return trackInfo(seed);
}

/** Starts the lobby theme (from the top). */
export function startMenuMusic(): void {
  setSongMuffled(false);
  playSong(buildMenuTheme);
}

/** Pause keeps the song playing, but far away: lowpassed and reverbed. */
export const muffleMusic = setSongMuffled;
export const stopMusic = stopSong;
export const isMusicMuted = (): boolean => volume.effective('music') <= 0;
export const setMusicMuted = (m: boolean): void => volume.setMuted('music', m);

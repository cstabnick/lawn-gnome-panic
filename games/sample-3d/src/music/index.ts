/**
 * Game music: a generated jungle track per run, and a composed menu theme, from @lawn/music
 * (packages/music, where the generators and their design notes live).
 */
import { buildMenuTheme, buildRunTrack, isMuted, pauseSong, playSong, resumeSong, setMuteKey, setMuted, stopSong, trackInfo, type TrackInfo } from '@lawn/music';

export type { TrackInfo };

setMuteKey('lgp-music-muted');

/**
 * Starts a brand new run track and returns its made-up name. Call once per run.
 * Pass a shared seed (online matches) so every player gets the same track and name (not beat-synced).
 */
export function startMusic(seed: number = Math.floor(Math.random() * 2 ** 31)): TrackInfo {
  playSong((T, keep, out) => buildRunTrack(T, keep, out, seed));
  return trackInfo(seed);
}

/** Starts the lobby theme (from the top). */
export function startMenuMusic(): void {
  playSong(buildMenuTheme);
}

export const pauseMusic = pauseSong;
export const resumeMusic = resumeSong;
export const stopMusic = stopSong;
export const isMusicMuted = isMuted;
export const setMusicMuted = setMuted;

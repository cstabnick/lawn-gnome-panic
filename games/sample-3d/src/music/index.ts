/**
 * Game music: multiple generated & riffed themes per run, plus acoustic & jungle lobby themes,
 * from @lawn/music (packages/music, where the generators and their design notes live).
 */
import {
  buildAcousticJungle,
  buildAcousticMenuTheme,
  buildGnomeFanfare,
  buildMeadowWaltz,
  buildMenuTheme,
  buildRunTrack,
  buildTwilightNocturne,
  pauseSong,
  pickThemeId,
  playSong,
  resumeSong,
  setMusicVolume,
  setMuteKey,
  setMuted,
  stopSong,
  trackInfo,
  type SongBuilder,
  type ThemeId,
  type TrackInfo,
} from '@lawn/music';
import { volume } from '../volume';

export type { ThemeId, TrackInfo };

const THEME_BUILDERS: Record<ThemeId, (T: Parameters<SongBuilder>[0], keep: Parameters<SongBuilder>[1], out: Parameters<SongBuilder>[2], seed: number) => void> = {
  meadow: buildMeadowWaltz,
  twilight: buildTwilightNocturne,
  fanfare: buildGnomeFanfare,
  acousticJungle: buildAcousticJungle,
  classicJungle: buildRunTrack,
};

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
 * Pass a shared seed (online matches) so every player gets the same theme, track, and name.
 */
export function startMusic(seed: number = Math.floor(Math.random() * 2 ** 31)): TrackInfo {
  const theme = pickThemeId(seed);
  const builder = THEME_BUILDERS[theme];
  playSong((T, keep, out) => builder(T, keep, out, seed));
  return trackInfo(seed);
}

let menuVisit = 0;

/** Starts the lobby theme (alternates between the spacious acoustic Horn/Harp/Piano arrangement and the classic theme). */
export function startMenuMusic(): void {
  const useAcoustic = menuVisit++ % 2 === 0;
  playSong(useAcoustic ? buildAcousticMenuTheme : buildMenuTheme);
}

export const pauseMusic = pauseSong;
export const resumeMusic = resumeSong;
export const stopMusic = stopSong;
export const isMusicMuted = (): boolean => volume.effective('music') <= 0;
export const setMusicMuted = (m: boolean): void => volume.setMuted('music', m);

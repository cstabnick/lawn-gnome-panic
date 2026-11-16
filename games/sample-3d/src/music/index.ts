/**
 * Game music: multiple generated & riffed themes per run, plus acoustic & jungle lobby themes.
 *
 * Files:
 * - engine.ts: Tone.js loading, the single Transport, teardown between songs, mute, gesture unlock.
 * - mix.ts: shared hall reverb, warm echo and dub-throw returns.
 * - instruments.ts: natural synthesized French horn, concert harp, felt piano, upright bass, soft kit.
 * - drums.ts: break grids (Amen, Think, Funky Drummer, Apache), the chopper, and the synthesized kit.
 * - theory.ts: RNG, note names, modes, chord stacking, voice leading, motif riffing helpers.
 * - themes/: Meadow Waltz, Twilight Nocturne, Gnome Fanfare, and Liquid Garden (Acoustic Jungle).
 * - runTrack.ts: the classic 90s jungle generator.
 * - menuTheme.ts: the composed lobby theme + its acoustic Horn/Harp/Piano arrangement.
 * - names.ts: theme selection and made-up artist/title for the "Now playing" card.
 *
 * Tone.js (MIT; a library, not an asset) is dynamically imported, so it sits in its own chunk.
 * No samples anywhere: everything is synthesized.
 */
import { isMuted, pauseSong, playSong, resumeSong, setMuted, stopSong, type SongBuilder } from './engine';
import { buildAcousticMenuTheme, buildMenuTheme } from './menuTheme';
import { pickThemeId, trackInfo, type ThemeId, type TrackInfo } from './names';
import { buildRunTrack } from './runTrack';
import { buildAcousticJungle } from './themes/acousticJungle';
import { buildGnomeFanfare } from './themes/gnomeFanfare';
import { buildMeadowWaltz } from './themes/meadowWaltz';
import { buildTwilightNocturne } from './themes/twilightNocturne';

export type { ThemeId, TrackInfo };

const THEME_BUILDERS: Record<ThemeId, (T: Parameters<SongBuilder>[0], keep: Parameters<SongBuilder>[1], out: Parameters<SongBuilder>[2], seed: number) => void> = {
  meadow: buildMeadowWaltz,
  twilight: buildTwilightNocturne,
  fanfare: buildGnomeFanfare,
  acousticJungle: buildAcousticJungle,
  classicJungle: buildRunTrack,
};

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
export const isMusicMuted = isMuted;
export const setMusicMuted = setMuted;

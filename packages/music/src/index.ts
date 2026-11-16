/**
 * @lawn/music: synthesized game music on Tone.js, shared by the games. No samples anywhere.
 *
 * Files:
 * - engine.ts: Tone.js loading (lazy, its own chunk), the single Transport, teardown between songs,
 *   mute, gesture unlock, 48 kHz context.
 * - mix.ts: shared reverb, echo and dub-throw returns.
 * - theory.ts: RNG, note names, modes, chord stacking, voice leading.
 * - sectorThemes.ts + sectorTrack.ts: chiptune sector themes with synced explore/battle arrangements,
 *   arranged procedurally from pattern banks (sectorTrack.ts's header records the design decisions).
 * - drums.ts + runTrack.ts + menuTheme.ts: generated old-school jungle run tracks and a composed menu theme.
 * - names.ts: made-up artist/title for a jungle track's "Now playing" card.
 *
 * Each game keeps a small controller (its own src/music/index.ts) that decides what plays when.
 */
export { isMuted, pauseSong, playSong, resumeSong, setMuteKey, setMuted, stopSong, type Keep, type SongBuilder, type Tone } from './engine';
export { buildSectorTrack, themeForSeed, type SectorOptions } from './sectorTrack';
export { SECTOR_THEMES, type SectorTheme } from './sectorThemes';
export { buildRunTrack } from './runTrack';
export { buildMenuTheme } from './menuTheme';
export { trackInfo, type TrackInfo } from './names';
export { buildGolfAmbient } from './golfAmbient';

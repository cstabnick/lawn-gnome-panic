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
export { isMuted, pauseSong, playSong, resumeSong, setMusicVolume, setMuteKey, setMuted, setSongMuffled, stopSong, type Keep, type SongBuilder, type Tone } from './engine';
export { buildSectorTrack, themeForSeed, type SectorOptions } from './sectorTrack';
export { SECTOR_THEMES, type SectorTheme } from './sectorThemes';
export { buildRunTrack } from './runTrack';
export { buildAcousticMenuTheme, buildMenuTheme } from './menuTheme';
export { buildMeadowWaltz } from './themes/meadowWaltz';
export { buildGardenLullaby } from './themes/gardenLullaby';
export { buildTwilightNocturne } from './themes/twilightNocturne';
export { buildGnomeFanfare } from './themes/gnomeFanfare';
export { buildAcousticJungle } from './themes/acousticJungle';
export { buildDesertSands } from './themes/desertSands';
export { buildGnomomiaTheme, type GnomomiaThemeId } from './themes/gnomomia';
export { pickThemeId, trackInfo, type ThemeId, type TrackInfo } from './names';
export { buildGolfAmbient } from './golfAmbient';
export { buildBowlingAmbient } from './bowlingAmbient';
export { buildBlackjackJazz } from './blackjackJazz';
export { buildTranceTrack } from './trance';
export { buildTrickyTrack, type TrickyHooks, type TrickyOptions } from './themes/trickyBigBeat';
export {
  createAmbientFx,
  createAutoPanner,
  createFx,
  createPanner,
  createStereoBus,
  createStereoWidener,
  type AmbientFx,
  type AmbientFxOpts,
  type AutoPanOpts,
  type Fx,
  type FxOpts,
  type StereoBusOpts,
} from './mix';
export {
  createFoleyRack,
  scheduleFoleyBed,
  type FoleyBedOpts,
  type FoleyEffect,
  type FoleyKind,
  type FoleyRack,
} from './foley';
export { createAmbientPad, createBongoKit, createRhodes, createSitar, createVibraphone } from './instruments';

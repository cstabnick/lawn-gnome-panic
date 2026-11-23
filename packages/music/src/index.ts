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
export {
  addLayer,
  fadeMusic,
  getAudioContext,
  isMuted,
  musicLevelDb,
  pauseSong,
  playSong,
  restoreMusic,
  resumeSong,
  scheduleStinger,
  setLayer,
  setMusicBoost,
  setMusicDuck,
  setMusicVolume,
  setMuteKey,
  setMuted,
  setSongMuffled,
  setSongSpatial,
  stopSong,
  type Keep,
  type PlayOptions,
  type SongBuilder,
  type SongSpatial,
  type Tone,
} from './engine';
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
export {
  CLUB_GNOME_TRACKS,
  buildClubGnomeTrack,
  clubGnomeSong,
  clubGnomeTracks,
  type ClubGnomeArea,
  type ClubGnomeTrackId,
  type ClubGnomeTrackInfo,
} from './themes/clubGnome';
export { buildGnomomiaTheme, type GnomomiaThemeId } from './themes/gnomomia';
export { buildGnomeFrontMenu, buildGnomeFrontTrack, type GnomeFrontHooks, type GnomeFrontOptions } from './themes/gnomeFront';
export { buildGnomeFrontBattle } from './themes/gnomeFrontBattle';
export { buildDaygScore, buildDaygTitle, DAYG_LAYERS, type DaygHooks, type DaygLayer, type DaygStinger } from './themes/dayg';
export { pickThemeId, trackInfo, type ThemeId, type TrackInfo } from './names';
export { buildGolfAmbient } from './golfAmbient';
export { buildBowlingAmbient } from './bowlingAmbient';
export { buildBlackjackJazz } from './blackjackJazz';
export { buildTranceTrack } from './trance';
export { buildTrickyTrack, type TrickyHooks, type TrickyOptions } from './themes/trickyBigBeat';
export {
  UNDERGROUND_JOURNEY,
  XFADE_BARS,
  SET_BARS,
  bpmForSeed,
  buildUndergroundSet,
  cutStartBar,
  planAt,
  type Cut,
  type SetMode,
  type UndergroundOptions,
} from './themes/undergroundSet';
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
export { buildGnomecinoPool } from './poolJazz';
export {
  GSR_TRACKS,
  buildGnomeSetRadioTrack,
  type GsrMusicOptions,
  type GsrSectionKind,
  type GsrTrackFlavor,
  type GsrTrackId,
  type GsrTrackMeta,
} from './themes/gnomeSetRadio';
export {
  createDubThrowHandler,
  createEffectRack,
  createFilterSweepHandler,
  createPolyrhythmFilterHandler,
  type DubThrowHandlerOpts,
  type EffectTriggerFormat,
  type FilterSweepHandlerOpts,
  type MusicEffectContext,
  type MusicEffectHandler,
  type MusicEffectRack,
  type PolyrhythmFilterHandlerOpts,
} from './effectHandlers';
export { type FcMusicHooks, type FcMusicOptions } from './themes/fcShared';
export { buildFcHoldMusic } from './themes/fcHoldMusic';
export { buildFcSynergyLoop } from './themes/fcSynergyLoop';
export { buildFcShellshore } from './themes/fcShellshore';

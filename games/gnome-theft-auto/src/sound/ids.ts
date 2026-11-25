// World sound ids and the recipe contract. Every positional or world one-shot has an id here; a recipe in
// src/sound/recipes/*.ts synthesizes it. Other modules call playAt(id, pos) from './sound'.
import type { SurfaceKind } from '../surfaces';

/** Other vehicles (recipes/vehicles.ts). */
export const VEHICLE_SOUNDS = [
  'crash-light', 'crash-heavy', 'tyre-squeal', 'horn-car', 'horn-truck', 'horn-bike', 'horn-boat', 'horn-hoa',
  'siren-whoop', 'backfire', 'engine-start', 'door-slam', 'brake-hiss',
] as const;
/** Gunfire and blasts from NPCs, police and the world (recipes/combat.ts). */
export const COMBAT_SOUNDS = ['gun-pistol', 'gun-shotgun', 'gun-hoa', 'explosion', 'ricochet', 'bullet-whiz'] as const;
/** Animals and wild things (recipes/critters.ts). */
export const CRITTER_SOUNDS = [
  'moo', 'baa', 'oink', 'cluck', 'squirrel', 'bear', 'bee-buzz', 'bird-chirp', 'bird-song', 'crow', 'owl', 'gull',
  'frog', 'cricket', 'cicada', 'critter-thud',
] as const;
/** Footsteps on every SurfaceKind, one id per kind: `step-${SurfaceKind}` (recipes/world.ts). */
export const STEP_SOUNDS = [
  'step-asphalt', 'step-ice', 'step-snow', 'step-sand', 'step-mud', 'step-grass', 'step-farm', 'step-rock', 'step-dirt',
  'step-gravel', 'step-water',
] as const satisfies readonly `step-${SurfaceKind}`[];
/** Splashes, shops, doors, crowds, events and other world things (recipes/world.ts). */
export const WORLD_SOUNDS = [
  'splash-small', 'splash-big', 'shop-bell', 'door-creak', 'cash', 'event-start', 'event-end', 'crowd-cheer',
  'crowd-murmur', 'smash-wood', 'smash-glass', 'metal-clang', 'wind-gust', 'water-lap', 'bell-toll',
] as const;

/**
 * Region and weather spot sounds for the batch-3 places (recipes/regions.ts; docs/design/gnome-theft-auto/sound-design.md):
 * surf and a buoy bell on Saltbucket Shore, snow creak and icicles on Snowcap Rise, café clinks and the chapel chime in
 * Pardonlin, tall-grass hiss in the Unmown, the Rootwell University bell, Trellisdown's garden sprinklers, far thunder in rain,
 * Pinwheel Ridge's turning pinwheels, the Anthill's ants, the observatory telescope.
 */
export const REGION_SOUNDS = [
  'surf-wash', 'buoy-bell', 'snow-creak', 'icicle-tink', 'cafe-clink', 'chapel-chime', 'grass-hiss', 'thunder-far',
  'campus-bell', 'sprinkler-tick', 'turbine-whoosh', 'ant-skitter', 'telescope-whirr',
] as const;

export type VehicleSoundId = (typeof VEHICLE_SOUNDS)[number];
export type CombatSoundId = (typeof COMBAT_SOUNDS)[number];
export type CritterSoundId = (typeof CRITTER_SOUNDS)[number];
export type StepSoundId = (typeof STEP_SOUNDS)[number];
export type WorldOnlySoundId = (typeof WORLD_SOUNDS)[number];
export type RegionSoundId = (typeof REGION_SOUNDS)[number];
/** Built-in ids. registerSound() may add more at runtime (string ids), e.g. gun-mod variants. */
export type WorldSoundId = VehicleSoundId | CombatSoundId | CritterSoundId | StepSoundId | WorldOnlySoundId | RegionSoundId;

export const ALL_SOUNDS: readonly WorldSoundId[] = [
  ...VEHICLE_SOUNDS, ...COMBAT_SOUNDS, ...CRITTER_SOUNDS, ...STEP_SOUNDS, ...WORLD_SOUNDS, ...REGION_SOUNDS,
];

/** What a recipe knows about this play. */
export interface SoundInfo {
  /** Metres from the listener (0 for non-positional plays). Recipes may add a long echo tail when far (gunfire). */
  dist: number;
  /** 0..1, fresh per play: use it for small pitch/timing variation so repeats don't sound identical. */
  rand: number;
  /** 0..1 free parameter from the caller (intensity, size, alarm). Default 0.5. */
  param: number;
}

/**
 * Synthesize one sound into `out` starting at AudioContext time `t`. Peak gain at most about 0.5 (the bus scales it).
 * Every source node created must be stopped by t + the returned seconds. Returns the duration in seconds (until silent).
 */
export type Recipe = (c: AudioContext, out: AudioNode, t: number, info: SoundInfo) => number;
export type RecipeTable<K extends string = WorldSoundId> = Partial<Record<K, Recipe>>;

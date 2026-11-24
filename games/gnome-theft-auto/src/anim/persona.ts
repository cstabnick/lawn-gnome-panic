// Character (round 3): every townsgnome gets an archetype that sets how it walks and what it does when it stops, mixed
// with where it is (sweating in the Dust Flats, shivering in the Fells, bird-feeding in the park) and the time of day
// (sleepy at night). Pure pickers: callers pass the random source so tests are deterministic.
import type { BiomeId } from '../types';
import type { AnimId as LibId } from './types';

export type Persona = 'plain' | 'swagger' | 'shuffle' | 'tiptoe' | 'sulk' | 'jaunty' | 'nervous' | 'proud' | 'sleepy' | 'pompous';
export const PERSONAS: readonly Persona[] = ['plain', 'swagger', 'shuffle', 'tiptoe', 'sulk', 'jaunty', 'nervous', 'proud', 'sleepy', 'pompous'];

/** Where and when, for the pickers. app.ts keeps one up to date (setAnimWorld); callers may also pass their own. */
export interface AnimWorld {
  /** 0 day .. 1 deep night (atmosphere.nightFactor()). */
  night: number;
}
const world: AnimWorld = { night: 0 };
export function setAnimWorld(w: Partial<AnimWorld>): void { Object.assign(world, w); }
export function animWorld(): Readonly<AnimWorld> { return world; }

type Rand = () => number;
const pick = <T>(a: readonly T[], r: Rand): T => a[Math.floor(r() * a.length) % a.length];

/** An archetype for a townsgnome. `trait` (npcs.ts): grumpy gnomes sulk or strut pompously, spectators are jaunty or proud. */
export function personaFor(trait: string | undefined, r: Rand = Math.random): Persona {
  if (trait === 'grumpy') return pick(['sulk', 'pompous', 'shuffle'] as const, r);
  if (trait === 'spectator') return pick(['jaunty', 'proud', 'swagger', 'nervous'] as const, r);
  return pick(PERSONAS, r);
}

const WALK: Readonly<Record<Persona, LibId | null>> = {
  plain: null, swagger: 'walk-swagger', shuffle: 'walk-shuffle', tiptoe: 'walk-tiptoe', sulk: 'walk-sulk',
  jaunty: 'walk-jaunty', nervous: 'walk-nervous', proud: 'walk-proud', sleepy: 'walk-sleepy', pompous: 'walk-pompous',
};
const STAND: Readonly<Record<Persona, readonly LibId[]>> = {
  plain: ['look-around', 'hands-on-hips', 'check-watch', 'pat-pockets', 'stretch', 'scratch-head'],
  swagger: ['idle-swagger', 'lean-back', 'flex', 'check-watch'],
  shuffle: ['tap-foot', 'idle-sulk', 'yawn', 'count-acorns'],
  tiptoe: ['look-around', 'idle-nervous', 'window-shop'],
  sulk: ['idle-sulk', 'cross-arms', 'tap-foot', 'mood-bored'],
  jaunty: ['idle-jaunty', 'dance-jig', 'eat-snack', 'feed-birds'],
  nervous: ['idle-nervous', 'look-around', 'check-watch', 'hiccups'],
  proud: ['idle-proud', 'hands-on-hips', 'read-map', 'tie-shoe'],
  sleepy: ['idle-sleepy', 'yawn', 'stretch', 'sit-bench'],
  pompous: ['idle-pompous', 'count-acorns', 'haggle', 'cross-arms'],
};
/** Things anyone does now and then, whatever their archetype. */
const ANYONE: readonly LibId[] = ['wait-bus', 'read-map', 'window-shop', 'sip-drink', 'eat-snack', 'tie-shoe', 'dust-hat', 'sneeze'];

/** The walk overlay for an archetype (null = the plain walk). Night makes most gnomes walk sleepily. */
export function walkStyleFor(p: Persona, r: Rand = Math.random, w: AnimWorld = world): LibId | null {
  if (w.night > 0.7 && p !== 'nervous' && r() < 0.5) return 'walk-sleepy';
  return WALK[p];
}

/** What a townsgnome does when it stops: by archetype, place and time. */
export function idleFor(p: Persona, biome: BiomeId | string, r: Rand = Math.random, w: AnimWorld = world): LibId {
  const roll = r();
  if (biome === 'tundra' && roll < 0.4) return 'shiver-fells';
  if (biome === 'desert' && roll < 0.4) return 'sweat-heat';
  if (biome === 'parkland' && roll < 0.15) return 'feed-birds';
  if (biome === 'loch' && roll < 0.15) return 'gawk-view';
  if (w.night > 0.6 && roll < 0.35) return pick(['yawn', 'idle-sleepy', 'hiccups'] as const, r);
  if (roll > 0.8) return pick(ANYONE, r);
  return pick(STAND[p], r);
}

/** Pair animations two idle gnomes may do together: [first, second] (second is the first's `pair`). */
export const PAIR_PICKS: readonly (readonly [LibId, LibId])[] = [
  ['handshake', 'handshake'], ['high-five', 'high-five'], ['fist-bump', 'fist-bump'], ['pair-gossip', 'pair-gossip'],
  ['pair-laugh', 'pair-laugh'], ['secret-whisper', 'secret-listen'], ['pair-argue', 'pair-argue'], ['hug-pair', 'hug-pair'],
  ['dance-pair', 'dance-pair'], ['toast-cups', 'toast-cups'], ['pair-bow', 'pair-bow'],
];
/** A pair for two archetypes: sulkers and the pompous argue, jaunty gnomes dance, the rest chat or greet. */
export function pairFor(a: Persona, b: Persona, r: Rand = Math.random): readonly [LibId, LibId] {
  const sour = (p: Persona): boolean => p === 'sulk' || p === 'pompous';
  if (sour(a) && sour(b)) return ['pair-argue', 'pair-argue'];
  if (a === 'jaunty' && b === 'jaunty') return ['dance-pair', 'dance-pair'];
  return pick(PAIR_PICKS, r);
}

/** The yaw from (ax, az) toward (bx, bz) (the model faces +z at yaw 0). */
export function yawToward(ax: number, az: number, bx: number, bz: number): number {
  return Math.atan2(bx - ax, bz - az);
}


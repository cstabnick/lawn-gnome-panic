export type StreamName = 'weather' | 'loot' | 'horde' | 'npc' | 'groups' | 'market' | 'chronicle' | 'base'
  | 'social' | 'factions' | 'quests' | 'story' | 'farm' | 'mowing' | 'bots';
export const STREAM_NAMES: readonly StreamName[] = ['weather', 'loot', 'horde', 'npc', 'groups', 'market', 'chronicle', 'base',
  'social', 'factions', 'quests', 'story', 'farm', 'mowing', 'bots'];
export interface Rng {
  next(): number;                                  // [0, 1)
  int(min: number, max: number): number;           // inclusive
  range(min: number, max: number): number;         // [min, max)
  chance(p: number): boolean;
  pick<T>(items: readonly T[]): T;
  weighted<T>(items: readonly T[], weight: (item: T) => number): T; // weights <= 0 never picked; falls back to items[0]
  round(x: number): number;                        // stochastic rounding: floor(x) + (next() < frac ? 1 : 0)
  state(): number;
}
export type Streams = Record<StreamName, Rng>;

export function hashString(s: string): number {    // FNV-1a, 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
export function createRng(seed: number): Rng {    // mulberry32
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    range: (min, max) => min + next() * (max - min),
    chance: (p) => next() < p,
    pick: (items) => items[Math.floor(next() * items.length)],
    weighted: (items, weight) => {
      let total = 0;
      for (const it of items) total += Math.max(0, weight(it));
      if (total <= 0) return items[0];
      let r = next() * total;
      for (const it of items) { r -= Math.max(0, weight(it)); if (r < 0) return it; }
      return items[items.length - 1];
    },
    round: (x) => { const f = Math.floor(x); return f + (next() < x - f ? 1 : 0); },
    state: () => a,
  };
  return rng;
}
export function streamSeed(seed: number, name: StreamName): number { return hashString(`${seed}:${name}`); }
export function createStreams(seed: number): Streams {
  const s = {} as Streams;
  for (const n of STREAM_NAMES) s[n] = createRng(streamSeed(seed, n));
  return s;
}

// Pardonlin's own sounds (E30): the steeple bell on the hour, an accordion on the quay, café cups and chatter, pigeons,
// the boules' clack, the baker's door bell. Positional one-shots on the ambience bus (sound/bus.ts playAt), fired on
// timers near their spots while the player is in town. app.ts updates it every frame.
import { playAt } from '../sound/bus';
import { registerPardonlinSounds } from './sounds.recipes';

export interface PardonlinSound {
  /** px, pz: the listener. night: 0 day .. 1 night. inside: the player is in an interior (no street sounds). */
  update(dt: number, px: number, pz: number, night: number, inside: boolean): void;
}

export type SpotKind = 'bell' | 'accordion' | 'cafe' | 'pigeons' | 'boules' | 'bakery';

export interface SoundSpot {
  id: string;
  kind: SpotKind;
  x: number;
  z: number;
  /** Seconds between plays: a random gap in [min, max]. */
  every: [number, number];
}

/** Audible range in metres per kind. */
const RANGE: Record<SpotKind, number> = { bell: 400, accordion: 45, cafe: 30, pigeons: 30, boules: 30, bakery: 30 };
/** Per-kind gain on the ambience bus. */
const GAIN: Record<SpotKind, number> = { bell: 0.9, accordion: 0.8, cafe: 0.7, pigeons: 0.6, boules: 0.7, bakery: 0.8 };
/** Nothing at all plays farther than this from the town centre. */
const HUB = { x: -1600, z: 100 };
const HUB_RANGE = 700;
/** Seconds between the three tolls of the bell. */
const TOLL_GAP = 2.2;
/** At night (night > this) only the bell and an occasional murmur. */
const NIGHT = 0.6;
const MURMUR_AT_NIGHT = 0.3;
const SEED = 0x9a7d1f;

export const SOUND_SPOTS: readonly SoundSpot[] = [
  { id: 'bell', kind: 'bell', x: -1500, z: -250, every: [90, 90] },
  { id: 'accordion', kind: 'accordion', x: -1586, z: 180, every: [14, 26] },
  { id: 'cafe-1', kind: 'cafe', x: -1522, z: 160, every: [3, 7] },
  { id: 'cafe-2', kind: 'cafe', x: -1522, z: 200, every: [3, 7] },
  { id: 'cafe-3', kind: 'cafe', x: -1530, z: -215, every: [3, 7] },
  { id: 'pigeons-1', kind: 'pigeons', x: -1510, z: -240, every: [5, 11] },
  { id: 'pigeons-2', kind: 'pigeons', x: -1733, z: 150, every: [5, 11] },
  { id: 'pigeons-3', kind: 'pigeons', x: -1520, z: -340, every: [5, 11] },
  { id: 'boules', kind: 'boules', x: -1545, z: -250, every: [6, 14] },
  { id: 'bakery', kind: 'bakery', x: -1522, z: 140, every: [10, 20] },
];

/** Small seeded PRNG so the timers are the same on every run. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createPardonlinSound(): PardonlinSound {
  const rng = mulberry32(SEED);
  const next = SOUND_SPOTS.map((s) => rng() * s.every[1]);
  const murmurToggle = SOUND_SPOTS.map(() => false);
  /** Bell tolls 2 and 3, queued by toll 1. */
  const pending: { at: number; spot: number }[] = [];
  let clock = 0;
  let started = false;

  const gap = (s: SoundSpot): number => s.every[0] + rng() * (s.every[1] - s.every[0]);

  /** Play spot i if the listener is in its range. */
  function fire(i: number, px: number, pz: number, night: number, inside: boolean, toll = false): void {
    const s = SOUND_SPOTS[i];
    const range = RANGE[s.kind];
    if (Math.hypot(s.x - px, s.z - pz) > range) return;
    const opts = { maxDist: range, bus: 'ambience' as const };

    if (s.kind === 'bell') {
      // The bell tolls indoors too, quieter; the first toll now, the others on the pending list.
      playAt('pl-bell', s, { ...opts, gain: GAIN.bell * (inside ? 0.5 : 1) });
      if (!inside && !toll) {
        pending.push({ at: clock + TOLL_GAP, spot: i }, { at: clock + 2 * TOLL_GAP, spot: i });
      }
      return;
    }
    if (inside) return;

    const gain = GAIN[s.kind];
    if (night > NIGHT) {
      // Night: only the occasional murmur from a café.
      if (s.kind === 'cafe' && rng() < MURMUR_AT_NIGHT) playAt('pl-murmur', s, { ...opts, gain });
      return;
    }
    switch (s.kind) {
      case 'accordion':
        playAt('pl-accordion', s, { ...opts, gain });
        break;
      case 'cafe':
        murmurToggle[i] = !murmurToggle[i];
        playAt(murmurToggle[i] ? 'pl-murmur' : 'pl-cup-clink', s, { ...opts, gain });
        break;
      case 'pigeons':
        playAt('pl-coo', s, { ...opts, gain });
        break;
      case 'boules':
        playAt('pl-boules-clack', s, { ...opts, gain });
        break;
      case 'bakery':
        playAt('pl-shop-bell', s, { ...opts, gain });
        break;
    }
  }

  return {
    update(dt, px, pz, night, inside) {
      if (!started) {
        started = true;
        registerPardonlinSounds();
      }
      clock += Math.max(0, dt);
      // Timers keep running out of town, but nothing plays there.
      if (Math.hypot(px - HUB.x, pz - HUB.z) > HUB_RANGE) {
        pending.length = 0;
        for (let i = 0; i < SOUND_SPOTS.length; i++) if (clock >= next[i]) next[i] = clock + gap(SOUND_SPOTS[i]);
        return;
      }
      for (let k = pending.length - 1; k >= 0; k--) {
        if (pending[k].at <= clock) {
          const s = SOUND_SPOTS[pending[k].spot];
          if (!inside && Math.hypot(s.x - px, s.z - pz) <= RANGE.bell) {
            playAt('pl-bell', s, { maxDist: RANGE.bell, bus: 'ambience', gain: GAIN.bell });
          }
          pending.splice(k, 1);
        }
      }
      for (let i = 0; i < SOUND_SPOTS.length; i++) {
        if (clock >= next[i]) {
          next[i] = clock + gap(SOUND_SPOTS[i]);
          fire(i, px, pz, night, inside);
        }
      }
    },
  };
}

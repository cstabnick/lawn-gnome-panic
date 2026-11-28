// E31 living world sounds: positional one-shots for the Unmown (frog chorus at Reedmere, the bittern's boom, the
// ranger's crackly radio at the station, wind in the reeds, a woodpecker in Oldroot Wood), the hamlets (a dog, a gate,
// a kettle whistle at night) and the High Tarn's loon. Same pattern as pardonlin/sound.ts: fixed-seed timers per spot,
// fired while the listener is in range. app.ts / living/runtime.ts calls update() every frame.
import { playAt } from '../sound/bus';
import { HAMLETS, HIGH_TARN, STATION } from './config';
import { registerLivingSounds, type LivingSoundId } from './sounds.recipes';

export interface LivingSound {
  /** px, pz: the listener. night: 0 day .. 1 night. inside: the player is in an interior (nothing plays). */
  update(dt: number, px: number, pz: number, night: number, inside: boolean): void;
}

export type LivingSpotKind = 'frogs' | 'bittern' | 'reeds' | 'ranger-radio' | 'woodpecker' | 'dog' | 'gate' | 'kettle' | 'tarn-loon';

/** When a spot may fire: any time, day only, night only, or only at dawn and dusk. */
export type LivingWindow = 'any' | 'day' | 'night' | 'dawn-dusk';

export interface LivingSoundSpot {
  id: string;
  kind: LivingSpotKind;
  x: number;
  z: number;
  /** Seconds between plays: a random gap in [min, max]. */
  every: [number, number];
  when: LivingWindow;
}

/** The recipe id each spot kind plays (sounds.recipes.ts). */
export const LIVING_RECIPE: Record<LivingSpotKind, LivingSoundId> = {
  frogs: 'living-frogs',
  bittern: 'living-bittern',
  reeds: 'living-reeds',
  'ranger-radio': 'living-radio',
  woodpecker: 'living-woodpecker',
  dog: 'living-dog',
  gate: 'living-gate',
  kettle: 'living-kettle',
  'tarn-loon': 'living-loon',
};

/** Audible range in metres per kind. */
const RANGE: Record<LivingSpotKind, number> = {
  frogs: 70, bittern: 260, reeds: 40, 'ranger-radio': 25, woodpecker: 45, dog: 35, gate: 30, kettle: 35, 'tarn-loon': 320,
};
/** Per-kind gain on the ambience bus. */
const GAIN: Record<LivingSpotKind, number> = {
  frogs: 0.6, bittern: 0.8, reeds: 0.5, 'ranger-radio': 0.6, woodpecker: 0.6, dog: 0.6, gate: 0.5, kettle: 0.5, 'tarn-loon': 0.7,
};
/** night below DAY_BELOW is day; above NIGHT_ABOVE is night; between is dawn or dusk. */
const DAY_BELOW = 0.3;
const NIGHT_ABOVE = 0.6;
const SEED = 0x4c1f2b;

/** Every E31 living sound spot. The hamlets get their spots at the centre of each hamlet. */
export const LIVING_SOUND_SPOTS: readonly LivingSoundSpot[] = [
  { id: 'frogs-1', kind: 'frogs', x: -1150, z: -1600, every: [12, 20], when: 'any' },
  { id: 'frogs-2', kind: 'frogs', x: -1060, z: -1610, every: [12, 20], when: 'any' },
  { id: 'bittern', kind: 'bittern', x: -1200, z: -1660, every: [40, 80], when: 'dawn-dusk' },
  { id: 'reeds', kind: 'reeds', x: -1120, z: -1640, every: [8, 15], when: 'any' },
  { id: 'ranger-radio', kind: 'ranger-radio', x: STATION.door.x, z: STATION.door.z, every: [20, 40], when: 'day' },
  { id: 'woodpecker', kind: 'woodpecker', x: -1670, z: -1500, every: [15, 30], when: 'day' },
  { id: 'tarn-loon', kind: 'tarn-loon', x: HIGH_TARN.x, z: HIGH_TARN.z, every: [30, 60], when: 'dawn-dusk' },
  ...HAMLETS.flatMap((h): LivingSoundSpot[] => [
    { id: `${h.id}-dog`, kind: 'dog', x: h.x, z: h.z, every: [25, 50], when: 'day' },
    { id: `${h.id}-gate`, kind: 'gate', x: h.x, z: h.z, every: [30, 60], when: 'day' },
    { id: `${h.id}-kettle`, kind: 'kettle', x: h.x, z: h.z, every: [40, 80], when: 'night' },
  ]),
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

function windowOpen(when: LivingWindow, night: number): boolean {
  switch (when) {
    case 'any': return true;
    case 'day': return night < DAY_BELOW;
    case 'night': return night > NIGHT_ABOVE;
    case 'dawn-dusk': return night >= DAY_BELOW && night <= NIGHT_ABOVE;
  }
}

export function createLivingSound(): LivingSound {
  registerLivingSounds();
  const rng = mulberry32(SEED);
  const spots = LIVING_SOUND_SPOTS;
  const next = spots.map((s) => rng() * s.every[1]);
  let clock = 0;

  const gap = (s: LivingSoundSpot): number => s.every[0] + rng() * (s.every[1] - s.every[0]);

  /** Play spot i if the listener is in its range and its time window is open. */
  function fire(i: number, px: number, pz: number, night: number): void {
    const s = spots[i];
    const range = RANGE[s.kind];
    if (Math.hypot(s.x - px, s.z - pz) > range) return;
    if (!windowOpen(s.when, night)) return;
    // Frogs are louder as the light goes.
    const gain = s.kind === 'frogs' ? GAIN.frogs * (0.5 + 0.5 * night) : GAIN[s.kind];
    playAt(LIVING_RECIPE[s.kind], s, { maxDist: range, bus: 'ambience', gain });
  }

  return {
    update(dt, px, pz, night, inside) {
      clock += Math.max(0, dt);
      for (let i = 0; i < spots.length; i++) {
        if (clock < next[i]) continue;
        next[i] = clock + gap(spots[i]);
        if (!inside) fire(i, px, pz, night);
      }
    },
  };
}

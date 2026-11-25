Epic: E31 wave 1 (prefabs and systems)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first.

## Goal
Traffic in each outer region has its own character (more variety than "ride-ons and push-bikes everywhere"), using the
E29 European rides and the three E31 vehicles, and the fleet table has a few named variants of the new vehicles.

## Read first
- `games/gnome-theft-auto/src/traffic.ts` lines 540-570 (`pickKind(x, z)`: the bus, the European zone, odd rides,
  districts and biomes)
- `games/gnome-theft-auto/src/fleet.ts` (FLEET table: `FleetEntry` with `id, kind, name, replaces, weight, tints?,
  pitch, speedMult?, accelMult?`)
- `games/gnome-theft-auto/src/levels.ts` (`regionAt(x, z)` and the `RegionId` union)
- `games/gnome-theft-auto/src/fleet.test.ts`

## Change
- NEW `games/gnome-theft-auto/src/living/trafficMix.ts`:
  ```ts
  import type { RegionId } from '../levels';
  import type { VehicleKind } from '../types';
  export interface RegionMix { chance: number; kinds: readonly VehicleKind[] }
  /** Per region: with probability `chance` a new car there is picked from `kinds` (repeat a kind to weight it). */
  export const REGION_TRAFFIC: Readonly<Partial<Record<RegionId, RegionMix>>>;
  export function regionMixKind(region: RegionId, r1: number, r2: number): VehicleKind | null; // r1, r2 in [0,1)
  ```
  `regionMixKind` returns null when the region has no mix or `r1 >= chance`, else `kinds[Math.floor(r2 * kinds.length)]`.
  Mixes (tune the chances 0.35-0.6):
  - 'west-estates' (Trellisdown, the estates): golf-cart x2, lowrider, deux-pots, euro-hatch, shell-camper.
  - 'north-highlands' (Snowcap Rise): shell-camper x2, dirt-bike, ride-on, zero-turn.
  - 'south-shore' (Saltbucket Shore): cone-van x2, shell-camper, wespa, golf-cart, push-bike.
  - 'the-unmown': ranger-buggy x3, push-bike.
  - 'dust-flats': barrow-buggy, dirt-bike (light touch, chance 0.2).
  Never put boats, aircraft, 'taxi', 'tessie', 'tow-tube', 'tow-ski', 'spoke-gondola', 'tea-tray-sled', 'snow-skis' in a mix.
- `games/gnome-theft-auto/src/traffic.ts`: in `pickKind`, right after the two European-ride lines and before the odd-ride
  line, add: `const mixed = regionMixKind(regionAt(x, z), Math.random(), Math.random()); if (mixed) return mixed;`
  (import `regionAt` from './levels' if not imported, and `regionMixKind` from './living/trafficMix'). Change nothing else
  in traffic.ts.
- `games/gnome-theft-auto/src/fleet.ts`: append three FLEET entries:
  `{ id: 'ranger-buggy-head', kind: 'ranger-buggy', name: "Head Ranger's Buggy", replaces: ['ranger-buggy'], weight: 0.3, tints: [0x4f6b3a, 0x6b5a3a], pitch: [0.9, 1.05] }`,
  `{ id: 'shell-camper-grand-spiral', kind: 'shell-camper', name: 'Grand Spiral Camper', replaces: ['shell-camper'], weight: 0.3, pitch: [0.7, 0.85], speedMult: 0.9 }`,
  `{ id: 'cone-van-soft-serve', kind: 'cone-van', name: 'Soft-Serve Special', replaces: ['cone-van'], weight: 0.3, tints: [0xf7c6d9, 0xc6e8f7, 0xfff1b8], pitch: [1.05, 1.2] }`.
- NEW `games/gnome-theft-auto/src/living/trafficMix.test.ts`: every mix has 0 < chance <= 1 and non-empty kinds; every
  kind is a key of `VEHICLES` (import from '../config') and has no `boat`, `air` or `flies: true` flag on its spec;
  `regionMixKind('turfton', 0, 0)` is null; `regionMixKind('the-unmown', 0, 0)` is 'ranger-buggy'.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/living/trafficMix.test.ts src/fleet.test.ts src/fleetRuntime.test.ts` passes.
- `npx vitest run src/traffic.test.ts` passes (two cases are known to be flaky under load: rerun that file alone once).
- `npx tsc --noEmit -p .` clean for your files.

## Out of scope
`config.ts`, `types.ts`, `world.ts`, `living/config.ts`, any other file.

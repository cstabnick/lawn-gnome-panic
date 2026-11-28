Epic: E29-A European kit (all parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E29/_common.md` first: working directory, toolchain, modelling, z-fighting, voice and checks.

## Goal
Two drivable European ride prefabs (the Wespa scooter and the Baguette Trike) exist in
`packages/prefabs/src/catalog/gta-euro-fleet-b.ts`, and three wearable achievement rewards exist in
`packages/prefabs/src/catalog/gta-euro-gear.ts`.

## Read first
- `docs/roadmaps/gta-batch-3/E29/_common.md`
- `packages/prefabs/src/types.ts` (`pivots`, `seat`, `DamageStage`, `wear`), `packages/prefabs/src/palette.ts`
- `packages/prefabs/src/catalog/gta-odd-rides.ts` (vehicle prefabs with `wheel-<n>` / `steer` pivots and damage stages;
  the `sunday-driver-cap` at the end is a wearable head reward: copy its shape of data)
- `packages/prefabs/src/catalog/cosmetics-back.ts` and `cosmetics-neck.ts` (one back item and one neck item each, for
  size and `uses: ['wear-back']` / `['wear-neck']`)

## Change
- `packages/prefabs/src/catalog/gta-euro-fleet-b.ts`: exists with `export const GTA_EURO_FLEET_B: readonly PrefabDef[] = [];`.
  Keep the export; fill with two prefabs. Each: `category: 'prop'`, `uses: ['place', 'sit']`, tags include `'vehicle'`,
  `'gta'`, `'euro'`, tint parts `c: 'tint'` (set `tint`), nose +z, two damage stages like gta-odd-rides.ts (`dented`:
  darken 0.25, a dent, a small morph; `wrecked`: darken 0.6, sink 0.03, hide one wheel group, smoke). Max 40 parts.
  The game's config already uses these EXACT numbers.

### `gta-wespa` — name 'Wespa' (game scale 1.6)
- Size: 0.34 wide, ~0.75 tall, 1.0 long (z -0.5..0.5). tint 0xf2c230 (wasp yellow) with black stripes (thin boxes 0.02 proud).
- `seat: [0, 0.36, -0.1]`; a long two-up saddle box from z -0.55... keep it z -0.5..0.05, top at y 0.36.
- `pivots`: `'wheel-0': [0, 0.1, -0.33]` (rear tyre: cyl r 0.1, 0.06 wide, `rot: [0, 0, 90]`), `'wheel-1': [0, 0.1, 0.36]`
  (front tyre), `steer: [0, 0.62, 0.28]`. Group `steer`: the handlebar (a cyl along x, 0.36 wide, at `[0, 0.62, 0.28]`)
  with black grips at its ends, a round headlamp on the bar, and the front fork (two thin pills down to the front hub).
- Look: a wasp-shaped scooter: a fat rounded rear body (squashed ball) striped yellow and black, a flat floorboard, a
  curved leg shield at the front (thin wedge or box tilted), a tiny round mirror on a stalk, two little antennae on the
  front as a joke, a small rear rack with a crate. Wheels small.

### `gta-baguette-trike` — name 'Baguette Trike' (game scale 1.5)
- Size: 0.75 wide, ~1.0 tall, 1.2 long (z -0.62..0.58). tint 0x2f5a8f (delivery blue), trim 0xd9a441 (bread gold).
- One front wheel, two rear wheels; the rider sits in front of a cargo box.
- `seat: [0, 0.4, 0.08]` (a saddle). `pivots`: `'wheel-0': [-0.32, 0.11, -0.35]`, `'wheel-1': [0.32, 0.11, -0.35]`,
  `'wheel-2': [0, 0.11, 0.45]` (r 0.11 tyres), `steer: [0, 0.62, 0.3]`. Group `steer`: a handlebar along x 0.4 wide at
  `[0, 0.62, 0.3]` with grips, and the front fork down to `wheel-2`'s hub.
- Cargo box behind the rider: a box 0.7 wide, 0.32 tall, 0.5 deep centred at `[0, 0.36, -0.35]` (tint), open top, with
  five baguettes (long trim-coloured pills) sticking out at angles, a little striped canopy on two poles over the box,
  and a sign board on the box side. A passenger can sit in the box: its floor top at y 0.3.
- Look: a little three-wheeled bakery delivery trike with a small two-stroke engine under the saddle (a box and an
  exhaust pipe), mudguards, a bell on the bar.

- `packages/prefabs/src/catalog/gta-euro-gear.ts`: exists with `export const GTA_EURO_GEAR: readonly PrefabDef[] = [];`.
  Fill with three small wearables (hand-sized, no footprint; lowest point y = 0; largest side under 0.5):
  - `tour-beret` — name 'Tour Beret', `category: 'armor'`, `uses: ['wear-head']`, a squashed black-navy ball beret
    (tint 0x1f2a44) tilted a little, a stalk on top, a tiny enamel acorn badge. Set `tint`.
  - `baguette-quiver` — name 'Baguette Quiver', `category: 'armor'`, `uses: ['wear-back']`, a tall canvas tube (tint
    0xc9b48a) with a strap and four baguettes poking out the top at angles. Height about 0.45. Set `tint`.
  - `riviera-scarf` — name 'Riviera Scarf', `category: 'armor'`, `uses: ['wear-neck']`, a knotted neck scarf: a ring
    (tint 0x2f6bb0, white stripes as a trim ring beside it) and two short tails hanging at the front. Set `tint` and `trim`.

## Contract
Prefab ids `gta-wespa`, `gta-baguette-trike`, `tour-beret`, `baguette-quiver`, `riviera-scarf`. The `seat`, `wheel-<n>` and
`steer` positions above are fixed (the game's `VEHICLES` uses them times the scale; its driving hands hold the handlebar
grips). The three reward ids and their `uses` are fixed (`packages/achievements/src/catalog.ts` rewards: head
`tour-beret`, back `baguette-quiver`, neck `riviera-scarf`).

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in your files.
- `npm test -w packages/prefabs` passes every test naming your five ids.
- `npm test -w packages/achievements` passes (it checks the reward prefabs exist with the right `uses`).

## Out of scope
Every other file, including `gta-euro-fleet.ts`, `catalog/index.ts` and anything under `games/`.

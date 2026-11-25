Epic: E12-A (winter sports, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E12/issues/_env.md` first (environment, rules).

## Goal
The ordinary fishing rod fishes a hole in the ice: when a hole is in reach, a cast drops the line straight down the hole
(no matter how far the charge would throw it), and four cold-water species bite there (`waters: ['ice']`). Each species
has its fish prefab.

## Background (already in the code, do not redo)
- `src/fishing/types.ts`: `FishWater` already includes `'ice'`.
- `src/fishing/waterKind.ts`: `IceHole { x, z, y, r }`, `setIceHoleSource(fn)` (the winter runtime registers its holes),
  `iceHoleNear(x, z, reach)`, `ICE_REACH = 3`; `waterSurface` returns a hole's `y` inside a hole; `fishWaterAt` returns
  `'ice'` inside a hole; `nearWater` is true within `ICE_REACH` of a hole.
- `src/fishing/pick.ts weatherAt`: the real weather for `north-highlands` (snow when it snows), always `'snow'` for
  `frostbite-fells`.
- `src/fishing/fishing.ts`: `deps.onCatch?.(water, id)` after a landing, and `lendRod()` exist.

## Read first
- `games/gnome-theft-auto/src/fishing/types.ts`: `SimEnv` (around line 175), `FishSpecies`.
- `games/gnome-theft-auto/src/fishing/sim.ts` lines 1-90: the `'charge'` case (the cast walks back from the charged
  distance in 0.5 m steps until `env.water` finds water).
- `games/gnome-theft-auto/src/fishing/fishing.ts` lines 104-160: where `env: SimEnv` is built (`px`, `pz` are the player).
- `games/gnome-theft-auto/src/fishing/species.ts`: the species table format (the Frostbite Fells rows near line 75).
- `packages/prefabs/src/catalog/gta-fish-a.ts`: fish prefab style (1 unit long, nose toward +z, centred, `category:
  'prop'`, `uses: ['place']`, 5 examine lines) and `docs/roadmaps/prefab-library/_common.md` (modelling rules; ignore its
  Environment section).

## Change
- `src/fishing/types.ts`: add to `SimEnv` an optional
  `snap?(): { x: number; z: number; surface: number } | null;` with the doc comment "An ice hole in reach: the cast drops
  straight into it (winter ice fishing)."
- `src/fishing/sim.ts`, `'charge'` case, on release: before the walk-back loop, `const hole = env.snap?.() ?? null;` and
  when it is not null set `toX/toZ` to the hole, `s.surface = hole.surface` (no wave offset), the from-point and bobber
  as the loop does, phase 'flight', return 'cast'. Without a hole nothing changes.
- `src/fishing/fishing.ts`: in `env`, `snap: () => { const h = iceHoleNear(px, pz, ICE_REACH); return h ? { x: h.x, z:
  h.z, surface: h.y } : null; }` (import `iceHoleNear`, `ICE_REACH` from `./waterKind`).
- `src/fishing/species.ts`: four species after the Frostbite Fells rows, each `waters: ['ice']`, `regions:
  ['north-highlands', 'frostbite-fells']`, `minRod: 0` except where noted, sensible `size`, `value`, `fight`, `difficulty`,
  one-line `blurb` in the house voice (fish are never hurt):
  - `fish-pail-perch` "Pail Perch", common, 10-28 cm, `weather: { snow: 1.3 }`, darter, difficulty 1, value 6. Blurb idea:
    it has lived in a pail its whole life and thinks the world is round and tin.
  - `fish-woolly-minnow` "Woolly Minnow", common, 4-10 cm, steady, difficulty 1, value 3, `baits: { 'sock-fly': 2.5 }`.
  - `fish-lantern-burbot` "Lantern Burbot", uncommon, 30-70 cm, `times: { 'Neon Night': 3, Dusk: 1.6, Noon: 0.3 }`,
    sulker, difficulty 3, value 16.
  - `fish-frostjaw-char` "Frostjaw Char", rare, 35-80 cm, `weather: { snow: 3, clear: 0.6 }`, runner, difficulty 4,
    minRod 1, value 34.
  `prefab` = the species id.
- `packages/prefabs/src/catalog/gta-fish-ice.ts` (registered already, exports `GTA_FISH_ICE`, now empty): the four fish
  prefabs with ids equal to the species ids, styled like `gta-fish-a.ts` (pale, cold colours: the perch grey-green with
  tin-bright bands; the minnow tiny-looking but still 1 unit long, fluffy grey fins; the burbot long and brown with a pale
  glowing chin barbel (`glow: true` on that part); the char steel-blue with a frost-white jaw). Tags include 'fish', 'ice',
  'gta', 'fishing'.
- Tests: add to `src/fishing/pick.test.ts` (or a new `src/fishing/ice.test.ts`): with `pickFish`/`fishWeight` and water
  `'ice'` in region `north-highlands` only the four ice species can bite; none of them bite in `'loch'`; in region
  `'turfton'` on `'ice'` nobody bites. In `src/fishing/sim.test.ts` (or the new file): with `env.snap` returning a hole
  at (5, 5, y 2.9), releasing a charge from origin (0, 0) casts to exactly (5, 5) with surface 2.9; with `snap` absent
  the old behaviour is unchanged (existing tests stay green).

## Contract
`SimEnv.snap` exactly as above. Species ids exactly `fish-pail-perch`, `fish-woolly-minnow`, `fish-lantern-burbot`,
`fish-frostjaw-char` (prefab ids the same).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/fishing` passes.
- `npm test -w packages/prefabs` passes for your four ids (`npx vitest run -t fish-` from `packages/prefabs` is quicker).
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
`fishing/waterKind.ts` (done), every `winter/` file, other prefab catalog files.

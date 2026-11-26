Epic: E33 mountain routes, wave 2. Worker: Haiku.
Depends on: wave 1 (final route lines and spots)

## Environment
Read `docs/roadmaps/gta-batch-3/E33/_common.md` first. Three dressers work at the same time on other files.

## Goal
The Hatbrim and the Spine Cut are alive: a small herd of goats grazing the Hatbrim's slopes, a few birds over the tops,
wind on the summits, and the odd car on the pass at quiet moments is left to traffic (not this issue).

## Read first
- `games/gnome-theft-auto/src/mountainRoutes/life.ts` (your stub), `deps.ts`, `defs/hatband.ts` (`HATBAND_SPOTS`),
  `defs/brimWalk.ts` (`BRIM_WALK_SPOTS`), `defs/spineCut.ts` (`SPINE_CUT_SPOTS`)
- `games/gnome-theft-auto/src/ambientGnomes.ts` — how ambient things are built and updated near the player (pattern)
- `games/gnome-theft-auto/src/sound/bus.ts` — `playAt(id, { x, z }, opts?)`; sound ids in `src/sound/ids.ts`
  ('goat-bleat', 'wind-gust', 'crow', 'bird-song')
- prefab `goat` in `packages/prefabs/src/catalog/` (grep `id: 'goat'`) and `bird-raptor` (grep)

## Change
- `src/mountainRoutes/life.ts` — implement `createMountainLife(scene, world, deps)`:
  - Goats: 7 goats (prefab `goat` via `buildPrefab('goat', { lights: false })`, `placeOnGround`) in two groups on the
    Hatbrim's open slopes: one near `HATBAND_SPOTS.scree` (but at least 8 m off every route: check with `locate` on each
    of `ALL_ROUTES` with reach 8), one between `BRIM_WALK_SPOTS.pateCairn` and the Mittenholt side. Each goat drifts
    slowly (0.3 m/s) between random points within 25 m of its group centre, turning to face where it walks, pausing 3-8
    s to graze (a small head dip by rotating the group 0.15 rad on x is enough). Keep them off the routes (reject a target
    within 8 m of any route). Only update goats within 150 m of the player; others stay still.
  - Birds: 2 large birds (prefab `bird-raptor`, tint 0x4a3322, scale 1.8) circling: one over the Bobble's summit
    (`BRIM_WALK_SPOTS.summit`, radius 60 m, 35 m above the ground there), one over the Keyhole (`SPINE_CUT_SPOTS.keyhole`,
    radius 40 m, 30 m up), slow (8 m/s), banking into the turn.
  - Sound in `update`: 'goat-bleat' at the nearest goat within 40 m every 8-20 s; 'wind-gust' at the summit when within
    70 m every 5-10 s.
  - Use a seeded random (e.g. a small mulberry32) so it is deterministic; no work at import time.
  - `blips()` returns [].
- New test `src/mountainRoutes/life.test.ts` (with `installFakeDom()` from `../testing/fakeDom` and
  `vi.mock('../audio', () => ({ play: () => undefined }))`): create it on a fresh scene with a stub deps, run `update` for
  60 s of steps with the player at the scree spot: 7 goats in the scene; none ever within 8 m of a route's centre line;
  birds stay within radius + 5 of their centres.

## Contract
`createMountainLife(scene, world, deps): Area` unchanged. You own `life.ts` and `life.test.ts` only.

## Done when
- `npx vitest run src/mountainRoutes/life.test.ts` passes; `npx tsc --noEmit -p .` clean in your files.

## Out of scope
Every other file.

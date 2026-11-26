Epic: E33 mountain routes, wave 2 (dressing). Worker: Sonnet.
Depends on: wave 1 (the Spine Cut's final line, spots and pads; the E33 prefabs)

## Environment
Read `docs/roadmaps/gta-batch-3/E33/_common.md` first. Three other dressers work at the same time on other files.

## Goal
The Spine Cut reads as a road blasted through a ridge: the **Keyhole** rock arch over the deepest part of the cut (cars
drive under it), loose rock and old blasting gear in the gorge, warning signs, the Keyhole pull-in where **Plumb Bob**
the surveyor measures the arch, the moor lay-by, route signs at both ends. Environmental storytelling is acceptance
criteria: at least 3 readable vignettes, signs with jokes, a resident doing something specific, ambient sound.

## Read first
- `games/gnome-theft-auto/src/mountainRoutes/defs/spineCut.ts` (`SPINE_CUT`, `SPINE_CUT_SPOTS`: start, end, keyhole,
  gorgeIn, gorgeOut, rockfall, moorBend, surveyor; `SPINE_PADS`: keyhole-pullin, moor-layby), `pads.ts`, `spine.ts`
  (your stub), `deps.ts`
- `games/gnome-theft-auto/src/capwood/runPlan.ts` and `src/capwood/run.ts` — the plan + builder pattern to copy.
- `docs/lore/entries/apocrypha/spine-cut.md`, `plumb-bob.md`, rulings R-231, R-232.
- Prefabs: `keyhole-arch` (two pillars at local x ±7.5, clear gap x -5.5..5.5 and 8.5 m high, lintel along local x,
  front +z: stand it with yaw = the road's yaw at `keyhole` + Math.PI / 2 so the lintel spans across the road), `scree-pile`,
  `falling-rocks-sign`, `gradient-sign`, `route-name-sign`, `road-marker-post` (E33); `site-barrier`, `garden-rock`,
  `field-binoculars`, `bench`, `hamlet-stone-cairn`, `dayg-story-warning-post`. Check each exists (`getPrefab`).
- `games/gnome-theft-auto/src/sound/ids.ts` (e.g. 'wind-gust', 'crow', 'critter-thud', 'metal-clang').

## Change
- New `src/mountainRoutes/spinePlan.ts` (pure): `spinePlan()` -> `{ props, signs, vignettes, residents, solids }`:
  - the `keyhole-arch` at `keyhole`, its two pillars as solids (round, r 1.6, at local x ±7.5, h = 12), placed so the
    pillars stand on the gorge sides off the road (check: the road edge plus 1 m is clear of both pillar circles; if the
    road is wider at that point, scale the arch up by the needed factor);
  - a `route-name-sign` at each end ("THE SPINE CUT / Low arch? No. / Mind the Keyhole"), `falling-rocks-sign` and
    `gradient-sign` at `gorgeIn` and `gorgeOut`, a plaque at the pull-in ("THE KEYHOLE · left standing for measuring ·
    Highways Sub-Committee");
  - vignettes: a rockfall at `rockfall` (a `scree-pile` on the verge, a rock in the gutter, a broken `road-marker-post`
    lying flat); an old blasting hut's remains near `gorgeOut` (a `site-barrier`, crates) with a sign "DANGER: OLD
    BANGS"; Plumb Bob's measuring kit at `surveyor` (a tripod-ish `field-binoculars` on a stand, a stack of notebooks, a
    chair); one more of your own on the moor at `moorBend` or the `moor-layby` (e.g. a lost sheep's ear tag pinned to a
    post with a note).
  - residents: Plumb Bob at `surveyor` ('think' or 'scratch-head'; bubble: still not sure), one more gnome at the moor
    lay-by.
  - Placement rules: nothing on the road (props outside `width / 2 + shoulder + 0.5` of the centre line, except the
    arch, whose lintel is above it); props within 40 m of the road; at least 6 m from other routes.
- `src/mountainRoutes/spine.ts` — implement `createSpineCutDressing(scene, world, deps)` like `capwood/run.ts`
  (`buildStaticCells(..., { name: 'e33-spine-cut' })`; the arch can be a `buildPrefab` + `placeOnGround` of its own if
  `buildStaticCells` merges it badly), colliders, `buildSignText`, `createAmbientGnomes`; sound: 'wind-gust' in the
  gorge (every 6-12 s within 40 m of `keyhole`), 'crow' now and then near the arch. `blips()`: `{ x, z of keyhole,
  color: '#8a7a66', label: 'The Keyhole' }`.
- New test `src/mountainRoutes/spinePlan.test.ts`: prefab ids exist; counts; the road clear under the arch (no solid
  within the road edge + 1 m at `keyhole`); placement rules.

## Contract
`createSpineCutDressing(scene, world, deps): Area` unchanged. You own `spine.ts`, `spinePlan.ts`, `spinePlan.test.ts`.

## Done when
- `npx vitest run src/mountainRoutes/spinePlan.test.ts` passes; `npx tsc --noEmit -p .` clean in your files.
- Report: vignettes, the arch placement (yaw, scale), residents.

## Out of scope
Every other file.

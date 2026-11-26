Epic: E33 mountain routes, wave 2 (dressing). Worker: Sonnet.
Depends on: wave 1 (the Hatband's and the Brim Walk's final lines, spots and pads; the E33 prefabs)

## Environment
Read `docs/roadmaps/gta-batch-3/E33/_common.md` first. Three other dressers work at the same time on other files.

## Goal
The high Hatbrim reads as walked and ridden country: the Hatband's bollard gates (cars cannot get through; bikes and
buggies can), its passing place and the World's Edge lookout over the north fence; the Brim Walk's stile at Mittenholt,
waymark cairns, Old Pate's cairn, **Pate's Bothy**, a ridge bench, the summit cairn with **the Summit Register** (an
interact spot: signing it unlocks `gta-summit-register`), and the tarn end. Environmental storytelling is acceptance
criteria: at least 3 readable vignettes, signs with jokes, residents doing something specific, ambient sound.

## Read first
- `games/gnome-theft-auto/src/mountainRoutes/defs/hatband.ts` (`HATBAND`, `HATBAND_SPOTS`: gateWest, gateEast,
  worldsEdge, passingPlace, scree), `defs/brimWalk.ts` (`BRIM_WALK`, `BRIM_WALK_SPOTS`: stile, pateCairn, gapCrossing,
  summit, bothy, tarnEnd, ridgeBench), `defs/hatbrimPads.ts` (`worlds-edge`, `summit-platform`, `bothy-terrace`),
  `pads.ts`, `hatbrim.ts` (your stub), `deps.ts`
- `games/gnome-theft-auto/src/capwood/runPlan.ts` and `src/capwood/run.ts` — the plan + builder pattern to copy.
- `games/gnome-theft-auto/src/interactables.ts` — `addInteractSpot({ x, z, y?, prompt, run(player, { hud, economy, fx,
  play }) })` (a spot on foot within 3.6 m; `y` makes the feet height count too; `hud.toast(text, ms)` exists).
- `docs/lore/entries/apocrypha/hatband.md`, `brim-walk.md`, `hatbrim.md`, rulings R-223..R-225 (follow them).
- Prefabs: `stone-stile`, `summit-register-box`, `hatband-pole`, `route-name-sign`, `scree-pile`, `viewpoint-topograph`,
  `falling-rocks-sign` (E33); `tarn-bothy`, `hamlet-stone-cairn`, `hamlet-sign`, `euro-bollard`, `bench`, `log-bench`,
  `garden-rock`, `goat`, `field-binoculars`, `camp-lantern-post`. Check each exists (`getPrefab`) in your test.
- `games/gnome-theft-auto/src/sound/ids.ts` (e.g. 'wind-gust', 'goat-bleat', 'snow-creak', 'door-creak').

## Change
- New `src/mountainRoutes/hatbrimPlan.ts` (pure): `hatbrimPlan()` returning `{ props, signs, vignettes, residents,
  solids }` (types from `../pardonlin/plan` and `../ambientGnomes`). Must include:
  - Hatband gates at `gateWest` and `gateEast`: a row of `euro-bollard`s across the track with gaps of exactly 2.6 m
    between bollard faces (bikes and buggies, radius <= 1.2, pass; a car does not), each bollard a round solid (r 0.2,
    h 1); a `route-name-sign` ("THE HATBAND / Bikes and buggies only / No cars, no caravans, no excuses") beside each.
  - `worldsEdge`: the lookout (a `viewpoint-topograph`, a `bench`, a sign "WORLD'S EDGE / Beyond: the Fence. Beyond the
    Fence: we don't talk about it."), `passingPlace` sign, a `scree-pile` + `falling-rocks-sign` at `scree`.
  - Brim Walk: the `stone-stile` at `stile` (turned across the path), a fingerpost sign, a waymark `hamlet-stone-cairn`
    (scale 0.5) every 120 m beside the path, Old Pate's cairn (scale 1.2) at `pateCairn`, `tarn-bothy` as Pate's Bothy
    on `bothy-terrace` with a sign "PATE'S BOTHY / Shut the door. The weather lets itself in.", a bench at `ridgeBench`,
    the summit: `hamlet-stone-cairn` (scale 1.6) + `summit-register-box` on `summit-platform`, a summit plaque with the
    height ("THE BOBBLE · 105 m · the top of the yard").
  - vignettes (one-line stories): a hat on a stick planted in Old Pate's cairn (someone's bet); a tent half-pitched by
    the bothy with its poles in the wrong order; a bike propped at the Hatband's lookout with a picnic on its saddle; one
    more of your own.
  - residents: a cyclist at the World's Edge ('look-around'), a walker resting at the ridge bench ('sit-ground'), a
    gnome on the summit signing the register ('read'). Short, funny bubbles.
  - Placement rules: nothing on a route's road except the bollards and stile, which stand across their own route; props
    at least 6 m from the other routes; within 40 m of their route.
- `src/mountainRoutes/hatbrim.ts` — implement `createHatbrimDressing(scene, world, deps)` like `capwood/run.ts`
  (`buildStaticCells(..., { name: 'e33-hatbrim' })`, colliders, `buildSignText`, `createAmbientGnomes`), plus:
  - the Summit Register: `addInteractSpot({ x, z, y: <ground there>, prompt: 'Sign the Summit Register', run(player,
    { hud }) { deps.unlock('gta-summit-register'); hud.toast(<a random line from a list of 6 earlier entries, e.g.
    "Reached the top. Hat blew off. Worth it. — B.">, 5000); return true; } })`;
  - sound in `update`: 'wind-gust' near the summit and the World's Edge (every 5-10 s within 50 m), 'goat-bleat' now and
    then (every 15-30 s within 80 m of `scree`).
  - `blips()`: the summit `{ color: '#e8e2d0', label: 'The Bobble' }`.
- New test `src/mountainRoutes/hatbrimPlan.test.ts`: prefab ids exist; counts; gate gaps 2.6 m; placement rules; the
  register spot within 3 m of `summit`.

## Contract
`createHatbrimDressing(scene, world, deps): Area` unchanged. You own `hatbrim.ts`, `hatbrimPlan.ts`,
`hatbrimPlan.test.ts` only. Achievement id `gta-summit-register`.

## Done when
- `npx vitest run src/mountainRoutes/hatbrimPlan.test.ts` passes; `npx tsc --noEmit -p .` clean in your files.
- Report: vignettes, residents, the register lines.

## Out of scope
Every other file.

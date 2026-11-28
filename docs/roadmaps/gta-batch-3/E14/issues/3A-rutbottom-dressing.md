Epic: E14-3 (places and quests)
Depends on: E14-2 (merged in the worktree: the Rutbottom track, `buildDirtTrackSurface`, prefabs)
Worker: Sonnet (general-purpose) — dressing and environmental storytelling

## Environment
Read `docs/roadmaps/gta-batch-3/E14/issues/_env.md` first (worktree, toolchain, rules, places, people, contracts).

## Goal
The Rutbottom Dirt Bowl as a place, built in `src/rutbottom/index.ts`: the dirt track surface, hay-bale and tyre
barriers, Clary's starter's tower, the pits, a grandstand with a crowd, signs, story vignettes, residents, sound, a
free-roam lap timer, and its map blip.

## Read first
- `games/gnome-theft-auto/src/rutbottom/index.ts` (stub; keep the signature), `src/rutbottom/spots.ts` (fixed places:
  tower, Clary, pits, Teasel, gate, pit gap, grandstand), `src/raceTrack/defs/rutbottom.ts` (the track: start line at
  s 0 ≈ (1124, -543) heading east; corners Hay Fever, the Berm (bank 4 at ~(1378, -598)), Gravel Hat, Mudguard Dip,
  Cowpat Corner, Last Orders; jumps Clary's Hump s 150 and Teasel's Table s 500; whoops s 50-110, 575-640, 1030-1090)
- `src/raceTrack/trackMesh.ts` (`buildDirtTrackSurface(scene, track, { prefix })`), `src/raceTrack/trackDressing.ts`
  (how the Speedway lays barriers along `barrierOffset` with gaps, decks for the crowd, colliders) and
  `src/raceTrack/crowd.ts` (`createCrowd(scene, decks)` → `update(dt, px, pz, excitement)`), `src/raceTrack/index.ts`
  (crowd sounds with `playAt('crowd-murmur' | 'crowd-cheer', ...)`)
- `src/pardonlin/town.ts` (`buildStaticCells`, round colliders, `buildSignText(signs)` exported; types `PlanProp`,
  `PlanSign`, `Vignette` in `src/pardonlin/plan.ts`), `src/ambientGnomes.ts` (`createAmbientGnomes(scene, defs)`),
  `src/homes/data.ts` (`registerHome`, `homeOf`)
- prefabs: `rutbottom-starter-tower`, `capwood-stage-flag` (new, `packages/prefabs/src/catalog/gta-dirt-rally.ts`),
  existing `hay-bale`, `haystack`, `tyre-pile`, `speedway-tyre-stack`, `speedway-sneaker-stand`, `speedway-cooler-stand`,
  `speedway-pit-garage`, `speedway-banner`, `spare-tyre-pack`, `dirt-mower-bike` (the Knobbly)
- lore: `docs/lore/entries/apocrypha/rutbottom-dirt-bowl.md`, `clary-mudguard.md`, `the-knobbly.md`, rulings R-189..R-192

## Change
- `src/rutbottom/plan.ts` (new, pure data): props, signs, vignettes, residents for the bowl, like a Pardonlin district
  plan. Barriers: hay bales every ~2.5 m along both sides at `barrierOffset` (10 m) from the centre line, tyre stacks on
  the outside of each banked corner, a gap at `PIT_GAP` on the west straight's outside (right, -n) side, and a gap on the
  south side opposite the tower is NOT needed. Pits in `PITS`: `speedway-pit-garage` or a lean-to of props, a tool
  bench, spare tyres, a bike-wash bucket, a lane of dirt from `BOWL_GATE` to the pit gap (a draped dirt ribbon, layer as
  the track's run-off). The tower `rutbottom-starter-tower` at `STARTER_TOWER`. A grandstand (`speedway-sneaker-stand` or
  `speedway-cooler-stand`) in `GRANDSTAND` facing north. Sponsor boards (`speedway-banner`) with gnome jokes.
  Storytelling (acceptance criteria, all required):
  - at least 4 vignettes with a `story` sentence each: e.g. a Knobbly nose-first in the Berm with a chalk "the berm
    remembers" tally on a board beside it; Clary's trestle with countdown cards fanned out ("3", "2", "GO ON THEN") and
    a tea flask; a pile of mud-caked boots outside the bike wash with one clean pair and a note; Teasel's practice cones
    knocked over in a line, one on top of a hay bale; spectators' muddy umbrellas left on the grandstand rail;
  - at least 6 signs (`PlanSign`, text via `buildSignText`) with jokes that fit the lore: e.g. "RUTBOTTOM DIRT BOWL —
    est. the year it rained", "Spectators WILL get muddy. That is the ticket.", "WHOOPS (not an apology)" at each whoops
    section, "THE BERM REMEMBERS" at the Berm, "Pits: Knobblies only. Mowers by apology.", a fixtures board ("Saturday:
    Heats. Sunday: hosing down.");
  - residents (`AmbientGnomeDef`): Clary at `CLARY_SPOT` with her starter's flag look (from `_env.md`) and a bored
    starter bubble line ("Three. Two. Go on, then."); a pit mechanic (a Carburettor) at work; a mud-pie seller or a
    spectator at the grandstand. Teasel is the quest giver at `TEASEL_SPOT` (another worker places his giver marker): add
    a resident Teasel only if the giver system does not draw a gnome there (check how `giver/speedway` is drawn).
- `src/rutbottom/index.ts` `createRutbottom(scene, world, deps)`:
  - `buildDirtTrackSurface(scene, TRACKS.rutbottom, { prefix: 'rutbottom' })`;
  - builds the plan with `buildStaticCells(..., { lights: false, name: 'rutbottom' })`, colliders into `world.boxes`
    (barrier rows as boxes along each straight run between gaps, the tower's legs as one box, round boxes for tyre
    stacks; no collider shares a face with another);
  - `registerHome({ ...homeOf('clary')!, door: [x, z, yaw] })` at the tower's ladder;
  - the crowd on the grandstand deck with `createCrowd`, crowd murmur near the stand and a cheer when a vehicle passes
    the stand fast (> 14 m/s within 30 m) — the same pattern as `raceTrack/index.ts`; excitement up while a race is
    running (`raceActive()` from `src/raceTrack/state.ts`);
  - a free-roam lap timer: `TRACKS.rutbottom.tracker()` fed with the player's position every frame while inside the
    site rect; on 'lap' toast `Rutbottom lap 1:02.3 (best 0:58.9)` (best kept in memory only, no save) and on the first
    lap `deps.toast('Clary: "Go on, then. Again."')`; do not run while `raceActive()`;
  - `blips()`: `{ x: 1200, z: -650, color: '#9a7a52', kind: 'speedway' or the kind used for venue landmarks, label: 'Rutbottom Dirt Bowl' }`.
- `src/rutbottom/plan.test.ts` (new): every prop inside `siteRect('dirt-track')`; no prop (except barriers and
  signs meant to be trackside) within `width / 2 + 1` of the centre line (`TRACKS.rutbottom.locate`); hay-bale barrier
  has the `PIT_GAP` gap; counts (>= 4 vignettes, >= 6 signs, >= 3 residents); `createRutbottom` builds into a
  `THREE.Scene` under the fake DOM (`installFakeDom`, see `src/raceTrack/trackMesh.test.ts`) and adds colliders.

## Contract
Keep `createRutbottom(scene, world, deps): Area`. Do not edit `spots.ts` values (the quest worker uses them).

## Done when
- `npx tsc --noEmit -p .` passes for your files.
- `npx vitest run src/rutbottom src/raceTrack/trackMesh.test.ts` passes.
- Report: barrier counts and gaps, vignettes (name, x, z, story), sign texts, residents, sound ids, what you could not do.

## Out of scope
`raceTrack/*` (use the APIs, do not edit), `capwood/*`, quests, `app.ts`, prefab files.

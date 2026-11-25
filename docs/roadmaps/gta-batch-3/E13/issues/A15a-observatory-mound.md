Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: general-purpose (Sonnet): the observatory, the mound's dressing and storytelling

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
`src/campus/observatory.ts` builds the top and the foot of the Anthill: the Anthill Observatory on the summit, the
summit forecourt and its view, Dean's Leap's signs and run-up, the ants' three doors with their story, at least three
vignettes on the mound, and Professor Betony Sextant at work outside the dome; at run time the ants are heard at their
doors, the dome whirrs, and Sextant moves.

## Background (confirmed)
- Places (`src/campus/types.ts` `OBSERVATORY`): summit (1240, 150), flattened within `flatR` 30 (another worker shapes
  the ground right now: before that lands, `heightAt` there is a rounded hilltop, so always read `heightAt` at build time
  and never hard-code heights); `dome` (1258, 158) r 9; `door` (1247.5, 158) yaw -PI/2 (the dome's door faces west);
  `telescope` (1258, 158); `rampId` 'deans-leap': the ramp is a wedge (another worker's, in `stunts.ts`) at (1238, 126),
  yaw PI (launches north), 8 wide, 18 long, lip at z 117; `runUp` from (1238, 182) to (1238, 135) (keep 4 m either side
  clear: x 1234..1242 has no colliders and no props between z 117 and 182); `leapClear` x 1212..1264, z 20..118 (the
  landing area: no props at all); `roadEnd` (1238, 182) where the dirt road arrives on the summit; `antDoors` north
  (1172, 82) yaw -2.36, east (1338, 170) yaw 1.77, south (1236, 256) yaw 0 (yaw faces out of the mound). The mound's
  flanks are steep (up to ~30 degrees): stand doors and props on `heightAt` and keep them small near the slope.
- Prefabs (new E13 ones are being added right now; a missing id is skipped with a warning): `anthill-observatory`
  (life-size, 18 across, door on its +z), `ant-door` (~2.2 tall, faces +z), `sugar-sack`, `sugar-cube-crate`,
  `rootwell-ant` (one ant carrying a sugar cube, ~0.3 long), `chalk-equation-board`, `essay-page`; existing
  `gsr-telescope-stand` (a coin lookout telescope), `bench`, `park-bench`, `signpost`, `site-barrier`, `site-cone`,
  `crate`, `lamp`, `garden-lamp-post`, `picnic-table`.
- Helpers: `src/homes/pieces.ts` `buildPieces` (returns colliders: push into `boxes`), `textPlate`, `prefabBox`;
  `src/homes/data.ts` `homeOf('betony')`, `registerHome` (door `[x, z, yaw]`); `src/gnomes.ts` `makeGnome(group, look)`
  and `gnomeState` (see `src/winter/hill.ts` for a resident built and animated this way); `src/sound/bus.ts`
  `playAt(id, { x, z }, { bus: 'ambience' })` with the new ids `ant-skitter` and `telescope-whirr` (another worker adds
  their recipes; `playAt` simply returns false for an unknown id until then); `src/cull.ts` `registerCull(obj, 'gnome')`.
- Sextant (`docs/lore/entries/apocrypha/betony-sextant.md`): an astronomer, quiet, very exact, coat with too many
  pockets; surveyed the stars for a perfectly level line. Her interior desk is another worker's
  (`observatoryInterior.ts`). `installObservatory` must also call `setTelescopeClock(() => deps.timeLabel())` from
  `./observatoryInterior` (the interior worker implements it).

## Read first
- `games/gnome-theft-auto/src/campus/types.ts`; `src/campus/observatory.ts` (stub: keep both signatures).
- `games/gnome-theft-auto/src/winter/hill.ts` (pieces, plates, tilted props, a resident and its `update`).
- `games/gnome-theft-auto/src/homes/pieces.ts`, `src/homes/data.ts`.
- `docs/lore/entries/apocrypha/the-anthill.md`, `anthill-observatory.md`.

## Change
`src/campus/observatory.ts`:
- `buildObservatory(scene, boxes)`:
  - The dome: `anthill-observatory` at `dome` with yaw -PI/2 (its door faces west, toward `door`), solid (its collider is
    the prefab's square bounds; check it does not reach `runUp`'s 4 m corridor or cover `door`; if the square box is too
    big, use `solid: false` and push a box of your own 0.75 x r on each side instead).
  - The forecourt: 2 `park-bench`es on the south-east rim facing out over the view, a `gsr-telescope-stand` on the west
    rim pointing at the campus, 3-4 lamps round the forecourt, a `signpost` at `roadEnd` "THE ANTHILL OBSERVATORY\nPLEASE
    WIPE YOUR FEET\n(THE ANTS LIVE BELOW)".
  - Dean's Leap: a `signpost` beside the run-up start (x ~1245, z 184) "DEAN'S LEAP\nNOT A SHORTCUT", two rows of
    `site-cone`s lining the run-up's edges (x 1233 and 1243, every 8 m from z 140 to 178, `solid: false`), and a small
    plate on the ramp's side "THIS WAY DOWN" (mount it on a post beside the lip, outside the 8 m ramp width).
  - The ants' doors: an `ant-door` at each `antDoors` point, yaw as given, stood into the slope (sunk 0.4 m so its frame
    meets the ground: `y: -0.4`), solid. At each a story: north door (the main one, facing the campus): a nailed-up
    invoice plate "SUGAR RENT\nOVERDUE\n(AGAIN)" beside it and a little heap of `essay-page`s (unpaid notices) on the
    ground, the door shut; east door: an empty `sugar-cube-crate` upside down; south door: a doormat decal and a
    `sugar-sack` waiting with a plate "RETURN TO SENDER". Lines of 8-12 `rootwell-ant`s walking up to each door (solid
    false), one line carrying cubes in, one coming out empty.
  - Vignettes on the mound (at least three, outside `leapClear` and the road): (1) at the landing area's edge (just
    outside `leapClear`, e.g. x 1266-1272, z 60-90): skid-mark decals (dark strips, `flatLayer(mat, LAYER.decal)`, laid on
    `heightAt`) curving off the slope, a lost hubcap (a small grey `cyl`... no: use a prefab such as `glaze-rim-turbine` or
    another wheel rim if one exists, else skip the hubcap) and a plate on a `signpost` "LANDING: OPTIONAL"; (2) on the
    summit's south side: a deck chair (a `bench`) facing the sky with a thermos (a small prefab) and star charts held
    down with stones (`essay-page`s with small rocks; flat), Sextant's night kit; (3) a theodolite-like survey post (a
    `signpost` without text + a `chalk-equation-board` reading "LEVEL LINE:\nNEARLY") on the north rim west of the run-up,
    with a string line (a thin dark box) pegged out dead straight toward the campus: the survey the HOA took.
  - Sextant's home: `registerHome({ ...homeOf('betony')!, door: [door.x, door.z, door.yaw] })` with
    `OBSERVATORY.door`.
  - Everything in one `buildPieces(scene, pieces, 'anthill')` call plus one `THREE.Group` 'anthill-story' for plates,
    decals and odd-angled props.
- `installObservatory(deps)`: returns a `RootwellPart`:
  - Betony Sextant (`makeGnome`: coat 0x3b4a6b with a look that reads 'astronomer': glasses true if the look has them,
    grey-white hair/beard 0xd8d8d8, hat 0x2b3f7a), standing 5 m south-west of the dome door beside the summit's survey
    post, looking through a `gsr-telescope-stand` or with an arm raised toward the sky every 8 s; she turns to face the
    player when the player is within 6 m. Skip all work when the player is more than 250 m away.
  - Sounds: every 5-9 s, if the player is within 25 m of an ant door, `playAt('ant-skitter', door)`; every 20-30 s, if
    within 45 m of the dome, `playAt('telescope-whirr', dome)`; both `{ bus: 'ambience' }`.
  - `setTelescopeClock(() => deps.timeLabel())`.
- New `src/campus/observatory.test.ts` (vitest, `installFakeDom`): after `buildObservatory(new THREE.Scene(), boxes)`:
  no collider within the run-up corridor (x 1234..1242, z 117..182) or inside `leapClear`; no collider contains
  `OBSERVATORY.door` or `roadEnd` (1 m margin) or a 3 m circle round the north ant door's outside spot (2.5 m out along
  its yaw); `homeOf('betony')!.door` is set; `installObservatory(fakeDeps).update(0.1, 1)` does not throw (build a
  minimal deps object cast with `as never` holding `player: { x: 1240, z: 150 }`, `scene`, `timeLabel: () => null`).

## Contract
`buildObservatory(scene, boxes): void`, `installObservatory(deps): RootwellPart` (stub signatures).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/campus/observatory.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/campus/observatory.ts` / its test.

## Out of scope
Every other file (`observatoryInterior.ts`, `stunts.ts`, the terrain and level documents are other workers').

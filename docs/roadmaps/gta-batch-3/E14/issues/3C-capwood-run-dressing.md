Epic: E14-3 (places and quests)
Depends on: E14-2 (merged in the worktree: the route, `buildDirtTrackSurface`, prefabs)
Worker: Sonnet (general-purpose) — dressing, ford water, environmental storytelling

## Environment
Read `docs/roadmaps/gta-batch-3/E14/issues/_env.md` first (worktree, toolchain, rules, places, people, contracts).

## Goal
The Capwood Run as a place along its whole length, built in `src/capwood/run.ts`: the dirt road surface, the start
paddock with its pavilion, stage flags at the gates, a finish arch, the two Cap-water ford pools you can see and splash
through, ford signs, signs and story vignettes along the route, a marshal and spectators, sound, and a map blip.

## The route (`src/raceTrack/defs/capwoodRun.ts`, `TRACKS['capwood-run']`)
Open track, 2732 m, width 9, barrierOffset 8, start line s = 36 near (90, -746) heading north out of the paddock
(x 70..110, z -775..-745; all four `gridSlot`s stand in it), four banked hairpins up the west flank, a ledge at
z -870, past the summit (300, -900) at s ≈ 1788 (road ≈ 38 m up), the jump "the Puffball Pop" at s 1900, down the east
flank, S-bends through Capwood, fords "the Gill Ford" s 2244 (len 30, depth 0.35) and "Spore Splash" s 2411 (len 28,
depth 0.4), finish line s 2707 near (140, -1288). Quests use the paddock: Lugnut Lulu's giver marker stands 10-14 m
beside `gridSlot(0)` away from the road (another worker places it): keep that spot and the grid clear.

## Read first
- `games/gnome-theft-auto/src/capwood/run.ts` (stub; keep the signature), `src/capwood/spots.ts`, `src/raceTrack/trackDef.ts`
  (`fordAt`, `roadTopAt`, `frame`, `gates`), `src/raceTrack/tracks.ts`
- `src/raceTrack/trackMesh.ts` (`buildDirtTrackSurface(scene, track, { prefix })`), `src/terrain.ts` (`waterAt`
  returns `{ surface, depth, ford: true }` in a ford)
- `src/pardonlin/town.ts` (`buildStaticCells`, colliders, `buildSignText(signs)` exported; `PlanProp`/`PlanSign`/
  `Vignette` in `src/pardonlin/plan.ts`), `src/ambientGnomes.ts`, `src/waterMesh.ts` (how water is drawn: material,
  layer, transparency), `src/sound/ids.ts` + `src/sound/index.ts` (`playAt`), `src/raceTrack/state.ts` (`raceActive()`)
- prefabs: `capwood-start-pavilion`, `capwood-ford-sign`, `capwood-stage-flag` (new, in
  `packages/prefabs/src/catalog/gta-dirt-rally.ts`), existing `olympic-finish-arch` (check its size; else build an arch
  from two `capwood-stage-flag`s and a banner), `hay-bale`, `tyre-pile`, `stepping-stone`, `euro-hatch` (car prefab id:
  `grep -n "'euro-hatch'" src/config.ts`), camp chairs/coolers/flasks (search the catalog)
- lore: `docs/lore/entries/apocrypha/capwood-run.md`, `the-carburettors.md`, `lugnut-lulu.md`, ruling R-189

## Change
- `src/capwood/runPlan.ts` (new, pure data): props, signs, vignettes, residents along the route, each placed with
  `track.frame(s, lat)` so it follows the line (outside `barrierOffset`, i.e. |lat| >= 9, unless it is meant to be on
  the road like a gate flag pair at exactly ±(width/2 + 1.5)). Required:
  - the start paddock: `capwood-start-pavilion` beside the grid, hay bales round the paddock edge (not across the exit),
    a start banner over the line (two flag poles and a banner plaque sign);
  - stage flags: a `capwood-stage-flag` pair at every intermediate gate (`gates()` 1..12), tint alternating
    orange/white; a finish arch at the finish gate; hay bales on the outside of each hairpin and tyre stacks at the jump;
  - each ford: two `capwood-ford-sign`s (one each side, before the water), a few `stepping-stone`s across the shallow
    edge beside the road, reeds/mushroom filler;
  - at least 4 vignettes with a `story`: e.g. at the summit a hatchback (prefab of `euro-hatch`) with its bonnet up, a
    flask and an unfolded map on its roof, a "LOST?" note; at the Gill Ford a ride-on mower parked mid-water with its
    driver's boots drying on the seat and a "Cap-water: it's FINE" sign; at a hairpin spectators' camp chairs, a cooler
    and a cardboard "SEND IT" sign; a stump with a collection of lost hubcaps nailed to it at the bottom of the descent;
  - at least 6 signs (jokes that fit the lore): "THE CAPWOOD RUN — Stage start. Carburettors only. (Everyone is a
    Carburettor today.)", "FORD AHEAD. Cap-water. Your engine will be fine. Your socks will not.", "Hairpin. No. Tighter.",
    "SUMMIT. Admire the view later.", "Section Nine applies beyond this point" at the forest edge, a fines board at the
    finish;
  - residents: a rally marshal (a Carburettor: orange hat, black clothes) with a clipboard at the start, a spectator at
    a hairpin, a ford marshal in waders at the Gill Ford.
- `src/capwood/run.ts` `createCapwoodRunDressing(scene, world, deps)`:
  - `buildDirtTrackSurface(scene, TRACKS['capwood-run'], { prefix: 'capwood-run' })`;
  - builds the plan with `buildStaticCells(..., { lights: false, name: 'capwood-run' })`, colliders into `world.boxes`
    for the pavilion, car, signs and hay bales (round boxes for posts; never on the road);
  - ford pools: for each ford, one mesh of the water surface: a grid of quads covering the ford (along `len` + 4 m,
    across ±`reach` (barrierOffset + 4)) at `y = fordAt(...).surface`, keeping only quads where water stands
    (`waterAt(x, z)?.ford`), in a thick, slow, translucent mossy-brown-green Cap-water colour (opacity ~0.75), drawn on
    the water layer `waterMesh.ts` uses (or `LAYER.water` if it exists) so it never z-fights the road; a gentle slow
    ripple (scroll a texture offset or wobble a uniform) is enough;
  - sound: a crowd murmur at the start paddock while within 60 m, a water burble at each ford within 40 m, using
    existing sound ids (`src/sound/ids.ts`);
  - `blips()`: `{ x: 90, z: -760, color: '#ff7a00', label: 'the Capwood Run' }` (kind: the one used for venues).
- `src/capwood/runPlan.test.ts` (new): every prop at |lat| >= barrierOffset + 0.5 except the gate flags and the start
  banner; none on another track or inside a building site other than `rally-route` / `toadstool-forest`; none within
  12 m of `gridSlot(0..3)` except the pavilion and paddock bales; counts (>= 12 flag pairs, >= 4 vignettes, >= 6 signs,
  >= 3 residents); `createCapwoodRunDressing` builds under the fake DOM (`installFakeDom`, see
  `src/raceTrack/trackMesh.test.ts`) and each ford pool mesh exists with its material polygon-offset or on a water layer.

## Contract
Keep `createCapwoodRunDressing(scene, world, deps): Area`. Do not edit the route or `spots.ts`.

## Done when
- `npx tsc --noEmit -p .` passes for your files.
- `npx vitest run src/capwood/runPlan.test.ts src/raceTrack/capwoodRun.test.ts` passes.
- Report: vignettes (name, x, z, story), sign texts, residents, sound ids, ford pool sizes.

## Out of scope
`capwood/forest.ts` and `capwood/forestPlan.ts` (another worker), `spots.ts`, `raceTrack/*`, quests, `app.ts`, prefab files.

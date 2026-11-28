Epic: E15-A (Hedgeworth Links, parallel wave)
Depends on: none
Agent: general-purpose (Sonnet): scenery layout over a large area, performance and the mowable-plant rules

Read `docs/roadmaps/gta-batch-3/E15/issues/_env.md` first (environment, rules).

## Goal
`games/gnome-theft-auto/src/golf/yard.ts` builds the neighbour's yard round the course: the Tall-One board fence with
the Kicked Board (loose; breakable; then a plank pile and a gap) and the locked Members' Gate, solid hedge walls with
hedge arches, tall grass lining every hole (mowable: you drive through it), giant plants (no collider: you drive
through them too, they slow you), and the cart-path approach from the road. It must look lush ("big hedges, tall grass
and large plants line the course") and stay cheap to draw.

## Read first
- `games/gnome-theft-auto/src/golf/types.ts`: `YARD`, `FENCE_INSET`, `FENCE_H`, `KICKED_BOARD`, `MEMBERS_GATE`,
  `HEDGES`, `HEDGE_ARCHES`, `ARCH_GAP`, `HEDGE_H`, `HEDGE_T`, `CART_PATHS`, `inPlay`, `inYard`, `HOLES`, `CLUBHOUSE`,
  `PRO_COTTAGE`, `SHED`, `CART_SHELTER`, `TERRACE`, `LOST_BALLS`, `MOLEHILLS`, `SOFT_SLOW_PER_S`.
- `games/gnome-theft-auto/src/golf/yard.ts`: the stub (keep `YardScenery` and `buildYard` exactly).
- `games/gnome-theft-auto/src/homes/pieces.ts` (`HomePiece`, `prefabBox`, `planPieces`, `buildPieces`, `textPlate`).
- `games/gnome-theft-auto/src/flora/harvest.ts` (`addMowablePlants`: mowable plants go to flora and get NO collider)
  and `src/flora/kinds.ts` (`PLANT_KINDS`: `ornamental-grass` 1.07 m, `wheat-patch` 0.40, `reed-bed` 1.40,
  `round-bush`, `fern-clump`, `wildflower-patch` are mowable up to `FLORA.maxMowHeight` 1.8 m placed height;
  `hedgerow` and `hedge-arch` are never mowable and keep colliders).
- `games/gnome-theft-auto/src/cull.ts` header (`buildStaticCells` with `cls`, how static batches are culled).
- `games/gnome-theft-auto/src/winter/hill.ts` lines 1-130 (a recent builder of a big outdoor place: helpers, text
  plates, prefabs guarded with `getPrefab`).
- Prefabs: `hedgerow`, `hedge-arch` (`packages/prefabs/src/catalog/gta-landscaping.ts`), `giant-grass-blade`
  (`gta-wild-life.ts`), `giant-flower` (`props.ts`), and three new ones another worker is making right now in
  `packages/prefabs/src/catalog/gta-golf.ts` / `gta-golf-plants.ts`: `board-fence-panel` (2.0 wide, 2.6 tall, front +z),
  `kicked-board-panel` (2.6 wide), `fence-plank-pile`, `members-gate` (7 wide), `giant-hosta` (~3.2 wide, 2.4 tall),
  `giant-fern` (~3 wide, 2.8 tall), `giant-foxglove` (~1.2 wide, 4 tall), `sprinkler-head`. They may not exist when you
  start: guard each with `getPrefab(id)` and skip what is missing (log once), so the build works either way.

## Change
`src/golf/yard.ts`, `buildYard(scene, { boardBroken })`:
- **Fence**: `board-fence-panel`s end to end on all four sides on the line `FENCE_INSET` m inside `YARD` (yaw so the
  boards' face looks OUT of the yard: the neighbour's fence is seen from the road), leaving two gaps on the east side:
  the Kicked Board gap (`KICKED_BOARD.z ± half`) and the gate gap (`MEMBERS_GATE.z ± half`). Colliders: one thin long
  box per straight run (thickness 0.4, top = ground + FENCE_H), not one per panel; never a box across the Kicked Board's
  gap except `boardBox`.
- **Kicked Board**: two `kicked-board-panel`s filling its gap (when not broken), and `boardBox` (thin box across the
  gap, top FENCE_H). `breakBoard()`: hide those panels, show a `fence-plank-pile` on the ground just inside the gap
  (yard side) and another just outside, idempotent. When `boardBroken` is true at build, build it broken. Keep the
  panel meshes in their own small group (not baked into a static batch) so they can be hidden.
- **Members' Gate**: `members-gate` in the gate gap facing east, solid (a collider across the gap), a text plate
  `MEMBERS ONLY` on its plaque (`textPlate` from homes/pieces, 0.03 in front) and a second small plate on the left pier:
  `NON-MEMBERS: PLEASE USE THE OTHER SIDE OF THE FENCE`. A gravel strip (flat ribbon, `flatLayer(mat, LAYER.road)`, 3 m
  wide) from the road at (-950, 500) to the gate (-1001, 500) outside the fence (the members' approach), with a
  `yardage-post`-free plain look; and a trampled grass track (`LAYER.tint`, 2.5 m wide, darker green) from the road to
  the Kicked Board on the outside: everybody's way in.
- **Hedge walls**: along each `HEDGES` line, `hedgerow` pieces scaled so they are `HEDGE_H` tall and about `HEDGE_T`
  thick (scale non-uniformly only if the prefab system allows; otherwise scale uniformly to HEDGE_H and accept the
  thickness), end to end, leaving an `ARCH_GAP` gap at each `HEDGE_ARCHES` point with a `hedge-arch` scaled to stand
  over the gap (its legs solid, the gap open). One collider box per straight hedge run on each side of an arch.
  Also a perimeter hedge band just inside the fence on the north, west and south sides (2 m inside), broken where cart
  paths come close, so the yard feels walled by green; skip any piece where `inPlay(x, z, 2)` is true.
- **Tall grass (mowable)**: lines of `ornamental-grass` and `wheat-patch` (placed heights under 1.8 m) in a band 4-10 m
  outside each fairway's edge (`distToLine(path) - fairwayWidth / 2` between 4 and 10), every ~2.5 m with seeded jitter,
  and denser clumps round the green fringes' outside (r + 6 .. r + 10); never where `inPlay(x, z, 1)` or within 3 m of a
  building, a tee, the terrace, a `LOST_BALLS` or `MOLEHILLS` spot. Pass all of them through `addMowablePlants(...)` and
  build what comes back with `buildStaticCells(..., { lights: false, name: 'hedgeworth-grass', cls: <the class cull.ts
  uses for small plants> })`. No colliders for them.
- **Giant plants (soft)**: 40-60 of `giant-hosta`, `giant-fern`, `giant-foxglove`, `giant-grass-blade`, `giant-flower`
  (scale 1.2-2.2) in the rough beyond the tall grass and in the middle of the course (x -1240..-1110, z 520..740), in
  clusters of 3-6, seeded (mulberry32 from `@lawn/level`), never `inPlay(x, z, 3)`, never within 4 m of a hedge line or a
  building. NO colliders (they are soft). Return each one's footprint in `soft` as `{ x, z, r }` (r = about 0.4 x its
  placed width). Bake them with `buildStaticCells` (cls for big scenery).
- **Sprinkler heads**: 10 `sprinkler-head`s at the edges of greens and along fairways (on the ground, no collider).
- `update(dt, t)`: nothing heavy; may wobble nothing. (Sprinkler spray belongs to life.ts.)
- New `src/golf/yard.test.ts` (fake DOM via `../testing/fakeDom` if prefabs need it): build with boardBroken false:
  `boardBox` spans the Kicked Board gap and is not in `boxes`; no collider in `boxes` overlaps the gate approach line
  outside the fence or any fairway/green (`inPlay` at box centre false, except fence/gate boxes on the fence line);
  every `soft` entry is inside the yard and not in play; building with boardBroken true still returns `boardBox` (the
  runtime just does not push it).

## Contract
`buildYard(scene, opts): YardScenery` exactly as the stub declares. `boardBox` is the only collider for the Kicked
Board gap; `breakBoard()` is visual only (the runtime splices `boardBox` out of world.boxes).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/golf/yard.test.ts src/golf/places.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.
- Report the counts: fence panels, hedge pieces, grass placements handed to flora, giant plants.

## Out of scope
Every other file. Course surfaces (greens.ts), buildings (clubhouse.ts), people, signs and vignettes (life.ts).

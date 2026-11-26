Epic: E32-B (nine holes, parallel build)
Depends on: none · Worker: sonnet (general-purpose)

First read `docs/roadmaps/gta-batch-3/E32/issues/_env.md` (environment + the foundation facts).

## Goal
The yard's structures cover the nine-hole course: the outer fence now runs round the grown yard (automatic from YARD),
the **old south fence** stands inside at z 829 with the open **Turn Gate**, the **hole 5 maze** hedges stand with
colliders, and every hedge wall is a believable thickness (E15's hedges look ~2.8 m thick because the `hedgerow` prefab
is scaled uniformly by ~2.8; fix it with a new tall thin prefab).

## Read first
- `games/gnome-theft-auto/src/golf/yard.ts` (400 lines): `planYard` (fence runs, `hedgeLine`, the lower hedge band,
  tall grass `bandOk`, giant plants `giantOk` / `roughOk` and the "middle" placement box, sprinklers), `buildYard`.
- `games/gnome-theft-auto/src/golf/yard.test.ts`, `games/gnome-theft-auto/src/golf/places.test.ts`
- `games/gnome-theft-auto/src/golf/types.ts`: `YARD`, `FENCE_INSET`, `FENCE_H`, `OLD_FENCE`, `TURN_GATE`, `HEDGES`,
  `HEDGE_H`, `HEDGE_T`, `HEDGE_ARCHES`, `MAZE_HEDGES`, `MAZE_H`, `inPlay`, `inYard`, `HOLES`, `POTTING_SHED`.
- `packages/prefabs/src/catalog/gta-golf.ts`: the `hedgerow` / `hedge-arch` / `board-fence-panel` defs (style to copy).

## Change
- `packages/prefabs/src/catalog/gta-golf-nine-garden.ts` (yours): add
  - `hedge-wall`: a clipped garden hedge wall segment, **4 m long (x), 3.2 m tall, 1.2 m deep (z)**, origin at the
    ground centre, front +z; a slightly irregular boxy mass in two or three leaf greens with a darker base and a few
    leaf-clump bumps on the top and faces (parts only, no textures). Category 'prop', uses ['place'], tags incl. 'gta',
    'hedge'. Five `examine` lines in the Hedgeworth voice (dry, gardening jokes).
  - `turn-gate`: a wooden garden gate standing **open** (two posts 2.2 m tall, 6.2 m apart along x, one leaf swung open
    90 degrees against the west post, a little arch-board across the top with no text), origin at the ground centre
    between the posts, front +z. A name plate is added in code, not in the prefab.
  - Run `npm test -w packages/prefabs` (report failures in other files without fixing them).
- `src/golf/yard.ts`:
  1. Hedge walls (`HEDGES`) use `hedge-wall` (fallback `hedgerow` when missing) scaled so the **height** is `HEDGE_H`
     (scale = HEDGE_H / 3.2 = 1); pieces along the line as now; collider thickness = the prefab depth × scale × 0.9
     (about 1.1 m) instead of `HEDGE_T + 0.6`. The lower band inside the fence keeps `hedgerow` but its scale must keep
     depth ≤ 1.4 m: use `hedge-wall` scaled to height 2.4 (scale 0.75, depth 0.9 m) there too.
  2. Maze: build every `MAZE_HEDGES` segment with `hedge-wall` at height `MAZE_H` (scale MAZE_H / 3.2) with colliders,
     no gaps (the ways through are where the walls end). `nearHedge` (tall grass / giants keep-out) must include
     `MAZE_HEDGES`. Add `hedge-arch` (existing prefab) as the maze's entrance at (-1318, 857), yaw 0, scaled like the
     E15 arches, legs solid; it must not stand on hole 5's tee box (tee at (-1318, 845), half 2.5 m) — it is 12 m south.
  3. Old south fence: a `fenceRun` along `z = OLD_FENCE.z` from the west fence to the east fence, faces +z (south),
     with one opening `TURN_GATE.x ± TURN_GATE.half`. Put the `turn-gate` prefab in the opening (y = ground, yaw 0)
     and **no collider** across the opening (gnomes and golf carts drive through); the posts get two small colliders
     (0.3 m squares at `TURN_GATE.x ± 3.1`). A text plate on the arch board, both faces: `HOLES 4 TO 8` on the north
     face and `THE TURN` on the south face (use `textPlate` from `../homes/pieces`, as `buildYard` does for the Members'
     Gate). The **east and west outer fence runs** currently split at fz0+1..fz1-1 — they now reach z 973 automatically;
     check the east run round the Kicked Board / Members' Gate is still right.
  4. The giant-plant "middle" box (`-1240 + rnd() * 130`, `520 + rnd() * 220`) stays where it is (E15's middle). Giants
     and tall grass in the Bottom Garden come from the whole-yard pass (it already reads YARD); make sure none lands on
     the potting shed (treat `POTTING_SHED` like a building in `nearBuilding`), and none inside the maze's corridors:
     skip giants with x < -1290 and z > 836 (the maze block) — the maze is clipped hedge, not jungle.
  5. Keep the `planYard(has)` purity and the YardPlan shape (you may add fields, e.g. `gates: Place[]`).
- `src/golf/yard.test.ts`: fix the failing test (counts grow with the bigger yard) and add: maze hedges have colliders
  that intersect hole 5's fairway line; no collider spans `TURN_GATE.x` at z 829; hedge collider thickness ≤ 1.4 m.
- `src/golf/places.test.ts`: add "maze hedges keep off every hole but 5" (sample each MAZE_HEDGES segment: not within
  `inPlay`-style distance of holes other than index 5 — compute with `distToLine` against each other hole's path +
  fairwayWidth/2 + 2, green r + 3, tee box) and "the Turn Gate opening is on the cart path" (a CART_PATHS point within
  3 m of (TURN_GATE.x, 829)... the path passes (-1140, 822) and (-1140, 840): assert the segment between them crosses
  z 829 within the opening).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/golf/yard.test.ts src/golf/places.test.ts` passes.
- `npm test -w packages/prefabs` passes for your two ids.
- `npx tsc --noEmit -p games/gnome-theft-auto` clean for your files.
- Screenshots (scratchpad `B5/`): `gate:-1140,815,0` (looking south through the Turn Gate) and `maze:-1318,840,0`
  (hole 5 tee looking into the maze) and `hedge:-1175,530,3.14` (an E15 hedge wall). Look at them; the hedges must read
  as clipped hedges about 1.2 m thick, the gate open.

## Out of scope
bottomGarden.ts (the shed, the birdbath, props: another issue), life.ts, course.ts (ball collision: another issue),
types.ts (the lead's; if a coordinate is wrong, report it, do not edit).

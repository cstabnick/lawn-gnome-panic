Epic: E02-1 Engine pieces
Depends on: none
Items: L01 ("driving around circular or just larger prefabs is hard. i cannot get my vehicle close to them without getting stuck")

(Environment: paste `_environment.md`.)

## Goal
Round scenery (tree trunks, round scattered prefabs, the stone fountain, the derby bowl finial, round posts) gets a round collider instead of a square box padded to the diagonal, so a vehicle can drive close round it and slide off instead of catching on an invisible corner.

## Read first
- `collide.ts`: `Box.shape` (in `types.ts`: `shape?: 'round'` = vertical cylinder centred on the box centre, radius half the shorter side), helpers `roundBox(cx, cz, r, h)`, `roundOf(b, r?)`, `placeRoundBox(boxes, cx, cz, r, h)`. Already done and tested; use them, do not edit collide.ts.
- `biomes.ts` lines ~35-80 (`Measure`, `localBox`, `measure`: the rotated bounding box of a prefab with a random yaw), ~122 `boxAt(rect, height)` (a Box with an absolute top via `topOf`), ~180 `addBox`, ~239 `drop` (a solid scattered prefab's collider: `addBox(boxAt({ minX: p.x - m.hw, ... }, m.h))`), ~266 `addSafeBox`, ~297 `tree` (a trunk collider: a square of half-size `t = trunkOf(id, scale)`).
- `world.ts` ~256 `boxOf(g)` and ~805 the `stone-fountain` collider.
- `layout.golden.test.ts` (top comment: how to regenerate `src/data/layout.golden.json`).

## Change
- `biomes.ts`:
  - `tree`: make the trunk collider round: wrap today's box in `roundOf(...)` (keep `boxAt` so the top stays absolute; same height expression).
  - `drop`: when the prefab's UNROTATED footprint is near-square (`lb = localBox(m.id)`; `w = lb.max.x - lb.min.x`, `d = lb.max.z - lb.min.z`; `Math.max(w, d) / Math.max(1e-6, Math.min(w, d)) <= ROUND_ASPECT`, new const `ROUND_ASPECT = 1.3`), register `roundOf(boxAt(rect, m.h), r)` with `r = 0.5 * Math.max(w, d) * m.s * ROUND_FILL` (new const `ROUND_FILL = 0.92`: the circle sits just inside the prefab's own half-size, not its rotated diagonal). Otherwise keep the square box exactly as now.
  - `addSafeBox`: add an optional parameter `round = false` (after `extraRoadClear`); when true push `roundOf(boxAt(b, b.h))`. Pass `true` at the round sites: the derby bowl centre finial (`cylGeo(1.1, 1.5, ...)` at ~706) and any other `addSafeBox` whose geometry right above it is a single `cylGeo` (check the calls at ~565, 579, 655, 681, 706, 716, 735, 801, 857, 879; boxes stay boxes).
- `world.ts`: the `stone-fountain` collider becomes `roundOf(boxOf(...))` (import `roundOf` from `./collide`). Leave every other `boxOf` as is.
- Regenerate the golden layout deliberately (the box list changed): from `games/gnome-theft-auto`, `UPDATE_GOLDEN=1 npx vitest run src/layout.golden.test.ts`, then run it again without the variable and confirm it passes.

## Contract
`Box.shape?: 'round'`, `roundOf`, `roundBox`, `placeRoundBox` from `collide.ts` (do not change them). No signature changes in biomes.ts or world.ts beyond the optional `round` parameter of the local `addSafeBox`.

## Done when
- `npx tsc --noEmit -p .` has no errors in biomes.ts / world.ts.
- `npx vitest run src/layout.golden.test.ts src/collide.test.ts src/terrainDrive.test.ts src/propsOffRoad.test.ts src/scenery.test.ts src/terrainWalk.test.ts` pass (after regenerating the golden once).
- Report how many colliders became round (count `shape === 'round'` in the built world's boxes with a throwaway log you remove afterwards).

## Out of scope
`collide.ts`, `types.ts`, vehicles, boats, camera. Do not move or resize any square box.

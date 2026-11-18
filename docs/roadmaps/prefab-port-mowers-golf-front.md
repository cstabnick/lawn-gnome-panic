# Prefab port: LGP mowers and critters, Gnome Golf, Gnome Front (plan notes, not yet decomposed into issues)

Done on this branch: Gnome Golf club was upside down. `buildHeld('golden-putter')` already hangs the head below
the grip; `party.ts` `makeClub()` then flipped it with `rotation.x = Math.PI`. The flip is removed.

## Decisions made while surveying

- Foundation (planner does it): new catalog files `mowers.ts`, `critters.ts`, `golf.ts`, `front.ts`,
  `front-weapons.ts` as empty stubs registered in `catalog/index.ts`; move `createCritterModel` out of
  `games/sample-3d/src/mowerModels.ts` into `critterModels.ts`; add `buildPrefabInstances(id, matrices, { tints })`
  to `@lawn/prefabs` (one InstancedMesh per part, per-instance colour on `tint` parts) for golf's hundreds of trees.
- Prefab materials are shared and cached, so hit flash swaps each mesh to one shared white `MeshBasicMaterial`
  instead of setting `emissive`. Viewmodel guns and Gnome Front capture-flag cloth clone their own materials.
- Animated parts use `name`d parts and `group` pivots: `wheel` meshes spin with `rotation.x` (works with
  `rot: [0,0,90]`), `reel`/`engine` groups, critter `body`, `leg-*` hips and `tail` (game reparents legs/tail into
  `body`), eye glows as `glow: true` parts named `eye-glow`, hidden by day. Headlight lamps and cones stay in game.
- Size test needs every side < 3: combine at 1/2 (build `scale: 2`), golf trees at 1/10, front shed 1/4,
  fountain 1/2, veggie bed 1/4, compost heap 1/3, HQ tent 1/2, banner and capture pole 1/3, cover pine 1/5.
  4-seat golf cart trimmed to at most 2.95 long (still inside CART_BOX).
- Gun prefabs: gun-space (x, y, z) maps to prefab (x, Y0 - z, y), `grip: [0, Y0, 0]`; build with `buildHeld`
  and `rotation.x = -Math.PI / 2`. Boxes [w,h,d] become [w,d,h]; AXIS_Z cylinders lose their rot and swap radii;
  upright gun cylinders get `rot: [90,0,0]`. Sight posts use SIGHT_Y from `player.ts`.
- `games/gnome-golf/src/models/mowerModels.ts` and `games/gnome-front/src/models/mowerModels.ts` are byte copies of
  LGP's: recopy once the LGP version builds from prefabs.

## Epics

1. Foundation (planner).
2. Parallel issues: A LGP mowers, B LGP critters, C golf cart/flagstick/tee marker/trees, D front weapons,
   E front world props (shed, fountain, veggie bed + cabbage, compost heap, HQ tent, banner, capture flagpole,
   bush, cover pine).
3. Recopy mowerModels to golf and front, builds, prefab tests, smoke, demos, PR.

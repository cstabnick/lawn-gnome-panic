# Lawn Gnome Panic: finish the @lawn/prefabs port

Goal: every item, pickup and yard prop in `games/sample-3d` is a `@lawn/prefabs` model, placed where its collider or
pickup point is. #159 ported seven obstacle kinds, the pickup acorn and the trowels, but left them at the world
origin (fixed on this branch by `prefabProp()` in `games/sample-3d/src/props.ts`) and left the rest hand-built.

Stays in the game (not objects a prefab expresses): mowers (enemy characters), the house, off-lawn scenery,
terrain, the kiddie pool, the 55-60 m trees, and weapon effects (spines, water beams, rings, puffs, the pitchfork
sweep whose tine spacing changes per level, the instanced trowel storm).

| Epic | Done when | Issues |
|---|---|---|
| 1. Port | `npm run build -w games/sample-3d` and `npm test -w packages/prefabs` pass; every ported object checked in the running game | 3 (A items, B yard props, C drops + mushroom mine) |

All three issues edit disjoint files and run in parallel. Visual checks in the running game are done by the planner
after the epic (the dev server stays on port 5174; workers do not start servers).

## Issue A: item pickups as prefabs

~~~~text
Epic: 1 Port
Depends on: none

## Environment
Repo root: /Users/alex/cstabnick/lawn-gnome-panic (macOS, node on PATH). Dependencies are installed: do not run
npm install. Do not git commit. Do not run `vite build` or `npm run build` (writes dist/), and do not start a dev
server. Two other workers are editing other files at the same time: packages/prefabs/src/catalog/props.ts,
games/sample-3d/src/props.ts, games/sample-3d/src/drops.ts, games/sample-3d/src/weapons/mushrooms.ts. Do not touch them.

## Goal
The five rare item pickups in Lawn Gnome Panic (chicken, shopVac, weedKiller, espresso, compostBin) are built from
new @lawn/prefabs prefabs instead of hand-made meshes.

## Read first
- docs/roadmaps/prefab-library/_common.md: modelling rules, examine voice, checks. Follow them, except: its
  "Environment" section is for another worktree; use the one above.
- packages/prefabs/src/types.ts: PrefabDef / Part format (the contract).
- packages/prefabs/src/palette.ts: allowed colour names (or use 0xRRGGBB numbers).
- packages/prefabs/src/catalog/consumables.ts and packages/prefabs/src/catalog/tools.ts: style to copy; you append to these.
- games/sample-3d/src/items.ts: `buildModel(kind)` (the switch with the five cases) is what you replace.

## Change
- packages/prefabs/src/catalog/consumables.ts: append two PrefabDefs to the exported array:
  - id 'drumstick-platter', category 'food', uses ['eat','collect']: white round plate, a roast bird body
    (squashed brown ball) and two drumsticks angled out with white bone knobs. ~0.35 across.
  - id 'espresso-cup', category 'food', uses ['drink','collect']: white saucer, white cup (slightly wider at the
    top), dark brown coffee disc just below the rim. ~0.2 across.
- packages/prefabs/src/catalog/tools.ts: append three PrefabDefs:
  - id 'shop-vac', category 'tool', uses ['place','collect']: red canister, black lid, black hose arching from
    the side, grey nozzle. ~0.4 tall.
  - id 'weed-killer', category 'tool', uses ['collect','place']: lime-green jug with a yellow band and black
    stripe, white neck and white trigger-spray head. ~0.45 tall.
  - id 'compost-bin', category 'container', uses ['open','place']: dark green box with a slightly wider lid and
    glowing purple (glow: true) edge strips along the lid's four top edges. ~0.45 wide.
  Every new prefab: `emoji: []` (do NOT add emoji: it would change which model other games get for an emoji),
  4-6 examine lines in the lore voice, lowest point at y = 0, centred on x/z.
- games/sample-3d/src/items.ts: add `import { buildPrefab } from '@lawn/prefabs';` and replace the body of
  `buildModel(kind)` so it builds the prefab and keeps the old contract "roughly 1 unit across, centred on the
  origin":
  ```ts
  const ITEM_PREFAB: Record<ItemKind, string> = {
    chicken: 'drumstick-platter', shopVac: 'shop-vac', weedKiller: 'weed-killer',
    espresso: 'espresso-cup', compostBin: 'compost-bin',
  };
  function buildModel(kind: ItemKind): THREE.Group {
    const g = new THREE.Group();
    const model = buildPrefab(ITEM_PREFAB[kind]);
    const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
    const s = 1 / Math.max(size.x, size.y, size.z, 1e-3);
    model.scale.setScalar(s);
    model.position.y = -(size.y * s) / 2;
    g.add(model);
    return g;
  }
  ```
  Put ITEM_PREFAB at module level. Delete the helpers that become unused inside createItemSystem (cyl, box, tor,
  std, mat, mats) but KEEP `geo`, `geos`, `sph` and `part` (addSteam uses sph and part). Keep addSteam, the
  beacon, the ring and everything else unchanged.

## Contract
- `buildModel(kind: ItemKind): THREE.Group` keeps its signature; result is ~1 unit across, centred on the origin.
- New prefab ids exactly: drumstick-platter, espresso-cup, shop-vac, weed-killer, compost-bin.

## Done when
- `npm test -w packages/prefabs` passes for every test whose name contains one of your five ids (failures in
  props.ts prefabs belong to another worker mid-edit; ignore those).
- `npx tsc --noEmit -p games/sample-3d` reports no error in games/sample-3d/src/items.ts.
- `npx tsc --noEmit -p packages/prefabs` reports no error in consumables.ts or tools.ts.

## Out of scope
packages/prefabs/src/catalog/props.ts, any other catalog file, types.ts, palette.ts, build.ts, catalog/index.ts,
games/sample-3d/src/props.ts, drops.ts, weapons/*, config.ts.
~~~~

## Issue B: yard props as prefabs

~~~~text
Epic: 1 Port
Depends on: none

## Environment
Repo root: /Users/alex/cstabnick/lawn-gnome-panic (macOS, node on PATH). Dependencies are installed: do not run
npm install. Do not git commit. Do not run `vite build` or `npm run build` (writes dist/), and do not start a dev
server. Two other workers are editing other files at the same time: packages/prefabs/src/catalog/consumables.ts,
packages/prefabs/src/catalog/tools.ts, games/sample-3d/src/items.ts, games/sample-3d/src/drops.ts,
games/sample-3d/src/weapons/mushrooms.ts. Do not touch them.

## Goal
Lawn Gnome Panic's remaining hand-built obstacle props (brick, bush, flower, cactus, tumbleweed) become
@lawn/prefabs prefabs placed through the existing `prefabProp()`, and the dead builders left by an earlier port
are deleted.

## Read first
- docs/roadmaps/prefab-library/_common.md: modelling rules, examine voice, checks. Follow them, except: its
  "Environment" section is for another worktree; use the one above.
- packages/prefabs/src/types.ts: PrefabDef / Part format (the contract).
- packages/prefabs/src/palette.ts: allowed colour names (or 0xRRGGBB numbers).
- packages/prefabs/src/catalog/props.ts: style to copy; you append to its PROPS array.
- games/sample-3d/src/props.ts: `PREFAB_PROPS`, `prefabProp(id, o)`, `buildProp(o)`, and the hand-built
  builders bush/brick/flower/cactus/saguaro/barrel/tumbleweed (copy their look and colours).

## Change
- packages/prefabs/src/catalog/props.ts: append six PrefabDefs (category 'prop', uses ['place'], `emoji: []`,
  4-6 examine lines in the lore voice, lowest point y = 0, centred, largest side under 3):
  - 'brick-stack': three clay-red bricks stacked, the middle one turned ~15 degrees. ~0.25 tall.
  - 'flowering-bush': a cluster of 5 overlapping green balls (two greens, 0x2e6b2e-ish and 0x3d8f3d), wider than
    tall, with 5 small pink/white flower dots on top. ~0.5 tall, ~0.9 across.
  - 'giant-flower': a tall green stem, two flat leaves, 8 petals (c: 'tint') round a yellow centre, the bloom
    tilted slightly toward +z. Set `tint: 'pink'` (or a palette name) as default. ~1.2 tall, bloom ~0.6 across.
  - 'saguaro': tall ribbed green trunk with a rounded top, two arms (out then up, rounded tips), a few light
    spines. ~1.5 tall.
  - 'barrel-cactus': squat ribbed green ball (wider than tall) with 4 small yellow/pink flowers on top. ~0.35 tall.
  - 'tumbleweed': loose ball of 12-20 thin brown rings (s: 'ring', two browns 0xa07a4a / 0x8a6a3e) at fixed
    varied rotations, about 0.5 across. Fixed data, no randomness.
- games/sample-3d/src/props.ts:
  - Give prefabProp an optional tint: `function prefabProp(id: string, o: Obstacle, tint?: number): THREE.Group`
    and pass it as `buildPrefab(id, { tint })`. Keep the rest of prefabProp exactly as it is (it positions the
    prop on the terrain and fits its height; this is what keeps props from rendering at the world origin).
  - Route the kinds: add `brick: 'brick-stack'`, `bush: 'flowering-bush'`, `tumbleweed: 'tumbleweed'` to
    PREFAB_PROPS. In buildProp, before the PREFAB_PROPS lookup:
    `if (o.kind === 'cactus') return prefabProp(o.height > 12 ? 'saguaro' : 'barrel-cactus', o);`
    `if (o.kind === 'flower') return prefabProp('giant-flower', o, PETALS[hash % PETALS.length]);`
    with `hash` computed exactly as flower() does now from o.x and o.z (move that line into a small helper).
  - The Kit switch then only handles 'pool' and 'tree'. Delete every builder no longer called: stump, rock,
    birdbath, brick, flowerpot, bucket, plaqueMaterial, statue, bush, flower, wateringCan, cactus, saguaro, barrel,
    tumbleweed, plus helpers only they used (aim, limb, rng if unused). Keep Kit, mat, xf, pool, tree, PETALS and
    anything pool/tree still use. Remove imports that become unused (e.g. COLORS if nothing uses it).

## Contract
- `export function buildProp(o: Obstacle): THREE.Object3D` unchanged: the returned object is positioned at the
  obstacle (x, heightAt - 0.15, z) by prefabProp or Kit.
- New prefab ids exactly: brick-stack, flowering-bush, giant-flower, saguaro, barrel-cactus, tumbleweed.

## Done when
- `npm test -w packages/prefabs` passes for every test whose name contains one of your six ids (failures in
  consumables.ts/tools.ts prefabs belong to another worker mid-edit; ignore those).
- `npx tsc --noEmit -p games/sample-3d` reports no error in games/sample-3d/src/props.ts.
- `grep -nE "^function (stump|rock|bush|birdbath|brick|flowerpot|bucket|statue|flower|wateringCan|cactus|saguaro|barrel|tumbleweed)\(" games/sample-3d/src/props.ts` prints nothing.

## Out of scope
Other catalog files, types.ts, palette.ts, build.ts, catalog/index.ts, games/sample-3d/src/main.ts, config.ts,
items.ts, drops.ts, weapons/*.
~~~~

## Issue C: drop acorn and mushroom mine as prefabs

~~~~text
Epic: 1 Port
Depends on: none

## Environment
Repo root: /Users/alex/cstabnick/lawn-gnome-panic (macOS, node on PATH). Dependencies are installed: do not run
npm install. Do not git commit. Do not run `vite build` or `npm run build`, and do not start a dev server. Two
other workers are editing packages/prefabs/src/catalog/*.ts, games/sample-3d/src/items.ts and
games/sample-3d/src/props.ts at the same time. Do not touch them.

## Goal
The acorn that enemies drop and the mushroom mine weapon use existing @lawn/prefabs models ('acorn',
'red-mushroom') instead of hand-built meshes.

## Read first
- games/sample-3d/src/drops.ts: `makeAcornMesh()` and the shared nut/cap geometry and materials.
- games/sample-3d/src/pickups.ts: how the pickup acorn already uses the prefab:
  `buildPrefab('acorn', { scale: 3.0, tint: 'gold' })` with `position.y = -0.22` inside a group.
- games/sample-3d/src/weapons/mushrooms.ts: `buildMine()`, the `Mine` interface (field `cap: THREE.Mesh`),
  `disposeGroup()`, and the arming pulse `m.cap.scale.setScalar(...)`.
- packages/prefabs/README.md: buildPrefab; prefab geometry and materials are cached and shared, never dispose them.

## Change
- games/sample-3d/src/drops.ts: `makeAcornMesh()` returns a Group holding
  `buildPrefab('acorn', { scale: 2.0 })` with the prefab at `position.y = -0.15` (the acorn prefab is ~0.18
  tall at scale 1 and stands on y = 0; the drop's origin is its centre). Delete nutGeom, nutMat, capGeom, capMat
  and anything else that becomes unused. Leave the XP gem (an effect-like pickup) as it is.
  If drops.ts disposes acorn meshes' geometry/materials anywhere, skip prefab subtrees
  (`obj.userData.prefab` is set on a prefab root).
- games/sample-3d/src/weapons/mushrooms.ts:
  - buildMine: replace the stem, cap and spots with `const model = buildPrefab('red-mushroom', { scale: 1.7 });`
    added to `group` (red-mushroom stands on y = 0, ~0.21 tall at scale 1, so ~0.36 tall: same as the old mine).
  - Rename the Mine field `cap: THREE.Mesh` to `model: THREE.Object3D` and pulse it:
    `m.model.scale.setScalar(1.7 * (0.8 + 0.2 * Math.sin(time * 20)))` and reset with `m.model.scale.setScalar(1.7)`.
  - disposeGroup(group): do not descend into objects with `userData.prefab` set (shared cached geometry and
    materials), but keep disposing the blast effect's own meshes as now.
  - Add `import { buildPrefab } from '@lawn/prefabs';` to both files. games/sample-3d/package.json already
    depends on @lawn/prefabs.

## Contract
No exported signature changes. createDropSystem and the mushrooms weapon keep their exports.

## Done when
- `npx tsc --noEmit -p games/sample-3d` reports no error in drops.ts or weapons/mushrooms.ts (errors in items.ts
  or props.ts belong to other workers mid-edit; ignore those).
- `grep -n "SphereGeometry\|CylinderGeometry" games/sample-3d/src/weapons/mushrooms.ts` shows only blast-effect
  geometry, nothing in buildMine.

## Out of scope
packages/prefabs/*, games/sample-3d/src/items.ts, props.ts, pickups.ts, main.ts, config.ts, other weapons.
~~~~

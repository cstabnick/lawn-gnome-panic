# @lawn/prefabs: little 3D things for every game

About 190 prefabs (weapons, armor, shields, potions, food, materials, trinkets, keys, documents, tools, containers,
furniture, outdoor props), each drawn from a handful of Three.js primitives. No files, no textures: a prefab is data.
Every one carries tags, uses, the emoji it can stand in for, and 4 to 6 lines of in-world examine text.

Browse them: `npm run dev -w games/prefab-gallery` (search, tints, turntable, gnome for scale). `/?sheet` shows all of them
on one page; `/?sheet=weapon` shows one category.

## Use it

```ts
import {
  buildPrefab, buildHeld, buildStaticPrefabs, prewarmPrefabs,
  prefabIcon, prefabIconElement, prewarmPrefabIcons, createDrop, resolvePrefab,
} from '@lawn/prefabs';

scene.add(buildPrefab('wooden-chest'));                    // a THREE.Group standing on y = 0, front facing +z
scene.add(buildPrefab('round-shield', { tint: 'blue' }));  // 'tint' parts take a colour (team, dye, rarity)
hand.add(buildHeld('iron-sword'));                          // origin moved to the grip
scene.add(buildStaticPrefabs(placements));                  // merges static scenery prefabs into 1-3 draw calls
prewarmPrefabs(['iron-sword', { id: 'acorn', tint: 'gold' }], { renderer, camera, scene }); // after the scene's lights: bakes geometry, compiles the game's shaders
img.src = prefabIcon('glaze-pot')!;                          // cached PNG data URL for UI slots (null without WebGL)
slot.append(prefabIconElement(id, '🧪', 32));                // <img>, or the emoji in a <span> as fallback
prewarmPrefabIcons(['glaze-pot', 'iron-sword']);             // renders UI icons during idle time
const drop = createDrop('gold-coins', { glow: 'gold' });    // a hovering, turning pickup; call drop.update(dt)
scene.add(buildPrefabInstances('island-pine', matrices, { tints })); // hundreds of copies, one InstancedMesh per part

// A game with emoji items: pick a prefab from the emoji, the name's words and the item kind.
resolvePrefab({ icon: '🛡️', name: 'Bottlecap plate', prefer: ['armor'] }); // → bottlecap-cuirass
```

Static prefab parts are pre-baked into vertex-colored merged geometries per `(glow, alpha)` render bucket and cached
across copies, so each prefab costs 1–2 draw calls instead of one per primitive. Use `buildStaticPrefabs()` for
non-moving scenery to collapse dozens of props into 1–3 draw calls total (dispose with `disposeStaticBatch()`).
Never dispose meshes from `buildPrefab()` directly; skip them when tearing a scene down (Gnomomia's `interiors.ts`
does: `userData.prefab` marks a prefab root).

## Add a prefab

1. Pick the catalog file in `src/catalog/` by category, append a `PrefabDef` (format and units in `src/types.ts`, colour
   names in `src/palette.ts`).
2. `npm test -w packages/prefabs` checks every prefab: ids, examine text, grips, colours, that it stands on the ground
   and is gnome-sized.
3. Look at it in the gallery, or fix it in the prefab editor (`npm run prefab-editor`): edit parts, the grip, and the
   `wear` offset (how it sits when a gnome wears or holds it), then save straight back into the catalog file.

The rules handed to Haiku workers (modelling, examine voice) are in `docs/roadmaps/prefab-library/_common.md`.

## Who uses it

- `games/gnomes-of-gnomomia`: inventory, equipment and shop icons (`src/itemArt.ts`; 199 of 200 items get a prefab,
  the rest keep their emoji; an item can name one with `prefab: 'id'`), "Examine" cycles the item's line then the
  prefab's lines, and every house's furniture is built from `src/catalog/furniture.ts` and can be examined.
- `games/sample-3d` (Lawn Gnome Panic): mowers (`catalog/mowers.ts`) and desert critters (`catalog/critters.ts`).
  Moving parts are named pivots (`wheel-<n>`, `reel`, `engine`, `body`, `leg-<n>`, `tail`) the game animates; the
  hit flash swaps materials instead of editing the shared ones. Gnome Golf and Gnome Front copy the mower code.
- `games/gnome-golf`: cart (`catalog/golf-cart.ts`), trees through `buildPrefabInstances`, flagstick, tee markers.
- `games/gnome-front`: guns (`catalog/front-weapons.ts`, held with `buildHeld` and turned to point down -z) and the
  battlefield props (`catalog/front.ts`).
- `games/prefab-gallery`.

## Damage stages

A prefab can break. `PrefabDef.damage` is a list of stages, mildest first (the mowers have two: `dented`, `wrecked`). Stages are
cumulative: level 2 applies stage 1, then stage 2. A stage can `hide` named parts or groups (a wheel falls off), `morph` them (a bent
handle, a popped bonnet, a splayed wheel), `add` parts (scorch, dents, cracks, a fallen tyre, smoke), `darken` every colour toward soot
(tint and trim too), and `sink` the whole model (slumped springs).

```ts
const mower = buildPrefab('ride-on-mower', { tint: 0x2f64c9, scale: 1.5, damage: 0 });
setPrefabDamage(mower, 2);            // swaps the meshes in place; same root, scale and position
prefabDamageLevels(getPrefab('ride-on-mower')!); // 2 (0 for a prefab that cannot break)
```

`setPrefabDamage` makes new named pivots (`wheel-0`, `steer`, ...): look them up again afterwards. A hidden wheel leaves its (empty)
pivot behind, so spin code keeps working. The level is clamped to the stages, and `damage` is ignored on a prefab without any.
Level 0 builds exactly as before, so adding stages changes nothing for games that never ask for damage.

To give a prefab stages: name the parts you want to hide or bend in the base prefab (`name` or `group`), write the stages next to it
(the mowers' are in `src/catalog/damage-stages.ts`), and `npm test -w packages/prefabs` checks them (`src/damage.test.ts`): names exist,
every level builds finite and grounded, each level differs, soot reaches the tint.
Used by Gnome Theft Auto (`games/gnome-theft-auto/src/vehicles.ts`: hit points -> level).

## Nested pivots

A pivot is either a bare `Vec3` (its absolute position) or `{ at, parent }`, where `parent` names another pivot. A child pivot
hangs off its parent group, so a multi-joint rig is plain data:

```ts
pivots: {
  suspension: [0, 0.3, 0.5],
  knuckle: { at: [0, 0.3, 0.5], parent: 'suspension' },
  'wheel-2': { at: [0, 0.3, 0.5], parent: 'knuckle' },
}
```

`at` is always absolute (the same place the authored parts were drawn in), so you author every pivot where it sits in the
prefab. The builder works out the local offsets. Rotating or moving a parent (spin, steer, travel) moves everything under it:
rotate `suspension` and the knuckle and wheel turn with it about the suspension pivot. A part names its own pivot with `group`
as before, and `hide` / `morph` on a parent group reach the parts of its child groups. Parents must exist and the chain must
not loop (`pivot cycle: a -> b -> a` and `unknown parent` throw at build time). Read positions with `pivotAt()` and parents
with `pivotParent()`; `resolvePivotOrder()` gives parents before children. Prefabs with only `Vec3` pivots build exactly as before.

## Modes

A prefab can show varying amounts of things. `PrefabDef.modes` is a map of named extra-part sets, added on top of
`parts`; `defaultMode` is used when a build names none. Pick one with `BuildOptions.mode`:

```ts
buildPrefab('bookshelf', { mode: 'sparse' });  // 0 books ('bare'), a few ('sparse'), about half ('stocked'), full (default)
```

Modes are data (the bookshelf's books are generated per shelf in `catalog/furniture.ts`), built and cached per (prefab, mode),
and kept by `setPrefabDamage`. An unknown mode falls back to `defaultMode`. Tests: `src/modes.test.ts`.

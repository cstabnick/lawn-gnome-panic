# @lawn/prefabs: little 3D things for every game

About 190 prefabs (weapons, armor, shields, potions, food, materials, trinkets, keys, documents, tools, containers,
furniture, outdoor props), each drawn from a handful of Three.js primitives. No files, no textures: a prefab is data.
Every one carries tags, uses, the emoji it can stand in for, and 4 to 6 lines of in-world examine text.

Browse them: `npm run dev -w games/prefab-gallery` (search, tints, turntable, gnome for scale). `/?sheet` shows all of them
on one page; `/?sheet=weapon` shows one category.

## Use it

```ts
import { buildPrefab, buildHeld, prefabIcon, prefabIconElement, createDrop, resolvePrefab } from '@lawn/prefabs';

scene.add(buildPrefab('wooden-chest'));                    // a THREE.Group standing on y = 0, front facing +z
scene.add(buildPrefab('round-shield', { tint: 'blue' }));  // 'tint' parts take a colour (team, dye, rarity)
hand.add(buildHeld('iron-sword'));                          // origin moved to the grip
img.src = prefabIcon('glaze-pot')!;                          // cached PNG data URL for UI slots (null without WebGL)
slot.append(prefabIconElement(id, '🧪', 32));                // <img>, or the emoji in a <span> as fallback
const drop = createDrop('gold-coins', { glow: 'gold' });    // a hovering, turning pickup; call drop.update(dt)

// A game with emoji items: pick a prefab from the emoji, the name's words and the item kind.
resolvePrefab({ icon: '🛡️', name: 'Bottlecap plate', prefer: ['armor'] }); // → bottlecap-cuirass
```

Geometry and materials are cached and shared between copies. Never dispose a prefab's meshes; skip them when tearing
a scene down (Gnomomia's `interiors.ts` does: `userData.prefab` marks a prefab root).

## Add a prefab

1. Pick the catalog file in `src/catalog/` by category, append a `PrefabDef` (format and units in `src/types.ts`, colour
   names in `src/palette.ts`).
2. `npm test -w packages/prefabs` checks every prefab: ids, examine text, grips, colours, that it stands on the ground
   and is gnome-sized.
3. Look at it in the gallery.

The rules handed to Haiku workers (modelling, examine voice) are in `docs/roadmaps/prefab-library/_common.md`.

## Who uses it

- `games/gnomes-of-gnomomia`: inventory, equipment and shop icons (`src/itemArt.ts`; 199 of 200 items get a prefab,
  the rest keep their emoji; an item can name one with `prefab: 'id'`), "Examine" cycles the item's line then the
  prefab's lines, and every house's furniture is built from `src/catalog/furniture.ts` and can be examined.
- `games/prefab-gallery`.

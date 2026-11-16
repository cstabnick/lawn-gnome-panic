Epic: 2 Catalog
Depends on: none

First read and follow `docs/roadmaps/prefab-library/_common.md` (environment, format, modelling rules, examine voice, checks, out of scope). Exception for this issue: furniture is room-sized, so the "Units" sizes there do not apply. Keep the exact sizes from the code you port.

## Goal
`packages/prefabs/src/catalog/furniture.ts` holds 27 furniture prefabs that are exact data ports of the furniture Gnomes of Gnomomia currently builds in code, each with rich examine text. A later step swaps the game over to them, so they must look the same.

## Read first
- `games/gnomes-of-gnomomia/src/interiors.ts` lines 18 to 292: the helpers (`box`, `cyl`, `cone`, `sphere`, `ring`, `glow`) and `buildFurniture(kind, c, trim)` with one `case` per kind. Read only; do not edit it.
- `packages/prefabs/src/catalog/furniture.ts`: the empty `FURNITURE` array and the `WOOD_FROM_TINT` set you fill.

## Change
- `packages/prefabs/src/catalog/furniture.ts` only. One prefab per `case` in `buildFurniture`, in the same order. **id = the kind name exactly**: `bed bedroll table chair stool bench hearth barrel crate sack rug pot lamp counter altar pew workbench anvil loom cauldron plant painting wardrobe cupboard millstone bookshelf lectern`. Category `'furniture'`. `name`: Title Case of the kind ('Bookshelf'). `uses`: `['place']` plus `'sit'` (chair, stool, bench, pew), `'open'` (barrel, crate, sack, wardrobe, cupboard, pot), `'light'` (hearth, lamp), `'read'` (bookshelf, lectern), `'craft'` (workbench, anvil, loom, cauldron, millstone). `emoji`: one fitting emoji where one exists ('🛏' bed, '🪑' chair, '🛢' barrel, '📦' crate, '🕯' lamp, '📚' bookshelf, '🪴' plant, '🖼' painting) or `[]`. `tags`: the kind plus synonyms.

### Porting each helper call to a Part (exactly; keep every number)
- `box(g, w, h, d, color, x, y, z)` → `{ s: 'box', d: [w, h, d], at: [x, y, z], c: COLOR }`
- `cyl(g, rt, rb, h, color, x, y, z, seg?, rot?)` → `{ s: 'cyl', d: [rt, rb, h], at: [x, y, z], c: COLOR, seg, rot: DEGREES }`
- `cone(g, r, h, color, x, y, z, seg?, rot?)` → `{ s: 'cone', d: [r, h], at: [x, y, z], c: COLOR, seg, rot: DEGREES }`
- `sphere(g, r, color, x, y, z, seg?)` → `{ s: 'ball', d: [r], at: [x, y, z], c: COLOR, seg }`
- `ring(g, r, tube, color, x, y, z)` → `{ s: 'ring', d: [r, tube], at: [x, y, z], rot: [90, 0, 0], c: COLOR, seg: 8 }` (the helper lays it flat with x-rotation π/2; `seg: 8` gives the helper's 12 tubular segments)
- `glow(g, new THREE.XGeometry(...), color, x, y, z)` → the matching shape with `glow: true`
- A `new THREE.PointLight(color, intensity, distance, 1)` at (x, y, z) → an entry in the prefab's `lights: [{ at: [x, y, z], c: color, intensity, distance }]`
- Rotations in radians become degrees: `Math.PI / 2` → 90, `Math.PI` → 180, `Math.PI / 4` → 45, `-Math.PI / 2` → -90.
- Loops (`for (const x of [-0.5, 0.5]) ...`, `for (let i = 0; i < 3; i++)` with cos/sin) become one Part per iteration with the numbers worked out (round to 3 decimals).
- Any other THREE call (a Shape, a PlaneGeometry, a scale.set on a mesh): use the closest shape (`box` for a plane with a tiny thickness of 0.02) and `scale` for scale.

### Colours
- `trim` (the room trim colour) → `c: 'trim'`, and set the prefab's `trim: 0x6b4a2f`.
- `wood` (which the code defines as `c ?? trim`) → `c: 'trim'` too, and ADD the id to the `WOOD_FROM_TINT` set (so the game passes the placement colour as trim for these).
- A local like `const blanket = c ?? 0x8a3b3b` → `c: 'tint'` for those parts, and set the prefab's `tint: 0x8a3b3b` (the default after `??`).
- Plain hex colours stay as numbers (`0xf2e8c9`).
- A prefab that has both 'wood' parts and a `c ?? X` local: wood parts → 'trim' (and add to WOOD_FROM_TINT only if the code really colours them with `c ?? trim`), the local → 'tint'.

### Examine
- Each piece gets **6 examine lines** in the voice from `_common.md`: what it is made of up close, a household saying, a little story the object hints at, a dry joke, a practical tip. Furniture is gnome-made from garden scraps (a table from a seed-tray, a hearth of pebbles, a rug of woven grass, a bookshelf from a split pot).

## Contract
- `export const FURNITURE: PrefabDef[]` and `export const WOOD_FROM_TINT: ReadonlySet<string>` stay exported with these names and types.
- Every one of the 27 ids exists, exactly as spelled above.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in `furniture.ts`.
- `npm test -w packages/prefabs` passes every test for the 27 ids. (If a port fails "stands on the ground" because the original sits slightly below or above y = 0, report the kind and the measured y in your summary instead of moving it.)

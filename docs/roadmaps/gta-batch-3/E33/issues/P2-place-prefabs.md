Epic: E33 mountain routes, wave 1. Worker: Haiku.
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E33/_common.md` (environment) and `docs/roadmaps/prefab-library/_common.md` (prefab
format, modelling rules, examine voice; ignore its "Working directory" line: work in this E33 worktree). Two other
workers fill the other two E33 catalog files at the same time.

## Goal
The places and story props of the Snowcap Rise mountain routes exist as prefabs, in the empty catalog file
`packages/prefabs/src/catalog/gta-mountain-places.ts` (already registered in `catalog/index.ts`).

## Read first
- `packages/prefabs/src/types.ts`, `packages/prefabs/src/palette.ts`
- `packages/prefabs/src/catalog/gta-hamlet-kit.ts` (GTA world props in metres: `tarn-bothy`, `hamlet-stone-cairn`,
  `hamlet-picnic-table` — copy this style)
- `packages/prefabs/src/catalog/gta-mountain-places.ts` (yours, empty)

## Change
`packages/prefabs/src/catalog/gta-mountain-places.ts`: `export const GTA_MOUNTAIN_PLACES: readonly PrefabDef[]` with
these seven prefabs. World metres (a gnome is about 1 m tall), front +z, feet at y 0, centred. Every one: `category:
'prop'`, `uses: ['place']`, `emoji: []`, tags including 'gta' and 'mountain', a `footprint`. The Hatbrim's names are hat
names (the Bobble, Old Pate, Brim Gap, the Hatband): the jokes may lean on hats.

1. `top-hat-cafe` "The Top Hat": a mountain café 7 m (x) by 5 m (z), stone lower walls (tint 0x8f8a80) to 1.2 m and
   timber above to 3 m, a big glass front (+z) with a door, and for a roof a giant black TOP HAT: a wide black brim (flat
   cyl radius 4.2, 0.15 thick) on the walls and a tall black crown (cyl radius 2.4, 3 m) with a wide red band (trim
   0xb02a2a) round its base, a chimney poking out of the crown's top. Two small tables with parasols are NOT part of it.
   footprint { r: 4.5, h: 6.5 }, tint + trim set.
2. `summit-register-box` "Summit Register": a squat grey steel box (0.5 x 0.35 x 0.35) with its lid propped open, an open
   book inside (two cream pages, a red ribbon), a pencil on a string, on a 1.0 m post of stacked stones. footprint
   { r: 0.4, h: 1.5 }.
3. `stone-stile` "Stone Stile": a 2.4 m stretch of drystone wall (0.6 thick, 1.0 tall, grey) with three flat step-stones
   sticking out of each face so a gnome can climb over; a small wooden finger post on top pointing +x. footprint { r: 1.3, h: 1.5 }.
4. `picnic-blanket-spread` "Abandoned Picnic": a red-and-white chequered blanket (flat, 1.6 x 1.2, 0.02 thick, lifted
   0.01) with a tipped-over thermos, two cups (one upside down), a half sandwich, an open map weighed down by a stone and
   a single walking boot. All on the ground. footprint { r: 1, h: 0.3 }.
5. `keyhole-arch` "The Keyhole": a natural rock arch to stand over a road: two rough rock pillars (several stacked,
   slightly offset grey/brown boxes and balls, about 3 m across) at x ±7.5, joined at the top by a thick rock lintel
   (y 9 to 12, chunky, slightly sagging in the middle, 18 m long along x), lichen spots, a bird's nest on the lintel. The
   clear gap between the pillars is at least 11 m wide (x -5.5..5.5) and at least 8.5 m high. Front +z. footprint
   { r: 9, h: 12.5 }. Use at most 40 parts.
6. `scree-pile` "Scree Pile": a fan of grey rocks of mixed sizes (balls and squashed boxes) 3 m across, 1.2 m high at
   the back (-z) tapering to pebbles at the front. footprint { r: 1.6, h: 1.2 }.
7. `stuck-camper-chocks` "Wheel Chocks and Tow Rope": two yellow wheel chocks, a coiled blue tow rope and a small
   shovel lying on the ground; set dressing for a camper stuck on a hairpin. footprint { r: 0.8, h: 0.3 }.

## Done when
- `npx tsc --noEmit -p packages/prefabs` — no errors in your file.
- `npm test -w packages/prefabs` — every test that names one of your ids passes (and the whole suite passes, except a
  failure that names an id from `gta-mountain-roads.ts` or `gta-mountain-gear.ts`, which other workers own).

## Out of scope
Every other file. Do not edit `catalog/index.ts` (already done).

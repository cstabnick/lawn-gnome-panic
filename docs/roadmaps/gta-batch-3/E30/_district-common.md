# E30 district issues: what every district worker needs

You fill ONE district plan file in `games/gnome-theft-auto/src/pardonlin/districts/`. Three other workers fill the other
three district files at the same time; others write prefabs, radio, lore and code elsewhere in the same game. Touch
only your own district file (you may add one helper file next to it named `<yourFile>.data.ts` if the plan is long).

## Environment
- Repo: the current working directory (a git worktree of lawn-gnome-panic). Git Bash; if `node` is not found:
  `export PATH="/c/Program Files/nodejs:$PATH"`. Keep LF line endings. Do not commit.
- Game: `games/gnome-theft-auto` (three.js + TypeScript). World axes: +x east, +z south (north is -z), metres.
  1 m is about one gnome's height: gnomes are the people of this world; a kit townhouse is 9.6 m tall.

## What a district plan is (`src/pardonlin/plan.ts`, already written: read it, do not change it)
```ts
export interface PlanProp {           // any @lawn/prefabs id on the ground at (x, z)
  id: string; x: number; z: number;
  yaw?: number;                        // three.js rotation.y; a prefab's front faces its local +z
  y?: number;                          // lift above the ground (a cup on a cafe table: the table top height)
  rot?: [number, number, number];      // full Euler (overrides yaw), e.g. a chair knocked over: [0, yaw, Math.PI / 2] with y 0.25
  scale?: number; tint?: number; trim?: number;
  solid?: { w: number; d: number; h: number } | { r: number; h: number };   // collider (box turned by yaw, or round)
}
export interface PlanSign {
  kind: 'menu' | 'poster' | 'street' | 'plaque' | 'banner';
  text: string;                        // <= 90 characters; '\n' forces a line break
  x: number; z: number; yaw: number;
  y?: number; w?: number; h?: number;  // plaque / banner only: plate centre height above ground, plate size (m)
}
export interface Vignette { id: string; name: string; x: number; z: number; story: string }
export interface DistrictPlan {
  id: DistrictId; buildings: EuroPlacement[]; props: PlanProp[]; signs: PlanSign[];
  vignettes: Vignette[]; residents: AmbientGnomeDef[];
}
emptyPlan(id), buildingFootprint(p), propFootprint(p), keepClear(buildings, taken, rects), local(x, z, yaw, lx, lz)
```
- menu / poster / street signs place the kit sign prefab for you (`euro-chalkboard-sign`, `euro-poster-board`,
  `euro-street-sign`) at (x, z, yaw) and draw the text on its face: do NOT also add that prefab as a prop.
- plaque / banner = a text plate only (shop names over doors, a ticket board, a notice on a wall). Put it 0.05 m in
  front of the wall it hangs on: for a building `b` with depth `D` (catalog), its front wall centre is
  `local(b.x, b.z, b.yaw, 0, D / 2 + 0.05)` and the plate yaw is `b.yaw`. Over a door: y 3.4..4.2, w 1.6..3, h 0.4..0.6.
- `town.ts` builds the plan: buildings and props into merged static cells on the ground (buildings at the lowest
  ground under their corners), colliders for buildings (body) and for `solid` props, sign text on canvas atlases.
- `AmbientGnomeDef` (from `src/ambientGnomes.ts`):
```ts
{ id: string; name: string; x: number; z: number; yaw: number;
  look: Partial<GnomeLook>;            // hat, shirt, pants, skin, boots, beard (hex numbers or null), hair, glasses: boolean, dress: boolean
  bubble: string;                      // what they say when the player walks up (one line, <= 110 characters, their voice)
  idle?: AnimId }                      // e.g. 'paint-wall' 'sit-bench' 'sip-drink' 'feed-birds' 'argue' 'read' 'busk-guitar'
                                       // 'vendor-call' 'measure' 'emote' 'take-notes' 'sweep' 'water' 'rake' 'fish' 'idle-pompous'
                                       // 'wait-bus' 'gossip' 'eat-snack' 'check-watch' 'photo-snap' 'think' 'cross-arms' 'shrug'
                                       // 'sit-ground' 'sleep' 'tap-foot' 'hands-on-hips' 'look-around' 'read-map' 'haggle' 'window-shop'
```
  Resident ids start with `pl-`. A resident stands on clear ground (not on a road or footpath, not inside a building).

## Helpers (`src/pardonlin/layout.ts`, already written)
```ts
pl(docX, docZ): [x, z]                      // Pardonlin level-document point -> world (doc origin is world (-1600, 100))
DISTRICTS / districtById(id).rects          // your district's world rectangles: everything you place stays inside them
frontage(pathId, side, offset, gap = 6, from = 0, to = Infinity): RowStart[]
  // one planStreetRow start per segment of a road/footpath/river centre line, fronts facing it, `offset` m from the
  // centre line on 'left' or 'right' (try both and look at the x of the result to know which side is which)
footprintProblem(f, pavement = 1.5): string | null   // why a footprint may not stand (road, path, river, outside)
roadClearance(x, z): number                  // metres from the nearest road edge (negative = on a road)
pathPoints(id): [x, z][]                     // world points of a road / 'trail/...' / 'thymes'
```
Streets with `planStreetRow` (`src/eurokit/street.ts`):
```ts
const taken: Footprint[] = [];
const rects = districtById('old-town').rects;
for (const s of frontage('pl-rue-haute', 'left', 8)) {
  plan.buildings.push(...keepClear(planStreetRow({ ...s, seed: 11, corner: true }), taken, rects));
}
```
- Offsets: 7 m roads -> frontage `offset` 8..9 (road half 3.5 + pavement + room for awnings). Narrow lanes feel
  European: keep the pavement at 1.5..3 m. Vary the `seed` per row; use `mix` (ids) for a shopfront street.
- Hand-placed kit buildings (landmarks, kiosks) are `EuroPlacement`s too: `{ id, x, z, yaw, scale: 1, tint?, trim? }`
  with (x, z) the body centre. Run hand placements through `keepClear` as well (it returns what may stand).
- Building ids and sizes (`src/eurokit/catalog.ts EURO_BUILDINGS`, W x D x H, front apron): townhouse-mansard 4x6x9.6,
  townhouse-tall 3.4x6x11.8, half-timbered 5x6x8.4, bakery 4.5x6x7.2 (1.4), bistro 5x6x7.4 (2.2), apartment-block
  10x8x14, shopfront-cheese / -chemist / -antiques 3.6x6x8.8, corner-cafe 6x6x7.6 (2.6, side 1.6), tabac-kiosk 2.4,
  post-booth 1.2, steeple-church 8x14x22, market-hall 12x10x8, canal-boathouse 6x8x5.5 (2.5), opera-hall 16x14x13 (3).
  All ids are prefixed `euro-` (e.g. `euro-bistro`).

## Prefabs you may use (all exist unless marked NEW)
- Kit street furniture: `euro-cobble-tile`, `euro-paving-tile` (1.96 m slabs for a 2 m grid), `euro-bollard`,
  `euro-lamp-post`, `euro-flower-trough`, `euro-iron-railing` (2.0 m section, space 2.06), `euro-fountain`,
  `euro-bike-rack`, `euro-cafe-chair`, `euro-cafe-table`.
- Kit garden: `euro-topiary-spiral`, `euro-topiary-lollipop`, `euro-box-hedge` (1.96 long), `euro-geranium-pot`,
  `euro-geranium-bed`, `euro-espalier-pear`, `euro-plane-tree`, `euro-ivy-wall` (3 m, space 3.06), `euro-vine-pergola`,
  `euro-boules-court`, `euro-washing-line`, `euro-bistro-set`, `euro-rose-arch`, `euro-water-butt`.
- Older kits: `lavender-row`, `allotment-bed`, `bandstand`, `stone-fountain`, `market-stall`, `window-flower-box`,
  `hedgerow`, `boxwood-ball`, `topiary-cone`, `park-bench`, `bench`, `news-kiosk`, `newspaper-box`, `bird-pigeon`,
  `bird-swan`, `bread-loaf`, `cheese-wedge`, `crate`, `cargo-crate`, `wheelbarrow`, `flower-pot`, `gnome-statue`,
  `lost-suitcase`, `gsr-upright-piano`, `bike-rack`, `street-lamp`, `duck-house`. Search for more:
  `grep -rho "id: '[a-z0-9-]*'" packages/prefabs/src/catalog/ | sort -u | grep <word>`.
- NEW (another worker is adding these right now; use the exact ids, the existence test passes once they land):
  `pl-easel`, `pl-gramophone`, `pl-horn-speaker`, `pl-accordion`, `pl-baguette`, `pl-bread-basket`, `pl-book-stall`,
  `pl-queue-post` (a queue stanchion with a rope to its +x neighbour, posts 1.5 m apart), `pl-cheese-wheel`,
  `pl-produce-crate`, `pl-cafe-parasol`, `pl-boule`, `pl-newspaper`, `pl-espresso-cup`, `pl-croissant`,
  `pl-music-stand`, `pl-cello`, `pl-marrow`, `pl-tour-flag` (a guide's flag on a short pole), `pl-bean-tower`
  (the landmark: footprint about 16 x 16 m, 30 m tall, centred on its origin), `pl-pigeon-statue` (the Unknown Pigeon
  on a plinth, 2 x 2 m), `pl-swan-pedalo` (a swan pedal boat, 3 m long, floats on water at y 0).

## Rules
- **Stay inside your rects; nothing on roads.** `npx vitest run src/pardonlin/layout.test.ts` checks: every building
  footprint (body + apron) is 1.5 m clear of every road edge, clear of footpaths, 12.5 m from the Thymes' centre line,
  inside your rects and overlapping no other building; every solid prop likewise (0.3 m from a road edge); props,
  vignettes and residents inside your rects; prefab ids exist.
- **AC per district (the test enforces the counts):** at least 3 vignettes (each with at least 3 props within 8 m of
  its x, z: a story told by props with no text, e.g. a picnic abandoned mid-argument, a half-built thing with its plans
  blowing away), at least 6 signs with jokes that fit the place, at least 3 residents doing something specific to the
  place. Aim higher: 5+ vignettes, 15+ signs, 4-5 residents.
- **Tone:** gentle continental satire in the game's voice: long lunches, strong opinions on bread, queueing for
  everything, cycling everywhere, a dozen ways of saying "it is not done", strikes about strikes, forms in triplicate,
  pigeons with standing. A Paris, London and Berlin mash: no real city, country or nationality named, no real brands,
  no French words beyond the odd café word everyone knows. Gnome-scale and affectionate, never mean. House style:
  nothing gets wet, soaked, dripping or bloody (clay cracks and is glued back). Search the lore before naming things:
  `npm run lore -- find <word>`; the town's lore is `docs/lore/entries/apocrypha/pardonlin.md`.
- **No z-fighting:** paving/cobble tiles lie on the terrain only: never under a building footprint, never on a road
  (`roadClearance(x, z) > 1.5` for every tile), never stacked or overlapping (2 m grid). Nothing flat (a newspaper, a
  rug) lies on another flat surface at the same height: lift it (`y`) by at least 0.02 above what it rests on.
  Props never share a face with a building wall: keep 0.05 m off walls.
- **Budget:** at most ~2500 placements per district (tiles included; at most ~1500 tiles). Everything is merged into
  static cells, so many small props are fine, but tiles add up fast: pave squares and the café street, not every
  pavement.
- Deterministic: no `Math.random()`; use fixed numbers or seeds.
- Leave the screenshot spots in your district's `shots` (layout.ts) looking good: those are where the lead takes the
  AC screenshots (camera at the spot, looking toward yaw: yaw PI = facing north/-z, PI/2 = facing east/+x).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/pardonlin/layout.test.ts` passes for your district (failures in
  other districts, or "uses only prefabs that exist" failing only on the NEW `pl-*` ids, are other workers' and fine).
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your file.
- Report: the vignettes (id, name, where, story), the residents (who, where, doing what), how many buildings, props,
  tiles and signs, and anything you could not fit.

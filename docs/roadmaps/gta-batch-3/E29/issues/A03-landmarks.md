Epic: E29-A European kit (all parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E29/_common.md` first: working directory, toolchain, modelling, z-fighting, voice and checks.

## Goal
A steeple church, a balcony apartment block and a covered market hall exist as prefabs in
`packages/prefabs/src/catalog/gta-euro-buildings-c.ts`.

## Read first
- `docs/roadmaps/gta-batch-3/E29/_common.md`
- `packages/prefabs/src/types.ts`, `packages/prefabs/src/palette.ts`
- `packages/prefabs/src/catalog/gta-houses.ts` (building style)

## Change
- `packages/prefabs/src/catalog/gta-euro-buildings-c.ts`: the file exists with `export const GTA_EURO_BUILDINGS_C: readonly PrefabDef[] = [];`.
  Keep that export name; fill it with the three prefabs below. `category: 'prop'`, `uses: ['place']`,
  `footprint: { r: <half the width>, h: <height> }`. Walls `c: 'tint'`, roofs `c: 'trim'`. Max 40 parts each: use
  helper functions to generate repeated windows and balconies, and keep repeats chunky (one long glass strip per floor is fine).

Exact outer sizes (body fills x in [-W/2, W/2], z in [-D/2, D/2], top at H; front parts may reach `apron` past z = D/2;
NOTHING past x = +-W/2):

| id | name | W | D | H | apron | tint / trim |
|---|---|---|---|---|---|---|
| `euro-steeple-church` | Steeple Church | 8 | 14 | 22 | 1 | 0xcfc6b4 / 0x5a6470 |
| `euro-apartment-block` | Balcony Apartments | 10 | 8 | 14 | 1 | 0xf1e3c6 / 0x7b8691 |
| `euro-market-hall` | Covered Market Hall | 12 | 10 | 8 | 0.4 | 0x8a8f94 / 0x4f6f5a |

Looks:
- **Steeple Church**: a stone nave (box 7.6 wide, 8 tall, 13.9 deep... keep it inside the table) with a steep pitched
  roof, a square tower at the front (+z end) rising to about 14, a tall pointed spire (a 4-sided cone, `seg: 4`) to 22, a
  round rose window (a glowing ring or a flat cyl facing +z, 0.04 proud) over big double doors, a clock face on the
  tower, buttresses down the sides (kept inside x = +-4), a bell visible in the tower's open belfry. Steps in front.
- **Balcony Apartments**: five storeys of pale render, a ground floor of shopfronts (darker frame), four upper floors each
  with a row of tall windows and a continuous wrought-iron balcony (a thin floor slab plus a rail) reaching 0.8 out on
  the front, one balcony with tiny laundry on a line and one with potted plants (story details), a zinc mansard
  attic floor and chimney stacks on the roof.
- **Covered Market Hall**: an open-sided iron and glass hall: a row of slim green iron columns (cyl) along both long
  sides and ends, a big pitched glass roof (`c: 'glass'`, two wedges, trim-coloured ridge and eaves 0.03 proud),
  a raised clerestory strip along the ridge, a low stone plinth floor (0.1 thick), a big clock over the +z entrance, and
  three market stalls inside (a counter box with crates of colourful produce balls). The roof glass is see-through, so
  give the stalls colour.

## Contract
Ids, names and sizes above are fixed: `games/gnome-theft-auto/src/eurokit/catalog.ts` lists them and a test will build
each prefab and check its bounding box: width within 0.1 of W, depth from -D/2 to at most D/2 + apron, height within 0.3
of H.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in your file.
- `npm test -w packages/prefabs` passes every test naming your three ids.
- Each bounding box matches the table.

## Out of scope
Every other file, including the other `gta-euro-*.ts` catalog files and `catalog/index.ts`.

Epic: E29-A European kit (all parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E29/_common.md` first: working directory, toolchain, modelling, z-fighting, voice and checks.

## Goal
A bakery, a bistro, a tabac kiosk and a post-and-phone booth parody exist as prefabs in
`packages/prefabs/src/catalog/gta-euro-buildings-b.ts`.

## Read first
- `docs/roadmaps/gta-batch-3/E29/_common.md`
- `packages/prefabs/src/types.ts`, `packages/prefabs/src/palette.ts`
- `packages/prefabs/src/catalog/gta-houses.ts` (building style)

## Change
- `packages/prefabs/src/catalog/gta-euro-buildings-b.ts`: the file exists with `export const GTA_EURO_BUILDINGS_B: readonly PrefabDef[] = [];`.
  Keep that export name; fill the array with the four prefabs below. `category: 'prop'`, `uses: ['place']`,
  `footprint: { r: <half the width>, h: <height> }`. Walls `c: 'tint'`, roofs `c: 'trim'`.

Exact outer sizes (body fills x in [-W/2, W/2], z in [-D/2, D/2], top at H; front parts may reach `apron` past z = D/2;
NOTHING past x = +-W/2):

| id | name | W | D | H | apron | tint / trim |
|---|---|---|---|---|---|---|
| `euro-bakery` | Bakery | 4.5 | 6 | 7.2 | 1.4 | 0xe6dcb8 / 0x5a6470 |
| `euro-bistro` | Bistro | 5 | 6 | 7.4 | 2.2 | 0xd9e2d3 / 0x4a4f57 |
| `euro-tabac-kiosk` | Tabac Kiosk | 2.4 | 2.4 | 3.2 | 0.8 | 0x2f5a3a / 0xb08d3a |
| `euro-post-booth` | Post and Natter Booth | 1.2 | 1.2 | 2.8 | 0.1 | 0xd8b632 / 0x222222 |

Looks:
- **Bakery**: two storeys, painted wooden shopfront (a darker frame box 0.05 proud of the wall) with a big window
  showing a shelf of loaves (small tan pills and balls behind glass), a short scalloped awning (1.2 out), a giant
  wooden baguette sign bracketed out over the door, a bread crate by the door. Roof: low slate with one chimney.
- **Bistro**: two storeys, deep red shopfront frame, two windows with half-height lace curtains (white boxes), a long
  awning reaching 1.8 out, one round table and two chairs out front, a chalkboard easel by the door, potted bay trees
  (lollipop shapes) either side of the door. A string of small glowing lamps along the awning edge.
- **Tabac Kiosk**: a freestanding octagonal kiosk (a cyl with `seg: 8`, radius 1.15) in dark green with a domed or
  conical roof (trim gold-ish) topped by a little finial, a serving hatch on +z with a shelf and a stack of newspapers
  on it, a rack of tiny postcards on the side, a striped hatch canopy reaching 0.6 out.
- **Post and Natter Booth**: a parody of a classic telephone box crossed with a post box: a tall yellow box (tint) with a
  black domed top (trim), glazing bars on the door (thin boxes 0.04 proud of the glass), a letter slot and a little
  "out of order" plaque (a white box) on the front, a tiny receiver hanging inside (visible through `'glass'`), a crown-like
  ornament on top replaced by an acorn. It stays within 1.2 x 1.2.

## Contract
Ids, names and sizes above are fixed: `games/gnome-theft-auto/src/eurokit/catalog.ts` lists them and a test will build
each prefab and check its bounding box: width within 0.1 of W, depth from -D/2 to at most D/2 + apron, height within 0.3
of H. Max 40 parts each.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in your file.
- `npm test -w packages/prefabs` passes every test naming your four ids.
- Each bounding box matches the table.

## Out of scope
Every other file, including the other `gta-euro-*.ts` catalog files and `catalog/index.ts`.

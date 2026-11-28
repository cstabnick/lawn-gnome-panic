Epic: E29-A European kit (all parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E29/_common.md` first: working directory, toolchain, modelling, z-fighting, voice and checks.

## Goal
Four European terrace buildings exist as prefabs in `packages/prefabs/src/catalog/gta-euro-buildings-a.ts`.

## Read first
- `docs/roadmaps/gta-batch-3/E29/_common.md`
- `packages/prefabs/src/types.ts`, `packages/prefabs/src/palette.ts`
- `packages/prefabs/src/catalog/gta-houses.ts` (building style: walls tint, roof trim, wedge roofs)

## Change
- `packages/prefabs/src/catalog/gta-euro-buildings-a.ts`: the file exists with `export const GTA_EURO_BUILDINGS_A: readonly PrefabDef[] = [];`.
  Keep that export name; fill the array with the four prefabs below. Every one: `category: 'prop'`, `uses: ['place']`,
  walls `c: 'tint'`, roof `c: 'trim'`, `footprint: { r: <half the width>, h: <height> }`.

Exact outer sizes (body fills x in [-W/2, W/2], z in [-D/2, D/2], top at H; front parts may reach `apron` past z = D/2;
NOTHING past x = +-W/2):

| id | name | W | D | H | apron | tint / trim defaults |
|---|---|---|---|---|---|---|
| `euro-townhouse-mansard` | Mansard Townhouse | 4 | 6 | 9.6 | 0.6 | 0xf1e3c6 / 0x5a6470 |
| `euro-townhouse-tall` | Tall Townhouse | 3.4 | 6 | 11.8 | 0.6 | 0xe8c9a8 / 0x7b8691 |
| `euro-half-timbered` | Half-Timbered House | 5 | 6 | 8.4 | 0.5 | 0xf5efe4 / 0x9a5a3c |
| `euro-corner-cafe` | Corner Cafe | 6 | 6 | 7.6 | 2.6 | 0xf3d6cf / 0x4a4f57 |

Looks:
- **Mansard Townhouse**: three storeys of rendered wall (one box 3.94 wide, 7 tall, 6 deep, so its sides sit just
  inside x = +-2), a steep mansard roof (two wedges, front and back, slate trim) with two dormer windows on the front slope,
  a zinc-grey cornice strip just below the roof (0.03 proud on every side it touches, never flush), tall windows with
  pairs of shutters (`mirror: true`), a little wrought-iron balcony rail on the second floor, a front door with a stone
  step. Chimney pots on top.
- **Tall Townhouse**: like the mansard but four storeys, narrower, with a pointed gable front (a wedge turned so its peak
  runs along z) and a crooked chimney; one shutter hangs at an angle (a story detail).
- **Half-Timbered House**: white wall infill (tint), dark timber beams as thin boxes 0.04+ proud of the wall in a crossing
  pattern, the upper floor jutting out 0.4 over the ground floor on the front (a second wall box, deeper, so the fronts
  differ by 0.4), steep pitched roof (trim), small leaded windows, a window box of red flowers.
- **Corner Cafe**: two storeys, a shopfront on BOTH the +z front and the +x side (big glass windows, a door on the
  front), a striped awning (two-colour slabs of thin wedges or boxes) over the front reaching 1.6 out and over the +x
  side reaching 1.4 out, two small round tables with two chairs each on the pavement in front (within z <= D/2 + 2.6),
  a hanging sign. The +x side may reach up to 1.6 past x = +3 (it is a street corner); the -x side stays plain at x >= -3.

## Contract
Ids, names and sizes above are fixed: `games/gnome-theft-auto/src/eurokit/catalog.ts` lists them and a test will build
each prefab and check its bounding box: width within 0.1 of W (corner: up to W/2 + 1.6 on +x), depth from -D/2 to at
most D/2 + apron, height within 0.3 of H. Max 40 parts each.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in your file.
- `npm test -w packages/prefabs` passes every test naming your four ids.
- Each prefab's bounding box matches the table (check by reasoning over the parts, or with a throwaway vitest file in
  your scratch space that you delete afterwards).

## Out of scope
Every other file, including the other `gta-euro-*.ts` catalog files and `catalog/index.ts` (already registered).

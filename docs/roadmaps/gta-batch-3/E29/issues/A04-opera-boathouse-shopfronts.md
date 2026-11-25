Epic: E29-A European kit (all parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E29/_common.md` first: working directory, toolchain, modelling, z-fighting, voice and checks.

## Goal
An opera hall, a canal-side boathouse and three narrow shopfront buildings exist as prefabs in
`packages/prefabs/src/catalog/gta-euro-buildings-d.ts`.

## Read first
- `docs/roadmaps/gta-batch-3/E29/_common.md`
- `packages/prefabs/src/types.ts`, `packages/prefabs/src/palette.ts`
- `packages/prefabs/src/catalog/gta-houses.ts` (building style)

## Change
- `packages/prefabs/src/catalog/gta-euro-buildings-d.ts`: the file exists with `export const GTA_EURO_BUILDINGS_D: readonly PrefabDef[] = [];`.
  Keep that export name; fill it with the five prefabs below. `category: 'prop'`, `uses: ['place']`,
  `footprint: { r: <half the width>, h: <height> }`. Walls `c: 'tint'`, roofs `c: 'trim'`. Max 40 parts each.

Exact outer sizes (body fills x in [-W/2, W/2], z in [-D/2, D/2], top at H; front parts may reach `apron` past z = D/2;
NOTHING past x = +-W/2):

| id | name | W | D | H | apron | tint / trim |
|---|---|---|---|---|---|---|
| `euro-opera-hall` | Opera Hall | 16 | 14 | 13 | 3 | 0xe8dcc0 / 0x4f7a6a |
| `euro-canal-boathouse` | Canal Boathouse | 6 | 8 | 5.5 | 2.5 | 0x6b4a32 / 0x9a5a3c |
| `euro-shopfront-cheese` | Cheese Shop | 3.6 | 6 | 8.8 | 1.2 | 0xf3e6c4 / 0x5a6470 |
| `euro-shopfront-chemist` | Chemist | 3.6 | 6 | 8.8 | 1.2 | 0xdfe8e4 / 0x5a6470 |
| `euro-shopfront-antiques` | Antiques Shop | 3.6 | 6 | 8.8 | 1.2 | 0xe9d3c0 / 0x7b8691 |

Looks:
- **Opera Hall** (home of a classical music radio station): a grand cream stone hall; a front portico of six columns
  (cyl) on a wide flight of steps (two or three stepped slabs reaching 3 out, each upper step narrower by 0.06+), a
  triangular pediment over the columns, a big green copper dome (trim, a squashed ball) on a drum behind, gilded
  statues (two gold balls-on-pills) at the pediment ends, tall arched windows (glowing at night look: `glow: true` on a
  warm yellow), and a small radio mast with a red light on the roof (`glow: true`) as a hint of the station.
- **Canal Boathouse**: a timber boathouse on stilts at the water's edge: dark plank walls (tint), a pitched roof (trim),
  a wide open boat door on the +z end over a slipway, a jetty of planks on posts reaching 2.5 out in front (its deck at
  0.5 high, posts to the ground), a moored rowing boat beside the jetty (a squashed hull on the ground), life ring on the
  wall, coils of rope. Stilts go to y = 0.
- **Cheese Shop / Chemist / Antiques Shop**: three narrow terrace shopfronts, same frame (three storeys, a slate mansard
  roof with one dormer, shuttered upper windows) with different ground floors:
  cheese: a yellow-and-white striped awning (1.0 out), wheels of cheese (squashed cyls) stacked in the window, a cheese
  wheel sign; chemist: a glowing green cross sign bracketed out (`glow: true`), white frame, bottles in the window;
  antiques: a dark frame, a cluttered window (a clock, a lamp, a chair), a hanging sign, a battered armchair out front.
  Write a shared helper `shopfrontFrame(tint)` or similar for the common upper floors to save effort.

## Contract
Ids, names and sizes above are fixed: `games/gnome-theft-auto/src/eurokit/catalog.ts` lists them and a test will build
each prefab and check its bounding box: width within 0.1 of W, depth from -D/2 to at most D/2 + apron, height within 0.3
of H.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in your file.
- `npm test -w packages/prefabs` passes every test naming your five ids.
- Each bounding box matches the table.

## Out of scope
Every other file, including the other `gta-euro-*.ts` catalog files and `catalog/index.ts`.

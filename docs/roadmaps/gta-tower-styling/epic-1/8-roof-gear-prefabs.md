Epic: 1 tower kit
Depends on: none

(Read `docs/roadmaps/gta-tower-styling/epic-1/_env.md` first: environment and rules.)

## Goal
Eleven rooftop/facade gear prefabs for Gnome Theft Auto's downtown towers in a new catalog file
`packages/prefabs/src/catalog/gta-towers.ts`, registered in the library, with the prefab tests passing.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: the modelling and data rules (ignore its "Environment" section and its
  examine-voice place names list; the rest applies). In short: parts are `{ s, d, at, c, rot?, scale?, seg?, glow? }`,
  `at` is the shape's CENTRE, rot in degrees, the lowest point of the prefab at y = 0, centred on x/z, front faces +z.
- `packages/prefabs/src/types.ts`: `PrefabDef`, `Part`, shapes and what `d` means for each.
- `packages/prefabs/src/catalog/gta-landscaping.ts`: a finished Gnome Theft Auto scenery file to copy the style of (category 'prop', uses ['place'], `footprint`, `about`, 5 examine lines in Gnome Theft Auto's voice: a parody gnome city, wry and plain).
- `packages/prefabs/src/catalog/index.ts`: where catalog arrays are imported and spread into the library (look for `GTA_LANDSCAPING`).

## Change
- New `packages/prefabs/src/catalog/gta-towers.ts`: `export const GTA_TOWERS: readonly PrefabDef[] = [...]` with exactly
  these ids and sizes (units are metres at scale 1; the game scales them up per tower). Every one: category 'prop',
  uses ['place'], `footprint` set (`{ r: <half the widest side>, h: <height> }`), tags, `emoji: []`, about, 5 examine lines.
  Keep 3-16 parts each and seg 6-12. Use `c: 'tint'` + a `tint` default for the main recolourable part where stated, `glow: true` for lights.
  1. `tower-water-tank`: timber rooftop water tank: 4 legs (0.08 boxes, 0.6 tall) on the corners of a 0.9 square, a cross brace, a barrel tank (cylinder r 0.6, 1.1 tall) of tint 'wood'-like brown (tint default 0x8a5a3a) with 2 dark hoop rings (thin cylinders r 0.62, 0.05 tall), a cone roof (r 0.65, 0.35 tall) on top, a little ladder (2 rails + 4 rungs) up one side. Total height ~2.0, 1.2 across.
  2. `tower-hvac`: air-conditioning unit 1.2 x 0.7 x 0.8 grey box on two skids, a round dark fan grille on top (cylinder r 0.25, 0.04 tall, 0.02 above the top), a vent slot pattern (3 thin dark boxes on the front, 0.02 proud).
  3. `tower-dish`: satellite dish on a post: base plate, post 0.5 tall, dish = a flattened ball (ball r 0.4 squashed with scale [1, 1, 0.35]) tilted 30 degrees up facing +z, a feed arm and a small receiver nub. Total ~0.9 tall.
  4. `tower-mast`: radio mast 3.0 tall: a thin pole (cyl r 0.05) on a small base, 3 cross-arms at different heights (thin boxes 0.5 long), and a red light at the top: ball r 0.08, c 0xff3030, glow: true.
  5. `tower-helipad`: round helipad 3.0 across: pad (cylinder r 1.5, 0.12 tall, dark grey 0x3a3d42), a white ring stripe (a `ring` shape or a thin cylinder r 1.35, 0.02 tall) and the H marking, all 0.02 tall with their bottoms ON the pad top (y 0.12, so their centres at 0.13), no other part in that plane; the H from 3 boxes (two 0.12 x 0.02 x 0.9 posts and one 0.5 x 0.02 x 0.12 bar) in tint (default 0xffc400); 4 small glow lights (ball r 0.06, 0x8fffa0, glow) on the rim at 0, 90, 180, 270 degrees.
  6. `tower-gnome-hat`: a giant gnome-hat finial: a cone hat (cone r 0.6, 2.0 tall) in tint (default 0xc62828) slightly bent: build it as 3 stacked cone/cylinder pieces each tilted a little more (5, 10, 15 degrees about z) so the tip droops; a brim/band ring at the bottom (cylinder r 0.62, 0.15 tall) in trim (default 0xd4af37, `c: 'trim'`); a glow ball r 0.08 at the tip (0xfff2c0). Total ~2.4 tall, 1.2 across.
  7. `tower-planter`: a long box planter 1.2 x 0.4 x 0.6 (stone grey) with 3 shrub balls (r 0.22, leaf colours) on top.
  8. `tower-roof-tree`: a potted small tree: square pot 0.5 x 0.4 x 0.5, trunk (cyl r 0.06, 0.6 tall), canopy of 2-3 leaf balls up to 1.6 total height.
  9. `tower-pergola`: 4 posts (0.08 square, 1.3 tall) on a 1.8 square, two beams along x on top, 6 slats across along z sitting on the beams (no shared faces: slats 0.04 higher than the beam tops are fine if they rest ON them: slat bottom = beam top), a vine colour ball or two on a corner. 2.0 x 1.4 x 2.0.
  10. `tower-scaffold`: one scaffolding bay 2.0 wide, 2.0 tall, 0.6 deep; centred on x; its back at z = -0.3, front at z = +0.3: 4 uprights (cyl r 0.03, 2.0 tall) at x = ±0.95, z = ±0.25; 2 ledgers along x at the top (y 1.95) front and back (cyl r 0.025 lying along x: rot [0, 0, 90]); a plank deck 1.9 x 0.05 x 0.5 at y 1.9 (top 1.925) in tint (default 0xc8a26a); a guard rail along x at the front at y 1.0; one diagonal brace on the front face (a thin cylinder rotated about z by ~45 degrees). Metal parts 'steel'-like grey (0x9aa0a6).
  11. `tower-clock`: a clock box 1.2 x 1.2 x 1.2 (stone 0xe8e4dc) standing on y = 0; on each of its 4 sides a clock face: a cream disc (cylinder r 0.45, 0.04 thick, turned to face out, its centre 0.62 from the box centre so it stands 0.02 proud) with two dark hands (thin boxes) 0.03 in front of the disc; a small pyramid roof (cone r 0.85, 0.5 tall, seg 4, rot [0, 45, 0]) in tint (default 0x2c5e7a) on top (bottom at 1.2). Total 1.7 tall.
  (No 'tower-skylight'; eleven prefabs exactly.)
- `packages/prefabs/src/catalog/index.ts`: add `import { GTA_TOWERS } from './gta-towers';` next to the other GTA imports and spread `...GTA_TOWERS` into the same list as `...GTA_LANDSCAPING`. Change nothing else in that file (other workers may add lines too: keep the edit tiny).

## Done when
- `npm test -w packages/prefabs` passes (at least every test naming one of your ids; if a test unrelated to your ids fails because another worker is mid-edit, say so).
- `npx tsc --noEmit -p packages/prefabs` shows no error in your file.

## Out of scope
Everything under `games/`, every other catalog file, `types.ts`, `palette.ts`, `build.ts`, `registry.ts`.

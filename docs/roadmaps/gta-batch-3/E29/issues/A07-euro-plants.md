Epic: E29-A European kit (all parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E29/_common.md` first: working directory, toolchain, modelling, z-fighting, voice and checks.

## Goal
Seven European plants exist as prefabs in `packages/prefabs/src/catalog/gta-euro-garden.ts`.

## Read first
- `docs/roadmaps/gta-batch-3/E29/_common.md`
- `packages/prefabs/src/types.ts`, `packages/prefabs/src/palette.ts`
- `packages/prefabs/src/catalog/gta-landscaping.ts` (`topiary-cone`, `boxwood-ball`, `lavender-row`, `hedgerow`: plant style)

## Change
- `packages/prefabs/src/catalog/gta-euro-garden.ts`: the file exists with `export const GTA_EURO_GARDEN: readonly PrefabDef[] = [];`.
  Keep that export name; fill it with (`category: 'prop'`, `uses: ['place']`, life-size metres):

| id | name | approx size (W x H x D) | footprint |
|---|---|---|---|
| `euro-topiary-spiral` | Spiral Topiary | 0.9 x 2.2 x 0.9 | `{ r: 0.4, h: 2.2 }` |
| `euro-topiary-lollipop` | Lollipop Bay Tree | 0.7 x 1.6 x 0.7 | `{ r: 0.3, h: 1.6 }` |
| `euro-box-hedge` | Clipped Box Hedge | 2.0 x 0.8 x 0.6 | `{ r: 0.3, h: 0.8 }` |
| `euro-geranium-pot` | Potted Geraniums | 0.5 x 0.6 x 0.5 | none |
| `euro-geranium-bed` | Geranium Bed | 1.6 x 0.45 x 0.8 | none |
| `euro-espalier-pear` | Espaliered Pear | 2.4 x 2.2 x 0.4 | `{ r: 0.2, h: 2.2 }` |
| `euro-plane-tree` | Plane Tree | ~5 x 9 x 5 | `{ r: 0.45, h: 9 }` |

Looks:
- **Spiral Topiary**: a terracotta pot, a short trunk, and a corkscrew of stacked, slightly offset, shrinking green balls
  (5 or 6, squashed `scale: [1, 0.7, 1]`, each turned a bit round the trunk) to a point. Deep box green (0x2f5a2a).
- **Lollipop Bay Tree**: a square white wooden planter, a straight thin trunk, one perfect clipped ball on top.
- **Clipped Box Hedge**: a dead-straight low hedge, 2.0 long (ends at x = +-1 so sections butt on a 2 m grid... keep it
  1.96 long so neighbours never share a face), flat-topped, with a few lighter green bumps 0.03 proud on the top.
- **Potted Geraniums**: a terracotta pot with a lip ring, a mound of leaves and bright red flower clusters (small balls).
  Set `tint: 0xd8342c` for the flowers (`c: 'tint'`) so other colours can be made.
- **Geranium Bed**: a low brick-edged bed (edging boxes 0.04 taller than the soil) of geraniums in rows, red (tint).
- **Espaliered Pear**: a pear tree trained flat on a wooden frame: a central trunk, three pairs of horizontal arms
  (thin pills along x, `mirror: true`), small leaf clusters and a few pears (yellow-green squashed balls), the frame
  posts behind (z -0.1) so the tree and frame do not share faces.
- **Plane Tree**: a tall tree with a mottled trunk (a cyl plus two or three paler and darker patch boxes 0.03 proud) that
  splits into two thick limbs, and a broad lumpy canopy of 5-7 big green balls. Optional: one seed ball hanging.

## Contract
Ids and names fixed (`games/gnome-theft-auto/src/eurokit/catalog.ts` `EURO_GARDEN` lists them; the game's flora table
`src/flora/kinds.ts` will list `euro-geranium-bed` as mowable and the others as not). Max 40 parts each.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in your file.
- `npm test -w packages/prefabs` passes every test naming your seven ids.

## Out of scope
Every other file, including the other `gta-euro-*.ts` catalog files and `catalog/index.ts`.

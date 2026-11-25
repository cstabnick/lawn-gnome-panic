Epic: E29-A European kit (all parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E29/_common.md` first: working directory, toolchain, modelling, z-fighting, voice and checks.

## Goal
Seven European backyard pieces exist as prefabs in `packages/prefabs/src/catalog/gta-euro-garden-b.ts`.

## Read first
- `docs/roadmaps/gta-batch-3/E29/_common.md`
- `packages/prefabs/src/types.ts`, `packages/prefabs/src/palette.ts`
- `packages/prefabs/src/catalog/gta-landscaping.ts` (`dry-stone-wall`, `hedge-arch`: style)

## Change
- `packages/prefabs/src/catalog/gta-euro-garden-b.ts`: the file exists with `export const GTA_EURO_GARDEN_B: readonly PrefabDef[] = [];`.
  Keep that export name; fill it with (`category: 'prop'`, life-size metres):

| id | name | uses | approx size (W x H x D) | footprint / seat |
|---|---|---|---|---|
| `euro-ivy-wall` | Ivy Garden Wall | place | 3.0 x 1.8 x 0.4 | `{ r: 0.2, h: 1.8 }` |
| `euro-vine-pergola` | Vine Pergola | place | 3.0 x 2.5 x 2.4 | `{ r: 0.15, h: 2.5 }` |
| `euro-boules-court` | Boules Court | place | 2.8 x 0.2 x 8.0 | `{ r: 1.4, h: 0.15 }` |
| `euro-washing-line` | Washing Line | place | 3.2 x 1.9 x 0.3 | `{ r: 0.1, h: 1.9 }` |
| `euro-bistro-set` | Bistro Garden Set | place, sit | 1.5 x 0.9 x 0.8 | `seat: [-0.5, 0.45, 0]` |
| `euro-rose-arch` | Rose Arch | place | 1.6 x 2.4 x 0.6 | `{ r: 0.1, h: 2.4 }` |
| `euro-water-butt` | Water Butt | place | 0.7 x 1.1 x 0.7 | `{ r: 0.35, h: 1.1 }` |

Looks:
- **Ivy Garden Wall**: an old red-brick wall section (ends at x = +-1.48 so sections on a 3 m grid never touch) with a
  stone coping on top (0.06 wider than the wall and 0.03 higher, so not flush), and ivy: clumps of dark green boxes and
  balls on the +z face, 0.04 proud, spilling over the top in one place.
- **Vine Pergola**: four timber posts, two beams along x and four cross rafters along z on top (rafters 0.03 higher than
  the beams so no tops are flush), a grape vine twisting up one post (a thin dark pill or two) and leafy clumps over the
  rafters, three bunches of purple grapes (small purple balls) hanging.
- **Boules Court**: a long raised gravel court: four timber edge boards (0.15 high, 0.1 thick) round a gravel fill box
  0.1 high (pale sandy 0xd8c9a0) that sits INSIDE the boards; three silver boules (balls r 0.06) and one tiny red jack
  (r 0.025) resting on the gravel, one boule far off on its own (a story: somebody threw it badly). A small
  scoreboard on a stake at one end (x within the court width). Long side along z.
- **Washing Line**: two T-shaped posts at x = +-1.5, a sagging line (two thin tilted boxes meeting in the middle, low by
  0.1), hanging laundry: a striped shirt, a long sock, a tiny gnome hat, a polka-dot hanky (thin boxes and a cone), each
  hanging just under the line. Pegs as tiny boxes.
- **Bistro Garden Set**: a small folding round table (tint 0x2f6b8f painted metal) between two folding chairs (seat
  centres at x = -0.5 and x = +0.5, seat tops at 0.45), a tiny coffee pot and two cups on the table. Set `tint`.
- **Rose Arch**: two thin metal side frames and a semicircular top (a ring `d: [0.8, 0.03, 180]`), climbing roses (pink
  and red balls with green clumps) along it, more at the top.
- **Water Butt**: a green plastic barrel (tint 0x3f6b3a) with a lid, a brass tap near the bottom on the front, a
  downpipe stub coming in from the back, standing on two bricks. Set `tint`.

## Contract
Ids and names fixed (`games/gnome-theft-auto/src/eurokit/catalog.ts` `EURO_GARDEN` lists them). Max 40 parts each.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in your file.
- `npm test -w packages/prefabs` passes every test naming your seven ids.

## Out of scope
Every other file, including the other `gta-euro-*.ts` catalog files and `catalog/index.ts`.

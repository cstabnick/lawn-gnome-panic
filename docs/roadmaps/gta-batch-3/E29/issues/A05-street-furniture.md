Epic: E29-A European kit (all parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E29/_common.md` first: working directory, toolchain, modelling, z-fighting, voice and checks.

## Goal
Seven pieces of European street furniture exist as prefabs in `packages/prefabs/src/catalog/gta-euro-street.ts`.

## Read first
- `docs/roadmaps/gta-batch-3/E29/_common.md`
- `packages/prefabs/src/types.ts`, `packages/prefabs/src/palette.ts`
- `packages/prefabs/src/catalog/gta-street-kit.ts` (street furniture style and sizes)

## Change
- `packages/prefabs/src/catalog/gta-euro-street.ts`: the file exists with `export const GTA_EURO_STREET: readonly PrefabDef[] = [];`.
  Keep that export name; fill it with these seven prefabs (`category: 'prop'`, `uses: ['place']`, life-size metres):

| id | name | size (W x H x D) | footprint | notes |
|---|---|---|---|---|
| `euro-cobble-tile` | Cobble Tile | 1.96 x 0.08..0.12 x 1.96 | none | flat paving slab for a 2 m grid |
| `euro-paving-tile` | Paving Tile | 1.96 x 0.08 x 1.96 | none | flat paving slab for a 2 m grid |
| `euro-bollard` | Street Bollard | 0.3 x 1.0 x 0.3 | `{ r: 0.15, h: 1 }` | |
| `euro-lamp-post` | Ornate Lamp Post | ~0.8 x 4.2 x 0.8 | `{ r: 0.2, h: 4.2 }` | |
| `euro-flower-trough` | Flower Trough | 1.6 x 0.9 x 0.5 | `{ r: 0.25, h: 0.9 }` | |
| `euro-iron-railing` | Wrought-Iron Railing | 2.0 x 1.1 x 0.12 | none | one 2 m section, ends at x = +-1 |
| `euro-fountain` | Square Fountain | 4 x 3.2 x 4 | `{ r: 2, h: 1.0 }` | |

Looks:
- **Cobble Tile**: a grey slab 1.96 square and 0.08 thick (`at: [0, 0.04, 0]`), topped by a grid of rounded cobbles:
  rows of squashed balls (radius ~0.12, `scale: [1, 0.35, 1]`, two or three greys alternating) whose bottoms sink into
  the slab. Max 40 parts: use a 4 x 4 grid of bigger cobbles (16 parts) or rows as thin boxes; cobbles stay inside the slab.
- **Paving Tile**: a 1.96 square slab 0.06 thick in pale stone plus four 0.94-square slabs 0.025 thick on top
  (centred at +-0.49, leaving a 0.04 grout gap between them; their tops at 0.085), each slightly different stone shade.
- **Street Bollard**: a dark green cast-iron bollard: a slightly tapered cyl with a ring band and a ball cap, gold ring.
- **Ornate Lamp Post**: a fluted dark green post on a wide stepped base, a scrolled bracket (a ring arc `d: [r, t, 180]`)
  and a lantern on top: a glass box with a glowing yellow core (`glow: true`) and a little pointed cap. Add
  `lights: [{ ... }]` only if `PrefabLight` in types.ts is simple to fill (read it); else skip lights.
- **Flower Trough**: a long painted wooden planter on short legs, overflowing with red and pink geranium balls and
  trailing ivy (small green boxes hanging over the front edge, 0.04 proud).
- **Wrought-Iron Railing**: black: a top rail and a bottom rail (thin boxes 2.0 long), eight vertical bars ending in
  little spear tips (cones), a scroll (ring) between each pair of bars at mid height. Bars are thinner than the rails
  (0.025 vs 0.04 deep) so no faces are shared.
- **Square Fountain**: a round stone basin (cyl radius 2, height 0.6, with a darker inner cyl as the water surface 0.04
  below the rim, `c: 'water'` if the palette has it, else 0x4f8fb8), a central column with two tiers of smaller bowls,
  a little fat gnome statue on top spouting water (a thin glowing-blue pill arc), coins (small gold flat cyls) on the
  water. The water's top is at least 0.04 below the rim top.

## Contract
Ids and names fixed (`games/gnome-theft-auto/src/eurokit/catalog.ts` `EURO_FURNITURE` lists them). The tiles must be
exactly 1.96 square and sit on y = 0 (they are laid on a 2 m grid with 0.04 gaps). The railing is exactly 2.0 long on x.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in your file.
- `npm test -w packages/prefabs` passes every test naming your seven ids.

## Out of scope
Every other file, including the other `gta-euro-*.ts` catalog files and `catalog/index.ts`.

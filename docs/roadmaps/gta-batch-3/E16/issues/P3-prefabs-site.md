Epic: E16-A (countryside, first parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
`packages/prefabs/src/catalog/gta-country-site.ts` holds the Thorne Even-Estates building-site kit (Levelright
Construction): the identical beige show-home, the half-built house, a hoarding panel and a gate, a gnome-scale crane
that lifts with a garden bucket, a stack of mushroom-stem girders, an acorn-cap hard hat, a plans table, a giant
spirit level and a pallet of clay bricks.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: modelling rules (`at` = part centre, `rot` in degrees, lowest point at
  y = 0, front +z, at most 40 parts, `examine` voice). Ignore its "Environment" section.
- `packages/prefabs/src/types.ts` (`PrefabDef`, `footprint`) and `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gta-skyway-works.ts`: `site-tower-crane`, `site-cement-mixer`, `site-cone`,
  `tower-scaffold` (existing site props: match their style; do not change them).
- `packages/prefabs/src/catalog/gta-country-site.ts`: the empty file you fill (already registered).

## Change
`GTA_COUNTRY_SITE` gets (category 'prop', uses ['place'], tags incl. 'construction', 'levelright', 'even-estates',
'site', 'gta'; `emoji: []`; 5 examine lines each in the house voice: Levelright Construction builds Vesper Thorne's
HOA-approved beige houses, every one the same height, colour and number of windows; finished houses stand empty; the
crane motto is "Level Is Kind"; a spirit level in every hat band). Colours: Even-Estates beige (0xd9c8a5), Levelright
pale blue (0x9ec3d6), white trim, dark grey roof felt (0x55585c). Lowest point y = 0, centred on the origin, front +z.
- `even-show-home` "Even-Estates show-home": exactly 7 x 7 in plan, a flat-roofed beige box 4.5 tall with a 0.25 roof
  slab overhanging 0.2 (the slab sits ON the walls: walls 0..4.5, slab 4.5..4.75), a white door centred on +z with a
  number plate, exactly two identical windows either side on +z and two on each side wall (all panes the same size,
  0.03 proud, white frames), a single identical square shrub in a pot by the door.
- `even-half-built` "Half-built Even-Estates house": exactly 8 x 8 in plan: a concrete slab 0.2 tall, a frame of
  mushroom-stem girders (pale cream 0xefe3c8 cylinders with a slightly wider brown-capped top, like a mushroom stalk:
  corner posts 4 tall and beams across the top), two walls half-bricked to ~2 m in beige clay brick, window openings
  left as gaps, a ladder leaning on one wall, a tarp over a corner (a thin tilted pale-blue box). No roof.
- `site-hoarding` "Levelright hoarding": a 4 m long panel along local x, 2.4 tall, 0.08 thick, pale blue with a beige
  band along the middle (a strip 0.01 proud on +z) and two small A-frame feet behind (on -z). NO text (the game adds
  text plates on some panels).
- `site-hoarding-gate` "Levelright gate": two 4 m gate leaves standing open (turned ~70 degrees on hinge posts at
  x = ±4), pale blue mesh look (a frame of thin boxes), on posts 2.6 tall; the 8 m gap between the posts is clear.
- `bucket-crane` "Levelright bucket crane": a gnome tower crane: a yellow lattice mast (four corner posts + cross bars)
  ~14 tall on a concrete footing 3 x 3 x 0.5, a slewing cab at the top, a jib ~12 long toward +z and a counter-jib ~4
  toward -z with a counterweight (a stack of clay bricks), a pale-blue sign board on the jib (no text), and a cable
  hanging from the jib tip to a garden bucket (a tapered cylinder with a handle) at ~6 above the ground.
- `mushroom-girder-stack` "Mushroom-stem girders": four pale mushroom-stem girders (cream cylinders 0.25 radius, 5 long,
  brown caps on one end) lying stacked on two timber bearers, about 1 tall.
- `acorn-hard-hat` "Acorn-cap hard hat": an acorn cap (brown, scaled-texture rings as 0.005-proud darker bands) worn
  as a hard hat, with a beige brim and a tiny spirit level tucked in the hat band; ~0.35 across, lying on y = 0.
- `site-plans-table` "Plans table": a trestle table ~2 long with blueprint sheets (pale-blue thin boxes, one lifting at
  a corner, one fallen on the ground beside it held by a brick), a mug, a pencil, and a ruler.
- `spirit-level-giant` "Giant spirit level": a gnome-scale spirit level 2 long, 0.2 tall, 0.1 deep, lying flat: a yellow
  body, three vials (pale green glass cylinders, each with a tiny bubble ball) set in it.
- `clay-brick-pallet` "Pallet of clay bricks": a timber pallet 1.2 x 1.2 with a stack of terracotta bricks ~0.9 tall,
  strapped with two thin dark bands.

## Contract
Ids exactly: `even-show-home` (7 x 7 plan, roof top 4.75), `even-half-built` (8 x 8 plan), `site-hoarding` (4 long on
x, 2.4 tall), `site-hoarding-gate` (8 m clear gap), `bucket-crane` (footing 3 x 3 centred on the origin, jib toward +z),
`mushroom-girder-stack`, `acorn-hard-hat`, `site-plans-table`, `spirit-level-giant`, `clay-brick-pallet`.

## Done when
- `npm test -w packages/prefabs` passes for every test naming your ids (run from the repo root; failures in other
  workers' new ids are not yours).
- `npx tsc --noEmit -p packages/prefabs` shows no errors in your file.

## Out of scope
Every other file (`gta-skyway-works.ts` stays unchanged).

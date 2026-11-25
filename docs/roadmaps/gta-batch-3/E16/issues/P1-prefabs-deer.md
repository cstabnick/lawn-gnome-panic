Epic: E16-A (countryside, first parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
`packages/prefabs/src/catalog/gta-country-deer.ts` holds four animated animals: the red deer hind, stag and fawn, and a
hill goat. The game's critter runtime and the hunting system animate their named pivots.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: modelling rules (`at` = part centre, `rot` in degrees, lowest point at
  y = 0, front +z, at most 40 parts, `examine` voice). Ignore its "Environment" section.
- `packages/prefabs/src/types.ts` (`PrefabDef`, `Part`, `pivots`, `group`) and `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gta-farm-critters.ts`: `cow` and `sheep`, finished animals to copy exactly in structure:
  `pivots: { body, head, tail, 'leg-0'..'leg-3' }` (pivot = the joint point; legs swing from the hip/shoulder), every part
  has `group: '<pivot name>'`, legs are cylinders hanging from their pivot, head parts in group 'head'.
- `packages/prefabs/src/catalog/gta-country-deer.ts`: the empty file you fill (already registered in `catalog/index.ts`).

## Change
`GTA_COUNTRY_DEER` gets four prefabs (category 'prop', uses ['place'], tags incl. 'deer' or 'goat', 'animal',
'critter', 'gta'; `emoji: []`; 5 examine lines each in the house voice: dry, gnome-scale, animals are never hurt in
Turfton, a knocked-over deer gets up offended and runs off). No `tint`: plain palette colours. Front (head) on +z,
feet at y = 0. A gnome is 1 m tall and a cow is about 2 m: deer are big, graceful animals next to a gnome.
- `deer-hind` "Red Deer Hind": warm red-brown (0xa8743f) body box ~0.6 wide x 0.65 tall x 1.4 long at y ~1.25, a paler
  belly (0xd8b48a) and a cream rump patch with a short white tail (group 'tail'), four slim legs ~0.95 long (0.07 radius,
  dark hooves), a long neck rising forward (tilted box) and a head with big upright ears, a dark nose and eyes; top of
  the head ~2.0. Pivots: body [0, 1.25, 0], head [0, 1.6, 0.6], tail [0, 1.45, -0.7], legs at the four corners
  ([±0.2, 0.95, ±0.55]).
- `deer-stag` "Red Deer Stag": like the hind but ~10% bigger and darker (0x8a5a2b), a shaggy darker neck ruff, and a
  pair of branching antlers (group 'head': two main beams of tilted thin cylinders with 3 tines each, bone/'tan'
  colour) reaching to ~3.0 high. Pivots like the hind, scaled.
- `deer-fawn` "Red Deer Fawn": about 0.6 of the hind's size, lighter (0xc89060) with white dapple spots (6-8 small
  flattened balls on the back and flanks, 0.01 proud), big ears, long legs for its size. Head top ~1.2.
- `goat` "Hill Goat": a stocky goat ~1.2 tall at the head: off-white shaggy body (0xeeeae0) with a grey saddle patch,
  short legs, backswept curved horns (two tilted cones), a little beard (a small cone pointing down), a stubby upright
  tail, a bell on a collar. Pivots body, head, tail, leg-0..3 like the sheep.

## Contract
Ids exactly `deer-hind`, `deer-stag`, `deer-fawn`, `goat`, each with pivots `body`, `head`, `tail`, `leg-0`, `leg-1`,
`leg-2`, `leg-3` (the game's `src/critters.ts` CRITTER_SPECS and `src/hunting/species.ts` use these ids).

## Done when
- `npm test -w packages/prefabs` passes for every test naming your four ids (run it from the repo root; failures in other
  workers' new ids are not yours).
- `npx tsc --noEmit -p packages/prefabs` shows no errors in your file.

## Out of scope
Every other file (other workers fill the other `gta-country-*.ts` files at the same time).

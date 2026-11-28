Epic: E33 mountain routes, wave 1. Worker: Haiku.
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E33/_common.md` (environment) and `docs/roadmaps/prefab-library/_common.md` (prefab
format, modelling rules, examine voice; ignore its "Working directory" line: work in this E33 worktree). Two other
workers fill the other two E33 catalog files at the same time.

## Goal
The road furniture of the Snowcap Rise mountain routes exists as prefabs, in the empty catalog file
`packages/prefabs/src/catalog/gta-mountain-roads.ts` (already registered in `catalog/index.ts`).

## Read first
- `packages/prefabs/src/types.ts`, `packages/prefabs/src/palette.ts`
- `packages/prefabs/src/catalog/gta-hamlet-kit.ts` (GTA world props in metres: `tarn-bothy`, `hamlet-sign`,
  `hamlet-stone-cairn` — copy this style: `category: 'prop'`, `uses: ['place']`, `footprint`, about, examine)
- `packages/prefabs/src/catalog/gta-mountain-roads.ts` (yours, empty)

## Change
`packages/prefabs/src/catalog/gta-mountain-roads.ts`: `export const GTA_MOUNTAIN_ROADS: readonly PrefabDef[]` with these
eight prefabs. Sizes are world metres (a gnome is about 1 m tall). Front faces +z, feet at y 0, centred on x and z.
Every one: `category: 'prop'`, `uses: ['place']`, `emoji: []`, tags including 'gta', 'mountain', 'road', a `footprint`.
Examine voice: a gnome's view of mountain roads on Snowcap Rise ("Wear two hats"), dry and warm.

1. `mountain-guard-rail` "Mountain Guard Rail": one steel W-beam section 4.0 m long along x (from x -2.0 to +2.0), the
   beam (a box 4.0 x 0.32 x 0.08, grey 'metal' or 0xb9bec4, at y 0.62, z 0.06) with two flatter ribs (thin boxes) to read
   as a W, on two posts (boxes 0.1 x 0.75 x 0.1 at x ±1.75, z -0.06, dark grey), a small red-and-white reflector square on
   each post's front. 0.8 m tall. Front (+z) is the road side. footprint { r: 2, h: 0.8 }.
2. `road-marker-post` "Reflector Post": a 1.1 m white post (box 0.12 x 1.1 x 0.12) with a black band near the top and a
   small amber reflector on the front (+z) face, a red one on the back. footprint { r: 0.2, h: 1.1 }.
3. `hatband-pole` "Hatband Pole": a 1.6 m round pole (cyl radius 0.05) striped red and white in 0.2 m bands (8 short
   cylinders), a tiny reflector cap. footprint { r: 0.2, h: 1.6 }.
4. `hairpin-chevron-sign` "Hairpin Chevron": a board 1.2 x 0.6 m on one 1.4 m post (board centre y 1.6), black with
   three yellow chevrons pointing +x (three thin rotated yellow boxes on the front), facing +z. footprint { r: 0.7, h: 1.9 }.
5. `gradient-sign` "Gradient Sign": a red-bordered white triangle (a flat cone with seg 3, or three red boxes and a white
   triangle-ish plate) about 0.9 m across on a 1.6 m post, with a little black ramp shape on the face. footprint { r: 0.5, h: 2.3 }.
6. `falling-rocks-sign` "Falling Rocks Sign": the same triangle sign with three grey ball "rocks" tumbling down a black
   slope on the face. footprint { r: 0.5, h: 2.3 }.
7. `route-name-sign` "Route Sign": a brown tourist board 2.4 x 1.0 m on two posts (board centre y 1.7), a cream border,
   a blank face (the game writes the text on it at x 0, y 1.7, z 0.06). footprint { r: 1.3, h: 2.3 }.
8. `viewpoint-topograph` "Topograph": a round brass-topped table on a stone plinth (stone cyl radius 0.45, 1.0 m; a
   bronze disc radius 0.55 on top, tilted 12 degrees toward +z, with a few thin dark lines as engraved directions and a
   tiny peak shape at the centre). footprint { r: 0.6, h: 1.15 }.

## Done when
- `npx tsc --noEmit -p packages/prefabs` — no errors in your file.
- `npm test -w packages/prefabs` — every test that names one of your ids passes (and the whole suite passes, except a
  failure that names an id from `gta-mountain-places.ts` or `gta-mountain-gear.ts`, which other workers own).

## Out of scope
Every other file. Do not edit `catalog/index.ts` (already done).

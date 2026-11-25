# E29 common rules (read with every E29 issue)

## Environment

- Working directory: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a555bc9a9756be8e5` (a git worktree).
  Run every command from there. Use Git Bash. If `node`/`npx` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, `git stash` or `git checkout`.
- About 12 other workers edit other files at the same time. Edit ONLY the files your issue names. If a check fails in a
  file you do not own, ignore it (someone is mid-edit) and say so in your report.
- Keep LF line endings (the Write/Edit tools do; never convert a file).

## What a prefab is

`packages/prefabs` (`@lawn/prefabs`) is a library of small 3D models drawn from primitives. A prefab is plain data
(`PrefabDef`), built by `buildPrefab()`. Read `packages/prefabs/src/types.ts` (the format: `PrefabDef`, `Part`, the shapes
and what `d` means for each) and `packages/prefabs/src/palette.ts` (colour names for `c`; or use any `0xRRGGBB` number).
Style examples: `packages/prefabs/src/catalog/gta-houses.ts` (buildings) and `packages/prefabs/src/catalog/gta-odd-rides.ts`
(vehicles and a wearable cap).

## Modelling rules

- Units: 1 = one gnome's height (about a metre in Gnome Theft Auto). Buildings, vehicles and big scenery are modelled
  life-size: a door is 1.4 tall, a storey 2.2 to 2.6, a cafe chair seat 0.45 high.
- Every prefab stands on the ground: its lowest point is at y = 0 (the test allows +-0.03). Centred on x and z. Front faces +z.
- `at` is the CENTRE of a shape. A box of height h resting on the ground has `at: [x, h/2, z]`. A ball of radius r on the ground: `at: [x, r, z]`.
- `rot` is in DEGREES (x, y, z). Cylinders, cones and pills stand along y. A cylinder lying along x: `rot: [0, 0, 90]`;
  along z: `rot: [90, 0, 0]`. A `ring` is a hoop facing +z; flat on the ground: `rot: [90, 0, 0]`.
  A `wedge` is a ramp: full height at +z, zero at -z; `rot: [0, 180, 0]` flips it (see the cottage roof in gta-houses.ts).
- `mirror: true` adds a copy at -x (pairs of shutters, wheels, lamps). Use it to save parts.
- Look: chunky, low-poly, flat-shaded, readable from far away. **40 parts is the hard maximum** per prefab (a `mirror`
  part counts once in the source but builds two meshes; that is fine). Keep `seg` low (4 to 12).
- You may build part lists with small local helper functions inside your file (a row of windows, a column of balconies),
  e.g. `const windows = (y: number): Part[] => [...]` and spread them into `parts`. Import `Part` from `'../types'`.
- `c: 'tint'` for walls (and set `tint` on the prefab), `c: 'trim'` for roofs (and set `trim`). Glass: `c: 'glass'`.
  `glow: true` for lit windows and lamps.
- Big things (buildings, vehicles, scenery) MUST set `footprint: { r, h }` (a round collider: r = about half the smaller
  side, h = height) or `pivots` or `uses` containing `'sit'`: only then may the largest side exceed 3 (up to 30).
- `category: 'prop'`, `uses: ['place']` (add `'sit'` with a `seat` for chairs and vehicles), `emoji: []` unless the issue gives one.

## Z-fighting rules (docs/rendering.md; these flicker in game if broken)

- Two boxes that touch must not share a face. Details on a wall (windows, shutters, doors, signs, timber beams) stand
  **at least 0.04 proud** of the wall face: wall face at z = 3.0 -> a window box 0.06 deep centred at z = 3.04 (its back
  face 3.01 is inside the wall, its front face 3.07 is out).
- A trim, cornice or roof edge sits **at least 0.03 above or beyond** what it rests on, never flush. Two parts of the same
  height side by side: make one 0.03 taller. Stacked boxes: the upper one slightly narrower or wider (by 0.06+), never the
  same width and depth.
- Buildings in a terrace: nothing may go past x = +-width/2 (the row packs them 0.12 apart). Keep the side walls plain.
- Flat things on the ground (tiles, courts) are at least 0.08 thick.

## Data rules

- `id`: kebab-case, exactly as the issue lists. `name`: as listed.
- `tags`: lower-case single words: material, noun, synonyms, plus `'gta'` and `'euro'`.
- `about`: one plain line for developers: what it is, what the tint and trim colour, named parts.
- `examine`: **5 lines** (min 4, each 9 to 160 characters, all different).

## Examine voice (Gnome Theft Auto's European yard)

Gnome Theft Auto is a dry, satirical open-world parody set in a back garden at gnome scale. The new yard is a gnome take
on a stereotyped old European city (a mash of Paris, London and Berlin, never named). Gnomes are fired clay; money is
Acorns; they "crack", never bleed. Jokes are understated: long lunches, everything closed for a strike or a holiday,
forms in triplicate, queues that form for no reason, bells, cheese, berets, rain, pastries, opinions about coffee,
tiny cars parked in impossible gaps, scooters that are mostly noise. Mix per prefab: (1) what it looks like up close,
(2) a saying, (3) a practical tip, (4) a dry joke, (5) a small odd detail that hints at a story. Plain short sentences.
No real brands, cities, countries, people or languages by name (no "French", "Paris", "Vespa"). No pop culture.
Good: "Open from ten until lunch, and lunch is until tomorrow." · "The queue outside is for nothing. It is just a good queue."

## Checks

- `npx tsc --noEmit -p packages/prefabs`: no errors in YOUR file.
- `npx vitest run --root packages/prefabs src/catalog.test.ts -t "<one of your ids>"` for each id, or simply
  `npm test -w packages/prefabs` and look only at tests naming your ids. The test checks: unique ids, examine lines,
  palette names, `d` lengths per shape, tint/trim defaults, stands on y = 0 (+-0.03), size limits, roughly centred.
  When "builds, stands on the ground" fails, compute each part's lowest point (centre y minus half its height or its
  radius, accounting for rotation) and fix `at`.
- Read your finished file once top to bottom, checking each prefab against the look you were asked for.

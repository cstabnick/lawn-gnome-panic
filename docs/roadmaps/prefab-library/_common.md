# Common rules for every prefab-library catalog issue

## Environment

- Working directory: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\prefab-library` (a git worktree). Run every command from there.
- Node: if `node`/`npm` is not found, in Git Bash `export PATH="/c/Program Files/nodejs:$PATH"`; in PowerShell `$env:Path = "C:\Program Files\nodejs;" + $env:Path`.
- Dependencies are already installed. Do not run `npm install`. Do not run `git commit`.
- Six other workers are editing the other files in `packages/prefabs/src/catalog/` at the same time. Edit only the file(s) your issue names.

## What a prefab is

`packages/prefabs` (`@lawn/prefabs`) is a shared library of small 3D models drawn from primitives. A prefab is plain data, built into Three.js meshes by `buildPrefab()`, rendered as a UI icon by `prefabIcon()`, and dropped in the world by `createDrop()`.

Read first (all short):
- `packages/prefabs/src/types.ts`: the format (`PrefabDef`, `Part`, shapes and what `d` means for each, `Category`, `Use`). **This is the contract. Match it exactly.**
- `packages/prefabs/src/palette.ts`: the colour names you may use in `c` (or any `0xRRGGBB` number).
- `packages/prefabs/src/catalog/weapons.ts` and `packages/prefabs/src/catalog/armor.ts`: finished examples. Copy their style, including the examine voice.

## Modelling rules

- Units: 1 = one gnome's height. Dagger ~0.3 long, sword 0.55, potion 0.2 tall, shield 0.45 across, chest 0.5 wide, hat 0.45 tall.
- Every prefab stands on the ground: its lowest point is at y = 0 (the test allows ±0.03). It is centred on x and z. Its front faces +z.
- `at` is the CENTRE of the shape. A box of height h resting on the ground has `at: [x, h/2, z]`. A ball of radius r resting on the ground has `at: [x, r, z]`.
- `rot` is in DEGREES, order x, y, z. Cylinders, cones and pills stand along y. A cylinder lying along x: `rot: [0, 0, 90]`. Lying along z: `rot: [90, 0, 0]`. A `ring` is a hoop facing +z; lay it flat on the ground with `rot: [90, 0, 0]`.
- Squash a ball with `scale` (e.g. `scale: [1, 0.6, 1]` for a cap). `mirror: true` adds a copy at -x (pairs: boots, gloves, eyes).
- Look: chunky, low-poly, flat-shaded, readable at 32 px. 3 to 15 parts is typical; 40 is the hard maximum. Keep `seg` low (4 to 12).
- Hand-held things (`uses` includes `'hold'`) stand upright, handle at the bottom, and MUST have `grip` (the point on the handle a hand holds).
- Use `c: 'tint'` (and set `tint` on the prefab) for the part that should change colour (a cloth, a glaze, a shield face). Use `c: 'trim'` (and set `trim`) for a second recolourable part. Otherwise use palette names.
- `glow: true` for gems, flames, magic and anything that should look lit.

## Data rules

- `id`: kebab-case, unique across the whole library. Use the ids listed in your issue.
- `emoji`: write emoji WITHOUT the U+FE0F variation selector (`'🛡'`, not `'🛡️'`). Copy them from your issue. Several prefabs may list the same emoji; a game picks between them by the item's name words, so make `tags` include the nouns from the item names your issue lists.
- `tags`: lower case single words. Include the material, the noun and synonyms ('sling', 'slingshot', 'catapult').
- `uses`: every use that fits (see the `Use` type).
- `about`: one plain line for developers (what it is, what tints).
- `examine`: **5 or 6 lines** (minimum 4, each at most 160 characters, all different). Write them in the voice below.

## Examine voice (Gnomes of Gnomomia lore)

The world is a back garden seen from gnome height. Gnomes are fired clay, made 3,000 years ago by the vanished **Tall Ones** (the Gardeners), in **the Kiln**. When a gnome is hurt it *cracks*; glaze mends cracks. Coins are thin gold, but buttons are money too. Gems are "Tall-eyes" (they are really glass marbles). Magic has three schools only: Sun (heat, light), Rain (water, cold), Bloom (growth, healing). The only machine is the Mower, which nobody understands and everyone fears. Gnome technology is clay, wood, stone, string, water pressure and scavenged Tall One junk; there is no gunpowder or engine.

Rules:
- Gnomes never recognise garden objects for what they really are. A thimble is just "a helm". A bottlecap is "a plate". Never say hose, mower, birdbath, thimble or bottlecap *as if a gnome knows the real purpose*; describe what it looks like instead.
- Never show or explain the Tall Ones. Hints only.
- Mix the lines per prefab: (1) what it looks like up close, (2) a saying, rhyme or half-remembered myth from the Planting or the Charters, (3) a practical tip, (4) a dry joke, (5) a small odd detail that suggests a story. Plain, short sentences. One joke per line at most.
- Good examples: "For croquet, and for disagreements." · "It has dug a thousand flowerbeds and at least one argument." · "Gnome law: a sack on the ground belongs to whoever is still standing."
- Do not invent named characters. Place names you may use: Mossbottom, Thatchford, Birdbath Keep, Cloverfield, Hedgewood, the Rockery, the Verge, the Shed, the Fence, the Compost Heap, the Spigot.

## Checks

- `npx tsc --noEmit -p packages/prefabs`: no errors in YOUR file. (Errors in another worker's file mean they are mid-edit; ignore those.)
- `npm test -w packages/prefabs`: every test whose name contains one of YOUR ids passes. The test checks: unique kebab ids, 4+ examine lines of 9 to 160 characters, all different, hold ⇒ grip, valid palette names, `d` lengths per shape, tint/trim parts ⇒ default set, lowest point within ±0.03 of y = 0, largest side between 0.03 and 3, roughly centred. When a "builds, stands on the ground" test fails, compute the lowest point of every part (centre y minus half its height or its radius) and fix `at`.
- Read your finished file once from top to bottom, checking each prefab against the look you were asked for.

## Out of scope (do not edit)

`packages/prefabs/src/types.ts`, `palette.ts`, `build.ts`, `registry.ts`, `icon.ts`, `drop.ts`, `index.ts`, `catalog/index.ts`, `catalog.test.ts`, any other catalog file, anything under `games/`. Keep the starter prefabs already in your file (you may improve their parts, never remove them or change their ids). If you need a colour that the palette lacks, use a `0xRRGGBB` number.

## Damage stages (optional)

Vehicles and props that can be smashed carry `damage: DamageStage[]` (type in `src/types.ts`, example `src/catalog/damage-stages.ts`).
Two stages is plenty: a scuffed one (darken 0.2-0.3, one bent part, a dent or scorch mark) and a wrecked one (darken about 0.6, a part
off or hanging, `sink` a few hundredths, a smoke puff or two). Keep tilts small (under about 25 degrees: parts tilt around their own
centre, so a long part dips at its ends) and keep every level standing on the ground. Only name the parts you plan to bend or hide.

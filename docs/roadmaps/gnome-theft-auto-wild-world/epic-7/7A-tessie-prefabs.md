Epic: 7 (Gnome Theft Auto Wild World: the Tessie side quest)
Depends on: none

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree). Run every command from there. Use absolute paths.
- Node: if `node`/`npm` is not found, in Git Bash `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, push or open a PR.
- Five other workers are editing other files at the same time (another prefab file `gta-tessie-gear.ts`, the achievements catalog, and game files under `games/gnome-theft-auto`). Edit only the file this issue names.

## Goal

Model the four Tessie-quest prefabs in `packages/prefabs/src/catalog/gta-tessie.ts`, replacing the planner's stub shapes: **Tessie** (a huge, ancient pond turtle with a mossy shell; the game rides her like a boat), the **sonar buoy**, the **egg clutch raft** and the **HOA dredger**.

## Read first

- `packages/prefabs/src/catalog/gta-tessie.ts`: the stub (ids, names, tags, pivots). Keep ids, names, categories, uses and tags; replace `about`, `examine` and `parts`.
- `packages/prefabs/src/types.ts`: the format (`PrefabDef`, `Part`, shapes and what `d` means per shape, `pivots`, `group`).
- `packages/prefabs/src/palette.ts`: colour names you may use in `c` (or any `0xRRGGBB` number).
- `packages/prefabs/src/catalog/gta-wild-life.ts`: finished creature examples (polar bear with `pivots` and `group` parts). Copy its style.

## Modelling rules (all prefabs)

- Units: 1 = one gnome's height. Every prefab stands on the ground: its lowest point is at y = 0 (test allows ±0.03), centred on x and z, front faces +z. Largest side between 0.03 and 3.
- `at` is the CENTRE of a shape. A box of height h resting on the ground: `at: [x, h/2, z]`. A ball of radius r: `at: [x, r, z]`; a ball squashed with `scale: [sx, sy, sz]` has half-height r*sy.
- `rot` in DEGREES (x, y, z). Cylinders, cones and pills stand along y; lying along z: `rot: [90, 0, 0]`; along x: `rot: [0, 0, 90]`. `mirror: true` adds a copy at -x.
- Chunky, low-poly, flat-shaded, readable at 32 px. 3 to 25 parts (40 hard max). Keep `seg` low (4 to 12).
- A part with `group: '<pivot name>'` is attached to that pivot; its `at` is still in prefab coordinates (the builder offsets it). Every pivot name in `pivots` should have at least one part.
- `examine`: 5 or 6 lines, each 9 to 160 characters, all different. Voice: the world is a back garden seen from gnome height; gnomes are fired clay that cracks and is glued back; never say what a garden object really is; never show the Tall Ones; mix (1) a close look, (2) a saying or half-remembered myth, (3) a practical tip, (4) one dry joke, (5) an odd detail hinting at a story. Nothing ever gets wet, soaked or dripping, and nothing bleeds (lore ruling R-021): water only floats, sinks or slows things.
- `about`: one plain line for developers (what it is, named pivots, what tints).

## Change

`packages/prefabs/src/catalog/gta-tessie.ts` only. Exactly these four prefabs (ids fixed):

1. **`tessie`** (category `prop`, uses `['place', 'sit']`). Size is a contract with the game (it scales her x3 and seats the rider on the shell top): length 3.0 along z (z from about -1.5 at the tail to +1.5 at the nose), width about 2.2 including flippers, **shell top at y = 1.0** (a flattish area around (0, 1.0, -0.2) where a gnome sits). Look: a big domed carapace (squashed ball, olive/brown `0x5b6b3a`-ish) covered with moss patches (several flattened green balls `0x4f7a35`/`0x6b8f3a` on the dome), a few raised scute plates (flat boxes or squashed balls in a darker brown) and a pale plastron underneath; a long neck and a blunt, kindly head at +z with two small dark eyes; four paddle flippers (flattened pills or boxes). Ancient: a barnacle-ish pale crust or two, a lily pad stuck on the shell, a tuft of grass. Pivots (keep these names and roughly these positions): `head` [0, 0.55, 1.1], `flipper-0` (front left, -x) [-0.95, 0.35, 0.7], `flipper-1` (front right) [0.95, 0.35, 0.7], `flipper-2` (rear left) [-0.85, 0.3, -0.8], `flipper-3` (rear right) [0.85, 0.3, -0.8]. Put the neck and head parts in group `head`, each flipper in its own group. All other parts may use group `body` (add `body: [0, 0.5, 0]` to pivots) or no group. Lowest point y = 0 (the flippers' or plastron's underside). 15 to 30 parts. Examine: she is Tessie of Loch Moss, older than any gnome can count, whom most of Turfton thinks is made up.
2. **`sonar-buoy`** (prop, `['place']`): a listening float about 0.5 across and 0.9 tall: a round red-and-white float body (cylinder or squashed ball) at the bottom, a short mast with a small glowing lamp (`glow: true`) on top, a little horn or dish facing down at the base, a coil of string. A gnome contraption built from junk.
3. **`turtle-egg-clutch`** (prop, `['place']`): a small raft about 1.6 x 1.6 and at most 0.6 tall: a deck of 4-6 lashed sticks (boxes, wood colours), a nest of moss on it, and 6-9 pale round eggs (balls, `0xf2eee0`, a couple with faint speckles) heaped in the moss.
4. **`hoa-dredger`** (prop, `['place']`): the HOA's dredging barge, about 3.0 long (z), 1.4 wide, at most 1.8 tall, bow at +z: a flat beige-and-black hull (HOA colours: beige `0xc9b99b`, black `0x18181e`), a small pump house with a window, a big suction pipe sloping down off the bow, a crane arm, a sign board ("HOA" is not text; use a contrasting panel), a pennant. It wants the loch drained for a golf development, and it looks officious.

## Done when

- `npx tsc --noEmit -p packages/prefabs` reports no errors in `gta-tessie.ts` (errors in another worker's file mean they are mid-edit; ignore those).
- `npm test -w packages/prefabs` passes every test whose name contains `tessie`, `sonar-buoy`, `turtle-egg-clutch` or `hoa-dredger` (unique ids, 4+ examine lines of 9-160 chars all different, valid palette names, `d` lengths per shape, lowest point within ±0.03 of y = 0, largest side 0.03-3, roughly centred). When a "stands on the ground" test fails, compute each part's lowest point (centre y minus half its height or radius x scale y) and fix `at`.
- Read the finished file once, top to bottom, checking each prefab against its description.

## Out of scope

Every other file. In particular `packages/prefabs/src/catalog/gta-tessie-gear.ts` (another worker), `catalog/index.ts` (already registers this file), `types.ts`, `palette.ts`, `build.ts`, anything under `games/` and `packages/achievements/`.

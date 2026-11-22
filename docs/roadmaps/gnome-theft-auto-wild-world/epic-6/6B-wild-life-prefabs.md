Epic: 6 Wildlife and region life (Gnome Theft Auto Wild World)
Depends on: none

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree). Run every command from there.
- Node: in Git Bash, if `node`/`npm` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; do not run `npm install`. Do not `git commit`, push or stash.
- Other workers are editing other files in `packages/prefabs/src/catalog/` and `games/gnome-theft-auto/` at the same time. Edit ONLY the file named under Change. Type errors in other files are other workers mid-edit: ignore them.

## Goal

Six prefabs for Frostbite Fells and Tallgrass Commons exist: `polar-bear`, `deck-chair`, `bee`, `bee-hive`, `giant-grass-blade`, `icicle-scarf`.

## Read first

- `docs/roadmaps/prefab-library/_common.md`: the modelling, data and examine-voice rules. Follow them (except its Environment section: use the one above). Units are gnome heights, lowest point at y = 0, centred on x and z, front faces +z, `rot` in degrees, largest side between 0.03 and 3, at most 40 parts.
- `packages/prefabs/src/types.ts`: `PrefabDef`, `Part` (`group` puts a part under a pivot, `name` names one part), `pivots`, `wear`.
- `packages/prefabs/src/palette.ts`: colour names (or `0xRRGGBB`).
- `packages/prefabs/src/catalog/critters.ts`: reference for animated creatures (pivots + `group`).
- `packages/prefabs/src/catalog/cosmetics-neck.ts`: reference for neck gear (`uses: ['wear-neck']`): a cord ring laid flat at y 0.01, radius 0.21, with things hanging forward on the chest (+z), well clear of the head.

## Change

- `packages/prefabs/src/catalog/gta-wild-life.ts` (exists as an empty stub exporting `GTA_WILD_LIFE`, already registered in `catalog/index.ts`). Fill the array with the six defs below. Keep the export name and type `readonly PrefabDef[]`.

Every def: `emoji: []`, 5 or 6 `examine` lines in the gnome voice (no gore, nothing bleeds, nothing gets wet or soaked), `tags` with the nouns plus 'gta'.

1. `polar-bear`, name 'Fells Polar Bear', `category: 'prop'`, `uses: ['place']`, tags include 'bear', 'polar', 'animal', 'critter', 'tundra', 'chill'.
   Size about 1.2 wide x 1.7 tall x 1.4 deep. A big white bear SITTING upright, lounging: bottom on the ground at y = 0, back slightly reclined (lean the torso about 10-15 degrees back, towards -z), hind legs stretched forward along +z on the ground, round belly, small round ears, black nose, and dark SUNGLASSES across the eyes (a thin black box bridge and two dark flattened discs, `name: 'shades'`, in the `head` group).
   Pivots: `body` [0, 0.6, 0]; `head` [0, 1.35, 0.1] (head parts in group `head`); `arm-0` (left, -x) at the left shoulder about [-0.45, 1.05, 0.05]; `arm-1` (right) about [0.45, 1.05, 0.05]. Each arm is a pill hanging down and a little forward from its pivot, resting on the belly or armrest. The game rotates `arm-0`/`arm-1` on z for a shrug and the `head` on x/z.
   `tint` 0xf7f7f2 (fur).
2. `deck-chair`, name 'Deck Chair', `category: 'furniture'`, `uses: ['place', 'sit']`, tags 'deck', 'chair', 'lounger', 'canvas', 'stripes'.
   About 0.8 wide x 0.9 tall x 1.3 long. A wooden folding frame (thin boxes) with a sagging striped canvas sling: seat front low at the +z end (about 0.3 up), back rising to 0.9 at the -z end, reclined about 35 degrees. Stripes: 3 to 5 thin boxes along the sling alternating `tint` and `trim`. The bear will be placed sitting on it with its bottom at about y 0.3.
   `tint` 0x2f64c9 (stripe), `trim` 0xf4f4f0 (stripe).
3. `bee`, name 'Commons Bee', `category: 'prop'`, `uses: ['place']`, tags 'bee', 'insect', 'buzz', 'animal', 'critter', 'parkland'.
   About 0.22 wide x 0.2 tall x 0.32 long. Fuzzy yellow-and-black striped body (a ball stretched along z with 2-3 thin dark rings or bands), dark head at +z, a little stinger cone at -z, two translucent-looking pale wings on top (use `c: 'white'`; no alpha field needed).
   Pivots: `body` [0, 0.1, 0]; `wing-0` (left) [-0.03, 0.17, 0]; `wing-1` (right) [0.03, 0.17, 0]; the wing parts are flattened balls sticking out sideways from their pivots. The game flaps wings by rotating z. It stands on tiny legs so its lowest point is y = 0 (the game hovers it in the air).
4. `bee-hive`, name 'Straw Hive', `category: 'prop'`, `uses: ['place']`, tags 'hive', 'skep', 'bee', 'straw', 'parkland'.
   About 0.8 wide x 1.2 tall. A dome-shaped straw skep (stacked rings or squashed balls getting smaller upwards, `c: 'straw'` or 0xd9b35b) on a small wooden stand (a stump or a box table), a dark entrance hole at the front (+z) near the bottom of the dome. NO pivots and no named parts.
5. `giant-grass-blade`, name 'Giant Grass Tuft', `category: 'prop'`, `uses: ['place']`, tags 'grass', 'blade', 'tuft', 'tall', 'parkland'.
   A tuft of 3 tall grass blades from one root, about 0.9 wide x 3.0 tall (exactly at most 3.0, the size limit). Each blade: 3 stacked thin flattened boxes or wedges (width 0.22 at the root narrowing to 0.06 at the tip, thickness 0.03), each segment tilted a little more than the one below so the blade curves outward; the three blades lean in different directions (yaw them 0, 120, 240 degrees). `tint` 0x5fa83a; the root segment may be darker (`trim` 0x3f7a2a).
   NO pivots, NO named parts, no glow: the game draws thousands of these with `buildPrefabInstances`, which only bakes plain parts. Keep it at 12 parts or fewer.
6. `icicle-scarf`, name 'Icicle Scarf', `category: 'armor'`, `uses: ['wear-neck']`, tags 'scarf', 'icicle', 'frost', 'knit', 'sgnowme', 'neck'.
   What the sgnowmes of Frostbite Fells wear: a frost-white knitted scarf (a `ring` laid flat like the cords in cosmetics-neck.ts: `{ s: 'ring', d: [0.21, 0.035], at: [0, 0.035, -0.03], rot: [90, 0, 0] }`, `c: 'tint'`), one end hanging down the chest at +z (a thin box about 0.08 wide, 0.2 long, tilted), and 4-5 small icicles (thin cones pointing down, `c: 0xcfeefc`, `glow: false`) hanging along the front of the ring. Lowest point y = 0 (shift parts up if a hanging end goes below 0). `tint` 0xf4f8ff.
   It must not clip the gnome's head: `npm test -w packages/gnome` checks every `wear-neck` prefab (`gear-clearance.test.ts`). Keep everything below y 0.12 near the centre and the hanging end forward at z >= 0.15.

Examine lore you may use: polar bears in the Fells lounge in deck chairs in sunglasses and are the calmest creatures anyone knows: shoot one and it shrugs. Sgnowmes are fired-clay gnomes glazed frost-white (not snow; they never melt). The Commons' grass is taller than the old Fence; bees defend their hives in swarms.

## Contract

```ts
export const GTA_WILD_LIFE: readonly PrefabDef[]   // ids exactly: polar-bear, deck-chair, bee, bee-hive, giant-grass-blade, icicle-scarf
```
Pivot names exactly as above: polar-bear `body`, `head`, `arm-0`, `arm-1` and a part named `shades`; bee `body`, `wing-0`, `wing-1`.

## Done when

- `npx tsc --noEmit -p packages/prefabs` shows no error in `gta-wild-life.ts`.
- `npm test -w packages/prefabs` passes every test whose name contains one of the six ids (and the catalog-wide tests).
- `npm test -w packages/gnome` passes the `icicle-scarf stays outside the head and face` test.
- You read the file top to bottom once and checked each prefab against its description.

## Out of scope

Every other file. In particular `packages/prefabs/src/catalog/gta-farm-critters.ts` (another worker), `catalog/index.ts`, `types.ts`, `packages/gnome/`, anything under `games/`.

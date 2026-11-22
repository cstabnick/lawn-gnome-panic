Epic: 4 (Wild World: water, bridges and boats)
Depends on: none

## Environment
- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree). Run every command from there.
- Node: if `node`/`npm` is not found, in Git Bash run `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are
  installed: never run `npm install`. Never commit, push, stash, reset, or `git checkout`/`git restore` any file.
- Other workers are editing other catalog files in `packages/prefabs/src/catalog/` at the same time. Edit only
  `packages/prefabs/src/catalog/gta-boats.ts`. Errors in another file mean someone is mid-edit: ignore them.

## Goal
Five boat prefabs for Gnome Theft Auto in `packages/prefabs/src/catalog/gta-boats.ts` (already imported by
`catalog/index.ts`; today the array is empty). The game draws them at scale 1 as drivable vehicles.

## Read first
- `packages/prefabs/src/types.ts`: `PrefabDef`, `Part` (shapes and what `d` means for each), `seat`, `pivots`, `group`.
- `packages/prefabs/src/palette.ts`: colour names for `c` (or any `0xRRGGBB` number).
- `packages/prefabs/src/catalog/gta-guns-air.ts`: the `crop-duster` prefab: a vehicle with `uses: ['place', 'sit']`,
  `seat`, `pivots: { prop: ... }`, and propeller parts in `group: 'prop'` whose `at` are in prefab coordinates. Copy its
  shape and examine voice.
- `docs/roadmaps/prefab-library/_common.md`: the modelling and examine rules (ignore its Environment section).

## Change
`packages/prefabs/src/catalog/gta-boats.ts`: fill `GTA_BOATS` with exactly these five. Every one: `category: 'prop'`,
`uses: ['place', 'sit']`, `emoji: []`, `footprint: { r, h }` (r about half the length), lowest point y = 0 (the keel),
centred on x and z, **bow toward +z**, modelled life-size in metres (a gnome is about 1 tall), 12-35 parts, `about`
starting "Gnome Theft Auto:", 5 examine lines (Turfton tone: a garden thing gnomes use as a boat, never named for
what it really is). `seat` is the top of the driver's seat (the sitting gnome goes there) and must be exactly:

| id | name | look | size (L along z x beam x height) | seat | details |
|---|---|---|---|---|---|
| `walnut-dinghy` | Walnut Dinghy | half a walnut shell as a rowing boat: wrinkled brown shell (squashed balls/boxes), pale inner, two plank thwarts, two oars resting in rowlocks | 2.6 x 1.8 x 0.65 | `[0, 0.3, -0.35]` | thwart tops at y 0.3, z -0.35 and z 0.55 |
| `gravy-boat` | Gravy Boat | a white porcelain gravy boat as a speedboat: long glossy hull, a raised spout at the bow, the curled handle at the stern, an outboard motor below it | 3.6 x 1.6 x 0.7 (spout tip up to y 1.0) | `[0, 0.35, -0.5]` | seat tops y 0.35 at z -0.5 and -1.2; outboard propeller in `group: 'prop'`, `pivots: { prop: [0, 0.2, -2.0] }` (2 blades + hub, all at y >= 0) |
| `clog-cruiser` | Clog Cruiser | a giant yellow wooden clog: rounded, slightly upturned toe at the bow, open heel as the cockpit, a little steering wheel, a pennant on a short mast | 5.0 x 2.2 x 1.0 | `[0, 0.55, -1.4]` | bench tops y 0.55 at (-0.6, 0.1), (0.6, 0.1), (0, 1.0); steering wheel at (0, 0.95, -0.85); outboard `prop` at `[0, 0.2, -2.6]` |
| `watering-can-steamer` | Watering-Can Steamer | a green tin watering can as a paddle ferry: a long flat hull with a deck at y 0.8, the can body standing on deck as the cabin (cylinder r 0.8 at z -0.9), its spout as a raised funnel pointing forward-up with the rose on the end, red paddle wheels both sides | 8.0 x 3.4 x 0.8 (cabin up to ~3.0) | `[0, 0.9, -2.6]` | deck bench tops y 0.9 at (+-1.1, 0.6) and (+-1.1, 2.0); both paddle wheels (rings or flat cylinders r 0.6 with 4-6 paddle boxes each, at x +-1.85, centre y 0.6, z 0) in `group: 'reel'` with `pivots: { reel: [0, 0.6, 0] }` |
| `hoa-patrol-boat` | HOA Patrol Boat | an inflatable patrol boat in HOA beige with a navy stripe, a centre console, a light bar (one red, one blue `glow: true` box), a clipboard on the console | 4.0 x 1.8 x 0.7 (light bar up to ~1.5) | `[0, 0.45, -0.6]` | seat tops y 0.45 at z -0.6 and -1.4; console at (0, 0.75, 0); outboard `prop` at `[0, 0.2, -2.05]` |

The game spins `group: 'prop'` about its local z axis and `group: 'reel'` about its local x axis (the pivots above
are the rotation centres). Keep every seat area clear of other parts so a seated gnome does not clip into them.

## Contract
- Ids exactly `walnut-dinghy`, `gravy-boat`, `clog-cruiser`, `watering-can-steamer`, `hoa-patrol-boat`;
  `export const GTA_BOATS: readonly PrefabDef[]`.
- The `seat` values in the table (the game's vehicle specs in `games/gnome-theft-auto/src/config.ts` use them).

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no errors in `gta-boats.ts`.
- `(cd packages/prefabs && npx vitest run src/catalog.test.ts -t "boat|dinghy|clog|steamer")` passes for all five ids
  (the test checks ids, examine lines, palette names, part sizes, standing on y = 0, centred, largest side < 30 for
  props with a footprint or seat).
- `npm test -w packages/prefabs` has no failures that mention your ids.

## Out of scope
Every other file (types.ts, palette.ts, build.ts, catalog/index.ts, other catalog files, anything under `games/`).

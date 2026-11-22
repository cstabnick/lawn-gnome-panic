Epic: 4 (Wild World: water, bridges and boats)
Depends on: none

## Environment
- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree). Run every command from there.
- Node: if `node`/`npm` is not found, in Git Bash run `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are
  installed: never run `npm install`. Never commit, push, stash, reset, or `git checkout`/`git restore` any file.
- Other workers are editing other catalog files in `packages/prefabs/src/catalog/` at the same time. Edit only
  `packages/prefabs/src/catalog/gta-waterworks.ts`. Errors in another file mean someone is mid-edit: ignore them.

## Goal
Six life-size prefabs for Gnome Theft Auto's river, canal and loch in `packages/prefabs/src/catalog/gta-waterworks.ts`
(already imported by `catalog/index.ts`; today the array is empty): a road bridge, a dock, a wharf, canal lock gates,
the loch weir and a field sluice. The game places them at scale 1 (the bridge stretched along its length).

## Read first
- `packages/prefabs/src/types.ts`: `PrefabDef`, `Part` (shapes and what `d` means for each).
- `packages/prefabs/src/palette.ts`: colour names for `c` (or any `0xRRGGBB` number).
- `packages/prefabs/src/catalog/gta-world.ts`: finished GTA scenery prefabs (style, `footprint`, examine voice).
- `docs/roadmaps/prefab-library/_common.md`: the modelling and examine rules (ignore its Environment section).

## Change
`packages/prefabs/src/catalog/gta-waterworks.ts`: fill `GTA_WATERWORKS` with exactly these six. Every one:
`category: 'prop'`, `uses: ['place']`, `emoji: []`, a `footprint: { r, h }`, lowest point y = 0, centred on x and z,
**front toward +z**, life-size in metres (a gnome is about 1 tall), 8-30 parts, `about` starting "Gnome Theft Auto:",
5 examine lines in a Turfton tone (gnome engineering with a sponsor's name painted on it, e.g. "Pay-n-Glaze Lock No. 1";
never say what the Tall Ones' garden thing really is). The game relies on these exact dimensions:

| id | name | shape (x = across, z = along the front axis) | heights the game relies on |
|---|---|---|---|
| `road-bridge` | Road Bridge | a road deck 12 wide (x) and 24 long (z) on two stone abutments at z = -11 and z = +11 (each 12 x 2.3 x 2, from y 0), kerbs along both edges (x = +-5.5), railings (posts every 3 m and a top rail) along x = +-5.8, a sponsor plaque on one railing | deck slab top at **y = 2.8** (slab 0.5 thick, y 2.3-2.8); railing top y 3.7; nothing between the abutments below y 2.3 (boats pass under) |
| `wooden-dock` | Wooden Dock | a plank jetty 3 wide (x) and 12 long (z), on posts (cylinders) at the corners and every 3 m, a bollard and a coiled rope near the +z end, a life ring on a post | deck top at **y = 1.6** (planks 0.15 thick); posts from y 0 |
| `wharf` | Canal Wharf | a brick-and-stone quay 12 wide (x) and 6 deep (z), front face at z = +3 toward the water, iron bollards along the front edge on top, a crate and a coil of rope | top surface at **y = 1.8** |
| `canal-lock-gate` | Canal Lock Gates | open mitre gates of a canal lock across a 10 m wide canal: two timber gate leaves (0.3 thick, 2.6 tall, 4.8 long) standing parallel to z against the walls at x = +-4.7, each with a long balance beam on top reaching back past the wall; a footbridge plank across the top at y 2.4-2.6 spanning x -5.6..5.6; a sponsor board | nothing between x = -4.4 and x = 4.4 below y 2.4 (boats pass); top y 2.6 |
| `loch-weir` | Loch Weir | a stone weir across a 12 m river: a sill 12 wide (x), 2 deep (z), 2.4 tall, with a timber sluice frame in the middle (two posts 3.2 tall at x = +-1.2, a cross beam, a board) and a little wheel to raise the board | sill top at **y = 2.4** |
| `field-sluice` | Field Sluice | a small concrete headwall 3 wide (x), 2.2 tall, 1 deep (z) with an iron gate in a slot (front +z) and a hand wheel on top; a short ditch channel lip in front | top y 2.2 |

## Contract
- Ids exactly as in the table; `export const GTA_WATERWORKS: readonly PrefabDef[]`.
- The heights in the right-hand column (the game's `src/waterworks.ts` places them by those numbers).

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no errors in `gta-waterworks.ts`.
- `(cd packages/prefabs && npx vitest run src/catalog.test.ts -t "bridge|dock|wharf|lock|weir|sluice")` passes for all
  six ids (ids, examine lines, palette names, part sizes, standing on y = 0, centred, largest side < 30).
- `npm test -w packages/prefabs` has no failures that mention your ids.

## Out of scope
Every other file (types.ts, palette.ts, build.ts, catalog/index.ts, other catalog files, anything under `games/`).

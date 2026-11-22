Epic: 4 (Wild World: water, bridges and boats)
Depends on: none

## Environment
- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree). Run every command from there.
- Node: if `node`/`npm` is not found, in Git Bash run `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are
  installed: never run `npm install`. Never commit, push, stash, reset, or `git checkout`/`git restore` any file.
- Other workers are editing other catalog files in `packages/prefabs/src/catalog/` at the same time. Edit only
  `packages/prefabs/src/catalog/gta-water-hints.ts`. Errors in another file mean someone is mid-edit: ignore them.

## Goal
Five life-size prefabs for Gnome Theft Auto in `packages/prefabs/src/catalog/gta-water-hints.ts` (already imported by
`catalog/index.ts`; today the array is empty): a waterwheel sawmill and four quiet hints that the river is really a
giant back garden's plumbing (a hose nozzle, a pond-liner rim, a gutter lip, a tipped stone heron).

## Read first
- `packages/prefabs/src/types.ts`: `PrefabDef`, `Part`, `pivots`, `group`.
- `packages/prefabs/src/palette.ts`: colour names for `c` (or any `0xRRGGBB` number).
- `packages/prefabs/src/catalog/gta-world.ts`: finished GTA scenery prefabs (style, `footprint`, examine voice).
- `docs/roadmaps/prefab-library/_common.md`: the modelling and examine rules (ignore its Environment section). Its
  "never recognise garden objects" rule matters most here: gnomes see a hose nozzle as "a great brass horn in the
  hill", the pond liner as "black rubbery rock", never by their real names.

## Change
`packages/prefabs/src/catalog/gta-water-hints.ts`: fill `GTA_WATER_HINTS` with exactly these five. Every one:
`category: 'prop'`, `uses: ['place']`, `emoji: []`, a `footprint: { r, h }`, lowest point y = 0, centred on x and z,
front toward +z, life-size in metres (a gnome is about 1 tall), 6-30 parts, `about` starting "Gnome Theft Auto:"
(the `about` line may say what it really is; the examine lines never do), 5 examine lines.

| id | name | shape | numbers the game relies on |
|---|---|---|---|
| `waterwheel-mill` | Waterwheel Sawmill | a timber sawmill shed (about 4.5 x 3.4 x 4, pitched roof) standing on stilt posts, floor at y 1.2; a big waterwheel on its +x side: a rim (`ring` or thin cylinders) and 8 paddle boxes, axle along x, all wheel parts in `group: 'wheel'`; a saw blade on the shed's -x wall | wheel centre at **(3.6, 2.6, 0)**, radius 2.6 (its lowest paddle touches y 0); `pivots: { wheel: [3.6, 2.6, 0] }`; shed floor y 1.2 |
| `hose-nozzle` | Brass Horn | a giant brass garden-hose nozzle half buried in a hillside: a long tapering brass barrel (about 4 long, r 0.9 to 0.5) tilted about 25 degrees up from the ground, pointing +z, a ridged collar, a curved trigger lever, a green rubber sleeve vanishing into a mound of earth at the back | mound from y 0; overall about 5 long |
| `pond-liner-rim` | Black Rubber Rim | a length of black pond-liner lip: a folded, slightly wavy black rubbery strip 8 long (x), 0.35 tall, 0.6 deep, with a crease and a torn corner, moss on top | 8 along x |
| `gutter-lip` | Concrete Lip | a straight concrete kerb lip of a giant storm gutter: 10 long (x), 0.4 tall, 0.8 deep, with an aggregate stripe and a crack, a few weeds | 10 along x |
| `stone-heron` | Toppled Stone Heron | a stone heron statue lying on its side (long legs, a long neck and beak), chipped and mossy, its square plinth tipped beside it; about 3 long | lying, nothing above y 1.2 |

## Contract
- Ids exactly as in the table; `export const GTA_WATER_HINTS: readonly PrefabDef[]`.
- `waterwheel-mill` wheel pivot `[3.6, 2.6, 0]`, radius 2.6, floor 1.2 (the game spins `group: 'wheel'` about its
  local x axis and sets the mill so the wheel dips into the river).

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no errors in `gta-water-hints.ts`.
- `(cd packages/prefabs && npx vitest run src/catalog.test.ts -t "waterwheel|nozzle|liner|gutter|heron")` passes for
  all five ids.
- `npm test -w packages/prefabs` has no failures that mention your ids.

## Out of scope
Every other file (types.ts, palette.ts, build.ts, catalog/index.ts, other catalog files, anything under `games/`).

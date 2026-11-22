Epic: 6 Wildlife and region life (Gnome Theft Auto Wild World)
Depends on: none

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree). Run every command from there.
- Node: in Git Bash, if `node`/`npm` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; do not run `npm install`. Do not `git commit`, push or stash.
- Other workers are editing other files in `packages/prefabs/src/catalog/` and `games/gnome-theft-auto/` at the same time. Edit ONLY the file named under Change. Type errors in other files are other workers mid-edit: ignore them.

## Goal

The five Cloverfield Farms animals exist as prefabs, with named pivots the game animates: `cow`, `sheep`, `pig`, `hen`, `squirrel`.

## Read first

- `docs/roadmaps/prefab-library/_common.md`: the modelling, data and examine-voice rules. Follow them (except its Environment section: use the one above). Note: units are gnome heights, lowest point at y = 0, centred on x and z, front faces +z, `rot` in degrees, largest side between 0.03 and 3, at most 40 parts.
- `packages/prefabs/src/types.ts`: `PrefabDef`, `Part` (`group` puts a part under a pivot), `pivots`.
- `packages/prefabs/src/palette.ts`: colour names you may use (or `0xRRGGBB`).
- `packages/prefabs/src/catalog/critters.ts`: the reference for animated creatures: `pivots` (a name to a point), parts with `group: '<pivot>'` move with that pivot. Copy its style (legs as cylinders under `leg-k` pivots at the hips).

## Change

- `packages/prefabs/src/catalog/gta-farm-critters.ts` (exists as an empty stub exporting `GTA_FARM_CRITTERS`; it is already registered in `catalog/index.ts`). Fill the array with the five defs below. Keep the export name and its type `readonly PrefabDef[]`.

Common to all five: `category: 'prop'`, `uses: ['place']`, `emoji: []`, 5 or 6 `examine` lines (gnome voice; these are Cloverfield animals, sized for gnomes to live beside: gnomes find them big, warm and opinionated; no gore, nothing bleeds; never name a real-world farm product such as milk, bacon or eggs as food), `tags` include the animal noun, 'animal', 'critter', 'farm', 'gta'.

Pivot contract (the game's `src/critters.ts` looks these names up and animates them; any you leave out simply do not move):
- `body`: everything that bobs (torso, head parts can also go here if there is no `head` pivot). Pivot point at about the torso centre.
- `head`: the head and face parts. Pivot at the neck joint. The game nods it by rotating x.
- `tail`: tail parts. Pivot at the tail root. The game wags it by rotating y.
- `leg-0` .. `leg-3` for four-legged animals, pivot at each hip/shoulder; leg k at (sx, sz) = (-1,-1), (-1,1), (1,-1), (1,1) (so leg-1 and leg-3 are the front legs, since front is +z). The game swings legs by rotating x. Each leg part hangs straight down from its pivot to the ground (y = 0).
- Two-legged (hen): `leg-0` (left, -x) and `leg-1` (right, +x); `wing-0` (left) and `wing-1` (right), pivot at the shoulder; the game flaps wings by rotating z.

The five (sizes are the whole animal, world units = gnome heights):

| id | name | size (w x h x length along z) | look | tint / trim |
|---|---|---|---|---|
| `cow` | Cloverfield Cow | 0.9 x 1.5 x 2.1 | boxy body on four legs, big head with two short horns and ears, dark patches (2 or 3 flattened balls on the flanks), pink muzzle, a tail with a tuft, a small bell on a collar | `tint` 0xf4f4f0 (hide), `trim` 0x2b2b2b (patches) |
| `sheep` | Cloverfield Sheep | 0.7 x 0.95 x 1.2 | fat cloud of wool (4-6 overlapping balls) on thin dark legs, dark face and ears poking out the front | `tint` 0xf4f1e8 (wool), `trim` 0x2e2a28 (face, legs) |
| `pig` | Cloverfield Pig | 0.6 x 0.75 x 1.1 | round body (a squashed ball or pill on its side), flat snout disc with two dark nostrils, floppy ears, curly tail (a small ring), short legs | `tint` 0xf2b8c6 (skin) |
| `hen` | Cloverfield Hen | 0.35 x 0.5 x 0.45 | plump ball body, small head with a red comb and wattle, yellow beak (cone), tail feathers (2-3 cones fanned up at the back), two thin yellow legs, wings as flattened balls on the sides | `tint` 0xfff8e8 (feathers) |
| `squirrel` | Drey Squirrel | 0.4 x 0.75 x 0.8 incl. tail | slim body leaning up a little, big head with ears and a dark bandit mask band across the eyes, huge bushy tail curling up behind (3-4 balls stacked up and forward), small legs | `tint` 0xb5651d (fur), `trim` 0x2a1d14 (mask) |

Pivots per animal: cow, sheep, pig, squirrel: `body`, `head`, `tail`, `leg-0`..`leg-3`. Hen: `body`, `head`, `leg-0`, `leg-1`, `wing-0`, `wing-1`.
Eyes: small dark balls (`c: 0x161616`), `mirror: true`. The squirrel's eyes may have a glint ball (`c: 'white'`).

## Contract

```ts
export const GTA_FARM_CRITTERS: readonly PrefabDef[]   // ids exactly: cow, sheep, pig, hen, squirrel
```
The game builds them with `buildPrefab(id, { scale: 1, lights: false })` and finds pivots with `object.getObjectByName('leg-0')` etc.

## Done when

- `npx tsc --noEmit -p packages/prefabs` shows no error in `gta-farm-critters.ts`.
- `npm test -w packages/prefabs` passes every test whose name contains `cow`, `sheep`, `pig`, `hen` or `squirrel` (and the catalog-wide tests, such as unique ids).
- You read the file top to bottom once and checked each animal against its row (size, front at +z, pivots named exactly, lowest point at 0).

## Out of scope

Every other file. In particular `packages/prefabs/src/catalog/gta-wild-life.ts` (another worker), `catalog/index.ts`, `types.ts`, anything under `games/`.

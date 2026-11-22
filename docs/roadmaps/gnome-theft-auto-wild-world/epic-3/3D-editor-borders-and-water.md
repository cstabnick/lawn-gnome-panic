Epic: 3 (Wild World: world expansion and the region map)
Depends on: none

## Environment
- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree; stay in it, use absolute paths).
- Git Bash: if `node` is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first. Dependencies are installed.
- Five other workers are editing `games/gnome-theft-auto` and `docs/lore` at the same time. You own only the three
  files under Change. Do not touch the game or its `.level.json` files.
- Do not commit, push or open a PR. Do not start the editor's dev server by hand (`npm run e2e` starts its own; you
  are the only worker running it).
- `tools/level-editor` type-check has two old errors in `src/adapters/gnomeSetRadio.ts`; they are not yours, leave them.

## Goal
The level editor shows a GTA region as the game now defines it: the ground outside the region's border polygon is
dark (not just outside the bounding box), the reserved river and canal (`water` paths) show in water blue on the
ground, and still-water markers (kind `water`) show as translucent blue boxes. The two new regions (Loch Moss,
Tallgrass Commons) open like the others (they already appear in the region list).

## Read first
- `tools/level-editor/src/adapters/gtaLevel.ts`: `GtaLevel`, `groundColourAt(l, x, z)`, `distToPath`, the colours.
- `tools/level-editor/src/adapters/gtaLevel.test.ts`: the tests you extend.
- `tools/level-editor/src/adapters/gtaObjects.ts`: `POST_COLOUR`, the `zone(w, d, color, x, z)` helper and the
  marker loop (lines 49-80).
- `games/gnome-theft-auto/src/levels.ts` (read only): `inPolygon(poly, x, z)` (exported), `GtaRegionData.border`
  (region-local, the same coordinates the editor uses), the `water` marker kind (`data: { w, d }`).

## Change
- `tools/level-editor/src/adapters/gtaLevel.ts`:
  - `import { inPolygon } from '@gta/levels';` (add to the existing `@gta/levels` import).
  - `const WATER_COLOUR = 0x3d8fd6;`
  - `groundColourAt(l, x, z)` order: road (as now) → water (a `kind === 'water'` path within half its width, default
    width 8) → `OUTSIDE_COLOUR` when `l.data.border` has 3 or more points and `!inPolygon(l.data.border, x, z)`, or
    when outside the bounds (as now) → `l.data.ground`. Update its doc comment.
- `tools/level-editor/src/adapters/gtaObjects.ts`: `POST_COLOUR.water = 0x3d8fd6`; in the marker loop, a `water`
  marker draws `zone(finite(d.w), finite(d.d), colour, m.x, m.z)` like an `area`. Update the file's first comment.
- `tools/level-editor/src/adapters/gtaLevel.test.ts`:
  - The existing test "a road colour shows on a highway point and a ground colour away from it" checks
    `groundColourAt(level, 0, -500)` in `dust-flats`; that point is now outside the Dust Flats border. Change it to
    `groundColourAt(level, -100, 0)` (world 300, 0: inside the desert, off every road).
  - Add: in `mossy-wood`, the first point of the `river-ravine` path is `WATER_COLOUR` (0x3d8fd6).
  - Add: in `mossy-wood`, region-local (-450, -550) (world -850, -550, which is Loch Moss) is the outside colour,
    and (-100, 0) is the ground colour.
  - Add: `loch-moss` and `tallgrass-commons` open (`docToLevel`) with `w` 600, `d` 600, and round-trip byte for byte
    (the existing loop over `REGION_IDS` already covers the round trip; just check they are in `REGION_IDS`).

## Contract
- `groundColourAt(l: GtaLevel, x: number, z: number): number` keeps its signature; region-local coordinates.
- `inPolygon(poly: readonly (readonly [number, number])[], x: number, z: number): boolean` from `@gta/levels`:
  true inside or on the edge.
- Level documents are never changed by opening them (the byte-for-byte test must still pass for all seven regions).

## Done when
- `npm test -w tools/level-editor` passes (from the repo root).
- `npx tsc --noEmit -p tools/level-editor` shows no errors in the files you changed.
- `npm run e2e -w tools/level-editor` passes (or, if it already failed before your change for a reason outside GTA,
  say so with the failing step).

## Out of scope
- Everything under `games/` (including `levels.ts` and the `.level.json` files), the road tool
  (`tools/level-editor/src/tools/road.ts`), other adapters. No water drawing tool (Epic 4 authors water).

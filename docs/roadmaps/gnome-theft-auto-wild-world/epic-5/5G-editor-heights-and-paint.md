Epic: 5 (Terrain variation per region), issue 5G: the level editor shows GTA's hills and paint
Depends on: none

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree; stay in it). Git Bash on
  Windows. If `node` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Six other workers are authoring Gnome Theft Auto's region landforms at the same time (they edit
  `games/gnome-theft-auto/src/landforms/<region>.ts` and the region `.level.json` files), and other sessions edit other
  game files. You edit only the two editor files under Change. Errors that `tsc` reports inside
  `games/gnome-theft-auto/src/` are not yours: ignore them. If a test crashes inside a game file that is mid-edit, wait a
  minute and run it again.
- Do not commit, push, start a dev server (the editor's port 5393 may be in use) or run the e2e test.

## Goal

Opening a Gnome Theft Auto region in the level editor (`tools/level-editor`, adapter `gnome-theft-auto`) shows the
region's real ground: the game's heights (hills, mesas, the glen) and its terrain paint colours (rock, dirt trails,
mud, ice, gravel...), instead of a flat plate in one colour. Trails (road paths whose id starts with `trail/`) show in
a dirt colour instead of the road colour.

## Read first

- `tools/level-editor/src/adapters/gta.ts`: `createWorld` builds a flat stub terrain (`createStubTerrain` with no
  `heightAt`). The header comment says the terrain is flat.
- `tools/level-editor/src/adapters/gtaLevel.ts`: `groundColourAt(l, x, z)` (region-local x, z): road colour on a road,
  water colour on a water path, dark outside the border, else `l.data.ground`.
- `tools/level-editor/src/adapters/stubTerrain.ts`: `createStubTerrain({ zone, w, d, heightAt?, groundColourAt,
  regionNameAt?, onInvalidate? })`. `front.ts` in the same folder passes a game height function the same way.
- `tools/level-editor/src/adapters/gtaLevel.test.ts`: the existing tests (they must keep passing unchanged).

## The game API you call (exists; do not change it)

Import through the editor's `@gta/*` alias (`games/gnome-theft-auto/src/*`):

```ts
import { LAYOUT } from '@gta/levels';             // LAYOUT.regions: { id: RegionId; origin: { x: number; z: number } }[]
import { heightAt, setTerrainOptions } from '@gta/terrain';
// setTerrainOptions({ amplitude: 1, testHill: false, landforms: true })  -> the authored land at full height
// heightAt(worldX, worldZ): metres. World = region-local + the region's origin.
import { paintAt } from '@gta/terrainPaint';
// paintAt(worldX, worldZ): 'rock' | 'dirt' | 'gravel' | 'mud' | 'ice' | 'snow' | 'sand' | 'grass' | 'farm' | 'forest'
//   | 'moss' | 'meadow' | null   (null = unpainted: use the region's ground colour)
import type { PaintKind } from '@gta/landforms';
```

Heights and paint come from the SAVED documents (the game reads the JSON files at import), so an edit made in the
editor shows on the ground after saving and reloading. Say that in the header comment.

## Change

- `tools/level-editor/src/adapters/gtaLevel.ts`:
  - Add `export const PAINT_COLOUR: Record<PaintKind, number>` = rock 0x8a8580, dirt 0xa07a4f, gravel 0x9a958c, mud
    0x6b5134, ice 0xbfe3f2, snow 0xe8f0f5, sand 0xd9b87a, grass 0x5fae4a, farm 0x8fc24f, forest 0x3d8a45, moss
    0x2f6b5c, meadow 0xb5d94a. Add `export const TRAIL_COLOUR = 0xa07a4f`.
  - `groundColourAt(l, x, z, paint?: (x: number, z: number) => PaintKind | null)`: same order as now, except a road
    path whose id starts with `trail/` gives `TRAIL_COLOUR` (other road paths and the Turfton grid still give the road
    colour); and just before the final `return l.data.ground`, `const p = paint?.(x, z); if (p) return PAINT_COLOUR[p];`.
    Without the fourth argument it behaves exactly as today, so the existing tests pass unchanged.
- `tools/level-editor/src/adapters/gta.ts`:
  - At module load, call `setTerrainOptions({ amplitude: 1, testHill: false, landforms: true })` once (the editor shows
    the authored land at full height whatever the game ships).
  - In `createWorld`, look up the region's origin `o` in `LAYOUT.regions`; pass
    `heightAt: (x, z) => heightAt(x + o.x, z + o.z)` and
    `groundColourAt: (x, z) => groundColourAt(level, x, z, (px, pz) => paintAt(px + o.x, pz + o.z))` to
    `createStubTerrain`.
  - Update the header comment: heights and paint are the game's own (from the saved documents); the brush and paint
    tools are still not offered (GTA's landforms are generators and stamps in `data.terrain`).
- `tools/level-editor/src/adapters/gtaLevel.test.ts`: add two tests at the end (keep the others unchanged):
  - a trail colour: build a level with `docToLevel(REGION_DOCS['dust-flats'])`, push a path
    `{ id: 'trail/test', kind: 'road', points: [[300, 300], [320, 300]], width: 4 }`, and expect
    `groundColourAt(level, 310, 300)` to be `TRAIL_COLOUR`;
  - a paint colour: `groundColourAt(level, -100, 0, () => 'rock')` is `PAINT_COLOUR.rock`, and with `() => null` it is
    `level.data.ground`.

## Done when

- From `tools/level-editor`: `npx vitest run src/adapters/gtaLevel.test.ts` passes (old and new tests).
- From `tools/level-editor`: `npx tsc --noEmit -p .` reports no errors in `src/adapters/gta.ts` or `gtaLevel.ts`.
- From `tools/level-editor`: `npm test` passes, apart from failures that come from game files mid-edit (say which).

## Out of scope

Everything under `games/` (the game's files and documents), the other adapters, the editor core (`editor.ts`,
`viewport.ts`, `tools/`), and `stubTerrain.ts`.

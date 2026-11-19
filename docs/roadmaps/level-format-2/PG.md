Epic: 2. Depends on: none.

## Environment
Read `docs/roadmaps/level-format-2/_common.md` (and the file it points to) first. Other workers edit `pathfind.ts`, `player.ts`, `config.ts` and `packages/prefabs` at the same time: do not touch those.

## Goal
Gnomomia loads surface paint (`world.paint.json`) into its terrain, and the walkability bake and its stale check know about it (painted ground keeps flora off, and flora is part of what gets baked).

## Read first
- `packages/level/src/paint.ts` (`PaintGrid`, `PaintFile`, `fromJSON`), `games/gnomes-of-gnomomia/src/worldDeltas.ts` + `worldDeltas.test.ts` (the loader you copy the shape of), `src/terrain.ts` (installs deltas and the baked grid), `src/terrainCore.ts` (`Terrain.paint`, `setPaint`: already done), `src/bakeWalk.ts` (`computeBakeHash`), `scripts/bake-walk.mjs`, `scripts/check-bake.mjs`, `src/walkBake.test.ts`.

## Change
- `src/data/levels/world.paint.json`: `{ "format": "lawn-paint", "version": 1, "chunk": 64, "chunks": {} }` (2-space pretty, trailing newline).
- `src/worldPaint.ts` (new): `export function paintFromFile(file: PaintFile): PaintGrid | null` (null when `chunks` is empty; `console.error` and null when `PaintGrid.fromJSON` throws) and `export function loadWorldPaint(): PaintGrid | null` (imports the JSON; never throws).
- `src/worldPaint.test.ts` (new): like `worldDeltas.test.ts` (empty file -> null; a file with two painted cells round-trips; a wrong-sized chunk gives null without throwing; the shipped file loads to null or to a grid with a non-null `bounds()`).
- `src/terrain.ts`: after the deltas, `const paint = loadWorldPaint(); if (paint) terrain.setPaint(paint);`.
- `src/bakeWalk.ts` `computeBakeHash`: add `paint: t.paint.toJSON()` to the hashed object, right after `deltas` (same position in the key order for everything else).
- `scripts/bake-walk.mjs` and `scripts/check-bake.mjs`: also export `loadWorldPaint` from the bundle and call `t.setPaint(...)` when it returns a grid (as they already do for the deltas).
- `src/walkBake.test.ts`: the fresh terrain it builds also gets the shipped paint (like the deltas), so the hash test stays valid; add one test that `computeBakeHash` changes when a cell is painted on a fresh terrain (`t.paint.set(3, 3, 2)`).
- Re-bake: after the code changes, run `npm run bake-walk -w games/gnomes-of-gnomomia` once (the hash changes because `paint` is now part of it), then `npm run check-bake -w games/gnomes-of-gnomomia` must say "up to date". Leave the regenerated `src/data/levels/walk.bake.json` in place.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` succeeds.
- `npx vitest run --root games/gnomes-of-gnomomia src/worldPaint.test.ts src/walkBake.test.ts src/terrainCore.test.ts src/terrain.golden.test.ts` passes; `npm test -w games/gnomes-of-gnomomia` has no failures except the known `gear.test.ts` one.
- `npm run check-bake -w games/gnomes-of-gnomomia` prints "walk bake is up to date".

## Out of scope
`terrainCore.ts`, `pathfind.ts`, `player.ts`, `config.ts`, `levelDocs.ts`, the editor, and everything outside `games/gnomes-of-gnomomia`.

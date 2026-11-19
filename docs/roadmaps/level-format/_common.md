# Common rules for every issue in this roadmap

Read this first. It is the same for every issue.

## Where you are

- Run every command from the repo root. Node must be on the PATH (see AGENTS.md "Toolchain").
- The branch `level-format-editor` is checked out. **Do not commit, push, stash or switch branches.** Do not run `npm install`.
- Other workers are editing OTHER files in this repo at the same moment. Touch only the files your issue lists. If you think
  another file needs a change, say so in your final answer instead of making it.
- Some files are still **stubs** (they start with a `// STUB:` comment). If a stub is not yours, read its exported signature
  as a contract and do not change it: another worker is filling it in. Code that compiles against a stub must keep compiling
  when the stub is replaced by the real thing, so only use what the stub's signature promises.
- Do not run `vite build` or start any dev server (two workers would collide on `dist/` and ports). Type-check with
  `npx tsc --noEmit -p <dir>` and run tests with vitest (below).
- **Known failure you must ignore and not try to fix:** `npm test -w games/gnomes-of-gnomomia` fails exactly one test,
  `src/gear.test.ts > gear attachment and usage > attaches weapon, shield, ...`. It fails on `main` too. "Tests pass" in
  this roadmap means "no failures except that one".
- Keep each existing file's line endings (some files are CRLF). New files: LF.
- Style: TypeScript strict, 2-space indent, single quotes, semicolons, no `any`, no new npm dependencies. Comments say why,
  not what. Do not write temp files outside the repo (no `/tmp`); delete any throwaway file you create inside it.

## Running tests

- One test file of a game: `npx vitest run --root games/gnomes-of-gnomomia src/<file>.test.ts`
- One test file of a package/tool: `npx vitest run --root packages/level src/<file>.test.ts` (or `--root tools/level-editor`)
- Whole game: `npm test -w games/gnomes-of-gnomomia`; whole package: `npm test -w packages/level`
- Type-check: `npx tsc --noEmit -p games/gnomes-of-gnomomia`, `-p packages/level`, `-p tools/level-editor`

## Vocabulary

- Units are metres. World coordinates: +x east, +z SOUTH (negative z is north), y up. A "zone" is one square map
  (`ZoneDef`, `games/gnomes-of-gnomomia/src/config.ts`). Zone files are authored **zone-local** (around 0,0) and
  `content.ts` moves everything by the zone's origin (`src/data/layout.ts`) so the game only sees **world** coordinates.
- `@lawn/level` (`packages/level/src`): the level-document types (`LevelDoc`, `Stamp`, `PathDef`, `PropDef`, `Rect`),
  `applyStamps`, `DeltaGrid` (a sparse height raster, 1 m vertices, Int16 centimetres, `getUnits/setUnits/sample/applyPatch/
  toJSON/fromJSON`), `PatchBuilder`, `WalkGrid` (baked walkability, 0.25 m cells, tiles), `bakeTile`, `encodeRle/decodeRle`,
  `mulberry32`, `smoothstep`, `distToSeg`. Read the files; they are short.
- `Terrain` (`games/gnomes-of-gnomomia/src/terrainCore.ts`): `createTerrain({ zones, objects, checkCondition })` returns an
  object with `heightAt`, `isBlocked`, `standY`, `staticSolidAt`, `roadSegments`, `passes`, `groundColourAt`, `chunkFlora`,
  `invalidate(rect?)`, `deltas`, `setDeltas`, `walkGrid`, `setWalkGrid`... Read its header comment and the `Terrain` interface.
  `terrain.ts` is the game's own instance (with the baked grid installed); tests that need exact analytic behaviour build a fresh
  one with `createTerrain({ zones: ZONES, objects: OBJECTS, checkCondition })`.
- The level editor (`tools/level-editor`) imports the game's code through the alias `@gnomomia/<file>` (= `games/gnomes-of-gnomomia/src/<file>`).
  Its shared contracts are in `tools/level-editor/src/context.ts` (read it), its state in `state.ts`, the Gnomomia list definitions
  in `profile.ts`, and `main.ts` wires everything. Do not change those four files.

## Reporting

End your run with: files changed, the commands you ran and their results (pass/fail), anything you could not do, and anything
surprising you found. Keep it short.

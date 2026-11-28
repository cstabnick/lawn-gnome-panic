Epic: E22-1 foundation (cast, props, gear, W16, lore part 1)
Depends on: none (the act IV props are being added at the same time by another worker: see below)

## Environment
Worktree `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-adec7594cd8bfc2db`, game `games/gnome-theft-auto`.
Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. Do not commit, stash or checkout, do not
run `npm install`. Keep LF line endings. Seven other workers edit other files at the same time: touch only the files below.
Repo rule (AGENTS.md): 3D scenes must not z-fight: anything laid flat on the ground takes a draw layer
(`flatLayer(material, LAYER.<x>)` from `@lawn/depth`, `docs/rendering.md`), never just a small lift; boxes that touch
must not share a face. World-change props have **no colliders**.

## Goal
World change W16 "All hats" shows in the world once `m64-all-hats` is finished: the Dust Flats overlook becomes the
coalition camp, and the Bathtub Queen lies moored at New Puddle flying the crew's colours.

## Read first
- `docs/design/gnome-theft-auto/world-changes.md` row W16 (what it shows) and the notes under the table.
- `src/worldChanges/registry.ts` (the builder contract: `registerWorldChange(id, (ctx) => ({ root, update? }))`, ctx
  helpers), `src/worldChanges/rows/coastAndFort.ts` (W15: the style to copy: `placer`, `buildPrefab`, tints, the
  friendly gnome stand-ins with `createGnomeModel`, a small idle `update`), `src/worldChanges/rows/mownScar.ts` (W14) and
  their tests `coastAndFort.test.ts`, `mownScar.test.ts`.
- `src/quests/stages/east.ts` stage `dust-safehouse` (center (276, 44), radius 18: its `marks`, `cameras` and `paths`
  are where story scenes stand; the camp must stay **3 m or more clear of every mark and out of every camera's line to
  its look-at point**), and `airfield-apron`, `fort-sandpit-gate`.
- New Puddle marina: grep `new-puddle` / `New Puddle` in `src/quests/stages/` and `src/` for its stage and coordinates;
  the Bathtub Queen prefab: grep `bathtub-queen` / `pirate-ship` in `packages/prefabs/src/catalog/` and `src/coast/pirateShip.ts`.

## Change
- `src/worldChanges/rows/coalitionCamp.ts` (a stub exists and is registered: keep the `registerWorldChange('W16', ...)`
  call): build the camp: a ring of six or seven small tents (grep `tent` prefabs), each tinted one faction's colour
  (Carburettors orange, Underspanners grey-blue, the Unmowed green, the Burrowfolk brown, the Spade Guard olive, the
  Flock pink, Granny's pie table red-check), a long `crate-table` in the middle with plates and one pie (grep `pie`),
  a `hat-rail` with everybody's caps, a `coalition-flag` on the rise, a `hatbrim-beacon` unlit (no glow) by the
  rail, campfire and crates; four or five ambient faction gnomes (stand-ins like W15's, idle bob only, non-blocking)
  doing something specific (one asleep on a crate, two arguing over a map, one feeding the fire). Also: the Bathtub
  Queen moored at the New Puddle marina flying a crew-colour flag (if the ship prefab is too big for the marina, a
  `team-banner` flag on the marina jetty with a rowboat and a "QUEEN MOORED HERE" sign is enough: say which).
  The prefab ids `crate-table`, `hat-rail`, `coalition-flag`, `hatbrim-beacon` are being added now by another worker
  (`packages/prefabs/src/catalog/gta-story-act4.ts`): use the ids; if they are not in the catalog yet when you run the
  test, wait a few minutes and rerun (never add them yourself).
- `src/worldChanges/rows/coalitionCamp.test.ts`: like `coastAndFort.test.ts` (the builder runs, the root has children,
  nothing sits within 3 m of a `dust-safehouse` mark).

## Done when
- `npx tsc --noEmit` passes (from `games/gnome-theft-auto`).
- `npx vitest run src/worldChanges src/quests/stages.test.ts` passes.

## Out of scope
Every other file (quests, scenes, stages, `worldChanges/defs.ts`, `rows/index.ts`, packages).
Final report (<= 12 lines): what the camp holds and where (coordinates), the New Puddle choice, test results.

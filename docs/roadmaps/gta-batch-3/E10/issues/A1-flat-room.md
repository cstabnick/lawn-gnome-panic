Epic: E10-A (homes, parallel wave)
Depends on: none (foundation in place)

Read `docs/roadmaps/gta-batch-3/E10/issues/_env.md` first (environment, rules).

## Goal
Flat 3B is built from the player's saved furniture layout: every placed piece, the chosen wall and floor colours, a
"Sleep" spot on each bed, a "Decorate" spot, the move-in storytelling, a locked door until the loan is signed, and the
door moved to the Saucer Court stairwell.

## Read first
- `games/gnome-theft-auto/src/interiors/showcase/flat3b.ts`: the room today (E05). You rewrite its `defineInterior` call.
- `games/gnome-theft-auto/src/home/types.ts`: `FLAT_ID`, `FLAT_ROOM`, `WALL_COLOURS`, `FLOOR_COLOURS`, `FurnitureStock`.
- `games/gnome-theft-auto/src/home/layout.ts`: `loadLayout`, `stockOf`, `placedCount`, `clearPieceObjects`,
  `registerPieceObject`, `homeHooks`.
- `games/gnome-theft-auto/src/interiors/types.ts` (`InteriorKit`, `PutOpts`, `InteriorTheme`) and
  `games/gnome-theft-auto/src/interiors/registry.ts` (`INTERIOR_THEMES.flat` colours).
- `games/gnome-theft-auto/src/homes/types.ts`: `SAUCER_COURT.stairDoor`, `SAUCER_COURT.exit`.

## Change
- `games/gnome-theft-auto/src/interiors/showcase/flat3b.ts` (only this file, plus the new test):
  - `door: { ...SAUCER_COURT.stairDoor }`, `exit: { ...SAUCER_COURT.exit }`, `prompt: 'Enter Flat 3B'`, size stays
    12 x 10 x 3, theme computed below, `ambience: 'city'`.
  - `locked: () => (ownsProperty(FLAT_ID) ? null : 'Flat 3B is locked. The First Kiln Bank has the keys.')` with
    `ownsProperty` from `../../ownership`.
  - `build(kit)`:
    1. `clearPieceObjects()`; `const l = loadLayout();`
    2. Theme: start from `INTERIOR_THEMES.flat` and replace `wall` with the `WALL_COLOURS` colour of `l.wall` and
       `floor` with the `FLOOR_COLOURS` colour of `l.floor`; `kit.room({ theme })`.
    3. Keep `kit.door(0, 4.8, Math.PI)` and the two north windows.
    4. Furniture: for each `it` of `l.items`: `const s = stockOf(it.prefab)`; `const obj = kit.put(it.prefab, it.x, it.z,
       it.yaw, { solid: !(s?.flat || s?.wall), y: s?.wall ? (s.wallY ?? 0) : undefined })`;
       `registerPieceObject(it.uid, obj)`. When `s?.sleep`: `kit.spot({ id: 'sleep-' + it.uid, x: it.x, z: it.z,
       prompt: 'Sleep (saves the game)', run: () => homeHooks()?.sleep() })`.
    5. `kit.spot({ id: 'decorate', x: 2.2, z: 4.1, prompt: 'Decorate the flat', run: () => homeHooks()?.decorate() })`.
    6. Storytelling that always stays (fixed dressing, not in the layout): the bank's notice and the price sticky note
       (keep the two `kit.sign` calls), post piling up by the door (the three `sealed-letter` puts near the door), the
       Hyssop wall-knock spot (keep it), and a new wall calendar sign on the east wall:
       `'LOAN REPAYMENT DUE:\nEVERY DAY'` (small, yellow). Add one more vignette that tells a story without text: a
       `parcel-box` with a `plant` on it by the window ("Hyssop's welcome plant, left on a parcel, never watered") (not
       solid, put them where the starter layout leaves space: e.g. local (4.9, -4.2)).
    7. Moving day: the stacked `crate` x3 and `parcel-box` by the east wall (from the old build) only while
       `placedCount(l) < 6` ("not unpacked yet"). Keep them out of `FLAT_ROOM`'s door square (x -0.8..0.8, z 3.2..5).
    8. Remove the old fixed bedroll, lamp, chair and crate-table from the build: they are now the starter layout's
       pieces (`STARTER_ITEMS` in home/types.ts), drawn by step 4.
  - Keep exporting `FLAT_3B_INTERIOR` (= `FLAT_ID`) and `FLAT_3B_FURNISH_SLOTS` (other code may import them).
  - Update the file's header comment: E10 builds it from home/layout.ts.
- New `games/gnome-theft-auto/src/home/flat.test.ts`: build the room headless and check it:
  `import '../interiors/showcase/flat3b'`, `createKit` from `../interiors/kit` with `interiorById('flat-3b')` from
  `../interiors/registry` (read `src/interiors/kit.test.ts` for how a kit is made in a test), call `def.build(kit)`, then
  assert: every `loadLayout().items` uid has `pieceObject(uid)` defined; the build has a spot with id starting `sleep-`
  (the starter bedroll) and the `decorate` spot; `def.door` equals `SAUCER_COURT.stairDoor`. Use `resetLayoutCache()`
  and a fresh layout (no localStorage in tests: `loadLayout(undefined)` once first).

## Contract
- Interior id `'flat-3b'` unchanged. `homeHooks()?.sleep()` / `.decorate()` are set by home/runtime.ts (another worker).
- `registerPieceObject(uid, obj)` for every placed piece, `clearPieceObjects()` first: the decorate panel (another
  worker) moves these objects live.

## Done when
- `npx tsc --noEmit -p .` passes for your files; `npx vitest run src/home/flat.test.ts src/interiors` passes.
- `git diff --stat` shows only flat3b.ts and the new test.

## Out of scope
home/layout.ts, home/types.ts, interiors/runtime.ts, kit.ts (do not edit them), any other interior.

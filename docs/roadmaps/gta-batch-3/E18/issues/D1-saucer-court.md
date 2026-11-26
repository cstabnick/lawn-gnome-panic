Epic: E18-B (world-change dressing)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E18/issues/_env.md` and `D-dressing-common.md` (same folder) first: they hold the API,
the prefab and placement rules and the test you add.

## Goal
Build the props for world changes W01, W09 in `games/gnome-theft-auto/src/worldChanges/rows/saucerCourt.ts` (currently a
stub registering empty groups), following `docs/design/gnome-theft-auto/world-changes.md` rows W01, W09.

## Change (only `src/worldChanges/rows/saucerCourt.ts` and the new `src/worldChanges/rows/saucerCourt.test.ts`)
- W01: a brass buzzer plate reading "3B" by the Saucer Court entrance, and flat 3B's window lit warm at night (an
  emissive pane on the outside of the block at the flat's window, intensity = ctx.night()), curtains (a dim pane) on a
  few other windows. Find the block and Flat 3B in `src/homes/data.ts` and `src/home/` (E10).
- W09: Pip's red toolbox by the 3B door (prefab: grep 'toolbox'), a hammock visible across the 3B window from the street
  (grep 'hammock'), and a note "NO LODGERS" on flat 3A's door (`coastSign`, small, white/black). If the flat doors are
  only inside an interior, put the toolbox and the note at the block's street door instead and say so.

## Done when
- See `D-dressing-common.md`: tsc clean for your file, `npx vitest run src/worldChanges` passes, report coordinates.

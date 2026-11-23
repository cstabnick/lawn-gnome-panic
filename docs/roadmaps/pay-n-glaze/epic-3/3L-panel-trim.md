Epic: 3 (more parts, nested pivots, suspension, showroom stage)
Depends on: 3A

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` and `docs/roadmaps/pay-n-glaze/epic-2/_common2.md` first. You own only `games/gnome-theft-auto/src/glazePanelTrim.ts` (new) and `games/gnome-theft-auto/src/glazeShop.ts` (ONLY the `PANELS` list and its import). Other workers edit other game files.

## Goal
A new "Trim" tab in the Pay 'n' Glaze shop for the six new shelves: grille, bumper, canopy, mirrors, exhaust, horn (with a horn preview). The existing tabs (Paint, Wheels, Lights, Body) already list every product from the catalogue arrays, so the new paints, sprays, tyres, rims, lamps, beams, spoilers, seats, ornaments and extras appear in them automatically.

## Read first
`games/gnome-theft-auto/src/glazePanelBody.ts` (the pattern to copy: `optionGrid`, `sectionLabel`, module-level `ctx` and widget handles, `refresh`), `glazeUi.ts` (`Panel`, `PanelCtx`, `optionGrid`), `glazeShop.ts` (`PANELS`), `packages/glaze/src/catalog.ts` (`GRILLES`, `BUMPERS`, `CANOPIES`, `MIRRORS`, `EXHAUSTS`, `HORNS`), `games/gnome-theft-auto/src/audio.ts` (`playHornVariant(id)`: a stub another issue fills; just call it).

## Change
- `glazePanelTrim.ts`: `export const trimPanel: Panel = { id: 'trim', label: 'Trim', icon: '🔩', build, refresh }`. Sections: "Grille" (`optionGrid` over `GRILLES`, patch `grille`), "Bumper" (over `BUMPERS`, patch `bumper`), "Canopy" (over `[{ id: 'none', name: 'No canopy', blurb: 'Open to the sky.', price: 0 }, ...CANOPIES]`, patch `canopy`), "Mirrors" (same pattern, `none` = "No mirrors", patch `mirror`), "Exhaust" (`none` = "Stock tailpipe", patch `exhaust`), "Horn" (`optionGrid` over `HORNS`, patch `horn`; picking a horn also calls `playHornVariant(id)` so the player hears it; below the grid a button "Honk" (`.gz-btn .gz-btn-ghost`) that plays the currently selected horn). Cast ids to their types as the other panels do. `refresh()` re-marks every grid from `ctx.draft()`.
- `glazeShop.ts`: add `trimPanel` to `PANELS` after `bodyPanel` (tab order Paint, Wheels, Lights, Body, Trim, Handling).

## Contract
`export const trimPanel: Panel` with id `'trim'`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no error in your two files.

## Out of scope
Every other file.

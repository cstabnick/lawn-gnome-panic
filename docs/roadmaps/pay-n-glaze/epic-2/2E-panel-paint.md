Epic: 2 (Gnome Theft Auto adopts Pay 'n' Glaze)
Depends on: none (epic 1 has landed)

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` and `docs/roadmaps/pay-n-glaze/epic-2/_common2.md` first. You own only `games/gnome-theft-auto/src/glazePanelPaint.ts`.

## Goal
The Paint tab of the Pay 'n' Glaze shop: body colour, finish, special paint sprays (with colour and lucky number) and neon underglow.

## Read first
- `games/gnome-theft-auto/src/glazePanelPaint.ts` (stub exporting `paintPanel: Panel`; keep the export), `games/gnome-theft-auto/src/glazeUi.ts` (`Panel`, `PanelCtx`, `optionGrid`, `sliderRow`, `swatchRow`, `sectionLabel`: finished, use them; read each function's doc comment).
- `packages/glaze/src/catalog.ts` (`FINISHES`, `DECALS`, `PAINT_SWATCHES`, `UNDERGLOW_COLORS`, `PRICES`) and `types.ts` (`Loadout`).

## Change
- `glazePanelPaint.ts`: `paintPanel = { id: 'paint', label: 'Paint', icon: '🎨', build(ctx), refresh() }`. `build(ctx)` returns a `div` with, top to bottom (each section: `sectionLabel(...)` then the widget):
  1. "Body colour": `swatchRow({ swatches: PAINT_SWATCHES, value: ctx.draft().paint, custom: true, onPick: (hex) => ctx.patch({ paint: hex }) })`; a note line "Repaint: 20 🌰" (`PRICES.paint`).
  2. "Finish": `optionGrid({ items: FINISHES, value: ctx.draft().finish, onPick: (id) => ctx.patch({ finish: id }) })` (the items are `ModDef`s with `id`, `name`, `blurb`, `price`: map them to `OptionItem` as needed; `id` types need a cast to `FinishId`).
  3. "Special paint sprays": an `optionGrid` over `[{ id: 'none', name: 'No spray', blurb: 'Plain panels.', price: 0 }, ...DECALS]`; picking sets `decal`. Under it, shown only while `decal !== 'none'`: "Spray colour" `swatchRow` over `PAINT_SWATCHES` plus white and black entries (add `{ name: 'Chalk White', hex: 0xffffff }` and `{ name: 'Soot Black', hex: 0x1c1c22 }`), `custom: true`, `onPick` -> `patch({ decalColor })`; and, only while `decal === 'number'`, a `sliderRow` "Lucky number" 0..99 step 1 with `format: (v) => String(Math.round(v))` -> `patch({ decalNumber: Math.round(v) })`.
  4. "Neon underglow": an `optionGrid` over `[{ id: 'off', name: 'No glow', blurb: 'Dark underneath.', price: 0 }, ...UNDERGLOW_COLORS.map((c, i) => ({ id: 'g' + i, name: c.name, blurb: 'A neon glow under the chassis.', price: PRICES.underglow }))]`; picking `off` patches `underglow: null`, `gI` patches `underglow: UNDERGLOW_COLORS[I].hex`. The selected id comes from `draft().underglow` (null -> `off`, a hex -> the matching `g<i>`; no match -> none selected).
  `refresh()` re-marks every widget from `ctx.draft()` (keep references to the widgets' `set`), and shows/hides the spray colour and number rows. Keep `ctx` in a module variable set in `build` for `refresh`.
- No test file (DOM): make `npx tsc --noEmit -p games/gnome-theft-auto` pass for your file and read it once.

## Contract
`export const paintPanel: Panel` (from `glazeUi.ts`); id `'paint'`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no error in `glazePanelPaint.ts`.

## Out of scope
Every other file.

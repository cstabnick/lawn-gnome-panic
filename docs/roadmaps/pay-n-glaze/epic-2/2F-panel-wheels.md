Epic: 2 (Gnome Theft Auto adopts Pay 'n' Glaze)
Depends on: none (epic 1 has landed)

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` and `docs/roadmaps/pay-n-glaze/epic-2/_common2.md` first. You own only `games/gnome-theft-auto/src/glazePanelWheels.ts`.

## Goal
The Wheels tab of the Pay 'n' Glaze shop: tyres, rims, rim colour, wheel size, camber (front and rear apart) and ride height.

## Read first
- `games/gnome-theft-auto/src/glazePanelWheels.ts` (stub exporting `wheelsPanel: Panel`; keep the export), `games/gnome-theft-auto/src/glazeUi.ts` (`Panel`, `PanelCtx`, `optionGrid`, `sliderRow`, `swatchRow`, `sectionLabel`: finished; read each doc comment).
- `packages/glaze/src/catalog.ts` (`TYRES`, `RIMS`, `PRICES`, `PAINT_SWATCHES`) and `types.ts` (`Loadout`, `WHEEL_SIZE_MIN`, `WHEEL_SIZE_MAX`, `CAMBER_MIN`, `CAMBER_MAX`).

## Change
- `glazePanelWheels.ts`: `wheelsPanel = { id: 'wheels', label: 'Wheels', icon: '🛞', build(ctx), refresh() }`. `build(ctx)` returns a `div` with, top to bottom (`sectionLabel` then the widget):
  1. "Ride height": `sliderRow({ label: 'Ride height', blurb: 'Slam it onto the tyres or jack it up. Lower is steadier; higher rolls more. 15 🌰 to change.', min: -1, max: 1, step: 0.05, value: draft.rideHeight, format: (v) => v === 0 ? 'Stock' : (v < 0 ? 'Slammed ' : 'Lifted ') + Math.round(Math.abs(v) * 100) + '%', onInput: (v) => ctx.patch({ rideHeight: v }) })`. This replaces the old Side-Valve "Ride height" knob: say so in the blurb's second sentence ("Replaces the old Side-Valve ride-height dial.").
  2. "Tyres": `optionGrid` over `TYRES` (patch `tyre`).
  3. "Rims": `optionGrid` over `RIMS` (patch `rim`); then "Rim colour": `swatchRow` with swatches `[{ name: 'Chrome', hex: 0xc8ccd2 }, { name: 'Gold', hex: 0xe0b030 }, { name: 'Gunmetal', hex: 0x4a4f57 }, { name: 'Matte Black', hex: 0x1c1c22 }, ...PAINT_SWATCHES.slice(0, 6)]`, `custom: true` (patch `rimColor`); note "Rim colour: 10 🌰".
  4. "Wheel size": `sliderRow` min `WHEEL_SIZE_MIN` max `WHEEL_SIZE_MAX` step 0.05, value `draft.wheelSize`, format `(v) => Math.round(v * 100) + '%'`, blurb "Bigger wheels lift the body. 25 🌰 to change." (patch `wheelSize`).
  5. "Camber": two `sliderRow`s: "Front camber" and "Rear camber", min `CAMBER_MIN` max `CAMBER_MAX` step 0.5, format `(v) => v.toFixed(1) + '°'`, blurb for the first "Negative leans the tops of the wheels in. 15 🌰 to change." and for the second "Rear wheels, set apart from the front." (patch `camberFront` / `camberRear`).
  `refresh()` re-marks/sets every widget from `ctx.draft()` (keep the widgets' `set` handles). Keep `ctx` in a module variable set in `build`.
- No test file (DOM): make `npx tsc --noEmit -p games/gnome-theft-auto` pass for your file and read it once.

## Contract
`export const wheelsPanel: Panel` (from `glazeUi.ts`); id `'wheels'`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no error in `glazePanelWheels.ts`.

## Out of scope
Every other file.

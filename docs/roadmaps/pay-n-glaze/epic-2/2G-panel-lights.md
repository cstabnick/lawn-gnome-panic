Epic: 2 (Gnome Theft Auto adopts Pay 'n' Glaze)
Depends on: none (epic 1 has landed)

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` and `docs/roadmaps/pay-n-glaze/epic-2/_common2.md` first. You own only `games/gnome-theft-auto/src/glazePanelLights.ts`.

## Goal
The Lights tab of the Pay 'n' Glaze shop: new headlights (lamp housings) and the beam colour, with a way to see them lit in the showroom.

## Read first
- `games/gnome-theft-auto/src/glazePanelLights.ts` (stub exporting `lightsPanel: Panel`; keep the export), `games/gnome-theft-auto/src/glazeUi.ts` (`Panel`, `PanelCtx`, `optionGrid`, `sectionLabel`: finished; read their doc comments).
- `packages/glaze/src/catalog.ts` (`LAMPS`, `BEAMS`: each beam has a `color`), `types.ts` (`Loadout`).
- `games/gnome-theft-auto/src/vehicles.ts` `setVehicleHeadlights` (toggles `v.headlights.visible`, which is `rig.lights`).

## Change
- `glazePanelLights.ts`: `lightsPanel = { id: 'lights', label: 'Lights', icon: '💡', build(ctx), refresh() }`. `build(ctx)` returns a `div` with:
  1. "Headlights": `optionGrid` over `LAMPS` (patch `lamp`).
  2. "Beam colour": `optionGrid` over `BEAMS` (patch `beam`), each card with a `thumb` element: a 28 px round `div` painted with the beam's colour (`'#' + color.toString(16).padStart(6, '0')`).
  3. A "Preview the beams" toggle: a `<button type="button" class="gz-btn gz-btn-ghost">` that toggles a module boolean and, per `ctx`, shows the lit lamps: there is no API for the vehicle from a panel, so dispatch a DOM `CustomEvent('gta-glaze-lights', { detail: { on } })` on `window` (the shop listens and calls `rig.setLightsOn` / `setVehicleHeadlights`; the event name and `detail.on` boolean are the contract: document it in a comment). The button label flips "Preview the beams" / "Beams on (tap to turn off)". When the panel is rebuilt (shop re-opened) the toggle starts off and a `{ on: false }` event is sent in `build`.
  `refresh()` re-marks both grids from `ctx.draft()`. Keep `ctx` and the grids' `set` handles in module variables set in `build`.
- No test file (DOM): make `npx tsc --noEmit -p games/gnome-theft-auto` pass for your file and read it once.

## Contract
`export const lightsPanel: Panel` (from `glazeUi.ts`); id `'lights'`; window event `'gta-glaze-lights'` with `detail: { on: boolean }`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no error in `glazePanelLights.ts`.

## Out of scope
Every other file (the shop in `glazeShop.ts` is another issue; it will not listen for the event unless that issue adds it, which is fine: the event is harmless when nobody listens).

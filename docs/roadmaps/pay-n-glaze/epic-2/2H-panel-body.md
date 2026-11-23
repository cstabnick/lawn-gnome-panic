Epic: 2 (Gnome Theft Auto adopts Pay 'n' Glaze)
Depends on: none (epic 1 has landed)

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` and `docs/roadmaps/pay-n-glaze/epic-2/_common2.md` first. You own only `games/gnome-theft-auto/src/glazePanelBody.ts`.

## Goal
The Body tab of the Pay 'n' Glaze shop: spoiler, seat, steering wheel, hood ornament and up to four little extras.

## Read first
- `games/gnome-theft-auto/src/glazePanelBody.ts` (stub exporting `bodyPanel: Panel`; keep the export), `games/gnome-theft-auto/src/glazeUi.ts` (`Panel`, `PanelCtx`, `optionGrid`, `sectionLabel`: finished; read their doc comments).
- `packages/glaze/src/catalog.ts` (`SPOILERS`, `SEATS`, `STEERS`, `ORNAMENTS`, `EXTRAS`), `types.ts` (`Loadout`, `MAX_EXTRAS`, `ExtraId`).

## Change
- `glazePanelBody.ts`: `bodyPanel = { id: 'body', label: 'Body', icon: '🧩', build(ctx), refresh() }`. `build(ctx)` returns a `div` with, top to bottom (`sectionLabel` then the widget):
  1. "Spoiler": `optionGrid` over `[{ id: 'none', name: 'No spoiler', blurb: 'Clean tail.', price: 0 }, ...SPOILERS]` (patch `spoiler`).
  2. "Seat": the same pattern over `SEATS` with `{ id: 'none', name: 'Stock seat', ... }` (patch `seat`).
  3. "Steering wheel": `optionGrid` over `STEERS` (patch `steer`); under it a small note "Your gnome holds the wheel, and it turns with the steering." 
  4. "Hood ornament": the same pattern over `ORNAMENTS` with `none` = "No ornament" (patch `ornament`).
  5. "Extras (up to 4)": a multi-select grid: build it with your own buttons in the same `.gz-grid` / `.gz-card` markup and classes as `optionGrid` (a card per `EXTRAS` entry with name, price and blurb; `.active` + `aria-pressed` for each extra in `draft.extras`); tapping toggles that extra in `draft().extras` (add when fewer than `MAX_EXTRAS` are selected, otherwise show a one-line message "Four extras at most: remove one first." in a `.gz-toast`-style `div` that clears after 2.4 s, and do not add); then `ctx.patch({ extras: <new array> })`.
  `refresh()` re-marks every widget from `ctx.draft()`. Keep `ctx` and the widgets' `set` handles in module variables set in `build`.
- No test file (DOM): make `npx tsc --noEmit -p games/gnome-theft-auto` pass for your file and read it once.

## Contract
`export const bodyPanel: Panel` (from `glazeUi.ts`); id `'body'`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no error in `glazePanelBody.ts`.

## Out of scope
Every other file.

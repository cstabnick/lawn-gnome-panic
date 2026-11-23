Epic: 1 (the @lawn/glaze package, its prefabs, the shop widgets)
Depends on: none

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` first (working directory, toolchain, rules, how to report). You own only the files below.

## Goal
The small DOM building blocks the Pay 'n' Glaze shop panels are made of (option cards, sliders, colour swatches) and the stylesheet for the whole shop, so four panel workers can build tabs without each inventing their own widgets.

## Read first
- `games/gnome-theft-auto/src/glazeUi.ts`: the stub (the `PanelCtx`, `Panel`, `OptionItem` types are final; `optionGrid`, `sliderRow`, `swatchRow`, `sectionLabel`, `GLAZE_CSS` are yours).
- `games/gnome-theft-auto/src/garages.ts` lines 36-130 (the `CSS` constant): the look of the existing Side-Valve garage modal (dark `#181c20` panel, `#ffd23f` accent, 44 px targets, `@media (max-height:500px)` landscape rules). Match it so the shop feels like the same garage.
- Rules: AGENTS.md "Mobile by default": every control at least 44 px, no hover-only UI, works at 390x844 portrait and 844x390 landscape with `env(safe-area-inset-*)`.

## Change
- `games/gnome-theft-auto/src/glazeUi.ts`: fill the four functions and `GLAZE_CSS` (a template string of CSS, all selectors under `#gta-glaze`, injected once by the shop; do not inject it yourself). Exact behaviour:
  - `optionGrid({ items, value, onPick, thumb })`: returns `{ el, set(v) }`. `el` is `<div class="gz-grid">` (CSS grid, `repeat(auto-fill, minmax(132px, 1fr))`, gap 8px). One `<button type="button" class="gz-card">` per item: optional `thumb(id)` element first (a 48 px box), then `<span class="gz-card-name">` (item name), `<span class="gz-card-price">` (`'Free'` when `price === 0`, else the number followed by ` 🌰`), and `<span class="gz-card-blurb">` (the blurb). `title` attribute = blurb. The card whose id equals the current value has class `active` and `aria-pressed="true"`. Clicking a card calls `onPick(id)` and marks it active at once. `set(v)` re-marks the active card without calling `onPick`. `min-height: 44px` on a card.
  - `sliderRow({ label, blurb, min, max, step, value, format, onInput })`: returns `{ el, set(v) }`. `el` is `<div class="gz-slider">` with a top line (label left, value readout right, using `format` or `v.toFixed(2)`), the blurb, and `<input type="range" class="gz-range">` (height 44px). The `input` event calls `onInput(Number(input.value))` and updates the readout. `set(v)` sets the input and readout without calling `onInput`.
  - `swatchRow({ swatches, value, custom, onPick })`: returns `{ el, set(hex) }`. `el` is `<div class="gz-swatches">`: one `<button type="button" class="gz-swatch" title="<name>" aria-label="<name>">` per swatch (a 44 px round button painted with the colour, a 2px white-ish border), `.active` on the one equal to `value` (`aria-pressed`). When `custom` is true, a last item: `<label class="gz-swatch gz-custom">` containing `<input type="color">` (value = `#rrggbb` of `value`) that calls `onPick(parseInt(hex.slice(1), 16))` on `input`. Clicking a swatch calls `onPick(hex)`. `set(hex)` re-marks and updates the colour input.
  - `sectionLabel(text)` is written; keep it, and give `.gz-sec` the same small yellow caps style as `.gta-garage-sec-label` in garages.ts.
  - `GLAZE_CSS`: styles for `#gta-glaze` (the shop root: `position:fixed; inset:0; z-index:36; pointer-events:none; font-family:system-ui`), the frame classes the SHOP issue will use (document them in a comment): `.gz-frame` (a bottom sheet on portrait: `position:fixed; left:0; right:0; bottom:0; max-height:62vh`, rounded top corners, `background:#181c20`, `pointer-events:auto`, `overflow:hidden`, flex column; in landscape `@media (max-height:500px)`: a right-side panel `left:auto; top:0; width:min(46vw,420px); max-height:none`), `.gz-head`, `.gz-tabs` (a horizontally scrolling row of `.gz-tab` buttons, 44 px high, `.active` yellow), `.gz-body` (scrolls: `overflow-y:auto; -webkit-overflow-scrolling:touch; touch-action:pan-y; padding:10px`), `.gz-foot` (price line + buttons, with `padding-bottom: calc(env(safe-area-inset-bottom,0px) + 10px)`), `.gz-btn`, `.gz-btn-buy` (yellow), `.gz-btn-ghost`, `.gz-price`, `.gz-toast`; plus all the widget classes above (`.gz-grid`, `.gz-card`, `.gz-card.active`, `.gz-card-name`, `.gz-card-price`, `.gz-card-blurb`, `.gz-slider`, `.gz-range`, `.gz-swatches`, `.gz-swatch`, `.gz-swatch.active`, `.gz-custom`, `.gz-sec`). The sheet leaves the upper part of the screen free so the player sees the vehicle being dressed.
- No test file (DOM widgets): instead make sure `npx tsc --noEmit -p games/gnome-theft-auto` passes for your file, and add a doc comment on each function saying what it returns.

## Contract
Exactly the exported names and shapes in the stub (`PanelCtx`, `Panel`, `OptionItem<T>`, `optionGrid`, `sliderRow`, `swatchRow`, `sectionLabel`, `GLAZE_CSS`). The returned `el` of each widget is a detached element the caller appends.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no error in `glazeUi.ts`.
- Read the file once: each widget guards against a missing `thumb`, empty `items`, and `value` not in the list (no active card then).

## Out of scope
Every other file: the shop frame (`glazeShop.ts`), panels (`glazePanel*.ts`) and `garages.ts` belong to other workers.

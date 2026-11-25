Epic: E17 wave 1 (prefabs and systems)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first (mobile rules matter here).

## Goal
"Dig a Nook", a small full-screen hold-and-release game for one nook: hold a big DIG button (or Space / E) and the
soil meter fills; let go while the fill is inside the green band for a tidy nook. Let go too early: too shallow. Hold
to the top: the ceiling joins you (a soft, funny collapse, never scary).

## Read first
- `games/gnome-theft-auto/src/societies/loamdeep/digUi.ts` (yours: the stub with the exported signatures)
- `games/gnome-theft-auto/src/workplaces/shiftCard.ts` (a full-screen card appended to `ui`: DOM approach to copy)

## Change
- `games/gnome-theft-auto/src/societies/loamdeep/digUi.ts`: keep the exported signatures; add pure helpers:
  - `export function digBand(rand: () => number): { lo: number; hi: number }`: a band 0.18 wide whose `lo` is in
    0.50..0.72 (so `hi` <= 0.90).
  - `export function digFill(heldSeconds: number): number`: the fill 0..1 after holding that long: starts slow and
    speeds up a little, `Math.min(1, 0.32 * t + 0.09 * t * t)` (reaches 1 at about 2.0 s).
  - `export function judgeDig(fill: number, band: { lo: number; hi: number }): 'good' | 'shallow' | 'collapse'`:
    `fill >= 1` collapse; `lo <= fill <= hi` good; else shallow (also below lo, and between hi and 1).
  - `openDigGame(ui, opts)`: append ONE container to `ui` (never restyle `ui`): a dim full-screen overlay (fixed, inset 0,
    z-index ~60, safe-area padding), a panel max 420 px: title "Dig a Nook (n of 3)" (n = opts.nook + 1), a vertical
    soil meter (a tall bar filling from the bottom, the green band drawn on it), a big round DIG button at least 88 x 88 px.
    Pointer down on the button (or keydown Space/E, ignoring repeats) starts the hold; pointer up / pointercancel /
    pointerleave (or keyup) ends it and judges with `judgeDig(digFill(held), band)`. If the fill reaches 1 while held, it
    ends at once as 'collapse'. Show the verdict for ~1 s: good "A lovely nook. Most tidy.", shallow "A bit shallow. It
    will do for a teaspoon.", collapse "Oh dear. The ceiling has joined us. We shall tidy it." then remove the container
    and call `opts.onDone({ good: verdict === 'good', quit: false })` exactly once. A 44 px "Stop" button and Escape quit
    (`{ good: false, quit: true }`). Use `pointerdown` with `preventDefault` so a long press does not select text or open
    a context menu (`touch-action: none`, `user-select: none` on the button). Fits 390 x 844 and landscape.
  - `digOpen()`: true while the container exists.
  Never touch `document` at import time.
- `games/gnome-theft-auto/src/societies/loamdeep/digUi.test.ts` (new): node tests for `digBand` (bounds over 200 seeded
  draws), `digFill` (0 at 0, monotonic, 1 by 2.1 s) and `judgeDig` (each verdict, band edges inclusive); `digOpen()` is
  false before any game opened.

## Contract
`openDigGame(ui, { nook, rand, onDone })`, `digOpen()`, `DigResult` as in the stub; new exports exactly as named above.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/societies/loamdeep/digUi.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file.

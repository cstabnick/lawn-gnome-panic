Epic: 3 (more tricks, pipes, personality; in parallel)
Depends on: none

(First read `docs/roadmaps/aether-board/_env.md`: environment and repo rules.)

## Goal
`src/trickbook.ts`: the trick book. A full-screen, Jet Set Radio-styled overlay listing every trick with a little stick
diagram of how to do it, every grab and grind with its stick direction, and the basics (spins, flips, boost,
halfpipes). It opens with T / Tab, the pad's View button or the 📖 touch button; the game pauses while it is open.

## Read first
- `games/aether-board/src/trickbook.ts`: the stub you replace (keep `TrickBook`, `createTrickBook(ui)`).
- `games/aether-board/src/config.ts`: `GROUND_GESTURES`, `AIR_GESTURES`, `BOARD_TRICKS` (name, points), `GRABS` and
  `grabFor` (the stick zone → grab mapping, read its switch), `GRINDS` and `grindFor`, `Zone`, `PALETTE`.
- `games/aether-board/src/input.ts`: the `Device` type ('kbm' | 'pad' | 'touch').
- `games/aether-board/src/hud.ts` lines 60-120: its graffiti CSS (font stack, skew, text-shadow stacks), to match the look.

## Change
- `src/trickbook.ts`:
  - Your own container `#ab-book` appended to `ui` (`position:fixed; inset:0; z-index:10;` hidden unless open; never
    restyle `#ui`). One injected `<style id="ab-book-style">`. When open: `pointer-events:auto`, a dark translucent
    purple backdrop, content scrollable (`overflow:auto`, `touch-action: pan-y` on the scroll area; mark it
    `data-scroll`), max-width 1100 px centred, safe-area padding.
  - Header: "TRICK BOOK" graffiti title + a close hint (device aware: "T / Tab to close", "View to close", "tap ✕"), and
    a ✕ button (pointer-events auto) that hides it **visually** (`set(false)` is the app's job, so the ✕ only needs to
    dispatch a `KeyboardEvent('keydown', { code: 'KeyT' })` on `window`, which the input layer treats as the toggle).
  - Section "POP TRICKS (on the ground)": a card per `GROUND_GESTURES` entry, grouped: plain first, then "Hold GRAB
    while you pop:" (`mod`). Each card: the trick name (`BOARD_TRICKS[trick].name`), its points, and an inline SVG
    stick diagram (56 px circle): a dot at the bottom (the pull-back), an arrow path through `path`'s zones to the last
    one (zone → angle: N 0°, NE 45°, E 90°, ... clockwise from up; draw the side zone of a 2-zone path as a waypoint on
    the rim, then curve to the end zone). Plus a one-line hint: "pull back, then flick ↖" (use arrows ↑ ↗ → ↘ ↓ ↙ ← ↖).
  - Section "AIR TRICKS (flick in the air)": one card per `AIR_GESTURES`, the SVG shows a flick from the centre.
  - Section "GRABS (hold GRAB in the air, point the stick)": 10 cards from `GRABS` with the zone that picks each one
    (centre = Indy on GRAB 1 / Melon on GRAB 2; derive zones by calling `grabFor(1, stickOfZone)` for each zone and
    `grabFor(2, {x:0,y:0})`).
  - Section "GRINDS (point the stick as you land on a rail; hold a new direction to switch)": from `GRINDS` + `grindFor`
    the same way (centre = 50-50).
  - Section "THE BASICS": spins (A/D or the left stick in the air), front/back flips (W/S in the air, press after you
    leave the ground), boost (Shift / RB / BOOST, burns flow, earn flow by landing clean), perfect landings (land along the
    slope), halfpipes (carve up the walls, you come back in), falling (you drop out of the sky onto the next island; your
    combo is lost). Wording for the device given to `set`: kbm "mouse", pad "right stick", touch "swipe on the right".
  - Cards in a responsive CSS grid (`repeat(auto-fill, minmax(150px, 1fr))`), graffiti headings, colours from PALETTE.
  - Build everything once in `createTrickBook`; `set(open, device)` only toggles visibility and the device wording.

## Contract
```ts
export interface TrickBook { set(open: boolean, device: Device): void }
export function createTrickBook(ui: HTMLElement): TrickBook;
```

## Done when
- `npx tsc --noEmit -p games/aether-board` passes for your file.
- Visual check (only you use this port): `cd games/aether-board && npx vite --port 5201 --strictPort` in the background;
  Playwright (`require('playwright')`; `chromium.launch()`): load `http://localhost:5201/#mute`, click the canvas, wait
  1 s, press `t`, wait 1 s, screenshot to /tmp/ab-book/desk.png; then an iPhone 13 landscape context
  (`devices['iPhone 13 landscape']`), tap the centre, then tap `#ab-touch .book`, screenshot /tmp/ab-book/phone.png.
  No console errors. Stop the server afterwards.

## Out of scope
Every other file in `games/aether-board/src`.

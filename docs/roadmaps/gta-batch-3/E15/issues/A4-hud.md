Epic: E15-A (Hedgeworth Links, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E15/issues/_env.md` first (environment, rules).

## Goal
`games/gnome-theft-auto/src/golf/hud.ts` draws Hedgeworth's golf HUD in the DOM: the hole strip, Gnome Golf's swing
meter, touch buttons for every golf action, and the scorecard. It holds no game logic: the runtime calls `set(view)` every
frame and listens to `onAction`.

## Read first
- `games/gnome-theft-auto/src/golf/types.ts`: `GolfHud`, `HudView`, `HudAction`, `CardView`, `RoundPhase`.
- `games/gnome-theft-auto/src/golf/hud.ts`: the stub you replace (keep its export).
- `games/gnome-theft-auto/src/fishing/fishHud.ts` lines 90-240: how a GTA HUD builds its own container under `#ui`,
  absolute positions with `env(safe-area-inset-*)`, 44 px buttons, `pointerdown` handlers that stop propagation (so a
  tap on a button does not also reach the game), and show/hide.
- `games/gnome-golf/src/controls.ts` lines 1-110 (the meter drawing: `FULL`, `LINE`, `ZONE_HALF`, the marker position
  maths) and `packages/golf/src/tuning.ts` `SWING`.

## Change
`src/golf/hud.ts`, `createGolfHud(ui)`: one container `div#golf-hud` appended to `ui` (pointer-events none on the
container, auto on buttons and the card), all styles inline, hidden until `show(true)`:
- **Hole strip** (top centre, below `env(safe-area-inset-top) + 56px`, max-width 92vw): `Hole 9 · The Ninth · Par 4`,
  second line `Stroke 2 · +1` (toPar formatted `E` for 0, `+2`, `-1`), third line `7 Iron 138 yd · Fairway · 96 yd to pin`,
  and a wind arrow (a small rotated `▲` by `windRel`, 0 pointing up = helping) with `6 mph`.
- **Swing meter** (bottom centre, above the buttons): a horizontal bar like Gnome Golf's: the accuracy line near the
  left (LINE ~10%), full power at FULL ~85%, the overswing zone to the right in red, the accuracy window
  (`SWING.accuracyWindow`) drawn round the line, and the marker at `view.meter.marker` (0 = line, 1 = full,
  up to `SWING.maxPower`) and a locked power tick at `view.meter.power` once locked (stage 'accuracy'). Hidden when
  `view.meter` is null; when phase is 'aim' show it empty with the hint `Tap SWING three times: start, power, accuracy`.
- **Buttons** (all >= 44 px, `touch-action: none`), shown by phase:
  - 'aim' and 'swing': a big round **SWING** button (96 px, bottom right, like fishHud's hold button) -> `'swing'` on
    pointerdown; in 'aim' only: **◀ Aim** and **Aim ▶** (bottom left; pointerdown -> `'aim-left'` / `'aim-right'`,
    pointerup/cancel/leave -> `'aim-stop'`), **Club −** and **Club +** (`'club-prev'` / `'club-next'`).
  - 'walk' with `atBall` false: a **To my ball** button (`'to-ball'`).
  - 'holed': **Next hole** (`'next-hole'`) and **Card** (`'card'`).
  - always while shown: a small **Quit** (44 px, top right under the safe area; `'quit'`) and **Card** (`'card'`).
- **Banner**: `view.banner` big and centred (upper third), fades when null.
- **Scorecard** `card(view)`: a centred panel (max-width min(420px, 94vw), scrolls if tall), a table with a row per
  hole (number, name, par, strokes or `–`, best or `–`), a total row (`Total 17 (+3)`), the title `Hedgeworth Links ·
  Members' card` and, when `final`, `Round complete` plus a line of Peony's: `"One does not concede a hole, my dear. One
  merely finishes it."`. A **Close** button (`'card-close'`); `card(null)` hides it.
- `onAction(cb)`: many listeners allowed. `destroy()` removes the container.
- Layout must fit 390x844 portrait and 844x390 landscape: in landscape put the meter above the SWING button's left edge
  rather than over it; nothing under 44 px that is tappable.

New `src/golf/hud.test.ts` with the repo's fake DOM (`import { installFakeDom } from '../testing/fakeDom'`, see how
`fishing` or `winter/winterApp.test.ts` tests DOM): create, show, set an 'aim' view (SWING and aim buttons present),
a 'walk' view with atBall false (To my ball present), a 'holed' view (Next hole), card with a final view (rows and
total text), and that a click/pointerdown on SWING calls the action listener with 'swing'.

## Contract
`createGolfHud(ui: HTMLElement): GolfHud` exactly; action names exactly the `HudAction` values. DOM marker id `golf-hud`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/golf/hud.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file. No game logic, no key bindings (the runtime reads keys).

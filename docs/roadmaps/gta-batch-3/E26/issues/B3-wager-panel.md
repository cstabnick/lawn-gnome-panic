Epic: B (building) — E26 street racing
Depends on: none
Agent: haiku-worker

(Paste `_env.md` here.)

## Goal
The bookie's panel: a phone-friendly DOM panel to pick a street route and a stake, then race.

## Read first
- `games/gnome-theft-auto/src/streetRace/wagerPanel.ts`: the stub (`WagerPanelOpts`, `WagerPanel`, `openWagerPanel`);
  keep every exported name and field.
- `games/gnome-theft-auto/src/winter/winterApp.ts`: the house style for cards and 44 px buttons in plain DOM.
- `games/gnome-theft-auto/src/testing/fakeDom.ts`: a fake DOM for node tests (see how another test uses it, e.g.
  `grep -rl fakeDom games/gnome-theft-auto/src`).

## Change (only `src/streetRace/wagerPanel.ts` and a new `src/streetRace/wagerPanel.test.ts`)
- `openWagerPanel(o)`: append a container `div#gta-wager-panel` to `o.parent` (never restyle the parent): fixed,
  centred, `max-width: min(420px, calc(100vw - 32px))`, `max-height: calc(100vh - 32px - env(safe-area-inset-top) -
  env(safe-area-inset-bottom))`, scrollable, dark translucent background, white text, `pointer-events: auto`,
  z-index above the HUD (10). Content: title (h3), the bookie's line, a list of route buttons (name + best "m:ss.s" or
  "no time yet"; the chosen one highlighted; first selected by default), a row of stake buttons (`0` shown as
  "Friendly", else "N Acorns"; disabled when N > o.acorns), a "Race!" button (min-height 48 px) calling
  `o.onPick(trackId, wager)` then closing, and a "Not now" button calling `o.onClose()` then closing. Every button
  `min-height: 44px`, `type="button"`. Escape key closes (onClose). `close()` removes the container and listeners
  (idempotent).
- Test with the fake DOM: opens with the routes and stakes; stakes above acorns disabled; picking a route + stake and
  pressing Race calls onPick with them and removes the panel; Not now calls onClose.

## Done when
- `npx vitest run src/streetRace/wagerPanel.test.ts` passes; `npx tsc --noEmit -p .` passes.
- The layout fits 390 x 844 (no fixed widths over 358 px).

## Out of scope
Everything else.

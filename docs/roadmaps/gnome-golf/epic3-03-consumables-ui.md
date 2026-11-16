Epic: 3 Trees, music, cigarillos and golf water · Issue 3: cigarillo and golf-water buttons, slower meter while smoking
Depends on: none

## Goal
The player can light a cigarillo (3 per round) to slow the swing meter for the next 3 shots, and crack a can of "golf water" (beer, 6 per round), which does nothing but is funny. Both are buttons in the controls; the swing meter really slows down while smoking.

## Read first
- `games/gnome-golf/src/controls.ts`: its root `#gc-root`, the CSS block at the top, the club selector `#gc-club` (bottom-left, 200px wide), the per-frame `update`, and the meter lines that advance the marker (`sw.marker += dt / (SWING.riseSeconds * ...)` and `sw.marker -= (dt * sw.power) / SWING.fallSeconds`)
- `games/gnome-golf/src/round.ts`: `lightCigarillo`, `drinkGolfWater`, `meterSpeedScale` (at the end of the file)
- `games/gnome-golf/src/config.ts`: `CONSUMABLES`, the new GameState fields `cigarillos`, `smokeShots`, `beers`, `beersDrunk`, `drinkTime`

## Change
- `games/gnome-golf/src/controls.ts` only:
  1. **Meter slowdown**: multiply both marker speeds by `meterSpeedScale(state)` (import it from './round'): rise `sw.marker += (dt * scale) / (...)`, fall `sw.marker -= (dt * scale * sw.power) / SWING.fallSeconds`. Nothing else in the swing changes.
  2. **Buttons**: a row `<div id="gc-items">` positioned bottom-left directly above the club selector (`left: max(8px, env(safe-area-inset-left)); bottom: calc(max(10px, env(safe-area-inset-bottom)) + 66px)`), two round 52px buttons side by side (gap 8px), `pointer-events:auto`, `pointerdown`:
     - `#gc-cig`: label "🚬" with a small count badge (`state.cigarillos`). Tap: `if (lightCigarillo(state)) { sfx('light'); toast('Cigarillo lit · swing meter slowed for 3 shots') }`. While `state.smokeShots > 0`, the button shows a glowing orange ring and the badge shows the shots left on the lit one (e.g. "3") with a different colour; it cannot be pressed again until it burns out.
     - `#gc-beer`: label "🍺" with badge `state.beers`. Tap: `if (drinkGolfWater(state)) { sfx('crack'); setTimeout(() => sfx('sip'), 700); toast(pick one of: 'Ahh, golf water.', 'Stay hydrated.', 'Purely medicinal.', 'Hydration is key.', 'Just water, officially.') }`.
     - Both dim to 40% opacity and ignore taps when they cannot be used (phase is not 'aim', none left, or already smoking/drinking). Hidden in 'title', 'card', 'final'.
     - The bag list (`#gc-bag`) opens above the club selector and may cover this row; keep the bag on top (it already is via z-order inside #gc-root; put `#gc-items` before `#gc-bag` in the DOM or give the bag `z-index:3`).
  3. **Meter hint**: while `state.smokeShots > 0`, show a small "🚬 slow swing" tag at the right end of the line above the meter (next to the "Full: 205 yd" text), so the player knows why it is slower.
  4. **Toast**: a small helper `toast(text)` in this file: a pill at bottom-centre just above the meter (`#gc-toast`), fades in, stays 2.2 s, fades out. Only one at a time (a new one replaces the old).
  5. **Keyboard**: C = light cigarillo, B = golf water (same calls and sounds as the buttons).
  - Imports: `lightCigarillo`, `drinkGolfWater`, `meterSpeedScale` from './round'; `sfx` from './audio' (sfx names 'light', 'crack', 'sip' exist; another worker is writing their sounds now, so they may be silent until then).

## Contract
`export function createControls(ctx: Ctx): System` unchanged. New element ids start with `gc-`. The only new state changes go through `lightCigarillo` and `drinkGolfWater`.

## Done when
- `cd /home/user/lawn-gnome-panic/games/gnome-golf && npx tsc --noEmit -p .` shows no errors in `src/controls.ts`.
- With a cigarillo lit, the marker takes 1 / 0.6 times as long to rise and fall; the 🚬 and 🍺 buttons show their counts and run out after 3 and 6 uses.

## Out of scope
Every other file. The cigarillo in the gnome's mouth and the drinking animation are party.ts (another worker); the sounds are audio.ts (another worker).

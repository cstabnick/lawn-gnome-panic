~~~~text
Epic: 2 Systems and the golf and bowling slices
Depends on: none

## Goal
Everything drawn over the board during a party: the scoreboard strip, the ROLL button on my turn, the minigame intro card, the results card and the final podium. DOM only; it reads PartyState and never changes it.

## Read first
- games/gnome-party/src/config.ts: PartyState, Phase, Seat, BOARD.miniCoins, TIMING
- games/gnome-party/src/minigames.ts: minigameById(id) → AnyMinigame | undefined (use .meta.title, .goal, .controls, .maxSeconds)
- packages/party/src/types.ts: SeatIndex
- games/gnome-party/src/ui/hud.ts: the stub you replace

## Change
- games/gnome-party/src/ui/hud.ts: implement the Contract.

## Contract (keep these exports exactly)
import type { PartyState } from '../config';
import type { SeatIndex } from '@lawn/party';

export interface Hud {
  /** A new PartyState arrived (or the same one again). */
  show(s: Readonly<PartyState>, mySeat: SeatIndex | null): void;
  /** Every frame: counts the phase's `left` down locally (from the last show) for the timers shown. */
  update(dt: number): void;
}
export function createHud(parent: HTMLElement, h: { onRoll(): void; onBackToMenu(): void }): Hud;

What to show (one container div id "gp-hud" appended to parent; pointer-events none except on buttons):
- Always except during 'mini': a scoreboard strip along the top, 4 cards in seat order: colour swatch (seat.color as #rrggbb),
  name ("CPU" tag if seat.cpu, "YOU" if seat === mySeat), coins ("● 12"), stars ("★ 1"). Highlight the seat whose turn it is.
  Top-left above the strip: "Round 2 / 6".
- 'roll': if phase.seat === mySeat, a big "ROLL!" button (id "gp-roll", ≥ 72 px tall, bottom centre) that calls onRoll,
  also on Space/Enter keydown; shows "auto in Ns" when left < 5. Otherwise a line "Gnelly is rolling…".
- 'move': nothing extra (the board view animates).
- 'intro': a centred card (id "gp-intro"): "MINIGAME!", meta.title big, meta.goal, "Controls: " + meta.controls,
  "Starts in N" from left. Unknown id → show the id as the title.
- 'mini': hide everything (the runner draws its own overlay). The corner leave button belongs to menu.ts, not you.
- 'results': card (id "gp-results"): seats sorted by place, each row "1st  Gnash  +10 ●" using places and coins from the phase;
  ties show the same place.
- 'final': card (id "gp-final"): podium order with stars and coins, the winner big with "WINS!", button "BACK TO MENU"
  (calls onBackToMenu).
- show() with the same v twice must not rebuild the DOM (no flicker); build each card when the phase kind or v changes.

## Done when
- `npx tsc --noEmit -p games/gnome-party` passes.
- Reading the code: every phase kind in Phase is handled, and no element outside "gp-hud" is created or styled.

## Out of scope
menu.ts (title and leave button), board/view.ts (3D), main.ts.
~~~~

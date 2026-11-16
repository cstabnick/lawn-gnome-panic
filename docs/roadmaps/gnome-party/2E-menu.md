~~~~text
Epic: 2 Systems and the golf and bowling slices
Depends on: none

## Goal
The title menu and the online waiting panel, as DOM over the canvas: play solo against CPUs, quick match, join or make a room code, number of rounds, and a leave button during a party.

## Read first
- games/gnome-party/src/config.ts: BOARD.roundChoices, BOARD.defaultRounds
- games/gnome-party/src/net.ts: NetStatus (the type only; another worker writes the file)
- games/gnome-bowling/src/menu.ts: an example DOM menu with touch-friendly buttons and a name field that works on phones (read only)
- games/gnome-party/src/ui/menu.ts: the stub you replace

## Change
- games/gnome-party/src/ui/menu.ts: implement the Contract.

## Contract (keep these exports exactly)
import type { NetStatus } from '../net';

export interface MenuHandlers {
  onSolo(rounds: number): void;
  onQuickMatch(name: string): void;
  onRoom(code: string, name: string): void;
  /** Cancel the queue (while waiting) or leave the party (the small corner button). */
  onLeave(): void;
}
export interface Menu {
  /** 'title' = the full menu; 'waiting' = status panel with a Cancel button; 'hidden' = only the corner Leave button. */
  show(mode: 'title' | 'waiting' | 'hidden'): void;
  setStatus(s: NetStatus): void;
  /** Hide the online buttons (net unavailable). */
  setOnlineAvailable(ok: boolean): void;
}
export function createMenu(parent: HTMLElement, h: MenuHandlers): Menu;

Layout and rules:
- Append one container div (id "gp-menu") to parent; never touch parent's own style. Container: position absolute, inset 0,
  pointer-events auto only on the visible panel, so the canvas still gets input when hidden.
- Title: big "GNOME PARTY" heading, a name input (id "gp-name", maxlength 16, default getMyGnome()?.name from '@lawn/gnome' or
  localStorage 'gnome-party.name', saved back on change; wrap localStorage in try/catch), a rounds picker (buttons for each of
  BOARD.roundChoices, default BOARD.defaultRounds), buttons "PLAY VS CPUs" (id "gp-solo"), "QUICK MATCH" (id "gp-quick"),
  a room code input (id "gp-code", upper-cased, A-Z0-9, 4-8 chars) and "JOIN ROOM" (id "gp-room", disabled until the code is valid),
  and a "MAKE ROOM" button that fills gp-code with 5 random A-Z0-9 characters and joins it.
  Online rounds: quick match always uses BOARD.defaultRounds (the host's choice is the default; the picker only applies to solo).
- Waiting: the status message, the room code large if any ("Room ABCDE: tell your friends"), and "CANCEL" (calls onLeave).
  status 'error' shows the message in red and a Back button returning to 'title'.
- Hidden: a small "✕" button (id "gp-leave") in the top-right corner; tap asks confirm("Leave the party?") then onLeave.
- Buttons at least 48 px tall; panel max-width 420 px, centred; dark translucent backing; system-ui font.
- Phones: the inputs must be typeable: stop pointerdown/touchstart propagation on inputs, and give the container
  data-scroll (main.ts cancels touches on everything without it).

## Done when
- `npx tsc --noEmit -p games/gnome-party` passes.
- Every id above exists in the DOM after createMenu(...).show('title').

## Out of scope
hud.ts (the in-party HUD), net.ts, main.ts.
~~~~

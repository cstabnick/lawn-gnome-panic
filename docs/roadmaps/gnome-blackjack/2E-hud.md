Epic: 2 (all modules, in parallel)
Depends on: none

(First read `docs/roadmaps/gnome-blackjack/_env.md`: environment and repo rules.)

## Goal
The DOM UI over the 3D table: name plates, speech bubbles above each gnome, bet and action buttons, the visible 15-second decision timer, chat, and the online status. `src/hud.ts`.

## Read first
- `games/gnome-blackjack/src/hud.ts`: the stub you replace (keep `HudApi`, `HudFrame`, `Hud`, `createHud`).
- `games/gnome-blackjack/src/config.ts`: `TableState`, `Seat`, `Hand`, `Bubble`, `NetStatus`, `TableInput`, `BET_STEPS`, `MIN_BET`, `MAX_BET`, `BET_S`, `TURN_S`, `TIME_LOW_S`, `BUBBLE_S`, `DEALER`.
- `games/gnome-blackjack/src/cards.ts`: `handTotal(cards)` (it may still be a stub returning 0 while another worker writes it; just call it).
- `games/gnome-blackjack/src/characters.ts`: `DEALER_CHAR.name`.
- `games/gnome-blackjack/src/app.ts`: how `update(f)` is called each frame and what each `HudApi` method does (read only).

## Change
- `src/hud.ts`:
  - Repo rule: append your own container (`#bj-hud`, `position:fixed; inset:0; pointer-events:none`) to `ui`; never restyle or hide `#ui`. Inject one `<style>` element (id `bj-hud-style`) with all CSS. Interactive elements get `pointer-events:auto`. Keep the top-right 70×50 px free (the volume button lives there).
  - Build elements once and reuse them; set `textContent`/styles only when the value changed (it runs every frame).
  - **Plates**: one per seat index 0..SEAT_COUNT-1 plus one for `DEALER`, positioned at `f.headScreen(seat)` (`transform: translate(-50%, -100%)`, hidden when null or the seat is empty). Shows name (in the seat colour, `#${color.toString(16).padStart(6,'0')}`), chips (🪙 N), and when the seat has a hand: the total (`handTotal`, prefix "soft " when soft, "BJ" for 2-card 21) and the bet. My own plate (`f.mySeat`) has a gold outline and "(you)". Dealer plate: `DEALER_CHAR.name` and, while `st.holeHidden`, only the first card's value + " + ?".
  - **Results**: in phase 'payout' each hand's plate shows a badge: blackjack gold "BLACKJACK +N", win green "+N", push grey "PUSH", lose/bust red "−N" / "BUST".
  - **Timer**: on the turn seat's plate in 'playing', a bar that shrinks with `st.timer / TURN_S` and turns red at `TIME_LOW_S`, with the seconds (`Math.ceil(st.timer)`). Everyone sees it (it is how online players know who is slow). In 'betting', a top-centre banner "Place your bets · 12s" with a bar of `st.timer / BET_S`.
  - **Speech bubbles**: one per `st.bubbles` entry (key by `id`), above its seat's plate (`headScreen` y minus the plate's height minus 8 px): white rounded box, dark text 15 px, max-width 220 px, a small tail pointing down, the speaker's name tiny on top. Text types out at 28 characters/second from when you first saw that id (it matches the mutter). Fades out over the last 0.5 s of `BUBBLE_S` after `bubble.at` (using `st.t`); removed when it leaves `st.bubbles`.
  - **My controls** (bottom centre panel, buttons at least 48 px tall, big and touch friendly):
    - 'betting', my seat exists and not `ready`: "Bet N" display, one "+S" button per `BET_STEPS` (sends `{k:'bet', amount: min(MAX_BET, (seat.bet || 0) + S)}`), "Clear" (`{k:'bet', amount: MIN_BET}`), and "Deal me in" (`{k:'ready'}`). Space or R = deal me in.
    - 'betting' and ready: "Waiting for the others…".
    - 'playing' and `st.turn === f.mySeat`: "Hit" (H), "Stand" (S), "Double" (D; disabled unless the hand has exactly 2 cards and chips ≥ hand.bet), sending `{k:'act', a}`, with the seconds left large beside them.
    - 'playing', someone else's turn: "<name> is thinking…". My seat without a hand this round: "Sitting this hand out". Other phases: nothing.
  - **Chat**: a 💬 button bottom-left; it or Enter opens a text input (maxLength 80); Enter sends `api.chat(text)` if non-empty and closes; Escape closes. While it is open, the H/S/D/R/Space shortcuts are off.
  - **Status** (top-left, small): `f.net.message`, then "· N gnomes online" when `f.net.status === 'online'` and `humans > 1`, and "Room CODE" when `f.net.code`. Two small buttons: "Room code" (`prompt('Room code (4-8 letters/numbers)')`, upper-cased, sent with `api.joinRoom` if it matches `/^[A-Z0-9]{4,8}$/`) and "Public table" (`api.quickMatch()`).
  - Keyboard listener on `window` (`keydown`), ignoring repeats.

## Contract
```ts
export interface HudApi { input(i: TableInput): void; chat(text: string): void; joinRoom(code: string): void; quickMatch(): void }
export interface HudFrame { st: TableState; mySeat: number; net: NetStatus; headScreen(seat: number): { x: number; y: number } | null }
export interface Hud { update(f: HudFrame): void }
export function createHud(ui: HTMLElement, api: HudApi): Hud;
```

## Done when
- `npx tsc --noEmit -p games/gnome-blackjack` passes for your file.
- Optional visual check (only you use this port): `cd games/gnome-blackjack && npx vite --port 5197 --strictPort` in the background, Playwright screenshot of `http://localhost:5197/#offline` after 5 s (`require('playwright')` works anywhere; `chromium.launch()` needs no options; save in /tmp/bj-hud/). Other modules may still be stubs. Stop the server afterwards.

## Out of scope
table.ts, cards.ts, banter.ts, mutter.ts, scene.ts, net.ts, app.ts, config.ts, characters.ts, index.html.

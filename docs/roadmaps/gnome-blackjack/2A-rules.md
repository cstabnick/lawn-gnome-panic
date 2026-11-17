Epic: 2 (all modules, in parallel)
Depends on: none

(First read `docs/roadmaps/gnome-blackjack/_env.md`: environment and repo rules.)

## Goal
The blackjack rules work: `src/cards.ts` and `src/table.ts` are real, pure, deterministic functions over `TableState`, with vitest tests.

## Read first
- `games/gnome-blackjack/src/config.ts`: every type and constant you use (TableState, Seat, Hand, TableInput, TableEvent, BET_S, TURN_S, ...).
- `games/gnome-blackjack/src/characters.ts`: `CHARACTERS`, `CPU_ORDER`, `Style`.
- `games/gnome-blackjack/src/cards.ts`, `src/table.ts`: the stubs you replace (keep their exports and signatures).
- `games/gnome-blackjack/src/app.ts`: how the host calls you (read only).

## Change
- `src/cards.ts`:
  - `rand(st)`: mulberry32 on `st.seed`: `st.seed = (st.seed + 0x6D2B79F5) >>> 0; let t = st.seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296;`
  - `newShoe(st)`: `DECKS` × 52 cards (r 1..13 × suits S H D C), Fisher-Yates shuffled with `rand(st)`.
  - `handTotal(cards)`: aces 1 or 11, faces 10; `soft` true when an ace is counted as 11.
  - `isBlackjack(cards)`: 2 cards, total 21.
  - `cardLabel(c)`: rank `A 2..10 J Q K` + suit `♠ ♥ ♦ ♣`.
- `src/table.ts` (pure: no DOM, no Math.random — use `rand(st)` for all randomness):
  - `newTable(seed)`: all `SEAT_COUNT` seats null, phase 'betting', `timer = BET_S`, `idleIn = IDLE_MIN_S`, `cpuIn` a think time, `round = 1`, `holeHidden = true`, `nextBubbleId = 1`.
  - CPU seat made from `CHARACTERS[id]`: `id = -(1 + CPU_ORDER.indexOf(charId))`, name, `cpu: true`, `character: charId`, color, `chips: START_CHIPS`, `bet: 0`, `ready: false`, `hand: null`, `voice: char.voice`.
  - `fillCpus(st)`: every null seat gets the first `CPU_ORDER` character not already seated; emits `{e:'join', seat}` each.
  - `seatHuman(st, id, name, character, color)`: if a seat already has this id, update its name and return it (no events). Else the first null seat; else the highest-index CPU seat is replaced (emit `leave` then `join` for that seat; if the CPU held a hand its bet is simply dropped with it; if it was `st.turn`, advance the turn as if that hand were done). Returns `{ seat: -1, events: [] }` when every seat is human. New human: `cpu false`, `chips START_CHIPS`, `bet 0`, `ready false`, `hand null`, `voice = VOICE_MIN_HZ + (Math.abs(id) * 37) % (VOICE_MAX_HZ - VOICE_MIN_HZ)`.
  - `removeHuman(st, id)`: no-op (`[]`) if no human seat has that id. Else the seat becomes null (advance the turn if it was the turn seat), emit `leave`, then return those events plus `fillCpus(st)`'s.
  - `mySeatIndex(st, id)`: keep the stub's body.
  - `addBubble(st, seat, text)`: trim, cut to 80 chars, ignore empty; drop any existing bubble of that seat; push `{ id: st.nextBubbleId++, seat, text, at: st.t }`; reset `st.idleIn` to a random IDLE_MIN_S..IDLE_MAX_S.
  - `snapshot(st)`: a deep copy (`JSON.parse(JSON.stringify(...))`) with `shoe: []`.
  - Drawing a card: if `st.shoe.length < RESHUFFLE_AT`, `st.shoe = newShoe(st)` first (a new host after a host change starts with an empty shoe), then `pop()`.
  - `tickTable(st, dt)` advances `st.t`, `st.phaseT`; drops bubbles older than `BUBBLE_S`; counts `idleIn` down and when ≤ 0 emits `{e:'idle'}` and resets it to random IDLE_MIN_S..IDLE_MAX_S; then runs the phase:
    - **betting** (entered with `round++` after payout; the first round starts in it): on entry every seat `bet 0, ready false, hand null`, `dealer []`, `holeHidden true`, `turn -1`, `timer BET_S`, emit `roundStart`; any seat with `chips < MIN_BET` gets `chips = START_CHIPS` and emits `broke`. Each tick `timer -= dt`; `cpuIn -= dt` and when ≤ 0 the first unready CPU bets `clampBet(char.bet)` and is ready, and `cpuIn` = a think time / 2. The phase ends when every seated seat is ready, or the timer hits 0 (an unready human with `bet > 0` plays that bet; with `bet 0` sits out). Then → dealing.
    - **dealing**: every seat with `bet > 0` pays it (`chips -= bet`) and gets `hand = { cards: [], bet, done: false, doubled: false, result: null, delta: 0 }`. Deal one card to each hand in seat order, one to the dealer, then again. Emit `deal`. A hand with blackjack is `done` and emits `blackjack`. If no seat has a hand, go straight to payout. After `DEAL_S`: if the dealer has blackjack, `holeHidden = false`, emit `dealerBlackjack`, → payout; else → playing.
    - **playing**: `turn` = the first seat index whose hand is not done (none → dealer). Starting a turn: `timer = TURN_S`, `lowSent = false`, `cpuIn` = think time, emit `turn`. Each tick `timer -= dt`. Human turn: at `timer <= TIME_LOW_S` emit `timeLow` once; at `timer <= 0` emit `timeout` and stand. CPU turn: when `cpuIn <= 0`, do `cpuDecision(st, turn)`.
    - Actions (shared by `applyInput` and CPUs): **hit**: draw; total > 21 → done, emit `hit` then `bust`; total 21 → done, emit `hit` then `stand`; else emit `hit` and restart the clock (`timer = TURN_S`, `lowSent = false`, new `cpuIn`). **stand**: done, emit `stand`. **double**: allowed only with exactly 2 cards and `chips >= hand.bet` (else ignored, no event): `chips -= bet`, `bet *= 2`, `doubled = true`, draw one, done, emit `double` (then `bust` if over 21). When the turn hand is done, move to the next undone hand; none left → dealer.
    - **dealer**: on entry `holeHidden = false`, `turn -1`, `timer 0`, emit `dealerReveal` with the total. If every hand busted, → payout. Else every `DEALER_GAP_S`: total < 17 → draw (stands on all 17s); otherwise, if over 21 emit `dealerBust`; → payout.
    - **payout** (on entry): each hand: busted → `bust`, delta −bet. Player blackjack and dealer not → `blackjack`, chips += bet + floor(bet × 1.5), delta +floor(bet × 1.5). Dealer blackjack and player not → `lose`. Both blackjack → `push`. Dealer bust or higher total → `win`, chips += 2 × bet, delta +bet. Equal → `push`, chips += bet, delta 0. Lower → `lose`, delta −bet. Set `hand.result` and `hand.delta`, emit `result` per hand. After `PAYOUT_S` → betting.
    - Every phase change sets `phaseT = 0`.
  - `applyInput(st, seat, input)`: ignore (return `[]`) when the seat is empty or is a CPU. `bet`: only in betting and the seat not ready: `bet = clampBet(amount)` where clampBet clamps to `MIN_BET..min(MAX_BET, chips)` (rounded to an integer). `ready`: only in betting; if `bet === 0` set `bet = clampBet(MIN_BET)`; `ready = true`. `act`: only in playing and `seat === st.turn`.
  - `cpuDecision(st, seat)` (up card = `st.dealer[0]`, value ace 11, faces 10; t = the hand's total):
    - reckless: double if 2 cards, t 9..11 and chips ≥ bet; hit if t < 18; else stand.
    - normal: double if 2 cards, t 10 or 11, up < 10 and chips ≥ bet; soft t ≤ 17 → hit; t < 12 → hit; up 2..6 → stand at 13+; else hit below 17.
    - cautious: never doubles; up 2..6 → stand at 12+; else stand at 15+; else hit.
  - Think time: `CPU_THINK_MIN_S + rand(st) * (CPU_THINK_MAX_S - CPU_THINK_MIN_S)`.
- `src/table.test.ts` (vitest: `import { describe, it, expect } from 'vitest'`): handTotal (A+K = 21 soft, A+A+9 = 21, K+Q+5 = 25, A+6 soft 17); `newShoe` length `DECKS*52`, same seed → same order; a table of 5 CPUs ticked at dt 1/30 for 600 simulated seconds: no throw, `round >= 8`, chips always finite and ≥ 0, every phase seen; a human seated who never sends input sits out (hand null after betting); a human who sends `ready` and then nothing stands by timeout after `TURN_S` (events include `timeLow` and `timeout`); `seatHuman` into a full CPU table replaces seat 4 and `removeHuman` turns it back into a CPU; `snapshot` has `shoe: []` and is a copy.

## Contract
Keep these signatures exactly (from the stubs):
```ts
// cards.ts
export function rand(st: { seed: number }): number;
export function newShoe(st: { seed: number }): Card[];
export function handTotal(cards: Card[]): { total: number; soft: boolean };
export function isBlackjack(cards: Card[]): boolean;
export function cardLabel(c: Card): string;
// table.ts
export function newTable(seed: number): TableState;
export function fillCpus(st: TableState): TableEvent[];
export function seatHuman(st: TableState, id: number, name: string, character: string, color: number): { seat: number; events: TableEvent[] };
export function removeHuman(st: TableState, id: number): TableEvent[];
export function mySeatIndex(st: TableState, id: number): number;
export function applyInput(st: TableState, seat: number, input: TableInput): TableEvent[];
export function tickTable(st: TableState, dt: number): TableEvent[];
export function addBubble(st: TableState, seat: number, text: string): void;
export function snapshot(st: TableState): TableState;
export function cpuDecision(st: TableState, seat: number): Action;
```

## Done when
- `npx tsc --noEmit -p games/gnome-blackjack` passes (errors in files you do not own may appear while others work; yours must have none).
- `cd games/gnome-blackjack && npx vitest run table` passes.

## Out of scope
Every other file in `games/gnome-blackjack/src` (banter.ts, mutter.ts, scene.ts, hud.ts, net.ts, app.ts, config.ts, characters.ts).

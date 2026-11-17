Epic: 2 (all modules, in parallel)
Depends on: none

(First read `docs/roadmaps/gnome-blackjack/_env.md`: environment and repo rules.)

## Goal
The gnomes banter: `src/banter.ts` turns table events into short, funny, in-character lines that the game shows in speech bubbles (and mutters aloud).

## Read first
- `games/gnome-blackjack/src/config.ts`: `TableState`, `Seat`, `TableEvent` (every event kind), `DEALER` (= -1).
- `games/gnome-blackjack/src/characters.ts`: the 6 CPU gnomes (`gnorbert` cautious old grump with glasses, `gnadine` reckless high roller, `grumbo` gruff, `pebble` an eager youngster, `thistle` a sweet but sharp auntie, `moss` a smooth talker) and the dealer `DEALER_CHAR` (Old Gnick).
- `games/gnome-blackjack/src/banter.ts`: the stub you replace.

## Change
- `src/banter.ts`:
  - `banterFor(st, ev, r)` returns `{ seat, text }` (seat = a seat index or `DEALER`) or null. `r()` returns [0, 1); use it for every random choice (no Math.random).
  - **Only CPU gnomes (`seat.cpu === true`) and the dealer ever speak.** Never put words in a human's mouth.
  - `subject` = `ev.seat` when the event has one. Speaker and chance per event:
    - `blackjack` 1.0: the subject if CPU (own brag), else another CPU cheers or the dealer.
    - `bust` 0.8: the subject if CPU (60%) groans; otherwise another CPU teases.
    - `double` 0.7 subject CPU or a CPU reacting; `hit` 0.12 and `stand` 0.12 subject CPU only.
    - `turn` 0.12 dealer ("Your call, {name}.").
    - `timeLow` 0.75: another CPU or the dealer nags the subject by name. `timeout` 0.9: dealer.
    - `dealerReveal` 0.3 dealer; `dealerBust` 0.9 a random CPU celebrates; `dealerBlackjack` 1.0 dealer gloats.
    - `result` with `delta >= 20` 0.5 (subject CPU brags, or another CPU is jealous); `result` lose 0.2 subject CPU.
    - `join` 1.0 dealer welcomes the subject (if the subject is human, a CPU may instead say hi, 40%). `leave` 0.5 dealer. `broke` 1.0 dealer spots them chips.
    - `roundStart` 0.3 dealer ("Place your bets"). `deal` never. `idle` 1.0: a random CPU says an idle line.
    - If the chosen speaker does not exist (no CPU seated), return null.
  - Lines are data: `const LINES: Record<string, Partial<Record<Topic, string[]>>>` keyed by character id plus `'dealer'`, with `type Topic = 'idle' | 'ownBust' | 'ownBlackjack' | 'ownWin' | 'ownLose' | 'ownDouble' | 'ownHit' | 'ownStand' | 'tease' | 'cheer' | 'nag' | 'jealous' | 'dealerBust' | 'hello' | ...` (dealer topics: 'turn', 'timeout', 'welcome', 'leave', 'broke', 'roundStart', 'reveal', 'gloat', 'nag', 'cheer'). Fall back to a shared `GENERIC` table when a character lacks a topic. At least 4 lines per character per topic it has, and at least 8 idle lines each.
  - Placeholders: `{name}` = the subject's name, `{me}` = the speaker's name, `{other}` = a random other seated gnome's name (any seat, human or CPU; fall back to "{dealer}" name if none), `{dealer}` = `DEALER_CHAR.name`. Replace all.
  - Tone: gnome flavour, short (≤ 70 characters), PG. Idle lines are gnome table talk that makes it feel like banter: gardens, mushrooms, worms, the lawnmower menace, cheese, beards, hats, ribbing `{other}` ("{other}, is that your third mushroom ale?"), card superstitions. Each personality should sound different (Gnorbert grumbles, Gnadine is brash, Pebble is excitable, Thistle is sweet-sharp, Mossimo is smooth, Grumbo is terse). The dealer is dry and old-timey.
- `src/banter.test.ts` (vitest): build a `TableState` by hand (a fixture, do NOT import table.ts, another worker is writing it): 3 CPU seats (`gnorbert`, `gnadine`, `pebble`, `cpu: true`), 1 human seat (`cpu: false`, name 'Robin'), 1 null; with a seeded `r` (a small LCG). For every `TableEvent` kind (seat 0..3 where one is needed) over 200 calls each: the result is null or has `seat === DEALER` or a CPU seat index, `text` is non-empty, ≤ 90 chars and contains no `{`; never the human seat. With no CPU seats, `idle` returns null.

## Contract
```ts
export function banterFor(st: TableState, ev: TableEvent, r: () => number): { seat: number; text: string } | null;
```

## Done when
- `npx tsc --noEmit -p games/gnome-blackjack` passes for your files.
- `cd games/gnome-blackjack && npx vitest run banter` passes.

## Out of scope
table.ts, cards.ts, mutter.ts, scene.ts, hud.ts, net.ts, app.ts, config.ts, characters.ts.

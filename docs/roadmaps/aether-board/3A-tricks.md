Epic: 3 (more tricks, pipes, personality; in parallel)
Depends on: none

(First read `docs/roadmaps/aether-board/_env.md`: environment and repo rules.)

## Goal
`src/tricks.ts` recognizes the full Skate-style trick list from the shared gesture tables, including the harder
versions popped with a grab button held, and scores the new grabs, grinds, grind switches and falls.

## Read first
- `games/aether-board/src/tricks.ts`: the current recognizer + combo (keep `Recognizer`, `createRecognizer`, `Combo`,
  `createCombo`; `feed` now has a 4th parameter `mod?: boolean`). Keep its current ground rules that already work:
  loading in S/SW/SE, the ARM_S grace after a pull-back, passing through centre on the way up, the plain flick-up ollie,
  side-zone shove timing. Keep the existing tests passing (update expectations only where this issue changes a trick).
- `games/aether-board/src/config.ts`: `GROUND_GESTURES` (trick, path, mod), `AIR_GESTURES` (trick, zone), `Zone`,
  `zoneOf`, `BOARD_TRICKS` (now 18 tricks), `GRABS` / `GrabKind`, `GRINDS` / `GrindKind`, `PhysEvent` (grabStart /
  grabEnd now carry `name: GrabKind`; grindStart / grindEnd carry `kind: GrindKind`; new `grindSwitch { from, to, t,
  ley }` and `skyfall`).
- `games/aether-board/src/app.ts`: `recognizer.feed(inp.stick, player.mode, DT, inp.grab !== 0)`.

## Change
- `src/tricks.ts`:
  - **Ground** (`mode` 'ground' or 'grind'): the gesture is the list of zones visited after leaving the bottom. When it
    reaches a top zone (N/NE/NW), or ends on a side (W/E) per the existing shove rules, find the `GROUND_GESTURES` entry
    whose `mod` equals the `mod` argument **at the moment of the pop** and whose `path` matches: the last zone is the
    entry's last zone, and if the entry's path has 2 zones, that side zone (W or E) was visited on the way. Prefer the
    2-zone entry when a side was visited and one exists; else the 1-zone entry. Fire `{ kind: 'pop', trick, power }`
    as today. Drive the recognizer from the tables (no second hard-coded copy of the trick list).
  - **Air**: as today (a quick flick from centre), using `AIR_GESTURES`, but **no air flick fires while `mod` is true**
    (the stick then picks the grab in the physics).
  - **Combo**: 'grabEnd' with t ≥ 0.2: line `${GRABS[name].name} ${t.toFixed(1)}s`, + round(GRABS[name].points + 150 t).
    'grindSwitch': line `${GRINDS[from].name} ${t.toFixed(1)}s`, + round(GRINDS[from].base + GRINDS[from].perS × t)
    (+ 30 % if `ley`), and add the word "Ley-line " in front of the first grind line of a ley-line. 'grindEnd': the same
    for `kind`. 'skyfall': the running combo is lost like a bail, but `last.text` is 'LOST IN THE AETHER'.
    Everything else as today.
- `src/tricks.test.ts`: keep the current tests; add: with `mod` true on the ground, S → NW pops 'doubleKick', S → W →
  N pops 'doubleTre', S → E (side, then centre) pops 'fsThreeShove'; without mod S → E → N pops 'hardflip'; in the air a
  flick with `mod` true fires nothing; a 'grindSwitch' then 'grindEnd' gives two grind lines with GRINDS names; a grab
  'grabEnd' with name 'method' gives a "Method …s" line; 'skyfall' loses the combo with text 'LOST IN THE AETHER'. Every
  `GROUND_GESTURES` entry is reachable: for each, feed S 0.15 s, then each path zone 0.05 s (with its mod) and expect
  that trick.

## Contract
```ts
export interface Recognizer { feed(stick: { x: number; y: number }, mode: Mode, dt: number, mod?: boolean): TrickCmd | null; trail(): { x: number; y: number }[] }
export function createRecognizer(): Recognizer;
export interface Combo { event(ev: PhysEvent, p: Player): void; tick(dt: number, p: Player): void; view(): ComboView }
export function createCombo(): Combo;
```

## Done when
- `npx tsc --noEmit -p games/aether-board` passes for your files.
- `cd games/aether-board && npx vitest run tricks` passes.

## Out of scope
Every other file in `games/aether-board/src` (physics.test.ts is the planner's).

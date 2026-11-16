Epic: 2 (all modules, in parallel)
Depends on: none

(First read `docs/roadmaps/aether-board/_env.md`: environment and repo rules.)

## Goal
Skate-style flick tricks and scoring: `src/tricks.ts` turns the trick stick (the mouse as a springy virtual stick, or a
gamepad's right stick) into pop and flip commands for the physics, and turns physics events into a scored combo.

## Read first
- `games/aether-board/src/tricks.ts`: the stub you replace (keep `Recognizer`, `createRecognizer`, `Combo`, `createCombo`).
- `games/aether-board/src/config.ts`: `TrickCmd`, `BoardTrick`, `BOARD_TRICKS` (names, points), `Mode`, `PhysEvent`,
  `Player` (`t`, `mode`), `ComboView`.
- `games/aether-board/src/physics.ts` lines 1-20 and `stepPlayer` / `chargeAndPop`: the physics crouches by itself while
  `stick.y < -0.5`, and pops when it receives `{ kind: 'pop' }`; in the air it starts a trick on `{ kind: 'air' }` unless
  one is already running.
- `games/aether-board/src/app.ts`: `feed` is called once per simulation step (120 Hz) with `dt = 1/120`; `event` for
  every physics event; `tick` once per step.

## Change
- `src/tricks.ts` (pure: no DOM, no window, no Math.random):
  - **Zones.** For a stick sample `{x, y}` (x right, y up, unit disc): magnitude `m = Math.hypot(x, y)`; angle
    `a = Math.atan2(x, y)` in degrees (0 = up, 90 = right, ±180 = down, -90 = left). Centre when `m < 0.3`. A zone when
    `m >= 0.6`: N |a| < 22.5, NE 22.5..67.5, E 67.5..112.5, SE 112.5..157.5, S |a| ≥ 157.5, SW -157.5..-112.5,
    W -112.5..-67.5, NW -67.5..-22.5. Between 0.3 and 0.6: keep the previous state.
  - **Ground recognizer** (`mode` 'ground' or 'grind'), Skate style "pull back, flick forward":
    1. Loading: the stick is in S, SW or SE. Count `loadT` (seconds spent loaded, capped at 0.3).
    2. When it leaves the bottom zones, start a gesture: remember the time, and every zone visited after that.
    3. The moment it enters N, NE or NW: fire `{ kind: 'pop', trick, power }` with
       `power = 0.4 + 0.6 * loadT / 0.3` (0.4..1). Trick: N → 'ollie', or 'treFlip' if W was visited on the way, 'hardflip'
       if E was; NW → 'kickflip' (or 'doubleKick' if it got there under 0.08 s after leaving the bottom), 'varialKick' if W
       was visited; NE → 'heelflip', or 'varialHeel' if E was visited.
    4. If it reached W or E but not the top, then returns to centre or 0.22 s pass: 'popShove' (W) / 'fsShove' (E).
    5. Returning to centre with none of these, or 0.35 s without a result: cancel (no command).
    After a command, wait for the stick to return to centre before a new gesture.
  - **Air recognizer** (`mode` 'air'): a flick from centre to a zone with `m >= 0.75` within 0.15 s fires
    `{ kind: 'air', trick }`: W kickflip, E heelflip, NW varialKick, NE varialHeel, N impossible, S popShove, SW treFlip,
    SE hardflip. Then wait for the centre again.
  - `mode` 'bail': nothing. Reset the recognizer's state whenever `mode` switches between ground-like ('ground', 'grind')
    and 'air'.
  - `trail()`: the last 0.4 s of samples (oldest first), every second sample is enough.
  - **Combo** (`createCombo`): a running combo has `lines` (names, oldest first), `points` (raw) and `mult` = number of
    lines (≥ 1). Banked score = points × mult.
    - 'takeoff' or 'grindStart' while no combo runs: start one. Any event below that adds a line also starts one.
    - 'pop' with 'ollie': line "Ollie", +50. 'trickDone': line `BOARD_TRICKS[trick].name`, + its points.
    - 'grabEnd' with t ≥ 0.2: line `${kind === 1 ? 'Indy' : 'Melon'} ${t.toFixed(1)}s`, + round(100 + 150 t).
    - 'land': if |spin| ≥ 180: line `${spin > 0 ? 'BS' : 'FS'} ${Math.abs(spin)}` + `n * 100 * (1 + 0.25 (n - 1))`
      (n = |spin| / 180), with " switch" appended when `switchLand`. Each whole flip: line "Frontflip" (flips > 0) or
      "Backflip", +400 each ("Double Backflip" for |flips| = 2, +800). `perfect`: line "Perfect", +100. Then if the combo
      has any lines, `linkLeft = 1.4` s.
    - 'grindStart' with |spin| ≥ 180: line `${spin > 0 ? 'BS' : 'FS'} ${|spin|} in`, same points as a landed spin.
      'grindEnd': line `${ley ? 'Ley-line' : 'Rail'} Grind ${t.toFixed(1)}s`, + round(ley ? 150 + 80 t : 100 + 60 t).
    - 'bail' or 'respawn': the combo is lost: `last = { text: 'BAILED', points: points * mult, t: p.t, kind: 'bailed' }`
      (for 'respawn' only if a combo was running), then reset.
    - 'warp': line "Aether Warp", +1000, then bank at once.
    - `tick(dt, p)`: while `p.mode === 'ground'` and `linkLeft > 0`, count it down; at 0 bank the combo. In the air or on
      a rail `linkLeft` stays as is (the combo continues).
    - Banking: `total += points * mult`, `best = max(best, points * mult)`, `last = { text: lines.join(' + ')` (cut to
      80 chars with '…'), `points: points * mult, t: p.t, kind: 'landed' }`, then reset the running combo.
    - `view()` returns a `ComboView` (reuse one object; arrays may be the live ones).
- `src/tricks.test.ts` (vitest): a helper that feeds a list of `[x, y, seconds]` holds at dt 1/120. Ground: S 0.15 s → N:
  pop 'ollie' with power ≥ 0.6; S → NW: 'kickflip'; S → W → N: 'treFlip'; S → W → centre: 'popShove'; S → centre: nothing;
  small wobble (m < 0.5) for 2 s: nothing. Air: centre → W in 0.05 s: `{ kind: 'air', trick: 'kickflip' }`. Combo:
  takeoff, pop kickflip, trickDone kickflip, land spin 360 → after `tick` on a ground player for 1.5 s, `total` is
  (120 + 250) × 2 = 740 and `last.kind` is 'landed'; a bail instead gives total 0 and `last.kind` 'bailed'. Build Player
  objects for the combo test with `createPlayer(generateWorld(1))` from physics.ts / world.ts.

## Contract
```ts
export interface Recognizer { feed(stick: { x: number; y: number }, mode: Mode, dt: number): TrickCmd | null; trail(): { x: number; y: number }[] }
export function createRecognizer(): Recognizer;
export interface Combo { event(ev: PhysEvent, p: Player): void; tick(dt: number, p: Player): void; view(): ComboView }
export function createCombo(): Combo;
```

## Done when
- `npx tsc --noEmit -p games/aether-board` passes for your files.
- `cd games/aether-board && npx vitest run tricks` passes.

## Out of scope
Every other file in `games/aether-board/src`.

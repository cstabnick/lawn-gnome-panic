Epic: 3 Content
Depends on: none (Epics 1-2 are done: `collect.ts`, `walk.ts` and `office.ts` are real)

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\stingaree` (a git worktree). Node: if not found, `export PATH="/c/Program Files/nodejs:$PATH"` in Git Bash.
- Dependencies are installed (`@lawn/party` and `vitest` are already in the game's package.json). Do not run `npm install`. Do not `git commit`.
- Five other workers are writing the chapters and floors (including `src/floors/f2.ts`, the floor your slice plays on) right now. You own `games/nothing-left-to-collect/src/minigames/` (new) and `src/main.ts`. Do not edit any other game file. If a game module you need is not callable on its own, stop and say so in your report instead of copying code.
- Your dev server, if you run one, uses port **5226** only: `npx vite --port 5226 --strictPort` from `games/nothing-left-to-collect`. Stop it when done.

## Goal

Add the game's Gnome Party slice **Hoard Rush** (`hoard-rush`): 30 seconds, four gnomes on Floor 2, the ceiling
rains office supplies and the multiplier doubles every 10 seconds; whoever collects the most wins. Built from the
game's own pure modules: `collect.ts` (items, magnet, rain, `stepCollect` with several collectors, `formatCount`),
`walk.ts` (`stepWalker`) and, for the view, `office.ts` (`buildFloor(scene, 'f2')`).

## Read first

- `packages/party/README.md`: "How a game surfaces a slice" (steps 1-6) and the size rules (pasted below).
- `packages/party/src/types.ts`: `MinigameDef<S, I>`, `SeatInfo`, `PadState` (`x`, `y` stick -1..1, +y up; `a`, `aPressed`), `ViewCtx` (`scene`, `camera`, `renderer`, `ui`, `seats`, `mySeat`), `MinigameView`.
- `packages/party/template/minigame.ts`: the working "Mash" slice `npm run new-mini` copies (structure, `report`, `createView`).
- `games/nothing-left-to-collect/src/collect.ts`, `src/walk.ts`: the pure functions you call. `src/types.ts`: `CollectState`, `Walker`, `Rect`, `Box`.
- `games/nothing-left-to-collect/src/floors/f2.ts` (being written now; use only its area names `open-plan` and `all`, and the floor size 32 x 26 m) and `src/office.ts` (`buildFloor(scene, 'f2')` returns a `Floor` with `colliders`, `group`, `update(dt)`, `dispose()`).

## Slice rules (from packages/party/README.md)

- One round of 20-60 seconds (`maxSeconds` 15-90). One verb (move), explained by the one-sentence `controls`.
- All four seats play at the same time; every seat ends with a place.
- Built from the game's own modules. Never copy them. Slice-only code (CPU, scoring, view glue) stays small: about 300 lines in all.
- State is small JSON (< 2 KB); input is a level; one-off actions are counters.
- No menus, levels, progression, saving, own netcode or own music. Modules must not touch the DOM or `window` at import time.
- Every screen runs the view; only the host runs `init`. Replays use a local clock; snapshots arrive 15 times a second, so smooth positions with `obj.position.lerp(target, 1 - Math.exp(-dt * 15))`.
- Tested by the game: `src/minigames/minigames.test.ts` calls `testMinigame(def)` for every slice.

## Change

1. Run `npm run new-mini -- nothing-left-to-collect hoard-rush`. It writes `src/minigames/hoard-rush.ts` (the template), `index.ts`, `minigames.test.ts`, `play.ts`, and marks the `hoard-rush` backlog row "building" in `packages/party/README.md` (the row exists already). Keep the generated `index.ts`, `minigames.test.ts` and `play.ts` as they are.
2. `src/main.ts` (replace whole file; the game's `app.ts` already has no `loadMyGnome` call):
   ```ts
   // Entry: the full game, or (#minigame) this game's Gnome Party slice played alone against 3 CPUs.
   import { loadMyGnome } from '@lawn/gnome';
   await loadMyGnome();
   if (/[#&]minigame\b/.test(location.hash)) (await import('./minigames/play')).playOwnSlice();
   else await import('./app');
   ```
3. Rewrite `src/minigames/hoard-rush.ts`:

## Design

- `meta`: `{ id: 'hoard-rush', title: 'Hoard Rush', game: 'nothing-left-to-collect', goal: 'Collect more than anyone in 30 seconds while the ceiling rains office supplies.', controls: 'Move with the stick, WASD or arrows; walk into things to collect them.', maxSeconds: 30 }`.
- `S`: `{ t: number; c: CollectState; w: Walker[] (4); score: number[] (4); cpu: { tx: number; tz: number }[] (4); nextRain: number; nextDouble: number }`.
  - `c` comes from `createCollectState(seed)` with a seed from `rng()`. Keep at most **16 live items** (`c.items.length`) so S stays under 2 KB; round item and walker positions to 2 decimals after each step (`Math.round(v * 100) / 100`). Start `c.magnet` at 0.8.
- `I`: `{ x: number; z: number }` (the stick: `x = pad.x`, `z = -pad.y`, each rounded to 2 decimals).
- `init(seats, rng)`: four walkers via `createWalker` at the corners of the `open-plan` rectangle `{x0:-9, z0:-6, x1:9, z1:9}` (inset 1 m), facing the middle; `scatter(c, 'clip', 8, OPEN_PLAN)`.
- `step(s, inputs, dt, rng)`: `s.t += dt`. For each seat k, `stepWalker(s.w[k], i.x, i.z, false, COLLIDERS, 0, dt)` where `i = inputs[k] ?? { x: 0, z: 0 }` and `COLLIDERS: Box[]` are four boxes for the open-plan's edges (keep everyone inside `open-plan`; you cannot use the real floor's colliders here because `buildFloor` needs three, and `step` must stay pure). Rain: when `s.t >= s.nextRain` (every 0.6 s) and fewer than 16 items, `rain(c, kind, 2, OPEN_PLAN)` with `kind` from `rng()` (clip 60%, sticky 30%, button 10%). Double: when `s.t >= s.nextDouble` (every 10 s) `c.multiplier *= 2`. Then `const picks = stepCollect(c, s.w.map(w => ({ x: w.x, y: w.y, z: w.z })), dt)` and `s.score[p.by] += p.amount` for each pickup. Note `stepCollect` draws randomness only through `rand(c)` (seeded state), so the host stays deterministic.
- `cpu(s, seat)` (S is read-only here): head for the nearest item (xz distance); if none, head for the wander target `s.cpu[seat]`. The wander targets are updated in `step` (which may use `rng`): for every seat, when its walker is within 1 m of its target, pick a new random point inside `open-plan`. Return a unit stick toward the target, scaled 0.85 so humans can beat them.
- `result(s, timeUp)`: null until `timeUp || s.t >= 30`, then places by score (ties share), like the template.
- `report(s, places, seats)`: headline `${seats[w].name} hoarded ${formatCount(score)}!` for a sole winner; stats `[{ key: 'hoard', label: 'Collected', better: 'higher' }]`; values from `score`; notes: `'Floor 2: 104%'` for the winner, null otherwise.
- `createView(ctx)`: `const floor = buildFloor(ctx.scene, 'f2')`; one `createGnomeModel(seat.look)` per seat; one item view: you may use `createItemView(ctx.scene)` from `../items` and call `items.sync(s.c, dt)` with the snapshot's `c` (it creates/removes drops by item id). Camera: fixed, looking down at the open-plan from `(0, 22, 20)` toward `(0, 0, 1.5)` (pull back ×1.4 when `ctx.camera.aspect < 1`). Smooth each gnome toward its walker position and animate with `model.update({ position, velocity, facing, grounded: true, jumpsUsed: 0 }, dt)`. A small overlay in `ctx.ui`: four score chips in seat colours using `formatCount`. `input(pad)`: `{ x: round2(pad.x), z: round2(-pad.y) }`. `dispose()`: `floor.dispose()`, `items.clear()`, remove the models.

## Done when

- `npm test -w games/nothing-left-to-collect` passes (runs `testMinigame` on `hoard-rush` plus the game's other tests). Fix any S-size, report or determinism failure it names.
- `npx tsc --noEmit -p games/nothing-left-to-collect` shows no errors in `src/main.ts` and `src/minigames/*`.
- With your dev server on 5226: `http://localhost:5226/#minigame=hoard-rush` plays a 30 s round against 3 CPUs; `http://localhost:5226/` still starts the full game.

## Out of scope

Every other file in `games/nothing-left-to-collect/` (do not edit `collect.ts`, `walk.ts`, `office.ts`, `items.ts`, `floors/*`), `games/gnome-party/**`, all packages except the one backlog cell `new-mini` updates.

Epic: 1 Descent
Depends on: none

## Environment
Working directory: `C:\Users\cstab\Documents\gaming` (Windows, Git Bash). If `node` is not found:
`export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed. Do not run `git commit`.
Other workers are editing other files in `games/aether-board` at the same time (world.ts, view/*, descent/*,
app.ts). Touch only the files listed under Change.

## Goal
Riding into an aether-spike hazard (`World.hazards`) makes the rider bail, with the same `bail` event the rest of
the game already handles. In free ride `hazards` is empty, so nothing changes there.

## Read first
- `games/aether-board/src/physics.ts`: `stepPlayer` (the step order), the landing-bail block in the landing code
  (search `if (reason) {` : sets `p.mode = 'bail'`, `p.bailT = TUNE.bailTime`, scales velocity by `TUNE.bailKeep`,
  pushes `{ e: 'bail', reason }`, calls `resetAir(p)`), and how grabs / manuals end (`grabEnd`, `manualEnd` events).
- `games/aether-board/src/world.ts`: `export interface Hazard { x; y; z; r; h; island }` and `World.hazards`.
- `games/aether-board/src/config.ts`: `PhysEvent`, `Player`.
- `games/aether-board/src/physics.test.ts`: how a test builds a world and player and steps them.

## Change
- `games/aether-board/src/physics.ts`:
  - A private `function hitHazard(p: Player, w: World): boolean`: true when some hazard `hz` has horizontal distance
    `Math.hypot(p.pos.x - hz.x, p.pos.z - hz.z) < hz.r + 0.3` and `hz.y - 2 < p.pos.y && p.pos.y < hz.y + hz.h`.
    Return false right away when `w.hazards.length === 0`. (Jumping high enough over the spikes clears them.)
  - A private `function spikeBail(p: Player, ev: PhysEvent[]): void`: if a grab is held push
    `{ e: 'grabEnd', kind: p.grab, t: p.grabT, name: p.grabKind }`; if `p.manual` push
    `{ e: 'manualEnd', kind: p.manual.kind, t: p.manual.t, fell: true }` and set `p.manual = null`; then
    `p.mode = 'bail'`, `p.bailT = TUNE.bailTime`, `p.vel.multiplyScalar(TUNE.bailKeep)`, `resetAir(p)` (check its
    signature in the file), `p.grab = 0`, push `{ e: 'bail', reason: 'Spiked' }`.
  - In `stepPlayer`, right after the `switch (p.mode) { ... }` block: `if ((p.mode === 'ground' || p.mode === 'air') && hitHazard(p, w)) spikeBail(p, ev);`
    (not while grinding or already bailing).
- `games/aether-board/src/physics.hazard.test.ts` (new): vitest tests.

## Contract
No exported signature changes in physics.ts. The bail reason string is exactly `'Spiked'`.

## Done when
- `cd games/aether-board && npx vitest run src/physics.hazard.test.ts` passes, testing:
  1. `generateWorld(3)`, `createPlayer(w)`; place one hazard 10 m ahead of the spawn along `w.spawn.heading`
     (x = spawn.x + sin(heading)*10, z = spawn.z + cos(heading)*10, y from `groundAt(w, x, z, spawn.y + 50)`,
     r 2, h 2, island 0) by pushing it into `w.hazards`; step with `{ ...NO_INPUT, lean: 1 }` for up to 4 s at
     `1 / SIM_HZ`: a `{ e: 'bail', reason: 'Spiked' }` event happens.
  2. The same ride with `w.hazards` empty: no 'Spiked' bail in those 4 s.
  3. A player whose pos is set 5 m above the hazard (`y + h + 3`) is not hit (call through `stepPlayer` with the
     player in 'air' mode, one step).
- `cd games/aether-board && npx vitest run src/physics.test.ts src/tricks.test.ts` still pass.
- `cd games/aether-board && npx tsc --noEmit -p .` passes (errors in files you did not touch are another worker's
  mid-edit; rerun once, then report them rather than fixing them).

## Out of scope
world.ts, config.ts, view/*, descent/*, app.ts, tricks.ts.

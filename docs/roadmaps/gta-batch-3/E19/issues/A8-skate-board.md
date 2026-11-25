Epic: E19-A (courts and skate park: parallel modules)
Depends on: none
Agent: general-purpose (Sonnet)

## Environment
Read `docs/roadmaps/gta-batch-3/E19/issues/_env.md` first (worktree, toolchain, rules). You own the new files
`games/gnome-theft-auto/src/skate/board.ts` and `skate/board.test.ts`. Others edit other skate/ files at the same time.

## Goal
GTA's own skateboard controller: a pure step function that pushes, brakes, carves, ollies, flips and grabs in the air,
spins, launches straight up off steep transitions (vert), snaps onto and grinds rails, stops at walls, and bails on bad
landings, reporting Aether Board-style physics events (`PhysEvent` from `@lawn/trickboard`) that the combo scorer
consumes unchanged. Riding on the ground and flying reuse the winter slide rider (`stepSlide`).

## Read first
- `games/gnome-theft-auto/src/skate/types.ts`: `SKATE` (all tuning), `SkateGround`, `SkateRail`, `SkateInput`,
  `BoardMode`, `BoardState`, `SkateEvent`.
- `games/gnome-theft-auto/src/winter/slideRider.ts` (all: `newSlide`, `stepSlide`, `slideSpeed`; grounded and air
  integration, lips, landings) and `winter/types.ts` lines 14-100 (`SlideGround`, `SlideInput`, `SlideState`,
  `SlideEvent`, `SlideTuning`).
- `packages/trickboard/src/tables.ts`: `BoardTrick`, `BOARD_TRICKS` (`dur`), `AIR_GESTURES` (zone -> trick),
  `zoneOf(stick)`, `GrabKind`, `GRABS`, `grabFor(1, stick)`, `GrindKind`, `grindFor(stick)`, `PhysEvent` (the exact
  event shapes), `Mode`.
- `packages/trickboard/src/tricks.ts` `createCombo` (which events score what: e.g. `pop` with trick 'ollie' adds
  "Ollie", `trickDone` adds the trick, `land` adds spins, `grindStart/End` add grinds, `bail` loses the combo).
- `games/aether-board/src/physics.ts` lines 197-330 (how Aether judges a landing and a grind snap: a reference for
  feel, not to copy wholesale).

## Change
`src/skate/board.ts`:
```ts
export function newBoard(x: number, z: number, yaw: number, ground: SkateGround): BoardState;
/** Advance dt seconds (sub-steps of SKATE.maxStep). Returns the events of this call in order. */
export function stepBoard(b: BoardState, inp: SkateInput, ground: SkateGround, dt: number): SkateEvent[];
export function boardSpeed(b: BoardState): number;   // horizontal m/s
/** The SlideTuning the board uses (from SKATE), exported for tests. */
export function skateTuning(): SlideTuning;
```
Rules (all numbers from `SKATE`; edge inputs only act on the first sub-step):
- **Ground and air** run through `stepSlide` on a `SlideState` you keep in sync with `b` (copy in, step, copy out),
  with a `SlideGround` adapter: `height` = `ground.height`, `surface` = 'snow' when `ground.paved(x, z)` else 'other';
  tuning: gravity, muSnow = muIce = muPaved, muOther = muRough, drag, carve, carveSpeed, grip, brakeMu, pushAccel,
  pushMax, jumpV = ollieV, airSpin, bounce 0, maxSpeed, maxStep, probe, normalRate, crashSpeed 99 (bails are ours).
  Push: `inp.push`; emit `{ e: 'push' }` when push goes from 0 to > 0.3 on the ground.
- **Ollie**: `inp.ollie` on the ground -> pass `jump` to stepSlide (or set vy = ollieV yourself), mode 'air', emit
  `{ e: 'takeoff', speed, ollie: true }` then `{ e: 'pop', trick: 'ollie' }`. Leaving the ground any other way (a lip,
  a kicker) emits `{ e: 'takeoff', speed, ollie: false }`.
- **Vert**: when leaving the ground while the surface gradient under the board is steeper than `vertGradient` and the
  board moves uphill, move the uphill horizontal speed into vy (keep the sideways part), so the board rises straight up
  out of a transition and falls back onto it instead of flying onto the deck.
- **Walls**: on the ground, if the surface ahead (at the next sub-step's position) is more than `stepUp` above the
  board, it is a wall: do not move into it; kill the velocity component into it (keep the sideways part), emit
  `{ e: 'wall', speed }`; above `bailWallSpeed` also bail (reason 'wall').
- **Air**: `airT` and `spin` (signed degrees, from the yaw change) count up. `inp.flip` with no trick running: trick =
  `AIR_GESTURES` entry for `zoneOf(inp.stick)` (centre or no match: 'kickflip'); emit `{ e: 'pop', trick }`; when its
  clock reaches `BOARD_TRICKS[trick].dur` emit `{ e: 'trickDone', trick }`. `inp.grab` held: start a grab
  (`grabFor(1, inp.stick)`, `{ e: 'grabStart', kind: 1, name }`), end it on release or landing (`grabEnd` with `t`).
- **Landing** (stepSlide's 'landed'): bail (`{ e: 'bail', reason }`) when a board trick is still running ('trick'),
  when the angle between the heading and the travel direction is more than `landYawTol` from both 0 and pi
  ('sideways'), or when a grab is still held ('grab'); else emit `{ e: 'land', perfect, spin, flips: 0, airT, impact,
  switchLand }` with spin rounded to the nearest 180 (signed), switchLand when landing backwards (flip
  `switchStance` and turn the heading to the travel direction), perfect when the angle is within 0.15 rad.
- **Grind**: in the air, falling (vy < 0), speed >= `railMinSpeed`, within `railReach` horizontally of a rail segment
  and with the board between the rail's y and `railAbove` above it: snap to the rail, mode 'grind', direction along the
  rail by the velocity's sign, kind `grindFor(inp.stick)`, emit `{ e: 'grindStart', rail, ley: false, spin, kind }`
  (spin rounded to 180s). Remember whether the snap was within `fullRailEnd` of an end. While grinding: move along
  the rail at `grind.speed` (minus `grindFriction` per second, plus gravity along a sloped rail, never below
  `grindMinSpeed`), y on the rail, yaw along it (or across for slides; keep it simple: along). `inp.ollie` hops off
  (vy = `railHopV`, `takeoff`), running off the end flies on with the rail's velocity. Leaving emits `{ e: 'grindEnd',
  t, ley: false, kind }`, and `{ e: 'fullRail', rail }` when it started near one end and left within `fullRailEnd` of
  the other end.
- **Bail**: mode 'bail', `bailT = SKATE.bailS`, velocity kept for the runtime to throw the rider; while `bailT > 0`
  the board only slows to a stop; then mode 'ground'. `b.t` always counts up.
- Keep allocations out of the per-step path where easy (reuse the adapter and slide state).

`src/skate/board.test.ts` with small synthetic grounds (flat paved, flat rough, a step, a steep quarter-pipe
`h = max(0, (x - 5))^2 * 0.4` capped at 2.5, one straight rail), dt 1/60:
- pushing on flat paved reaches between 0.8*pushMax and pushMax in 4 s and never beyond maxSpeed; rough ground stops a
  6 m/s board within 3 s with no push;
- an ollie from 4 m/s reaches an apex 0.6..0.9 m above the ground and lands with a 'land' event; events in order
  takeoff, pop(ollie), land;
- a flip right after the ollie gives pop(kickflip) then trickDone(kickflip) before landing (kickflip dur must fit in
  the air time; if it does not, flip at the apex of a kicker launch instead) and lands; a flip just before touching
  down bails with reason 'trick';
- riding at 6 m/s into a 0.4 m step stops (speed < 0.5 afterwards), emits 'wall', no bail; at 9 m/s it bails;
- riding up the steep quarter-pipe at 9 m/s goes airborne and lands back with x below the launch x + 0.5;
- an ollie onto the rail from beside one end grinds (grindStart), and riding to the far end emits grindEnd and fullRail.

## Contract
The four exports above, exactly (skate/runtime.ts calls them); events exactly the `SkateEvent` shapes.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/skate/board.test.ts src/winter/slideRider.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
`winter/slideRider.ts` (use it, do not change it; if it truly cannot do something, write that part in board.ts),
`skate/types.ts` (report a wrong number, do not edit), `packages/trickboard`.

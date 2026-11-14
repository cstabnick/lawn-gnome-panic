~~~~text
Epic: 2 Systems and the golf and bowling slices
Depends on: none

## Goal
Gnome Bowling surfaces its party slice "Bowl Frame": one frame of ten-pin, four of bowling's own lanes side by side, every gnome bowling at the same time with bowling's own physics and CPU bowlers. Most pins wins. Bowling is refactored once so this works, and `#minigame` plays it inside Gnome Bowling.

## Read first
- packages/party/src/types.ts: the contract; packages/party/template/minigame.ts: a working slice to copy the structure from
- games/gnome-bowling/src/physics.ts: simulateThrow(input: ThrowInput, standing: readonly boolean[]) → SimResult { sampleDt, ball: BallSample[],
  pins: PinSample[][], duration, down: boolean[], gutter }  (pure and deterministic)
- games/gnome-bowling/src/npc.ts: npcThrow(profile, standing, rand) → ThrowInput, NPCS, NPC_ORDER  (searches with the real physics: slow, call it once per ball)
- games/gnome-bowling/src/lane.ts: createLane(ctx) at line ~113 (builds the lane meshes, plus a crowd at ~287)
- games/gnome-bowling/src/pins.ts: createPins(ctx) at line ~72 (pin geometry/materials, then pins; poseFromSample(g, s) at ~178)
- games/gnome-bowling/src/config.ts: ThrowInput { x, aim, speed, spin }, THROW (xRange 0.45, aimRange 0.05, speedMin 3.5, speedMax 10), LANE, PIN, LOOK_COLORS

## Change (you own games/gnome-bowling; nobody else edits it)
- src/lane.ts (one-time refactor): extract the lane building (materials, lane, gutters, approach, pin deck, pit; not the crowd,
  not anything reading ctx.state) into `export function buildLaneMeshes(): THREE.Group` (lane at x = 0 like today), used by createLane.
- src/pins.ts (one-time refactor): extract `export function buildPinModel(): THREE.Group` (one pin, the current geometry/material/hat/eyes)
  and move poseFromSample to a top-level `export function poseFromSample(g: THREE.Group, s: PinSample): void`; createPins uses both.
  The base game must look and play exactly as before.
- **Entry split (so the slice runs with none of the base game's side effects):** `git mv src/main.ts src/app.ts`; delete the
  `import { loadMyGnome } ...` line and the `await loadMyGnome();` line (with its comment) from app.ts and change nothing else in it; a new
  src/main.ts holds exactly:
  ```ts
  // Entry: the full game, or (#minigame) this game's Gnome Party slice played alone against 3 CPUs.
  import { loadMyGnome } from '@lawn/gnome';
  await loadMyGnome();
  if (/[#&]minigame\b/.test(location.hash)) (await import('./minigames/play')).playOwnSlice();
  else await import('./app');
  ```
- src/minigames/play.ts: `export function playOwnSlice(): void`: picks the slice named by `#minigame=<id>` or else the first of `minigames`, and calls
  `playMinigame(def, { canvas: document.getElementById('game') as HTMLCanvasElement, ui: document.getElementById('ui') as HTMLElement })`
  from '@lawn/party' (that function may still be a stub while you work; it is fine).
- src/minigames/index.ts: `import type { AnyMinigame } from '@lawn/party'; import def from './<id>'; export const minigames: AnyMinigame[] = [def];`
- src/minigames/minigames.test.ts: `import { testMinigame } from '@lawn/party/testkit'; import { minigames } from '.'; for (const m of minigames) testMinigame(m);`
  plus the slice-specific tests under Done when.
- package.json: add `"@lawn/party": "*"` to dependencies; add `"vitest": "5.1.0"` to devDependencies and `"test": "vitest run"` to scripts if missing.
  Then run `npm install` at the repo root once (links the workspace).
- src/minigames/bowl-frame.ts: `export default` the MinigameDef. meta: { id: 'bowl-frame', title: 'Bowl Frame', game: 'gnome-bowling',
  goal: 'Knock down the most pins in one frame.', controls: 'Drag sideways to line up, then swipe up to bowl (keys: ←/→ move, hold Space, release to bowl).',
  maxSeconds: 45 }.

## Slice rules (packages/party/README.md)
- Build the slice from this game's own modules. Where one is tangled in `Ctx`, refactor it ONCE so the base game and the slice call the
  same function. Never copy game code into the slice. The base game must look and play exactly as before.
- Modules the slice imports must not touch DOM/window/location at import time (checked: config, course, physics, obstacles, trees,
  round in golf; config, physics, npc, scoring in bowling are clean).
- init/step/cpu/result are pure and use the rng argument. State S and input I are plain JSON, S under 2 KB: store a shot's INPUTS and
  start time, and replay the deterministic simulation in the view; never put sample arrays or THREE objects in S.
- Input is a level sampled 15 times a second online: one-off actions are a counter (shots) that the view increments; step acts when it
  grows past lastShots (kept in S).
- The view adds its own sky, fog and lights to ctx.scene; overlay text only inside ctx.ui; gnomes via createGnomeModel(seat.look) from
  '@lawn/gnome'. Smooth what moves.

## Design
- Lanes: seat k's lane is the same lane in its own coordinates, shown at x offset (k - 1.5) * 2.4 in the view. The sim never needs the offset.
- State: { t: number, lanes: { standing: boolean[] /* 10 */, ball: 0 | 1 | 2, first: number, total: number, strike: boolean, spare: boolean,
  lastShots: number, readyAt: number, doneAt: number, x: number,
  flight: { input: ThrowInput, t0: number, dur: number, down: boolean[] } | null }[] }.
- Input: { x: number, aim: number, speed: number, spin: number, shots: number } (clamped to THROW ranges in step).
- step: t += dt. Lane not done (ball < 2), no flight, t ≥ readyAt: lane.x = input.x; if input.shots > lastShots: lastShots = shots,
  r = simulateThrow(input, standing), flight = { input, t0: t, dur: r.duration, down: r.down }. When t ≥ t0 + dur + 0.6: pins knocked
  = count of down; standing[p] = standing[p] && !down[p]; ball 1: first = knocked, strike = knocked === 10 (then ball = 2);
  ball 2: spare = first + knocked === 10; total += knocked; ball += 1; flight = null; readyAt = t + 0.8; ball === 2 → doneAt = t.
- result: all lanes done, or timeUp → places by total (more is better), then strike beats spare beats neither, then earlier doneAt. Equal keys share.
- cpu(s, seat, rng): only when the lane is ready (no flight, ball < 2) and t is within one step after readyAt + 0.7
  (readyAt + 0.7 ≤ t < readyAt + 0.7 + 1/60): return { ...npcThrow(NPCS[NPC_ORDER[seat]], standing, rng), shots: lastShots + 1 }.
  Otherwise return { x: lane.x, aim: 0, speed: THROW.speedMin, spin: 0, shots: lastShots } (no throw). This runs npcThrow once per ball.
- View: buildLaneMeshes() four times at the offsets; ten buildPinModel() per lane. Replay a flight: compute simulateThrow(flight.input,
  standing-before) once per flight (cache by t0) and pose the ball and pins from samples at floor((t - t0) / sampleDt) with poseFromSample;
  outside a flight, standing pins upright at PIN_SPOTS, fallen ones hidden. Ball: sphere in the seat colour. A gnome per seat
  (createGnomeModel(seat.look)) behind the foul line at lane.x. Lights as in the base game's main/app; dark background (LOOK_COLORS.background).
  Camera: behind and above my lane (watching: the middle) looking down the lane; others' lanes visible beside it. ctx.ui: each lane's total
  and "STRIKE!" / "SPARE!" when it happens.
  Input: drag sideways while held moves x (1 m per 300 px, clamped); release with an upward swipe faster than 500 px/s throws: speed maps
  500..2500 px/s to speedMin..speedMax, aim from the swipe's sideways slant clamped to ±aimRange, spin 0. Keys: pad.x moves x at 0.4 m/s;
  hold pad.a to charge speed over 1 s, release throws.

## Done when
- `npx tsc --noEmit -p games/gnome-bowling` passes.
- `npm test -w games/gnome-bowling` passes: the existing tests, testMinigame (4 CPUs, 5 seeds; must finish inside 45 s), and tests that a
  strike ends that lane after one ball, a gutter ball (x = THROW.xRange, aim = THROW.aimRange) scores 0, a shots counter that does not grow
  causes no throw, and npcThrow is called at most twice per lane in a full run (count it with vi.spyOn or a wrapper).
- `npm run build -w games/gnome-bowling` passes (writes only games/gnome-bowling/dist).
- Base game unchanged: app.ts differs from the old main.ts only by the two removed lines; createLane and createPins still build the same scene.

## Out of scope
Every file outside games/gnome-bowling. Bowling's menu, net, HUD, controls, announcer and cartoons are not used by the slice.
~~~~

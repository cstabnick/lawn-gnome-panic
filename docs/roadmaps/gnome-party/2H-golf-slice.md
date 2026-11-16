~~~~text
Epic: 2 Systems and the golf and bowling slices
Depends on: none

## Goal
Gnome Golf surfaces its party slice "Golf Hole": one random par 3 of its own island, all four gnomes playing at the same time with golf's own shot physics, course and look. Fewest strokes wins. Golf is refactored once so this works, and `#minigame` plays it inside Gnome Golf. Future golf changes (physics, course, look) reach party mode by themselves.

## Read first
- packages/party/src/types.ts: the contract (MinigameDef, MinigameView, ViewCtx, PadState, SeatInfo)
- packages/party/template/minigame.ts: a working slice; copy its structure
- games/gnome-golf/src/world.ts: createWorld(ctx) at line ~173; ctx is used only for scene, renderer (anisotropy, max texture size),
  state.time and state.wind.yaw (in update)
- games/gnome-golf/src/physics.ts: simulateShot(start, shot, lie, wind, pin) → ShotResult { points, sampleDt, duration, end, endLie, holed, ... },
  estimateCarry(club, lie, power)
- games/gnome-golf/src/config.ts: HOLES (HoleDef: par, tee, pin, green), Shot { club, power 0..SWING.maxPower, accuracy -1..1, yaw }, Wind,
  Lie, CLUB_ORDER, PHYS.ballRadius, LOOK (sky, fog); and round.ts: seededWind(seed, hole), yawTo(x, z, tx, tz)

## Change (you own games/gnome-golf; nobody else edits it)
- src/world.ts (the one-time refactor): move the body of createWorld into
  `export function buildCourse(scene: THREE.Scene, renderer: THREE.WebGLRenderer): { update(dt: number, time: number, windYaw: number): void }`
  (ctx.renderer → renderer, state.time → time, state.wind.yaw → windYaw), and make createWorld
  `const c = buildCourse(ctx.scene, ctx.renderer); return { update: (dt) => c.update(dt, ctx.state.time, ctx.state.wind.yaw) };`.
  Behaviour of the base game must not change.
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
  Do NOT run `npm install` (other workers run at the same time; `@lawn/party` already resolves from the root node_modules, and the planner updates the lockfile).
- src/minigames/golf-hole.ts: `export default` the MinigameDef. meta: { id: 'golf-hole', title: 'Golf Hole', game: 'gnome-golf',
  goal: 'Sink it in the fewest strokes on one par 3.', controls: 'Turn with ←/→ or drag sideways; hold Space or press and hold, release to swing.',
  maxSeconds: 75 }.

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
- init: hole = a random par-3 index of HOLES (rng); wind = seededWind(seed from rng, hole index). Four balls at the tee, spread 1.5 yd
  apart across the line to the pin. setCarts([]) from obstacles.ts (no carts in the slice).
- State: { hole: number, wind: Wind, t: number, balls: { x, z, lie: Lie, strokes: number, holed: boolean, holedAt: number,
  lastShots: number, restT: number, flight: { sx, sz, club, power, accuracy, yaw, lie, t0, dur, ex, ez, endLie, holed } | null }[] }.
- Input: { yaw: number, power: number /* 0..1 */, shots: number }.
- Club: auto. Lie 'green' → 'PT'; else the shortest-carry club in CLUB_ORDER (excluding PT) whose estimateCarry(club, lie, 1) ≥ distance
  to the pin, or the longest (DR) if none.
- step: t += dt. A ball at rest (flight null), not holed, strokes < par + 3, with input.shots > lastShots: lastShots = shots;
  accuracy = (rng() - 0.5) * 0.3; r = simulateShot(new THREE.Vector3(x, heightAt(x, z), z), { club, power: input.power, accuracy, yaw: input.yaw },
  lie, wind, hole.pin); strokes += 1; flight = { ..., t0: t, dur: r.duration, ex: r.end.x, ez: r.end.z, endLie: r.endLie, holed: r.holed }.
  When t ≥ t0 + dur: endLie 'water' → +1 stroke, ball stays at sx/sz; else x/z = ex/ez, lie = endLie; holed → holed, holedAt = t.
  flight = null, restT = 0. restT counts time at rest.
- result: every ball holed or out of strokes, or timeUp → places: holed first by strokes then holedAt; others by distance to the pin.
  Equal keys share.
- cpu: when at rest and restT > 1.2: yaw = yawTo(x, z, pin.x, pin.z) + (rng() - 0.5) * 0.08; power = the club's power for the distance
  (search power in 0.3..1 by estimateCarry(club, lie, power), or distance-proportional for PT) times (1 + (rng() - 0.5) * 0.12);
  shots = lastShots + 1. Otherwise the same shots value.
- View: buildCourse(ctx.scene, ctx.renderer) (call its update each frame with t and wind.yaw); sky colour and fog from LOOK; a hemisphere
  light and a sun with shadows near the hole (as main.ts / app.ts sets them). Balls: white spheres of PHYS.ballRadius scaled up 3x,
  with a tall thin beam and ground ring in the seat colour. During a flight, replay it: compute simulateShot once per new flight
  (same args as the host; cache by t0) and place the ball at points[floor((t - t0) / sampleDt)]. A gnome per seat
  (createGnomeModel(seat.look)) standing 1 yd behind its ball facing the shot yaw.
  Camera: behind my ball (or, watching, the ball farthest from the pin) 8 yd back and 4 yd up, looking past the ball toward the pin;
  lerp it. Input: yaw starts at the line to the pin each time my ball comes to rest; pad.x turns it at 0.8 rad/s; pointer drag
  sideways turns it too. Power: while pad.a is held it rises 0→1 over 1.4 s and falls back (ping-pong); on release, shots += 1 with that
  power. Draw a power bar and "Stroke N · club" in ctx.ui, and my aim as a dotted line along the yaw.

## Done when
- `npx tsc --noEmit -p games/gnome-golf` passes.
- `npm test -w games/gnome-golf` passes: testMinigame (4 CPUs, 5 seeds) plus tests that a full-power shot from the tee of a par 3 with
  a correct club and yaw lands within 30 yd of the pin, a shots counter that does not grow causes no shot, a water ball keeps its spot
  with a penalty stroke, and the state stays under 2 KB mid-flight.
- `npm run build -w games/gnome-golf` passes (writes only games/gnome-golf/dist).
- The base game is unchanged: diff app.ts against the old main.ts shows only the two removed lines.

## Out of scope
Every file outside games/gnome-golf. Golf's own online, lobby, HUD and controls are not used by the slice; do not refactor them.
~~~~

Epic: E15-A (Hedgeworth Links, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E15/issues/_env.md` first (environment, rules).

## Goal
`games/gnome-theft-auto/src/golf/round.ts` plays a round of Hedgeworth golf as pure state (no three.js, no DOM): address
the ball, aim, pick a club, the three-tap swing meter, the ball flight from `@lawn/golf`, lies, water penalties, holing
out with par names, the next hole, the scorecard. The runtime (another worker) calls these functions and turns the
returned events into sounds, achievements and saves.

## Read first
- `games/gnome-theft-auto/src/golf/types.ts`: `RoundState`, `RoundPhase`, `RoundEvent`, `HudView`, `CardView`, `HOLES`,
  `MAX_WIND`, `MAX_STROKES`, `COURSE_PAR`, `POND_NAME`.
- `games/gnome-theft-auto/src/golf/course.ts`: `golfEnv`, `golfStart`, `golfToWorld`, `lieAtWorld`, `yardsBetween`, `HOLES_YD`.
- `games/gnome-theft-auto/src/golf/round.ts`: the stub you replace (keep every exported signature).
- `packages/golf/src/swing.ts`, `scoring.ts`, `physics.ts` (exports only), `tuning.ts` (`CLUBS`, `CLUB_ORDER`, `LIES`, `SWING`).
- `games/gnome-golf/src/round.ts` lines 40-80 (`defaultAim`, `clubFor`, `defaultClub`) and 406-470 (`finishFlight`,
  `nextHole`, `roundTotals`): the original game's rules to copy in spirit.

## Change
`src/golf/round.ts` (replace the stub, same exports):
- `newRound(seed, hole = 0)`: scores all null, `startHole(s, hole)`, `birdieRun` 0.
- `startHole(s, hole)`: ball on that hole's tee, lie 'tee', strokes 0, phase 'walk', wind =
  `seededWindFrom(s.seed, hole, MAX_WIND)`, aim straight at the first path corner after the tee (or the pin),
  club = `defaultClub('tee', yards to that point)`, swing idle, flight null, banner `Hole ${number}: ${name} · Par ${par}`
  with bannerT 3.
- `addressBall(s)`: 'walk' -> 'aim' (only from 'walk'); re-pick club with `defaultClub(s.lie, pinYards(s))` and aim at
  the pin. `leaveBall(s)`: 'aim' -> 'walk' (not while swinging or in flight).
- `setAim(s, yaw)`; `turnAim(s, dir, dt)`: dir +1 turns left (yaw increases), -1 right; rate 0.9 rad/s, 0.35 rad/s with
  the putter; only in 'aim'. `cycleClub(s, delta)`: step through `CLUB_ORDER` (clamped, no wrap), only in 'aim'.
- `defaultClub(lie, yards)`: 'PT' on the green; otherwise the shortest club in `CLUB_ORDER` (excluding PT) whose
  `estimateCarry(club, lie, 1)` reaches `yards`, else 'DR'; never 'DR' unless the lie is 'tee' (use '3W' instead).
- `tapSwing(s)`: in 'aim' with the swing idle: `swingTap` -> phase 'swing', event `swing-start`. In 'swing': `swingTap`;
  on `{ kind: 'fire' }` take the shot: `strokes += 1`, `simulateShot(golfEnv(), golfStart(ball), { club, power, accuracy, yaw: aimYaw }, lie, wind, pinGolf)`
  (pinGolf = the hole's pin in the golf frame: `HOLES_YD[s.hole].pin`), `flight = { result, t: 0, from: { ...ball } }`,
  phase 'flight', event `shot`. Elsewhere returns [].
- `tickRound(s, dt)`: `bannerT -= dt`. In 'swing': `swingStep(s.swing, dt, s.club)` and fire as above when it returns
  fire. In 'flight': advance `t`; emit `bounce` events for the result's 'bounce' events as `t` passes them (once each);
  when `t >= result.duration` finish: holed -> score the hole (below); water -> `restingSpot(from, result)` puts the
  ball back, `strokes += 1` (penalty), event `water` with `mower: seaMowerCatch(result)`, banner `A pond mower got it! +1, hit it again`
  or `Splash in ${POND_NAME}! +1, hit it again`; otherwise ball = world point of `result.end` (`golfToWorld`),
  lie = `lieAtWorld` (water never: a ball that rests in water is treated as water above), banner
  `${LIES[lie].name} · ${Math.round(result.total)} yd`, event `rest`. Then phase 'walk' (the player walks to the ball).
  If `strokes >= MAX_STROKES` without holing: pick up (scores[hole] = MAX_STROKES, banner 'Picked up', event
  `picked-up`, phase 'holed').
- Scoring a hole: `scores[hole] = strokes`, banner = `scoreName(strokes, par)`, phase 'holed', event `holed`
  (`name` = that banner); `birdieRun` = birdieRun + 1 when strokes <= par - 1, else 0.
- `nextHole(s)`: from 'holed': if every hole has a score -> phase 'done', event `round-done` with total and toPar
  (total - COURSE_PAR); else `startHole` on the next hole index without a score (wrap round, so a round started on
  hole 3 goes 3, 4, 1, 2... index order 2, 3, 0, 1).
- `totals(s)`: strokes summed over scored holes, toPar = that minus their pars, played = count.
- `ballWorld(s)`: in 'flight', the flight sample at `t` interpolated linearly between `result.points` (spacing
  `result.sampleDt`) and converted with `golfToWorld`; otherwise the ball at rest on the ground (`courseGroundY` from
  course.ts + 0.04 m).
- `pinYards(s)`: `yardsBetween(ball, hole.pin)`.
- `hudView(s, atBall)`: every field of `HudView` (clubName = `CLUBS[club].name`, clubYards = `estimateCarry(club, lie)`
  rounded, lieName = `LIES[lie].name`, windRel = wind.yaw - aimYaw wrapped to -PI..PI (0 = blowing the way you aim),
  meter = `s.swing` in 'swing' else null, banner = `s.banner` while bannerT > 0 else null, toPar from `totals`).
- `cardView(s, best)`: one row per hole in index order (number, name, par, strokes = scores[i], best = best[i]),
  total and toPar from `totals`, final = phase 'done'.

New `src/golf/round.test.ts`:
- a new round on hole 0 starts on the tee in 'walk' with a seeded wind within MAX_WIND (same seed, same wind);
- address -> tap -> step until the power marker reaches 1 -> tap -> step until the marker is at 0 -> tap fires a near
  perfect shot (assert phase 'flight', strokes 1); tick until not 'flight'; the ball moved toward the pin by roughly the
  club's carry (within 25%);
- a ball dropped beside the pin on the green (set `s.ball`, `s.lie = 'green'`, aim at the pin, club 'PT') with a putt of
  the right power holes out (find the power with `powerFor('PT', 'green', yards)` and set the swing state directly
  before firing, or call the package directly through `tapSwing` with a prepared `s.swing = { stage: 'accuracy', marker: 0, power }`);
  the hole scores and `scoreName` banner is set;
- a shot into Hosepipe Pond (hole 3, ball placed 40 m before the pond, aimed at its centre, a club that lands in it)
  ends with the ball back where it was struck from and strokes += 2 (the shot and the penalty);
- `nextHole` after the last unscored hole gives `round-done` with the right total.

## Contract
Exactly the exported signatures of the stub (the runtime, the view and the HUD call them). Pure: no three.js, no DOM,
no Math.random (the wind comes from the seed).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/golf/round.test.ts src/golf/course.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/golf/round.ts` / `round.test.ts`.

## Out of scope
Every other file (types.ts and course.ts belong to the lead).

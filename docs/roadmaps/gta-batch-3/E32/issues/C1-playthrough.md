Epic: E32-C (proof)
Depends on: Epic B (the maze collision and the shed tee must be in) · Worker: sonnet (general-purpose)

First read `docs/roadmaps/gta-batch-3/E32/issues/_env.md`.

## Goal
A scripted test proves every one of the nine holes is completable within sensible strokes: a simple golfer bot plays a
full round through the pure round API, in card order, with a few fixed seeds.

## Read first
- `games/gnome-theft-auto/src/golf/round.ts`: `newRound(seed, hole)`, `addressBall`, `setAim`, `playShot(s, power,
  accuracy)` (fires from 'aim' without the meter), `tickRound(s, dt)`, `nextHole`, `totals`, `cycleClub`/`defaultClub`,
  `pinYards`; phases 'walk' → 'aim' → 'flight' → 'walk' | 'holed' → (nextHole) → 'done'.
- `games/gnome-theft-auto/src/golf/round.test.ts` (how the existing tests drive a round).
- `games/gnome-theft-auto/src/golf/course.ts` (`golfEnv`, `golfStart`, `lieAtWorld`, `HOLES_YD`), `types.ts`
  (`HOLES`, `HOLE_ORDER`, `MAX_STROKES`, `MAZE_HEDGES`, `distToLine`).
- `packages/golf/src/physics.ts`: `previewShot(env, start, club, lie, yaw, pin)` (calm full-power landing),
  `powerFor(club, lie, yards)`, `estimateCarry`, `CLUB_ORDER`, `CLUBS`.

## Change
- New `games/gnome-theft-auto/src/golf/nine.test.ts` (only this file):
  - A bot `playHole(s)` per shot: target = the next point of the hole's `path` not yet passed (a dogleg corner, then
    the pin), or the pin when within reach of the longest club from this lie. Pick the club with `defaultClub`-like
    logic, power with `powerFor`, accuracy 0 (perfect), aim at the target with `setAim` after `addressBall`. Before
    firing, check the shot with `previewShot` (or `simulateShot` with zero wind) against `golfEnv()`; if it ends in
    water or stops against a maze hedge well short, try a few alternatives (shorter club to lay up, a lofted wedge over
    the hedge, aim offsets of ±0.15 rad) and take the one ending nearest the pin by path distance. Putting: aim at the
    pin with power from `powerFor('PT', 'green', yards)` (accuracy 0).
  - Tick with `tickRound(s, 0.05)` until the phase leaves 'flight'. After 'holed', call `nextHole`.
  - Play full rounds for seeds 1, 2, 3 (wind is seeded per hole, max 8 mph). Assert for every hole: holed (not picked
    up: strokes < MAX_STROKES) and strokes ≤ par + 3; the round total ≤ COURSE_PAR + 12; the order the holes were
    played equals HOLE_ORDER. Log a per-hole score table with `console.log` for the report.
  - Separate checks: hole 7's first shot starts from the roof (the ball's golf start height is ≥ 2.5 m / YD over a
    point 10 m east of the shed); a 'trunk' bounce event happens on hole 5 for at least one deliberately low shot into
    the first maze wall (driver aimed at (-1318, 870) from the tee).
  - If a hole is not completable by a sane bot, do NOT loosen the assertion: report which hole, where the ball ends
    and why (a hedge, the water, a slope) so the lead can fix the hole data.
- Keep the test under ~20 s (cache previews if needed).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/golf/nine.test.ts` passes, and your report includes the per-hole
  score table for each seed.

## Out of scope
Every other file. Report problems instead of editing hole data.

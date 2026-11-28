Epic: A (foundations) — E26 street racing
Depends on: none
Agent: Sonnet (rival AI tuning)

(Paste `_env.md` here.)

## Goal
Race rivals cope with street routes: they steer round and brake for vehicles ahead (traffic, other racers, the
player), never get stuck behind a stopped car for long, and still make good progress; dirt and Speedway racing are
unchanged.

## Read first
- `games/gnome-theft-auto/src/raceTrack/raceAi.ts`: Rival, RivalCtx, driveRival (aim point `track.frame(s + ahead,
  def.line + weave)`, cornerSpeed, rubber band, stuck detection → backOnLine).
- `games/gnome-theft-auto/src/raceTrack/raceAi.test.ts`: the dirt-track progress test pattern (bigWorld, 60 s at 60 fps).
- `games/gnome-theft-auto/src/npcChassis.ts`: `stepNpcCar(v, { throttle, steer, lift }, dt, world)`.
- `games/gnome-theft-auto/src/raceTrack/tracks.ts`: `STREET_TRACK_IDS`, `isStreetTrack`, `TRACKS`.
- `games/gnome-theft-auto/src/types.ts`: `Vehicle` (x, z, yaw, speed, spec.maxSpeed, driver, exploded), `World`.

## Change (only `src/raceTrack/raceAi.ts` and `src/raceTrack/raceAi.test.ts`)
- `RivalCtx` gains an optional field `others?: readonly Vehicle[]` (vehicles to avoid: the caller passes the game's
  `vehicles` list; leaving it out keeps today's behaviour). Do not rename or remove existing fields/exports.
- In `driveRival`, when `ctx.others` is given: look for the nearest vehicle (not `r.v`, not exploded) in a corridor
  ahead: forward distance 0..(8 + speed * 1.2) m along the rival's heading and within 2.2 m sideways of the rival's
  intended path. If found: (a) shift the lateral aim away from it (to the other side of the centre line, at most
  `track.def.barrierOffset - 1.5` from the centre) smoothly over ~0.5 s, and (b) cap the target speed to the other
  vehicle's speed along our heading + 2 m/s when the gap is under 10 m. Keep the shift for at least 1 s once chosen
  so it does not flip each frame.
- On street routes (`isStreetTrack(track.id)`), `backOnLine` must not drop the rival onto another vehicle: if a
  vehicle is within 4 m of the target point, use the target 12 m further along the line (try 3 times).
- Stuck detection: on street routes also put the rival back when its speed stayed below 1.5 m/s for 4 s while not
  holding (not only when it moved < 0.5 m in 2.5 s).
- Tests (`raceAi.test.ts`): keep the existing ones passing. Add: (1) for each id in STREET_TRACK_IDS, a rival makes
  > 150 m of progress in 60 s and stays near the line ≥ 85% of frames (use the same bigWorld trick; the street routes
  are placeholders now and are replaced by real ones later, so do not tune to their exact shape); (2) a stopped car
  placed 30 m ahead on the centre line of `kerb-row-circuit` is passed (rival's `dist` beyond it within 20 s) without
  the rival's car overlapping it by more than 1 m at any frame (`ctx.others = [stopped]`).

## Contract
Exports unchanged (`Rival`, `RivalCtx` (+ optional `others`), `spawnRival`, `resetRival`, `driveRival`,
`removeRival`). The caller (quests/objectivesRace.ts) will pass `others: deps.vehicles` later; do not edit it.

## Done when
- `npx vitest run src/raceTrack/raceAi.test.ts src/raceTrack/track.test.ts` passes; `npx tsc --noEmit -p .` passes.
- Report progress numbers per street track.

## Out of scope
`quests/objectivesRace.ts`, `raceTrack/defs/*`, `raceTrack/tracks.ts`, `npcChassis.ts`.

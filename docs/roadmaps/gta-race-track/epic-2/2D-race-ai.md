Epic: 2 Parts
Depends on: none

## Environment
Read `docs/roadmaps/gta-race-track/_env.md` first (it lists the track API you use).

## Goal
`games/gnome-theft-auto/src/raceTrack/raceAi.ts` drives rival racers round the Lost & Found Speedway: each rival is an
arcade vehicle with a driver gnome that follows the lap at its own pace, line and nerve, slows for corners ahead,
recovers when stuck, and keeps a race distance so the race can rank everyone.

## Read first
- `games/gnome-theft-auto/src/raceTrack/raceAi.ts` (the stub: keep every exported name and signature)
- `games/gnome-theft-auto/src/raceTrack/track.ts`
- `games/gnome-theft-auto/src/quests/types.ts`, search `interface RaceRival` (the rival's personality fields)
- `games/gnome-theft-auto/src/quests/objectivesDrive.ts` lines 70-85 (`steerToward`) and 251-375 (`chaseFollowRun`):
  how a quest leader vehicle is created, given a rider gnome (`makeGnome`, `gnomeState`), marked
  `driver = 'npc'; questOwned = true` (traffic then leaves it alone), steered with `stepVehicle` + `syncVehicleMesh`,
  and un-stuck. Copy those patterns; do not import from objectivesDrive.ts.
- `games/gnome-theft-auto/src/vehicles.ts` lines 224-230 (`createVehicle(scene, kind, x, z, yaw, tint?)`), 280-420
  (`stepVehicle(v, { throttle, steer, lift }, dt, world)`: throttle -1..1, steer -1..1 with +1 = turn right, i.e. yaw
  decreases; arcade speed rises at spec.accel up to spec.maxSpeed; throttle < 0 brakes at 2x accel), 142
  (`repairVehicle`), 686 (`removeVehicle(scene, v)`)

## Change
`games/gnome-theft-auto/src/raceTrack/raceAi.ts`, implementing the stub's four functions:
- `spawnRival(scene, vehicles, def, kind, slot)`: `createVehicle(scene, def.kind ?? kind, g.x, g.z, g.yaw, def.tint)`
  at `g = gridSlot(slot)`, rider gnome with look `{ ...randomTownLook(), ...def.look }` seated at `v.spec.seat`
  (as chaseFollowRun's attachRider), `driver = 'npc'`, `questOwned = true`, push to `vehicles`. Initial
  `hint = locate(g.x, g.z)!.i`, `dist = locate(...).s - trackLength()` (negative: behind the line), `finishedAt = null`.
- `resetRival(r, slot)`: repair, back to `gridSlot(slot)`, speed 0, `vy` 0, `hint`/`dist` as at spawn, `finishedAt = null`,
  re-seat the rider if missing, `syncVehicleMesh(v, 0)`.
- `driveRival(r, dt, world, ctx)`:
  - `ctx.hold`: speed 0, sync mesh, return.
  - Where am I: `spot = locate(v.x, v.z, 60, r.hint)`; update `r.hint = spot.i`; add the wrapped change of `spot.s`
    since last frame to `r.dist` (wrap into -L/2..L/2, clamp to +-40 per frame).
  - Aim: look ahead `6 + |v.speed| * 0.55` m: `t = trackFrame(spot.s + ahead, def.line + weave)` where `weave` is a
    slow sine (amplitude `0.8 + def.aggression * 1.2` m, period 7-11 s, seeded per rival) so the pack does not drive in
    single file. Steer = clamp(-angleDiff(atan2(t.x - v.x, t.z - v.z), v.yaw) * 2.4, -1, 1) (`angleDiff` from
    `src/collide.ts`; same sign convention as steerToward).
  - Speed target: the tightest corner within the next `20 + |v.speed| * 1.2` m: for each sample k ahead (step 2 m) take
    radius R = 1/max(|curv|, 1e-4) and `vCorner = sqrt(def.grip * 9.81 * R)`; allow braking distance:
    `vAllowed = sqrt(vCorner^2 + 2 * 9 * d)` (d = metres to that sample). `target = min(spec.maxSpeed * def.pace, vAllowed)`.
  - Rubber band: if the rival is more than 60 m ahead of `ctx.playerDist`, target *= 0.9; more than 60 m behind, *= 1.06
    (never above spec.maxSpeed * 1.06).
  - Mistakes: an aggressive rival occasionally (about once per lap per `aggression`) runs 10% too fast into a corner for
    2 s. Keep it deterministic per rival seed (no Math.random in the frame loop; use a seeded generator).
  - Throttle: `speed < target - 0.5` → 1; `speed > target + 1` → -0.6; else 0.3.
  - `stepVehicle(v, { throttle, steer, lift: 0 }, dt, world)` then `syncVehicleMesh(v, dt)`.
  - Off the track or stuck (moved < 0.5 m in 2.5 s while not holding, or `|spot.lat| > TRACK.barrierOffset + 3`, or
    `spot` null): put it back on the centre line at `trackFrame(r.dist mod L)` facing along the track, speed 5.
  - If `v.exploded` or `v.driver !== 'npc'` (stolen): repair, re-seat the rider, driver back to 'npc', put back on the
    track as above.
- `removeRival(scene, vehicles, r)`: remove from `vehicles`, `removeVehicle(scene, r.v)`.
- Add `games/gnome-theft-auto/src/raceTrack/raceAi.test.ts` (node vitest, like `src/terrainDrive.test.ts`: mock
  `./audio` / `../audio` with `vi.mock(..., () => ({ play: () => undefined }))`, set
  `globalThis.location ??= { search: '' }`, import modules with `await import`, and install the fake DOM with
  `installFakeDom()` from `src/testing/fakeDom` if building vehicles needs it). World:
  `{ boxes: [], half: 900, biomeAt: () => 'desert', airfield: AIRFIELD } as unknown as World` (AIRFIELD from config).
  Test: spawn one rival (`ride-on`, pace 0.95, grip 1, line 0, aggression 0.3) at slot 1, drive it 120 s at dt 1/60
  with `hold: false, playerDist: r.dist`, and assert it completed at least one full lap (`r.dist > 0` and it crossed
  1 full `trackLength()` more than its start), never ended more than `TRACK.barrierOffset` from the centre line for
  more than 1 s total, and log its lap time with console.log. Test timeout 60_000.

## Contract
The stub's exports (`Rival`, `RivalCtx`, `spawnRival`, `resetRival`, `driveRival`, `removeRival`), unchanged.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your files
- `npx vitest run src/raceTrack/raceAi.test.ts` (from `games/gnome-theft-auto`) passes

## Out of scope
Every other file (objectivesRace.ts, the race runner, is another worker's).

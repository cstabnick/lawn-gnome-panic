Epic: E18-A
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E18/issues/_env.md` first.

## Goal
Once the Dewdrop series is done, the player's Dewdrop waits by Hogweed's workshop, a replacement can be bought there
(the only place), and Hamster Hour unlocks after 60 s in a row inside the ball.

## Read first
- `src/dewdrop/runtime.ts` (stub; keep `installDewdrop(deps: JobsDeps): Dewdrop` and `Dewdrop { update(dt) }` exactly;
  app.ts already calls it).
- `src/dewdrop/config.ts`: `DEWDROP_KIND`, `DEWDROP_BAY {x,z,yaw}`, `DEWDROP_PRICE` 400, `DEWDROP_ACH.hamsterHour`,
  `HAMSTER_HOUR_SECONDS`, `bubbleUnlocked()` (reads the quest save from localStorage).
- `src/jobs/types.ts` `JobsDeps` (~l.338): `scene`, `vehicles: Vehicle[]`, `player`, `economy` (`spend(amount, reason)`
  returns false when short), `hud` (`toast(text, ms)`), `unlock(id)`, `play(sfx)`.
- `src/vehicles.ts`: `createVehicle(scene, kind, x, z, yaw)` returns a `Vehicle`; `removeVehicle(scene, v)`. A vehicle in
  `deps.vehicles` is driveable by walking up to it (that is how parked cars work). See how `src/skate/runtime.ts`
  (~l.120-135) spawns a board and pushes it into the list.
- `src/interactables.ts` `addInteractSpot({ x, z, prompt, run(player, { hud, economy, fx, play }) })` (~l.68-85).
- `src/player.ts` / `Player.vehicle` to know if the player is inside the Dewdrop (`player.vehicle?.kind === 'bubble-mobile'`).

## Change (only `src/dewdrop/runtime.ts`, plus a new `src/dewdrop/runtime.test.ts`)
- Every 1 s: if `bubbleUnlocked()` and there is no 'bubble-mobile' in `deps.vehicles` within 60 m of the bay that is not
  wrecked, and none is being driven by the player, spawn one at `DEWDROP_BAY` (only when the player is more than 40 m
  away or it is the first check after load, so it never pops in under their nose). Keep at most one spawned by this
  module; if the one it spawned is wrecked or more than 400 m from the bay and empty for 2 minutes, remove it so it
  respawns.
- An interact spot 2 m from `UNDERSPAN.workshopDoor` (src/societies/config.ts), present only once `bubbleUnlocked()`:
  prompt `Buy a Dewdrop (400 Acorns)`; on run, `economy.spend(DEWDROP_PRICE, 'Dewdrop')`; on success replace the bay
  ball with a fresh one and toast "Hogweed signs another form. Underlined twice."; on failure toast that it is 400.
- Hamster Hour: while `player.vehicle?.kind === 'bubble-mobile'` add dt to a counter, reset to 0 when out; at
  `HAMSTER_HOUR_SECONDS` call `deps.unlock(DEWDROP_ACH.hamsterHour)` once per session.
- Test (`runtime.test.ts`, mock three-heavy modules as needed, or factor the Hamster Hour counter into an exported pure
  helper `hamsterStep(state, inBall, dt): boolean` and test that): 59 s then out resets; 60 s in a row fires once.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` clean for your files; `npx vitest run src/dewdrop` passes.

## Out of scope
`config.ts`, `vehicles.ts`, the prefab, the quests (other issues).

Epic: A (foundations) — E26 street racing
Depends on: none
Agent: Sonnet

(Paste `_env.md` here.)

## Goal
The quest race runner (`raceRun`) supports race modes through `RaceRunOpts`, night races, closed-road races and a
visible next-checkpoint gate on street routes, while every existing quest race plays exactly as before.

## Read first
- `games/gnome-theft-auto/src/quests/objectivesRace.ts`: the whole runner; `RaceRunOpts`, `RaceEvent`, `RaceTick`,
  `RaceOther` are already declared there (opts is accepted but ignored: `void opts;`).
- `games/gnome-theft-auto/src/quests/objectivesRace.test.ts`: existing tests (ordinal, rankRacers...).
- `games/gnome-theft-auto/src/quests/types.ts`: race objective (`night?`, `closedRoad?`), `QuestDeps` (`atmosphere?:
  { getMode(); setMode(mode) }`, `traffic?: Traffic`, `player`, `vehicles`).
- `games/gnome-theft-auto/src/types.ts`: `Traffic.setKeepOut?(zones: { x; z; r }[] | null)`.
- `games/gnome-theft-auto/src/raceTrack/trackDef.ts`: `Gate` (x, z, yaw, half), `track.def.relief`.

## Change (only `src/quests/objectivesRace.ts` and its test)
- Remove `void opts;` and implement every RaceRunOpts field:
  - `seat(v)`: right after the race vehicle `mine` is created (and again in `reset()` after holdPlayer), call
    `opts.seat(mine)`; the run then goes straight to 'countdown' when seated.
  - `slot`: the player's grid slot (default `obj.rivals.length`); use it for `myGrid`, `slotS(playerSlot)` etc.
  - `canStart()`: in 'countdown', while it returns false keep the player held, lights at 0 and `cdT = 0`, line
    'Waiting for the other racers…'.
  - `others()`: add each to `place()`'s entries (`{ id: 'o:' + o.id, dist: o.dist, finishedAt: o.finishedAt }`);
    count them in "POS p/n" (n = rivals + others + 1).
  - `anyPlace`: in finishPlayer, any place counts as done (banner `${ordinal(p)} PLACE!`, confetti only for p === 1),
    and skip the "Out of the places" failure. `noPodium`: never play the podium scene (finish at once after
    PODIUM_AFTER). `endOnAbandon`: in `abandon()`, emit `{ type: 'abandon', why: msg }` and go to phase 'done'
    (call `changed()`) instead of `reset()`.
  - `onEvent`: 'go' in go(); 'gate' when `tracker.update` returns 'gate' (`passed` = tracker.passed, t = raceTime);
    'finish' in finishPlayer (`t` = raceTime, place, of = total racers) — emitted for every finish, placed or not.
  - `onTick`: once per update in 'countdown', 'racing' and 'finished' with
    `{ phase, t: raceTime, dist: pDist, x: mine.x, y: mine.y, z: mine.z, yaw: mine.yaw, place: place().p }`.
- `obj.night`: on run start remember `deps.atmosphere?.getMode()`, call `setMode('night')`; in cleanup put the old mode
  back. (No atmosphere: do nothing.)
- `obj.closedRoad`: when the race goes (go()), call `deps.traffic?.setKeepOut?.(zones)` with circles r = 16 every 25 m
  of centre line (track.samples() every 25th sample; closed: the whole lap; open: startS-30 .. finishS+20); clear with
  `setKeepOut(null)` in reset(), abandon and cleanup. Also place cone prefabs at both ends of every gate (`gate.x +
  gate.nx * (gate.half + 0.5)` and minus), built once at run start with `buildPrefab('site-cone')` from
  `@lawn/prefabs`, placed with `placeOnGround(obj3d, x, z, 0, false)` (see `../terrainMesh`), removed in cleanup.
- Street gate marker: when `track.def.relief === 'none'`, show a pulsing gate at the next gate while racing: a
  `THREE.Mesh` torus or two posts with a banner (`THREE.TorusGeometry(gate.half, 0.25, 8, 32)`, standing upright,
  rotated to face along the gate (`rotation.y = gate.yaw`), `MeshBasicMaterial({ color: 0xff7a00, transparent: true,
  opacity })`), its foot on the ground: y = `heightAt(gate.x, gate.z)` (`../terrain`) — on the Skyway deck use the
  vehicle's y when the vehicle is within 25 m of the gate and higher than the ground by > 2 m, so the arch sits on
  the deck. Move it to the next gate on each 'gate'; hide it outside 'racing'; dispose in cleanup.
- Tests in `objectivesRace.test.ts`: keep existing ones; add pure tests where you can (e.g. export a pure helper
  `keepOutZones(track, every = 25, r = 16)` and test it returns circles on the centre line for a street track from
  `TRACKS['kerb-row-circuit']`).

## Contract
`raceRun(obj, deps, changed, say, opts: RaceRunOpts = {})` and the RaceRunOpts / RaceEvent / RaceTick / RaceOther
types exactly as declared in the file now (do not rename fields). With `opts` empty and no `night`/`closedRoad`, the
behaviour must be unchanged.

## Done when
- `npx vitest run src/quests/objectivesRace.test.ts src/quests/quests.test.ts src/quests/dirtRaces.test.ts` passes
  and `npx tsc --noEmit -p .` passes (games/gnome-theft-auto).

## Out of scope
`quests/types.ts` (fields already added), `raceTrack/*`, `streetRace/*`.

Epic: 2 Parts
Depends on: none (raceAi.ts is filled by another worker at the same time; code against its exported signatures)

## Environment
Read `docs/roadmaps/gta-race-track/_env.md` first (it lists the track API you use).

## Goal
The quest objective kind `race` works: `raceRun()` in `games/gnome-theft-auto/src/quests/objectivesRace.ts` takes the
player to the Speedway grid, puts a race vehicle in the last grid slot, counts down with the gantry lights, runs the
race against AI rivals with a race HUD (position, lap, time, countdown), and completes the objective when the player
finishes in `mustPlace` or better; otherwise everyone goes back to the grid for another try.

## Read first
- `games/gnome-theft-auto/src/quests/objectivesRace.ts` (the stub; keep `raceRun`'s signature)
- `games/gnome-theft-auto/src/quests/types.ts`: `ObjectiveDef` kind `'race'`, `RaceRival`, `QuestDeps`, `Run`
- `games/gnome-theft-auto/src/quests/races.ts` (the four races that use it)
- `games/gnome-theft-auto/src/raceTrack/raceAi.ts` (exports you call: `spawnRival`, `resetRival`, `driveRival`,
  `removeRival`, types `Rival`, `RivalCtx`)
- `games/gnome-theft-auto/src/raceTrack/state.ts` (`setRaceActive`, `setStartLights`)
- `games/gnome-theft-auto/src/raceTrack/track.ts`
- `games/gnome-theft-auto/src/quests/objectivesDrive.ts` lines 1-70 and 140-250 (`stealDeliverRun`: spawning a
  vehicle for the player with `createVehicle`, `deps.vehicles.push`, ground rings with
  `flatLayer(..., LAYER.marker)` + `placeOnGround`, a Run's `lines/done/update/blips/cleanup`)

## Change
`games/gnome-theft-auto/src/quests/objectivesRace.ts` — implement `raceRun(obj, deps, changed, say)` as a small state
machine. `L = trackLength()`. Slots: rivals take slots 0..n-1, the player's vehicle the last slot n.
1. **'travel'** (start): `setRaceActive(true)`. Spawn the player's race vehicle with
   `createVehicle(deps.scene, obj.vehicle, g.x, g.z, g.yaw, obj.tint)` at `g = gridSlot(n)`, `questOwned = true`,
   push it to `deps.vehicles`; spawn every rival with `spawnRival(deps.scene, deps.vehicles!, def, obj.vehicle, i)`
   (rivals sit on the grid, held). A pulsing ground ring (radius 3, orange) round the race vehicle. Lines:
   `Head to the {{Lost & Found Speedway}} grid and get in your <spec.name> (last slot).` When
   `deps.player?.vehicle === mine` go to 'countdown'.
2. **'countdown'** (4.2 s): hold the player's vehicle on its slot every frame (x, z, yaw = the slot, speed 0, vy 0,
   then `syncVehicleMesh(mine, 0)`), drive rivals with `hold: true`. Lamps: `setStartLights(min(5, floor(t / 0.7) + 1))`
   until t = 3.5, then `setStartLights(-1)` and 'racing'. Show a big centred countdown in the race HUD (5 red dots
   filling, then GO! in green). `deps.play('whistle')` at GO.
3. **'racing'**: `time += dt`. Player: a `GateTracker` (update with the vehicle's x, z each frame), plus a race distance
   kept like the rivals' (`locate(x, z, 60, hint)`, add the wrapped change of `s`, start at `slotS - L` where slotS is the
   locate().s of the slot). Rivals: `driveRival(r, dt, deps.world, { hold: false, playerDist, time })`; a rival
   finishes when `r.dist >= obj.laps * L` (set `finishedAt = time`; after that drive it with `hold: true`). The player
   finishes when `tracker.laps >= obj.laps` (the tracker's first event is 'start' when the line is first crossed; laps
   count from there). Keep `setStartLights(-1)` for 3 s then 0.
   - Positions: finished drivers by finish time first, then everyone else by distance. Player's place = index + 1.
   - Taunts: when a rival passes the player or the player passes a rival, `say(`${name}: "${taunt}"`)` with a random
     line of its `taunts`, at most one every 6 s.
   - The player left the race vehicle for 8 s, or it `exploded`, or it `sunk` → "Race abandoned! Back to the grid." → reset.
   - Player finished: place <= mustPlace → `deps.hud.banner(`${ordinal(place)} PLACE!`)`, `deps.play('steal')`,
     `deps.fx?.confetti(x, y + 1, z)`, mark done and call `changed()`. Otherwise
     `say(`Finished ${ordinal}. You need ${mustPlace === 1 ? 'the win' : 'a top ' + mustPlace} — back to the grid!`)`
     and reset after 3 s. If enough rivals finished that the player can no longer place, fail the same way at once.
   - **Reset**: `resetRival` every rival to its slot, put the player's vehicle back on its slot (repair it with
     `repairVehicle`), keep the player seated if they are in it, back to 'countdown' (or 'travel' when not seated).
4. **Race HUD**: one container `div#gta-race-hud` appended to `document.getElementById('ui')` (do not restyle #ui):
   top-centre below the safe area (`top: calc(env(safe-area-inset-top) + 64px)`), `pointer-events: none`, compact
   (max-width 92vw, font 14-16px, dark translucent pill), showing `POS 2/4  LAP 1/2  0:31.4` and, during the
   countdown, the lights row / GO. Hidden in 'travel'. Removed in cleanup. Inject its CSS once in a `<style>` with id
   `gta-race-hud-css`. Must fit a 390 px wide phone without covering the minimap (top right) or the touch buttons
   (bottom).
5. `lines()`: travel: as above; countdown: `Wait for the lights…`; racing: `Lap ${lap}/${laps} · Position ${p}/${n+1}`
   and the objective text. `blips()`: travel: the grid slot (`{ x, z, color: '#ff7a00', quest: obj.hint }`); racing:
   the next gate (`gates()[tracker.next < 0 ? 0 : tracker.next]`) in '#ff7a00'.
6. `cleanup()`: remove rivals (`removeRival`), the ring and the HUD; `setRaceActive(false)`; the race vehicle stays
   in the world for the player but `questOwned = false`.
7. Add `games/gnome-theft-auto/src/quests/objectivesRace.test.ts`: unit-test the pure parts you factor out, at least an
   exported `rankRacers(entries: { id: string; dist: number; finishedAt: number | null }[]): string[]` (finished by
   time, then by distance) and `ordinal(n)` ('1st', '2nd', '3rd', '4th').

## Contract
`export function raceRun(obj, deps, changed, say): Run` (signature unchanged), `export function rankRacers`,
`export function ordinal`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your files
- `npx vitest run src/quests/objectivesRace.test.ts` (from `games/gnome-theft-auto`) passes

## Out of scope
Every other file: raceAi.ts, track.ts, state.ts, races.ts, quests.ts, types.ts are not yours.

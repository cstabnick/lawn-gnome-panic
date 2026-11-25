# E26 contracts: street routes, meets, race modes, online races

What E26 (street racing and race modes, L112) gives later epics (E18 activities, E20 m05 the Carburettors' night
meet, E22 finish). Code under `games/gnome-theft-auto/src/`. World: +x east, +z south; yaw 0 faces +z.

## Street routes (`raceTrack/defs/streets.ts`, `raceTrack/tracks.ts`)

- `TrackDef.relief` gains `'none'`: the route lies over existing roads and skyway decks. `applyRelief` does nothing;
  `trackSurfaceAt`, `fordWaterAt` and `nearTrack` skip such tracks (they use `GROUND_TRACKS`); the map (hud.ts) does
  not draw them. `Track.surfaceAt` still answers 'asphalt' on its own road. `roadTopAt` is only the lift: take heights
  from the ground (terrain `heightAt`, skyway decks), never from a street track.
- Ids (appended to `TRACK_IDS`): `kerb-row-circuit` (Turfton grid, circuit), `skyway-sprint` (up the Turfton Skyway,
  point to point), `ring-road-run` (the Ring Road, circuit), `pardonlin-boucle` (Pardonlin, circuit, closed road),
  `saltbucket-dash` (east and south bands to the coast, point to point). `STREET_TRACK_IDS`, `StreetTrackId`,
  `isStreetTrack(id)`.
- `raceTrack/streetTracks.test.ts`: every sample of a street route lies on a road of the built world.

## Race objective (`quests/types.ts`, `quests/objectivesRace.ts`)

- New race objective fields: `night?: boolean` (sky held at 'night' from the start of the run to cleanup, old mode
  restored) and `closedRoad?: boolean` (traffic `setKeepOut` circles along the route while racing; cones at the gates).
- Street routes show the next checkpoint as a pulsing gate in the world (any track with `relief: 'none'`).
- `raceRun(obj, deps, changed, say, opts?: RaceRunOpts)`; quests pass no opts. `RaceRunOpts`: `seat(v)` (seat the
  player at once, no travel), `slot`, `canStart()` (hold the countdown), `others()` (online racers ranked in),
  `anyPlace` (any finish completes), `noPodium`, `endOnAbandon`, `onEvent(RaceEvent)`, `onTick(RaceTick)`.
  `RaceEvent`: go | gate {passed, t} | finish {t, place, of} | abandon {why}.

## Meets and cast (`streetRace/meets.ts`, `streetRace/cast.ts`, `streetRace/types.ts`)

`MEETS: Record<MeetId, StreetMeet>` for `skyway-foot` (the Carburettors' night meet at the Turfton Skyway's west foot;
tracks kerb-row-circuit, skyway-sprint, ring-road-run), `pardonlin` (pardonlin-boucle), `saltbucket`
(saltbucket-dash). Each: centre, area, organiser (quest giver `street-<meet id>`), bookie (pickup races + wagers),
flagger (at tracks[0]'s grid), crowd, residents, vignette and sign anchors. `MEET_CAST: Record<MeetId, MeetCast>`:
people, pickup roster (3 RaceRivals), pickup vehicle, signs, vignettes (prefab layouts), crowd looks.
E20's m05 ("run a part to the Carburettors' night meet on the Skyway") stages at `MEETS['skyway-foot']`.

## Race modes (`streetRace/session.ts`, `streetRace/index.ts`, `streetRace/raceApp.ts`)

- `createRaceSession(deps): RaceSession` with `start({ kind: 'pickup' | 'trial' | 'online', trackId, vehicle, laps,
  rivals?, wager?, meetId? })`, `stop`, `update`, `blips`, `active`, `lastResult`. Runs `raceRun` with opts; the player
  is seated in a fresh race vehicle on the grid (teleport). Refuses while a quest step owns the player.
- Pickup: the meet's roster, stake taken at the start, twice the stake paid on a win. Trial: no rivals, best time per
  track, ghost of the best run. Online: lobby via RaceNet, countdown when the host says go, others ranked in.
- `createStreetRacing(scene, world, deps)`: meets + session + bookie prompt/interact (wager panel) + `setNet`.
- Race Club Gnomlet app (`RACE_APP_ID = 'race-club'`, group 'fun').

## Online races (`online/raceSync.ts`, SYS.race = 11)

One record per player (entity id 0), radius 100000, 4 Hz:
`[0, state, trackIdx, laps, vehicleIdx, hostId, seq, distDm, finishCs, dnf]`, string = display name.
`state`: 0 idle, 1 hosting (lobby), 2 joined, 3 countdown/racing (host said go), 4 finished.
`trackIdx` = index in `TRACK_IDS`; `vehicleIdx` = index in `RACE_VEHICLES` (raceSync.ts); `hostId` = the lobby's host
(my own id when hosting); `seq` increments per lobby the host opens (stale joins are ignored). Implements `RaceNet`
(streetRace/types.ts). `Online.race` (online/install.ts) is the instance, null when not registered.

## Saves

`gta-racing-v1` (cloud-merged: lowest best per track, highest counts): `{ best, runs, pickupWins, onlineWins,
wagerWon }`. Ghosts: `gta-race-ghosts-v1`, this device only.

## Quests, givers, achievements

Quests in `quests/streetRaces.ts` (`STREET_QUESTS`, `STREET_QUEST_IDS`), givers `street-skyway-foot`,
`street-pardonlin`, `street-saltbucket`, stages in `quests/stages/street.ts`. Unlock rows in `unlocks.ts` (temporary
beats; E20/E21 may re-time). Achievements in `packages/achievements/src/catalog.ts` (`gta-street-*`), rewards in
`packages/prefabs/src/catalog/gta-street-race-gear.ts`. Lore: rulings from R-215.

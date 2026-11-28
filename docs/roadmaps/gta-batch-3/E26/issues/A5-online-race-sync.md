Epic: A (foundations) — E26 street racing
Depends on: none
Agent: Sonnet (net sync)

(Paste `_env.md` here.)

## Goal
Online race lobbies and progress relayed between players over the existing world-sync hub: `online/raceSync.ts`
implements `RaceNet` as a SYS.race adapter, registered in `online/install.ts`, with unit tests that run two or three
simulated clients.

## Read first
- `games/gnome-theft-auto/src/online/hub.ts`: SyncAdapter (sys, radius, hz, keyframeMs, staleMs, collect, receive,
  ownerGone, update, reset), SyncFrame (myId, me, peers), SyncLink, Hub (`register`, `onWire`, `update`).
- `games/gnome-theft-auto/src/online/actSync.ts`: one record per player (entity id 0) — the pattern to follow.
- `games/gnome-theft-auto/src/online/actSync.test.ts` and `eventSync.test.ts`: how tests wire two hubs together
  (fake net, `createHub`, peers' poses) — copy that harness.
- `games/gnome-theft-auto/src/online/replicate.ts`: OwnedEnt `{ id, x, z, rec, str? }`, MirrorEnt `{ owner, id, rec,
  str }`, MirrorChanges `{ added, changed, removed }`.
- `games/gnome-theft-auto/src/online/protocol.ts`: `SYS.race = 11` (already added), record limits (MAX_REC_LEN 24,
  integers only, MAX_STR 160).
- `games/gnome-theft-auto/src/streetRace/types.ts`: `RaceNet`, `RaceLobby`, `RaceRacer` (the interface you implement).
- `games/gnome-theft-auto/src/online/raceSync.ts` (stub) and `online/install.ts`.

## Wire format (decided)
One record per player, entity id 0, sent to every peer (radius 100000), hz 4, keyframeMs 1500, staleMs 6000:
`[0, state, trackIdx, laps, vehicleIdx, hostId, seq, distDm, finishCs, dnf]`, string = my display name (≤ 40 chars).
- state: 0 idle, 1 hosting a lobby, 2 joined a lobby, 3 racing (host said go; joiners copy 3 when they see their
  host at 3), 4 finished. trackIdx = index in `TRACK_IDS` (`src/raceTrack/tracks.ts`); vehicleIdx = index in
  `export const RACE_VEHICLES: readonly VehicleKind[] = ['lowrider', 'zero-turn', 'ride-on', 'push-bike', 'dirt-bike',
  'euro-hatch', 'deux-pots', 'wespa']` (export it from raceSync.ts; check each is a VehicleKind in `src/types.ts`, drop
  any that is not). hostId: my id when hosting; the host's id when joined; 0 when idle. seq: the host's lobby number
  (increments each time `host()` is called); joiners copy the host's seq. distDm = round(dist * 10); finishCs =
  round(finishedAt * 100) or -1; dnf 0/1. Decode defensively: any out-of-range value → ignore that record.

## Behaviour
- `host(trackId, laps, vehicle)`: state 1, my lobby. `join(hostId)`: state 2 with that host's track/laps/vehicle/seq
  (only if that host is seen at state 1). `leave()`: state 0. `go()`: host only, state 3 (from then my `started()` is
  true). A joiner whose host's record shows state 3 with the same seq sets its own state to 3 and `started()` true.
  If the host goes idle/leaves (record removed or seq changes) before go, joiners drop back to 0. After go, a missing
  host does not stop joiners racing.
- `progress({ dist, finishedAt, dnf })`: stored and published; `finishedAt` non-null → state 4.
- `lobbies()`: other players at state 1, with members = the host plus every player at state 2 with that hostId and
  seq. `mine()`: my lobby (host = me, or my host), members host first then joiners by id, phase 'lobby' (states 1/2),
  'countdown'/'racing' once started (use 'racing'). `racers()`: other members of my lobby with their dist/finish/dnf.
- `onInvite`: called once per (hostId, seq) when another player's record first shows state 1.
- `reset()` (link dropped): forget all mirrors; my own state stays but `online()` is false so callers stop.
- `online()` = `link.online()`, `myId()` = `link.myId()`.

## Change
- `src/online/raceSync.ts`: implement the above (keep the exported names `createRaceSync`, `RaceSync`,
  `RaceSyncDeps`; add `RACE_VEHICLES`, `encodeRaceRec`, `decodeRaceRec` as pure exports).
- `src/online/install.ts`: register it — `const race = hub.register(SYS.race, (link) => createRaceSync(link, { name:
  d.name ?? (() => 'Gnome') })) as RaceSync;` — add an optional `name?(): string` to `OnlineDeps`, and a field
  `readonly race: RaceNet` to the `Online` interface and the returned object.
- `src/online/raceSync.test.ts` (new): encode/decode round trip and rejection of bad records; two clients: A hosts,
  B sees the lobby (and onInvite fires once), B joins, A sees B in `mine().members`; A goes, B's `started()` becomes
  true; both publish progress and see each other's in `racers()`; A finishing shows `finishedAt` on B; A leaving
  before go drops B back to idle. Three clients: two joiners ordered by id.

## Contract
`RaceNet` (streetRace/types.ts) exactly; `Online.race: RaceNet`; `OnlineDeps.name?(): string`.

## Done when
- `npx vitest run src/online/raceSync.test.ts src/online/online.test.ts src/online/actSync.test.ts` passes and
  `npx tsc --noEmit -p .` passes (games/gnome-theft-auto).

## Out of scope
`protocol.ts` (SYS.race already there), `hub.ts`, `net.ts`, `app.ts`, `streetRace/*`.

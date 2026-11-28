Epic: B (building) — E26 street racing
Depends on: epic A
Agent: haiku-worker

(Paste `_env.md` here.)

## Goal
`createStreetRacing` composes the meets, the race session, the bookies' prompts and wager panels, and the online
link, so app.ts needs one call.

## Read first
- `games/gnome-theft-auto/src/streetRace/index.ts`: the stub (keep `StreetRacingDeps`, `StreetRacing`,
  `createStreetRacing` exactly).
- `games/gnome-theft-auto/src/streetRace/types.ts`: StreetMeet (bookie spot), MeetCast (bookie lines, roster,
  pickupVehicle), RaceSession, RaceNet, WAGERS.
- `games/gnome-theft-auto/src/streetRace/meetScene.ts` (`buildMeet(scene, world, meet, cast, deps): Area`),
  `streetRace/wagerPanel.ts` (`openWagerPanel(opts)`), `streetRace/meets.ts` (MEETS), `streetRace/cast.ts`
  (MEET_CAST), `raceTrack/tracks.ts` (TRACKS[id].name, .closed).

## Change (only `src/streetRace/index.ts` and a new `src/streetRace/index.test.ts`)
- Build every meet with `buildMeet(scene, world, MEETS[id], MEET_CAST[id], deps)` (deps: the AreaDeps part of
  StreetRacingDeps). `update(dt, px, pz, night)`: update every meet and `session.update(dt)`. `blips()`: the meets'
  blips plus `session.blips()`.
- `prompt(x, z)`: when no race is active and (x, z) is within 3.5 m of a meet's bookie spot →
  `Talk to ${cast.bookie.name} (street races and wagers)`; else null.
- `interact(x, z)`: for that bookie, open the wager panel once (ignore while one is open): parent `deps.ui`, title
  `${cast.bookie.name}'s book`, line = `cast.bookie.bubble`, tracks = the meet's tracks with names and the best time
  from `deps.session.store.data().best[id] ?? null`, wagers `WAGERS`, acorns from
  `deps.session.quest.economy` (read `src/economy.ts` for the balance getter), onPick → `session.start({ kind:
  'pickup', trackId, vehicle: cast.pickupVehicle, laps: TRACKS[trackId].closed ? 2 : 1, rivals: cast.roster, wager,
  meetId })`; a non-null result → `deps.toast(result)`; null and wager > 0 → toast a random `cast.bookie.takeLines`.
  Return true when a panel opened.
- When a pickup race ends (watch `session.lastResult()` change in update): toast a random bookie `winLines` (place 1
  and wager > 0, plus "+N Acorns") or `loseLines` (lost with a wager), or "Finished Nth in m:ss.s" for friendlies.
- `setNet(n)`: store it (the session reads it through deps.net) and set `n.onInvite = (l) => deps.toast(
  `${l.hostName} is hosting a race: ${TRACKS[l.trackId].name}. Open the Race Club to join.`)` when n is not null.
- Test: with fake deps (scene `new THREE.Scene()`, world `{ boxes: [] }`, ui from the fake DOM in
  `src/testing/fakeDom.ts` or a stub object) — prompt near a bookie, null far away; setNet sets onInvite.

## Contract
As in the stub. `RaceSessionDeps` (session.ts) gives `store`, `quest` (QuestDeps with economy), `seat`, `questBusy`,
`increment`.

## Done when
- `npx vitest run src/streetRace/index.test.ts` passes; `npx tsc --noEmit -p .` passes.

## Out of scope
session.ts, meetScene.ts, wagerPanel.ts, app.ts.

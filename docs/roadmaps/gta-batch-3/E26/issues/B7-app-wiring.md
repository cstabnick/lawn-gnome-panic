Epic: B (building) — E26 street racing
Depends on: epic A (stubs keep their signatures; other B issues fill them in parallel)
Agent: Sonnet

(Paste `_env.md` here.)

## Goal
Street racing is live in the game: the meets stand in the world, the bookies' prompt works on foot, race modes run
and tick, the Race Club app is on the Gnomlet, online races are linked, and the race blips show on the map.

## Read first
- `games/gnome-theft-auto/src/streetRace/index.ts` (`createStreetRacing(scene, world, deps): StreetRacing`,
  `StreetRacingDeps` = AreaDeps (toast, unlock, increment) + `session: Omit<RaceSessionDeps, 'net'>` + `ui`),
  `streetRace/session.ts` (`RaceSessionDeps`: quest, seat, store, questBusy, increment), `streetRace/save.ts`
  (`createRacingStore()`), `streetRace/raceApp.ts` (`registerRaceClubApp(ctx: RaceAppCtx)`: session, store, net(),
  drivingKind(), toast).
- `games/gnome-theft-auto/src/app.ts`: `createDirtCountry` (~line 469) for where areas are made; `createQuests({...})`
  (~677) for every QuestDeps field (reuse the same values for `session.quest`); `getIn(v)` (~1197) for seating; the
  prompt/interact chain (~1850-1890: `jobPrompt` line and `inp.enterExit` branch); `dirtCountry.update(dt, simX, simZ,
  nightF)` (~2356); `...dirtCountry.blips()` (~2525); `installOnline({...})` (~996); the Quests interface in
  `src/quests/quests.ts` (how to tell a quest step owns the player: look for an `active`/`activeId`/`running` getter).
- `games/gnome-theft-auto/src/online/install.ts`: `OnlineDeps.name?()` and `Online.race` (RaceNet).
- `games/gnome-theft-auto/src/quests/objectivesRace.ts` (`setRaceActive` use) only to understand; do not edit.

## Change (only `src/app.ts`)
- Create `const racingStore = createRacingStore();` and `const streetRacing = createStreetRacing(scene, world, {
  toast, unlock, increment (like dirtCountry), ui, session: { quest: <the same deps object fields createQuests
  gets: scene, world, npcs, hud, cutscene, placePlayer, unlock, play, player, vehicles, watch, traffic, fx, economy,
  atmosphere>, seat: (v) => <put the player in v as driver at once: reuse getIn's logic without the walk/mount
  animation if it has one; read getIn and call what it calls>, store: racingStore, questBusy: () => <true while a
  quest race or any quest objective that needs the player runs — at minimum `raceActive()` from
  './raceTrack/state'>, increment } })` next to the dirt country (after `quests` exists if questBusy needs it; make it
  lazy if needed).
- Frame: `streetRacing.update(dt, simX, simZ, nightF)` next to `dirtCountry.update`; blips: `...streetRacing.blips()`.
- Prompt chain: add `streetRacing.prompt(player.x, player.z)` into the on-foot `jobPrompt` chain (after golf, before
  countryside), and `streetRacing.interact(player.x, player.z)` into the matching interact chain in the same order.
- `registerRaceClubApp({ session: streetRacing.session, store: racingStore, net: () => onlineSync?.race ?? null,
  drivingKind: () => (player.vehicle && player.vehicle.driver === 'player' && !player.vehicle.spec.flies &&
  !player.vehicle.spec.boat ? player.vehicle.kind : null), toast: (t) => hud.toast(t, 4000) })` once at start-up.
- Online: pass `name: () => <the player's display name used for net.start>` to installOnline, and right after it
  `streetRacing.setNet(onlineSync.race)` (guard if onlineSync can be null/undefined).
- Debug hook for checks: when the URL has `?streetrace=<trackId>`, call `streetRacing.session.start({ kind: 'trial',
  trackId, vehicle: 'lowrider', laps: 1 })` once 2 s after load (log the reason if refused).

## Done when
- `npx tsc --noEmit -p .` passes (games/gnome-theft-auto).
- Start a dev server on port 5341 (`npx vite --port 5341 --strictPort` in games/gnome-theft-auto, in the background),
  run `bash tools/smoke.sh "http://localhost:5341/?offline" gta-gnomlet` from the repo root: no console errors; then
  stop the server. Report the smoke output.

## Out of scope
Every file other than app.ts.

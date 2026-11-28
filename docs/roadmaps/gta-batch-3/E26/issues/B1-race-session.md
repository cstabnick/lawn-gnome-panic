Epic: B (building) — E26 street racing
Depends on: epic A (raceRun opts, save, ghosts, RaceNet are implemented)
Agent: Sonnet

(Paste `_env.md` here.)

## Goal
`streetRace/session.ts` runs race modes: pickup races (meet roster + wager), solo time trials (best time + ghost) and
online races (RaceNet lobby), each on the quest race runner, one at a time.

## Read first
- `games/gnome-theft-auto/src/streetRace/session.ts` (stub: `RaceSessionDeps`, `createRaceSession`) and
  `streetRace/types.ts` (`RaceSession`, `RaceModeStart`, `RaceResult`, `RaceNet`, `WAGERS`).
- `games/gnome-theft-auto/src/quests/objectivesRace.ts`: `raceRun(obj, deps, changed, say, opts)`, `RaceRunOpts`,
  `RaceEvent`, `RaceTick`, `Run` (lines, done, update(dt, px, pz), blips, cleanup).
- `games/gnome-theft-auto/src/streetRace/save.ts` (RacingStore), `streetRace/ghost.ts` (createGhostRecorder, loadGhost,
  saveGhost, GHOST_HZ), `streetRace/ghostView.ts` (createGhostView).
- `games/gnome-theft-auto/src/quests/types.ts`: race objective shape, `QuestDeps` (hud.toast/banner, economy,
  watch.setCap, player, vehicles).
- `games/gnome-theft-auto/src/economy.ts`: `Economy` (balance and spend/earn method names: read them).

## Change (only `src/streetRace/session.ts` and a new `src/streetRace/session.test.ts`)
- `start(s)`: refuse (return a short reason string) when a race is active, when `deps.questBusy()`, when the player
  is dead/in a cutscene (`deps.quest.cutscene.active`), for 'pickup' without rivals or when the wager exceeds the
  player's Acorns, for 'online' when `deps.net()` is null/offline or `net.mine()` is null. Otherwise build a race
  objective `{ kind: 'race', text, raceId: 'mode-' + kind, trackId, vehicle, laps, rivals: [...(s.rivals ?? [])],
  mustPlace: 1, hint: track name, tint }` and call `raceRun(obj, deps.quest, changed, say, opts)` where say =
  `(t) => deps.quest.hud.toast(t, 3500)` and opts:
  - always `seat: deps.seat`, `anyPlace: true`, `noPodium: true`, `endOnAbandon: true`;
  - pickup: take the stake at the start (economy spend; refuse if it fails); on finish place 1 pay `2 * wager`
    (earn, reason 'Street race winnings'), `store.notePickupWin(wager)`, `deps.increment('gta-street-wager', wager)`
    when wager > 0; toasts with the meet's bookie lines are the caller's business (index.ts) — expose the result;
  - trial: no rivals; record a ghost with `createGhostRecorder()` from onTick (phase 'racing'); show the stored ghost
    (`loadGhost(trackId)`, only if its vehicle matches or none) with `createGhostView` updated from onTick's `t`; on
    finish `store.recordFinish`, and if best, `saveGhost(rec.finish(...))`; on the first trial finish on each street
    track (`isStreetTrack`), when the store shows a best on all five street tracks, unlock `gta-time-trial` via
    `deps.increment('gta-time-trial', 1)` once per newly timed street track (track which ones you already counted by
    checking `store.data().best[trackId]` was undefined before this finish);
  - online: `slot` = my index in `net.mine().members`, `canStart: () => net.started()`, `others: () =>
    net.racers().map(r => ({ id: String(r.id), name: r.name, dist: r.dist, finishedAt: r.finishedAt }))`, and
    `onTick` → `net.progress({ dist, finishedAt: null, dnf: false })`; on finish → `net.progress({ dist, finishedAt: t,
    dnf: false })`; on abandon → `dnf: true`. A win (place 1 with at least one other member) → `store.noteOnlineWin()`
    and `deps.quest.unlock('gta-online-race')`. After my finish keep the run's results up until every member has
    finished/dnf or 45 s pass, then show a standings toast (names and times) and `net.leave()`.
  - all kinds: `store.recordFinish(trackId, t)` on finish (trial does it as above; do it once); set
    `deps.quest.watch?.setCap?.(kind === 'pickup' ? 1 : 0)` at start and `setCap(null)` at the end.
- `update(dt)`: `run.update(dt, player.x, player.z)`; when `run.done()`: `run.cleanup()`, dispose the ghost view,
  remember the `RaceResult`, clear active. `stop()`: cleanup at once (online: `net.progress({..., dnf: true})` then
  `net.leave()`; pickup stakes are not refunded once the lights went out, refunded before).
- `blips()`: the run's blips while active, else [].
- Export pure helpers for tests: `pickupPayout(wager, place)` (2*wager for place 1, else 0) and
  `standingsText(rows: { name: string; time: number | null }[]): string`.
- `session.test.ts`: pure helpers; and `start()` refusals with fake deps (quest busy, wager too high, online without
  net) — build fake deps with only what the refusal paths touch (cast via `as unknown as ...`).

## Contract
`createRaceSession(deps: RaceSessionDeps): RaceSession` and `RaceSessionDeps` exactly as in the stub (do not change
them; `index.ts` and `app.ts` are written against them).

## Done when
- `npx vitest run src/streetRace/session.test.ts src/quests/objectivesRace.test.ts` passes; `npx tsc --noEmit -p .`
  passes (games/gnome-theft-auto).

## Out of scope
objectivesRace.ts, save.ts, ghost*.ts, index.ts, raceApp.ts, app.ts.

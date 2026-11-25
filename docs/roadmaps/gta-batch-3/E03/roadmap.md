# E03 Bugs and quest reliability sweep: roadmap

Brief: [../E03-bugs-and-quest-reliability.md](../E03-bugs-and-quest-reliability.md). Game: `games/gnome-theft-auto`.
Shared rules for every issue: [env.md](env.md).

## Baseline (before any fix)

Headless quest sim, all cheats, `--all --force`: 55 pass, 2 fail, 1 blocked of 58 runs. Fails: `city-glow-band-express`
(bot misses the timed gates, a bot limit) and `city-skyway-robbery` (bot stuck at Skyway gate 2, a bot limit: the
`checkpoints` solver does not climb deck ramps); blocked: `nc-party` (needs the relay server). The four `chase-follow`
quests "passed" only because the solver teleported the player 6 m behind the leader every tick.

## Foundation (lead)

- `quests/types.ts` `QuestDeps.ensureRideNear?(x, z, q)` (L09 contract, wired in `app.ts` by the lead).

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1 Fixes | `tsc --noEmit`, each issue's tests | 9 (1-1 .. 1-9), parallel |
| 2 Quest vehicles + wiring | build, `npm test -w games/gnome-theft-auto`, quest sim, smoke, zfight | 1 (2-1) + lead wiring |

| Issue | Items | Changes | Model |
|---|---|---|---|
| 1-1 follow quests | L03 | `quests/followWatchdog.ts` (new), `quests/objectivesDrive.ts` (chaseFollowRun), `quests/types.ts` (Run.followStats), `questSim/solvers/drive.ts`, `questSim/checks.ts`, sim tests | sonnet |
| 1-2 sky and birds in cutscenes | L07, L08 | `app.ts` (cutscene branch), `skyTraffic/runtime.ts`, `skyTraffic/runtime.test.ts` | haiku |
| 1-3 sprinklers | L10 | `encounters.ts` | haiku |
| 1-4 sandpit wall and raft | L16, L24 | `biomes.ts`, `data/levels/cloverfield-farms.level.json`, `canalCruise.test.ts`, `sandpitJump.test.ts` (new), castaway marks if moved | sonnet |
| 1-5 canal bridges | L23 | `waterworks.ts`, `waterworks.test.ts`, prefab catalog if a new bridge | sonnet |
| 1-6 gnome crowds | L41 | `npcs.ts` (+ the module that clusters), `crowds.test.ts` (new) | sonnet |
| 1-7 golden acorn | L80 | `easterEggs.ts`, `easterEggs.reach.test.ts` (new) | sonnet |
| 1-8 profiler port | L88 | `packages/profiler` / `packages/platform*` / `games/admin-profiler` as found, `docs/hosting.md` | sonnet |
| 1-9 ride near quest start | L09 | `quests/ensureRide.ts` (new) + test, `quests/quests.ts` | sonnet |
| 2-1 scene vehicles to objectives | L49, L79 | `quests/objectivesDrive.ts` (stealDeliverRun), `quests/types.ts`, `quests/chapter1.ts`, `quests/sideQuests.ts`, scenes | sonnet |

Epic 2 waits for 1-1 (both edit `objectivesDrive.ts`). Online: nothing new is relayed (scenes are local; the sky fix
keeps `netList`); the L09 delivery uses the Lock-Up, which already relays its vehicles. Mobile: no new controls.

Issue texts: `epic-1/*.md`, `epic-2/*.md`. Results: see the end of this file.

## Added mid-epic (coordinator)

- L79 detail "the boot float is missing on normal step entry; restart shows it": see 2-1 root cause below.
- Mobile: building prompts with no touch button (lead, `ui/enterLabel.ts`).
- Skyway vs street traffic levels: issue 2-2.

## Results

| Item | Root cause | Fix |
|---|---|---|
| L03 | speed-based stuck check (< 5 m/s) teleported slow-but-fine leaders 3 m through boxes; no escape for a wedged leader; a lagging player got only a toast; the end waypoint looped | `followWatchdog.ts` (progress-based nudge 4 s / road snap 8 s / skip 15 s), waiting line + 50% catch-up grace after 20 s, end completes after 10 s within 2x maxDist; sim trails 2.5 s behind with a 12 s lag, fails on a stall > 20 s |
| L07/L08 | cutscene branch of `frame()` returned before aircraft mesh sync and `birding.update` | `cutsceneSkyFrame`: sky step for non-live scenes, aircraft mesh sync, flocks stepped (paused HUD) |
| L09 | (feature) | `ensureRideNear` on quest start: Lock-Up Sling-Lift (free) for the last stored car, else a loaner ride-on |
| L10 | hand-built 4.4 m cylinder "jet" | `lawn-sprinkler` prefab head, 24-droplet spray <= 1.5 m, 0.8 s wobble telegraph, launch 6.5 -> 4.5 |
| L16 | `simdrive.ts` swept vehicle-vs-box collision at ground height, so an airborne car hit the wall | sweep at the chassis height |
| L23 | 6.5 m arch at every bridge; canal deck is 3 m over the bed | arches scaled to bed depth; new low `canal-road-bridge` prefab on the canal |
| L24 | 5.6 x 3.6 raft collider mid-channel | raft on the north bank, deck-sized collider; E02 `canalCruise` case passes |
| L41 | `pickNear` fell back to any candidate, piling gnomes on sparse walk-point pockets | least-crowded pick or none; `CROWD_CAP` 6 idle per 12 m cell |
| L49 | objective spawned a stock car after the dressed scene car | `steal-deliver.loadout` |
| L79 | quest float was not `questOwned`: `traffic.ts` cleanup (over 40 vehicles, farthest driver-less beyond 60 m) deleted it while the player stood at Side-Valve after the intro; a restart near the marker spawned one within 60 m. Also spawn 2.5 m off the staged mark | `questOwned` while the objective runs; spawn on the staged mark |
| L80 | `acorn-city-2` inside the hospital collider (and `acorn-farm-3` against a 5 m box) | moved; `easterEggs.reach.test.ts` |
| L88 | nginx `listen 8080` without `absolute_redirect off`: directory 301s carried the pod port | `absolute_redirect off` (`deploy/nginx.conf`), hosting doc |
| Mobile enter | touch label chain skipped hunt/bird/fish/job/town/portal/interactable prompts | `ui/enterLabel.ts`, same priority as the key |
| Skyway traffic | chassis placement cast from 50 m up snapped street cars onto decks; deck rails only applied to the player | placement cast from 1.5 m above; `keepOnDeck` for NPC cars |

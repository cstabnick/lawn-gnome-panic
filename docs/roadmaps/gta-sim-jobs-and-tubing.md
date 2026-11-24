# Gnome Theft Auto: sim jobs and tubing

Request (user): "introduce new activities for sim jobs. like taxi, delivery driver. pilot. boat driver (idk, maybe
tubing? - also add tubing as a multiplayer mechanic) ... not super complex sim but convincing enough ... make sure all
multiplayer compatible."

## Design

- **One machine for four jobs.** A gig is a list of stops (pickup, drop, land, fly-through gate, cargo drop) the job
  vehicle reaches (`src/jobs/gig.ts`). While passengers or parcels are aboard, a comfort rating runs (harsh braking,
  hard cornering, crashes, run-overs, jumps, stalls, rough water from `waves.ts`; `src/jobs/rating.ts`). Pay = base x
  level perks x surge, plus early/late, tip by stars, bonuses; XP gives levels 1-6 with perks (`src/jobs/defs.ts`).
- **Jobs** (`defs.ts` JOBS): Taxi Driver (Kerbstone Cabs, Mabel Kerbstone; any ground vehicle with a passenger seat; NPC
  fares hail at the kerb with personalities: plain, hurry, nervous, chatty, celebrity), Courier (Pigeon-Drop ground crew,
  Sorting-Office Sid; any ground vehicle; multi-drop rounds of food / fragile / heavy / VIP / mail), Pilot (Wally's
  Charters at the Desert Airfield; charters, scenic gates, cargo drops; landing score), Boat Driver (Loch Moss Steamer
  Co., Purser Tolly; water taxi and the scheduled Steamer loop). Phone Jobs app (`board.ts`), depot kiosks with a
  dispatcher gnome (`visuals.ts`), HUD widget + 44 px action button / I / pad R3 (`hud.ts`).
- **Events** (`surge.ts`): rush hour (Morning, Dusk: taxi/courier x1.25 and more work), storm pay (blustery sea:
  boat/pilot x1.4, comfort harder), celebrity clients (level >= 3).
- **Tubing** (`src/tubing/`): a boat driver puts the tow line out (🛟 Tubing phone app or the Mossbank tube rack);
  riders hook on (other players, or NPC gnomes when solo); rope physics is a pure deterministic function of the boat's
  pose (`tow.ts`: spring-damper rope, lean swing, wave launches, hops, fall-off risk); the buoy run (`course.ts`).
- **Save**: `gta-jobs-v1` (career.ts) in saveIO.ts, cloudSave.ts (newer wins), saveIO.test.ts fixture.
- **Quests**: `jobStats()` (career.ts) and `jobs.stats()` give objective-friendly counters for the city-lore planner.
- **Achievements**: 12 (`JOB_ACHIEVEMENTS`), each with its own wearable reward; the four job uniforms are among them.

## Online decisions

Follows the online-sync pattern (`docs/roadmaps/gta-online-sync.md`): no new net.ts message kinds; three SYS systems
on the hub (codes appended in `online/protocol.ts`: cab 6, pax 7, tow 8; records in `jobs/protocol.ts`).

| Activity | Decision |
|---|---|
| Job state, gigs, earnings, levels | per player, own save, own Acorns |
| A real player as a taxi fare | rider owns a SYS.cab call entity (position, destination); drivers on taxi duty mirror open calls, send `take`; first take wins (rider decides, record shows who); rider boards through the existing seat request (`board`/`seat`); driver's gig needs the caller seated; `drop` command on arrival; company pays the driver (+25 real-gnome bonus), the rider rides free |
| Other players as passengers in a job vehicle (taxi, plane, boat) | existing seat mechanism, unchanged; NPC fares keep clear of seats real players hold (`SeatBook.entries`) |
| NPC passengers and parcels in a job vehicle | driver publishes SYS.pax [seat, lookSeed] pairs; everyone seats the same NPC models in that remote vehicle |
| Waiting NPC fares at the kerb, depot dispatchers | local to each browser (cheap); the fare is seen by all once aboard |
| Tubing riders (players) | each rider simulates its own tube from the driver's relayed boat pose and drives a `tow-tube` vehicle, so its normal pose relays the tube to everyone; hook / unhook / points are commands to the driver's SYS.tow entity |
| Tubing NPC riders, ropes, shared score | driver publishes SYS.tow: slots (player id / NPC pose), shared score, gates; every client draws the ropes and NPC tubes from it |

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 0 Foundation (planner) | contracts (`jobs/types.ts`, `defs.ts`, `protocol.ts`, `tubing/types.ts`), stubs, hot-file edits below; `tsc` clean in jobs/tubing | - |
| 1 Pure systems and assets | each issue's tests; `npm test -w games/gnome-theft-auto`, prefabs, achievements, lore | 10 parallel |
| 2 Runtimes | `npm run build -w games/gnome-theft-auto`, tests, smoke, two-client check | 5 parallel |

Issues are files: `docs/roadmaps/gta-sim-jobs-and-tubing/epic-1/*.md`, `epic-2/*.md`; every issue starts by reading
`_env.md`.

## Hot-file edits (planner, additive)

- `src/types.ts`: VehicleKind `'tow-tube'`. `src/config.ts`: `VEHICLES['tow-tube']`. `src/net.ts`: `'tow-tube'` appended
  to VEHICLE_CODES (no new message kinds). `src/online/protocol.ts`: SYS cab 6, pax 7, tow 8 (SYS_COUNT shared with
  water-waves' sea 9). `src/keys.ts`: `jobAction: 'KeyI'`. `src/seats.ts`: `SeatBook.entries()`.
- `src/saveIO.ts`, `src/cloudSave.ts`, `src/saveIO.test.ts`: `gta-jobs-v1`.
- `src/anim/types.ts` (JOB_IDS, JobAnimId), `src/anim/index.ts` (JOB_ANIMS), `src/anim/anim.test.ts` (JOB_IDS), new
  `src/anim/jobs.ts` (hail-cab, carry-parcel, tube-ride, tube-cheer).
- `src/app.ts`: `jobDeps` + `installJobs` / `installTubing` / `registerJobsTrainer` after `net.start`; `jobs.update` +
  `tubing.update` after the taxi; `tubing.drives(v)` branch in the vehicle step chain; job waypoint before the quest's
  (straight line when `direct`); job and tubing blips; `jobPrompt` in the E chain and the HUD prompt; `jobs.onRunOver()`
  in `npcs.onRunOver`; `__gta.jobs`, `__gta.tubing`, `__gta.onlineHub`.
- `packages/prefabs/src/catalog/index.ts`: `GTA_JOBS`, `GTA_JOBS_GEAR`.

## Results (2026-11-23)

All issues landed (Epic 1: 10, of which the planner wrote 1.9 career/surge and 1.10 lore itself while subagent slots
were full; Epic 2: 6). Planner fixes after the epics: the five-star achievement gated to taxi fares; 'tow-tube' added to
`driveGrips.test.ts` NO_CONTROL (riders hold the tube, no steering) and a silent `sound/engines.ts` entry.

Checks: `npx tsc --noEmit` clean in jobs/, tubing/, anim/, app.ts, net.ts; `npx vitest run src/jobs src/tubing` (111
tests) pass; `npm test -w packages/prefabs` and `npm run lore` pass; `bash tools/smoke.sh` (`#gta-job-board`,
`#gta-tube-hud`) SMOKE OK. Not run: `vite build` (shared worktree rule).

`node tools/gta-jobs-mp-e2e.mjs http://127.0.0.1:5442/ ws://localhost:8442/ws` (mp-server PORT=8442, vite 5442 with
hmr off), two headless Edge pages in one room:

```
ok   host goes on duty in a taxi / guest calls a cab to Clay-Mart / host sees the open call
ok   player fare taken on the host (gig player-fare) / the guest cab is assigned
ok   rider boarded the taxi (guest rides in the host cart) / picked up / dropped and paid
ok   host tows from a boat / guest hops on the tube / guest is hooked to the host tow
ok   guest's tube moved 12.3 m behind the boat / host draws the tow rope / guest draws the tow rope
ok   no console errors (0)
all passed
```

Not tested: a real phone, three or more clients, the host leaving mid-tow, the ferry loop and pilot gigs end to end
in a browser (unit-tested only). Failing game tests outside this workstream at the time of the run: layout.golden,
terrainDrive, parks/layoutA, quests (spot in a building), achievements (`hazel-staff` granted twice).

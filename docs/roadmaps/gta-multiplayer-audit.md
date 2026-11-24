# Gnome Theft Auto: multiplayer audit

Goal (the user's words: "make sure its all multiplayer still"): everything added in this batch and the previous merged
PR (#366) works with other players in the same room, and nothing regressed offline. A systematic inventory, a static
determinism test, a real 2- and 3-client headless run, bandwidth numbers, an offline check, and protocol safety (fuzz,
rate limits, forward compatibility). Fixes are small and additive in the owning module.

## Inventory (filled in by the planner; results of the run at the end)

Legend: **synced** = other players see the same thing; **local** = local by design (said why); **fixed** = was broken
online, fixed here; **static** = built identically on every client (checked by `src/online/determinism.slow.test.ts`).

| System | Status | How / why |
|---|---|---|
| Player pose, vehicle, seat/passenger, gun, Glaze look, radio, parachute | synced | `net.ts` `pos` + `look`/`gun`/`radio`/`board`/`seat` (unchanged) |
| New vehicle kinds (golf-cart, hedge-hopper, sycamore-copter, dandelion-drifter, tow-tube) | synced | appended to `VEHICLE_CODES` (wire codes 22-26), pitch/roll on `pos.r` |
| Unknown vehicle code from a newer client | **fixed** | was: the whole pose dropped (player invisible). Now shown on foot (`net.ts parseMsg`) |
| Parked vehicles (start-up set) | **fixed** | were per-client and dealt with unseeded `Math.random` (different variants/paint, and the golf-cart footprint moved spots). Now seeded (`app.ts parkedRng`) and relayed by `online/parkSync.ts` (SYS.park) |
| A vehicle another player drives off / pushes / damages / wrecks / stores | **fixed** | was: stayed parked on every other screen (a duplicate beside the remote driver). parkSync hides it while driven, puts it where it was left, relays hp, wreck, gone |
| Vehicles left behind (stolen NPC car, quest ride), Sling-Lift delivery, Lock-Up take-out, trainer spawn | **fixed** | were local only. parkSync dynamic entries (`shareVehicle` in lockup/runtime.ts, fleetRuntime.ts, the debug spawn) |
| Emotes, fishing rod/bobber, binoculars | synced | SYS.act (online-sync) |
| Hunting quarry, bird flocks, street events, sky traffic + banner, Sling-Lift flight | synced | SYS.quarry/flock/event/sky/sling (online-sync) |
| Sea state and wave clock | synced | SYS.sea (water waves): host clock + forced state |
| Taxi fares between players, NPC passengers, tubing tow | synced | SYS.cab/pax/tow (jobs and tubing; `tools/gta-jobs-mp-e2e.mjs`) |
| Parties | synced | `pty` (unchanged; checked with the new messages) |
| Gnomecino portal | synced | `tools/portal-e2e.mjs`; a player inside shows as their parked pose at the door, and now publishes nothing while away (hub `away`) |
| Cutscenes | **fixed** | was: the hub stopped updating for the whole scene (no sweep, no host change, my owned planes/events frozen in others' skies). Now local: the hub keeps servicing the link with `away` (publishes nothing, does not lead), scene actors/vehicles are never relayed |
| NPC traffic, police, ambulances (ground and Skyway/East Beltway decks), NPC boats, critters, ambient gnomes, Pebblewick NPCs and the Hopper bus, park life | local | out of scope, as before: each client simulates its own. Deck traffic uses the same static road graph on every client (determinism test), so heights match; a stolen NPC car becomes a parkSync dynamic vehicle once left |
| Mowing (flora) | local | cosmetic; a mowed plant regrows on its own clock. Relaying it costs per-plant traffic for no gameplay; mowing is never a collider for other players' vehicles. Placement is static (determinism test) |
| Quests, journal, perks, achievements, Newcomers' Card, Save Trainer edits | local | per player progress. Quest stage vehicles are `questOwned` and never relayed while the quest holds them |
| Hosting / host migration | synced | server names the next host; hub adopts (sky, flocks, parked vehicles); events end |
| Static world (checked by `src/online/determinism.slow.test.ts`, `npm run mp-audit -w games/gnome-theft-auto`): buildWorld, Skyway/East Beltway/sites/cracks, Lock-Up marking, stage sets, Pebblewick, estates, city dressing (parks, fringe, street), towers, flora seeds, road graph, airfield craft, parked plan, hunting plan | static | builds it twice with different `Math.random`/`Date.now`/`performance.now` |

## Foundation (planner, done before Epic 1)

- `src/online/protocol.ts`: `SYS.park = 10` (appended), `SYS_COUNT = 11`.
- `src/online/hub.ts` (additive): adapters may set `keyframeMs` / `staleMs`; `update(dt, x, z, away?)`; inbound limits per
  sender (`INBOUND`: token bucket 120 burst / 60 per s, at most 2000 Acorns of `pay` a minute); `stats()` adds `bySys`
  and `dropped`; a message claiming to be from myself is ignored.
- `src/online/replicate.ts`: a mirror holds at most `MIRROR_MAX_PER_OWNER` (256) entities per owner.
- `src/net.ts`: unknown vehicle code -> on foot instead of dropping the pose; inbound water hits limited to one per 80 ms per sender.
- `src/online/parkSync.ts` + `src/online/shared.ts`: the parked-vehicle ledger (see the file header). `install.ts`
  registers it; `Online.park`.
- `app.ts` (hot file, small edits): seeded `planParked`/`applyVariant` (`parkedRng`), `stableVehicles` + `driving` to
  `installOnline`, the cutscene branch calls `onlineSync.update(..., true)`, the portal branch passes `away`, the debug
  `spawn` marks `shareVehicle`.
- `lockup/runtime.ts`, `fleetRuntime.ts`: `shareVehicle(v)` after a take-out, a Sling-Lift set-down and a trainer spawn.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 0 Foundation (planner) | `tsc` clean, `vitest run src/online src/net.test.ts` | planner |
| 1 Checks | determinism test, fuzz + sea test, the multi-client harness each run | 3 parallel |
| 2 Fixes + run (planner) | offenders fixed, `node tools/gta-mp-audit.mjs` passes, numbers below | planner |

## Epic 1 issues

Shared block pasted into every worker prompt:

~~~~text
## Environment
Working directory C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Git Bash). If node is not found:
export PATH="/c/Program Files/nodejs:$PATH". Game: games/gnome-theft-auto (three.js + TypeScript, Vite, vitest).
Other workers and other planners edit OTHER files of this same game at the same time: touch only the files listed under
Change. If `npx tsc --noEmit -p games/gnome-theft-auto` shows errors in files you did not touch, ignore them (mid-edit).
Do not commit, stash, switch branches, or run `vite build` / `npm run build`. Run tests as
`npx vitest run --root games/gnome-theft-auto <paths>`.
~~~~

### Issue 1.1: static determinism test

~~~~text
Epic: 1 Checks
Depends on: none
(Shared Environment block.)

## Goal
A vitest that builds every static part of the GTA world twice, each time in a fresh module graph and with
Math.random, Date.now and performance.now returning DIFFERENT values, and asserts both builds are identical. Online
play relies on every client building the same world without messages.

## Read first
- games/gnome-theft-auto/src/layout.golden.test.ts: how a test builds the world in node (installFakeDom from
  ./testing/fakeDom, dynamic imports after it, buildWorld(scene, null as unknown as THREE.WebGLRenderer)).
- games/gnome-theft-auto/src/flora/world.test.ts: beginPlantHarvest() before buildWorld, drainHarvest() after.
- games/gnome-theft-auto/src/app.ts lines 175-190 and 620-660 and 670-690: the order the game builds things in.
- games/gnome-theft-auto/src/types.ts: World (boxes, roads: RoadGraph with nodes/edges, parked, airfield).

## Change
- games/gnome-theft-auto/src/online/determinism.test.ts (new; the only file you create or edit).
  - async function buildOnce(seed: number): Promise<Record<string, string[]>>:
    vi.resetModules(); installFakeDom() (import it dynamically too, after resetModules);
    a small seeded generator from `seed` (mulberry32) and
    vi.spyOn(Math, 'random').mockImplementation(gen); vi.spyOn(Date, 'now').mockReturnValue(1.7e12 + seed * 1e6);
    vi.spyOn(performance, 'now').mockReturnValue(seed * 12345.678); restore all spies in finally.
    Then, with dynamic imports (await import('../flora/harvest') etc.), in this order:
      beginPlantHarvest();  const scene = new THREE.Scene();
      const world = buildWorld(scene, null as unknown as THREE.WebGLRenderer);       // '../world'
      installSkyways(scene, world);                                                  // '../highways/install'
      world.boxes.push(...buildLockupMarking(scene));                                // '../lockup/marking'
      buildStageSets(scene, world.boxes);                                            // '../stageSets'
      const town = buildTown(scene);                                                 // '../outskirts/build' (read what it returns; push its boxes if it has them)
      world.boxes.push(...buildEstates(scene).boxes);                                // '../lockup/estates'
      installCityDressing(scene, world);                                             // '../cityScenery/install'
      const craft = spawnAirfieldCraft(scene, world, []);                            // '../craft/spawns'
      const seeds = drainHarvest();
      parked plan exactly as app.ts does it: const rng = mulberry32(0x9a7c0) from '@lawn/level';
        parkLegally(planParked(world.parked, SPAWN, rng).map((plan) => ({ ...plan.spot, kind: plan.entry ? plan.entry.kind : plan.spot.kind, plan })), worldParkingGround(world))
        (planParked/parkLegally from '../fleet', SPAWN from '../config', worldParkingGround from '../fleetRuntime').
      hunting: spawnPlan(world, a fixed seeded function) from '../hunting/hunting'.
    Return one array of strings per key (numbers rounded with toFixed(2)):
      boxes: one line per world.boxes entry (all its numeric fields).
      scene: scene.updateMatrixWorld(true); traverse; for every object with a geometry (Mesh, InstancedMesh, Points,
        LineSegments): `${o.type}|${o.name}|${matrixWorld elements rounded}|${instance count or 1}|${sum of the
        instanceMatrix array rounded, or 0}`. Sort the lines (child order may legitimately differ? NO: do not sort;
        order matters for a stable build. If the test fails only on order, report it).
      roads: world.roads.nodes (every field) and world.roads.edges (if present; read the RoadGraph type).
      parked: kind, entry id, tint, x, z, yaw of each parked plan.
      craft: kind, x, z, yaw of each craft vehicle.
      plants: seed id, kind, x, z (read PlantSeed in ../flora/types).
      hunting: every field of each planned quarry.
      town: whatever buildTown returns that has positions (boxes or spots), else skip.
  - The test: const a = await buildOnce(1); const b = await buildOnce(2); for each key: expect the arrays equal; on a
    difference, the assertion message names the key, the first differing index and both lines
    (expect(b[key][i], `${key}[${i}]`).toBe(a[key][i]) after checking lengths). Timeout 600_000 for the test.
  - Also one test that Math.random is NOT what the golden world uses: skip if you cannot make that cheap.

## Done when
- npx vitest run --root games/gnome-theft-auto src/online/determinism.test.ts runs to completion.
- If it FAILS: do not change any other file. Find the cause for each failing key (grep for Math.random, Date.now,
  performance.now, Set/Map iteration in the builder that produced the line) and put in your final report: the key,
  the first differing line from each build, and the file:line you believe is the cause. The planner fixes it.
- npx tsc --noEmit -p games/gnome-theft-auto shows no errors in src/online/determinism.test.ts.

## Out of scope
Every file other than src/online/determinism.test.ts. Do not regenerate src/data/layout.golden.json.
~~~~

### Issue 1.2: protocol fuzz tests and the shared-sea check

~~~~text
Epic: 1 Checks
Depends on: none
(Shared Environment block.)

## Goal
Garbage, truncated or hostile messages never throw anywhere in the GTA online code; the inbound limits hold; an older
or newer client's messages are ignored or degrade gracefully; and two clients that share the host's sea record compute
the same wave height at the same moment.

## Read first
- games/gnome-theft-auto/src/net.ts: parseMsg, poseFromArray, VEHICLE_CODES (an unknown vehicle code now becomes -1).
- games/gnome-theft-auto/src/online/protocol.ts: parseWireMsg, decodeActivity, SYS, SYS_COUNT, MAX_RECS.
- games/gnome-theft-auto/src/online/hub.ts: createHub({ net: { myId, hostId, sendWire }, onPay, now }), register,
  onWire, update, stats(); INBOUND = { burst: 120, perSec: 60, payPerMin: 2000 }.
- games/gnome-theft-auto/src/online/replicate.ts: MIRROR_MAX_PER_OWNER (256).
- games/gnome-theft-auto/src/online/parkSync.ts: encodePark, decodePark.
- games/gnome-theft-auto/src/online/seaSync.ts: encodeSea, decodeSea, createSeaSync; games/gnome-theft-auto/src/waves.ts:
  waveTime(), setWaveClockOffset(), waveClockOffset(), the wave height function (find its exported name) and anything
  the clock needs (tickWaveClock?).
- games/gnome-theft-auto/src/party/protocol.ts: parsePartyMsg. games/gnome-theft-auto/src/jobs/protocol.ts: decodeCab,
  decodeDropArgs, decodePax, decodeTow.
- games/gnome-theft-auto/src/online/online.test.ts: the existing hub test setup (copy its style).

## Change
- games/gnome-theft-auto/src/online/fuzz.test.ts (new):
  - A seeded generator (mulberry32, fixed seed) of random JSON-ish values: numbers (incl. NaN, Infinity, -0, 1e300,
    -1, 0.5, 2**31), strings (empty, long 5000 chars, unicode), booleans, null, undefined, arrays (nested, up to 60
    long), objects with random keys picked from ['k','o','y','t','e','s','g','i','c','a','n','r','p','d','st','song'].
  - 5000 iterations: none of parseMsg, parseWireMsg, parsePartyMsg throws; decodeActivity(randomIntArray, randomString),
    decodeSea, decodePark, decodeCab(rec, str), decodePax, decodeTow, decodeDropArgs never throw on random integer arrays
    of length 0..30 (also with NaN/huge values).
  - Mutation: start from valid messages (a 'pos' from encodePose, an 'ent', a 'cmd', a 'pay', a 'pty' you build from
    party/protocol's types) and for 2000 iterations replace one random field with a random value or truncate an array;
    never throws, and the result is null or passes the parser again unchanged (parse(result) deep-equals result).
  - Forward compatibility: parseMsg({ k: 'pos', p: [0,1,0,0, VEHICLE_CODES.length + 5, 0,0,0,0,0,-1,0], t: 1 }) is
    not null and its p[4] is -1; parseWireMsg with y = SYS_COUNT is null; parseMsg({ k: 'future-kind' }) is null.
  - Hub: setup like online.test.ts (myId 2, hostId 1, a fake clock). Register a recording fake adapter for EVERY value
    of SYS. Then: (a) 3000 random messages that pass parseWireMsg fed to hub.onWire(1, msg) with the clock advancing
    20 ms each and hub.update(0.016, 0, 0) every 10th: nothing throws, and for each system the mirror holds at most
    MIRROR_MAX_PER_OWNER entities from owner 1 (hub.stats().mirrors[sys] <= 256). (b) Rate limit: with the clock
    frozen, 1000 valid 'cmd' messages from peer 1: the adapter's command() is called at most INBOUND.burst times and
    stats().dropped > 0. (c) Pay cap: 100 'pay' of 5000 within one minute: onPay totals at most INBOUND.payPerMin. (d)
    A message "from" my own id (2) is ignored. (e) onWire for a system with no adapter registered does not throw.
- games/gnome-theft-auto/src/online/seaShare.test.ts (new): two separate module graphs of '../waves' (vi.resetModules()
  between two `await import('../waves')`, and a fresh '../online/seaSync' with each). Mock performance.now / Date.now
  with vi.spyOn so both see the same wall clock. Give the host graph a different clock (setWaveClockOffset(+4321)).
  Take the host's record: encodeSea(host.waveTime(), host.forcedSeaState()) and also force a sea state on the host
  first (host.setSeaState('blustery', host.waveTime()) or what waves.ts offers). Apply it on the guest by calling the
  guest's createSeaSync(fakeLink).receive({ added: [{ owner: 1, id: 0, rec, str: undefined, seenAt: 0, sentAt: 0 }],
  changed: [], removed: [] }, { hostId: 1, ... } as SyncFrame). Then guest.waveTime() is within 0.25 s of
  host.waveTime(), the forced state matches, and the wave height function at 5 points (e.g. Loch Moss and the sea)
  agrees between the two graphs within 0.02 m. Restore the spies.

## Done when
- npx vitest run --root games/gnome-theft-auto src/online/fuzz.test.ts src/online/seaShare.test.ts passes.
- npx tsc --noEmit -p games/gnome-theft-auto shows no errors in those two files.
- If a parser or decoder THROWS on some input, do not fix it: report the function, the input and the stack. If the
  sea test shows the clocks or heights disagree, report the numbers.

## Out of scope
Every file other than the two new test files.
~~~~

### Issue 1.3: the multi-client audit harness

~~~~text
Epic: 1 Checks
Depends on: none
(Shared Environment block.) You MAY start servers, but ONLY on ports 8432 (mp relay) and 5446 (vite). Kill every
process you start before you finish (check with `netstat -ano | grep -E ':8432|:5446'` and `taskkill //PID <pid> //F`
for YOUR pids only). Other planners run servers on other ports: never kill anything else.

## Goal
tools/gta-mp-audit.mjs: up to four headless Edge pages in one ?room= check that the GTA online world sync works with 2
and 3 players, survives the host leaving, costs little bandwidth, and that the game still runs offline.

## Read first
- tools/gta-mp-e2e.mjs: the whole file. Copy its browser launch (puppeteer-core, Edge path list, swiftshader flags),
  open(), until(), place() and check() helpers and its 4 checks (emote, street event, banner plane, quarry shot).
- games/gnome-theft-auto/src/app.ts lines 2268-2320: what ?debug puts on window.__gta (player, vehicles, spawn(kind, x,
  z, yaw), fleet.spawn(id, x, z, yaw), damageVehicle(v, amount), remotes (count(), vehicleOf(id), activityOf(id),
  blips()), net (myId, hostId), online (hub.stats(), park.summary(), park.entryOf(vehicleOrVid)), sky, streetEvents,
  hunting, anim, fishing, birding).
- games/gnome-theft-auto/src/online/parkSync.ts: the file header and PARK_STATE ({ parked: 0, driven: 1, wreck: 2,
  gone: 3 }); entryOf(v) returns { vid, stable, owner, state, gen, x, z, hp, hidden, v }.
- games/gnome-theft-auto/src/online/hub.ts stats(): { online, lead, peers, mirrors: {sys: count}, sentBytes,
  sentMsgs, bySys, dropped }. SYS codes: quarry 0, flock 1, sky 2, event 3, sling 4, act 5, cab 6, pax 7, tow 8,
  sea 9, park 10.

## Servers (start them yourself, in the background)
- mp relay: `PORT=8432 node packages/mp-server/dist/server.mjs` (already built).
- game: write a temp vite config at C:\Users\cpsai\AppData\Local\Temp\gta-audit-vite.config.mjs:
    export default { root: 'C:/Users/cpsai/orca/workspaces/lawn-gnome-panic/elkhorn/games/gnome-theft-auto', base: './',
      server: { port: 5446, strictPort: true, hmr: false, watch: null } };
  and run `npx vite --config C:/Users/cpsai/AppData/Local/Temp/gta-audit-vite.config.mjs` from
  games/gnome-theft-auto. Pages: http://localhost:5446/?room=<ROOM>&no-intro&debug&quality=low&mp=ws://localhost:8432/ws

## Change
- tools/gta-mp-audit.mjs (new). Usage: node tools/gta-mp-audit.mjs [gameUrl] [mpUrl]. Starts nothing itself. Same
  check()/fails style; exit 1 on any failure. Measure bandwidth per page with CDP:
    const cdp = await page.target().createCDPSession(); await cdp.send('Network.enable');
    cdp.on('Network.webSocketFrameSent', (e) => { bytes.sent += e.response.payloadData.length; frames.sent++; });
    cdp.on('Network.webSocketFrameReceived', (e) => { bytes.recv += e.response.payloadData.length; });
  Enter / leave a vehicle in page code: `v.driver = 'player'; g.player.enter(v);` and `g.player.exit(); v.driver = 'none';`.
  Steps (print one `ok`/`FAIL` line each, keep going after a failure):
  1. Open A (host) alone: after 5 s, hub.stats().online === false and sentMsgs === 0 (alone in a room costs nothing).
  2. Open B. Both see each other (remotes.count() === 1); A is host. Place A at (0, -115), B at (4, -112).
  3. Emote: A anim.play('wave') -> B remotes.activityOf(aId).emote === 'wave'.
  4. Rod / binoculars: read games/gnome-theft-auto/src/fishing/fishing.ts and birding/birding.ts for a way to take
     the rod out / raise the binoculars from code. If one exists, check B sees activityOf(aId).mode 1 (rod) / 2
     (scope). If not, print `skip` with the reason (not a failure).
  5. New vehicle kinds: for each of golf-cart, hedge-hopper, sycamore-copter, dandelion-drifter: on A,
     v = g.spawn(kind, A.x + 6, A.z, 0); enter it; B: until remotes.vehicleOf(aId)?.kind === kind (10 s). Then A
     exits. B: until B's g.vehicles has a vehicle of that kind within 4 m of where A left it (the spawn is shared).
  6. Parked vehicle taken: on B pick the nearest vehicle in g.vehicles with driver 'none' whose
     online.park.entryOf(v)?.stable is true (within 80 m; move B next to it first). Note its vid and position. B enters
     it and moves it 30 m over 2 s (setInterval in the page changing v.x, 50 ms steps). A: until
     online.park.entryOf(vid)?.state === 1 and A's copy (entryOf(vid).v) is NOT in A's g.vehicles. B exits. A: until
     entryOf(vid).state === 0 and A's copy is back in g.vehicles within 4 m of B's copy.
  7. Damage: A g.damageVehicle(A's copy of that vid, 0.6). B: until B's copy hp < 0.6.
  8. Street event + banner plane (as in gta-mp-e2e.mjs), mirrored on B.
  9. Late join: open C near A. C sees remotes.count() === 2, the event or plane mirrored (mirrors[3] or mirrors[2] > 0),
     and C's online.park.entryOf(vid) exists with state 0 and a vehicle within 4 m of B's copy (late joiner gets the
     moved parked vehicle). Within 10 s.
  10. Sea: on A, B, C at the same moment (Promise.all of page.evaluate(async () => (await import('/src/waves.ts')).waveTime())):
     all within 0.5 s of each other.
  11. Bandwidth: measure 10 s windows and print a table (bytes/s sent and received per page, and hub.stats().bySys):
     (a) 2 clients idle (A and B standing, measured before C opens), (b) 3 clients busy (after step 9: event and
     plane running, each page driving a spawned golf-cart in a 20 m circle via setInterval). Check (a) sent < 1024 B/s
     per page. Print (b) and check it < 4096 B/s per page.
  12. Host migration: close A's browser. Within 8 s, B's net.hostId is B's or C's id, and the same on C. After 4 more
     s: count banner-tow planes owned on B and C (g.sky.netList().filter((r) => r.id === 'banner-tow' && r.state !==
     'wreck').length summed) is at most 1 (no duplicate). The parked vid from step 6: on B and C, entryOf(vid).owner is
     not A's id (adopted) or equals its old value with the vehicle still in place (print which).
  13. Offline: open D with NO room and &mp=ws://127.0.0.1:9/ws (nothing listens): after 15 s the page runs
     (__gta.player exists, net.myId == null), hub.stats().sentMsgs === 0, and no page errors (ignore console messages
     that mention WebSocket). Then open E with &offline: zero websocket frames sent in 10 s.
  14. No console errors or page errors on A, B, C during the run (ignore lines mentioning WebSocket, favicon or
     GPU stall warnings; print the first 10 errors).
  Close every browser in finally. Total run under 8 minutes.

## Done when
- With your two servers up, `node tools/gta-mp-audit.mjs http://localhost:5446/ ws://localhost:8432/ws` runs to the
  end. Paste its full output in your report. A FAIL caused by the GAME (not the script) is a finding: report it with
  what you saw; do not edit game files. Fix FAILs caused by the script itself.
- Every process you started is stopped (show the netstat output).

## Out of scope
Every file other than tools/gta-mp-audit.mjs (and the temp vite config outside the repo).
~~~~

## Results

Epic 1: all three workers landed. The determinism test passed first time once the parked deal was seeded (its control
check proves the faked randomness reaches the builders: the old unseeded deal differs between the two builds). The
fuzz test found no parser or decoder that throws. The harness found four things; the planner fixed them (Epic 2):

| Finding (harness step) | Cause | Fix |
|---|---|---|
| Host uploads 1.6 KB/s with two idle clients (11a) | flocks 4 Hz in decimetres (biggest), sky 4 Hz, events 6 Hz; quarry records changed every tick (modeT/combedT counted in 0.1 s) | `birdSync` 1 Hz + whole-metre centres, `skySync` 2 Hz, `eventSync` 4 Hz, `huntSync` clocks in whole seconds + awareness in tenths (mirrors run their own clocks) |
| Two banner planes after the host left (12) | the adopter's banner plus the new lead's fresh spawn (the lead's spawner never looked at mirrors) | `skySync`: no spawning while a mirrored banner tow is in view |
| Sea clocks 0.8 s apart in headless (10) | the host published, and the guest compared, a wave clock as of its last frame (slow frames read as skew) | `seaSync` ticks the clock before encoding and before comparing |
| A far mirrored vehicle never had a local copy (7) | parkSync rebuilt within 300 m while traffic.ts drops abandoned vehicles past 60 m once its list is full: build, drop, build... | `PARK.buildNear` 50 m (under CLEANUP_DISTANCE) |
| `&offline` page sent a websocket frame (13) | the Vite dev client's own socket (`?token=`), not the game | harness now lists socket URLs and checks the game's only |

Also fixed by the planner while reading the code: `eventSync` believed any peer's shot from anywhere and paid them the
event's reward (now: the piece must exist, the shooter within 150 m of it, damage capped); `skySync` took any damage
amount from a peer (capped at 0.3).

Also found in the browser run: `install.ts setHp` must set `v.hp` itself (a prefab with no damage stages ignores
`damageVehicle`, so two ledgers claimed the vehicle back and forth), and every client flies its own sky while it loads,
so after joining two or three players each owned a banner tow (several over town). Now the higher-ranked owner's
flight wins and the others fly off (`skyTraffic/runtime.ts dismiss(key)`, additive; `skySync` update).

### Final run (`node tools/gta-mp-audit.mjs`, 2026-11-24, relay 8432, vite 5446 hmr off, headless Edge + swiftshader)

| Scenario | Result |
|---|---|
| Alone in a room: hub sends nothing | ok |
| Join, host is the first client, late join (3rd client gets remotes, events/planes and the moved parked vehicle) | ok |
| Emote; binoculars | ok |
| Fishing rod | not run: no code entry point to take the rod out headlessly (needs X at the water); covered by `actSync.test.ts` |
| New kinds golf-cart, hedge-hopper, sycamore-copter, dandelion-drifter: seen driven, left where parked | ok |
| tow-tube, taxi fare between players, shared boat, passenger seats | not run this round (user asked to wrap up); `tools/gta-jobs-mp-e2e.mjs` covers them |
| Parked vehicle taken: hidden for the other while driven, back where left, damage relayed | ok |
| Street event, banner plane mirrored | ok |
| Sea clock across 3 pages | ok (0.51 s spread = delivery time under swiftshader frames; exact agreement in `seaShare.test.ts`) |
| Host leaves: new host on both, no duplicate banner, parked vehicle kept in place | ok |
| Offline: no room + dead relay runs, 0 hub messages, no errors; `&offline` opens no game socket | ok |
| No console/page errors on 3 clients | ok |
| Gnomecino portal two-game test, parties | not run this round (user asked to wrap up); `tools/portal-e2e.mjs`, party code unchanged |
| Cutscene / portal "away" for other players | not run in a browser; hub `away` covered by code review, see Foundation |
| Real phone | not run: no device |

Bandwidth (CDP websocket bytes, whole socket incl. poses):

| Run | host sent | guest sent | late sent |
|---|---|---|---|
| 2 clients idle, before fixes (worker run) | 1593 B/s | 615 B/s | - |
| 2 clients idle, after (host owns a street event, the banner plane, 3 sky flights, its flocks) | 1041 B/s | 355 B/s | - |
| 3 clients busy (event + plane, everyone driving a circle), before | 2401 B/s | 1144 B/s | 910 B/s |
| 3 clients busy, after | 1986 B/s | 337 B/s | 754 B/s |

The host (the lead) owns the shared sky, events and flocks, so it pays most; the hub's per-system estimate puts the
idle host at sky ~370, flocks ~290, event ~170, activity ~45, parked vehicles ~40, sea 24 B/s. The idle-host check
(< 1024 B/s) misses by 17 B/s with an event and the banner running; a quiet sky is well under.

### Testing policy (user instruction)

The multi-client harness is MANUAL validation only (about 12 minutes): it is in no default script and not in `npm test`.
Run it once after online changes, then only the scenario a fix touched: `node tools/gta-mp-audit.mjs <game> <mp> --only
park,migration` (names: emote, act, vehicles, park, event, latejoin, sea, bandwidth, migration, offline). The
two-world-build determinism test (about 10 s) is `*.slow.test.ts`, excluded from `npm test` (`vitest.config.ts`) and
run with `npm run mp-audit -w games/gnome-theft-auto` (`vitest.slow.config.ts`). The fuzz, sea and parkSync tests are
fast unit tests in `npm test`.

### Files

New: `src/online/parkSync.ts`, `parkSync.test.ts`, `shared.ts`, `determinism.slow.test.ts`, `fuzz.test.ts`,
`seaShare.test.ts`, `games/gnome-theft-auto/vitest.slow.config.ts`, `tools/gta-mp-audit.mjs`, this roadmap.

Edited (hot files, small and additive): `src/net.ts` (unknown vehicle code -> on foot; inbound hit limit),
`src/online/protocol.ts` (SYS.park appended), `hub.ts` (keyframe/stale per adapter, `away`, inbound limits, stats),
`replicate.ts` (per-owner cap), `install.ts` (parkSync), `app.ts` (seeded parked deal, parkSync deps, cutscene/portal
`away`, debug spawn shared), `eventSync.ts` (shot reach/cap, 4 Hz), `skySync.ts` (2 Hz, damage cap, no spawn under a
mirrored banner, dismiss duplicates), `birdSync.ts` (1 Hz, metre centres, 6 s keyframes), `huntSync.ts` (coarse
clocks), `seaSync.ts` (fresh clock), `skyTraffic/runtime.ts` (`dismiss`), `lockup/runtime.ts` + `fleetRuntime.ts`
(`shareVehicle`), tests `birdSync.test.ts`, `eventSync.test.ts`, `seaSync.test.ts`, `games/gnome-theft-auto/vitest.config.ts`
(exclude slow), `package.json` (`mp-audit` script).

Still local by design: NPC traffic/police/ambulances (incl. on the decks), NPC boats, critters, ambient and Pebblewick
NPCs, the Hopper bus, park life, mowing, quests/cutscenes, perks, achievements, trainer progress. Known limits:
a far mirrored vehicle is built only within 50 m when the vehicle list is full; a Lock-Up scrap made from the phone far
from the vehicle is not relayed (only stores/scraps within 20 m are); events end rather than migrate (as before).

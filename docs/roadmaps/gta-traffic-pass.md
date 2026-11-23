# Gnome Theft Auto: traffic pass (lane C)

Goal: ambient traffic that reads as a real town. Cars are seen from far off, keep driving while out of sight (so they come
back where you'd expect), never pop into view, rarely U-turn, and do not drive around broken. Plus four odd, slow,
garden-scale vehicles that join traffic and can be stolen, with lore and a "drive them all" achievement.

Online: traffic is local per browser (net.ts relays only players, their vehicles and looks), so a spawn can only ever be
seen by the local player; the "hidden from every viewer" rule takes a list of viewers anyway.

## Findings

- **Short range.** Traffic was 14 cars kept 25 to 120 m from the player. A car past 120 m was teleported to a random
  road spot 25 to 90 m away, in any direction, in view or not: cars vanished at 120 m and popped in near the player,
  and a car that drove off reappeared coming back (read as a U-turn).
- **Broken NPC vehicles (root cause).** `collideVehicles` (vehicles.ts) charged crash damage by the larger of the two
  vehicles' absolute speeds, not by how fast they closed on each other. NPCs cruise at 55 % of top speed (11 to 19 m/s,
  over `CRASH_MIN` 5), so every graze while queueing, passing or merging cost both cars about 10 % hit points even at a
  closing speed near zero. A headless 3-minute run on an empty grid left NPCs at 83 to 92 % hp. The recycle step then
  moved the same `Vehicle` to a fresh spot without `repairVehicle`, so wear piled up for the whole session until the
  prefab showed its 'dented' and then its 'wrecked' stage (wheel off, smoking) on a car that looked freshly spawned.
- **Broken from the first frame (second root cause, found in the browser).** `app.ts` passed a negative `dt` (about
  -1.3 s) on its first frame; `stepVehicle` "brakes" with `speed - 2 * accel * dt`, so the cars present at load shot
  off at 50-80 m/s into walls and each other and were wrecked before the player moved.
- **Crashes between NPCs.** Drivers had no give-way rule at junctions, rammed stopped cars while pulling out round them,
  and reversed out of jams at full speed into the car behind.
- **U-turns.** Errand routing already forbids a U-turn at the first step, but the teleport recycle above, the
  "nearest node, first link" re-route of a wedged driver and errands that pick a place behind the car (it drives round
  the block to go back) all read as turning around. The Snail-Coach also ping-ponged between its first two stops.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 0 (planner) | `nextLeg` / `freshErrand` in errands.ts, TRAFFIC knobs, the four new `VehicleKind`s in types/config/net | done by the planner |
| 1 | trafficSim.ts, trafficImpostors.ts, errand bias, damage fix, odd-ride prefabs + achievement entry, lore, odd-ride hook; game builds | 7 parallel |
| 2 (planner) | traffic.ts runs live + off-screen tiers with impostors, hidden respawns, repair on respawn; app.ts passes the camera; tests, perf, smoke, demo | planner |

The issues are in `gta-traffic-pass/epic-1/` (environment shared by all of them: `gta-traffic-pass/_env.md`), each sent to
a worker as written:

| Issue | File | Owns |
|---|---|---|
| 1A | `epic-1/1A-traffic-sim.md` | `src/trafficSim.ts` (+ test): off-screen cars, lane poses, hidden spots, population |
| 1B | `epic-1/1B-impostors.md` | `src/trafficImpostors.ts` (+ test): one merged InstancedMesh per kind |
| 1C | `epic-1/1C-errands.md` | `src/errands.ts` (+ `errands.test.ts`): places ahead preferred, bus stop loop |
| 1D | `epic-1/1D-bump-damage.md` | `src/vehicles.ts` `collideVehicles` damage by closing speed (+ `bump.test.ts`) |
| 1E | `epic-1/1E-odd-ride-prefabs.md` | `packages/prefabs/src/catalog/gta-odd-rides.ts`, `gta-sunday-driver` achievement |
| 1F | `epic-1/1F-odd-ride-lore.md` | four lore entries in `docs/lore/entries/apocrypha/` |
| 1G | `epic-1/1G-odd-ride-hook.md` | `src/oddRides.ts`, the `takeWheel` hook in app.ts, handling profiles |

## Epic 2 (planner): what landed in traffic.ts

- Two tiers. Every ambient car is a ghost (trafficSim.ts) out to `simRadius` 460 m, one per 85 m of road (8 to 64 cars).
  The nearest ones within `liveRadius` 150 m (back to ghosts past 175 m, at most `maxLive` 20, at most 2 built per frame)
  are real vehicles; a ghost keeps its `Vehicle` while far, so the same car comes back. Far ghosts are impostors.
- A car appears or is moved only where the camera cannot see it (beyond `hideDistance` 400 m, or outside the view cone
  plus a 0.2 rad margin and at least 45 m away). On a teleport (respawn, taxi) or the first frame, traffic refills anywhere.
  A moved car is a new car: `repairVehicle`. The player stealing a car takes it out of the population.
- Driving: a wedged driver re-routes along the link it faces (no U-turn), drivers give way to crossing traffic at
  junctions, back out of a jam gently and never into the car behind, and edge round a stopped car at a crawl instead of
  ramming it while pulling out.
- Root cause found on the way: the first frame of `app.ts` ran with a negative `dt` (about -1.3 s: the rAF timestamp is
  older than the `performance.now()` that seeded `last`), which drove every car present at load to 50-80 m/s into the
  scenery. `dt` is clamped at 0 now (app.ts and traffic.update).
- `?traffic=odd`: every new car in town is an odd ride (demos).

Not done: buildings are not used as hiding places (spawns only use distance and the view cone, so a hidden spot is
behind the camera or past 400 m); traffic stays local per browser, as before.

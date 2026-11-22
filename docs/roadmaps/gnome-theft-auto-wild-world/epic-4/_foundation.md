# Epic 4 foundation (done by the planner)

What exists before the issues run, so the workers and later epics know where things are. Epics 5 (landforms) and 6
(wildlife) ran in the same tree at the same time; this epic kept to its own files.

## The water model (`games/gnome-theft-auto/src/water.ts`, pure)

- Geometry from the region documents: `COURSES` (the four `water` paths: `river-upper`, `river-ravine`, `canal`,
  `river-farm`) and `BODIES` (the two `water` markers: `water/loch-moss`, `water/puddle-sea`, each a superellipse
  `|dx/a|^4 + |dz/b|^4 <= 1` inside its rectangle). Depths and bank widths per id in `config.ts` `WATER`.
- `terrain.ts` `buildGrid` calls `carveWater(g, N, H, S)` after the road, site and Turfton flatten passes (one hook).
  It works the levels out from that finished ground, walking `WATER.order` (Basin -> loch -> ravine -> canal -> farm
  river -> Puddle Sea): each course's surface is the lowest bank so far minus `WATER.freeboard` (1 m), so it never
  rises; a loch or sea is level, no higher than its feed and below its rim; the canal is level in each pound between
  `WATER.canalLocks` (fractions 0.25 and 0.75, at x of about -94 and 96) and only steps at a lock. Then it carves the
  beds (min with the ground, never raises a vertex) and records a road bridge at every highway crossing.
- **Water is on even in the flat world** (`TERRAIN.amplitude` 0): `terrainFlat()` is false while `WATER.carve` is
  true, so the grid is always built (about 50 ms flat) and `world.ts` takes the chunked-terrain path. Tests that need
  the old dry world call `setTerrainOptions({ water: false })` (`terrain.test.ts` and `terrainDrive.test.ts` flat
  parity now do). `naturalHeightAt` still short-circuits on flat relief (`reliefFlat()`).
- On flat ground every level is -1 (loch, sea, canal, rivers). With Epic 5's tilt the levels follow the ground.
- Bridges (flat world): river-ravine x west (-482, -30), river-ravine x ring-sw (-243, 230), river-upper x ring-nw
  (-64, -395), canal x south (0, 230), river-farm x ring-se (258, 327). Deck = the road height (0 flat).

## API

```ts
// src/terrain.ts (additions)
waterAt(x, z): { surface, depth } | null   // ignores bridge decks; "in the water" = w && y < w.surface
bedAt(x, z): number                        // the grid: river bed / loch floor, also under a bridge deck
heightAt(x, z)                             // now returns the bridge deck on a bridge (so mowers, traffic, the player cross)
setTerrainOptions({ water: false })        // the dry world (TerrainOptions.water, absent = WATER.carve)
// src/water.ts
COURSES, BODIES, bodyRadius(w, x, z), shorePoint(w, angle), onWaterCourse(x, z, margin)  // static, no heights
waterLevelAt, waterBedAt, waterDepthAt, bridgeDeckAt(x, z), bridges(), canalLocks(), courseProfile(id), bodyLevel(id), waterOn()
carveWater(g, N, half, step)               // the hook; tests may call it on a synthetic grid
// src/surfaces.ts: SurfaceKind 'water' (shallow water off a bridge: speed x0.5); checked before asphalt.
```

The getters build the grid on first use through `setWaterSource` (terrain.ts registers it at load), so a module
that imports `water.ts` without `terrain.ts` sees no water (only matters in unit tests).

## Boats and swimming (contracts the issues fill)

- `types.ts`: `VehicleKind` + `walnut-dinghy`, `gravy-boat`, `clog-cruiser`, `watering-can-steamer`, `hoa-patrol-boat`;
  `VehicleSpec.boat`, `.draft`; `Vehicle.boat: BoatState { pitch, roll, vy, slip, beached }`, `.sunk`, `.sunkT`,
  `.home`; `Player.swimming?`.
- `config.ts`: five boat `VEHICLES` (scale 1, prefabs life-size), `WATER` tuning. `net.ts` `VEHICLE_CODES` appended
  (codes 11-15), so boats are relayed online like mowers with no other change; passenger seats from the specs.
- `vehicles.ts`: `createVehicle` sets `home`, and for boats `boat = initBoat(v)` and `y = floatHeight(v)`;
  `stepVehicle` hands boats to `boats.ts stepBoat` (after the exploded branch), returns early for `sunk`, and calls
  `swim.ts checkSink(v)` after a ground move; `syncVehicleMesh` tilts boats by `boat.pitch/roll`.
- `app.ts`: no sim chassis for boats; `checkSink` after the sim step; a sunk player vehicle ejects the gnome with a
  toast; `nearestVehicle` skips sunk ones; `canFire` needs `!player.swimming`; moored boats get `questOwned` (traffic
  never recycles them); each frame `stepIdleBoats`, `boatTraffic.update(dt, player, hats)`, `wakes.update`,
  `stepSunk(vehicles, dt, px, pz, repairVehicle)`.
- `world.ts`: `buildWaterMeshes(scene)` and `buildWaterworks(scene, boxes)` after the biomes; the waterworks' moored
  boats join `world.parked`; both update with the world.
- Stubs (final signatures, trivial bodies): `boats.ts` (works: floats flat, arcade moves), `wake.ts`, `swim.ts`,
  `waterMesh.ts`, `waterworks.ts`, `boatTraffic.ts`; prefab catalog files `gta-boats.ts`, `gta-waterworks.ts`,
  `gta-water-hints.ts` (empty, in `catalog/index.ts`).
- `water.test.ts`: downhill on the shipped ground and on a synthetic tilted, bumpy grid; levels chain; canal steps only
  at locks; the five bridges; the dry switch.

## Added after the workers ran

- `WATER.sourceClear` (16 m): no carving around the river's source, so the Frozen Birdbath Basin stays a whole ice
  bowl (a Black Dew barrel stands at its centre); `onWaterCourse` is false there too.
- `WATER.deckRise` (0.15 m): bridge decks stand a step above the road so the deck top never lies in the bank's plane
  (zfight). Docks stand 0.12 m and wharves 0.3 m proud of the bank for the same reason; the loch and marina docks moved
  2 m further out. Dinghy draft 0.15 and Gravy Boat draft 0.12 (their floors were 3 cm above the water).
- Results: all ten issues passed. `npm run zfight` clean (whole scene), smoke clean at the canal and the loch dock, a
  headless check saw 7 moored and 3 NPC boats floating at surface - draft and the gnome bobbing in the loch.

## For Epics 7 and 8

- Loch Moss: centre (-700, -680), superellipse half axes 150 (x) x 120 (z), level `bodyLevel('water/loch-moss')`
  (-1 flat, about -0.65 with Epic 5's tilt), 5 m deep in the middle, shelving over the outer 35% of the radius. Its
  dock is at (-715, -564) on the south shore (the loch-spur road ends at (-720, -480)); the weir at the ravine outlet
  keeps boats in the loch. Free deep water for a Tessie lair: anywhere with `bodyRadius < 0.6`.
- Boats: `createVehicle(scene, kind, x, z, yaw)` floats any boat kind; drive it with `stepVehicle(v, { throttle, steer,
  lift: 0 }, dt, world)` (boats.ts `stepBoat`); set `driver = 'npc'` and `questOwned = true` for scripted boats (see
  `boatTraffic.ts` `loopRoute` / `steerToward`). `waterAt(x, z)` gives the surface and depth; "in the water" is
  `w && y < w.surface`. A gnome bobbing (`player.swimming`) cannot fire.
- Achievements for boats and water are left to Epic 8 (none added here).

## Golden fixture

Not regenerated (the orchestrator does it once after Epics 4-6). It fails from this epic for known reasons: the world
is now chunked terrain with carved water, scatter on the course is cleared (issue 4I), moored boats join `parked`.
Compare with `GOLDEN_OUT=<path> npx vitest run src/layout.golden.test.ts` in `games/gnome-theft-auto`.

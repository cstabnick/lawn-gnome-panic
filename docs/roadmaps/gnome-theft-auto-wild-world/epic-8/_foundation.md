# Epic 8 foundation (done by the planner)

Integration: radio, achievements, perf, lore, docs, demos. Seven parallel issues (8A-8G); the planner writes the demo
JSONs and the perf drive script after they land (both need 8C's demo params).

## Decided here (contracts shared by several issues)

**Bridge names** (radio 8A, lore 8E, README 8F). The five road bridges over the Everspring and the canal:

| Name | Where | Crossing |
|---|---|---|
| Fellsmelt Bridge | (-64, -395) | upper river under Ring Road North-West, below the Fells |
| Ravine Bridge | (-482, -30) | the Mossy Wood ravine under Highway West |
| Bracken Bridge | (-243, 230) | the ravine river under Ring Road South-West |
| Culvert Bridge | (0, 230) | the Southern Drainage Canal under Highway South |
| Clover Bridge | (258, 327) | the farm river under Ring Road South-East |

**Marinas and docks:** New Puddle Marina (two docks on the Puddle Sea, Cloverfield's south coast, three moored boats);
the Loch Moss dock (-715, -564, the Watering-Can Steamer's stop). Boats: Walnut Dinghy, Gravy Boat, Clog Cruiser,
Watering-Can Steamer, HOA Patrol Boat (Tessie is a vehicle kind too, but not one of "the boats").

**Achievements** (8B defines, 8C hooks up):

| id | Title | Trigger (8C) | Reward |
|---|---|---|---|
| `gta-herd-grapevine` | Herd It Through the Grapevine | critter event `herd-herded` | hand `lasso-sling` (exists) |
| `gta-tipping-point` | Tipping Point | `cow-tipped` | neck `cowbell` (new) |
| `gta-drey-day` | Drey Day | `drey-scattered` | hand `twig-slingshot` (exists) |
| `gta-snow-joke` | Snow Joke | `snowman-smashed` | neck `icicle-scarf` (exists) |
| `gta-unbearably-chill` | Unbearably Chill | `bear-shrug` | head `bear-shades` (new) |
| `gta-bee-line` | Bee Line | `swarm-escaped` | head `beekeeper-hat` (new) |
| `gta-captain-clay` | Captain Clay (target 5) | first time at the helm of each of the 5 boats, remembered in localStorage `gta-boats-helmed-v1` | head `captain-cap` (new) |

**Demo params** (8C adds, the planner's demos use): `?mount=<kind>&mountat=x,z[,yaw]` starts at the wheel of that
vehicle placed at (x, z) (a boat floats there); `?tessie=surface` makes Tessie surface near the player 2.5 s after load
without the quest being done.

**Demo files** (planner): `games/gnome-theft-auto/demos/boat-river-run.json`, `drey-raid.json`,
`tessie-surfacing.json`, `hills-drive.json`. Perf check: `tools/gta-perf.mjs`.

## Measured before the epic (phone viewport 390x844 @2x, headless Edge with GPU, `?offline&no-intro`)

| Spot | Frame avg / p95 ms | Draw calls | Visible terrain meshes |
|---|---|---|---|
| Turfton (0, -115) | 7.4 / 7.0 | 1239 | 431 of 1228 |
| Dust Flats (520, 30) | 6.9 / 7.0 | 423 | |
| Cloverfield (300, 600) | 25.2 / 76.1 (first 4 s) | 442 | 335 |
| Loch Moss dock (-700, -560) | 14.4 / 41.7 (first 4 s) | 249 | |
| Commons (-700, 700) | 6.9 / 7.2 | 201 | 207 |

CPU profile outside town: `npcs.ts` `pickNear` (filters every walk point, and the recycle path retries every frame for
every far gnome) about 5%, `errands.ts` `planRoute` (Dijkstra with a linear scan and a fresh id map per call) about 4-6%.
Issue 8D fixes both and doubles the ground chunk size (a quarter of the terrain draw calls).

## Issues and results

All seven ran in parallel and passed their own checks: 8A Turfton FM (nine wildlife bulletin pairs, four boat and
marina ads, `BRIDGE_TRAFFIC` in the traffic pool), 8B gear and achievements (`gta-wild-gear.ts`: `cowbell`,
`bear-shades`, `beekeeper-hat`, `captain-cap`; seven achievements), 8C hooks and demo params (`src/wildAchievements.ts`,
`?mountat`, `?tessie=surface`, `TessieWorld.demoSurface`), 8D perf (walk-point grid index and recycle back-off in
`npcs.ts`, heap Dijkstra with a cached id map in `errands.ts`, `TERRAIN.chunk` 128), 8E lore (entries
`everspring-bridges`, `new-puddle-marina`; "In the games" on the wild-world and boat entries), 8F docs, 8G synced store
(three same-tick tests; the race did not exist, no fix needed).

## Added after the workers ran

- Golden fixture regenerated (`UPDATE_GOLDEN=1`): only `scene[90].verts` changed (128 m chunks share fewer border
  vertices).
- `docs/lore/settings.md`: `admin-profiler` added to the `none` row (`npm run lore` failed on main without it).
- README intro and AGENT_INDEX row no longer say the corners are empty or the amplitude is 0; the gravy-boat lore entry
  no longer says it is moored on the loch.
- `tools/gta-perf.mjs` (planner): drives a mower (arcade mode) along a route through every region at 390x844 @2x.
- Demos (planner), each recorded as a GIF and checked frame by frame: `boat-river-run.json` (Walnut Dinghy down the
  Mossy Wood river toward the Ravine Bridge; a faster boat or a straight hold beaches on the meanders),
  `drey-raid.json`, `tessie-surfacing.json` (in a dinghy off the dock; she surfaces about 15 m ahead),
  `hills-drive.json` (Zero-Turn north over the Fells hills).

## Measured after (same machine and viewport)

Spot probe: every spot 6.9 ms avg, p95 7.0-7.3 ms (the Cloverfield and loch first-seconds hitches are gone); draw calls
Dust Flats 423 -> 399, Fells 420 -> 400, Mossy 282 -> 240, loch 249 -> 237. Drive (`gta-perf.mjs --speed 60`): avg
6.9-7.2 ms on every leg, at most 2 frames over 50 ms per leg, draw calls avg 151-1105 (max 1416 at the Turfton edge).
The GPU here is a desktop one (frames are vsync-bound); a real phone was not tried.

## Known, not fixed

- The chase camera goes inside a road bridge's deck when a boat passes under it (seen in the river demo; the demo stops
  before the bridge).
- At 844x390 the ammo counter overlaps the Handbrake button (HUD layout, not this epic).
- Fog ends at 320-420 m while ground chunks are drawn to 560 m: lowering `chunkViewDistance` is a possible further cut.

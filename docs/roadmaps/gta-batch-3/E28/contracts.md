# E28 contracts: the second expansion, roundabouts and traffic-hat wardens

What E28 (world expansion II) gives the later batch-3 epics (E29 European kit, E30 the town, E31 the living world, the
story epics). Code: `games/gnome-theft-auto`. World coordinates: +x east, +z south (north is -z), metres. E01's
contracts ([../E01/contracts.md](../E01/contracts.md)) still hold; this file only adds to them.

## The map

- `worldHalf` **1800** (3600 x 3600), perimeter fence at **1795**. `POS_BOUND` (net.ts) = 1850 and `MAP_EXTENT` = 1800
  follow on their own. The terrain grid is 1801 x 1801 at 2 m.
- Regions (13). New:

| region id | name | biome | area (world) | document origin |
|---|---|---|---|---|
| `pardonlin` | Pardonlin | `continental` | x -1800..-1400, z -900..1100 | (-1600, 100) |
| `the-unmown` | the Unmown | `preserve` | x -1800..-200 at z -1800..-1400, plus x -1800..-1400 at z -1400..-900 | (-1000, -1500) |

- Pushed out (borders are now polygons): `north-highlands` (Snowcap Rise) x -1400..1800 at z -1400..-900 plus
  x -200..1800 at z -1800..-1400; `east-campus` (Rootwell) x 900..1800 at z -900..900 plus x 1400..1800 to z 1100;
  `south-shore` (Saltbucket Shore) x -1400..1400 at z 900..1100 plus the whole strip z 1100..1800 (x -1800..1800).
  The `ocean` slot is now (0, 1490) 3580 x 600 and `beach` 3580 x 50 at z 1165 (E11 builds the water to the new edge).
  `west-estates` (Trellisdown) is unchanged.
- Landforms: `gta-continental-relief` (Pardonlin: a 1.5 m swell; paint grass/meadow) and `gta-preserve-relief`
  (the Unmown: swell + hummocks; paint meadow/moss/dirt). Scatter batches `continental-scenery`, `preserve-scenery`.

## Roads

- **Per-highway width.** `config.ts` `Highway.width` (the path's `width`, default 10). Drawing (`world.ts`) and the
  terrain flatten use it. Pardonlin's streets are **7 m**. Keep-out checks still use `ROAD_WIDTH` (10), which is safe.
- **Pardonlin streets** (all in `pardonlin.level.json`, ids `pl-*`): `pl-grand-route` (the Grand Wicket (-1400, -30) to
  the Hatwheel), `pl-rue-haute` (High Street, x ~-1460, z -440..436), `pl-quai-nord` / `pl-quai-sud` (the east quay
  along the Thymes), `pl-avenue-ne` / `pl-avenue-se` (Hatwheel diagonals), `pl-rue-nord`, `pl-rue-a..d` (east-bank
  cross streets at z -430, -305, -165, 107, 256), `pl-north-gate` (North Wicket (-1400, -500) to High Street),
  `pl-pont-nord` (z -300), `pl-pont-neuf` (z -30, from the Hatwheel), `pl-pont-sud` (z 250) (the three bridges, they
  run on to the Left Bank's west lane), `pl-boulevard` (Left Bank, x ~-1700), `pl-rue-ouest` (x ~-1765, a loop),
  `pl-rue-e` / `pl-rue-f`, `pl-route-sud-ouest` / `pl-route-sud` (to the Basin), `pl-quai-bassin` (the Basin Bridge,
  z ~977), `pl-harbour-in` (Harbour Wicket (-1400, 1000) to the Basin).
- **Footpaths** (`trail/`, no traffic): `trail/thymes-walk` (east bank, 18 m off the river line), `trail/rive-gauche`
  (west bank), `trail/jardin-est`, `trail/jardin-ouest` (the Jardin), `trail/unmown-loop`, `trail/reedmere-boardwalk`.
- **Approaches:** `vineyard-lane` (Trellis Cross to the Grand Wicket, between the vineyard and Brassknock Manor),
  `wicket-north-approach` ((-950, -500) to the North Wicket), `harbour-road` (SW ring corner (-950, 990) to the Harbour
  Wicket; in the south-shore document), `unmown-road` (NW ring corner (-950, -950) to (-1400, -1020); north-highlands
  document) and `unmown-lane` (on to the ranger station).
- **Split band roads:** `west-band` now ends at Trellis Cross's east point; `west-band-north` carries on north;
  `west-band-south` starts at its south point. `east-band` ends at the Anthill Ring; `east-band-north` carries on;
  `east-band-south` starts at the ring. Node ids after the old roads changed (golden regenerated).

## Water

- `thymes` (water path, 16 m, `WATER.courses.thymes` depth 1.4, bank 4): (-1620, -880) to (-1600, 1020), its own chain
  (not in `WATER.order`). Bridges are automatic where streets cross; `WATER.bridgeClearance.thymes` = 1.6 m keeps the
  ramps short. Boats fit under but only just.
- `water/pardonlin-basin` (still water, 90 x 60 at (-1600, 1040)).

## Roundabouts: `src/roundabouts.ts`

```ts
export const ROUNDABOUT_PREFIX = 'roundabout/';
export interface Roundabout { id: string; x: number; z: number; r: number; width: number }
export const ROUNDABOUTS: readonly Roundabout[];      // from every road path 'roundabout/<name>' (closed ring)
export function roundaboutAt(x, z, margin?): Roundabout | null;
export function onRing(rb, x, z, margin?): boolean;
export function islandRadius(rb): number;
export function canDrive(from: RoadNode, toId: number): boolean;   // false along a ring the wrong way
export function islandOnLeft(ax, az, bx, bz, cx, cz): boolean;
export function applyRoundabouts(nodes: RoadNode[], rings?): void; // world.ts calls it once
export function createLapWatch(rings?): { step(x, z, dt): boolean };
```

- `RoadNode.ring` (ring id on ring nodes) and `RoadNode.noDrive` (neighbour ids it may not drive to). Links stay
  two-way in `links`; **every driving search must check `canDrive`** (errands `planRoute`/`nextLeg`, `route.ts` A*,
  `traffic.ts` re-route, `trafficSim.ts` ghost placement do; the ambulance and police ignore it on purpose).
- Circulation: island on the driver's left = anticlockwise seen from above with north up (the angle round the centre
  falls). A car entering gives way to ring cars coming toward its entry; ring cars never yield to entering cars.
- To add one: a closed road path `roundabout/<name>` (first point = last), roads ending on its vertices. The rings:
  `roundabout/trellis-cross` (-950, -30) r 16, `roundabout/anthill-ring` (940, 40) r 16, `roundabout/hatwheel`
  (-1555, -30) r 20 (six roads), `roundabout/place-du-pot` (-1500, 450) r 14. Islands: `src/roundaboutIslands.ts`.

## Traffic-hat wardens: `src/trafficDirectors.ts` (+ `trafficDirectorsView.ts`)

```ts
export interface Director { id; label; x; z; yaw; period; clear; offset }
export const DIRECTORS: readonly Director[];          // (60, 0), (-60, -60), (0, 120) in Turfton; (-1462, -30) in Pardonlin
export const STOP_LINE = 9;                            // metres before the junction centre
export function nowSeconds(): number;                  // wall clock: clients agree with no sync
export function setDirectorClock(fn?): void;           // tests
export function directorSignal(d, t): 'a' | 'b' | 'clear';
export function mustStop(d, t, dirX, dirZ): boolean;
export function directorSpeedCap(d, t, dirX, dirZ, remaining, decel?): number;
export function directorAt(x, z, tol?): Director | null;
export function directorFacing(d, t): number;
export function createWaveWatch(directors?): { step(x, z, yaw, speed, t): boolean };
```

Live traffic (`traffic.ts`) and ghosts (`trafficSim.ts`) stop at the line while their road is held. To add a warden,
append to `DIRECTORS` a junction that is a road-graph node (a grid crossing or where two roads share a vertex).

## Sites (new slots)

| id | label | epic | kind | centre | size | ground | anchors |
|---|---|---|---|---|---|---|---|
| `pl-landmark` | the Bean Tower | E30 | venue | (-1520, -366) | 96 x 90 | flat | |
| `pl-grand-place` | the Grand Platz | E30 | park | (-1521, -235) | 90 x 96 | flat | |
| `pl-cafe-row` | Teacup Row | E30 | block | (-1522, 180) | 92 x 110 | flat | |
| `pl-radio-station` | Radio Adagio | E30 | building | (-1662, -100) | 48 x 100 | flat | door (-1686, -100), mast (-1662, -100) |
| `pl-market` | the Beetle Market | E30 | park | (-1733, 180) | 44 x 110 | flat | |
| `pl-jardin` | the Jardin | E30 | park | (-1600, -700) | 370 x 360 | natural | source (-1620, -880), gate (-1415, -520) |
| `pl-harbour` | Basin Quay | E30 | venue | (-1510, 1050) | 80 x 80 | flat | |
| `pl-allotments` | the Little Gardens | E30 | farm | (-1451, 700) | 78 x 360 | flat | |
| `pl-backyards` | Left Bank backyards | E30 | home | (-1750, 660) | 70 x 480 | flat | |
| `unmown-ranger-station` | Unmown Ranger Station | E31 | building | (-1560, -1150) | 50 x 40 | flat | door (-1540, -1130) facing the lane, trailhead (-1560, -1172) |
| `unmown-wetland` | Reedmere | E31 | natural | (-1150, -1650) | 320 x 160 | natural | |
| `unmown-meadow` | the Long Meadow | E31 | natural | (-560, -1640) | 440 x 240 | natural | |
| `unmown-old-wood` | Oldroot Wood | E31 | natural | (-1670, -1560) | 220 x 300 | natural | |
| `unmown-hide-1..3` | Reedmere / Meadow / Wood Hide | E31 | building | (-1050, -1550), (-560, -1490), (-1700, -1330) | 12 x 12 | natural | |
| `rootwell-field-station` | Rootwell Field Station | E31 | natural | (1600, -300) | 240 x 300 | natural | |
| `snowcap-high-tarn` | the High Tarn | E31 | natural | (1000, -1600) | 240 x 160 | natural | |

Not a slot (E28 built them): the Wickets fence, gates and customs huts (`src/pardonlin/wickets.ts`), the roundabout
islands, the Unmown's gate sign and swallowed mower (`src/unmownGate.ts`), the warden podiums.

Pardonlin's town blocks between the streets are free ground for E30 (no slot needed; the scatter keeps trees out of
z -460..470 except along the river).

## Achievements

`gta-band-pardonlin`, `gta-band-unmown` (first entry, through `bandAchievements.ts`), `gta-roundabout-lap` (a full lap
the right way, `createLapWatch`), `gta-hat-wave` (held at a warden's line, then waved on, `createWaveWatch`), wired in
`app.ts`.

## Wasm kernel

The kernel's memory layout is computed at start from the world size; see the 2A notes in the roadmap. Any new region
needs its relief and paint ported into `assembly/kernel.ts` (`evalRegionRelief` / `evalRegionPaint` by
`REGION_PRIORITY` index) and its params uploaded in `gtaWasm.ts`, or the parity test fails.

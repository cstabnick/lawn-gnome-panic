# E14 contracts: race tracks as data, fords, the Knobbly, Capwood

What E14 (dirt, rally and toadstools) gives later epics: E26 street racing (builds on the track registry), E11/E12/E18
(beach run, snow slalom... as track defs), E21 (story rows #40 the Capwood Run, #42 the Rutbottom impound). Code under
`games/gnome-theft-auto/src/`. World: +x east, +z south; yaw 0 faces +z.

## The track registry (`raceTrack/trackDef.ts`, `raceTrack/tracks.ts`)

A race track is a `TrackDef` (data) turned into a `Track` by `createTrack(def)`. Registry:

```ts
export const TRACK_IDS = ['lost-and-found', 'rutbottom', 'capwood-run'] as const;
export type TrackId = (typeof TRACK_IDS)[number];
export const TRACKS: Readonly<Record<TrackId, Track>>;   export const ALL_TRACKS: readonly Track[];
export function trackById(id: string): Track;            // throws on an unknown id
export function trackSurfaceAt(x, z): SurfaceKind | null; // surfaces.ts
export function fordWaterAt(x, z): FordHit | null;        // terrain.waterAt
export function nearTrack(x, z, margin = 0): boolean;     // scatter/settlement keep-out (biomes.ts, settlements.ts)
```

`TrackDef` fields: `id`, `name`, `closed` (circuit) or point-to-point, `width`, `shoulder`, `fade`, `barrierOffset`,
`control: { x, z, lift?, bank? }[]` (centripetal Catmull-Rom through the points; `bank` raises the outside of a corner),
`jumps: { id, name, s, rise, up, down }[]`, `whoops?: { from, to, amp, wave }[]`, `fords?: { id, name, s, len, depth,
dip, reach? }[]`, `gates`, `startOffset` (closed: control 0 to the line; open: the start line's s), `finishPad?` (open),
`surface` (`SurfaceKind`: 'asphalt', 'dirt', ...), `relief`: `'raise'` (sits on a levelled site, lift added on top) or
`'ribbon'` (carved into natural ground: land height averaged over `smooth` m, grade-limited to `maxGrade`, cut/fill
blended over `fade`), `reserve?` (rectangle the track must stay inside; tests), `extraRoads?` (pit lanes).

`Track`: `samples()`, `length()`, `startS()` / `finishS()` (closed: 0 / length; open: startOffset / length - finishPad),
`wrapS`, `sampleAt`, `frame(s, lat)`, `roadLiftAt`, `roadTopAt` (absolute, after the terrain is built), `locate(x, z,
reach, hint, window)`, `onRoad`, `onTrack`, `surfaceAt`, `gates()`, `tracker()` (`TrackGateTracker.update(dt, x, z)` →
'start' | 'gate' | 'lap'; on an open track 'lap' is the finish), `gridSlot(slot)`, `applyRelief(g, N, H, S)`,
`bounds()`, `fordAt`. `raceTrack/track.ts` keeps the Speedway's old free functions (bound to `SPEEDWAY`).

**Adding a track** (E26 and others): write `raceTrack/defs/<name>.ts`, add the id to `TRACK_IDS` and `TRACKS`, keep
`raceTrack/tracks.test.ts` green (samples, gate order, a lap counted, grid on the road, barriers never cross, inside
`reserve`). Terrain relief, surfaces, scatter keep-out and the map line come for free. A street circuit on existing
roads would want a `relief` that leaves the ground alone: add `'none'` to the union in `trackDef.ts` (skip
`applyRelief`) — not needed yet, so not built. Costs: every registered track is checked by `surfaceAt`/`fordAt` per
vehicle per frame (a bounds test first, then a grid `locate`).

## Races on any track (`quests/types.ts`, `quests/objectivesRace.ts`, `raceTrack/raceAi.ts`, `raceTrack/autopilot.ts`)

- `race` objective: `trackId?: TrackId` (default `'lost-and-found'`), `timeAchievement?: { seconds, id }` (unlocked on
  a qualifying finish under `seconds`). Open tracks: `laps: 1`; the HUD shows checkpoints instead of laps. The podium
  cutscene plays only at the Speedway.
- `spawnRival(scene, vehicles, def, kind, slot, track = SPEEDWAY)`, `Rival.track`; autopilot functions take a last
  `track` argument; the quest-sim race solver uses the objective's track.
- `buildDirtTrackSurface(scene, track, { prefix, road?, runoff? })` (`raceTrack/trackMesh.ts`): draped road, run-off,
  start/finish line and grid boxes for any track.

## Fords and Cap-water (`terrain.ts`, `waterlog.ts`)

`WaterHit.ford?: boolean`: `waterAt` returns ford water from `fordWaterAt` where no other water is. `stepWaterlog`
soaks only up to `WATERLOG.fordCap` (0.3, under `sputterAt` 0.35) in a ford: a car slows but never sputters, floods or
stalls (lore R-185). `surfaces.ts` reports 'water' there. Any track def can have fords.

## The Knobbly (`'dirt-bike'`)

`VehicleKind` `'dirt-bike'`, `VEHICLES['dirt-bike']` "Knobbly Dirt-Mower" (maxSpeed 27, accel 22, turnRate 3.1), prefab
`dirt-mower-bike` (`packages/prefabs/src/catalog/lawn-prix.ts`), handling profile, two-stroke engine sound, online code
appended to `net.ts` `VEHICLE_CODES`, dealer stock (650). Not glazeable (no Pay 'n' Glaze rig). Two parked at the Dirt
Bowl gate (1030/1034, -672). Lore R-187.

## Places

| place | code | fixed spots |
|---|---|---|
| Rutbottom Dirt Bowl (site `dirt-track`, now centre (1200, -650), 400 x 260) | `rutbottom/` (`createRutbottom`), track `defs/rutbottom.ts` (1.22 km) | `rutbottom/spots.ts`: `STARTER_TOWER`, `CLARY_SPOT`, `TEASEL_SPOT`, `PITS`, `BOWL_GATE`, `PIT_GAP`, `GRANDSTAND` |
| Capwood (site `toadstool-forest`) | `capwood/forest.ts`, `capwood/forestPlan.ts` | `capwood/spots.ts`: `WARDEN_HUT` (360, -1245), `GREAT_RING` (150, -1125), `CAP_COUNT_SPOTS`, `ROUTE_CLEARANCE` |
| the Capwood Run (site `rally-route` paddock) | `capwood/run.ts`, `capwood/runPlan.ts`, track `defs/capwoodRun.ts` (2.73 km) | start line s 36 near (90, -746); fords the Gill Ford s 2244, Spore Splash s 2411; finish s 2707 near (140, -1288) |

`dirtCountry/index.ts` composes the three area modules for `app.ts` (`Area { update, blips }`). Homes registered:
`clary` (starter's tower), `chanterelle` (stalk hut).

## Quests, givers, achievements

| quest id | giver id | unlocks after (until E21 re-times; the "2 side quests per beat" test picked the beats) | achievement |
|---|---|---|---|
| `race-rutbottom-knobbly` | `rutbottom-clary` | `ch2-sprinkler-gauntlet` | `gta-dirt-rookie` |
| `sq-rutbottom-heats` | `rutbottom-teasel` | `ch4-runway-flares` (+ the Knobbly Heat) | `gta-dirt-champion` |
| `race-capwood-open` | `capwood-lulu` | `ch4-sandpit-drop` | `gta-rally-finish`, gold time (175 s) `gta-rally-gold` |
| `sq-capwood-cap-count` | `capwood-warden` | `ch5-even-cut` (+ the Open Stage) | `gta-cap-count` |

Capwood itself unlocks `gta-toadstool-trail` (the Great Ring after dark). Story epics: E21's #40 m40-the-capwood-run can
be a `race` with `trackId: 'capwood-run'`; #42 m42-rutbottom-impound a `race` with `trackId: 'rutbottom'`; then move the
side-quest unlocks above to #40 / #42 as `side-quest-schedule.md` says.

Quests live in `quests/dirtRaces.ts`, stages in `quests/stages/dirt.ts`; rival cast in lore `the-rutbottom-regulars`.
The Speedway podium cutscene is Speedway-only (`questSim/checks.ts` skips it for other tracks).

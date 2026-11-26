Epic: E33 mountain routes, wave 1 (geometry). Worker: Sonnet (route design).
Depends on: none (the lead's foundation is in place)

## Environment
Read `docs/roadmaps/gta-batch-3/E33/_common.md` first (environment, the mountain-route API, places and numbers, rules).

## Goal
Design the three Hatbrim routes for real: replace the rough stub lines of the Brim Gap Road, the Hatband and the Brim
Walk with hand-made control points that sit right on the mountain, add their pads and named spots, and prove it with a
geometry test and drive-along tests. This is the creative heart of the epic: make each route feel designed (a road that
reads as a proper Alpine pass, a shelf with a real drop, a ridge walk with views), not a polyline.

## Read first
- `games/gnome-theft-auto/src/mountainRoutes/types.ts`, `routes.ts`, `pads.ts`, `driveAlong.ts`, `defs/*.ts`
- `games/gnome-theft-auto/src/raceTrack/trackDef.ts` (TrackDef fields; `applyRelief` for 'ribbon')
- `games/gnome-theft-auto/src/raceTrack/defs/capwoodRun.ts` and `src/raceTrack/capwoodRun.test.ts` (a carved mountain
  route and its tests: grade, cut/fill, clearances)
- `games/gnome-theft-auto/src/data/landscape.json` (the three Hatbrim features at the end)

## Tools for seeing the land
- Heights: write a throwaway test (delete it before you finish) that calls `heightAt` / `naturalHeightAt` from
  `src/terrain.ts` over a grid and writes a table to a file under your scratch folder with
  `import(/* @vite-ignore */ String('node:fs')).then((m: any) => m.writeFileSync(path, text))` (console output is
  swallowed by the vitest config). `naturalHeightAt` is the land before roads, sites and routes.
- A top-down PNG: `MAPDUMP=<file.png> MAPDUMP_MPP=2 npx vitest run src/terrainMap.probe.test.ts` (from
  `games/gnome-theft-auto`) renders the whole world (north up); a crop of your own (copy the file to a throwaway test) is
  easier to read; you can view PNGs with your Read tool.

## Change
- `src/mountainRoutes/defs/brimGapRoad.ts` — `BRIM_GAP_ROAD.control` (and `lift`/`bank` where it helps), keep id, name,
  kind 'road', width 7, surface 'asphalt', relief 'ribbon'; tune `maxGrade` (<= 0.10), `smooth`, `shoulder`, `fade`.
  Fill `BRIM_GAP_SPOTS` with at least: `start`, `end`, `hairpin1`..`hairpinN` (apex of each hairpin, yaw = the outside
  direction), `cafe` (where the Top Hat café building stands, on its pad, yaw facing the view), `lookout` (the viewpoint
  railing edge of the café pad, facing the view), `picnicHairpin` (a hairpin with room beside it for an abandoned
  picnic), `camperHairpin` (a hairpin where a camper can sit stuck on the outside verge), `tarnLayby` (a lay-by on the
  descent by the High Tarn).
- `src/mountainRoutes/defs/hatband.ts` — `HATBAND.control` etc. (kind 'track', width 4, surface 'gravel'). Fill
  `HATBAND_SPOTS` with at least `gateWest` (the bollard gate where it leaves the road at Brim Gap), `gateEast` (where it
  rejoins the road), `worldsEdge` (the lookout over the north fence), `passingPlace`, `scree` (a spot on the outer verge
  where a rockfall has come down).
- `src/mountainRoutes/defs/brimWalk.ts` — `BRIM_WALK.control` etc. (kind 'trail', width 2.5, surface 'dirt'). Fill
  `BRIM_WALK_SPOTS` with at least `stile` (the start, at Mittenholt's edge), `pateCairn` (Old Pate's top), `gapCrossing`
  (where it crosses the Brim Gap Road), `summit` (the Bobble's top: the summit cairn and Summit Register stand here),
  `bothy` (Pate's Bothy, a small stone hut beside the path on the ridge between the gap and the summit, on level ground),
  `tarnEnd` (the end by the High Tarn's bothy), `ridgeBench` (a bench with a view on the ridge).
- `src/mountainRoutes/defs/hatbrimPads.ts` — `HATBRIM_PADS`: at least `cafe-terrace` (route 'brim-gap-road', at Brim
  Gap, about 28 x 18 m, for the café, a few parked cars and the lookout; surface 'asphalt'), `tarn-layby` (beside the
  road near the tarn), `worlds-edge` (route 'hatband'), `summit-platform` (route 'brim-walk', about 8 x 8 m, surface
  'rock'), `bothy-terrace` (route 'brim-walk', for Pate's Bothy, about 8 x 7 m, surface 'dirt').
- `src/data/landscape.json` — you may adjust ONLY the three Hatbrim features (`mountain/the-bobble`, `mountain/old-pate`,
  `ridge/hatbrim`: points, r, h; keep their ids and seeds; keep every height under 125 m) if the mountain needs a steeper
  cone for the Hatband or a cleaner gap. Do not touch any other feature or the params.
- New test `src/mountainRoutes/hatbrim.geometry.test.ts` (yours).

## Design brief per route
The Brim Gap Road (two-way asphalt pass road):
- Starts on the `north-band-east` centre line between x 630 and 700 (east of Mittenholt, at least 80 m from (550, -1375))
  and ends on it between x 860 and 1000; both end points within 1 m of the centre line, and the first and last 15 m leave
  the band road at an angle of at least 45 degrees to it.
- Climbs Old Pate's west and north-west face in **5 to 8 hairpins** (a hairpin: the road turns through more than 150
  degrees within 45 m) to Brim Gap, crosses the gap (the café pad beside it, the road nearly level there: grade under 0.04
  for 30 m), then descends the east side to the High Tarn's west shore (in 2 to 4 more bends or hairpins) and runs back
  south to the band road. Length 1.4 to 2.4 km. Highest point at least 34 m.
- Every `curv` <= 0.09 (radius >= 11 m), the road grade (from `roadTopAt` of neighbouring samples) <= 0.10 everywhere,
  switchback legs at least 24 m apart centre to centre except within 20 m of a hairpin apex.
- Cut and fill: the road top stays within 7 m of `naturalHeightAt` along its centre line (no trench, no dyke).
- Clear: at least 15 m from the tarn water, 80 m from Mittenholt's centre, 15 m from `trail/high-tarn-path`, and away
  from the Hatband and the Brim Walk except where they are meant to meet (the gates and the gap crossing).

The Hatband (gravel shelf for bikes and buggies):
- Leaves the Brim Gap Road at Brim Gap (its first point within 2 m of the road's edge, by the café pad) and climbs onto
  the Bobble's cone, contours round its west and north faces at roughly 55 to 80 m up (the World's Edge lookout pad on
  the north side, looking north over the fence), round the east face and back down to the Brim Gap Road's east descent
  (its last point within 2 m of the road's edge). A through route, not a dead end. Length 0.7 to 1.4 km.
- Grade <= 0.16, `curv` <= 0.12, width 4. The cliff edge is its character: on at least 40 % of its length, the ground
  8 m outside its outer edge (the downhill side) is at least 4 m below the road top. Cut/fill within 8 m.

The Brim Walk (footpath):
- From a stile at Mittenholt's east edge (within 90 m of (550, -1375), at least 12 m from the Brim Gap Road) up Old Pate
  (passes within 10 m of its highest ground), down to Brim Gap where it crosses the Brim Gap Road once, roughly at right
  angles, beside the café pad; up the ridge past Pate's Bothy to the Bobble's summit (within 8 m of the highest ground),
  crossing the Hatband once; down the east side to the High Tarn's bothy, ending within 6 m of (1072, -1562) (the end of
  `trail/high-tarn-path`) and at least 12 m from the tarn water. Length 1.5 to 2.6 km.
- Grade <= 0.45 (it is a mountain path: zig-zags on the steep bits), `curv` <= 0.25.

## Contract
Keep every exported name and type in the defs files exactly (`BRIM_GAP_ROAD`, `BRIM_GAP_SPOTS`, `HATBAND`,
`HATBAND_SPOTS`, `BRIM_WALK`, `BRIM_WALK_SPOTS`, `HATBRIM_PADS`), the route ids, kinds, widths and surfaces. Spot names
listed above are used by the dressing issues in the next wave: provide every one of them. Pad ids listed above likewise.

## Done when
- `npx vitest run src/mountainRoutes/hatbrim.geometry.test.ts` passes, and it checks every rule above (ends on the band
  road, hairpin count, curvature, grade, cut/fill, clearances, the Hatband's drop share, the walk's summits and end,
  every spot and pad present and within 30 m of its route; pads do not overlap another route's road).
- In the same test file, drive-along (`driveAlong` from `./driveAlong`): `'ride-on'` and `'lowrider'` on the Brim Gap
  Road both ways in the right lane (`lane: 1.75`): `reached`, `maxLat < 3`, `maxStall < 4`, `maxSink < 0.3`, not
  `flipped`; `'dirt-bike'` on the Hatband both ways (lane 0): the same limits with `maxLat < 1.8`.
- `npx vitest run src/raceTrack src/landforms.test.ts src/terrain.test.ts src/settlements.test.ts src/sites.test.ts
  src/wasm` still pass.
- `npx tsc --noEmit -p .` clean in your files. Your throwaway probe tests are deleted.
- Report: each route's length, highest point, hairpin count, and the spot coordinates.

## Out of scope
`defs/spineCut.ts` (another worker), every other file under `src/mountainRoutes/` (graph, surface, rails, dressing),
`raceTrack/*`, `terrain.ts`.

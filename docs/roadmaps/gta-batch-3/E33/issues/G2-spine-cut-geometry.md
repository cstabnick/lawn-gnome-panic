Epic: E33 mountain routes, wave 1 (geometry). Worker: Sonnet (route design).
Depends on: none (the lead's foundation is in place)

## Environment
Read `docs/roadmaps/gta-batch-3/E33/_common.md` first (environment, the mountain-route API, places and numbers, rules).

## Goal
Design the Spine Cut for real: a two-way asphalt road from the north band road, through a gorge cut in the Highland
Spine (under the Keyhole, a rock arch the dressing issue will stand over the deepest part), and out across the moor
south of Pinwheel Ridge to the east band road. Replace the stub line, add its pads and spots, prove it with a geometry
test and a drive-along test. It should feel like a road engineers fought the ridge for: a long straight approach, a
sweeping bend into the cut, walls of rock on both sides, then the open moor.

## Read first
- `games/gnome-theft-auto/src/mountainRoutes/types.ts`, `routes.ts`, `pads.ts`, `driveAlong.ts`, `defs/spineCut.ts`
- `games/gnome-theft-auto/src/raceTrack/trackDef.ts` (TrackDef fields; `applyRelief` for 'ribbon')
- `games/gnome-theft-auto/src/raceTrack/capwoodRun.test.ts` (how a carved route is tested)
- `games/gnome-theft-auto/src/data/landscape.json` (feature `ridge/highland-spine`; do not change it)

## Tools for seeing the land
- Heights: write a throwaway test (delete it before you finish) that calls `heightAt` / `naturalHeightAt` from
  `src/terrain.ts` over a grid and writes a table to a file with
  `import(/* @vite-ignore */ String('node:fs')).then((m: any) => m.writeFileSync(path, text))` (console output is
  swallowed). `naturalHeightAt` is the land before roads, sites and routes.
- A top-down PNG: `MAPDUMP=<file.png> MAPDUMP_MPP=2 npx vitest run src/terrainMap.probe.test.ts` (from
  `games/gnome-theft-auto`); you can view PNGs with your Read tool.
- Land heights today (m), rows z, columns x:
  ```
         x: 425 450 475 500 525 550 575 600 625 650
  z-1250:    2   1   1   2   4   3  11  15   9   4
  z-1225:    2   2   2   4   3  12  23  29  23   8
  z-1200:    2   2   3   6  14  23  27  26  21  10
  z-1175:    0   5  12  18  21  26  25  17   9   4
  z-1150:    6  17  24  28  24  20  16   8   2   3
  z-1125:   12  28  29  29  21  10   5   2   2   3
  z-1100:    7  25  28  21   9   2   2   2   3   4
  ```
  The moor east of the spine (x 600..950, z -1150..-950) is flat at 2 to 6 m.

## Change
- `src/mountainRoutes/defs/spineCut.ts` — `SPINE_CUT.control` (and `lift`/`bank` if useful); keep id, name, kind 'road',
  width 7, surface 'asphalt', relief 'ribbon'; tune `maxGrade` (<= 0.08), `smooth`, `shoulder`, `fade` (a smaller fade
  gives steeper gorge walls; the rock paint comes by itself on steep slopes). Fill `SPINE_CUT_SPOTS` with at least
  `start`, `end`, `keyhole` (the centre-line point where the cut is deepest: the arch stands over it; yaw = the road's
  direction there), `gorgeIn` and `gorgeOut` (where the cut walls begin and end, at least 3 m high), `rockfall` (a verge
  spot inside the gorge for a rockfall vignette), `moorBend` (a bend on the moor), `surveyor` (a spot beside the
  Keyhole pull-in where a surveyor stands looking at the arch). Fill `SPINE_PADS` with at least `keyhole-pullin` (a
  lay-by just outside the gorge mouth with a view of the arch, about 20 x 8 m, surface 'gravel') and `moor-layby`
  (about 18 x 7 m, surface 'gravel').
- New test `src/mountainRoutes/spine.geometry.test.ts` (yours).

## Rules
- Starts on the `north-band-east` centre line between x 420 and 600 (its segment (400,-1330)->(700,-1295)); ends on the
  `east-band-north` centre line between z -880 and -1080 (its segment (950,-850)->(1060,-1100)). Both end points within
  1 m of the centre line; the first and last 15 m leave the band road at an angle of at least 45 degrees.
- Crosses the Highland Spine in a cut: at least 80 m of road where the land on both sides, 10 m out from the centre
  line, stands at least 10 m above the road top, and the deepest point at least 16 m.
- Length 0.7 to 1.3 km. Every `curv` <= 0.05 (radius >= 20 m), grade <= 0.08.
- Fill: the road top never more than 4 m above `naturalHeightAt` (it is a cut, not an embankment).
- Clear (at least 20 m from the road edge): the Capwood site (x 100..400, z -1280..-1080), the Pinwheel Ridge site
  (x 700..1000, z -1245..-1155) and its trails (z about -1252), Mittenholt (550, -1375, r 75), the Capwood Run
  (`TRACKS['capwood-run']` from `../raceTrack/tracks`: no sample within 30 m).

## Contract
Keep `SPINE_CUT`, `SPINE_CUT_SPOTS`, `SPINE_PADS` exported with these names and types, the id, kind, width and surface.
The spot and pad names above are used by the dressing issue in the next wave: provide every one of them.

## Done when
- `npx vitest run src/mountainRoutes/spine.geometry.test.ts` passes and checks every rule above, every spot and pad
  present (each within 30 m of the road), the pads off the road.
- In the same file, drive-along (`driveAlong` from `./driveAlong`): `'ride-on'` and `'lowrider'` both ways in the right
  lane (`lane: 1.75`): `reached`, `maxLat < 3`, `maxStall < 4`, `maxSink < 0.3`, not `flipped`.
- `npx vitest run src/raceTrack src/capwood src/settlements.test.ts src/sites.test.ts` still pass.
- `npx tsc --noEmit -p .` clean in your files; throwaway probes deleted.
- Report: length, cut depth and length, the Keyhole spot, pad positions.

## Out of scope
The Hatbrim defs (`brimGapRoad.ts`, `hatband.ts`, `brimWalk.ts`, `hatbrimPads.ts`), `landscape.json`, every other file
under `src/mountainRoutes/`, `raceTrack/*`, `terrain.ts`.

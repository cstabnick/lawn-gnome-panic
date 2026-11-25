Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: general-purpose (Sonnet): terrain, the mound road and the Dean's Leap tuning

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
The Anthill reads as a giant ant mound and plays well: its summit is flat for the observatory, its ground is painted
earth (not lawn), a dirt road (`trail/anthill-road`) spirals up it at a drivable grade from the east-band road to the
summit, and Dean's Leap (stunt ramp `deans-leap` on the north rim) launches a car into a long, satisfying jump that lands
on the mound's north slope. A test proves all of it.

## Background (confirmed)
- Relief: `src/terrain.ts` `naturalHeightAt(x, z)` = amplitude (1) x (tilt + region landform relief + macro landscape) with
  the region documents' `stamps` applied (`packages/level/src/stamps.ts applyStamps`: `{ op: 'flatten', x, z, inner, outer,
  to }` blends the height to `to` inside `inner`, back to natural by `outer`; `{ op: 'gauss', x, z, sigma, amount }`).
  Document stamps are in region-local coordinates (east-campus origin (1150, 0): world x = local x + 1150). The macro
  hill `hill/observatory-mound` (`src/data/landscape.json`: point (1240, 150), r 120, h 45) makes the mound; the site
  `observatory-mound` is `flat: false`, so nothing levels it. `heightAt` = the built grid (roads, trails and flat sites
  flattened on top of the natural height).
- Trails: a region document `paths` entry with `kind: 'road'` and an id starting `trail/` is an off-road dirt trail
  (no traffic, painted dirt by `src/terrainPaint.ts`, flattened across its width with the target = natural height on its
  centre line, so its grade follows the natural ground along it). Example: the `trail/` paths in
  `src/data/levels/frostbite-fells.level.json` or `north-highlands.level.json` (search for `"trail/`).
- Paint: `src/landforms/eastCampus.ts` `paint()` returns 'grass' everywhere today. The Wasm kernel
  (`assembly/kernel.ts`, function that branches on `reg == 9` for east-campus, around line 1156; feature kind codes in
  `src/wasm/gtaWasm.ts LF_KIND_CODE`) mirrors every region's paint and must stay in parity: E12 did exactly this for
  Snowcap Rise (`src/landforms/northHighlands.ts paint()` with `pond`/`snowfield` features, kernel `reg == 7` branch,
  codes 6 and 11). Paint codes in the kernel are PAINT_KINDS index + 1 (`src/landforms/types.ts`: rock 1, dirt 2,
  gravel 3, mud 4, ice 5, snow 6, sand 7, grass 8, farm 9, forest 10, moss 11, meadow 12). Rebuild the kernel with
  `npm run build:wasm -w games/gnome-theft-auto` (writes `src/wasm/kernelBytes.ts`).
- The ramp: `src/stunts.ts` `STUNT_RAMPS` has `{ id: 'deans-leap', name: "Dean's Leap", x: 1238, z: 126, yaw: Math.PI,
  width: 8, length: 18, height: 4.5, biome: 'campus' }` (yaw PI launches north, toward the campus). The wedge's height
  is added to `heightAt` under each vertex, so on the flat summit it is a clean wedge; the lip end is at along =
  +length/2 (z = 117). Driving: `src/ramps.ts` (`rampContactAt`, `rampSlope`), arcade launch in `stunts.ts`:
  `v.vy = |speed| * sin(rampSlope) * RAMP_LAUNCH.arcadeBoost` (1.4), then the vehicle falls under the game's gravity
  (find the arcade vehicle gravity constant in `src/vehicles.ts` or `src/config.ts`, e.g. grep `GRAVITY`/`gravity`);
  physics-chassis cars ride the wedge with their wheels (`src/airtime.test.ts`, `src/sandpitJump.test.ts` show how jumps
  are tested). Landing feel (floaty landing, bounce) is E02's and is not changed here.
- Contract places (`src/campus/types.ts` `OBSERVATORY`): summit (1240, 150), `flatR` 30, dome (1258, 158) r 9,
  `runUp` from (1238, 182) to (1238, 135), `leapClear` x 1212..1264, z 20..118 (landing area: no props), `roadStart`
  (948, 110) at the `east-band-south` road, `roadEnd` (1238, 182) on the summit, `antDoors` at the foot. The site
  `construction-3` (another epic's) is x 1020..1080, z 220..280: keep the road out of it.

## Read first
- `games/gnome-theft-auto/src/campus/types.ts` (`OBSERVATORY`).
- `games/gnome-theft-auto/src/landforms/eastCampus.ts` and `src/landforms/northHighlands.ts` (the feature pattern).
- `games/gnome-theft-auto/assembly/kernel.ts` (the `reg == 7` and `reg == 9` paint branches) and
  `src/wasm/gtaWasm.ts` (`LF_KIND_CODE`).
- `games/gnome-theft-auto/src/stunts.ts` (`STUNT_RAMPS`, `RAMP_LAUNCH`, the arcade launch in `createStunts`) and
  `src/ramps.ts`.
- `games/gnome-theft-auto/src/data/levels/east-campus.level.json` (`stamps`, `paths`, `data.terrain`).

## Change
- `src/data/levels/east-campus.level.json` (keep its exact JSON format; only these keys):
  - `stamps`: one `flatten` at local (90, 150) with `inner` 30, `outer` 42 and `to` = the natural summit height
    (measure `naturalHeightAt(1240, 150)` before adding the stamp, round to 0.1).
  - `data.terrain.features`: add `{ "id": "anthill/the-anthill", "kind": "anthill", "points": [[90, 150]], "r": 112 }`.
  - `paths`: `trail/anthill-road`, `kind: 'road'`, `width` 7: from `roadStart` east and round the mound in a rising
    spiral (about 1 to 1.5 turns, points every ~15-25 m, local coordinates) to `roadEnd`. The grade along it, measured on
    the built ground (`heightAt`) every 2 m, is at most 16 degrees (rise/run <= 0.287) everywhere, and at most 10 degrees
    for its last 30 m onto the summit. It must stay outside `leapClear`, at least 6 m from each `antDoors` point, at least
    4 m outside the dome circle, out of `construction-3`, and inside the map.
- `src/landforms/eastCampus.ts` `paint()`: inside an `anthill` feature: within `flatR` + 2 (32 m) of its point 'gravel'
  (the observatory forecourt), else within its `r` 'dirt'; everything else stays 'grass'. Comment that the kernel
  mirrors it.
- `src/wasm/gtaWasm.ts`: `LF_KIND_CODE` gains `anthill: 13`.
- `assembly/kernel.ts`: the east-campus (`reg == 9`) branch mirrors the paint exactly (gravel code 3, dirt code 2, grass
  8), reading kind-13 features like the `reg == 7` branch reads its features. Rebuild `src/wasm/kernelBytes.ts` with
  `npm run build:wasm -w games/gnome-theft-auto`.
- `src/landforms.test.ts` `PROMISED_PAINT['east-campus']`: `['grass', 'dirt']` (only if the test needs it to keep
  sampling honest; keep the format).
- `src/stunts.ts`: only the `deans-leap` entry's numbers may change (keep id, name, biome, yaw PI and the ramp on the
  summit flat with its lip near the north rim, x within 1234..1242) if the jump tuning below needs it.
- New `src/campus/mound.test.ts` (vitest; build the terrain the way `src/terrainDrive.test.ts` or
  `src/terrain.test.ts` do, with landforms on):
  1. the summit is flat: `heightAt` within 28 m of (1240, 150) varies by under 0.3 m, and the summit is at least 35 m
     above `heightAt(1240, 300)`;
  2. `trail/anthill-road`'s grade (as above) is <= 16 degrees everywhere and <= 10 degrees on its last 30 m, and it
     keeps the clearances listed above;
  3. paint: `paintedSurfaceAt` (or the landform paint) is dirt on the mound's flank (e.g. (1240, 230)) and grass at
     (1100, 150);
  4. the ramp: `rampContactAt` at the lip (along = +length/2 - 0.1) gives `surfaceY` = summit height + height ± 0.3;
  5. the leap: an arcade launch off the lip at 18, 24 and 30 m/s (vy from the formula above, the game's gravity, flat
     forward motion along yaw PI) lands (first point where y <= `heightAt`) on the north side inside `leapClear` or north
     of it within 140 m of the lip, with an air time of at least 2.2 s at 24 m/s. Tune the ramp numbers (height 3.5..6,
     length 14..22) until it does, and so the landing is on falling ground (the mound's north slope or the plain) rather
     than straight into a wall of rising ground.
- Run the kernel parity tests (`npx vitest run src/wasm src/landforms.test.ts src/terrain.test.ts`) and make them green.

## Contract
Trail id `trail/anthill-road`; feature kind `anthill` (kernel code 13); the summit flat within 30 m of (1240, 150);
ramp id `deans-leap` stays on the summit, launching north.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/campus/mound.test.ts src/wasm src/landforms.test.ts src/terrain.test.ts src/levels.test.ts src/sites.test.ts src/stunts.test.ts src/ramps.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.
- Do NOT run or update `src/layout.golden.test.ts` (it changes with every scenery issue; the lead regenerates it).

## Out of scope
`src/campus/*` other than `mound.test.ts`; other region documents; `src/data/landscape.json` (do not move the hill);
any other stunt ramp.

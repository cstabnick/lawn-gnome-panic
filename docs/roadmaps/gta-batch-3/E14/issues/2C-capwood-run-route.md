Epic: E14-2 (content on the track registry)
Depends on: none
Worker: Sonnet (general-purpose) — route geometry, terrain, water

## Environment
Read `docs/roadmaps/gta-batch-3/E14/issues/_env.md` first (worktree, toolchain, rules, the Track contract).

## Goal
The Capwood Run: a point-to-point rally route "that goes up and down the mountain through toadstool stuff and also has
some water crossing parts (but also special water that cannot fully waterlog the car)". Replace the placeholder in
`src/raceTrack/defs/capwoodRun.ts` with the real route, prove the fords never flood a car, and keep scenery off the road.

## Read first
- `games/gnome-theft-auto/src/raceTrack/defs/capwoodRun.ts` (placeholder), `src/raceTrack/trackDef.ts` (`relief:
  'ribbon'`: the road follows the land, averaged over `smooth` m and grade-limited to `maxGrade`; fords dip the road and
  `fordAt` returns Cap-water), `src/capwood/spots.ts`
- `src/waterlog.ts` (`WATERLOG.fordCap`, `stepWaterlog`), `src/terrain.ts` (`waterAt`, `setTerrainOptions`,
  `heightAt`), `src/biomes.ts` ~215-232 (the `free(x, z, margin)` keep-out test for scatter) and `src/settlements.ts`
  ~130-140 (its reserved rectangles)
- an existing test that builds the real terrain, for the set-up pattern: `src/raceTrack/track.test.ts` and
  `src/waterlog.test.ts` if it exists (`grep -rl "stepWaterlog" src --include=*.test.ts`)

## Change
- `src/raceTrack/defs/capwoodRun.ts`: keep `export const CAPWOOD_RUN: TrackDef`, id `'capwood-run'`, name
  `'the Capwood Run'`, `closed: false`, `surface: 'dirt'`, `relief: 'ribbon'`, width 9, barrierOffset 8. Design:
  - Control point 0 inside the start paddock (x 70..110, z -775..-745) so that `gridSlot(0..3)` all stand in the paddock
    and the start line (`startOffset` ~45) is just north of it; the route leaves the paddock heading north/north-east.
  - Climb the south face of the Fells mountain (peak ~69 m at (300, -900)) with switchback hairpins (banked 1-2 m), pass
    within 40 m of the summit anchor (300, -900), descend the north flank, enter Capwood (x 100..400, z -1280..-1080),
    weave between the toadstools (S-bends), and finish near (150, -1300) (the finish line `finishS()` within 40 m of it).
  - Length 2600-4000 m. With `maxGrade` 0.22 the ribbon caps the grade; make the line long enough on the climb that
    the land itself is not much steeper (cut/fill depth under 8 m everywhere: test it).
  - Two fords (`fords`), both inside Capwood or within 60 m of it: depth 0.3-0.4, dip 0.6-0.9, len 22-34; names that fit
    the lore (Cap-water; e.g. "the Gill Ford", "Spore Splash"). One jump (`rise` 1.2-1.6) on the north descent; name it.
  - Keep the centre line at least `ROUTE_CLEARANCE` (25 m) from `WARDEN_HUT`, `GREAT_RING` and every `CAP_COUNT_SPOTS`
    point (import them from `../../capwood/spots`), at least 30 m from every highway centre line (`HIGHWAYS` in
    `src/config.ts`: `north-outer`, `north-band`, `north-band-east`), and outside every site rect except `rally-route`
    and `toadstool-forest` (`SITES`, `siteRect` in `src/sites.ts`) by at least `barrierOffset`. The ski hill is E12's:
    stay east of x = -200.
  - `gates` 14 (start, 12 checkpoints, finish).
- `src/biomes.ts`: in `free(x, z, margin)` add `if (nearTrack(x, z, margin + 2)) return false;` (import `nearTrack` from
  `./raceTrack/tracks`). `src/settlements.ts`: make every placement that checks reserved rectangles also refuse
  `nearTrack(x, z, 20)` (one helper, used where `reservedRects()` is consulted for keep-out).
- `src/raceTrack/capwoodRun.test.ts` (new), with the real terrain (landforms on; build it once in `beforeAll`):
  1. length 2600-4000; passes within 40 m of (300, -900); finish within 40 m of (150, -1300); all clearances above.
  2. Road grade: for consecutive samples `|roadTopAt(b,0) - roadTopAt(a,0)| / ds <= 0.25` everywhere except over a jump.
  3. Cut/fill: `|roadTopAt(p, 0) - naturalHeightAt(p.x, p.z)| < 8` for every sample (`naturalHeightAt` from `terrain.ts`).
  4. Each ford: `waterAt(x, z)` at the ford centre on the centre line returns `ford: true` with depth 0.2-0.5; the
     deepest `waterAt` depth over a grid of points within the ford (`|lat| <= width/2`, along `len`) is under 0.6.
  5. Waterlog: a vehicle stub (copy the shape `stepWaterlog` reads: `spec`, `x`, `y`, `z`, `speed`, `waterlog`,
     `waterlogStalled`, `exploded`, `sunk`, `id`) moved along the centre line through both fords at 4 m/s, `y` =
     `heightAt`, stepped every 0.05 s: `waterlog` never exceeds `WATERLOG.fordCap` and `waterlogStalled` stays false; the
     same stub parked 20 s in deep water elsewhere (find a point with `waterAt(...).depth > 1` on Loch Moss, around
     (-750, -450); search a small grid if needed) still floods (`waterlogStalled` true).
  6. `nearTrack` is true on the centre line and false 60 m to the side at the summit.
- Then run `UPDATE_GOLDEN=1 npx vitest run src/layout.golden.test.ts` (the world layout golden changes because the
  route reshapes the mountain and scenery moves off the road) and check the change is limited (report the box count
  before and after; the golden lives in `src/data/layout.golden.json`).

## Contract
`CAPWOOD_RUN` keeps id, name and the fields above. Other workers read `TRACKS['capwood-run']`: the start pavilion and
grid at the paddock, flags at the gates, ford pools and signs at each `fords[i].s`, the rally quest.

## Done when
- `npx vitest run src/raceTrack/tracks.test.ts src/raceTrack/capwoodRun.test.ts src/sites.test.ts src/layout.golden.test.ts` passes.
- `npx tsc --noEmit -p .` passes for your files.
- Report: length, start line s, finish s, the summit pass point, ford names/s/depth, jump name/s, largest cut/fill,
  the steepest grade, and the golden's box-count change.

## Out of scope
`trackDef.ts`, `tracks.ts`, `track.ts`, `waterlog.ts`, `terrain.ts` (if the Track or terrain API needs a fix, describe it
in your report instead), `defs/rutbottom.ts`, `capwood/*`, any quest or dressing file.

# Gnome Theft Auto: world terrain pass (lane A: world & water)

Goal, in the user's words: "Improve the terrain and make the world blend a bit better. Make it less flat... I don't want to
be able to see everything from everywhere. Add some hills, maybe a mountain." "Make it so the big boat areas (Loch Moss,
Puddle Sea, canal) connect to the river and I can drive from one side of the map to the other in the water... bridges go
above ground (raised so boats pass under)." "Denoise the middle of the map... more landscaping... and new prefabs for it."

## Done by the planner (foundation, before Epic 1)

- `src/landforms/macro.ts` + `src/data/landscape.json`: the world landscape layer (a mountain at the north edge, ridges on
  the region seams, hills, a rim of high ground round the world edge, gentle roll), masked to 0 on roads, trails, water,
  flat sites, calm spots and around Turfton. Hooked into `terrain.ts` (`RELIEFS = [tiltAt, reliefAt, macroAt]`), exported
  from `src/landforms/index.ts` (`LANDSCAPE`, `featureHeightAt`, `macroAt`, `macroMaskAt`).
- `src/terrainMap.probe.test.ts`: `MAPDUMP=out.png npx vitest run src/terrainMap.probe.test.ts` writes a top-down map.
- `config.ts` WATER: canal `depth 0.85, freeboard 1.6`, `stallDepth 0.9`, `bridgeClearance`, `bridgeGrade`, `mouthSlope`.
- Stubs `src/landscaping.ts` (Turfton garden blocks) and `src/scenery.ts` (countryside belts), wired into `world.ts`
  (the random 1-3 giant garden objects per block are gone; `planGardenBlock` / `buildGardenBlocks` / `buildScenery`).

Online: unchanged (terrain and scenery are deterministic, every browser builds the same world). Mobile: unchanged.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1 Water network, bridges, prefabs, level buildings | game build + all game tests + prefab tests pass | 5 (1A-1E) |
| 2 Landscaping: Turfton gardens, countryside belts | game build + all game tests pass | 2 (2A-2B) |
| 3 Integration (planner) | goldens, stages, zfight, smoke, perf, demo, AGENT_INDEX | planner |

## Shared environment (every issue)

- Working directory: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a71bbee1be3972e0b` (a git
  worktree). Run every command from there or from `games/gnome-theft-auto`. Use absolute paths.
- Node: in Git Bash `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed: no `npm install`.
- Do not commit, do not start a dev server, do not run `vite build` (it writes `dist/`; the planner builds).
- Other workers edit other files of the same game at the same time. Edit only the files your issue names. If a test you
  did not write fails in a file another issue owns, ignore it and say so in your report.
- Tests: `npx vitest run src/<file>.test.ts` from `games/gnome-theft-auto` (the first test in a file can take 10-20 s:
  it builds the 1800 m terrain grid). Type-check: `npx tsc --noEmit -p games/gnome-theft-auto`.
- World coordinates: metres, x east, z south (north is -z). The map is x, z in [-900, 900]. Turfton (the city) is the
  square |x|, |z| <= 215 at height exactly 0.

## Epic 1

### 1A Water network: one navigable chain, raised bridges, no dry bars

~~~~text
Epic: 1 Water network
Depends on: none

## Environment
See "Shared environment" in docs/roadmaps/gta-world-terrain-pass.md (read it first).

## Goal
A boat can drive from Loch Moss down the ravine river, along the canal, down the farm river into the Puddle Sea and
back, with no dry bar or step at any junction, and every road bridge is raised on earth ramps so its deck stands well
above the water (boats pass under).

## Read first
- games/gnome-theft-auto/src/water.ts: all of it (carveWater: levels walking WATER.order, then bridges, then carving).
- games/gnome-theft-auto/src/config.ts: `export const WATER` (around line 694). New keys already there:
  `courses.canal.freeboard` (1.6, overrides WATER.freeboard for that course), `bridgeClearance`
  ({ default: 3.4, canal: 2.2 }), `bridgeGrade` (0.1), `mouthSlope` (0.02). Canal depth is now 0.85.
- games/gnome-theft-auto/src/water.test.ts: the existing checks (must keep passing, adjust only what the new rules change).
- games/gnome-theft-auto/src/boats.ts: stepBoat (the shore is a wall: a step into shallower water than draft +
  WATER.boat.beachDepth is refused).

## What is wrong today (measured)
- The farm river ends at surface -3.08 but the Puddle Sea is at -5.65: where the river meets the sea shore the water is
  0 to 0.3 m deep (a dry bar). A boat cannot pass.
- Bridge decks are the road height + 0.15, about 1.1 m above the water: boats clip through them.
- (The loch weir's collider blocks the ravine outflow: issue 1B fixes that in waterworks.ts, not you.)

## Change
games/gnome-theft-auto/src/water.ts:
1. Per-course freeboard: a course's surface is its lowest bank so far minus `(WATER.courses[id].freeboard ??
   WATER.freeboard)` (read it like depth/bank are read; widen the cast type to `{ depth: number; bank: number;
   freeboard?: number }`). Bodies keep WATER.freeboard.
2. Mouth blending (after all levels are known, before carving): walk WATER.order; for each course C followed by the next
   stretch N (course or body) whose start level (course: surface[0]; body: its level) is LOWER than C's last surface,
   lower C's tail: `surface[k] = min(surface[k], startN + (sEnd - s[k]) * WATER.mouthSlope)` for every sample k, and
   recompute `bed[k] = surface[k] - C.depth`. This keeps the surface non-increasing. Do the same when C feeds a canal
   whose first pound is lower. Run it from downstream to upstream so a lowered stretch can lower its feeder too.
3. Raised bridges on earth ramps. Crossings are found exactly as today (each HIGHWAYS segment x each course segment).
   For each crossing, after levels and mouth blending:
   - `level` = the course surface at the crossing (interp of the profile at the crossing's arclength);
   - `road` = sample(x, z) (pre-carve ground at the crossing, as today);
   - `deck` = max(road + WATER.deckRise, level + (WATER.bridgeClearance[course.id] ?? WATER.bridgeClearance.default));
   - `length` as today ((width + 2 * bank) / sinA + 2 * WATER.bridgeOverhang); `width` as today.
   - Embankment: raise BOTH `g` and `pre` (so the carve's bank blend sees it) along the highway on both sides of the
     deck. For a grid vertex at along-road distance `a` from the crossing (signed, measured along the road direction
     (sin yaw, cos yaw)) and across-road distance `c`: ramp height `t(a) = deck` for |a| <= length/2, else
     `deck - (|a| - length/2) * WATER.bridgeGrade`, until it reaches the vertex's own ground (stop there: the ramp ends
     where it meets the land). Across: full height for c <= ROAD_WIDTH/2 + 2, then blend back to the vertex's own
     ground over `max(6, 2 * (deck - road))` metres (smoothstep). New height = max(old, blended target): never lower.
     Only vertices within the ramp's reach (|a| <= length/2 + (deck - road)/bridgeGrade + 2) and inside the road's
     corridor need visiting; walk the grid box around the crossing.
   - City rule: a ramp never enters Turfton: vertices with |x| <= CITY_HALF + 2 and |z| <= CITY_HALF + 2 are not raised
     (import CITY_HALF from './config'). The canal bridge on the `south` highway (crossing at about (0, 230)) is the one
     this affects; its rise is small (about 0.5 m), so its north ramp fits outside the city.
   - Record the bridge with `deck` as above (BridgeSpan fields unchanged). bridgeDeckAt is unchanged (flat deck over
     `length`); heightAt (terrain.ts, not yours) already returns the deck there and the raised ramp ground elsewhere.
   - The carve then runs as today on the raised `g`/`pre`; the embankment inside the carve reach is cut away under the
     deck, which is what we want (the deck spans the water and its banks).
4. Keep everything else (canal locks, islands, source clearing, the level grid) as it is.

games/gnome-theft-auto/src/water.test.ts: keep the existing tests (update only numbers the new rules change: the canal
is still level except at its locks; the downhill checks hold). Add:
- every bridge: `b.deck - surface >= clearance - 1e-6` where surface = waterAt(b.x, b.z)!.surface and clearance is
  WATER.bridgeClearance[b.course] ?? default; and heightAt along the road 5 m beyond each deck end is within
  0.2 m of `b.deck - 5 * WATER.bridgeGrade` or higher than the deck minus 1 (the ramp is there), and no ramp point is
  steeper than 0.16 along the road (sample heightAt every 2 m along the highway through each bridge).
- every junction of WATER.order (each course's last sample, and 10 m before it): waterAt depth >= 0.8.

New file games/gnome-theft-auto/src/boatCrossing.test.ts: a gravy-boat (VEHICLES['gravy-boat']) and a
watering-can-steamer drive the whole chain both ways with stepBoat, and must arrive. Use this harness:
```ts
import { describe, expect, it } from 'vitest';
import { VEHICLES, WORLD_HALF } from './config';
import { stepBoat } from './boats';
import { courseProfile } from './water';
import { waterAt } from './terrain';
import { steerToward } from './boatTraffic';
import type { Vehicle, World, VehicleKind } from './types';

function route(): { x: number; z: number }[] {
  const pts = [{ x: -700, z: -680 }];                       // Loch Moss centre
  for (const id of ['river-ravine', 'canal', 'river-farm']) {
    const p = courseProfile(id)!;
    for (let k = 0; k < p.s.length; k += 4) pts.push({ x: p.x[k], z: p.z[k] });
  }
  pts.push({ x: 690, z: 830 });                             // Puddle Sea centre
  return pts;
}
function drive(kind: VehicleKind, pts: { x: number; z: number }[]): { reached: number; t: number } {
  const v = { x: pts[0].x, z: pts[0].z, y: waterAt(pts[0].x, pts[0].z)!.surface - 0.1,
    yaw: Math.atan2(pts[1].x - pts[0].x, pts[1].z - pts[0].z), speed: 0, spec: VEHICLES[kind], kind } as unknown as Vehicle;
  const world = { boxes: [], half: WORLD_HALF } as unknown as World;
  let wp = 1, t = 0;
  for (; t < 1200 && wp < pts.length; t += 1 / 30) {
    if (Math.hypot(pts[wp].x - v.x, pts[wp].z - v.z) < 10) { wp++; if (wp >= pts.length) break; }
    stepBoat(v, { throttle: 1, steer: steerToward(v, pts[wp].x, pts[wp].z), lift: 0 }, 1 / 30, world);
  }
  return { reached: wp, t };
}
```
Tests: forward and reversed route, for 'gravy-boat' and 'watering-can-steamer': `reached === pts.length`. (Colliders
are left out on purpose: the waterworks are issue 1B's and checked there.) If a boat gets stuck, log where
(x, z, waterAt) and fix the water, not the test.

## Contract
- Exports of water.ts keep their names and signatures (BridgeSpan fields unchanged: id, road, course, x, z, yaw,
  length, width, deck). bridges(), bridgeDeckAt(), courseProfile(), bodyLevel(), canalLocks() unchanged.
- carveWater now raises the ramp (embankment) vertices and, as before, lowers the water beds; it changes nothing else.
  Update the "never raises the ground" check in water.test.ts's tilted-grid test to allow raises only within 60 m of
  a bridge crossing.

## Done when
- `npx vitest run src/water.test.ts src/boatCrossing.test.ts src/swim.test.ts src/surfaces.test.ts src/landforms.test.ts`
  passes from games/gnome-theft-auto (landforms.test.ts "keeps its buildings on level ground" and "keeps every height
  within" may fail because of issue 1D's work in progress: ignore only those two).
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.

## Out of scope
waterworks.ts, boatTraffic.ts, boats.ts, terrain.ts, config.ts (ask in your report if a constant must change),
biomes.ts, anything under packages/.
~~~~

### 1B Waterworks: weir with a boat pass, high arched road bridges

~~~~text
Epic: 1 Water network
Depends on: none

## Environment
See "Shared environment" in docs/roadmaps/gta-world-terrain-pass.md (read it first).

## Goal
The loch weir no longer blocks boats (a 5 m boat pass in its middle), and every road bridge is drawn by a new tall
stone arch bridge prefab that suits the raised decks (issue 1A is raising decks to about 3.4 m above rivers and 2.2 m
above the canal, with earth ramps on the road either side).

## Read first
- games/gnome-theft-auto/src/waterworks.ts: waterworksPlan (bridges are step 1, the weir step 3).
- games/gnome-theft-auto/src/waterworks.test.ts.
- packages/prefabs/src/catalog/gta-waterworks.ts: 'road-bridge' and 'loch-weir' (style to copy).
- packages/prefabs/src/types.ts (Part shapes), docs/roadmaps/prefab-library/_common.md (prefab rules; this catalog
  file is life-size in game metres, `footprint` is set so the size limit is 30).

## Change
packages/prefabs/src/catalog/gta-waterworks.ts: add one prefab (keep all existing ones):
- id 'arch-road-bridge', name 'Arch Road Bridge', category 'prop', uses ['place'], emoji [], footprint { r: 6, h: 7.3 },
  tags include bridge, road, river, stone, arch, railing, deck, span, parapet. Long axis along z, 12 wide (x) and 24
  long (z), DECK TOP AT y = 6.5, bottom at y = 0:
  deck slab box [12, 0.6, 24] at y 6.2 (top 6.5); two side spandrel walls (box [0.8, 3.4, 24] at x +-5.6, y 4.6,
  'stone', mirror) ; the arch: an underside ring shape is hard with primitives, so build a barrel vault from 5 boxes
  stepping up toward the middle under the deck between the walls (like a corbelled arch: z-lengths 24, 18, 12, 8, 5,
  heights stacked from y 2.9 to 5.9, 'stone-dark'), plus two abutment piers box [12, 6, 3] at z +-10.5 (y 3, from 0 to
  6, 'stone-dark'); parapets box [0.5, 0.9, 24] at x +-5.75, y 6.95 ('stone', mirror); 4 lamp posts (thin 'iron-dark'
  cylinders 1.4 tall with a small 'brass' glow:true ball) at the parapet ends; a 'brass' plaque on one parapet.
  Under 40 parts. Examine: 5 lines in the voice of _common.md (no named characters; a hint that boats pass under).
  The span between the piers (z from -9 to +9) must stay open below y = 2.9 (boats pass there).
games/gnome-theft-auto/src/waterworks.ts:
- Bridges: place 'arch-road-bridge' instead of 'road-bridge': `y: b.deck - 6.5`, `scaleX: b.width / 12`,
  `scaleZ: b.length / 24`, same x, z, yaw. Deck colliders: none (heightAt returns the deck; boats pass under).
- Weir: instead of one 'loch-weir' across the river with one collider, place TWO 'loch-weir' pieces, one against each
  bank, each `scaleX: 0.35` (so each is about 4.2 m wide), centred at +-(halfWidth - 2.1) across the river from the
  river centre line (halfWidth = 5, the ravine is 10 wide; across = the unit vector (cos yaw, -sin yaw) for a prefab
  facing yaw), each with its own collider `footprint(x, z, yaw, 2.1, 1)`, so about 4 m of clear water stays between the two
  colliders (shrink scaleX and the collider together if needed). Keep the weir at the same spot along the river.
- Add `scaleY?: number` nowhere; do not change WorkPlacement.
games/gnome-theft-auto/src/waterworks.test.ts: update counts ('arch-road-bridge' 5, 'road-bridge' 0, 'loch-weir' 2) and
add: between the two weir colliders there is a gap of at least 4 m measured across the river; every bridge
placement's y + 6.5 equals its span's deck (bridges() from './water').

## Contract
waterworksPlan() / buildWaterworks() signatures unchanged. Bridge spans come from bridges() in water.ts (fields id,
road, course, x, z, yaw, length, width, deck); issue 1A changes the deck heights, not the fields.

## Done when
- `npm test -w packages/prefabs` passes for 'arch-road-bridge' (other files may be mid-edit by issue 1C; ignore theirs).
- `npx vitest run src/waterworks.test.ts` passes from games/gnome-theft-auto.
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.

## Out of scope
water.ts, boats.ts, boatTraffic.ts, every other catalog file, packages/prefabs/src/catalog/index.ts.
~~~~

### 1C Landscaping prefabs

~~~~text
Epic: 1
Depends on: none

## Environment
See "Shared environment" in docs/roadmaps/gta-world-terrain-pass.md (read it first). Prefab rules:
docs/roadmaps/prefab-library/_common.md (read it; its "Environment" paragraph names another worktree: ignore that and
use this worktree). Exception to its size rule: these are life-size scenery for Gnome Theft Auto (1 unit = 1 metre,
a gnome is about 1 tall); give every one a `footprint` (then the size limit is 30) and category 'prop'.

## Goal
A new catalog file of garden landscaping pieces that Gnome Theft Auto uses to lay out city gardens and the
countryside: hedgerows, a hedge arch, dry-stone walls, flower beds, garden borders, rock gardens, clipped shrubs,
ornamental grass, a stone planter and a lavender row.

## Read first
- packages/prefabs/src/types.ts (PrefabDef, Part, shapes), packages/prefabs/src/palette.ts (colour names).
- packages/prefabs/src/catalog/gta-world-green.ts (a GTA scenery file to copy the style from).
- packages/prefabs/src/catalog/index.ts (how catalog files are registered).

## Change
- New file packages/prefabs/src/catalog/gta-landscaping.ts exporting `GTA_LANDSCAPING: readonly PrefabDef[]` with these
  ids, all `uses: ['place']`, `emoji: []`, sizes in metres, standing on y = 0, centred on x and z:
  1. 'hedgerow': clipped hedge 4 long (x) x 1.0 deep (z) x 1.3 tall: a 'leaf-dark'/'leaf' box body with rounded leafy
     ball bumps along the top and a few lighter leaf patches on the sides. footprint { r: 2, h: 1.3 }.
  2. 'hedge-arch': hedge gateway 4 wide (x) x 1.0 deep x 2.8 tall with a 1.8 wide, 2.1 tall walk-through opening in the
     middle (two side hedge blocks + a hedge lintel with a rounded top). footprint { r: 2, h: 2.8 }.
  3. 'dry-stone-wall': 4 long (x) x 0.6 deep x 1.0 tall, two or three courses of staggered grey stones (boxes of
     'stone' and 'stone-dark' slightly offset) with upright capstones along the top, a moss patch. footprint { r: 2, h: 1 }.
  4. 'flower-bed': raised bed 3 (x) x 1.4 (z), timber or brick edging 0.3 tall, dark soil top, three rows of flowers
     (small balls on short green stems) in the tint colour plus a few white ones. `tint: 'pink'` (or another palette
     flower colour), parts use c: 'tint'. footprint { r: 1.5, h: 0.6 }.
  5. 'garden-border': 3 long (x) x 0.5 deep strip: a scalloped brick edging 0.2 tall on the front and a strip of low
     flowers and leaves behind it (0.4 tall), tint for the flowers. footprint { r: 1.5, h: 0.45 }.
  6. 'rock-garden': about 3 across: 5-7 grey and mossy boulders of different sizes (squashed balls, the biggest 0.9
     tall), small alpine tufts and two tiny flower clusters between them, on a low gravel mound (a squashed 'gravel' or
     light grey ball, not a flat disc). footprint { r: 1.5, h: 0.9 }.
  7. 'boxwood-ball': a clipped round shrub 1.0 tall (one big 'leaf-dark' ball, a slightly lighter cap). footprint
     { r: 0.5, h: 1 }.
  8. 'topiary-cone': a clipped green cone 2.2 tall on a short brown trunk in a terracotta pot. footprint { r: 0.5, h: 2.2 }.
  9. 'ornamental-grass': a clump 1.1 tall: 7-9 thin tilted blade boxes or cones fanning out, three straw-coloured plume
     heads. footprint { r: 0.5, h: 1.1 }.
  10. 'stone-planter': 1.6 x 1.6 x 0.7 stone box with a rim, soil, and a small round-headed tree (trunk + leaf ball)
     about 2.4 tall overall. footprint { r: 0.8, h: 2.4 }.
  11. 'lavender-row': 2.5 long (x) x 0.6 deep: a row of 5 soft purple-grey mounds with purple flower spikes. footprint
     { r: 1.25, h: 0.6 }.
  Each: name, tags (lower-case single words: material, noun, synonyms, plus 'garden' and 'landscaping'), about (one
  plain line, say "Life-size metres, for Gnome Theft Auto landscaping"), examine 5 lines in the voice of _common.md.
  Keep parts 3-30 each. Flat pieces must not be paper-thin discs lying on y = 0: every part has height (z-fighting rule).
- packages/prefabs/src/catalog/index.ts: import `GTA_LANDSCAPING` from './gta-landscaping' and add it to the catalog list
  right after GTA_WATERWORKS (follow how the others are listed in that file).

## Done when
- `npm test -w packages/prefabs` passes for all 11 ids (another worker is adding 'arch-road-bridge' to
  gta-waterworks.ts at the same time; ignore failures in that file only).
- `npx tsc --noEmit -p packages/prefabs` shows no errors in your file.

## Out of scope
Every other catalog file, anything under games/.
~~~~

### 1D Biome scatter keeps buildings on level ground

~~~~text
Epic: 1
Depends on: none

## Environment
See "Shared environment" in docs/roadmaps/gta-world-terrain-pass.md (read it first).

## Goal
The new landscape (hills, ridges, a mountain: src/landforms/macro.ts) puts some biome buildings on slopes. Biome scatter
must skip building spots whose ground is not level, so huts, cabins, barns and the like always stand on level ground.

## Read first
- games/gnome-theft-auto/src/landforms.test.ts: "keeps its buildings on level ground" (MAX_FOOTPRINT_STEP 1.2: boxes
  with min side >= 2.5 must have <= 1.2 m between the highest and lowest of heightAt at centre and corners) and "keeps
  every height within -30 to 40 m".
- games/gnome-theft-auto/src/biomes.ts: `free`, `findSpot`, `drop`, `scatter`, `placeAt`, `addSafeBox`, the village
  builder (`village(...)`) and any other place that adds a building collider (`addBox(boxAt(...))`).

## Change
- games/gnome-theft-auto/src/biomes.ts: add a helper `levelEnough(r: Rect): boolean` = (max - min of heightAt at the
  rectangle's centre and 4 corners) <= 1.0. Wherever a solid object whose collider has min side >= 2.5 is placed
  (drop with solid, placeAt with solid, village huts, cabins, barns, yards, any `addBox` of a building), reject spots
  that fail it: in findSpot-based placement treat it as not free (try the next random point); for fixed spots, skip
  the object. Trees, rocks and small props (min side < 2.5) are not affected. Do not change the order or number of
  random draws for spots that pass (keep the scatter as stable as possible).
- games/gnome-theft-auto/src/landforms.test.ts: change "keeps every height within -30 to 40 m" to -30 to 100 m (the
  new mountain is about 75 m) and its test name to match. Nothing else.

## Done when
- `npx vitest run src/landforms.test.ts` passes from games/gnome-theft-auto.
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
- (layout.golden.test.ts will fail: the world changed on purpose; the planner regenerates it. Do not touch it.)

## Out of scope
landforms/*.ts, terrain.ts, water.ts, world.ts, scenery.ts, landscaping.ts, data/*.
~~~~

### 1E Boat traffic uses the whole waterway

~~~~text
Epic: 1
Depends on: none

## Environment
See "Shared environment" in docs/roadmaps/gta-world-terrain-pass.md (read it first).

## Goal
NPC boats travel the connected waterway: besides the loch and sea loops, a Clog Cruiser and a Walnut Dinghy run the
whole chain Loch Moss -> ravine river -> canal -> farm river -> Puddle Sea and back (ping-pong), and a second dinghy
runs the upper river from the loch towards the source and back.

## Read first
- games/gnome-theft-auto/src/boatTraffic.ts (routes, driveRoutes, loopRoute).
- games/gnome-theft-auto/src/boatTraffic.test.ts.
- games/gnome-theft-auto/src/water.ts: `courseProfile(id)` returns { s, x, z, surface, bed } sampled every 2 m from
  upstream; `BODIES` (loch id 'water/loch-moss', centre (-700, -680); sea id 'water/puddle-sea', centre (690, 830)).

## Change
games/gnome-theft-auto/src/boatTraffic.ts:
- New exported pure function `waterwayRoute(courses: readonly string[], opts?: { from?: { x: number; z: number };
  to?: { x: number; z: number }; every?: number }): { x: number; z: number }[]`: optional `from` point, then the
  centre line of each course in order (every `every` samples, default 10 = 20 m, always including each course's last
  sample), then optional `to`. Returns [] if any course profile is missing (the dry world).
- New exported pure function `pingPong<T>(pts: readonly T[]): T[]`: pts followed by pts reversed without repeating the
  two ends (so a looped index walks there and back), e.g. [a,b,c] -> [a,b,c,b].
- Routes: add
  { kind: 'clog-cruiser', route: pingPong(waterwayRoute(['river-ravine', 'canal', 'river-farm'], { from: { x: -680,
    z: -640 }, to: { x: 660, z: 820 } })), throttle: 0.7, ... }
  { kind: 'walnut-dinghy', same route but reversed start (start at the sea end: reverse the waterwayRoute before
    pingPong), throttle: 0.6 }
  { kind: 'walnut-dinghy', route: pingPong(waterwayRoute(['river-upper'], { to: { x: -640, z: -650 } })) reversed so it
    starts in the loch, throttle: 0.5 }
  Skip a route whose list is empty. Keep the three existing routes.
- NPC boats farther than ACTIVE_RANGE from the player stop (as today). Additionally, a waterway boat should not leave
  its place in the route when it is frozen: no change needed (it just waits).
- A waterway boat that has not moved 2 m in 6 s while driven (stuck on a bank) skips to the next waypoint.
games/gnome-theft-auto/src/boatTraffic.test.ts: add tests for pingPong, and that waterwayRoute(['river-ravine',
'canal', 'river-farm']) is non-empty, starts near the ravine's first sample and ends near the farm river's last one, with
every point on a water course (`onWaterCourse(p.x, p.z)` from './water' is true; it needs no heights).

## Contract
createBoatTraffic(scene, vehicles, world) and BoatTraffic unchanged. New exports waterwayRoute and pingPong as above.

## Done when
- `npx vitest run src/boatTraffic.test.ts` passes from games/gnome-theft-auto.
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.

## Out of scope
water.ts, boats.ts, waterworks.ts, vehicles.ts, config.ts.
~~~~

## Epic 2

### 2A Turfton garden blocks (denoise the middle)

~~~~text
Epic: 2
Depends on: Epic 1 (the landscaping prefabs from 1C exist)

## Environment
See "Shared environment" in docs/roadmaps/gta-world-terrain-pass.md (read it first).

## Goal
Every ordinary Turfton block (outside downtown and the landmark blocks) used to hold 1-3 random giant garden objects
(a 25 m watering can, a wheelbarrow, a mailbox...), which looked like junk. Now each is a designed garden: hedgerow
borders with entrances, at most one giant centrepiece, flower beds, a rock garden, clipped shrubs in the corners.

## Read first
- games/gnome-theft-auto/src/landscaping.ts (the stub you fill: keep the exported signatures exactly).
- games/gnome-theft-auto/src/world.ts: the block loop (search `planGardenBlock`), `gardenBlocked`, `overlap`, `GAP`,
  `measure`/`localBox` (how footprints are measured), the old list of giant garden objects is below.
- packages/prefabs/src/catalog/gta-landscaping.ts: the landscaping prefab ids and sizes.
- packages/prefabs/src/batch.ts: buildStaticPrefabs(placements, { lights: false, name }) and StaticPrefabPlacement
  ({ id, x, y?, z, yaw?, scale? }).

## Change
games/gnome-theft-auto/src/landscaping.ts (only this file):
- Measure a prefab's footprint like world.ts does: `new THREE.Box3().setFromObject(buildPrefab(id, { lights: false }))`
  cached per id; rotated half sizes for yaw in steps of 90 degrees (swap x/z for odd quarter turns).
- planGardenBlock(block, rnd, blocked): block sizes are 42 x 42 (inner) or 17 wide strips at the city edge.
  * Strip blocks (a side < 24 m): a line of 'hedgerow' (4 m each, yaw so the long axis follows the strip) down the
    middle with a 6 m gap every 20 m, and a 'boxwood-ball' or 'topiary-cone' at each end.
  * Full blocks: (a) hedge border: 'hedgerow' pieces end to end 1.5 m inside the block edge on all four sides, each side
    leaving a 6 m entrance in its middle; 50 % of blocks put a 'hedge-arch' in one entrance (rnd picks which). (b)
    Centre (rnd < 0.5): ONE giant centrepiece from ['garden-shed', 'stone-fountain', 'compost-heap', 'birdbath',
    'brick-stack'] scaled so its longer side is 12 to 18 m, solid; else a garden centre: a 'rock-garden' at the centre
    (scale 1.6) with four 'flower-bed' around it (one per side, 4 m out, long axis tangent). (c) Each of the 4 inner
    corners (3.5 m in from the hedge corner): one of 'boxwood-ball' x2, 'topiary-cone', 'ornamental-grass' x3 in a
    triangle, or 'stone-planter' (rnd). (d) Along one hedge side, inside it, two 'lavender-row' or 'garden-border'
    pieces. Scale 1 for all landscaping pieces unless said.
  * Every placement: compute its footprint rect (half sizes from the measured box, rotated); drop it if
    `blocked(rect)` (highways through the city, existing colliders) or if it overlaps an earlier placement of the same
    block. Solid: 'hedgerow', 'hedge-arch' (two side blocks: model it as one rect, solid), the centrepiece,
    'stone-planter', 'rock-garden', 'topiary-cone'. The rest are not solid.
  * Deterministic: only `rnd` for randomness; a block always consumes randomness in the same order.
- buildGardenBlocks(scene, boxes, plans): one `buildStaticPrefabs(placements, { lights: false, name: 'turfton-gardens' })`
  added to the scene (y = 0: Turfton is flat at 0); for each solid placement push a Box { minX, maxX, minZ, maxZ,
  h: measured top height * scale } (h is an absolute top; Turfton ground is 0).
- New test games/gnome-theft-auto/src/landscaping.test.ts (use `installFakeDom()` from './testing/fakeDom' before
  importing three-dependent modules if needed): planGardenBlock on a 42 x 42 block with a seeded rnd (mulberry32 from
  '@lawn/level') and blocked = () => false returns 15-60 placements, at most one of the giant centrepiece ids, every
  placement inside the block, no two solid rects overlapping, and the same result for the same seed; with
  blocked = () => true it returns []. A 17 x 42 strip returns only hedgerow/boxwood/topiary pieces.

## Done when
- `npx vitest run src/landscaping.test.ts src/quests/stages.test.ts` passes (if a stage now collides with a garden
  piece, the stages test names it: drop pieces that overlap stage marks by adding the stage set boxes to the blocked
  check is NOT allowed (world.ts is not yours); instead report the failing stage ids).
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.

## Out of scope
world.ts, scenery.ts, biomes.ts, packages/ (use the prefabs, do not edit them).
~~~~

### 2B Countryside belts: forested hills, hedgerows and walls along the roads

~~~~text
Epic: 2
Depends on: Epic 1 (the landscaping prefabs from 1C exist)

## Environment
See "Shared environment" in docs/roadmaps/gta-world-terrain-pass.md (read it first).

## Goal
The new landscape (src/data/landscape.json: a mountain, ridges, hills) gets planted: tree belts on hill and ridge
flanks with clearings, a bare rocky mountain top, hedgerows along the farm highways, dry-stone walls along the fell and
wood highways. These break the long sightlines across the map.

## Read first
- games/gnome-theft-auto/src/scenery.ts (the stub you fill: keep the exported signatures exactly).
- games/gnome-theft-auto/src/landforms/macro.ts: LANDSCAPE (features: { id, kind 'mountain'|'ridge'|'hill', points,
  r, h }), featureHeightAt(f, x, z, index), macroMaskAt(x, z).
- games/gnome-theft-auto/src/biomes.ts lines 1-130 (measure/localBox, boxAt, how trees get a trunk collider) and the
  `tree` helper (search `const tree =`).
- games/gnome-theft-auto/src/config.ts: HIGHWAYS ({ id, points }), ROAD_WIDTH (10), CITY_HALF (215), biomeAt(x, z)
  (returns 'city' | 'desert' | 'forest' | 'tundra' | 'farmland' | 'loch' | 'parkland').
- packages/prefabs/src/catalog/gta-landscaping.ts ('hedgerow', 'dry-stone-wall', 'rock-garden', ... sizes).

## Change
games/gnome-theft-auto/src/scenery.ts (only this file):
- Tree ids by biome: tundra 'snow-pine'; forest 'cone-pine' (60 %) / 'broadleaf-tree'; farmland and parkland
  'broadleaf-tree' (70 %) / 'cone-pine'; loch 'cone-pine'; desert: no trees, use 'garden-rock' boulders (scale 3-5)
  instead, sparser. Scale 0.9-1.3 (giant-oak is NOT used here).
- Belts: for each LANDSCAPE feature i, walk a jittered grid (spacing 9 m, jitter +-3 m, seeded with mulberry32 from
  '@lawn/level', seed 4242 + i) over its bounding box grown by r. Keep a point when: featureHeightAt(f, x, z, i) >=
  0.15 * f.h and macroMaskAt(x, z) >= 0.5 and a clump noise `valueNoise(x / 60, z / 60, 99 + i)` (from
  './landforms/noise') > -0.1 (clearings) and the slope there (from heightAt at +-2 m) < 0.8. For 'mountain' features,
  above 0.6 * f.h place a 'garden-rock' (scale 2-4) at 25 % of points and nothing else (a bare top).
- Hedgerows: along every HIGHWAYS segment whose midpoint biomeAt is 'farmland' or 'parkland', both sides at 9 m from
  the centre line, 'hedgerow' pieces end to end (yaw so the long x axis follows the road: yaw = atan2(dx, dz) -
  PI/2), with a 10 m gap every 60 m and no hedge within 25 m of any other highway's centre line (junctions).
- Walls: the same for 'tundra' and 'forest' segments with 'dry-stone-wall', at 8 m, gap 12 m every 80 m.
- Skip anything: inside the city square grown by 40 m; within ROAD_WIDTH/2 + 3 of any highway centre line (other than
  the hedge/wall offsets above, which are at 8-9 m); on or within 4 m of water (`onWaterCourse(x, z, 4)` from
  './water'); within 3 m of an `existing` collider (use a 16 m cell grid lookup like biomes.ts does); outside
  |x|, |z| <= 880.
- Placement y: heightAt(x, z) (trees and rocks), and for 'hedgerow'/'dry-stone-wall' the lowest heightAt of the
  piece's two ends minus 0.05 (so it never floats).
- Colliders (absolute tops): trees: a 1 x 1 trunk box, h = y + 3; walls and hedges: the piece's rotated footprint
  rect, h = y + 1.3; rocks: their footprint, h = y + 1.
- planScenery(existing) returns { placements, boxes }; buildScenery(scene, boxes) = plan with `boxes` as existing,
  then one buildStaticPrefabs(..., { lights: false, name: 'countryside-scenery' }) per tree id group is fine, or one
  batch for all (prefer one batch), and push the plan's boxes into `boxes`. Placements are StaticPrefabPlacement
  ({ id, x, y, z, yaw, scale }).
- Budget: at most 2500 placements in total (cap the belts, hedges first). Print nothing.
- New test games/gnome-theft-auto/src/scenery.test.ts: planScenery([]) is deterministic (same twice), has >= 300
  placements and <= 2500, none inside the city square, none on water (onWaterCourse(x, z) false), none within 7 m of a
  highway centre line except 'hedgerow'/'dry-stone-wall' pieces, at least one 'hedgerow' and one 'dry-stone-wall', and
  every placement's y is within 0.2 m of heightAt(x, z) (walls/hedges may be up to 1.5 m lower). Use
  `installFakeDom()` from './testing/fakeDom' first if three/prefabs need a DOM.

## Done when
- `npx vitest run src/scenery.test.ts` passes from games/gnome-theft-auto.
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.

## Out of scope
world.ts, landscaping.ts, biomes.ts, landforms/*, data/*, packages/.
~~~~


## Scope addition: regional motifs and outer-region houses

Asked mid-lane: (1) give each region a recognisable visual style (palette, fence/wall/hedge style, planting, paving,
borders, signature props), still blending at borders, kept in data and built from prefabs, recorded in the lore and the
environments write-up; (2) residential houses in the outer areas, clusters of gnome houses with yards, driveways and
fences along each region's outer roads, styled to its theme, instanced, with colliders, off roads, water, stage spots,
the race track and spawn points.

Done by the planner before Epic 3: `src/data/regionThemes.json` (one theme per region: roadside kind, hedge, wall,
fence, planting, border, paving, signature props, houses, yard dressing, trees, palette; `sizes` for prefabs built at a
reduced scale; `borderBlend`) and `src/regionThemes.ts` (`REGION_THEMES`, `themeAt(x, z, u)` blending neighbours near
borders, `themeSize(id)`, `THEME_BLEND`); stub `src/settlements.ts` wired into `world.ts` (before `buildScenery`, so the
belts keep clear of houses); empty catalog files `gta-houses.ts` (`GTA_HOUSES`) and `gta-region-motifs.ts`
(`GTA_REGION_MOTIFS`) registered in `packages/prefabs/src/catalog/index.ts`. Lore motifs and the environments
write-up: planner.

| Epic | Done when | Issues |
|---|---|---|
| 3 Theme and house prefabs | prefab tests pass | 2 (3A-3B) |
| 4 Themed scenery, settlements, civic Turfton | game build + all game tests pass | 3 (4A-4C) |

## Epic 3

### 3A House prefabs

~~~~text
Epic: 3
Depends on: none

## Environment
See "Shared environment" in docs/roadmaps/gta-world-terrain-pass.md (read it first). Prefab rules:
docs/roadmaps/prefab-library/_common.md (read it; ignore its "Environment" paragraph, use this worktree). These are
life-size Gnome Theft Auto scenery (1 unit = 1 metre, a gnome is about 1 tall): give each a `footprint` and category
'prop' (then the size limit is 30). Another worker is filling packages/prefabs/src/catalog/gta-region-motifs.ts at the
same time.

## Goal
Six gnome house prefabs for the outer-region settlements, each recolourable (walls = tint, roof = trim) so one prefab
gives many looks.

## Read first
- packages/prefabs/src/types.ts, packages/prefabs/src/palette.ts.
- packages/prefabs/src/catalog/gta-world-green.ts ('log-cabin' and 'barn': GTA house style to match).
- packages/prefabs/src/catalog/gta-houses.ts (the empty file you fill; keep the export name GTA_HOUSES).

## Change
packages/prefabs/src/catalog/gta-houses.ts: `export const GTA_HOUSES: readonly PrefabDef[]` with these ids, all
`category: 'prop'`, `uses: ['place']`, `emoji: []`, standing on y = 0, centred on x and z, FRONT DOOR ON +z (the game
turns the front to the road). Every house: walls use c: 'tint' (default `tint` set), roof uses c: 'trim' (default
`trim` set), a door, 2+ windows ('glass'), and one personal detail (a chimney, a flower box, a lantern, a bench).
Life-size: a gnome is 1 m tall, so doors are about 1.4 tall and 0.8 wide.
1. 'gnome-cottage': 6 (x) x 5 (z) footprint, walls 2.6 tall, pitched roof (two wedges) to about 4.6, chimney, a flower
   box under the front window, a front step. tint 'paper', trim 'slate'. footprint { r: 3, h: 4.8 }.
2. 'thatched-cottage': 7 x 5, white walls 2.4 tall, a thick rounded thatch roof (squashed balls or wedges in 'straw' as
   trim) to 4.8, a low wooden porch and a round window. tint 'paper', trim 'straw'. footprint { r: 3.5, h: 4.8 }.
3. 'snow-cottage': 6 x 5 stone cottage ('stone' walls as tint), steep roof (trim 'slate') to 5.2 with a white snow
   layer on each slope (thin 'white' wedges just above the roof), a stone chimney with snow, shutters. tint 'stone',
   trim 'slate'. footprint { r: 3, h: 5.4 }.
4. 'stilt-cottage': 5 x 5 wooden cabin on six 1.6 tall stilts ('wood-dark'), floor slab at 1.6, walls to 4.0, pitched
   roof to 5.6, a ladder or steps down the front (+z) to the ground, a small deck. tint 'wood', trim 'leaf-dark'.
   footprint { r: 2.5, h: 5.6 }.
5. 'toadstool-cottage': a round house: a fat cylinder stem 3.5 across and 2.6 tall ('bone' as tint) under a wide
   squashed-ball cap 6 across to about 5 tall (trim 'mushroom-cap') with white spots, a round door and two round
   windows, a little chimney poking out of the cap. tint 'bone', trim 'mushroom-cap'. footprint { r: 3, h: 5.2 }.
6. 'adobe-house': 8 x 6 two-level flat-roofed adobe: a 2.8 tall ground block and a 4 x 4 upper block to 5.2, rounded
   parapet edges, beam ends ('wood-dark') under each roof line, a turquoise-painted door frame, a ladder to the upper
   roof. Walls tint 'clay', the parapet caps and beam ends trim (default trim 'clay-dark'). footprint { r: 4, h: 5.4 }.
Each: name, tags (house, home, cottage, gnome, the material, region words like desert/snow/farm/loch/meadow/forest),
about ("Life-size metres, front door on +z, walls tint, roof trim, for Gnome Theft Auto settlements"), examine 5 lines
in the _common.md voice (houses gnomes live in; no named characters). Parts 8-35 each.

## Done when
- `npm test -w packages/prefabs` passes for all 6 ids (ignore failures in gta-region-motifs.ts only).
- `npx tsc --noEmit -p packages/prefabs` shows no errors in your file.

## Out of scope
Every other catalog file, catalog/index.ts (already registered), anything under games/.
~~~~

### 3B Regional motif prefabs

~~~~text
Epic: 3
Depends on: none

## Environment
See "Shared environment" in docs/roadmaps/gta-world-terrain-pass.md (read it first). Prefab rules:
docs/roadmaps/prefab-library/_common.md (read it; ignore its "Environment" paragraph, use this worktree). Life-size
Gnome Theft Auto scenery (1 unit = 1 metre): give each a `footprint` and category 'prop'. Another worker is filling
packages/prefabs/src/catalog/gta-houses.ts at the same time.

## Goal
The pieces that give each region its look: walls, fences and borders in each region's style, signature props and a
driveway.

## Read first
- packages/prefabs/src/types.ts, packages/prefabs/src/palette.ts.
- packages/prefabs/src/catalog/gta-landscaping.ts (sibling pieces like 'hedgerow' and 'dry-stone-wall': match their
  size conventions: linear pieces lie along x, centred).
- packages/prefabs/src/catalog/gta-region-motifs.ts (the empty file you fill; keep the export name GTA_REGION_MOTIFS).

## Change
packages/prefabs/src/catalog/gta-region-motifs.ts: `export const GTA_REGION_MOTIFS: readonly PrefabDef[]`, all
`category: 'prop'`, `uses: ['place']`, `emoji: []`, on y = 0, centred:
1. 'adobe-wall' (Dust Flats): 4 long (x) x 0.5 deep x 1.1 tall clay wall with a rounded top (a pill or squashed
   cylinder along x on top), two darker clay patches, one small niche. footprint { r: 2, h: 1.2 }.
2. 'split-rail-fence' (Mossy Wood): 4 long, 1.1 tall: two rough posts ('bark') and three split rails ('wood') slightly
   offset and tilted, a moss patch. footprint { r: 2, h: 1.1 }.
3. 'log-border' (Mossy Wood): 3 long x 0.5 deep x 0.35 tall: two logs lying along x (cylinders, rot [0,0,90]) with moss
   tops and a tiny mushroom. footprint { r: 1.5, h: 0.45 }.
4. 'snowcap-stone-wall' (Frostbite Fells): 4 long x 0.6 x 1.0, staggered grey stones like a dry-stone wall with a white
   snow layer along the top (squashed 'white' balls or a rounded box) and a little snow drift at one foot. footprint
   { r: 2, h: 1.15 }.
5. 'stone-cairn' (Frostbite Fells, Loch Moss): a stack of 5-6 flat stones getting smaller to 1.5 tall, a white snow cap,
   two loose stones at the foot. footprint { r: 0.6, h: 1.6 }.
6. 'reed-bed' (Loch Moss): a clump about 2.5 across of 12-18 thin reeds (thin cylinders or boxes, 'leaf'/'moss') up
   to 1.5 tall, slightly tilted, with 4-5 brown cattail heads ('bark' pills). footprint { r: 1.25, h: 1.5 }.
7. 'wattle-fence' (Loch Moss, Tallgrass Commons): 3 long x 0.2 deep x 1.0 tall woven hurdle: 5 upright stakes and
   4-5 horizontal woven bands ('wood-light'/'straw') alternating slightly in and out. footprint { r: 1.5, h: 1.05 }.
8. 'wildflower-patch' (Tallgrass Commons): a low mound about 2 x 1.5 of grass tufts with 10-15 flowers of mixed colours
   (pink, yellow, white, sapphire) on stems up to 0.6. footprint { r: 1, h: 0.65 }.
9. 'bee-skep' (Tallgrass Commons): a straw dome hive (stacked 'straw' rings or a squashed ball with 'burlap' bands)
   on a small wooden stand, 1.1 tall, a dark entrance hole, two tiny 'honey'/'black' bees. footprint { r: 0.5, h: 1.15 }.
10. 'civic-railing' (Turfton): 3 long: a low stone kerb 0.25 tall and 0.4 deep ('stone') with black iron railings
   ('black' or 'iron-dark') 0.75 above it: 7 thin uprights with ball finials and a top rail. footprint { r: 1.5, h: 1.0 }.
11. 'paver-drive' (everywhere): a driveway strip 3 wide (x) x 6 long (z): 8-12 flat paving slabs 0.12 tall in
   'stone'/'stone-dark' with small gaps between them (each a box from y 0 to 0.12, NOT a paper-thin plane), and a
   gravel edge strip each side 0.06 tall. footprint { r: 1.5, h: 0.12 }.
Each: name, tags (material, noun, synonyms, the region word, 'landscaping'), about ("Life-size metres, for Gnome
Theft Auto regional landscaping (<region>)"), examine 5 lines in the _common.md voice. Parts 3-35 each.

## Done when
- `npm test -w packages/prefabs` passes for all 11 ids (ignore failures in gta-houses.ts only).
- `npx tsc --noEmit -p packages/prefabs` shows no errors in your file.

## Out of scope
Every other catalog file, catalog/index.ts (already registered), anything under games/.
~~~~

## Epic 4

### 4A Themed countryside: roadsides, understorey and signature props by region

~~~~text
Epic: 4
Depends on: Epic 3 (the motif prefabs exist)

## Environment
See "Shared environment" in docs/roadmaps/gta-world-terrain-pass.md (read it first). Other workers are editing
settlements.ts and landscaping.ts at the same time.

## Goal
scenery.ts (already built: tree belts on the landscape's hills, hedgerows on farm roads, dry-stone walls on fell and
wood roads) takes every choice from the region themes instead of fixed ids, so each region looks like itself:
adobe walls on desert roads, split-rail fences in the wood, snow-capped walls in the fells, hedgerows in the farms,
wattle fences on the commons; ferns, reeds, cacti and wildflowers under the belts; cairns, cacti, hay bales, skeps
along the roads. Near borders the themes mingle (themeAt blends them).

## Read first
- games/gnome-theft-auto/src/scenery.ts (all of it: you change it).
- games/gnome-theft-auto/src/scenery.test.ts.
- games/gnome-theft-auto/src/regionThemes.ts and src/data/regionThemes.json: RegionTheme fields (roadside
  'hedge' | 'wall' | 'fence' | 'none', hedge, wall, fence, planting, border, signature, trees), `themeAt(x, z, u)`
  (pass a number from your seeded generator as u so borders blend), `themeSize(id)` (longest side in metres for
  prefabs built at a reduced scale, else null = scale 1).

## Change
games/gnome-theft-auto/src/scenery.ts (and its test only):
- A helper `scaleFor(id)`: themeSize(id) ? themeSize(id) / (longest horizontal side of the prefab's measured box) : 1.
  Use it for every placement's scale (trees keep their 0.9-1.3 random factor multiplied on top).
- A helper `pieceLength(id)`: the measured length along x times scaleFor(id) (hedgerow 4, adobe-wall 4, split-rail 4,
  snowcap 4, wattle-fence 3, dry-stone-wall 4, wooden-fence 4 after scaling).
- Roadsides: replace the fixed "farmland/parkland -> hedgerow, tundra/forest -> dry-stone-wall" with: for every highway
  segment and side, walk pieces end to end (step = pieceLength of the chosen piece) at offset 9 m, gap 10 m every 60 m;
  for each piece, theme = themeAt(x, z, rnd()); id = theme.roadside === 'hedge' ? theme.hedge : 'wall' ? theme.wall :
  'fence' ? theme.fence : null (skip, and skip null ids). Collider top: measured height * scale. Same skips as now
  (city + 100 m, junctions, water, colliders, stage keep-outs which arrive in `existing`).
- Belts: at each kept belt point, theme = themeAt(x, z, rnd()); 75 %: a tree from theme.trees (as now, any tree id);
  25 %: a piece from theme.planting instead (no trunk collider; colliders only for pieces whose measured footprint min
  side >= 1.5, like rock-garden). Desert keeps its sparse boulders where theme.trees has only 'palm-tree': use palms at
  40 % of points and 'garden-rock' at 20 %.
- Signature props: along every highway segment outside the city + 100 m, every 90-150 m (seeded), one prop from
  themeAt(x, z, rnd()).signature at 15-20 m off the road on a random side, yaw random, same skips.
- Keep MAX_PLACEMENTS (2500) but raise it to 3200; roadside first, then signature props, then belts.
- scenery.test.ts: keep the existing checks; replace "at least one 'hedgerow' and one 'dry-stone-wall'" with: the
  placements include each of 'hedgerow', 'adobe-wall', 'split-rail-fence', 'snowcap-stone-wall', 'wattle-fence'
  (the roadside pieces of five regions) and at least one of 'stone-cairn', 'tall-cactus', 'bee-skep', 'hay-bale'; and
  that roadside pieces in the middle of a region (borderDistAt from './landforms' > 60) are that region's own piece.
  (If a region's highways are all within the skips so its piece never appears, report it and drop it from the list.)

## Done when
- `npx vitest run src/scenery.test.ts src/quests/stages.test.ts src/cutscene/scenes/scenes.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.

## Out of scope
world.ts, settlements.ts, landscaping.ts, regionThemes.ts, data/*, packages/.
~~~~

### 4B Outer-region settlements: house clusters with yards, driveways and fences

~~~~text
Epic: 4
Depends on: Epic 3 (the house and motif prefabs exist)

## Environment
See "Shared environment" in docs/roadmaps/gta-world-terrain-pass.md (read it first). Other workers are editing
scenery.ts and landscaping.ts at the same time.

## Goal
Clusters of gnome houses along the outer roads of every region outside Turfton, each house with a driveway to the
road, a fenced yard and yard dressing, all in its region's theme, built as one static batch with colliders.

## Read first
- games/gnome-theft-auto/src/settlements.ts (the stub you fill: keep the exported names and types exactly).
- games/gnome-theft-auto/src/regionThemes.ts and src/data/regionThemes.json (houses, fence, paving, yard, planting,
  palette.walls / palette.roofs, themeAt, themeSize).
- games/gnome-theft-auto/src/scenery.ts (a sibling planner: how it measures prefabs, keeps clear of `existing`
  colliders with a cell grid, skips water and the city, places on heightAt) - copy those helpers' approach, do not
  import from scenery.ts.
- games/gnome-theft-auto/src/stageClear.ts (stageKeepOut(): rects around every cutscene stage spot; keep clear).
- games/gnome-theft-auto/src/levels.ts: markersOf('reserve') + markerNum(m, 'hw'|'hd') (flat sites, including the
  Speedway race track 'reserve/speedway'); highways(); regionAt(x, z).
- games/gnome-theft-auto/src/config.ts: HIGHWAYS, ROAD_WIDTH, CITY_HALF, SPAWN, PLACES, BASE, AIRFIELD, WORLD_HALF.
- packages/prefabs/src/batch.ts: StaticPrefabPlacement has tint and trim.

## Change
games/gnome-theft-auto/src/settlements.ts (and a new test):
- Seeded with mulberry32(7331) from '@lawn/level'. Measure prefabs with
  `new THREE.Box3().setFromObject(buildPrefab(id, { lights: false }))` (cached). Scale: themeSize(id) ? that /
  longest horizontal side : 1, times a random 0.9-1.15 for houses.
- Cluster sites: walk every HIGHWAYS polyline; along it, every 180-260 m (seeded) propose a cluster centre on the
  road. Keep it when the point is beyond Turfton: Math.max(|x|, |z|) >
  CITY_HALF + 140, and themeAt(x, z).houses is not empty (Turfton has none).
- A cluster: 3 to 6 lots, alternating sides of the road, spaced 18 m along it (use the road direction at that point).
  Lot: the house centre 21 m from the road centre line, front (+z of the prefab) facing the road
  (yaw = atan2(towardRoad.x, towardRoad.z)). House id: rnd pick from theme.houses; tint from theme.palette.walls,
  trim from theme.palette.roofs (rnd pick each).
- Reject a lot (try the next) when: the house footprint grown by 4 m is not level (max - min heightAt at its centre and
  4 corners > 1.0); any point of it is on water (onWaterCourse(x, z, 6) from './water'); it is within 3 m of an
  `existing` collider or a stageKeepOut() rect; it overlaps a reserve marker rect grown by 12 m, BASE or the airfield
  bounds grown by 12 m; it is within 30 m of SPAWN or any PLACES point; any highway centre line other than its own
  road comes within 14 m of it; |x| or |z| > 860.
- Per accepted house: (a) the house; (b) a driveway: theme.paving pieces ('paver-drive', 3 wide x 6 long along its
  z) end to end from 1 m past the road edge (ROAD_WIDTH / 2 + 1) to the house front, yaw so its long axis points at
  the road; (c) a fence: theme.fence pieces along the lot's two sides and back (a rectangle 14 wide x 16 deep around
  the house, the road side open), pieces end to end by their measured length after scaling, dropping pieces that hit
  water or colliders; (d) yard dressing: one theme.yard item beside the house (3-4 m to a side) and one or two
  theme.planting items in front; (e) a 'mailbox' at the drive's road end, 1.5 m to one side (skip if theme.yard has no
  'mailbox').
- y = heightAt(x, z) for every piece (fences: lowest of their two ends minus 0.05).
- Colliders (absolute tops): house = its rotated footprint, h = y + measured height * scale; fence pieces = their
  rotated footprint, h = y + 1.1; yard items with footprint min side >= 1 get one too. Drives, planting and mailboxes:
  none. houses[] gets { x, z, region: regionAt(x, z) } per house.
- Budget: at most 140 houses and 2400 placements.
- buildSettlements(scene, boxes): plan with `[...boxes, ...stageKeepOut()]` as existing, one
  `buildStaticPrefabs(placements, { lights: false, name: 'settlements' })`, push plan.boxes into `boxes`.
- New test games/gnome-theft-auto/src/settlements.test.ts (installFakeDom() from './testing/fakeDom' first if needed):
  deterministic (same twice); 40 to 140 houses; every region except 'turfton' has at least 3 houses (if one cannot,
  print which and why in your report and assert the others); no house in Turfton grown by 140; no house collider
  overlapping a stageKeepOut() rect, a reserve marker rect (incl. 'reserve/speedway') or water; no house within 12 m of
  a highway centre line; every house id is in its region's theme (themeAt may blend near borders: allow the
  neighbour's).

## Done when
- `npx vitest run src/settlements.test.ts src/quests/stages.test.ts src/cutscene/scenes/scenes.test.ts src/landforms.test.ts`
  passes (landforms "keeps its buildings on level ground" covers houses too).
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.

## Out of scope
world.ts (already calls buildSettlements before buildScenery), scenery.ts, landscaping.ts, regionThemes.ts, data/*,
packages/.
~~~~

### 4C Civic Turfton: the city gardens take the Turfton theme

~~~~text
Epic: 4
Depends on: Epic 3 (the 'civic-railing' prefab exists)

## Environment
See "Shared environment" in docs/roadmaps/gta-world-terrain-pass.md (read it first). Other workers are editing
scenery.ts and settlements.ts at the same time.

## Goal
Turfton's garden blocks read as civic gardens in the Turfton theme: their ids come from the theme table, and some
blocks get iron railings on stone kerbs instead of a hedge on their street side.

## Read first
- games/gnome-theft-auto/src/landscaping.ts and src/landscaping.test.ts.
- games/gnome-theft-auto/src/regionThemes.ts (REGION_THEMES.turfton: hedge 'hedgerow', fence 'civic-railing',
  planting ['topiary-cone', 'boxwood-ball', 'flower-bed'], border 'garden-border', signature ['stone-planter']).

## Change
games/gnome-theft-auto/src/landscaping.ts (and its test only):
- Take the hedge id from REGION_THEMES.turfton.hedge, the border piece from .border, the corner pieces from
  .planting / .signature where they match today's choices (keep 'ornamental-grass' and 'lavender-row' as they are).
- Railings: in full blocks, with probability 0.35 (one more rnd draw per block, taken after the existing ones so the
  rest of the layout keeps its order), the hedge on ONE side (rnd pick of the four) is replaced by
  REGION_THEMES.turfton.fence pieces ('civic-railing', 3 m long along x) end to end on the same line, keeping the same
  6 m entrance. Railings are solid (collider h = 1.0).
- landscaping.test.ts: add a test that over 40 seeded blocks some contain 'civic-railing' and none contain a hedge on
  the railing side's line where railings stand (no overlap between hedge and railing rects).

## Done when
- `npx vitest run src/landscaping.test.ts src/quests/stages.test.ts src/cutscene/scenes/scenes.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.

## Out of scope
world.ts, scenery.ts, settlements.ts, regionThemes.ts, data/*, packages/.
~~~~

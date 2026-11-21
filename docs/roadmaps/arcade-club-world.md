# Arcade thumbnails, Club Gnome surfaces every game, new world elements

Goal: the landing page has no card without an image, Club Gnome has a way into every listed game, and the town gains
things that move and things to look at (a getaway car for Gnome Theft Auto, a basketball court for GBA GJAM, ...).

| Epic | Done when | Issues |
|---|---|---|
| 1 Foundations | prefabs exist, thumbnails exist, `GAME_LINKS` has all games | 2 workers + planner edits `config.ts` |
| 2 Club content | every map edited, ambient traffic running; `npm test -w games/club-gnome` + build pass | 4 |

Landing-page games missing from Club Gnome today: gba-gjam, gnome-theft-auto, cooking-gnoma, gnome-company,
gnomillion, incregnomtal, paragnormal, peak-climb, tribute-schedule, sample-dodge, wordle-gnome, gnomeokemon.
Missing thumbnails: gba-gjam, gnome-theft-auto (me is unlisted and water-flow is hidden: no card, no thumbnail needed).

Planner (not a worker) adds these to `GAME_LINKS` in `games/club-gnome/src/config.ts` before epic 2, keys:
`gjam, gta, cooking, company, gnomillion, incregnomtal, paragnormal, peak, tribute, dodge, wordle, gnomeokemon`.
Planner also regenerates `maps.golden.json` and adds `src/coverage.test.ts` after epic 2. Workers never touch these.

## Issue 1.1: thumbnails

~~~~text
Epic: 1 Foundations
Depends on: none

## Environment
Working directory C:\Users\cstab\Documents\gaming (Git Bash; if node is missing:
export PATH="/c/Program Files/nodejs:$PATH"). Windows, Edge is installed. Other workers edit other files at the same time.
Do not commit.

## Goal
games/gba-gjam/thumbnail.jpg and games/gnome-theft-auto/thumbnail.jpg exist (480x270 JPEG showing gameplay, not a menu).

## Read first
- tools/thumbnails.cjs: SHOTS table (per game: suffix hash/query, wait seconds, optional prepare(page) to click through menus),
  `clickText` helper, and the main loop that starts vite on a free port and screenshots.
- games/gba-gjam/src and games/gnome-theft-auto/src/main.ts (+ README.md of each): find a hash/query that skips the title
  (e.g. #play, ?autostart) or what button text to click. For gnome-theft-auto the shot should show the town with vehicles
  or the player, not a loading screen; wait long enough (WebGL, a few seconds).

## Change
- tools/thumbnails.cjs: add a SHOTS entry for 'gba-gjam' and one for 'gnome-theft-auto' following the existing entries.
- Run: node tools/thumbnails.cjs gba-gjam gnome-theft-auto  and open each resulting jpg (Read tool shows images) to check
  it is a real gameplay frame, not blank/black/menu. Adjust suffix/wait/prepare and rerun until it is.

## Done when
- both thumbnail.jpg files exist, are about 480x270, and show gameplay
- no vite dev servers are left running (check the process list; kill any you started)

## Out of scope
Any other game's thumbnail, tools/build-site.mjs, game source code.
~~~~

## Issue 1.2: prefabs

~~~~text
Epic: 1 Foundations
Depends on: none

## Environment
Working directory C:\Users\cstab\Documents\gaming (Git Bash; if node is missing:
export PATH="/c/Program Files/nodejs:$PATH"). Other workers edit other files at the same time. Do not commit.

## Goal
Two new prefabs, `gta-getaway-car` and `gta-taxi`, in the shared prefab library: small gnome-scale road cars for Gnome Theft Auto.

## Read first
- packages/prefabs/src/catalog/gta-world.ts: the `gta-ambulance` entry is the model (fields id, name, category, uses, tags,
  emoji, footprint, pivots, about, examine, parts). Copy its structure exactly.
- docs/roadmaps/prefab-library/_common.md: rules for a PrefabDef (examine lines, tags, part shapes).
- packages/prefabs/src/catalog.test.ts: what the tests demand.

## Change
- packages/prefabs/src/catalog/gta-world.ts: append two PrefabDefs to the exported array, after `gta-hospital`/`gta-mulch-club` order doesn't matter:
  - `gta-getaway-car`: name 'Getaway Hatchback'. Sporty hatchback about 0.9 wide, 2.0 long, 0.8 tall, nose toward +z, body colour from
    the 'tint' part kind if other prefabs use `c: 'tint'` (check furniture.ts/golf-cart.ts for how tint works), otherwise 0xd64541.
    Parts: lower body box, cabin box, windscreen/rear window (alpha), 4 wheels (cyl rotated 90 on z, mirror: true), two
    headlights (glow: true), a tail light pair, a spoiler, a small 'GNOME' number plate box. footprint { r: 1.2, h: 0.9 }.
  - `gta-taxi`: name 'Turfton Taxi'. Yellow (0xf2c230) saloon, same size, a roof sign box (glow: true) with a `pivots` entry
    `sign` and group 'sign' on its parts, checkerboard stripe of alternating small black/white boxes along the side.
  - Both: about text, tags including 'car','vehicle','gta', and 5 examine lines in the same tone as gta-ambulance (jokey, gnome-sized:
    the doors are for hats, the boot holds exactly one garden gnome and a getaway sandwich).
- Run the catalog tests and fix what they flag.

## Contract
Ids are exactly `gta-getaway-car` and `gta-taxi`. Both face +z, sit on y = 0 (wheels touch the ground), and are placed via
`{ prefab, x, z, rot, scale }` in club-gnome level JSON by a later issue.

## Done when
- `npm test -w packages/prefabs` passes
- `npx tsc --noEmit -p packages/prefabs` passes (if that project has no tsconfig, skip this line)

## Out of scope
Any other prefab file, any game folder.
~~~~

## Issue 2.1: arcade map

~~~~text
Epic: 2 Club content
Depends on: none (GAME_LINKS already has the new keys)

## Environment
Working directory C:\Users\cstab\Documents\gaming (Git Bash; if node is missing:
export PATH="/c/Program Files/nodejs:$PATH"). Other workers edit other map files at the same time. Do not commit.
Do NOT regenerate or edit maps.golden.json (the planner does) and do not edit config.ts or levelDocs.ts.

## Goal
The Arcade (games/club-gnome/src/data/levels/arcade.level.json) has a cabinet for 7 more games, so 13 in total.

## Read first
- games/club-gnome/src/data/levels/arcade.level.json: existing 6 cabinets: a `props` entry {prefab:'arcade-cabinet',x,z},
  a `blockers` rect (one wide rect behind the row), a `markers` entry {kind:'spot', id:'cab-<key>', x, z, r:1.4,
  data:{label:'Play X', game:'<GAME_LINKS key>'}} one metre in front of the cabinet, and a `signs` entry above each
  (y: 1.95). bounds is {w:20,d:14}; the exit portal is at (0,6).
- games/club-gnome/src/maps.test.ts: the rules the data must satisfy (spots standable, within edge clearance 0.8, cabinet props
  need a spot within r-0.2, solid props need a blocker containing the centre, unique ids, prefabs exist).
- games/club-gnome/src/config.ts GAME_LINKS: the valid game keys.

## Change
- arcade.level.json only. Widen bounds to {w:30,d:18} (keep exit portal reachable; move the portal and spawn only if needed;
  the wall rects follow bounds automatically). Add cabinets, spots (ids `cab-<key>`), blockers and signs for these keys, in
  this order: cooking ('Cook in Cooking Gnoma'), wordle ('Play Wordle (it is gnome)'), gnomillion ('Play Once in a Gnomillion'),
  peak ('Climb Peak Climb'), company ('Run Gnome Company'), tribute ('Open Tribute Schedule'), dodge ('Dodge!').
  Layout: keep the existing back-wall row; extend it at 3 m spacing to both sides, then put any that do not fit in a second row
  against the front-left/front-right walls facing the room (rot), always with a spot 1 m in front, a blocker rect and a sign.
  Add a few decorative props (existing prefabs only, e.g. 'plant', 'vending-machine', 'arcade-cabinet' is for games only)
  and, if there is a prefab 'gba-basketball' or similar, a "high score" sign. Keep it tidy and walkable.
- Only the 7 games above go in the arcade.

## Done when
- `npx vitest run --root games/club-gnome src/maps.test.ts src/walk.test.ts src/levelDocs.test.ts` passes
  (maps.golden.test.ts will fail until the planner regenerates its fixture; ignore it)
- `npx tsc --noEmit -p games/club-gnome` passes

## Out of scope
town/park/gnomecino JSON, config.ts, world.ts, maps.golden.json.
~~~~

## Issue 2.2: town map

~~~~text
Epic: 2 Club content
Depends on: prefabs `gta-getaway-car`, `gta-taxi` (epic 1, done)

## Environment
Working directory C:\Users\cstab\Documents\gaming (Git Bash; if node is missing:
export PATH="/c/Program Files/nodejs:$PATH"). Other workers edit other map files at the same time. Do not commit.
Do NOT regenerate or edit maps.golden.json, config.ts, levelDocs.ts, world.ts.

## Goal
Town Square (games/club-gnome/src/data/levels/town.level.json) gets two new places that open games, and a road ring
for the ambient traffic that another issue animates.

## Read first
- town.level.json: bounds 44x32; `data.buildings` (id,label,x,z,w,d,h,color,roof,link,neon), `markers` of kind 'spot'
  ({id,x,z,r,data:{label,game}}) like spot-bowling at (14,-6.2) linked from building 'bowling' via `link`, `data.signs`,
  `data.blockers`, `data.patches` (flat coloured floor rects {x,z,w,d,color:'#rrggbb'}), `props`.
- games/club-gnome/src/maps.test.ts: the rules the data must satisfy (spots standable, 0.35 clearance from buildings/blockers,
  0.8 from edges, unique ids, prefabs exist, solid prefabs need a blocker containing their centre).
- docs/lore/ (run `npm run lore -- find turfton` and `find tall-house`): names and tone for Turfton and the Tall House.

## Change (town.level.json only)
1. "TURFTON ALLEY" for key `gta` (game gnome-theft-auto): a building (dark grey wall, orange roof, neon true) in free space, with
   a spot `spot-gta` linked by `link`, label 'Steal a mower in Gnome Theft Auto', a sign, `gta-getaway-car` props parked in front
   (one tinted via "tint" only if the prefab supports it; give each a blocker rect containing its centre), a 'wanted-poster' prop.
2. "THE TALL HOUSE" for key `paragnormal` (game paragnormal): a tall narrow building (h 7, purple-grey, black roof) in the north-west
   corner area, spot `spot-paragnormal`, label 'Investigate Paragnormal', a spooky tree or two ('broadleaf-tree' scale 3.5 is used elsewhere).
3. A road ring: `patches` entries drawn dark grey (#3a3a42) with a pale dashed centre (thin patches #f0e6a0) forming a rectangle loop
   around the fountain, roughly x in [-9.5, 9.5], z in [-4.8, 4.8] centre-line, 1.6 wide, tucked inside the existing benches/lamps
   where they allow; if the ring collides with benches/lamps, move those props a little rather than shrinking the plan. Patches are
   floor only: they do not block walking. Write the loop centre-line in a new `markers` entry
   {id:'traffic-loop', kind:'path', ...} ONLY IF levelDocs supports it; otherwise do not add one (the ambient issue hardcodes the ring).

## Done when
- `npx vitest run --root games/club-gnome src/maps.test.ts src/walk.test.ts src/levelDocs.test.ts` passes
  (maps.golden.test.ts will fail until the planner regenerates its fixture; ignore it)
- `npx tsc --noEmit -p games/club-gnome` passes

## Out of scope
other maps, config.ts, world.ts, maps.golden.json.
~~~~

## Issue 2.3: park map

~~~~text
Epic: 2 Club content
Depends on: none (GAME_LINKS already has the new keys; prefabs gba-hoop and gba-basketball already exist)

## Environment
Working directory C:\Users\cstab\Documents\gaming (Git Bash; if node is missing:
export PATH="/c/Program Files/nodejs:$PATH"). Other workers edit other map files at the same time. Do not commit.
Do NOT regenerate or edit maps.golden.json, config.ts, levelDocs.ts, world.ts.

## Goal
Links Park (games/club-gnome/src/data/levels/park.level.json) gets the GBA GJAM court, the Bare Patch and a Field Lab spot.

## Read first
- park.level.json: bounds 44x32; spots (golf, gnaft, front, pup, gnomomia), `data.signs`, `data.patches`, `data.blockers`, `props`.
- games/club-gnome/src/maps.test.ts: the rules the data must satisfy (spots standable, 0.35 clearance from buildings/blockers,
  0.8 from edges, unique ids, prefabs exist, solid prefabs need a blocker containing their centre).
- docs/lore: `npm run lore -- find gnomerena`, `find bare-patch`, `find gba` for names and tone.

## Change (park.level.json only)
1. GBA GJAM court for key `gjam` (game gba-gjam): an outdoor half-court of floor patches (orange wood #c9803a, white line
   patches #f4f4f4: boundary, key, centre arc approximated with rects) about 10x7 in free space, two 'gba-hoop' props
   (solid: add blockers containing their centres, rotate to face the court), a spot `spot-gjam` at court centre, label
   'Play GBA GJAM', a sign "THE COURT · 2-on-2". Add a bench or two ('bench').
2. Bare Patch for key `incregnomtal` (game incregnomtal): near the east fence (existing sign "THE FENCE"), a dirt patch
   (#7a5a3a) with a few 'round-bush' and a hand-sized sprout look using existing prefabs, a spot `spot-patch`, label
   'Grow the Bare Patch', sign "THE BARE PATCH".
3. Field Lab for key `gnomeokemon` (game gnomeokemon): a spot `spot-fieldlab` near the forest/tree edge, label 'Snap photos at the Field Lab',
   a sign "FIELD LAB · photo safari", a 'hq-tent' prop (solid: add blocker) if free space allows.
Keep every spot 1+ m from other spots' circles and reachable. Do not move existing spots.

## Done when
- `npx vitest run --root games/club-gnome src/maps.test.ts src/walk.test.ts src/levelDocs.test.ts` passes
  (maps.golden.test.ts will fail until the planner regenerates its fixture; ignore it)
- `npx tsc --noEmit -p games/club-gnome` passes

## Out of scope
other maps, config.ts, world.ts, maps.golden.json.
~~~~

## Issue 2.4: ambient traffic and the court ball

~~~~text
Epic: 2 Club content
Depends on: prefabs `gta-getaway-car`, `gta-taxi`, `gta-ambulance` (exist), `gba-basketball` (exists)

## Environment
Working directory C:\Users\cstab\Documents\gaming (Git Bash; if node is missing:
export PATH="/c/Program Files/nodejs:$PATH"). Other workers edit map JSON files at the same time. Do not commit.

## Goal
The town has a getaway car, a taxi and an ambulance driving a loop round the fountain, and the park has a basketball that bounces
on the court. Purely visual; they never block walking.

## Read first
- games/club-gnome/src/glow.ts: the `MapExtra` interface ({ update(dt, t) }) and `addGlows(g, map)`; copy its shape.
- games/club-gnome/src/world.ts around line 300-315: where per-map extras are added (`if (map.id === 'gnomecino') {...}`),
  and `addProp` (how a prefab is built: it uses buildPrefab from '@lawn/prefabs' ; reuse the same call).
- packages/prefabs/README.md: buildPrefab and pivots (`siren` on the ambulance and `sign` on the taxi are groups you can spin/flash).

## Change
- NEW games/club-gnome/src/ambient.ts:
  - `export function addTownTraffic(g: THREE.Group, map: MapDef): MapExtra`: builds 3 cars (`gta-getaway-car`, `gta-taxi`,
    `gta-ambulance`, scale 1) and drives them round a rounded-rectangle loop with centre-line x in [-9.5, 9.5], z in [-4.8, 4.8]
    (corner radius 2), counter-clockwise, evenly spaced, speeds 2.2, 1.8 and 2.8 m/s. Yaw follows the heading (prefabs face +z).
    Slow down to a stop for 1.5 s when any local gnome stands within 1.2 m of the car: take an optional second argument
    `getPlayer?: () => {x:number;z:number} | null`; default none. The ambulance spins its `siren` pivot; the taxi sign pulses.
  - `export function addCourtBall(g: THREE.Group, map: MapDef): MapExtra`: finds the spot with id 'spot-gjam' in map.spots and bounces a
    `gba-basketball` prefab above it: y = |sin(t*3)|*1.1 + 0.15, plus a small squash-free spin. If the spot is missing, do nothing.
  - Both pure functions of (dt, t); no DOM at import time; use the same THREE import style as glow.ts.
- games/club-gnome/src/world.ts: in the same block as the gnomecino check add
  `if (map.id === 'town') extras.push(addTownTraffic(g, map));` and `if (map.id === 'park') extras.push(addCourtBall(g, map));`
  and the import. Nothing else.
- NEW games/club-gnome/src/ambient.test.ts: unit test the pure path helper only: export `loopPoint(s: number): {x:number;z:number;yaw:number}`
  (s in [0,1) along the ring) from ambient.ts and test it is continuous (s=0 and s→1 within 0.1 m), stays inside the bounding box, and yaw is finite.

## Done when
- `npx vitest run --root games/club-gnome src/ambient.test.ts` passes
- `npx tsc --noEmit -p games/club-gnome` passes

## Out of scope
Map JSON, config.ts, maps.golden.json, other games.
~~~~

# Gnome Theft Auto: parks, city scenery and the fringe

The user's words: "Develop the parks further and add more scenery in the city. Add some rougher buildings on the
outskirts of the city that blend into the surrounding environments so there isn't as much of an abrupt cutoff."

Three parts:

1. **Parks.** Six named parks (lore: `docs/lore/entries/apocrypha/turfton-parks.md`): Gnorwin Clayfoot Park (-30, 30)
   gains a monument, benches, lamps and a wishing fountain round its existing fountain; five garden blocks become parks:
   Bandstand Green (-30, -150), Kilnside Rec (-150, -30), Mallard Mere (-30, 150), Clayfoot Rose Garden (150, 30),
   Pure-Loam Allotments (150, 90). Paths, ponds, lawns, flower beds, groves, a bandstand, a pavilion, a playground, a
   pitch, a skate corner, a market row, a hedge maze, a rose garden, allotments, statues, lamps, bins, noticeboards.
   Life: a few townsgnomes per park (ambientGnomes.ts, idles from src/anim), ducks on the mere; benches to sit on
   (the sit-bench emote) and two fountains that take an Acorn for a wish (a fortune, a splash of Glaze, or a coin back).
2. **City scenery.** Street furniture per district in the strip just behind every sidewalk (never on the sidewalk or in
   a lane), street trees, banner poles and bunting across downtown streets, kiosks and carts, alley clutter, and painted
   marks: crosswalks at every grid crossing that has none, manholes, drains, oil stains, chalk, graffiti and posters on
   walls in Old Brick and the industrial quarter.
3. **The fringe.** A belt from the city edge out to |x| or |z| = 400 (lore: `turfton-fringe.md`, four edges Scrapside,
   Stumpend, Chillyard, Lockside): rough lots (workshops, lock-ups, warehouses, container yards, caravans, half-built
   houses, nissen huts, polytunnels, farm sheds, water towers), a junkyard, The Rusty Tine pub, dirt tracks peeling off
   the highways, power poles and wires along the roads, and the region's own green creeping in (tree clumps, hedgerows,
   long grass and weeds as mowable plants). Density falls with distance; each lot takes the look of the neighbouring
   region (`fringe/belt.ts FRINGE_THEMES`, chosen with `themeAt` so borders blend).

## Decisions

- **Out of buildWorld.** Everything is built by `src/cityScenery/install.ts installCityDressing(scene, world)`, called
  once from app.ts after every system that adds colliders (after `buildEstates`), like the skyways. The golden layout
  test snapshots buildWorld only. The one buildWorld change: the five new park blocks skip their garden
  (`parks/blocks.ts isParkBlock`; the garden is still planned and thrown away so every later block draws the same random
  numbers). That changes the golden on purpose (fewer garden placements and colliders in those five blocks).
- **One Site** (`cityScenery/site.ts`): a spatial index of every collider and keep-out (stage spots, givers, details,
  ambient gnomes, pickups, vibe set pieces, parked vehicles, stunt ramps with their landing run, reserves, the fort,
  the airfield, skyway work sites), plus road distance, water, bridges and skyway decks. Parks plan first, then the
  street, then the fringe; each placement `free`s then `claim`s. Ground patches have their own overlap registry
  (`patchFree` / `claimPatch`) so two patches never z-fight.
- **Static and cheap.** Every prefab goes through `buildStaticCells` per cull class (cityScenery/build.ts: 64 m cells
  for detail and props, 128 m for trees and buildings), so each cell is 1-3 draw calls and is culled by distance (scaled
  by the quality tier). Patches, marks and wires are merged per cell and registered with the culler. Mowable plants go
  to flora (`addMowablePlants`, docs/roadmaps/gta-mowable-plants.md) and never get a collider. Ambient life is capped
  (park gnomes <= 20, ducks <= 8, updated only within 120 m).
- **Online.** Everything is seeded and planned from the same world on every client; no new messages. Wishes and
  sitting are local.
- **Mobile.** No new controls: benches and fountains use the existing interact prompt (touch button included).
- **Achievements.** None added (no new mechanic worth one; the wish is a small flavour reward).
- **Prefabs.** 54 new ones in seven catalog files (street kit A/B, park kit A/B, fringe kit A/B, fringe yard). Power
  wires and bunting strings between poles are generated thin boxes (their span varies); everything else is a prefab.
- **Not done here.** Tower roofs (rooftop gear) belong to the tower-styling workstream. No drivable ramp in the skate
  corner (the props are scenery).

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 0 Foundation (planner) | site.ts, types.ts, build.ts, install.ts, kit.ts, belt.ts, stubs, prefab stubs, world.ts park skip, app.ts hook, interactables `addInteractSpot`, ambientGnomes `defs`; tsc clean in these files | - |
| 1 Build-out | every issue's check; `npm test -w packages/prefabs`; `npm test -w games/gnome-theft-auto`; build | 17 |
| 2 Check (planner) | golden updated on purpose, overlap test, screenshots, zfight, smoke, perf before/after | - |

Hot-file edits (planner, all small): `world.ts` (+1 import, +1 line in the block loop), `app.ts` (+1 import, the
install call after buildEstates, one update call, a 'gta:emote' listener), `ambientGnomes.ts` (optional `defs`
parameter), `interactables.ts` (`ExtraSpot` / `addInteractSpot`), `packages/prefabs/src/catalog/index.ts` (+7 imports).
Not touched: landscaping.ts, scenery.ts, settlements.ts, towers.

## Measured cost

`node tools/gta-perf.mjs http://localhost:5440/ --cpu 4`, 390x844 @2x, same build, `&dressing=0` (before) vs default
(after). Other planners were running browsers on the same machine, so frame times are noisy; draw calls and triangles
are the reliable numbers.

| leg | draw calls avg before -> after | tris avg (k) before -> after | meshes at leg end |
|---|---|---|---|
| Turfton | 261 -> 309 (+18 %) | 648 -> 763 (+18 %) | 4016 -> 5008 |
| Turfton (back, via the east fringe) | 207 -> 226 | 444 -> 462 | |
| Frostbite Fells (leaves through the north fringe) | 163 -> 166 | 365 -> 386 | |
| Dust Flats / others | within noise | within noise | |

Everything is static, merged per 64/128 m cell and culled by class distance (scaled by the quality tier); no per-frame
work except the park gnomes (existing ambient-gnome LOD) and up to 8 ducks within 120 m.
Screenshots (headless Edge, port 5440, camera over each area) were checked for every park, two streets and all four
fringe edges.

## Run log

- Epic 0 done (planner). Worker slots were shared with other planners (limit 20), so Epic 1 ran as slots freed.
- Planner did 1K (marks.ts), 1L (decals.ts), 1N (life.ts), 1Q (dressing.test.ts) directly; workers did the rest.
- Fixes after the workers: Gnorwin gets no monument (easterEggs.ts already builds Gnorwin's coned statue at
  (-30, 24.8); it is a Site keep-out now) and its south benches moved off the fountain-vault ramp run; the busker at
  Bandstand Green moved to v 1.8 so the bandstand fits; Bandstand Green's east/west paths moved into the hedge gates;
  1I placed the Mallard Mere loop's patch claims as four strips round the pond and the duck feeder without a claim;
  1O's cable-count check became "wires in pairs, at least one per pole" (a skipped pole splits a run).
- Checks: `npm test -w packages/prefabs` 2555 pass; tsc clean; src/parks, src/cityScenery, src/fringe tests pass
  (dressing.test.ts: no collider on lanes, sidewalk cores, water, decks, existing colliders or parked spots; no
  overlapping ground patches; budgets; deterministic). Full game suite: the only failures are not this workstream's
  (layout golden: towers-sign / towers-trim vertex counts from the tower-styling work in progress; terrainDrive slope
  test; traffic and quests tests pass on rerun). The golden already includes the five park blocks' missing gardens.
- zfight (`npm run zfight`): 33 pairs, mostly elsewhere; ours: a few street-prop cells flagged against the terrain only
  beyond ~224 m (past their draw distance) and one park pavement patch. Left as a follow-up.
- Not done: map labels for the parks and fringe edges (mapPois / mapIcons were being edited by two other planners);
  per-prefab size test (sizes were checked by hand by the workers).

## Epic 1 issues

Every issue below starts with this environment block:

~~~~text
## Environment (common)
Repo C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn, game games/gnome-theft-auto (Vite + TypeScript + three.js,
vitest). In Git Bash, if node is missing: export PATH="/c/Program Files/nodejs:$PATH". Many other workers (and other
planners) edit other files in this repo at the same time: touch ONLY the files under Change; edit existing files with
small Edit calls. Do not commit, stash, switch branches, run `vite build` or start a dev server. tsc errors in files that
are not yours belong to someone else: ignore them.
World facts: 1 unit = 1 m; a gnome is about 1 m tall; y is up; three.js yaw (rotation.y) 0 faces +z, a prefab's front is
its +z. Turfton (the city) is |x|, |z| <= 215, a grid of roads on x and z = -180, -120, -60, 0, 60, 120, 180 (road 10 wide,
sidewalk 2.5 each side, so a sidewalk ends 7.5 m from the road centre line). Outside it the ground has hills: always
use heightAt(x, z) from 'src/terrain.ts' for y.
Repo rules: flat things on the ground get a draw layer (flatLayer(material, LAYER.x) from '@lawn/depth'), two flat
things in the same layer must never overlap; new objects come from @lawn/prefabs; no per-frame allocation; small
plants (flora/kinds.ts mowableAt) never get colliders.
~~~~

### Prefab issues (1A-1G)

They share this block (pasted into each):

~~~~text
## Prefab rules (common to 1A-1G)
You replace placeholder boxes in ONE catalog file with real models. Read first:
- packages/prefabs/src/types.ts (PrefabDef, Part, shapes, what `d` means per shape) and packages/prefabs/src/palette.ts
  (colour names; any 0xRRGGBB number also works).
- packages/prefabs/src/catalog/gta-region-motifs.ts: a finished life-size GTA file to copy the style of.
Contract: keep every id, keep `category: 'prop'`, `uses: ['place']` (add 'sit' + `seat` only where the issue says),
keep a `footprint: { r, h }`. The model's overall size (width x depth x height = x, z, y) must be within 10 % of the size
listed for it: other workers' code measures these prefabs to lay out parks and lots right now. Lowest point at y = 0
(+-0.03), centred on x and z, front on +z. 6 to 30 parts each (40 max), seg 6-12, chunky low-poly. `tint`/`trim` where
the issue says (`c: 'tint'` parts and a default `tint`). Life-size metres: a gnome is about 1 m tall.
Examine: 5 lines each (9-160 chars, all different) in this voice: gnomes are fired clay made by the vanished Tall Ones;
they never recognise human objects for what they are (describe, do not name the real purpose); mix (1) what it looks like
up close, (2) a saying, (3) a practical tip, (4) a dry joke, (5) an odd detail hinting at a story. No named characters.
Tags: lower-case single words (material, noun, synonyms) plus 'gta'. `about`: one plain line (what it is, what tints).
Checks: `npx tsc --noEmit -p packages/prefabs` has no error in your file; `npm test -w packages/prefabs` passes for your
ids (it checks ids, examine lines, palette names, part sizes, standing on the ground, centring, size < 30 for props
with a footprint). Read your file once top to bottom at the end.
Out of scope: every other file (types.ts, palette.ts, catalog/index.ts, other catalog files, games/).
~~~~

~~~~text
Epic: 1, issue 1A: street kit A (packages/prefabs/src/catalog/gta-street-kit.ts)
Depends on: none
[Environment (common) and Prefab rules (common to 1A-1G) pasted here]
## Goal
Model the eight Turfton street-furniture prefabs in gta-street-kit.ts (sizes w x d x h in metres).
## Change
- park-bench 1.8 x 0.7 x 0.9: slatted wooden seat at 0.45 m on two cast-iron end frames, slatted back on the -z side (it
  faces +z). uses ['place', 'sit'], seat [0, 0.45, 0.05]. trim = the wood colour (c: 'trim' on the slats, trim 'wood').
- litter-bin 0.6 x 0.6 x 1.0: round dark-green bin on a post-less base, lid ring, a small "acorn shells" label plate.
- street-bollard 0.3 x 0.3 x 0.9: black iron post with a rounded cap and a gold band. tint (the band) default 0xd4a843.
- newspaper-box 0.6 x 0.5 x 1.1: coin-op box on legs, window on +z showing a folded paper, "TATTLER" header block. tint = body (default red).
- parking-meter 0.3 x 0.25 x 1.4: post with a domed head, little dial window on +z.
- bike-rack 1.8 x 0.5 x 0.8: three inverted-U hoops on a bar, galvanised grey.
- kerb-hydrant 0.45 x 0.45 x 0.8: stubby red hydrant, two side caps, a chained cap on +z.
- poster-pillar 1.0 x 1.0 x 2.6: round advertising column (cyl), three coloured poster panels on it (thin boxes proud of
  the column), a dome cap. tint = the main poster.
## Done when
- npm test -w packages/prefabs passes for these ids; npx tsc --noEmit -p packages/prefabs clean for this file.
~~~~

~~~~text
Epic: 1, issue 1B: street kit B (packages/prefabs/src/catalog/gta-street-kit-b.ts)
Depends on: none
[Environment (common) and Prefab rules (common to 1A-1G) pasted here]
## Goal
Model the eight street prefabs in gta-street-kit-b.ts.
## Change
- bus-shelter 3.8 x 1.6 x 2.7: open front on +z, back glass panel at -z (pale blue box, 0.06 thick), two end panels, a flat
  roof slab, a bench inside at 0.45 m, a snail-shell "SNAIL COACH" sign block on one end. tint = frame (default 0x2f5d46).
- phone-box 1.0 x 1.0 x 2.4: red kiosk, window grid (thin dark bars proud of pale panels), crown roof, door on +z.
- sandwich-board 0.6 x 0.5 x 0.9: A-frame chalkboard (two leaning boards), wooden frame. tint = frame.
- food-cart 2.2 x 1.2 x 2.2: cart body on two wheels, a striped umbrella (cone + tint), a hatch on +z, a handle bar.
  tint = umbrella (default red).
- news-kiosk 2.6 x 2.0 x 2.8: small booth, counter hatch on +z with an awning, magazines rack, roof sign block. tint = walls.
- street-banner-pole 0.3 x 0.9 x 4.5: thin pole, top cross-arm along z, a vertical cloth banner hanging from it on +x side
  (keep everything inside the 0.9 depth / 0.3 width box: banner 0.05 thick, 0.8 wide in z, 2 tall). tint = banner.
- dumpster 2.0 x 1.2 x 1.3: steel bin, sloped lid, two side pockets, four small wheels. tint = body (default 0x2f6e3a).
- bunting-span 15.2 x 0.3 x 5.8: two thin poles at x = +-7.45 (0.12 thick, 5.8 tall), a string between them sagging from
  5.6 at the poles to 5.15 in the middle (4 straight box segments), and 12 little triangle flags (cones squashed, or thin
  boxes) hanging from it, alternating tint and trim colours, every flag bottom above 4.9 m. tint default red, trim yellow.
## Done when
- npm test -w packages/prefabs passes for these ids; npx tsc --noEmit -p packages/prefabs clean for this file.
~~~~

~~~~text
Epic: 1, issue 1C: park kit A (packages/prefabs/src/catalog/gta-park-kit.ts)
Depends on: none
[Environment (common) and Prefab rules (common to 1A-1G) pasted here]
## Goal
Model the eight park prefabs in gta-park-kit.ts.
## Change
- bandstand 8 x 8 x 6: octagonal stone platform 0.8 high (an 8-segment cylinder), eight slim iron posts, an octagonal
  cone roof with a finial, a railing ring at 1.0 m above the platform with a gap and three steps on +z. tint = roof
  (default 0x2f6e5a), trim = posts/railing (default white).
- swing-set 4.0 x 1.8 x 2.4: A-frame legs each end, top bar along x, two swings (chains as thin boxes, seats).
- play-slide 1.0 x 4.0 x 2.4: ladder at -z up to a 2.2 m platform with side rails, a chute sloping down to +z. tint = chute (default yellow).
- climbing-frame 3 x 3 x 2.2: a cube of bars (12 edges + middle rungs), a small roof canopy. tint = bars.
- see-saw 3.6 x 0.6 x 0.9: plank along x on a centre pivot, handles at both ends, slightly tilted plank (keep within the box).
- skate-quarter-pipe 4 x 3 x 1.6: a curved ramp: a stack of 5-6 boxes forming a concave slope that rises towards -z (the
  riding face looks +z), a coping rail along the top edge at -z, a deck platform at the back. Concrete grey.
- grind-rail 4 x 0.4 x 0.5: steel rail along x on two square feet.
- football-goal 5 x 1.6 x 2.2: two posts at x = +-2.4 and a crossbar at 2.2 m on the front (+z) edge, net back frame
  sloping to the ground at -z, a few net strands (thin boxes). White frame, net light grey.
## Done when
- npm test -w packages/prefabs passes for these ids; npx tsc --noEmit -p packages/prefabs clean for this file.
~~~~

~~~~text
Epic: 1, issue 1D: park kit B (packages/prefabs/src/catalog/gta-park-kit-b.ts)
Depends on: none
[Environment (common) and Prefab rules (common to 1A-1G) pasted here]
## Goal
Model the nine park prefabs in gta-park-kit-b.ts.
## Change
- park-pavilion 6 x 4 x 3.5: picnic shelter, four timber posts, a pitched roof (two sloped boxes), a long table and two
  benches under it. tint = roof (default 0x8a3b2a).
- rose-arch 2.0 x 0.8 x 2.6: two lattice side panels and a round-topped arch (a few boxes along a curve) with rose
  blooms (small balls) in tint colour (default red) and leaves.
- rose-bush 1 x 1 x 0.9: leafy mound (3-4 squashed balls) with 6-8 blooms in tint (default red).
- allotment-bed 3.0 x 1.4 x 0.6: timber-edged raised bed of dark soil with three rows of vegetables (cabbage balls, carrot
  tops as little cones, bean canes as thin sticks up to 0.6).
- cold-frame 1.4 x 0.8 x 0.6: low timber box with a sloped glass lid (pale blue, slightly open), seedlings inside.
- park-monument 2.4 x 2.4 x 4.5: a stepped stone plinth 1.6 tall with an inscription panel on +z, a heroic bronze gnome
  figure 2.6 tall on it (body, beard, arm raised), a pointed hat with an orange traffic cone on top (the cone uses tint,
  default 0xf08a24). Bronze = 0x8a6a3a.
- park-noticeboard 1.6 x 0.3 x 2.0: two posts, a framed board with a little roof, three pinned papers on +z. tint = frame
  (default dark green).
- duck-house 1.2 x 1.2 x 1.4: a floating wooden platform 0.2 thick with a little pitched-roof duck house and a ramp.
- water-butt 0.7 x 0.7 x 1.0: green barrel with a lid and a tap on +z, on a small brick stand.
## Done when
- npm test -w packages/prefabs passes for these ids; npx tsc --noEmit -p packages/prefabs clean for this file.
~~~~

~~~~text
Epic: 1, issue 1E: fringe buildings A (packages/prefabs/src/catalog/gta-fringe-kit.ts)
Depends on: none
[Environment (common) and Prefab rules (common to 1A-1G) pasted here]
## Goal
Model the six rough outskirts buildings in gta-fringe-kit.ts. Rough = weathered: rust patches (proud dark-orange boxes),
mismatched panels, a dent or a patched corner, stains. Each has a little rooftop gear (vent, flue, aerial or tank).
## Change
- rough-workshop 10 x 8 x 5: corrugated walls (ridged by a few thin vertical boxes on the faces), a shallow pitched roof,
  a big roller door on +z (darker, banded), a side door, rust patches, a roof vent. tint = walls (default 0x8a8f86).
- lockup-row 12 x 6 x 3: four garages in a row, each with a roller door on +z (one half open, dark inside), a flat roof
  slab with a lip, a drainpipe. tint = doors (default 0x5b7a8a).
- rough-warehouse 18 x 12 x 7: big shed, two-step roof, loading dock on +z (raised slab with a shutter), high
  windows (dark strips), a faded sign block, a rooftop water tank. tint = walls (default 0xa89a7a).
- rough-pub 10 x 8 x 6: "The Rusty Tine": two-storey brick pub, pitched slate roof, chimney, door and two windows on
  +z (warm glow: glow: true on the window panes), a hanging sign board on a bracket by the door (a rusty fork painted
  on it: three thin tine boxes), beer barrels by the door. tint = walls (default 0x8a4a3a).
- portacabin 6 x 2.6 x 2.6: site cabin, door and two windows on +z, steps, blocks underneath. tint = body (default 0xd9c06a).
- nissen-hut 8 x 5 x 3: half-cylinder corrugated hut lying along x (a cylinder of radius 2.5 cut by the ground: build it
  from 6-8 tilted boxes, not a full cylinder below ground), brick end walls, and the door on the +z long side as a small
  porch. tint = roof (default 0x6a6e66).
## Done when
- npm test -w packages/prefabs passes for these ids; npx tsc --noEmit -p packages/prefabs clean for this file.
~~~~

~~~~text
Epic: 1, issue 1F: fringe buildings B (packages/prefabs/src/catalog/gta-fringe-kit-b.ts)
Depends on: none
[Environment (common) and Prefab rules (common to 1A-1G) pasted here]
## Goal
Model the six rough outskirts buildings in gta-fringe-kit-b.ts. Rough = weathered (rust, patches, stains).
## Change
- caravan 5 x 2.2 x 2.4: rounded-end caravan on four blocks (no wheels, or two flat tyres), a stripe along the side,
  door and windows on +z, a gas bottle at one end, a tow hitch. tint = stripe (default 0x3a7ab8).
- trailer-home 10 x 3 x 3: long trailer, skirting, a little porch with steps on +z, windows, a satellite dish on the roof.
  tint = walls (default 0xd8d0b0).
- half-built-house 8 x 7 x 6: timber frame (posts, beams, roof trusses as thin boxes), two finished wall panels, a
  scaffold on one side (poles + planks), a pile of blocks. Raw wood colours.
- water-tower 4 x 4 x 10: four splayed legs with cross braces, a round tank (cylinder) on top at 6-9 m with a cone roof and
  a ladder. tint = tank (default 0x8aa0a8).
- polytunnel 10 x 4 x 2.4: half-round plastic tunnel along x (6-8 tilted translucent-white boxes or a half cylinder kept
  above y = 0), hoop ribs, a door frame on the +x end.
- lean-to-shed 4 x 3 x 2.6: plank shed with a single-slope roof (high at -z), an open front on +z with tools and a
  wheelbarrow inside. tint = planks (default 0x7a5a3a).
## Done when
- npm test -w packages/prefabs passes for these ids; npx tsc --noEmit -p packages/prefabs clean for this file.
~~~~

~~~~text
Epic: 1, issue 1G: fringe yard (packages/prefabs/src/catalog/gta-fringe-yard.ts)
Depends on: none
[Environment (common) and Prefab rules (common to 1A-1G) pasted here]
## Goal
Model the nine yard prefabs in gta-fringe-yard.ts.
## Change
- chain-link-fence 4 x 0.1 x 2.0: a 4 m run piece along x: two posts at x = +-1.95, top rail, mesh as a grid of thin boxes
  (or a pale translucent panel with a few diagonal strands), a bent corner. Galvanised grey.
- corrugated-fence 4 x 0.15 x 2.0: a 4 m run of corrugated sheets (several slightly offset thin boxes of different greys
  and one rusty), two posts.
- power-pole 1.6 x 0.3 x 8: wooden pole 8 m, a cross-arm along x at 7.6 m (1.6 long), three insulators on it, a small
  transformer can at 6 m, a step bolt or two. Keep the wires out (the game draws them).
- shipping-container 6 x 2.5 x 2.6: ribbed box (thin vertical boxes on the long faces), doors with lock bars on +x end,
  a dent, rust streaks. tint = body (default 0x3c6e8f).
- scrap-car 3.4 x 1.8 x 1.4: a wrecked ride-on mower / small car body: tilted body, no wheels (on blocks), smashed
  seat, hood up, rust. tint = paint (default 0xc84a2a).
- tyre-pile 1.6 x 1.6 x 1.0: 6-8 black tyres (rings or short cylinders) in a heap.
- oil-drum 0.6 x 0.6 x 0.9: steel drum with two rims, a dented lid. tint = paint (default 0x2f5a8a).
- woodpile 2.4 x 1.0 x 1.0: stacked logs (cylinders along x) in a pyramid, an axe in a block.
- pallet-stack 1.2 x 1.0 x 0.8: five stacked wooden pallets, one skewed.
## Done when
- npm test -w packages/prefabs passes for these ids; npx tsc --noEmit -p packages/prefabs clean for this file.
~~~~

### Park issues (1H, 1I)

They share this block:

~~~~text
## Park kit (common to 1H and 1I)
Read first (all short): games/gnome-theft-auto/src/parks/kit.ts (every helper below, read it whole),
src/parks/blocks.ts (PARKS), src/cityScenery/site.ts (Site: free, claim, place; footprintRect, prefabHeight),
src/cityScenery/types.ts (DressPlan, PatchKind, Mark).
A layout function gets c: ParkCtx and works in block-local metres: u along +x, v along +z from the block centre, both in
[-21, 21]; c.at(u, v) gives the world point. Every helper checks the Site and SKIPS a piece that does not fit (another
piece, a collider, a stage spot, a stunt ramp's run): never force a piece, and do not try to detect skips except where
the issue says. Order matters: what is placed first wins its spot.
Helpers: put(c, id, u, v, { yaw, scale | height, solid, cls, tint, trim, pad }) one prefab (cls defaults 'prop', solid
false; solid: true = collider of its size, a number = collider that tall); perimeter(c, id, gap, skipSides) fence on the
19.5 line with a gap mid-side; patch(c, u0, v0, u1, v1, kind) a path (claimed: nothing else may stand on it) with walk
points; floorPatch(c, u0, v0, u1, v1, kind) a floor others can stand on; pond(c, u, v, r, ducks); bench(c, u, v, yaw,
bin) a bench + sit spot + litter bin; lamp(c, u, v); tree(c, u, v, id, height); noticeboard(c, u, v, yaw);
wishSpot(c, u, v, front) (a fountain's wish spot `front` m along +v from its centre: the player stands there);
gnome(c, n, u, v, yaw, name, idle, bubble, look) a park townsgnome (n unique per park, 0..3); dressAt(c, id, u, v,
{ yaw, scale | height, cls, tint }) a prefab with no checks (only inside your own area); localRect(c, u0, v0, u1, v1);
c.rnd() seeded random.
Yaw: 0 faces +v; to face a point (pu, pv) from (u, v): yaw = Math.atan2(pu - u, pv - v).
Marks (painted lines): push to c.plan.marks { tile: 'line', x, y: heightAt(x, z) + 0.03, z, yaw, w, h, upright: false }
(w along local x, h along local z, world point from c.at; heightAt from '../terrain').
Townsgnome idles must be AnimId values from src/anim/types.ts (e.g. 'feed-birds', 'busk-guitar', 'sit-ground',
'vendor-call', 'rake', 'dig', 'water', 'read', 'look-around', 'tap-foot', 'cheer', 'idle-swagger', 'check-watch',
'photo-snap', 'think', 'scratch-head'). Bubbles: one short line each, Turfton parody voice (gnomes, Acorns, Glaze, the
Hat Watch, City Hall, the Long Grass League, mowing). Looks: Partial<GnomeLook> { hat, shirt, pants, beard (number or
null), glasses }. Lore: docs/lore/entries/apocrypha/turfton-parks.md (names fixed there); give each townsgnome a first
and last name in Turfton style (plants, tools, pottery: "Fennel Washboard", "Linden Skep").
Test pattern: a test file (named in your issue) that installs a fake DOM, builds the real world and runs your layouts:
  import { installFakeDom } from '../testing/fakeDom'; installFakeDom(); vi.mock('../audio', () => ({ play: () => undefined }));
  const { buildWorld } = await import('../world'); const { installSkyways } = await import('../highways/install');
  const world = buildWorld(new THREE.Scene(), null as unknown as THREE.WebGLRenderer); installSkyways(new THREE.Scene(), world);
  const site = createSite(world); then per park: const plan = emptyPlan(); layoutX(parkCtx(site, plan, PARKS.find((p) => p.id === '...')!)).
  (src/propsOffRoad.test.ts uses the same pattern; give the test a 180_000 ms timeout.)
Checks: cd games/gnome-theft-auto && npx vitest run <your test>; npx tsc --noEmit -p games/gnome-theft-auto clean in your files.
~~~~

~~~~text
Epic: 1, issue 1H: park layouts A (Gnorwin Clayfoot Park, Bandstand Green, Kilnside Rec)
Depends on: none
[Environment (common) and Park kit (common to 1H and 1I) pasted here]
## Goal
Fill in layoutGnorwin, layoutBandstandGreen and layoutKilnsideRec in games/gnome-theft-auto/src/parks/layoutA.ts.
## Change: src/parks/layoutA.ts (keep the three exported names and the (c: ParkCtx) => void signature)
layoutGnorwin (block (-30, 30); world.ts already built here: a stone fountain 8 m across at (0, 0), picnic tables at
(+-9, +-10), round bushes at (-10, 1) and (11, 1), stone pillars at (16, 20), (8, 20), (-20, -16), (-20, -8), painted
flower strips; a stunt ramp runs from (-12, 6) eastwards over the fountain - the Site keeps you off all of these):
 1. put 'park-monument' at (0, -14), yaw 0, solid true, tint 0xf08a24 (Gnorwin Clayfoot with his traffic cone).
 2. wishSpot(c, 0, 0, 5.2).
 3. bench at (-6.5, -6.5), (6.5, -6.5), (-6.5, 6.5), (6.5, 6.5), each facing (0, 0).
 4. lamps at (-4, -18), (4, -18), (-17, 4), (17, -4), (4, 17), (-4, 17).
 5. flower-bed (put, no collider) at (-3.5, -17) and (3.5, -17) yaw 0; rose-bush at (-2, -11), (2, -11) tint 0xd93636.
 6. noticeboard at (12, 17.5) yaw Math.PI.
 7. gnomes (place them first, before step 1): 0 Wren Kettleby at (3, -10.5) facing the monument, idle 'feed-birds';
    1 a City Hall cone-crew gnome at (-3, -10.5) facing the monument, idle 'scratch-head' ("Third cone this week. Who
    keeps putting them back?"); 2 a picnicker at (-13, 0) idle 'sit-ground'.
layoutBandstandGreen (block (-30, -150)):
 1. gnome 0: the busker Lark Strummel at (2.6, 1.0), yaw 0, idle 'busk-guitar'.
 2. put 'bandstand' at (0, -4), yaw 0, solid true.
 3. perimeter(c, 'hedgerow', 6).
 4. paths (patch, gravel): (-1.5, -19) to (1.5, -9); (-1.5, 1.5) to (1.5, 19); (-19, -5.5) to (-5, -2.5); (5, -5.5) to (19, -2.5).
 5. benches facing (0, -4) at (-7, 6), (7, 6), (-4, 9.5), (4, 9.5).
 6. picnic-table (scale 1.6, solid true) at (-14, 8), (-14, 14), (-8.5, 15).
 7. park-pavilion at (12, -13), yaw 0, solid true.
 8. trees (tree(), broadleaf-tree, height 6 + 2 * c.rnd()) at (-15, -15), (-10, -16), (-15, -10), (-9, -11), (-12, -7).
 9. market-stall (scale 1.6, solid true, yaw Math.PI) at (8, 15.5), (11.5, 15.5), (15, 15.5); gnome 1 a stallholder at
    (11.5, 13) yaw Math.PI idle 'vendor-call' (place this gnome before the stalls).
 10. lamps at (2.8, -11), (-2.8, -11), (2.8, 4), (-2.8, 4); noticeboard at (4.5, -17.5) yaw 0.
 11. gnomes: 2 at (-11, 11) 'sit-ground'; 3 at (-3.5, 12.5) 'feed-birds' (place before the picnic tables).
 12. flower-bed at (-8, -17.5) yaw 0, (8, -17.5) yaw 0, (17, 5) yaw Math.PI / 2.
layoutKilnsideRec (block (-150, -30)):
 1. gnomes first: 0 a kickabout gnome at (-5, -9) yaw Math.PI / 2 idle 'cheer'; 1 a skater at (6.5, 9.5) yaw 0 idle
    'idle-swagger'; 2 a parent at (-10, 0.5) yaw Math.PI idle 'check-watch'.
 2. perimeter(c, 'civic-railing', 6).
 3. football-goal at (-14.8, -9.5) yaw Math.PI / 2 and (14.8, -9.5) yaw -Math.PI / 2, both solid true.
 4. the pitch: c.site.claim(localRect(c, -15, -17.5, 15, -1.5)), then pitch lines as marks: the four sides of
    u -14..14, v -17..-2 (0.12 wide), the halfway line u = 0 (v -17..-2), and a 3 x 3 m square of 4 lines round (0, -9.5).
 5. playground: floorPatch(c, -18, 1, -3, 18, 'pavement'); swing-set (-14, 5) yaw 0 solid; play-slide (-6, 9) yaw 0 solid;
    climbing-frame (-13, 13) solid; see-saw (-6, 15.5) yaw Math.PI / 2.
 6. skate corner: floorPatch(c, 3, 1, 18, 18, 'pavement'); skate-quarter-pipe (10.5, 3) yaw 0 solid; skate-quarter-pipe
    (10.5, 16) yaw Math.PI solid; grind-rail (14, 9.5) yaw 0 solid 0.5; sandwich-board (4.5, 2) yaw 0; marks 'tag-a' and
    'tag-c' flat on the floor (w 2.5, h 1.6) at (8, 9.5) and (16, 13) as graffiti (y = ground + 0.03).
 7. benches at (-8, 0) and (8, 0), yaw Math.PI (facing the pitch); lamps at (0, 0), (-18, -0.5), (18, -0.5).
 8. noticeboard at (3.5, -18.3) yaw 0; trees (city-round-tree, height 5) at (-17.5, 17.5) and (17.5, 17.5).
## Test
games/gnome-theft-auto/src/parks/layoutA.test.ts: Gnorwin has >= 3 bench uses and exactly 1 wish use; Bandstand Green has
a 'bandstand' and >= 2 'market-stall' dress and >= 3 patches; Kilnside Rec has 2 'football-goal', a 'swing-set', >= 10
marks; every dress y is heightAt(x, z) within 0.1; each park has <= 4 gnomes with unique ids; running the same layouts on
a second fresh Site gives the same dress list.
## Out of scope
layoutB.ts, kit.ts, blocks.ts, site.ts and every other file.
~~~~

~~~~text
Epic: 1, issue 1I: park layouts B (Mallard Mere, Clayfoot Rose Garden, Pure-Loam Allotments)
Depends on: none
[Environment (common) and Park kit (common to 1H and 1I) pasted here]
## Goal
Fill in layoutMallardMere, layoutClayfootRose and layoutPureLoam in games/gnome-theft-auto/src/parks/layoutB.ts.
## Change: src/parks/layoutB.ts (keep the three exported names and the (c: ParkCtx) => void signature)
layoutMallardMere (block (-30, 150)); pond centre P = (-2, -2):
 1. gnomes: 0 a dog walker on the loop at P + 12.5 * (sin 1.2, cos 1.2), facing along the loop, idle 'look-around';
    1 another at angle 4.0, idle 'tap-foot'; 2 a duck feeder at radius 10, angle 2.4, facing P, idle 'feed-birds'.
 2. perimeter(c, 'hedgerow', 6).
 3. pond(c, -2, -2, 8, 4).
 4. reeds: dressAt(c, 'reed-bed', P + 7.2 * (sin a, cos a), { yaw: a }) for a = 0.3, 1.5, 2.6, 3.9, 5.2; duck house:
    dressAt(c, 'duck-house', 0.5, -3.5, { yaw: 0.6 }).
 5. the dog-walk loop: a gravel ribbon round P, radius 12.5, width 2, points at 29 angles a = k * 2PI / 28 (k = 0..28,
    the last repeating the first), in world coordinates: c.plan.patches.push({ kind: 'gravel', shape: 'ribbon', x, z (P in
    world), w: 2, d: 2, yaw: 0, points }). Before pushing, check the loop's bounding square (radius 13.5) with
    c.site.patchFree; if free, c.site.claimPatch it (otherwise skip the loop). Do NOT c.site.claim it (things stand
    inside the loop). Walk points: every 4th loop point into c.plan.walk.
 6. benches facing P at radius 15.2, angles 0.8, 2.4, 3.9, 5.5.
 7. lamps at radius 10.2, angles 0.2, 1.8, 3.4, 5.0 (between pond and loop).
 8. trees (broadleaf-tree, height 7 + 2 * c.rnd()) at (-16.5, -16.5), (16.5, -16.5), (-16.5, 16.5), (16.5, 16.5),
    (17, 0), (0, 17.5).
 9. wildflower-patch (put, no collider) at (-17, 8), (12, 17), (17, -9); noticeboard at (4.5, -17.5) yaw 0.
layoutClayfootRose (block (150, 30)):
 1. gnomes: 0 the head gardener Rosa Thornbury at (10, 4.5) yaw Math.PI idle 'water'; 1 a visitor at (-9.5, 14) yaw 0 idle 'photo-snap';
    2 in the maze centre at (0, -11) idle 'think' ("Left at the boxwood. Or was it right?").
 2. perimeter(c, 'civic-railing', 6).
 3. hedge maze in u -14..14, v -18..-2: 7 x 4 cells of 4 m. Generate a perfect maze with a recursive backtracker driven by
    c.rnd() (deterministic). Walls are 'hedgerow' pieces 4 m long, put with solid true and pad -0.6 (pieces touch at the
    corners): a wall between rows at v = y over column i: put(c, 'hedgerow', -14 + 4 * i + 2, y, { yaw: 0, solid: true,
    pad: -0.6 }); a wall between columns at u = x over row j: put(c, 'hedgerow', x, -18 + 4 * j + 2, { yaw: Math.PI / 2,
    solid: true, pad: -0.6 }). Outer walls on all four sides of the maze except an entrance in the south wall at column
    i = 3 (v = -2) and an exit in the north wall at column 3 (v = -18). A gnome-statue (height 1.6, solid true) in the
    centre of cell (i 3, j 1) unless gnome 2 holds it (then cell (3, 2)).
 4. fountain: put 'stone-fountain' at (0, 10), scale 2.4, solid true; wishSpot(c, 0, 10, 4.3).
 5. paths (patch, gravel): (-1.5, 0) to (1.5, 6.4); (-1.5, 13.6) to (1.5, 19); (-19, 8.5) to (-3.6, 11.5); (3.6, 8.5) to (19, 11.5).
 6. rose arches over the paths (dressAt, no collider): (0, 3.5) yaw 0; (0, 16.5) yaw 0; (-11, 10) yaw Math.PI / 2;
    (11, 10) yaw Math.PI / 2.
 7. the Clayfoot Twins: gnome-statue (height 2.2, solid true) at (-4.5, 6.2) and (4.5, 6.2), each facing (0, 10).
 8. benches facing (0, 10) at (-5.5, 14.5) and (5.5, 14.5); lamps at (-3, 2.5), (3, 2.5), (-3, 17.5), (3, 17.5).
 9. rose beds in the four quadrants between the paths: rose-bush (put, cls 'detail') at u = +-(4.5 + 2.2 k) for k = 0..5,
    v in {1.5, 3.5, 5.5} and {14, 16, 18}; tint by row from [0xd93636, 0xf07ab0, 0xf4f1de], every 4th bush 0xf2c94c.
    Many are skipped near the statues and lamps: fine.
 10. noticeboard at (4.5, 18.3) yaw Math.PI.
layoutPureLoam (block (150, 90)):
 1. gnomes: 0 at (-11.5, -13) 'rake'; 1 at (-1.5, 3) 'dig'; 2 at (3.5, -9) 'water'; 3 the stallholder Parsnip Mudge at (16.6, 14.5) yaw
    -Math.PI / 2 'vendor-call' ("No chemicals, no engines, just dirt. Two Acorns a cabbage.").
 2. perimeter(c, 'wattle-fence', 4).
 3. floorPatch(c, -17.5, -17.5, 10.5, 17.5, 'dirt').
 4. beds: allotment-bed (put, cls 'detail', yaw 0) at u in {-14, -9, -4, 1, 6} (index iu), v in {-15, -11, -7, -3, 1, 5,
    9, 13} (index iv); when (iu + iv) % 5 === 0 also a cold-frame at (u, v + 1.9) and a water-butt at (u + 2.1, v + 1.9).
 5. sheds: garden-shed scale 2.5 yaw -Math.PI / 2 solid true at (14.5, -14) and (14.5, -7); compost-bin scale 4 solid
    true at (15, 0.5); bee-skep (scale 1.4, solid true) at (13, 6), (15.2, 6), (17.4, 6); scarecrow (height 2.5) at (3.5, 3).
 6. produce stalls: market-stall scale 1.6 yaw -Math.PI / 2 solid true at (14.5, 11), (14.5, 14.5), (14.5, 18).
 7. lamps at (12, -2), (12, 17); noticeboard at (-4, -18.6) yaw 0; trees (broadleaf-tree, height 6) at (17.5, -18) and (-18, 18).
## Test
games/gnome-theft-auto/src/parks/layoutB.test.ts: Mallard Mere has 1 disc 'pond' patch, 1 ribbon patch and 1 entry in
plan.ducks; Clayfoot Rose has >= 18 'hedgerow' dress, exactly 1 wish use, >= 20 'rose-bush'; Pure-Loam has >= 30
'allotment-bed'; gnome ids unique, <= 4 per park; no two patches in a plan overlap (bounds: rect x +- w/2, z +- d/2; disc
x +- w/2; ribbon: its points' bounds grown by w/2; touching allowed); same output on a second fresh Site.
## Out of scope
layoutA.ts, kit.ts, blocks.ts, site.ts and every other file.
~~~~

### City scenery issues (1J, 1K, 1L)

~~~~text
Epic: 1, issue 1J: street scenery planner
Depends on: none
[Environment (common) pasted here]
## Goal
games/gnome-theft-auto/src/cityScenery/street.ts planStreet(site) returns a DressPlan of street furniture, street trees,
banner poles, bunting across downtown streets, corner kiosks / carts and alley clutter for the Turfton grid, by district.
## Read first
- src/cityScenery/site.ts (Site.place / free / claim, footprintRect, prefabBox, prefabHeight, rectAround) and
  src/cityScenery/types.ts (DressPlan, Dress, emptyPlan). site.place checks colliders, keep-outs, roads, water and decks
  and returns false when a piece does not fit: skip it.
- src/districts.ts districtAt(x, z) -> 'downtown' | 'greenhouse' | 'patio-heights' | 'old-brick' | 'park-arts' | 'industrial' | null.
- src/config.ts ROAD_LINES, CITY_HALF (215). src/parks/blocks.ts isParkBlock / PARKS (parks are planned before you; the
  Site keeps you out of their claimed pieces anyway).
## Change: src/cityScenery/street.ts (keep `export function planStreet(site: Site): DressPlan`)
Use mulberry32(4711) from '@lawn/level' for every random choice, in a fixed loop order (deterministic).
1. Streets: for axis in ['x', 'z'] (a road along x at z = w, or along z at x = w), w in ROAD_LINES, side s in [-1, 1].
   Positions along the street t run over segments between crossings: [c_k + 11, c_k+1 - 11] for consecutive crossings
   c in [-215, ...ROAD_LINES, 215] (use 2 instead of 11 at the -215 / 215 ends).
   The furniture strip lies just behind the sidewalk: an item whose depth (its prefab z-size times scale) is dd stands at
   offset o = 7.7 + dd / 2 from the road centre line, front facing the road: along-z road (x = w + s * o):
   yaw = s > 0 ? -Math.PI / 2 : Math.PI / 2; along-x road (z = w + s * o): yaw = s > 0 ? Math.PI : 0.
   Street lamps stand at t = -212.5 + 25 k on both sides at offset 7.5: never put an item within 1.6 m (along t) of one.
2. District kits (district = districtAt at the segment's middle point on that side). Walk each segment from its start in
   steps of 5 m, cycling through the kit's ids; each item: site.place({ id, x, z, yaw, scale, cls: 'detail', solid,
   roadClear: 7.6, pad: 0.3, tint }). solid = true when the prefab is >= 0.8 m tall at its scale. Kits:
   downtown: litter-bin, newspaper-box, parking-meter, bike-rack, parking-meter, phone-box, poster-pillar, street-banner-pole
   greenhouse: food-cart, sandwich-board, stone-planter (scale 0.6), litter-bin, street-banner-pole
   patio-heights: street-bollard, stone-planter (scale 0.6), park-bench, street-bollard, topiary-cone (scale 0.8), litter-bin
   old-brick: sandwich-board, bike-rack, litter-bin, phone-box, newspaper-box, poster-pillar
   park-arts: park-bench, litter-bin, street-banner-pole, sandwich-board, poster-pillar
   industrial: oil-drum, pallet-stack, dumpster, street-bollard, tyre-pile, litter-bin
   null (the ring blocks): park-bench, litter-bin, mailbox (scale 1.3), kerb-hydrant
   Leave a 2 m gap after every 3rd item (not every metre is furniture). street-banner-pole tint per district: downtown
   0xd93636, greenhouse 0xff4fa3, patio-heights 0xd4a843, old-brick 0x7a3b2a, park-arts 0x3a7ab8, else 0x2f6e5a.
3. Street trees, after the kit on each segment, every `gap` m at offset 8.8 (trunk claim 1 x 1, collider top 3, pad 0.5,
   roadClear 7.6, checked with site.free then site.claim(rect, 3)), dress cls 'prop', height 5 + 2 * rnd, yaw rnd:
   downtown city-round-tree gap 16; patio-heights city-round-tree 14; old-brick broadleaf-tree 18; park-arts broadleaf-tree 12;
   null alternating broadleaf-tree / city-round-tree 12; greenhouse and industrial none. Scale = height / prefabHeight(id).
4. Bus shelters: on segment index k and side s where (k + (s > 0 ? 1 : 0) + ROAD_LINES.indexOf(w)) % 3 === 0, one
   bus-shelter at the segment middle (offset from its depth as in 1), solid true, cls 'prop', placed BEFORE the kit items
   of that segment.
5. Bunting: on downtown segments with |w| <= 60 and segment middle |t| <= 95, one bunting-span across the street at the
   segment middle, turned so it spans the road (along-z road: yaw 0; along-x road: yaw Math.PI / 2). Do not use
   site.place (its footprint covers the road): check the two pole spots (7.45 m each side of the centre line, 0.3 x 0.3)
   with site.free(rect, { roadClear: 7.2, pad: 0.2 }); if both are free, site.claim each with top 5.8 and push the Dress
   directly (y = 0, scale 1, cls 'prop', tint alternating 0xd93636 / 0x3a7ab8, trim 0xf2c94c).
6. Corner kiosks: for every block whose centre (cx, cz) (block centres are the midpoints of consecutive ROAD_LINES,
   inner blocks only: centres -150..150) has Math.hypot(cx, cz) <= 130 and is not a park block, pick one corner by rnd:
   (cx +- 18, cz +- 18); place news-kiosk or food-cart (rnd) there, yaw facing that corner's crossing, solid true,
   cls 'prop', roadClear 7.6. If it does not fit, try the other three corners in order.
7. Alleys: for the same downtown blocks, test a corridor rect 3 m wide through the block centre along z
   (cx +- 1.5, cz - 19 .. cz + 19) with site.free(rect, { pad: 0 }); if free, place 4 clutter items along it at
   v = -12, -5, 3, 10 alternating u = +-0.8: dumpster (yaw Math.PI / 2), litter-bin, pallet-stack, oil-drum (solid when
   >= 0.8 m tall, cls 'detail', roadClear 7.6). Same test along x.
8. Stop adding when plan.dress.length reaches 1800.
## Test: src/cityScenery/street.test.ts
Build the real world (installFakeDom from '../testing/fakeDom' first, vi.mock('../audio', () => ({ play: () => undefined })),
buildWorld(new THREE.Scene(), null as unknown as THREE.WebGLRenderer), installSkyways(new THREE.Scene(), world) from
'../highways/install'), then planStreet(createSite(world)). Check: >= 300 dress; <= 1800; at least 6 distinct ids among
downtown placements; no dress centre with roadDistance (site.ts export) < 7.6 except 'bunting-span'; no dress centre on a
sidewalk (onSidewalk from '../parking'); deterministic (a second fresh Site on the same world gives the same list);
>= 4 bunting-span. Timeout 180_000.
## Done when
- cd games/gnome-theft-auto && npx vitest run src/cityScenery/street.test.ts passes
- npx tsc --noEmit -p games/gnome-theft-auto: no error in street.ts / street.test.ts
## Out of scope
Every other file.
~~~~

~~~~text
Epic: 1, issue 1K: painted marks (crosswalks, manholes, drains, stains, chalk, graffiti)
Depends on: none
[Environment (common) pasted here]
## Goal
games/gnome-theft-auto/src/cityScenery/marks.ts planMarks(site, plan) adds painted marks to plan.marks.
## Read first
src/cityScenery/types.ts (Mark, MarkTile), src/cityScenery/site.ts (Site: world, roadDist; deckContactsAt is not
needed), src/districts.ts (districtAt, and how its crosswalks at the 9 crossings with |x| <= 60 and |z| <= 60 are laid
out: stripe offsets [-3.6, -2.2, -0.8, 0.8, 2.2, 3.6], 0.7 x 2.6 stripes at 7.2 m from the crossing), src/config.ts
(ROAD_LINES, CITY_HALF), src/terrain.ts heightAt.
## Change: src/cityScenery/marks.ts (keep `export function planMarks(site: Site, plan: DressPlan): void`)
All marks flat (upright false) unless said; y = heightAt(x, z) + 0.045. Random: mulberry32(9090) from '@lawn/level'.
1. Crosswalks: every grid crossing (x, z both in ROAD_LINES) EXCEPT the 9 with |x| <= 60 && |z| <= 60 (they have them):
   the same stripes as districts.ts, tile 'stripe' (N/S approaches w 0.7 h 2.6 at (ix + off, iz + s * 7.2); E/W w 2.6
   h 0.7 at (ix + s * 7.2, iz + off)), yaw 0.
2. Manholes: every street (both axes, w in ROAD_LINES), t from -200 step 30 to 200, skipping |t - c| < 12 for any
   crossing c: tile 'manhole' w = h = 0.9 at lane offset +2.5 from the centre line, yaw 0.
3. Drains: same streets, t from -205 step 24, skipping |t - c| < 12: tile 'drain' w 0.9 (along the street) h 0.45 at
   offset +-4.55 (alternate sides), yaw along the street.
4. Oil stains: same streets, every 10 m with probability 0.15, skipping |t - c| < 12: tile 'oil' w 1.0 h 0.6 at offset
   +-3.4, yaw = rnd * PI.
5. Chalk: sidewalks in 'park-arts' and the ring blocks (districtAt null), every 10 m with probability 0.05, skipping
   crossings: tile 'chalk' w 0.8 h 2.0 at offset +-6.3, yaw along the street.
6. Wall graffiti and posters (upright true): for every box b in site.world.boxes (in array order) with
   b.h - heightAt(centre) >= 2.5, a face at least 3 m long that is parallel to a city street and 9..16 m from its
   centre line, centre inside the city (|x|, |z| <= 215), and districtAt(face centre) in ['old-brick', 'industrial',
   'park-arts']: one mark on that face's middle, 0.04 m out from the face, facing the street (yaw = direction away from
   the box), y = ground + 1.6, tile by rnd from ['tag-a', 'tag-b', 'tag-c', 'tag-d', 'poster-a', 'poster-b', 'poster-c']
   (tags w 2.2 h 1.3, posters w 1.0 h 1.4). At most 60, and at most one per box.
7. Marks of the same layer must not overlap: the rules above keep them apart; do not add others.
## Test: src/cityScenery/marks.test.ts
Real world as in src/propsOffRoad.test.ts (installFakeDom, buildWorld, installSkyways from '../highways/install'), then
planMarks(createSite(world), emptyPlan()). Check: stripes count = 40 crossings x 24; >= 80 manholes; every manhole and
drain centre is on asphalt (surfaceAt from '../surfaces' with world: kind 'asphalt'); 1..60 upright marks, each 0.03..0.06
from its box face; deterministic. Timeout 180_000.
## Done when
- cd games/gnome-theft-auto && npx vitest run src/cityScenery/marks.test.ts passes; tsc clean in your files.
## Out of scope
Every other file.
~~~~

~~~~text
Epic: 1, issue 1L: ground patches, marks and cables as merged meshes
Depends on: none
[Environment (common) pasted here]
## Goal
games/gnome-theft-auto/src/cityScenery/decals.ts builds GroundPatch[], Mark[] and Cable[] into a few merged, culled meshes.
## Read first
src/cityScenery/types.ts (GroundPatch, PatchKind, Mark, MarkTile, Cable), src/terrainMesh.ts (addGroundToGeometry,
drapedRibbon), src/textures.ts (groundTexture, planarUv, TILE), src/cull.ts header (registerCull(object, cls) after the
object is added and placed), packages/depth/src/layers.ts (LAYER, flatLayer), src/districts.ts addMerged (how a merge
is done: mergeGeometries from 'three/examples/jsm/utils/BufferGeometryUtils.js').
## Change: src/cityScenery/decals.ts (keep the three exported signatures)
- buildPatches(scene, patches, name): group by kind and by 128 m cell of the patch centre (x, z; a ribbon: its first
  point). Geometry per patch, every one with position, normal and uv only (delete other attributes) and indexed:
  rect: new THREE.PlaneGeometry(w, d, max(1, ceil(w / 2)), max(1, ceil(d / 2))).rotateX(-PI/2).rotateY(yaw).translate(x,
  0.012, z), then addGroundToGeometry; disc: CircleGeometry(w / 2, 28) rotated flat, translated to (x, 0.012, z), then
  addGroundToGeometry; ribbon: drapedRibbon(points, w, 0.012). Then planarUv(geo, TILE[kind]) for every kind except
  'pond'. Material per kind (one per kind, shared by its cells): MeshStandardMaterial({ map: groundTexture(kind),
  roughness: 1 }) or, for 'pond', { color: 0x3f6f7f, roughness: 0.2, metalness: 0.1 }; flatLayer(material, LAYER.area).
  One merged mesh per (kind, cell): receiveShadow true, castShadow false, name `${name}:${kind}:${cell}`, scene.add, then
  registerCull(mesh, 'cell').
- buildMarks(scene, marks, name): one atlas CanvasTexture 1024 x 1024, 4 x 4 tiles of 256 px, tile order: stripe,
  manhole, drain, oil, chalk, line, tag-a, tag-b, tag-c, tag-d, poster-a, poster-b, poster-c. Draw each in code: stripe
  and line plain off-white (0xf4f1de) full tile; manhole a dark grey disc with a cross-hatch and rim on transparent;
  drain a dark grate (bars) on transparent; oil a dark translucent blob (alpha ~0.5) on transparent; chalk a pastel
  hopscotch (squares and numbers) on transparent; tags bubbly spray letters in bright colours with an outline
  ("EVEN CUT", "LGL", "MOW NO MORE", "404") on transparent; posters filled rectangles with a title and two lines of
  small text ("LOST: ONE HAT", "VOTE MULCH", "TURFTON FM"). colorSpace SRGB. If `document` is undefined (tests), no map:
  plain colour materials. Two materials, each flatLayer(..., LAYER.decal): flat marks and upright marks
  (MeshStandardMaterial({ map, transparent: true, alphaTest: 0.35, roughness: 0.9, depthWrite: false })). Quad per mark:
  flat: PlaneGeometry(w, h).rotateX(-PI/2).rotateY(yaw).translate(x, y, z); upright: PlaneGeometry(w, h).rotateY(yaw)
  .translate(x, y, z); its uv remapped into the tile's rect (inset 2 px). Merge per (material, 64 m cell); name
  `${name}:flat|up:${cell}`; receiveShadow true; scene.add; registerCull(mesh, 'detail').
- buildCables(scene, cables, name): each cable is 6 straight segments along a parabola from a to b dipping `sag` m at
  the middle; each segment a BoxGeometry(0.05, 0.05, length) oriented from its start to its end (Matrix4 lookAt or
  quaternion setFromUnitVectors from +z) at its midpoint. Merge per 128 m cell (cell of the cable's a point); material
  MeshStandardMaterial({ color: 0x222222, roughness: 0.8 }); castShadow false; scene.add; registerCull(mesh, 'prop').
- No per-frame code. Dispose the source geometries after merging.
## Test: src/cityScenery/decals.test.ts
installFakeDom() first. A scene; patches: two rects of different kinds 200 m apart, a disc pond, a ribbon of 3 points;
marks: 3 flat 'stripe', 2 upright 'tag-a'; cables: 2. Check: buildPatches adds 4 meshes (kind+cell groups) whose
materials have polygonOffset true; the rect mesh's vertex count matches the subdivided plane; buildMarks adds meshes
whose uv values lie inside [0, 1] and only inside their tile's quarter; buildCables adds 1 mesh with 2 * 6 * 24 vertices
(BoxGeometry has 24); every mesh has castShadow false. (registerCull is fine in node.)
## Done when
- cd games/gnome-theft-auto && npx vitest run src/cityScenery/decals.test.ts passes; tsc clean in your files.
## Out of scope
Every other file.
~~~~

### Fringe issues (1M, 1O)

They share this block:

~~~~text
## Fringe kit (common to 1M and 1O)
Read first: games/gnome-theft-auto/src/fringe/belt.ts (FRINGE budgets and bands, beltDepth, beltDensity, bandAt,
FRINGE_THEMES per region, Track, EDGE_NAMES), src/fringe/plan.ts (call order: planTracks, planLots, planPoles,
planEdgeGreen), src/cityScenery/site.ts (Site.place / free / claim / patchFree / claimPatch / roadDist / drop;
footprintRect, prefabBox, prefabHeight, rectAround, growRect, roadDistance), src/cityScenery/types.ts.
Region look: pick it per spot with `themeRegion(themeAt(x, z, rnd()))` (src/regionThemes.ts), so near a region border the
look blends, then FRINGE_THEMES[region]. The city itself is 'turfton' (use its row for spots that resolve to it).
Ground: always y = heightAt(x, z); buildings need site.drop(rect) <= 1.0 (site.place does it with maxDrop).
Roads: highways in src/config.ts HIGHWAYS ({ id, points: [x, z][] }); the east, west, north and south highways start at
the city edge (180, 0), (-180, 0), (0, -180), (0, 180); ring roads run 300-400 m out. Keep every building >= 9 m from a
road centre line (roadClear 9), clutter >= 7.
The belt: beltDepth(x, z) = max(|x|, |z|) - 215, from 9 to 185. Already taken there (the Site knows): Fort Sandpit
(east, x 340-408), the airfield, the canal along z = 230 south of the city (water), the Skyway and East Beltway decks
(east, z = -60 and x = 255-290), work-site yards, compost heap / chapel van / unmowed ring reserves (west), the
birdbath basin (north, (0, -350)), stunt ramps, settlements start further out.
Mowable plants (flora/kinds.ts: wheat-patch, ornamental-grass, fern-clump, wildflower-patch, barrel-cactus, reed-bed,
...) are dressed with no collider (site.place drops it for them anyway); the builder hands them to flora.
Random: one mulberry32 per function (seed named in your issue), draws in a fixed order (deterministic on every client).
Test pattern: real world (installFakeDom from '../testing/fakeDom', vi.mock('../audio', ...), buildWorld, installSkyways
from '../highways/install'), then createSite(world) and your functions; timeout 180_000.
~~~~

~~~~text
Epic: 1, issue 1M: fringe ground: dirt tracks and the green creeping in
Depends on: none
[Environment (common) and Fringe kit (common to 1M and 1O) pasted here]
## Goal
games/gnome-theft-auto/src/fringe/ground.ts: planTracks (dirt tracks peeling off the highways) and planEdgeGreen (tree
clumps, hedgerows and long grass that thicken with distance from the city, in the neighbouring region's look).
## Change: src/fringe/ground.ts (keep both exported signatures)
planTracks(site, plan): Track[] (seed 5151):
- For each highway, walk its polyline in steps: next point every 85 + 40 * rnd m. At each point P with beltDepth(P) in
  [15, 170]: side = rnd < 0.5 ? 1 : -1; the road direction d (unit) and normal n = side * (-d.z, d.x); bend = (rnd - 0.5)
  * 0.6 rad; length L = 30 + 40 * rnd. Track points: A = P + n * 7 (just off the road edge), B = A + rot(n, bend / 2) *
  L / 2, C = B + rot(n, bend) * L / 2. Check samples every 3 m from A to C: each 4 x 4 square must pass
  site.free(sq, { roadClear: 6, pad: 0.5 }) and site.patchFree(sq), except that roadClear is not applied to the first
  6 m; stop the track at the first failing sample; keep it only when it is >= 20 m long (truncate the last segment).
  The region: themeRegion(themeAt(C)) (C the kept end). Patch: { kind: FRINGE_THEMES[region].track, shape: 'ribbon', x:
  A.x, z: A.z, w: 3.5, d: 3.5, yaw: 0, points }. For each 3 m sample square: site.claim(sq) (no collider) and
  site.claimPatch(sq). Return the tracks. At most 40 tracks.
planEdgeGreen(site, plan) (seed 6262), after lots and poles:
- Tree clumps: jittered grid, pitch 18 m (jitter +-6), over |x|, |z| <= 400 where beltDepth in [9, 185]: probability
  0.12 + 0.5 * (1 - beltDensity); a clump of 1-4 trees within 5 m of the point: id from FRINGE_THEMES[region].trees,
  height 5 + 4 * rnd (palm-tree 6 + 2 * rnd). Each tree: a 1 x 1 trunk rect checked with site.free(r, { pad: 0.6,
  roadClear: 8 }), then site.claim(r, 3) and a Dress { cls: 'tree', y: heightAt, scale: height / prefabHeight(id) }.
- Hedgerows / field fences in the 'field' band (beltDepth >= 120): grid pitch 40 m, probability 0.35: a straight run of
  3-6 pieces of FRINGE_THEMES[region].hedge (or its first fence when hedge is null) along x or z (rnd), pieces end to end
  (piece length = its prefab x-size), each site.place(... { solid: 1.1, pad: -0.05, roadClear: 8, cls: 'prop' }).
- Long grass and weeds: grid pitch 7 m (jitter +-2.5) where beltDepth in [9, 185]: probability 0.18 + 0.4 * beltDensity
  (overgrown near the city): 1-3 plants from FRINGE_THEMES[region].weeds within 1.5 m, site.place({ cls: 'detail',
  roadClear: 6.5, pad: 0.1 }). Stop at FRINGE.maxPlants plants.
- Stop everything at FRINGE.maxDress total dress in the plan.
## Test: src/fringe/ground.test.ts
Real world; site; plan = emptyPlan(); tracks = planTracks(site, plan); planEdgeGreen(site, plan). Check: 8..40 tracks,
each >= 20 m long, its first point 6-8 m from its highway's centre line; every ribbon patch has >= 2 points; >= 150 trees;
>= 300 weeds and <= FRINGE.maxPlants; at least 3 different tree ids overall (regions differ); no tree within 8 m of a road
centre line (roadDistance); deterministic on a second fresh Site.
## Done when
- cd games/gnome-theft-auto && npx vitest run src/fringe/ground.test.ts passes; tsc clean in your files.
## Out of scope
lots.ts, belt.ts, plan.ts, site.ts and every other file.
~~~~

~~~~text
Epic: 1, issue 1O: fringe lots, landmarks and power poles
Depends on: none
[Environment (common) and Fringe kit (common to 1M and 1O) pasted here]
## Goal
games/gnome-theft-auto/src/fringe/lots.ts: planLots (rough lots round the city, the junkyard, The Rusty Tine pub, water
towers, billboards) and planPoles (power poles and wires along the highways out of town).
## Change: src/fringe/lots.ts (keep both exported signatures)
planLots(site, plan, tracks) (seed 7373):
- Fixed sites first:
  - The Rusty Tine (pub, lore: docs/lore/entries/apocrypha/turfton-fringe.md): 'rough-pub' facing +x (yaw Math.PI / 2)
    at the first of (-26, -252), (-26, -264), (-26, -240), (-30, -276), (26, -252) (yaw -Math.PI / 2 there) that fits;
    solid true, cls 'building', roadClear 9, maxDrop 1.2. Around it: a gravel yard patch (its footprint grown 4 m, if
    patchFree; claimPatch it), 2 picnic-table (scale 1.6) and 3 barrel (scale 1.4) in the yard, a 'gta-billboard' (scale
    1.6) 14 m further from the road. An upright 'poster-a' mark on its front wall (see walls below).
  - The Boneyard (junkyard): centre the first fitting of (240, 160), (250, 175), (-245, 140), (230, -150): a sand / dirt
    (by region) yard patch 30 x 24, a chain-link-fence perimeter on its edges (pieces end to end, solid 2, pad -0.05)
    with a 6 m gate gap on the side nearest a road, then inside: 8 scrap-car (random yaw, solid), 5 tyre-pile (solid),
    3 scrap-heap (scale 3, solid), 2 shipping-container (solid, tints 0x3c6e8f / 0xb5342b), a portacabin office.
- Track-end lots: for each track, a lot centred 12 m past its last point along its last direction.
- Grid lots: a jittered grid over |x|, |z| <= 400, pitch FRINGE.lotPitch (jitter +-FRINGE.lotJitter), cells with
  beltDepth in [9, 185], visited in a fixed order (x outer loop, z inner, both ascending); draw 6 numbers per cell always;
  a lot when roll < 0.75 * beltDensity(x, z). Stop at FRINGE.maxLots lots.
- One lot at (x, z): region = themeRegion(themeAt(x, z, rnd)), th = FRINGE_THEMES[region]; band = bandAt(x, z); the
  building id from th.works / th.scrub / th.field by band (rnd); ~1 in 12 scrub lots a 'water-tower' instead. Yaw: the
  front faces the nearest road: compare roadDistance at (x +- 12, z) and (x, z +- 12), face the smallest
  (+x: Math.PI / 2, -x: -Math.PI / 2, +z: 0, -z: Math.PI). Tints: walls from th via REGION_THEMES[region].palette.walls
  (pick one) where the prefab has a tint. site.place({ id, x, z, yaw, cls: 'building', solid: true, roadClear: 9,
  maxDrop: 1.0, pad: 1 }); if it does not fit, no lot. Then:
  - yard: its footprint grown 3.5 m as a rect patch of th.ground, only if site.patchFree (claimPatch it; do not claim it
    for props);
  - fence: on 2 or 3 sides of the yard rect (never the front side), th.fences[rnd] pieces end to end, solid 1.2,
    pad -0.05, roadClear 7, cls 'prop';
  - clutter: 2-5 items from th.clutter in the yard ring (random spots between the building and the fence), site.place
    (cls 'detail', solid when >= 0.8 m tall, roadClear 7);
  - weeds: 3-6 from th.weeds in the yard corners (cls 'detail');
  - walls: with probability 0.35 an upright mark (tag-a..tag-d or poster-a..poster-c) centred on the front wall: the
    front face is at distance (prefab z-size * scale / 2 + 0.04) from the centre along the yaw direction; y = ground + 1.6;
    w 2.2 h 1.3 (tags) or 1.0 x 1.4 (posters); yaw = the lot yaw.
- Billboards: for the east, west, north and south highways, at the points where beltDepth = 40 and 120 along them, a
  'gta-billboard' scale 2 at 14 m to a random side, facing the road, solid true, cls 'building'.
planPoles(site, plan) (seed 8484):
- For highways east, west, north, south, ring-ne, ring-nw, ring-sw, ring-se: walk the polyline every 32 m; at points
  with beltDepth in [9, 185], a 'power-pole' at offset 9.5 m on the right of travel, yaw = Math.atan2(d.x, d.z) (its
  cross-arm then lies across the road), site.place({ solid: 8, cls: 'prop', roadClear: 7.5, pad: 0.3 }). Between two
  poles placed consecutively on the same highway (no skip between), two cables: from each pole's cross-arm end (local
  x = +-0.7, y = ground + 7.6) to the next pole's, sag 0.6 (plan.cables).
## Test: src/fringe/lots.test.ts
Real world; site; plan = emptyPlan(); planLots(site, plan, []); planPoles(site, plan). Check: 1 'rough-pub'; >= 4
'scrap-car'; 30..140 lot buildings (dress with cls 'building' excluding billboards); every building centre has
roadDistance >= 9; >= 3 distinct building ids; at least 2 regions' looks used (e.g. both a 'trailer-home' or
'adobe-hut' and a 'barn' or 'log-cabin' or 'nissen-hut' appear); >= 40 power poles and cables.length >= 2 * (poles -
highways); no two rect patches overlap; deterministic.
## Done when
- cd games/gnome-theft-auto && npx vitest run src/fringe/lots.test.ts passes; tsc clean in your files.
## Out of scope
ground.ts, belt.ts, plan.ts, site.ts and every other file.
~~~~

### Life, lore, check (1N, 1P, 1Q)

~~~~text
Epic: 1, issue 1N: park life (townsgnomes, ducks, benches, wishing fountains)
Depends on: none
[Environment (common) pasted here]
## Goal
games/gnome-theft-auto/src/parks/life.ts createParkLife(scene, plan) brings a park plan to life.
## Read first
src/parks/life.ts (stub), src/cityScenery/types.ts (DressPlan: gnomes, ducks, uses; UseSpot), src/ambientGnomes.ts
(createAmbientGnomes(scene, defs) - pass the plan's gnomes), src/interactables.ts (ExtraSpot, addInteractSpot: prompt
string, run(player, { hud, economy, fx, play })), src/economy.ts (Economy.spend(amount, reason): boolean, earn(amount,
reason)), src/types.ts (Player x/z/yaw/health, Hud.toast(text, ms?), Fx.spark(x, y, z), Sfx), src/cull.ts (registerCull).
## Change: src/parks/life.ts (keep `createParkLife(scene, plan): ParkLife` and `ParkLife`)
- Gnomes: const gnomes = createAmbientGnomes(scene, plan.gnomes) (only when plan.gnomes.length > 0); update forwards.
- Ducks: for each plan.ducks entry, up to 8 ducks in total: one THREE.Group per pond added to the scene, n ducks
  buildPrefab('hunt-mallard', { lights: false }) each on its own circle radius r * (0.55 + 0.45 * k / n), speed
  0.18 + 0.05 * k rad/s, phase k * 2.1. Update (only when the player is within 120 m of the pond; no allocation):
  angle += speed * dt; position = pond centre + (cos a, sin a) * radius, y = heightAt(centre) + 0.03 + 0.02 * sin(2t +
  phase); rotation.y facing along the circle. registerCull(group, 'prop', { moves: true }) after adding.
- Benches: for each use with kind 'bench': addInteractSpot({ x, z, prompt: 'Sit on the bench', run(player) {
  player.x = u.x; player.z = u.z; player.yaw = u.yaw; window.dispatchEvent(new CustomEvent('gta:emote', { detail:
  'sit-bench' })); return true; } }) (guard window with typeof window !== 'undefined').
- Wishing fountains: for each 'wish' use: addInteractSpot({ x, z, prompt: 'Toss an Acorn in the fountain (1 Acorn)',
  run }) where run: a 20 s cooldown per fountain (toast 'The water is still rippling. Give it a moment.' and return
  false); if !economy.spend(1, 'Wish') toast 'You need an Acorn to make a wish.' and return false; then fx.spark(x, 0.8,
  z), play('splash'), and with Math.random(): < 0.1 -> economy.earn(5, 'Wish') + toast 'The fountain coughs up five
  Acorns. Lucky gnome.'; < 0.35 -> player.health = Math.min(1, player.health + 0.15) + toast 'A cool splash. +15% Glaze.';
  else one of 12 fortune lines in Turfton voice, cycling in order (e.g. "Your hat will stay on in a strong wind. Once.",
  "A mower you never locked will still be there. This time.", "City Hall will lose your parking ticket.", ...). Toasts
  last 4000 ms.
- update(dt, px, pz): gnomes.update(dt, px, pz) and the ducks. Nothing allocated per frame.
## Test: src/parks/life.test.ts
installFakeDom() first; a THREE.Scene; a plan from emptyPlan() with 1 gnome def, 1 duck pond (n 3), a bench use at
(5, 5) yaw 1 and a wish use at (20, 20). createParkLife; update a few frames near the pond: the ducks move. Then
createInteractables(hudStub, economyStub, fxStub, () => {}) from '../interactables': a player stub at (5, 5) gets the
prompt 'Sit on the bench' and interact() puts the player's yaw at 1; at (20, 20) interact() spends 1 Acorn (economy spy
with spend returning true) and toasts once; a second interact at once hits the cooldown.
## Done when
- cd games/gnome-theft-auto && npx vitest run src/parks/life.test.ts passes; tsc clean in your files.
## Out of scope
interactables.ts, ambientGnomes.ts, app.ts and every other file.
~~~~

~~~~text
Epic: 1, issue 1P: lore for the parks and the fringe
Depends on: none
[Environment (common) pasted here]
## Goal
Lore fact-sheets for every new park, the fringe edges, The Rusty Tine, The Boneyard and their characters, consistent
with docs/lore/entries/apocrypha/turfton-parks.md and turfton-fringe.md (names fixed there; do not rename anything).
## Read first
docs/lore/README.md (entry schema), docs/lore/canon.md (house style), docs/lore/entries/apocrypha/turfton-parks.md,
turfton-fringe.md, gnorwin-statue-park.md, pure-loam-coop.md, turfton-street-life.md, turfton.md. Search before naming:
npm run lore -- find <word>.
## Change (new files in docs/lore/entries/apocrypha/, setting apocrypha, tier apocrypha, status draft, games
[gnome-theft-auto], sources [docs/roadmaps/gta-parks-and-fringe.md], related ids that exist):
- bandstand-green.md, kilnside-rec.md, mallard-mere.md, clayfoot-rose-garden.md, pure-loam-allotments.md: one per park:
  summary paragraph, "## What gnomes say", "## Inside & Stories" (its layout in a few bullets: what is where), "## In the
  games" (block centre, what the player can do: sit on benches; the wishing fountain at the rose garden), "## Loose
  threads". Characters to mention by these exact names: Lark Strummel (busker, Bandstand Green), Rosa Thornbury (head
  gardener, Clayfoot Rose Garden), Parsnip Mudge (Pure-Loam stallholder), the Clayfoot Twins (two statues in the rose
  garden; nobody agrees which Clayfoots they are).
- In gnorwin-statue-park.md add (small edits) that the statue now stands on a monument plinth facing the fountain, that
  the fountain takes an Acorn for a wish, and benches.
- the-rusty-tine.md (the pub on the north road out of town, landlord Bramwell Tapp, a rusted garden fork over the door),
  the-boneyard.md (the junkyard on the city's edge where wrecked mowers go; owner Rivet Malloy), and one entry per edge:
  scrapside.md, stumpend.md, chillyard.md, lockside.md (two paragraphs each: what is there, who lives there, a rumour).
- bramwell-tapp.md, rivet-malloy.md, lark-strummel.md, rosa-thornbury.md, parsnip-mudge.md (kind person, short).
- docs/lore/settings.md: in the apocrypha row / section's gnome-theft-auto sentence, add "the parks and the Fringe"
  (one small edit, keep the rest).
## Done when
- npm run lore passes (from the repo root).
## Out of scope
turfton-parks.md and turfton-fringe.md stay as they are (except fixing a broken link if lore check demands it), every
other lore file, every code file.
~~~~

~~~~text
Epic: 1, issue 1Q: the whole-world overlap test
Depends on: none
[Environment (common) pasted here]
## Goal
games/gnome-theft-auto/src/cityScenery/dressing.test.ts: builds the real world and the whole dressing plan and fails on
any overlap with roads, sidewalks, water, decks, parked vehicles, existing colliders, or between ground patches.
## Read first
src/cityScenery/install.ts (planCityDressing(world) -> { site, parks, street, fringe }), src/cityScenery/site.ts
(roadDistance, Site.colliders), src/cityScenery/types.ts, src/propsOffRoad.test.ts (how to build the real world in a
test), src/parking.ts (onSidewalk), src/water.ts (waterLevelAt), src/highways/deck.ts (deckContactsAt).
The planners are stubs right now (other workers are filling them in at the same time): the test must pass on the stubs
and keep meaning something when they are full.
## Change: src/cityScenery/dressing.test.ts (new)
installFakeDom first; vi.mock('../audio', () => ({ play: () => undefined })). world = buildWorld(...); installSkyways(new
THREE.Scene(), world) ('../highways/install'); const before = [...world.boxes]; const plan = planCityDressing(world).
Tests (one `it` each, timeout 240_000 for the file's build; build the world once in a beforeAll):
1. no collider in plan.site.colliders overlaps a box in `before` by more than 0.05 m on both axes (use a 32 m grid to
   find candidates);
2. every collider's corners and centre: roadDistance >= 5.6 (outside the lanes), onSidewalk false, waterLevelAt null,
   deckContactsAt(x, z) empty;
3. no collider within 2.5 m of a world.parked spot;
4. ground patches of all three plans: no two overlap (bounds: rect x +- w/2, z +- d/2 (yaw 0) or its rotated corners'
   bounds; disc x +- w/2; ribbon its points' bounds grown by w/2; a ribbon's own segments are one patch); report the
   first 5 offenders;
5. budgets: parks dress <= 1200, street dress <= 1800, fringe dress <= 2600, gnomes <= 20, ducks in total <= 8, marks
   in total <= 4000, cables <= 800;
6. every dress y is within 0.2 m of heightAt(x, z) except buildings (cls 'building', within 1.3 m);
7. deterministic: a second world built the same way gives a plan whose JSON (dress, patches, marks) is identical.
## Done when
- cd games/gnome-theft-auto && npx vitest run src/cityScenery/dressing.test.ts passes (on the stubs now).
## Out of scope
Every other file.
~~~~

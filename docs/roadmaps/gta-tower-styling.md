# Gnome Theft Auto: tower styling

Goal (the user's words): "make the towers in the main area a bit more unique and styled individually. we are getting
into the more detail territory."

Downtown Turfton has 16 generated towers (blocks within 130 m of the centre, `world.ts` `placeTowers`) plus Thorne
Tower. Before this plan every generated tower was a box (sometimes one setback) in one of four window textures, with a
grey roof slab and maybe a tank or an antenna. Now each named tower has its own silhouette, facade, crown, signs and
street level, and the rest get a seeded style that never repeats a neighbour.

## Rules this plan keeps

- Footprints, colliders and heights do not change. `world.ts` still pushes exactly the old collider for every tower and
  draws its three `rnd()` rolls in the same order (they now seed the style), so every later random draw (gardens) is
  unchanged. Every visible mass stays inside x ± w/2, z ± d/2 and under h; only crowns rise above h (never more than 2 m
  on the towers the intro flyover lowered, `capped`). Nothing below 3 m sticks out of a footprint.
- The golden layout (`layout.golden.test.ts`) fingerprints scene meshes, so the tower meshes' lines change; colliders,
  walk points, roads and every prefab batch except the new `tower-roof-gear` must not. Checked with `GOLDEN_OUT` and a
  diff before regenerating.
- Performance: one merged mesh per material for the whole downtown (facade, trim, metal, glow, sign) plus one prefab
  batch for roof gear (1-2 meshes): 6-7 draw calls, as before (4 palettes + roof + detail + light = 7).

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 0 foundation (planner) | `towers/` types, kit, materials (atlas shader, night switch), landmark table, stubs, `index.ts` assembly; world.ts records `TowerSpec`s; app.ts calls `setTowerNight`; map labels | planner |
| 1 tower kit | every stub filled, prefabs and lore in; `npm run build -w games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto`, `npm test -w packages/prefabs`, `npm run lore` | 9 parallel |
| 2 check (planner) | screenshots day/dusk/night, perf before/after, zfight, golden diff reviewed and regenerated | planner |

Issues of epic 1 (full text in `docs/roadmaps/gta-tower-styling/epic-1/`, environment in `_env.md`):

| # | File(s) owned | What |
|---|---|---|
| 1 | towers/facadeAtlas.ts | 16 facade designs + night glow atlas |
| 2 | towers/signAtlas.ts | 12 company signs, 4 murals |
| 3 | towers/silhouettes.ts (+test) | 9 silhouettes as pure masses |
| 4 | towers/crowns.ts | 12 crown kinds |
| 5 | towers/dress.ts | band, ribs, balconies, scaffolding |
| 6 | towers/street.ts | awnings / lobby canopy, signs, murals |
| 7 | towers/procedural.ts (+test) | minor tower styles, neighbour-aware |
| 8 | packages/prefabs/src/catalog/gta-towers.ts (+index line) | 11 roof gear prefabs |
| 9 | docs/lore (13 entries + 1 ruling) | tower lore |

## The landmarks

`src/towers/landmarks.ts`: Kiln-Shield Plaza (scaffolded art deco), Snail-Mail Sorting Tower (brick wedding cake, slow
clock), The Tattler Building (stained brick, water tank, mower mural), The Acorn-Cola Drum (round, candy panels), Razor-Back
Tower and Husky-Blade Tower (rival slab with sail vs glass block with pyramid), The Stink-Gro Step Garden (ziggurat),
Buck-Iron Tower (green and gold setbacks, spire), Pigeon-Drop Depot (H-block, helipad), Turfton FM Twin Masts (twin
towers, antenna farm), The Pure-Loam Glasshouse (roof garden), The Leaning Fizz (leaning), First Kiln Bank (gold glass,
giant gnome-hat finial). Three towers are minor and procedural. Online: towers are static scenery, identical for every
player (same seed), so nothing to sync. Mobile: no new input.

## How it ran

Issue 1 (facade atlas), 2 (signs), 8 (prefabs) and 9 (lore) ran on haiku workers. The shared subagent pool was full
(other planners), so the planner wrote issues 3-7 (silhouettes, crowns, dressing, street level, procedural) itself from
the same issue text. Planner fixes after review: lobby tile (dark glass and doors instead of a large grey disc), the
Leaning Fizz on WHITE_GRID tinted yellow (pink stucco tinted yellow read brown), no top sign on low podiums (it sat on
the street sign), canopy and sign backing offsets for z-fighting, roof gear batch with no shadow pass.

## Measurements (headless Edge, same machine; other planners were loading it heavily, so frame times are noise)

| What | Before | After |
|---|---|---|
| Tower meshes (draw calls before shadows) | 7 (4 palettes + roof + detail + light) | 7 (facade, trim, metal, glow, sign + roof-gear batch 2) |
| Tower triangles (geometry) | about 1,000 | 23,800 (kit 8,100 + roof gear prefabs) |
| Frame delta of all tower meshes on/off, 3 cameras | - | +8..15 draw calls (shadow pass included), +37..42k triangles of a 0.9-1.6M frame |
| gta-perf --cpu 4, Turfton leg: draw calls avg / tris | 235 / 677k | 237 / 661k |
| Textures | 5 x 256 px canvases | 3 x 1024 px canvases (facade, glow, signs) |

zfight scan (`?offline&no-intro&mount=zero-turn&mountat=0,-115,3.14`): no pair involves a tower mesh (the 11 found are
mowers, the snail-coach, a boat on Loch Moss and a skyway slip road).

Golden layout: colliders downtown are identical (diffed against the fixture: 0 boxes changed inside |x|,|z| < 130).
The fixture differs in the scene fingerprint (7 old unnamed tower meshes -> `towers-*` meshes + `tower-roof-gear`
batch) and the new batch. It also already differs in highways, givers, boxes, roads, gardens, settlements and water
from the other workstreams, so the fixture is regenerated once at the end of the batch, not here.

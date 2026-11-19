# Level format, terrain brushes and a level editor

Goal: one level format for the 3D games (a slice each game builds on, not a universal schema), proved on Gnomes of Gnomomia,
plus a local 3D editor with terrain brushes. This PR is steps 1-3 of the plan: the format (`@lawn/level`), terrain as an
instance with layers and a pre-baked walkability grid, and the editor. Gnome Front, Gnome Golf and Club Gnome come later.

## Design in one paragraph

A level is a JSON document of layers: `bounds`, `stamps` (parametric ground edits), `paths` (roads, walls, fences), `props`
(prefab placements), `markers`, and a game-owned `data` block. Brush edits are a separate sparse height raster
(`*.deltas.json`, 1 m vertices). Ground is built in a fixed order: the game's own ground, then stamps, then deltas. Walkability
is pre-baked per zone at 0.25 m into `walk.bake.json` (RLE, about 120 KB for the whole world) and only holds the STATIC part:
quest gates, interiors and run-time props stay live. A fingerprint in the file makes `npm run build -w games/gnomes-of-gnomomia`
fail when the bake is stale.

## Decisions

- Regions, lakes and the burrow are NOT turned into stamps: they stay in `ZoneDef` and `zoneGround()` (exact parity with the
  original world, pinned by `terrain.golden.test.ts`). Stamps and deltas are additive layers that start empty.
- Shared code earned: `@lawn/level` is used by the game and the editor. The terrain core and pathfinding stay in Gnomomia until a
  second game needs them.
- The editor draws simplified proxies (rings, boxes, lines) for houses, props and flora, not the game's own meshes.
- Surface paint (ground colour layer) is not in this PR.
- The editor is a local dev tool (like the prefab editor): the mobile and online rules do not apply to it.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundations (planner, written directly) | `terrain.golden.test.ts` + `terrainCore.test.ts` pass; `@lawn/level` core; editor scaffold with contracts and stubs | none: verbatim-decided code (committed as c57bc98) |
| 2. Integration (all parallel) | tsc for game, package and editor; the named tests; `lint:content` | A1 A2 A3, B1 B2 B3, C1, D1, E1 E2 E3 E4 E5 E6 E7 |
| 3. Wire-up (planner) | `npm run build -w games/gnomes-of-gnomomia`, `npm test` (minus the known failure), smoke checks of the game and the editor in headless Chrome, docs, PR | none |

No dependency inside Epic 2: every issue owns its own files and codes against stubs whose signatures are fixed in Epic 1.

## Issues (each in its own file; read `level-format/_common.md` first)

| Id | File(s) it owns | What |
|---|---|---|
| A1 | `worldDeltas.ts`, `data/levels/world.deltas.json` | load the world's brush edits |
| A2 | `levelDocs.ts`, `data/levels/*.level.json`, `data/zones/*.ts`, `content.ts` | zones become JSON level documents (round-trip proven) |
| A3 | `levelProps.ts`, `dressing.ts` | draw authored props as prefabs |
| B1 | `packages/level/src/brush.ts` | raise / lower / smooth / flatten brush maths |
| B2 | `packages/level/src/validate.ts` | validators for level, delta and walk files |
| B3 | `packages/level` tests + README | tests for math, stamps, deltas, walk grid |
| C1 | `bakeWalk.ts`, `walkBake.ts`, `scripts/bake-walk.mjs`, `scripts/check-bake.mjs`, game `package.json`, `data/levels/walk.bake.json` | pre-baked walkability + stale check |
| D1 | `reach.ts` | reachability flood fill |
| E1 | `viewport.ts`, `march.ts` | 3D view, terrain meshes, picking |
| E2 | `entityView.ts`, `overlayGeom.ts` | draw the zone's layers |
| E3 | `tools/brush.ts`, `tools/strokeMath.ts` | brush tool |
| E4 | `tools/select.ts`, `tools/selectMath.ts` | place / pick / drag / edit / delete items |
| E5 | `tools/road.ts`, `tools/roadMath.ts` | road tool |
| E6 | `tools/analyze.ts`, `tools/overlayPaint.ts` | walkability overlay, path test, reachability, re-bake |
| E7 | `server/handler.ts`, `server/api.ts`, `persist.ts` | save to the level files |

## Known unrelated failure

`games/gnomes-of-gnomomia/src/gear.test.ts > attaches weapon, shield, head, body, legs, hands, feet, and trinket to the gnome model`
fails on `main` and is not touched by this work.

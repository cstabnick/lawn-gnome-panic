Epic: FX09-1 (Pardonlin's ground, content)
Depends on: none (the lead's foundation commit 06b326a8 is in place)
Findings: G2#8 (should), G2#9 (should), the gardens part of G2#10 (tile props)

(Read `docs/roadmaps/gta-batch-3/review/fix/FX09/common.md` first: the shared environment, plan and ground contracts.)

## Goal
The Jardin keeps being a garden past the parterre (gravel walks, pleached limes, terracotta pots, an ornamental rill or
basin), and Basin Quay stops being "a large lawn with a distant boathouse and a pedalo on the grass" with the world
wall right behind the Basin.

## Owned files
- `src/pardonlin/districts/gardens.ts` (the whole file).
- `src/pardonlin/layout.ts`: **only** the gardens district's third rect `{ minX: -1548, maxX: -1405, minZ: 1005,
  maxZ: 1095 }`, which you may widen west to about `minX: -1660` so Basin Quay can dress the Basin's shores. Rects of
  different districts must not overlap (layout.test.ts checks; the Quays own x -1626..-1595 up to z 1005, the Left
  Bank's south rect is x <= -1700, z <= 900).
- `packages/prefabs/src/catalog/gta-pardonlin-garden.ts` (empty `GTA_PARDONLIN_GARDEN`, already registered).
- `docs/lore/entries/apocrypha/the-jardin.md`, `basin-quay.md` ("In the games" only, if it stops being true).

## Facts
- `gardens.ts` has a `tile(x, z)` helper placing `euro-paving-tile` props (the parterre's "gravel walks" are tiles, the
  Little Gardens' path, Basin Quay's path). Tile props are retired: replace them with ground patches
  (`plan.ground.push(...)`): gravel walks as `gravel` `line` or `rect` patches, the fountain plaza as `setts` or `flags`.
  Same-layer patches must not overlap. The Jardin's footpaths `trail/jardin-est` and `trail/jardin-ouest` are already
  laid as gravel ribbons automatically (on the same layer): do not overlap them (end your walks where they meet, or
  leave a 0.3 m gap).
- The Jardin: district rect x -1795..-1400, z -890..-540; editor spots `gd1` (-1510,-684) facing north (the parterre
  works: keep it), `jardinfountain` (-1600,-690). The Thymes crosses the Jardin (centre x about -1620..-1610 there);
  another worker builds its stone bank and quay walls: keep everything of yours **13 m or more from the river's centre
  line** (`pathPoints('thymes')`).
- Basin Quay: rect x -1548..-1405, z 1005..1095; the Basin is the water marker `water/pardonlin-basin`, world centre
  (-1600, 1040), 90 x 60 m (a rounded superellipse inside x -1645..-1555, z 1010..1070); the world's south edge is at
  z ~1100 (the world wall). Editor spots `gd3` (-1495,1045) facing west, `basin` (-1560,1040). `heightAt` /
  `waterAt` (src/terrain.ts) give the ground and `{ surface }`; a prop's y is `heightAt + (p.y ?? 0)`, so a floating
  boat gets `y = waterAt(x, z)!.surface - heightAt(x, z)`. `pardonlin/layout.ts RIVER_KEEP` only concerns the Thymes.

## Design
- **The Jardin (G2#9)**: past the parterre, lay **gravel walks** (patches, not props) on the main axis and a cross axis,
  line the main axis with **pleached limes** (new `pl-pleached-lime`: a clipped flat-topped box-hedge-on-stilts tree,
  trunk ~2 m then a square clipped crown; plant them in a straight double row, 5-6 m apart), put **terracotta pots**
  (new `pl-terracotta-urn` or reuse `euro-geranium-pot` / `flower-pot` / `manor-urn`) on balustrades or at the walk
  crossings, and add **an ornamental rill or a long basin** on the cross axis (a stone-edged channel prefab
  `pl-garden-rill` ~10-20 m long with a water plane inside, or a rectangular basin with a jet; keep its water a prop,
  not a water body). Benches facing the rill, a gardener resident clipping a lime, a sign in the town's voice
  ("PLEASE DO NOT PRUNE THE PRUNERS."). Replace the bare lawn-and-straight-tree-rows feel without losing the parterre.
- **Basin Quay (G2#8)**: a **stone quay edge** along the Basin's east shore (reuse a stone wall prefab from the catalog,
  e.g. one in `gta-euro-street.ts`, or add `pl-basin-coping`), **bollards** (`euro-bollard`), **moored boats** and two or
  three **boats on the water** (reuse boat prefabs from `packages/prefabs/src/catalog/gta-boats.ts`, `pl-swan-pedalo`;
  take the pedalo off the grass), a **harbourmaster's hut** (new `pl-harbour-hut`: a small clapboard hut with a
  noticeboard, a lifebuoy, a flagpole) with notices ("HARBOURMASTER. Office hours: high tide.\nThe Basin has no
  tide."), **crates and nets**, a **short pontoon** (new `pl-pontoon`, planks on floats, ~8 m) into the water, and
  **trees or a terrace row** along the south edge to hide the world wall (plane trees, a hedge, a row of small
  buildings if the rect allows; nothing solid on the water). Keep the Captain and the angler (existing residents) and
  give them something to stand on.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto`, `npx vitest run src/pardonlin` (from the game folder),
  `npm test -w packages/prefabs` (repo root) pass; `npm run lore` if you edited lore.
- Shots: `gd1:-1510,-684,3.1416`, `jardin2:-1560,-650,3.1416` (past the parterre), `jardinfountain:-1600,-690,3.1416`,
  `gd3:-1495,1045,-1.5708`, `basin:-1540,1040,-1.5708`, and `gd3` at 390x844. Iterate until it looks hand crafted.
  Report shot paths and any proposed ruling text.

## Out of scope
Every other district file and every other `layout.ts` line, `lanes.ts`, `thymes.ts`, `groundPlan.ts`, `ground.ts`,
`plans.ts`, `life.ts`, the Thymes' banks, `rulings.md`, the golden fixture.

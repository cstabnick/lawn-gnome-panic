Epic: FX09-1 (Pardonlin's ground, content)
Depends on: none (the lead's foundation commit 06b326a8 is in place)
Findings: G2#2 (blocker, must, D9 item 2)

(Read `docs/roadmaps/gta-batch-3/review/fix/FX09/common.md` first: the shared environment, plan and ground contracts.)

## Goal
Pardonlin stops being "kit houses round a field": crooked walk-only lanes are cut through the blocks of the Old Town
and the Left Bank (must) and Teacup Row (should), built up on both sides with kit buildings at 0-1 m gaps, with small
courtyards and passages, so the town has "closer buildings and ambling paths" (the user's words).

## Owned files
- `src/data/levels/pardonlin.level.json`: add lanes as `paths` entries
  `{ "id": "trail/pl-<name>", "kind": "road", "width": 3.5, "points": [[docX, docZ], ...] }` (document coordinates:
  world = doc + (-1600, 100); see `pl()` in `pardonlin/layout.ts`). Add only `trail/pl-*` entries; change nothing else.
- `src/pardonlin/districts/lanes.ts` (stub `export function addLanes(plans: DistrictPlan[]): void`, called by
  `pardonlin/plans.ts` after every district is planned and after the Thymes pieces are distributed). Keep that
  signature. Add a `lanes.test.ts` next to it.

## What happens automatically (do not re-implement)
- A `trail/...` path is walk-only (no traffic), flattened into the terrain and painted; `pardonlin/groundPlan.ts`
  `footpathKind` lays every `trail/pl-*` path as a cobble ribbon (width + 0.5 m) on the 'tint' layer.
- `pardonlin/layout.ts footprintProblem` keeps every building 0.5 m clear of every footpath, and the district plans
  place their rows through `keepClear`, so a lane that crosses a street row **removes the buildings in its way**: that is
  your passage through the row. Check that what it removes is acceptable (not a landmark, not a named shop with a sign).

## Design
- Old Town blocks: the Bean Tower block (between rue-nord, rue-a, the quai and the Rue Haute; the tower and its garden
  stay), the east strip between the Rue Haute backs and the back row (x about -1445..-1420: courtyards with washing
  lines are there now), the ordinary block between rue-b, the avenue and the Rue Haute (around (-1495,-110)). Do not
  cut through the Grand Platz (x -1562..-1478, z -283..-187: another worker owns it), the Bean Tower's garden and
  queue (x -1562..-1478, z -406..-328) or any E30 vignette spot (`plan.vignettes`).
- Left Bank: the blocks between the rue-ouest and the Boulevard (x about -1765..-1705) north and south of the Beetle
  Market, and the backyards (x -1795..-1700, z 400..900). Do not cut the Beetle Market (x -1760..-1705, z 50..220) or
  the Radio Adagio block (x -1698..-1636, z -152..-48): another worker owns them.
- Teacup Row and the Quays (should): one or two lanes in the blocks south of the Hatwheel, not through Teacup Row's café
  lane (x -1529..-1519, z 111..257) or the Place du Pot squares (x -1515..-1485, z 353..385; x -1521..-1497, z 407..427).
- 1-3 lanes per block, 3.5 m wide, bending (4-7 points, no straight shots longer than ~40 m), each starting and ending
  at a street, where the start/end point lies 5-8 m from the road centre line (under the pavement, never on the road).
  A lane never crosses a road and never runs within 13 m of the Thymes' centre line. Lanes must not overlap each other
  or any `plan.ground` patch (same layer).
- Build both sides: for each lane, `frontage('trail/pl-<name>', side, off, gap)` from `pardonlin/layout.ts` gives row
  starts; feed each to `planStreetRow({ ...start, seed, mix, setback: 0.3 })` (`eurokit/street.ts`) and `keepClear(rows,
  taken, rects)` (`pardonlin/plan.ts`). `taken` must hold the footprints of every building already in that district's
  plan (`buildingFootprint`) and every solid prop (`propFootprint`), and `rects` is the district's
  (`districtById(id).rects`). `off` is the frontage line's distance from the lane centre: start around 2.4 and tune so
  fronts stand 0-1 m from the cobbles. Use small houses (`euro-townhouse-tall`, `euro-townhouse-mansard`,
  `euro-half-timbered`, `euro-apartment-block`, the odd `euro-shopfront-antiques` or `euro-bakery`). Read
  `eurokit/street.ts` and `eurokit/catalog.ts` for the ids, sizes and options.
- At least two courtyards or passages per district: a widened bend with a tree, a bench, a well or water butt, a washing
  line, bikes, flower troughs (prefabs used in the district files: `euro-plane-tree`, `park-bench`, `euro-washing-line`,
  `euro-water-butt`, `euro-bike-rack`, `euro-flower-trough`, `euro-geranium-pot`, `euro-lamp-post`). One lane per
  district gets a street sign in the town's voice (`kind: 'street'`, e.g. "Ruelle des Pas Perdus\nThe steps are found.
  The way is not.") and one a short stepped section (a couple of `step`-like props or a `euro-iron-railing` by a slope)
  where the ground falls. Search the lore first (`npm run lore -- find lane`, `find pardonlin`).
- Push lane props, signs and buildings into the plan of the district they stand in.
- Perf budget (GR9): at most ~120 new buildings over all lanes together, and few props. The lead measures frame time.

## Contract
- Lane ids are `trail/pl-<name>` in `pardonlin.level.json` (another epic will walk strollers along them).
- `addLanes(plans: DistrictPlan[]): void` mutates the plans in place.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes; `npx vitest run src/pardonlin` passes (layout test: no overlaps,
  everything clear of roads/paths/river and inside its district); `lanes.test.ts` checks every `trail/pl-*` lane: width
  3-4 m, at least 4 points, never within 13 m of the Thymes, and each lane has buildings within 3 m of its edge along
  at least half its length.
- `npx vitest run src/terrain.test.ts src/terrainPaint.test.ts src/wasm/gtaWasm.test.ts src/levels.test.ts` pass (the
  lanes are new trails; the kernel takes them as data). Report any failure you cannot explain.
- Shots (desktop and one 390x844) looking along two lanes in each district show cobbles between close house fronts,
  with a bend and a courtyard. Report the shot paths and spots, and the number of buildings added per district.

## Out of scope
Every other file, especially the district plan files (`districts/oldTown.ts`, `leftBank.ts`, `teacupQuays.ts`,
`gardens.ts`, `thymes.ts`), `groundPlan.ts`, `ground.ts`, `layout.ts`, `plans.ts`, and the golden layout fixture.

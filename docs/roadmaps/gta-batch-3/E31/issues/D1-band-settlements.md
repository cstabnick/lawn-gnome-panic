Epic: E31 wave 2 (building the places)
Depends on: wave 1 (done)

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first. Use a Sonnet-level careful reading: `settlements.ts` is long.

## Goal
The outer bands (Trellisdown, Snowcap Rise, the Saltbucket hinterland) get roadside houses like the old regions have,
so driving between areas passes lived-in country. Today `planSettlements` stops at `MAP_EDGE` 860, so the bands (|x| or
|z| beyond 900) have no houses at all. The old regions' houses must stay exactly as they are.

## Read first
- `games/gnome-theft-auto/src/settlements.ts` (whole file: `planSettlements(existing)`, `placeLot`, `cluster`,
  `sitesAlong`, the region pass, `buildSettlements`)
- `games/gnome-theft-auto/src/settlements.test.ts`
- `games/gnome-theft-auto/src/living/config.ts` (`HAMLETS`, `HIGH_TARN`: keep houses away from them)
- `games/gnome-theft-auto/src/data/regionThemes.json` "houses" per region: west-estates and east-campus have none,
  north-highlands ['snow-cottage'], south-shore ['gnome-cottage'].

## Change
- `games/gnome-theft-auto/src/settlements.ts`:
  - Add an optional second parameter `opts: SettlementOpts = {}` to `planSettlements`:
    ```ts
    export interface SettlementOpts {
      seed?: number;            // default 7331 (today's)
      maxHouses?: number;       // default MAX_HOUSES
      maxPlacements?: number;   // default MAX_PLACEMENTS
      /** Chebyshev distance max(|x|, |z|) a house centre must be beyond (default: today's CITY_HALF + CITY_GROW rule only). */
      minEdge?: number;
      /** A house centre must lie within this Chebyshev distance (default MAP_EDGE). */
      maxEdge?: number;
      /** Only these regions get houses (default: all). */
      regions?: readonly RegionId[];
      /** Per-region house prefab ids used instead of the theme's `houses` (a region with an override counts as having houses). */
      housesFor?: Readonly<Partial<Record<RegionId, readonly string[]>>>;
      /** Circles houses keep out of (centre + radius, metres). */
      keepOut?: readonly { x: number; z: number; r: number }[];
    }
    ```
    With `opts` empty the plan must be byte-for-byte what it is today (same rnd sequence: only add checks that are
    skipped when the option is absent).
  - Export `BAND_SETTLEMENTS: SettlementOpts` = `{ seed: 9311, maxHouses: 70, maxPlacements: 1400, minEdge: 905,
    maxEdge: 1780, regions: ['west-estates', 'north-highlands', 'south-shore'], housesFor: { 'west-estates':
    ['gnome-cottage', 'thatched-cottage'], 'north-highlands': ['snow-cottage', 'log-cabin'], 'south-shore':
    ['gnome-cottage', 'stilt-cottage'] }, keepOut: [...HAMLETS, HIGH_TARN].map((p) => ({ x: p.x, z: p.z, r: p.r + 30 })) }`
    and also keep out of the Unmown, Pardonlin and Rootwell by the `regions` filter.
  - `buildSettlements`: after the existing pass, run a second pass
    `planSettlements([...boxes, ...plan.boxes, ...stageKeepOut(), ...stageSetBoxes()], BAND_SETTLEMENTS)` and add it as
    its own batch `buildStaticCells(..., { lights: false, name: 'settlements-bands', cls: 'building' })`, then push its
    boxes.
  - Houses must not be built on the coast beach/ocean or in water: the existing checks (reserves, water margins) should
    cover it; verify with the test below.
- `games/gnome-theft-auto/src/settlements.test.ts`: keep every existing assertion. Add: the default plan is unchanged
  (house count and the first 5 houses equal a snapshot you compute BEFORE editing the planner — run the old code first
  and paste the numbers into the test); `planSettlements([], BAND_SETTLEMENTS)` gives between 25 and 70 houses, every
  house in one of the three regions, Chebyshev distance > 900, none within `r + 30` of a hamlet or the High Tarn, none
  inside a reserved rect (`reservedRects()` from './sites').

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/settlements.test.ts src/propsOffRoad.test.ts src/scenery.test.ts` passes.
- `npx tsc --noEmit -p .` clean for your files.

## Out of scope
`regionThemes.json`, `world.ts`, `living/*`, the golden layout fixture (the lead regenerates it).

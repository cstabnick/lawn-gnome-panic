Epic: E31 wave 1 (prefabs and systems)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first.

## Goal
The Unmown nature preserve is full of small animals you can watch: hares boxing in the Long Meadow, hedgehogs and a fox
round Oldroot Wood, frogs and dragonflies at Reedmere marsh, ducks on the marsh, butterflies over the meadow, each with a
little behaviour of its own. Local to each browser, like all wildlife in the game.

## Read first
- `games/gnome-theft-auto/src/critters.ts` (the whole runtime: `CritterKind`, `CRITTER_SPECS` — the kinds 'hare',
  'hedgehog', 'fox', 'frog', 'duck', 'crab', 'butterfly', 'dragonfly' are already there with `swims` / `hop` /
  `flyHeight` —, `SpawnGroup`, `RegionLife`, `CritterRuntime`, `CritterCtx.night`, modes 'idle' | 'wander' | 'flee' |
  'script')
- `games/gnome-theft-auto/src/critters/snowcap.ts` and `critters/cloverfield.ts` (two finished RegionLife files)
- `games/gnome-theft-auto/src/critters/cloverfield.test.ts` (test style)

## Places (world metres; region id 'the-unmown')
- Long Meadow: centre (-560, -1640), roughly x -780..-340, z -1760..-1520. Meadow Hide at (-560, -1490).
- Reedmere: marsh water x -1260..-1040, z -1705..-1605 (shallow); the boardwalk runs from (-1100, -1560) south over it;
  Reedmere Hide at (-1050, -1550).
- Oldroot Wood: x -1780..-1560, z -1710..-1410. Wood Hide at (-1700, -1330).
- The trail `trail/unmown-loop` passes (-1560,-1172) (-1600,-1350) (-1500,-1500) (-1300,-1460) (-1150,-1470)
  (-900,-1560) (-750,-1460) (-550,-1440) (-330,-1560) (-300,-1460).

## Change
- `games/gnome-theft-auto/src/critters/unmown.ts` (stub exists: `export const unmownLife: RegionLife = { id: 'the-unmown', groups: [] }`;
  it is already registered in `critters/index.ts`). Fill it:
  - `groups` (region 'the-unmown'), about 45 critters in total: hares x3 groups of 3-4 in the Long Meadow; hedgehogs 2
    groups of 2 at the wood edge; one fox group of 2 near (-1660, -1380); frogs 2 groups of 5 on the north shore of
    Reedmere (around (-1150, -1600) and (-1060, -1600)); dragonflies 2 groups of 3 over the water ((-1150, -1650),
    (-1100, -1630)); ducks 1 group of 4 at (-1180, -1640); butterflies 3 groups of 3 over the meadow and the trail.
    Keep every group centre at least 15 m from the hides and the boardwalk line.
  - `update(rt, ctx)` behaviours (cheap: do nothing for critters farther than 150 m from the player; no allocations
    per frame):
    - Hares box: every 20-40 s, if the player is 15-60 m away and it is day, two hares of the same group turn to face
      each other and do a short "box" (switch both to mode 'script' for 1.5 s, raise their y by a small bounce each
      0.3 s), then go back to 'wander'.
    - Fox and hedgehogs are crepuscular: when `ctx.night` < 0.3 (day) they keep within 8 m of their group centre
      (`c.leash = 8`), at dusk/night (night > 0.3) leash 40 and they wander along the wood edge.
    - Frogs: when the player passes within 3 m on foot, the frog "plops": flees toward the water (use `rt.scare`) and
      `rt.deps.play` nothing (sounds are another worker's).
    - Ducks: no special code needed (the `swims` spec lets them paddle); optionally drift them slowly in a line.
    - Butterflies: give each a gentle zig-zag by nudging `c.goalX/goalZ` every few seconds.
  - Hits: no `onHit` (the default knock-over is right: nothing dies in this game).
- NEW `games/gnome-theft-auto/src/critters/unmown.test.ts`: every group's region is 'the-unmown' and
  `regionAt(g.x, g.z) === 'the-unmown'` (import from '../levels'); every kind is a key of `CRITTER_SPECS`; the life
  contains all of hare, hedgehog, fox, frog, duck, dragonfly, butterfly; the total count is between 30 and 60; no group
  centre within 15 m of the boardwalk points (-1100,-1560) (-1100,-1625) (-1150,-1625) (-1150,-1695).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/critters/unmown.test.ts src/critters.test.ts` passes.
- `npx tsc --noEmit -p .` clean for your files.

## Out of scope
`critters.ts`, `critters/index.ts`, `critters/bands.ts` (another worker), sound files, prefabs.

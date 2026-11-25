Epic: E31 wave 2 (building the places)
Depends on: wave 1 (prefabs exist)

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first. This is a writing-and-dressing issue: take care with the jokes.

## Goal
The Unmown tells its story without words (at least 6 readable vignettes), Oldroot Wood looks old, the Last Dandelion
stands in the Long Meadow, and the preserve has people: two rangers doing ranger things and three visitors, each with a
line (AC (a) vignettes, (c) residents).

## Read first
- `games/gnome-theft-auto/src/unmown/vignettes.ts` (your stub: keep `buildUnmownVignettes(scene, boxes): void` and
  `unmownPeople(): AmbientGnomeDef[]`)
- `games/gnome-theft-auto/src/living/config.ts` (STATION, UNMOWN_HIDES, BOARDWALK, PLATFORM, LAST_DANDELION)
- `games/gnome-theft-auto/src/ambientGnomes.ts` lines 1-80 (`AmbientGnomeDef`, examples of bubbles)
- `games/gnome-theft-auto/src/unmownGate.ts` (the swallowed-mower vignette at the gate: same style)
- `docs/lore/entries/apocrypha/the-unmown.md` (the preserve's lore)

## Places
Long Meadow x -780..-340, z -1760..-1520; Reedmere marsh water x -1260..-1040, z -1705..-1605; Oldroot Wood
x -1780..-1560, z -1710..-1410; trails as in `unmown/trails.ts` header or: loop (-1560,-1172) (-1600,-1350) (-1500,-1500)
(-1300,-1460) (-1150,-1470) (-900,-1560) (-750,-1460) (-550,-1440) (-330,-1560) (-300,-1460). Keep 4 m off trail centre
lines, 6 m off the hides, the boardwalk legs and the station site (x -1585..-1535, z -1170..-1130).

## Change
- `games/gnome-theft-auto/src/unmown/vignettes.ts`:
  - The Last Dandelion: `last-dandelion` at `LAST_DANDELION` (-600, -1660), with a single `log-bench` 5 m away facing it.
  - Six vignettes (props only, pick existing prefabs: browse ids with `grep -o "id: '[a-z0-9-]*'" packages/prefabs/src/catalog/*.ts`),
    each a small group of 3-8 props whose arrangement tells a story:
    1. The HOA survey that never came back: a surveyor's tripod and measuring tape half-swallowed by tall grass in the
       Long Meadow, an HOA hat on top of the grass, a clipboard on the ground.
    2. The mower that tried: a ride-on mower (an existing mower prefab, tinted rust) stuck in the meadow with a neat
       one-metre stripe mown behind it and grass taller than the seat in front.
    3. The picnic the ants won: a blanket (flat on the ground: use a thin prefab or a flatLayer plane), a basket on its
       side, a line of crumbs (tiny props) leading into the grass, at the meadow's edge near the trail.
    4. The birdwatchers' argument: two folding chairs facing opposite ways at the marsh's north shore, two flasks, one
       pair of binoculars on the ground between them.
    5. The ranger's lost hat: a ranger hat on a bramble at the edge of Oldroot Wood, a ladder lying under it, a "Back in
       5 min" stake (a tiny textPlate).
    6. The fairy ring: a ring of 9-12 toadstools in Oldroot Wood with a tiny gnome-size chair in the middle.
  - Oldroot Wood: 25-40 big old trees (existing tree prefabs, scale 1.3-1.8, e.g. search 'oak' / 'tree'), fallen logs,
    moss mounds, ferns, deterministic; tree colliders (small boxes at the trunk). Plus 60-120 wildflower / tall-grass
    pieces scattered in the Long Meadow (no colliders).
  - All static props in `buildStaticCells` batches ('unmown-vignettes', 'oldroot-wood', 'long-meadow').
  - `unmownPeople()` returns 5 `AmbientGnomeDef`s, ids prefixed 'unmown-':
    - Head Ranger Burdock Haybright (olive hat, khaki shirt, white beard) near the station porch, idle 'read' (reading
      the logbook): a bubble like "Twelve species before lunch. Thirteen if you count the HOA inspector hiding in the reeds."
    - Junior Ranger Pip Tussock (young, no beard) at the marsh north shore, idle 'look-around': counting reeds with a
      clicker: "Four thousand and six reeds. Four thousand and seven. Please stop walking past, you keep moving them."
    - Three visitors with their own looks and jokes: a nervous HOA inspector on a day off at the meadow edge (idle
      'cross-arms': "I am not measuring anything. This is a personal ruler."), a birder in the Meadow Hide's path side
      (idle 'think'), a child gnome sketching the Last Dandelion (idle 'sit-ground').
    Positions: each on open ground 3-6 m off a trail, facing it.
- NEW `games/gnome-theft-auto/src/unmown/vignettes.test.ts`: building does not throw; `unmownPeople()` has 5 entries with
  unique ids and every position in region 'the-unmown' (`regionAt`), none within 3 m of a trail centre line.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/unmown/vignettes.test.ts src/ambientGnomes.test.ts` passes.
- `npx tsc --noEmit -p .` clean for your files.

## Out of scope
Other `unmown/*` files, `living/*`, prefabs, lore docs (another issue records the names).

Epic: E16-A (countryside, first parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
`packages/prefabs/src/catalog/gta-country-crops-b.ts` holds Windfall Croft's cabbage and pumpkin plants at three growth
stages each, a cabbage and a pumpkin as produce, and the croft's oak at three stages (sapling, young, grown with acorns).

## Read first
- `docs/roadmaps/prefab-library/_common.md`: modelling rules (`at` = part centre, `rot` in degrees, lowest point at
  y = 0, front +z, at most 40 parts, `examine` voice). Ignore its "Environment" section.
- `packages/prefabs/src/types.ts` and `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/consumables.ts`: `crab-apple` (a small food item: category 'food', uses ['eat', 'collect']).
- `packages/prefabs/src/catalog/gta-world-green.ts`: find `giant-oak` and copy its trunk/canopy style (do not reuse its
  size: the croft oak is smaller).
- `packages/prefabs/src/catalog/gta-country-crops-b.ts`: the empty file you fill (already registered).

## Change
`GTA_COUNTRY_CROPS_B` gets (tags incl. 'crop' or 'oak', 'farm', 'croft', 'gta'; `emoji: []`; 5 examine lines each in
the house voice: dry, gnome-scale; acorns are Turfton's money, so an oak that drops them is a very patient bank):
- Plants: category 'prop', uses ['place']. ONE plant each on y = 0, at most 1.4 m across (the game puts 8 in a 3 x 8 m
  bed). A gnome is 1 m tall.
  - `crop-cabbage-0` sprout: two round seed leaves on a soil mound (flattened ball 0.3 wide, 0x4a3424).
  - `crop-cabbage-1` growing: a loose rosette of broad blue-green leaves (0x6f9f6a) ~0.35 tall, 0.7 wide.
  - `crop-cabbage-2` ripe: a big round pale-green head (0xa9cf8c ball, 0.7 across) wrapped in 5-6 broad outer leaves,
    ~0.6 tall.
  - `crop-pumpkin-0` sprout: two seed leaves and a curly tendril on a soil mound.
  - `crop-pumpkin-1` growing: a sprawling vine of 4-5 big flat leaves (0x4f8a3a) and a yellow flower, ~0.4 tall, 1.2 wide.
  - `crop-pumpkin-2` ripe: a fat ribbed orange pumpkin (0xe07b1f, 8 slightly overlapping squashed balls round a centre
    or one squashed ball with 6 darker rib strips 0.01 proud) ~0.8 across with a stalk, sitting among 3 leaves.
- Produce: category 'food', uses ['eat', 'collect']:
  - `produce-cabbage` "Cabbage": a round head with a few loose leaves, largest side ~0.35.
  - `produce-pumpkin` "Pumpkin": a small ribbed pumpkin with a curly stalk, largest side ~0.45.
- The oak (category 'prop', uses ['place'], tags 'oak', 'tree'):
  - `croft-oak-0` "Oak Sapling": a thin trunk ~1.2 tall tied to a wooden stake with a cloth strip, 6-8 small green
    leaf clumps, a ring of fresh soil at its foot (flattened 'soil' ball, 0.6 wide, 0.05 tall).
  - `croft-oak-1` "Young Oak": a trunk ~2.5 tall (0.12 radius) branching into a round canopy ~2.5 across, top at ~4.
  - `croft-oak-2` "The Croft Oak": a broad grown oak, trunk 0.35 radius, 3 big branches, a wide canopy of 6-8 green
    balls ~7 across, top at ~9, with 10-12 acorns (tiny brown balls with darker caps, use the acorn colours from the
    existing `acorn` prefab in the catalogue) hanging in the lower canopy and 4 lying round the foot.

## Contract
Ids exactly: `crop-cabbage-0`, `crop-cabbage-1`, `crop-cabbage-2`, `crop-pumpkin-0`, `crop-pumpkin-1`, `crop-pumpkin-2`,
`produce-cabbage`, `produce-pumpkin`, `croft-oak-0`, `croft-oak-1`, `croft-oak-2` (`games/gnome-theft-auto/src/farm/types.ts`
CROPS names them). Each lowest point at y = 0, centred on the origin.

## Done when
- `npm test -w packages/prefabs` passes for every test naming your eleven ids (run from the repo root; failures in other
  workers' new ids are not yours).
- `npx tsc --noEmit -p packages/prefabs` shows no errors in your file.

## Out of scope
Every other file.

Epic: E15-A (Hedgeworth Links, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E15/issues/_env.md` first (environment, rules).

## Goal
`packages/prefabs/src/catalog/gta-golf-plants.ts` holds the giant plants that line Hedgeworth's holes (they are huge
to a gnome, and you can drive straight through them) and the small course props of the groundskeeper's world.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: the modelling rules. Ignore its "Environment" section.
- `packages/prefabs/src/types.ts`, `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gta-wild-life.ts` (`giant-grass-blade`: a giant plant built so `buildPrefabInstances`
  can bake it: no pivots or named parts) and `packages/prefabs/src/catalog/props.ts` (`giant-flower`).
- `packages/prefabs/src/catalog/gta-golf-plants.ts`: the empty file you fill (already registered).

## Change
`GTA_GOLF_PLANTS` gets these prefabs (ids exact; 1 = a gnome's height). The giant plants have **no pivots and no named
parts** (they are baked in bulk), `category: 'prop'`, `uses: ['place']`, a `tint` for the leaves:
- `giant-hosta` (about 3.2 wide, 2.4 tall): a fountain of broad, ribbed, heart-shaped leaves (8-10 leaves: flattened
  ellipsoids or thin boxes tilted outward at different angles and heights, blue-green 0x5f8f6a with a pale edge trim),
  three tall flower spikes with small lilac bells.
- `giant-fern` (about 3 wide, 2.8 tall): six to eight long arching fronds from a central crown (each frond: 3 thin
  segments curving outward and down, with leaflet boxes along it), a curled fiddlehead in the middle.
- `giant-foxglove` (about 1.2 wide, 4 tall): a rosette of leaves at the bottom and one tall spire hung with 10-14 bell
  flowers (pink 0xd36aa8 cones pointing down with a speckled inside disc), getting smaller toward the top.
- `sprinkler-head` (about 0.25 tall): a pop-up lawn sprinkler: a green plastic cylinder body flush-looking but with its
  top 0.02 above y 0.03 (not coplanar with the ground: lowest point y 0, top cap 0.06 proud of the body), a brass nozzle
  head, named part `head` if names are supported for a spin.
- `mole-hill` (about 0.9 wide, 0.35 tall): a dome of fresh brown soil (a squashed sphere) with a few crumbs, a tiny
  pebble, and a little tuft of grass knocked over on top.
- `lost-ball-bucket` (about 0.5 tall): a dented metal bucket brimming with golf balls (balls: small white spheres
  heaped above the rim), a hand-painted label board leaning on it (blank).
- `ball-washer` (about 1.1 tall): a classic course ball washer: a post, a box head with a crank paddle on top, a towel
  hanging from a hook (a thin bent box, green-and-white).
- `bunker-rake` (about 1.4 long, lying): a wooden-handled sand rake lying flat on the ground (the head's teeth just
  touching y 0), plus a version note in `about` that the game lays it at bunker edges.
Five `examine` lines each in the house voice (`gta` in the tags). Ideas: the hosta "is not a tree, it insists, and has
never been asked to stop anyone", the foxglove "rings for nobody", the mole-hill "is not a mole-hill, says Thrift, it is
the green breathing".

## Contract
Prefab ids exactly: `giant-hosta`, `giant-fern`, `giant-foxglove`, `sprinkler-head`, `mole-hill`, `lost-ball-bucket`,
`ball-washer`, `bunker-rake`. The giant plants bake (no pivots, no names).

## Done when
- `npm test -w packages/prefabs` passes (or `cd packages/prefabs && npx vitest run -t <id>` per id, then the package once).
- `npx tsc --noEmit -p packages/prefabs` shows no errors in your file.

## Out of scope
Every other file.

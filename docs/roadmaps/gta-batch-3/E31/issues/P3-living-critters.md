Epic: E31 wave 1 (prefabs and systems)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first. Then read `docs/roadmaps/prefab-library/_common.md` for the
prefab format and examine voice, IGNORING its "Environment" section and its "Units" line: GTA critters are in metres at
the game's scale (a hen is 0.5 m tall, a cow 1.5 m).

## Goal
Five small animals exist as animated prefabs for Gnome Theft Auto's wildlife runtime.

## Read first
- `packages/prefabs/src/types.ts` (the contract; how `pivots` / named parts work)
- `packages/prefabs/src/catalog/gta-farm-critters.ts` (hen, squirrel: critters with pivots the runtime animates)
- `packages/prefabs/src/catalog/gta-wild-life.ts` (the bee: a flyer with wing pivots)
- `games/gnome-theft-auto/src/critters.ts` lines 500-535 (how pivots are animated: `body`, `head`, `tail`,
  `leg-0..leg-3`, `wing-0`, `wing-1`)

## Change
- `packages/prefabs/src/catalog/gta-living-critters.ts` (exists, exports an empty `GTA_LIVING_CRITTERS`, already
  registered). Fill it with five prefabs, built exactly like the hen/squirrel/bee (same pivot names, same way of
  attaching parts to pivots). Category as the farm critters use; tags include 'gta', 'critter', 'animal' and the noun.
  1. `critter-hare` — brown hare, ~0.9 m long, 0.5 m tall at the ears: long ears, white tail (pivot `tail`), four legs
     (`leg-0`..`leg-3`, long back legs), `body`, `head`.
  2. `critter-frog` — green frog, 0.3 m long, 0.15 m tall: squat body, big eyes, four legs (`leg-0`..`leg-3`), `body`.
  3. `critter-crab` — red-orange shore crab, 0.4 m wide, 0.15 m tall: oval shell, two claws, eye stalks, legs as
     `leg-0`..`leg-3` (each pivot holds a pair of thin legs), `body`.
  4. `critter-butterfly` — 0.35 m wingspan, body 0.15 m, flying pose: two wing pivots `wing-0` (left, +x side) and
     `wing-1` (right) each holding two coloured wing panels (tint = main wing colour, default orange; trim = spots),
     thin body, antennae. Lowest point y 0 (the runtime lifts flyers).
  5. `critter-dragonfly` — 0.5 m long, blue-green glossy body, two wing pivots each holding a pair of long clear-ish pale
     wings (light grey-blue), big eyes.
  Each: 5-6 examine lines in the Gnomes of Gnomomia voice (see the prefab common doc).

## Contract
Ids exactly as above; pivot names exactly `body`, `head`, `tail`, `leg-0`..`leg-3`, `wing-0`, `wing-1` (only the ones
listed per animal). The game's `CRITTER_SPECS` already point at these ids.

## Done when
- `npm test -w packages/prefabs` passes for these ids (failures only in another E31 catalog file mean a worker is
  mid-edit: rerun once, then report).

## Out of scope
Every other catalog file and `catalog/index.ts`; anything under `games/`.

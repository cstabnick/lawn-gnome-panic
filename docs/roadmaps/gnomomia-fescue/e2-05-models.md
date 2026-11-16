Epic: 2, Systems
Depends on: none

## Goal
Every `CreatureModel` in `config.ts` has a low-poly rig, so content packs can use any of them.

## Read first
- `games/gnomes-of-gnomomia/src/models.ts` (the `CreatureRig` interface and the slug, beetle and mole rigs show the style and the animation hooks)
- `src/config.ts` `CreatureModel`

## Change
- `src/models.ts`: add one builder per model not already built. Each returns a `CreatureRig` and animates through the same hooks the existing rigs use. Body colour is `def.color`; size is `def.scale`. Keep each under about 40 lines with simple primitives:

| model | Shape |
|---|---|
| rat | grey capsule body, pink tail |
| frog | squat body, big eyes, hops |
| worm | segmented spheres, wiggles |
| leech | flat black capsule |
| ant | three spheres plus six thin legs, antennae |
| aphid | small green pear |
| snail | spiral shell plus soft foot |
| crow | black body, wings that flap, beak |
| wasp | yellow and black striped, wings blur |
| moth | pale, broad wings |
| spider | round body, eight legs |
| cricket | long hind legs |
| earwig | pincers |
| centipede | chain of segments |
| straw | a scarecrow-ish straw bundle with a sack head |
| clay | a gnome-shaped figure, unglazed terracotta, no hat colour |
| metal | a boxy rust-red crab-like shape |
| mower | a big red box deck with four black wheels and a handle; this is the Mower, scale it hugely, used once |

- `createEnemyRig(def)` switches on `def.model`, with a default fallback to the beetle rig for anything unknown.
- `createNpcRig(def)` uses `def.model` when it's set and not `'gnome'`, so non-gnome NPCs (an ant, the Gleaner, a mole) render as their creature.

## Contract
Existing export signatures unchanged.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia`: no errors in models.ts.

## Out of scope
entities.ts and every other file.

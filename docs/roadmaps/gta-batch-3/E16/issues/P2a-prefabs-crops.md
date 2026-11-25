Epic: E16-A (countryside, first parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
`packages/prefabs/src/catalog/gta-country-crops.ts` holds Windfall Croft's radish and carrot plants at three growth
stages each, and one radish and one carrot as produce (bag icons and pickups).

## Read first
- `docs/roadmaps/prefab-library/_common.md`: modelling rules (`at` = part centre, `rot` in degrees, lowest point at
  y = 0, front +z, at most 40 parts, `examine` voice). Ignore its "Environment" section.
- `packages/prefabs/src/types.ts` and `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/consumables.ts`: `crab-apple` (a small food item: category 'food', uses ['eat', 'collect']).
- `packages/prefabs/src/catalog/gta-world-green.ts`: `wheat-patch` or any small plant there, for plant style.
- `packages/prefabs/src/catalog/gta-country-crops.ts`: the empty file you fill (already registered).

## Change
`GTA_COUNTRY_CROPS` gets (tags incl. 'crop', 'farm', 'croft', 'gta'; `emoji: []`; 5 examine lines each in the house
voice: dry, gnome-scale; Windfall Croft is a run-down Cloverfield croft whose last owner left and whose apples stayed):
- Plants: category 'prop', uses ['place']. ONE plant each, standing on y = 0, at most 1.2 m across (the game puts 8 in a
  3 x 8 m bed, 1.5 x 2 m apart). A gnome is 1 m tall: crops are gnome-scale, i.e. big.
  - `crop-radish-0` sprout: two tiny pale-green seed leaves on a short stem (~0.12 tall) and a small dark-soil mound
    (a flattened ball 0.3 wide, 0.06 tall, 'soil'/0x4a3424).
  - `crop-radish-1` growing: a rosette of 5-6 green leaves (flattened tilted balls) ~0.35 tall on the mound.
  - `crop-radish-2` ripe: a bushy rosette ~0.5 tall and a round red radish (0xc8283c) half out of the soil with a pink
    top and a thin root tail.
  - `crop-carrot-0` sprout: three thin feathery shoots ~0.15 tall on a soil mound.
  - `crop-carrot-1` growing: a feathery fan of thin green fronds (tilted thin cylinders, 7-9) ~0.45 tall.
  - `crop-carrot-2` ripe: a tall feathery fan ~0.6 tall and the orange (0xe8731c) shoulder of a carrot showing above
    the soil.
- Produce: category 'food', uses ['eat', 'collect'], small (largest side 0.3-0.4), lying or standing on y = 0:
  - `produce-radish` "Radish": a round red radish with a short leafy top and a thin root tail.
  - `produce-carrot` "Carrot": an orange carrot (a long tapered cone, a few faint ring grooves as 0.005-proud darker
    rings) with a green leafy top.

## Contract
Ids exactly: `crop-radish-0`, `crop-radish-1`, `crop-radish-2`, `crop-carrot-0`, `crop-carrot-1`, `crop-carrot-2`,
`produce-radish`, `produce-carrot` (`games/gnome-theft-auto/src/farm/types.ts` CROPS names them).

## Done when
- `npm test -w packages/prefabs` passes for every test naming your eight ids (run from the repo root; failures in other
  workers' new ids are not yours).
- `npx tsc --noEmit -p packages/prefabs` shows no errors in your file.

## Out of scope
Every other file.

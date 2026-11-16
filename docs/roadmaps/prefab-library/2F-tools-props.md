Epic: 2 Catalog
Depends on: none

First read and follow `docs/roadmaps/prefab-library/_common.md` (environment, format, modelling rules, examine voice, checks, out of scope).

## Goal
`packages/prefabs/src/catalog/tools.ts` holds about 14 tool and container prefabs and `packages/prefabs/src/catalog/props.ts` about 14 outdoor props, for gnome villages and loot.

## Change
- `packages/prefabs/src/catalog/tools.ts`: keep `loot-sack` and `wooden-chest`, append to `TOOLS`. Category `'tool'` (hand tools: uses include `'hold'` and need `grip`) or `'container'` (uses `['open', 'place']` or `['open', 'collect']`).
- `packages/prefabs/src/catalog/props.ts`: keep `mushroom-lamp`, append to `PROPS`. Category `'prop'`, uses include `'place'`. Props are gnome-village scale: 0.3 to 2.0 tall. A prop that gives light gets a `lights` entry, e.g. `lights: [{ at: [0, 0.4, 0], c: 'flame', intensity: 1.2, distance: 4 }]` (see `PrefabLight` in types.ts).
- Do NOT use these ids (another worker owns them): bed, bedroll, table, chair, stool, bench, hearth, barrel, crate, sack, rug, pot, lamp, counter, altar, pew, workbench, anvil, loom, cauldron, plant, painting, wardrobe, cupboard, millstone, bookshelf, lectern.

Tools and containers (`tools.ts`):

| id | name | category | emoji | look |
|---|---|---|---|---|
| tin-pail | Tin Pail | container | 🪣 | a tapered tin bucket with a wire handle (tags 'pail', 'bucket', 'handle'; stands in for "Pailwright Pail-handle") |
| dibber | Dibber | tool | 🌱 | a pointed wooden planting stick with a T handle (tags 'dibber'; stands in for "Spadewell Dibber") |
| mallet-head | Mallet Head | tool | 🔨 | a loose stone mallet head with no handle, a cracked hole (tags 'mallet', 'head'; for "Stonecrop Mallet Head"); no 'hold' |
| watering-can | Watering Can | tool | 🚿 | a round can with a long spout and a rose nozzle, a handle over the top |
| hand-rake | Hand Rake | tool | | a short handle with a fan of thin tines |
| fishing-rod | Fishing Rod | tool | 🎣 | a long thin bending rod with a line and a red float |
| hand-saw | Hand Saw | tool | 🪚 | a toothed blade with a wooden handle |
| ruler-stick | Measuring Stick | tool | 📏 | a long flat stick with tick marks (tags 'ruler', 'level', 'measure') |
| candle | Candle | tool | 🕯 | a stubby wax candle in a clay dish with a glowing flame (light) |
| torch | Torch | tool | 🔥 | a stick wrapped in cloth at the top with a glowing flame (light) |
| broom | Broom | tool | 🧹 | a long handle with a straw brush |
| wicker-basket | Wicker Basket | container | 🧺 | a round basket with a woven look (rings) and a handle |
| clay-jar | Clay Jar | container | 🏺 | a tall clay storage jar with a lid |
| coin-purse | Coin Purse | container | 👛 | a small drawstring leather purse with a coin peeking out |

Props (`props.ts`):

| id | name | emoji | look |
|---|---|---|---|
| signpost | Signpost | 🪧 | a post with two arrow boards pointing different ways |
| picket-fence | Picket Fence | | three white pointed pickets on two rails (a 1.0 wide section) |
| stepping-stone | Stepping Stone | | a flat round grey stone slab |
| flower-pot | Flower Pot | 🪴 | a terracotta pot with a red flower and leaves |
| garden-rock | Garden Rock | | a big mossy boulder |
| tree-stump | Tree Stump | | a short stump with roots and a ring-marked top |
| village-well | Well | | a round stone well with a little roof, a rope and bucket |
| glaze-shrine | Glaze Shrine | ⛲ | a small stone basin on a pedestal holding glowing blue glaze (light) |
| campfire | Campfire | 🔥 | a ring of stones with crossed logs and glowing flames (light) |
| mailbox | Mailbox | 📫 | a wooden box on a post with a little red flag |
| toadstool-seat | Toadstool Seat | | a squat flat-topped mushroom to sit on (uses include 'sit') |
| hay-bale | Hay Bale | | a straw block tied with two bands |
| wheelbarrow | Wheelbarrow | | a wooden tray on one front wheel with two handles |
| market-stall | Market Stall | | a counter with a striped awning on four posts (about 1.5 tall) |

## Contract
`export const TOOLS: PrefabDef[]` and `export const PROPS: PrefabDef[]` stay the export names and types.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in `tools.ts` or `props.ts`.
- `npm test -w packages/prefabs` passes every test for the ids above.

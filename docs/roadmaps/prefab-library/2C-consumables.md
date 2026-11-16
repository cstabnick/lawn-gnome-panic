Epic: 2 Catalog
Depends on: none

First read and follow `docs/roadmaps/prefab-library/_common.md` (environment, format, modelling rules, examine voice, checks, out of scope).

## Goal
`packages/prefabs/src/catalog/consumables.ts` holds about 20 potion and food prefabs covering every potion/food emoji Gnomes of Gnomomia uses.

## Change
- `packages/prefabs/src/catalog/consumables.ts` only. Keep `glaze-pot` and `red-mushroom`. Append these to `CONSUMABLES`.
- Category `'consumable'` for drinks, oils and tonics (uses include `'drink'` or none for oils), `'food'` for things you eat (uses `['eat', 'collect']`). Small: 0.1 to 0.25 tall. Liquids that should be recolourable use `c: 'tint'` + default `tint`; a `glow: true` liquid surface reads well in icons.
- Bottles that are hand-held get `'hold'` and a `grip` on the neck or body.

| id | name | category | emoji | look | stands in for items named |
|---|---|---|---|---|---|
| blue-potion | Blue Potion | consumable | 🫙 | a round glass jar with a cork and glowing blue liquid (tint) | Blue potion |
| red-potion | Red Potion | consumable | 🧪 | a tall thin glass vial with red liquid (tint), cork | Red potion, Sobriety tonic |
| honeydew-flask | Honeydew Flask | consumable | 🍯 💧 | a squat jar of golden honey with a cloth lid tied with string | Honeydew flask, Honeydew |
| rose-draught | Rose Draught | consumable | 🌹 | a bottle with pink liquid and a rose bud stopper | Rose draught |
| ruby-draught | Ruby Draught | consumable | 🍷 | a small stemmed goblet of dark red liquid | Ruby draught |
| sky-tonic | Sky Tonic | consumable | 🧴 | a flat-sided flask with pale sky-blue liquid and a screw cap | Sky tonic |
| spigot-water | Spigot Water | consumable | 💧 | a clay canteen on a strap with a water drop glowing at the spout | Spigot water |
| rust-oil | Rust Oil | consumable | 🛢 | a little dented tin can with a long thin spout | Rust oil |
| salt-pinch | Salt Pinch | consumable | 🧂 | a tiny paper twist and a small white heap of grains | Salt pinch |
| toadstool-stew | Toadstool Stew | food | 🍲 | a wooden bowl of brown stew with mushroom slices and a spoon | Toadstool stew |
| cheese-wedge | Cheese Wedge | food | 🧀 | a yellow wedge (use `wedge`) with holes (dark small balls) | (Cheese ledger list is a document, not this; still list 🧀) |
| fresh-peelings | Fresh Peelings | food | 🥬 | a curly heap of green and orange peel strips | Fresh peelings |
| stout-tankard | Stout Tankard | consumable | 🍺 | a wooden tankard with iron bands, a handle, foam on top | Stoutpot Tankard |
| seed-cake | Seed Cake | food | 🍪 | a round flat cake studded with seeds | (none yet) |
| bread-loaf | Bread Loaf | food | 🍞 | a crusty oval loaf with slashes on top | (none yet) |
| crab-apple | Crab Apple | food | 🍎 | a small red apple with a stalk and a leaf | (none yet) |
| blackberry | Blackberry | food | 🫐 | a cluster of dark purple balls on a stalk | (none yet) |
| clover-tea | Clover Tea | consumable | 🍵 | a little clay cup with a saucer and a clover leaf floating | (none yet) |
| acorn-flour-sack | Acorn Flour | food | | a tiny tied sack with flour dusted around it | (none yet) |
| pickled-slug | Pickled Slug | food | | a glass jar with a coiled green-yellow slug inside | (none yet; a joke food) |

## Contract
`export const CONSUMABLES: PrefabDef[]` stays the export name and type.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in `consumables.ts`.
- `npm test -w packages/prefabs` passes every test for the ids above.

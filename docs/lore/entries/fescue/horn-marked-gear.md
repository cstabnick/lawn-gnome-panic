---
id: horn-marked-gear
name: Horn-marked gear
kind: object
tier: setting
setting: fescue
era: now
status: canon
games: [gnomes-of-gnomomia]
aliases: [horn mark, reforging, reforged gear, reforging anvil]
sources: [docs/lore/rulings.md, docs/roadmaps/gnomomia-rebalance-raids.md]
related: [horn-calls, bramble-the-smith, flintdelve]
---

Gear won in a horn call carries the horn mark: a notch burnt into a strap or haft. Shops pay almost nothing for it ("won, not made: no merchant will sell another gnome's luck"). A smith with a reforging anvil can reforge it into a better piece for the next stretch of road. Sodbury, Clippings, Flintdelve and Last Tuft each have one beside the smith.

## What gnomes say

- A shopkeeper in Sodbury says: "Bring me a horn-marked strap and I'll give you a handful of acorns' worth of sympathy."
- Bramble the smith says: "Heat it, hammer it, and it stops looking like somebody else's trophy."

## The truth

Shops will not trade in horn-marked gear, so a raid is worth running for what it becomes at the anvil, never for the coins it fetches. Reforging takes the old piece and some coin and gives back the next tier's piece.

## In the games

`src/crafting.ts`, with `ItemDef.source` set to `'raid'` for a drop and `'craft'` for a reforged piece. Reforging anvils are in `src/data/packs/raid-stations.ts`. See R-137 and R-138.

## Loose threads

- What the notch means to the smiths, and whether the first one was cut by a gnome or by the beast.

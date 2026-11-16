Epic: 2 Catalog
Depends on: none

First read and follow `docs/roadmaps/prefab-library/_common.md` (environment, format, modelling rules, examine voice, checks, out of scope).

## Goal
`packages/prefabs/src/catalog/materials.ts` holds about 20 material prefabs (crafting stuff, monster drops, ore, wood) covering the material emoji Gnomes of Gnomomia uses.

## Change
- `packages/prefabs/src/catalog/materials.ts` only. Keep `gold-coins`. Append these to `MATERIALS`. Category `'material'`, uses `['collect']` plus `'craft'` where it is a crafting input. Small things lie on the ground (0.05 to 0.3 across).

| id | name | emoji | look | stands in for items named |
|---|---|---|---|---|
| timber-log | Timber Log | 🪵 | a short log lying along x, bark sides, pale rings on the end faces | Hedgewood timber, Heartwood Stake |
| snail-shell | Snail Shell | 🐚 | a spiral shell (stacked shrinking rings or balls) | (shell drops) |
| beetle-shell | Beetle Shell | 🐚 | a glossy dark-green split wing case lying open | Beetle shell |
| clay-chunk | Clay Chunk | 🟫 | a lumpy block of wet orange clay with a thumbprint | Clay chunk |
| clover-seed | Clover Seed | ☘ | a three-leaf clover on a short stem and two little seeds | Clover seed |
| grain-sheaf | Grain Sheaf | 🌾 | a tied bundle of golden stalks with heavy heads | Cloverfield grain, Grain sack, Hose reed |
| cricket-leg | Cricket Leg | 🦵 | a jointed brown insect leg with little spines | Cricket leg |
| wing-scale | Glittering Wing-scale | ✨ | a flat iridescent oval scale that glows a little | Glittering wing-scale |
| rat-tail | Rat Tail | 🐀 | a long thin pink curving tail (several short tilted pills) | Rat tail, Rust-rat tail |
| iron-bar | Iron Bar | 🔩 | a trapezoid ingot (box) with a stamped mark, a bolt beside it | Shard-iron bar, Shard ore |
| stone-chunk | Stone Chunk | 🪨 | an angular grey rock (a few rotated boxes) | Slate chip, Shard ore, The New Stopping Stone |
| shard-ore | Shard Ore | 🪨 | grey rock with bright blue-white crystals sticking out (glow) | Shard ore |
| scrap-gear | Shiny Scrap | ⚙ | a brass cog (cylinder + teeth boxes) and a twisted bit of wire | Shiny scrap |
| slug-slime | Slug Slime | 🟢 | a wobbly translucent-looking green blob (glow) in a little puddle | Slug slime |
| tall-eye-shard | Tall-eye Shard | 🔮 | a broken piece of a glass marble with a coloured swirl, glowing | Tall-eye shard |
| feather | Feather | 🪶 | a long white feather with a quill | (feather drops) |
| fang | Fang | 🦷 | a curved ivory tooth | (teeth drops) |
| spider-silk | Spider Silk | 🧶 | a spool of glistening white thread | (silk drops) |
| button | Button | 🔘 | a big four-hole button (gnomes use them as money and armor) | (currency) |
| twig-bundle | Twig Bundle | 🌿 | a tied bundle of short twigs | (wood drops) |
| dandelion-fluff | Dandelion Fluff | | a seed head: a thin stalk with a ball of white fluff | (none yet) |

## Contract
`export const MATERIALS: PrefabDef[]` stays the export name and type.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in `materials.ts`.
- `npm test -w packages/prefabs` passes every test for the ids above.

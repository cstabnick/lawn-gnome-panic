Epic: 2 Catalog
Depends on: none

First read and follow `docs/roadmaps/prefab-library/_common.md` (environment, format, modelling rules, examine voice, checks, out of scope).

## Goal
`packages/prefabs/src/catalog/armor.ts` holds about 22 armor and shield prefabs covering every armor/offhand emoji Gnomes of Gnomomia uses.

## Change
- `packages/prefabs/src/catalog/armor.ts` only. Keep `round-shield` and `pointy-hat`. Append these to `ARMOR`.
- Worn pieces are modelled as if set down on a table: hats sit on their brim, body pieces stand upright like on a dummy (a hollow-looking torso shape: a short wide cylinder or box with shoulder bumps, about 0.4 tall), gloves and boots are a pair side by side (`mirror: true`), leggings stand as two short tubes joined at a waistband.
- Shields: category `'shield'`, uses `['hold', 'block']`, `grip` at the centre back. Body armor: category `'armor'`.
- Use `c: 'tint'` + a default `tint` on the main cloth or leather of jerkins, smocks and tunics so games can recolour them.

| id | name | emoji | uses | look | stands in for items named |
|---|---|---|---|---|---|
| acorn-cap | Acorn Cap | 🌰 | wear-head | a scaly brown acorn cup worn upside down, little stalk on top | Acorn cap, Sprouted acorn cap |
| bucket-helm | Bucket Helm | 🪣 | wear-head | an upside-down tin pail with an eye slit and the wire handle as a chin strap | Armoury Bucket Helm |
| thimble-helm | Thimble Helm | 🪖 | wear-head | a dimpled silver dome (rows of tiny dents) with a rolled rim | Thimble helm, Bottlecap helm |
| keep-helm | Keep Helm | ⛑ | wear-head | steel helm with a nose guard and a red plume | Keep helm, Shard-iron helm |
| mushroom-hood | Mushroom Hood | 🧢 | wear-head | a soft cap shaped like a brown mushroom cap with a short neck flap | Mushroom hood, Level Brim |
| leather-jerkin | Leather Jerkin | 🦺 🦗 | wear-body | sleeveless laced vest, tinted leather | Bark vest, Earwig-hide jerkin, Mole-hide jerkin, Verge-runner jerkin, Waxed jerkin, Cricket-leather jerkin |
| wasp-jerkin | Wasp-paper Jerkin | 🐝 | wear-body | papery jerkin in yellow and black bands | Wasp-paper jerkin |
| bottlecap-cuirass | Bottlecap Cuirass | 🛡 🥋 | wear-body | a breastplate made of a crimped metal disc (ridged rim) on leather straps | Bottlecap plate, Bottlecap cuirass |
| beetle-plate | Beetle Plate | 🥋 🐞 | wear-body | glossy segmented shell plates over the chest; tinted (default 'chitin') | Beetle plate, Ladybird-shell plate (red, with black spots) |
| shell-plate | Bark-and-shell Plate | 🐚 | wear-body | bark slabs with a spiral shell on each shoulder | Bark-and-shell plate |
| keep-cuirass | Keep Cuirass | 🛡 | wear-body | polished steel breastplate with a brass crown emblem | Keep cuirass, Royal Basin plate, Shard-iron plate |
| bark-leggings | Bark Leggings | 🦵 | wear-legs | two bark-plated leg tubes on a belt | Bark leggings |
| bottlecap-greaves | Bottlecap Greaves | 🦵 | wear-legs | two shin guards of crimped metal | Bottlecap greaves |
| work-gloves | Work Gloves | 🧤 | wear-hands | a pair of thick leather gauntlets, cuffs up | Clog-Gloves, Shard-iron hand-plates |
| court-boots | Court Boots | 👢 | wear-feet | a pair of tall boots with turned-down cuffs and a buckle | Court boots |
| cloth-smock | Cloth Smock | 🥼 👗 👘 | wear-body | a long tinted smock (cone-ish skirt below a torso), a belt | Kiln-felt smock, Rain-woven smock, Dandelion-down smock, Petal-silk smock |
| spider-silk-smock | Spider-silk Smock | 🕸 | wear-body | pale silver-white smock with a faint web pattern (thin raised lines) | Spider-silk smock |
| moss-tunic | Moss Tunic | 👕 | wear-body | short green tunic with fuzzy moss lumps on the shoulders | Moss tunic |
| bin-lid-shield | Bin Lid | 🗑 | hold, block | a big ridged metal disc with a handle in the middle (shield) | Bin lid |
| pot-lid-shield | Pot Lid | 🍳 | hold, block | a round metal lid with a knob (shield) | Pot lid |
| oak-shield | Oak Shield | 🛡 | hold, block | a kite-shaped plank shield with an acorn painted in the centre (shield) | Oak shield |
| wool-scarf | Wool Scarf | | wear-neck | a tinted scarf in a loose coil with tasselled ends | (none yet) |
| leaf-cloak | Leaf Cloak | | wear-back | a cloak of overlapping big leaves on a cord | (none yet) |

## Contract
`export const ARMOR: PrefabDef[]` stays the export name and type.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in `armor.ts`.
- `npm test -w packages/prefabs` passes every test for the ids above.

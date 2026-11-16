Epic: 2 Catalog
Depends on: none

First read and follow `docs/roadmaps/prefab-library/_common.md` (environment, format, modelling rules, examine voice, checks, out of scope).

## Goal
`packages/prefabs/src/catalog/weapons.ts` holds about 20 weapon prefabs covering every weapon emoji Gnomes of Gnomomia uses.

## Change
- `packages/prefabs/src/catalog/weapons.ts` only. Keep `iron-sword` and `old-trowel`. Append these to `WEAPONS` (category `'weapon'` unless noted). All are hand-held: `uses` includes `'hold'` plus `'swing'`/`'throw'`/`'shoot'`/`'cast'` as fits, and every one has `grip`.

| id | name | emoji | look | stands in for items named |
|---|---|---|---|---|
| iron-trowel | Shard-iron Trowel | 🥄 | like old-trowel but a bright steel scoop, dark wood handle, wider | Shard-iron trowel |
| twig-slingshot | Twig Slingshot | 🪃 | Y-shaped forked twig (handle + two angled prongs), a leather band across the prong tips with a pouch | Ash slingshot, Forked twig sling, Robin-feather sling, Royal sling, Shard-tipped sling, Yew slingshot |
| hedge-shears | Hedge Shears | ✂ | two long flat blades crossing at a brass pivot, two wooden handles below, slightly open | Bronze shears, Hedge shears |
| clover-wand | Clover Wand | 🪄 | short pale stick, a three-leaf clover at the tip and a small glowing green bead | Clover wand, Slate rod |
| hazel-staff | Hazel Staff | 🪄 | tall (0.9) knobbly staff, gnarled crook at the top cradling a glowing gem | Hazel staff, Hedge-Mage staff, Spigot staff, Royal Warrant staff, Privet staff |
| reed-blowpipe | Reed Blowpipe | 🎋 | long thin tube (0.7) with three ring joints, a mouthpiece, a feathered dart tucked beside it | Elder-pipe blowpipe, Hollow-stem blowpipe, Reed blowpipe |
| garden-mallet | Garden Mallet | 🔨 | wooden barrel head across a long handle, iron bands on the head | Garden mallet |
| hand-fork | Hand Fork | 🍴 | short handle, three tines curving forward | Hand fork |
| hay-hook | Hay Hook | 🪝 | T-bar wooden handle, curved iron hook (use a partial `ring` arc) | Hay hook |
| iron-pick | Iron Pick | ⛏ | long handle, curved double-pointed iron head | Iron pick |
| war-hoe | War Hoe | 🪓 ⛏ | long handle, flat blade set at a right angle, sharpened edge, a ribbon tied below | War hoe, Haybale Family Hoe |
| lasso-sling | Lasso-and-Sling | 🪢 | a coiled rope (two or three stacked rings) with a loose loop and a small sling pouch | Lasso-and-sling |
| marble-shooter | Marble Shooter | 🔴 | a short wooden tube on a grip with a red glass marble loaded at the mouth | Marble shooter |
| mole-claw | Mole King Claw | 🦴 | a big pale three-claw hand on a leather-wrapped bone grip | Mole King claw |
| ranch-spade | Ranch Spade | 🪏 | long handle with a D-grip on top, flat square iron blade at the bottom (blade at the bottom, so grip is mid-shaft) | Ranch spade |
| royal-spear | Royal Spear | 🔱 | tall shaft (1.0), three-pronged steel head, a small blue pennant | Royal spear |
| willow-switch | Willow Switch | 🌿 | a thin bending green stick with a few leaves | Willow switch |
| thorn-dagger | Thorn Dagger | 🗡 | short (0.3) curved thorn blade, cloth-wrapped grip | (none yet: daggers, knives) |
| acorn-club | Acorn Club | | thick knotted branch with an acorn bound to the end | (none yet: clubs, cudgels) |
| pebble-pouch | Pebble Pouch | | a little leather pouch with sling stones spilling out; category 'weapon', uses ['throw', 'collect'], no hold | (ammo) |

## Contract
`export const WEAPONS: PrefabDef[]` stays the export name and type.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in `weapons.ts`.
- `npm test -w packages/prefabs` passes every test for the ids above.

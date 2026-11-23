Epic: 2 (parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-gun-store/_common.md` first, then `docs/roadmaps/prefab-library/_common.md` for the prefab modelling, data and
examine-voice rules (ignore its Environment section: the working directory is the one in our `_common.md`; there the catalog checks are
`npx tsc --noEmit -p packages/prefabs` and `npm test -w packages/prefabs`). Two other workers fill `gta-gun-mods-a.ts` and `gta-gun-store.ts`.

## Goal
9 gun-mod prefabs exist in `packages/prefabs/src/catalog/gta-gun-mods-b.ts`: the magazines, stocks and charms the game bolts onto its guns.

## Read first
- `packages/prefabs/src/types.ts`: `PrefabDef`, `Part`, shapes and what `d` means.
- `packages/prefabs/src/palette.ts`: colour names (or use 0xRRGGBB numbers).
- `packages/prefabs/src/catalog/gta-guns-air.ts`: the four guns these fit on. Note their size: the SMG's stick magazine is a box
  `d: [0.035, 0.16, 0.04]`; the rifle's wooden stock is `d: [0.07, 0.12, 0.2]`. Mods are just as small.
- `packages/prefabs/src/catalog/gta-glaze-ornaments.ts`: an example of small dangling ornaments in the same voice.

## Change
- `packages/prefabs/src/catalog/gta-gun-mods-b.ts` (already registered in `catalog/index.ts`, exports `GTA_GUN_MODS_B: readonly PrefabDef[] = []`):
  fill the array. Keep the export name.

### Authoring convention (the game relies on it)
Every mod is authored in the GUN's own frame, where the barrel points along +y, the gun's TOP is the -z side and its UNDERSIDE (trigger,
magazine) is the +z side; a stock sticks out from the back of the gun toward -z. Each prefab still stands on y = 0 and is centred on x and z
(the catalog test checks that). The game measures each part's bounding box and slides it onto a mount point. Keep every part between 0.03
and 0.35 on its longest side.

Category `'tool'` for magazines and stocks, `'trinket'` for charms; uses `['place']`; `emoji: []`; tags lower-case words including `gun`, `mod`
and the noun. No `grip`. Examine: 5 lines each, GTA parody voice is fine (like gta-guns-air.ts).

| id | name | look | size guide |
|---|---|---|---|
| `gunmod-extended-mag` | Extended Mag | A long straight box magazine along y, dark iron, a steel base plate at the bottom (y = 0 end), a thin orange stripe. Wider than the SMG's stick mag so it can hide it: at least 0.045 wide (x) and 0.05 deep (z). | ~0.045 x 0.24 x 0.05 |
| `gunmod-drum-mag` | Drum Mag | A round drum (a `cyl` lying with its axis along x, `rot: [0, 0, 90]`) with a short feed neck box on top (+y), a winding key knob on the side. | drum radius 0.06, thickness 0.05 |
| `gunmod-speed-mag` | Speed-Loader Mag | A short box mag along y with a bright orange pull-tab loop (`ring`) at the bottom and grip ridges (thin boxes). At least 0.045 x 0.05 across. | ~0.045 x 0.14 x 0.05 |
| `gunmod-padded-stock` | Moss-Padded Stock | A wooden stock block reaching toward -z with a thick green moss cushion (squashed `ball` or rounded box, colour `moss` or 0x5f8f3a) on its far (-z) end. | ~0.07 x 0.12 x 0.24 |
| `gunmod-wire-stock` | Wire Stock | A frame of bent garden wire reaching toward -z: two thin parallel steel rods (thin boxes or cylinders along z) and a U-shaped butt plate of rods at the far end, plus a tiny twist of green garden twine. | ~0.06 x 0.1 x 0.22 |
| `gunmod-charm-acorn` | Lucky Acorn | A little acorn on a string: a thin string (box or cyl) from a small ring at the top, an acorn (brown egg-shaped ball + a darker cap) at the bottom. Hangs along y. | ~0.04 x 0.1 x 0.04 |
| `gunmod-charm-dice` | Fuzzy Dice | Two small fuzzy dice (white boxes, a few black pip dots each) hanging from a short string, one a little lower and turned 30 degrees. | ~0.06 x 0.1 x 0.04 |
| `gunmod-charm-gnome` | Tiny Gnome | A thumb-sized gnome on a string: red cone hat, skin-coloured ball face, white beard wedge or ball, blue body. | ~0.04 x 0.12 x 0.04 |
| `gunmod-charm-bell` | Brass Bell | A small brass bell (`gold` or 0xc9a227 `cone`/`cyl`) on a ring with a dark clapper ball at the mouth. | ~0.04 x 0.08 x 0.04 |

## Contract
- File exports `GTA_GUN_MODS_B: readonly PrefabDef[]` with exactly the 9 ids above (kebab-case, unique in the library).
- Each prefab: lowest point within ±0.03 of y = 0, largest side between 0.03 and 3, roughly centred on x and z.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no errors in `gta-gun-mods-b.ts`.
- `npm test -w packages/prefabs` passes for every test whose name contains one of your ids (if another worker's ids fail, ignore those).
- You have read the file once top to bottom checking each prefab against its row.

## Out of scope
Every other file. In particular `catalog/index.ts`, `gta-gun-mods-a.ts`, `gta-gun-store.ts`, `gta-guns-air.ts` and anything under `games/`.

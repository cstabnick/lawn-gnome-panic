Epic: E33 mountain routes, wave 1. Worker: Haiku.
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E33/_common.md` (environment) and `docs/roadmaps/prefab-library/_common.md` (prefab
format, modelling rules, examine voice; ignore its "Working directory" line). Other workers fill the other E33 catalog
files at the same time.

## Goal
Five Gnome Theft Auto achievements for the mountain routes, each with a wearable reward prefab.

## Read first
- `packages/prefabs/src/catalog/gta-dirt-rally-gear.ts` (E14's reward gear: the exact style to copy, incl. `wear`
  offsets, `uses: ['wear-head' | 'wear-neck' | 'wear-back' | 'wear-hand']`, gnome-scale sizes in gnome units)
- `packages/prefabs/src/catalog/gta-mountain-gear.ts` (yours, empty, already registered)
- `packages/achievements/src/catalog.ts` — find the `gta-dirt-rookie` / `gta-rally-finish` entries (E14) and add yours
  after the last `game: 'gnome-theft-auto'` entry block of E14 (search for `gta-rally`); `packages/achievements/src/types.ts`
- `packages/gnome/README.md` (the wear slots; how rewards show on the gnome)

## Change
- `packages/prefabs/src/catalog/gta-mountain-gear.ts`: `export const GTA_MOUNTAIN_GEAR: readonly PrefabDef[]`:
  1. `pass-driving-goggles` "Pass Goggles" (wear-head): round leather driving goggles with amber lenses and a brown strap,
     worn up on the hat brim.
  2. `keyhole-pennant` "Keyhole Pennant" (wear-back): a small triangular felt pennant on a short pole stuck in a back
     strap, slate grey with a cream keyhole shape.
  3. `goat-bell` "Goat Bell" (wear-neck): a dented brass bell on a red leather collar.
  4. `bobble-beanie` "Bobble Beanie" (wear-head): a ribbed knitted beanie in white and sky blue stripes with a big round
     bobble on top.
  5. `alpenstock` "Alpenstock" (wear-hand; also `'hold'` with a `grip`): a tall ash walking staff with an iron spike and
     a little brass summit badge nailed near the top.
  Examine lines about Snowcap Rise, the Hatbrim (the Bobble, Old Pate, Brim Gap, the Hatband), the Spine Cut and the Top
  Hat café; warm and dry.
- `packages/achievements/src/catalog.ts`: five entries (`game: 'gnome-theft-auto'`, `gameTitle: 'Gnome Theft Auto'`):
  - `gta-brim-gap-road` "Over the Brim": "Drive the Brim Gap Road from one end to the other." reward head `pass-driving-goggles` "Pass Goggles"
  - `gta-spine-cut` "Through the Keyhole": "Drive the Spine Cut end to end, under the Keyhole." reward back `keyhole-pennant` "Keyhole Pennant"
  - `gta-hatband` "Round the Hatband": "Ride the Hatband end to end on a bike or a buggy." reward neck `goat-bell` "Goat Bell"
  - `gta-brim-walk` "Brim Walker": "Walk the Brim Walk from Mittenholt to the High Tarn on foot." reward head `bobble-beanie` "Bobble Beanie"
  - `gta-summit-register` "Signed at the Top": "Sign the Summit Register on the Bobble." reward hand `alpenstock` "Alpenstock"

## Contract
Achievement ids and prefab ids exactly as above (the game code unlocks these ids).

## Done when
- `npm test -w packages/prefabs` (your ids pass; failures naming ids of `gta-mountain-roads.ts` /
  `gta-mountain-places.ts` belong to other workers), `npm test -w packages/achievements`, `npm test -w packages/gnome`.
- `npx tsc --noEmit -p packages/prefabs` clean in your file.

## Out of scope
Every other file; `catalog/index.ts` is already done.

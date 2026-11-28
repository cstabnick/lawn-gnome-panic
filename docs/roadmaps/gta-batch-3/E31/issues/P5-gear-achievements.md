Epic: E31 wave 1 (prefabs and systems)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first. For the prefab format read `docs/roadmaps/prefab-library/_common.md`
(IGNORE its "Environment" section). Gear prefabs are worn by the player's gnome: follow the existing wearable rewards.

## Goal
Six achievements for the E31 living world exist in the shared catalog, each with a new wearable reward prefab.

## Read first
- `packages/achievements/src/catalog.ts` around the `gta-band-unmown` and `gta-grand-tour` entries (format)
- `packages/achievements/README.md` (rules for rewards: slot, prefabId)
- `packages/prefabs/src/catalog/gta-euro-gear.ts` (tour-beret / baguette-quiver / riviera-scarf: head, back and neck
  wearables with `wear` mounts — copy their structure exactly)
- `packages/prefabs/src/catalog/gta-birding-gear.ts` (a hand item, if one is there; otherwise any catalog item with a
  'hand' wear mount: `grep -rn "slot: 'hand'" packages/prefabs/src/catalog | head`)

## Change
- `packages/prefabs/src/catalog/gta-living-gear.ts` (exists, empty `GTA_LIVING_GEAR`, registered): six wearables
  - `ranger-campaign-hat` (head): a wide-brimmed ranger hat, olive, with a dandelion pinned to the band.
  - `reed-whistle` (neck): a cord with a reed pipe whistle and a small brass ring.
  - `hide-camo-cape` (back): a short cape of hessian with tufts of grass and leaves stitched on.
  - `bird-call-whistle` (hand): a wooden bird-call (a small turned cylinder with a mouthpiece and a brass key).
  - `milestone-medal` (neck): a ribbon with a medal shaped like a little stone milestone with "1" carved on it.
  - `camping-roll` (back): a rolled sleeping mat strapped with two buckled straps and a tin mug hanging off it.
  Each 5-6 examine lines in the Gnomes of Gnomomia voice.
- `packages/achievements/src/catalog.ts`: add a block `// ---- Gnome Theft Auto: E31 living world ----` after the
  `gta-band-unmown` / roundabout entries with exactly these six (game 'gnome-theft-auto', gameTitle 'Gnome Theft Auto'):
  - `gta-unmown-checklist` "Every Last Tick" — "Tick every species on the Unmown rangers' checklist." reward head
    `ranger-campaign-hat` "Ranger Campaign Hat".
  - `gta-dry-feet` "Dry Feet" — "Walk the Reedmere boardwalk from end to end without stepping off." reward neck
    `reed-whistle` "Reed Whistle".
  - `gta-hide-and-seek` "Hide and Seek" — "Sit quietly in all three bird hides of the Unmown." target 3, reward back
    `hide-camo-cape` "Hide Camo Cape".
  - `gta-fresh-feathers` "Fresh Feathers" — "Spot 5 of the birds that only turned up recently." target 5, reward hand
    `bird-call-whistle` "Bird-Call Whistle".
  - `gta-off-the-beaten-lane` "Off the Beaten Lane" — "Find Espalier End, Mittenholt, Dunelow and the High Tarn." target
    4, reward neck `milestone-medal` "Milestone Medal".
  - `gta-weekend-away` "Weekend Away" — "Drive the Ranger Buggy, the Snail-Shell Camper and the Cone Van." target 3,
    reward back `camping-roll` "Camping Roll".

## Contract
Achievement ids and reward prefab ids exactly as above (the game fires them from `src/living/config.ts` LIVING_ACH).

## Done when
- `npm test -w packages/achievements` passes.
- `npm test -w packages/prefabs` passes for your ids.
- `npm test -w packages/gnome` passes (gear wear checks), or fails only on items that are not yours (report them).

## Out of scope
Other catalog files, anything under `games/`.

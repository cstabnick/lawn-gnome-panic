Epic: E16-B (countryside, second parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
Six countryside achievements are in the achievements catalogue, each with a wearable reward; the six rewards exist as
prefabs in `packages/prefabs/src/catalog/gta-country-gear.ts`.

## Read first
- `docs/roadmaps/prefab-library/_common.md` (modelling rules; ignore its "Environment" section).
- `packages/prefabs/src/types.ts` and `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gta-campus-gear.ts`: finished GTA rewards to copy the style of: head pieces
  (`ant-antenna-headband`, `pinwheel-hat`: origin at the bottom of the hat, sized ~0.3 across), a neck piece
  (`rootwell-college-scarf`) and a back piece (`star-chart-tube`), with `about`, `tags` (incl. 'reward', 'gta') and
  `emoji: []`. For hand pieces look at `golden-putter` or any `uses: ['wear-hand']` item in the catalogue (grep
  `wear-hand` under `packages/prefabs/src/catalog/`) and copy how the grip sits at the origin.
- `packages/achievements/src/catalog.ts`: the GTA entries `gta-deans-leap` and `gta-first-class-honours` (format,
  `target`, `reward: { slot, prefabId, label }`).
- `packages/prefabs/src/catalog/gta-country-gear.ts`: the empty file you fill (already registered).

## Change
- `gta-country-gear.ts`, `GTA_COUNTRY_GEAR` (category 'armor' for head/neck/back, the same category the hand examples
  use for hand items; uses ['wear-head'] / ['wear-neck'] / ['wear-back'] / ['wear-hand'] as given; plain palette
  colours, no tint; 5 examine lines each in the house voice):
  - `croft-trowel` (hand): a small garden trowel with a worn wooden handle and a steel blade with a little soil on the
    tip. Reward of "First Sprout".
  - `croft-straw-hat` (head): a wide-brimmed straw farm hat (0xe3c77a) with a green band and a single acorn tucked in
    the band. Reward of "Oak Patience".
  - `brass-knocker-pendant` (neck): a heavy brass ring (a miniature of the Brassknock Manor knocker, ~0.12 across) on a
    dark ribbon round the neck, hanging in front. Copy how `rootwell-college-scarf` sits (neck pieces hang forward of
    the neck). Reward of "Mansion on the Hill".
  - `antler-headband` (head): a brown headband with two small branching felt antlers (3 tines each). Reward of "Deer Me".
  - `camp-kettle-pack` (back): a small olive rucksack with a black kettle strapped to the outside and a rolled bedroll on
    top. Size like `star-chart-tube`. Reward of "Camp Crasher".
  - `spirit-level` (hand): a yellow spirit level ~0.5 long held by its middle, with a green vial and a bubble. Reward of
    "Level Best".
- `packages/achievements/src/catalog.ts`: six entries in the GTA block, directly after the last `gta-` entry of the E13
  Rootwell group (`gta-windfall`), each `game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto'`:
  - `gta-first-sprout` "First Sprout": "Harvest your first crop at Windfall Croft." reward
    `{ slot: 'hand', prefabId: 'croft-trowel', label: 'Croft Trowel' }`.
  - `gta-oak-patience` "Oak Patience": "Grow an oak at Windfall Croft and shake the acorns from it." reward
    `{ slot: 'head', prefabId: 'croft-straw-hat', label: 'Croft Straw Hat' }`.
  - `gta-mansion-on-the-hill` "Mansion on the Hill": "Stand at Brassknock Manor's front door, under the knocker nobody
    uses." reward `{ slot: 'neck', prefabId: 'brass-knocker-pendant', label: 'Brass Knocker Pendant' }`.
  - `gta-deer-me` "Deer Me": "Get close to twelve different deer without scaring them off first." `target: 12`, reward
    `{ slot: 'head', prefabId: 'antler-headband', label: 'Antler Headband' }`.
  - `gta-camp-crasher` "Camp Crasher": "Visit ten hunters' camps out in the empty country." `target: 10`, reward
    `{ slot: 'back', prefabId: 'camp-kettle-pack', label: 'Camp Kettle Pack' }`.
  - `gta-level-best` "Level Best": "Walk through the gates of all three Thorne Even-Estates building sites." `target: 3`,
    reward `{ slot: 'hand', prefabId: 'spirit-level', label: 'Spirit Level' }`.

## Contract
Achievement ids, `target` and reward prefab ids exactly as above (the game unlocks/increments these ids:
`games/gnome-theft-auto/src/country/types.ts` `COUNTRY_ACH`).

## Done when
- `npm test -w packages/prefabs` passes for your six ids; `npm test -w packages/achievements` passes.
- `npm test -w packages/gnome`: none of the failures (if any) may name one of your six ids. If one does, fix its parts
  (head gear sits on the hat line, back gear clear of the back of the head, neck gear outside the face, hand gear's grip
  at the origin) and rerun.
- `npx tsc --noEmit -p packages/prefabs` and `-p packages/achievements` show no errors in your files.

## Out of scope
Every other file.

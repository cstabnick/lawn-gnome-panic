Epic: E12-A (winter sports, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E12/issues/_env.md` first (environment, rules).

## Goal
Five winter achievements are in the achievements catalogue, each with a cosmetic reward; the four new wearable rewards
exist as prefabs in `packages/prefabs/src/catalog/gta-winter-gear.ts`. (The fifth reward, `cocoa-mug`, is another
worker's prefab: reference its id, do not create it.)

## Read first
- `docs/roadmaps/prefab-library/_common.md` (modelling rules; ignore its "Environment" section).
- `packages/prefabs/src/types.ts` and `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gta-weather-gear.ts`: two finished GTA rewards (a head piece and a neck piece) to copy
  the style of, including `about`, `tags` and `emoji: []`.
- `packages/prefabs/src/catalog/cosmetics-back.ts`: a back-slot piece (how back gear sits: origin and size).
- `packages/achievements/src/catalog.ts`: the GTA entries near `gta-glazed-over` and `gta-house-call` (format, `target`,
  `reward: { slot, prefabId, label }`).
- `packages/prefabs/src/catalog/gta-winter-gear.ts`: the empty file you fill (already registered).

## Change
- `gta-winter-gear.ts`, `GTA_WINTER_GEAR`:
  - `bobble-beanie` (head, uses ['wear-head']): a knitted beanie with a fat bobble, red and white stripes (3 bands),
    folded brim. Reward of Tea-Tray Run.
  - `ear-flap-hat` (head): a woolly trapper hat with two ear flaps hanging down at the sides (mirror), a little top
    pompom, tie strings, in mustard and brown. Reward of First Tracks.
  - `crossed-skis-pack` (back, uses ['wear-back']): two short wooden skis crossed in an X behind the back with a strap
    band and a buckle, the tips curled. Size like other back pieces (about 0.6 tall). Reward of Black Diamond.
  - `woolly-sock-scarf` (neck, uses ['wear-neck']): a scarf knitted from what is plainly a very long sock: wound ring plus
    a hanging end that ends in a heel and toe, cream with a red toe. Reward of Ice Station.
  Five examine lines each in the house voice (`gta` in the tags, 'reward').
- `packages/achievements/src/catalog.ts`: five entries in the GTA block (after the last `gta-` entry is fine), each
  `game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto'`:
  - `gta-tea-tray-run` "Tea-Tray Run": "Ride a tea tray down the Tea-Tray Run on Snowdrop Slope, start line to finish."
    reward `{ slot: 'head', prefabId: 'bobble-beanie', label: 'Bobble Beanie' }`.
  - `gta-first-tracks` "First Tracks": "Ski the Wool Run on Snowdrop Slope from the start hut to the finish banner."
    reward `{ slot: 'head', prefabId: 'ear-flap-hat', label: 'Ear-Flap Hat' }`.
  - `gta-black-diamond` "Black Diamond": "A clean Wool Run (every gate) in 26 seconds or less." reward
    `{ slot: 'back', prefabId: 'crossed-skis-pack', label: 'Crossed Skis' }`.
  - `gta-ice-station` "Ice Station": "Land 3 fish through holes in the ice." `target: 3`, reward
    `{ slot: 'neck', prefabId: 'woolly-sock-scarf', label: 'Woolly Sock Scarf' }`.
  - `gta-bear-hug` "Bear Hug": "Stand beside 9 different polar bears. They will not mind. They will barely notice."
    `target: 9`, reward `{ slot: 'hand', prefabId: 'cocoa-mug', label: 'Cocoa Mug' }`.

## Contract
Achievement ids, targets and reward prefab ids exactly as above (the game unlocks/increments these ids). If the
achievements test checks that every reward `prefabId` exists in `@lawn/prefabs`, `cocoa-mug` may be missing until the
other worker lands it: say so in your report, do not create it.

## Done when
- `npm test -w packages/prefabs` passes for your four ids, `npm test -w packages/achievements` passes (apart from a
  missing `cocoa-mug` as noted).
- `npx tsc --noEmit -p packages/prefabs` and `-p packages/achievements` show no errors in your files.

## Out of scope
Every other file.

Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
Five Rootwell achievements are in the achievements catalogue, each with a wearable reward; the five rewards exist as
prefabs in `packages/prefabs/src/catalog/gta-campus-gear.ts`.

## Read first
- `docs/roadmaps/prefab-library/_common.md` (modelling rules; ignore its "Environment" section).
- `packages/prefabs/src/types.ts` and `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gta-winter-gear.ts`: finished GTA rewards to copy the style of: head pieces
  (`bobble-beanie`, `ear-flap-hat`: origin at the bottom of the hat, sized ~0.3 across), a back piece
  (`crossed-skis-pack`) and a neck piece (`woolly-sock-scarf`), with `about`, `tags` (incl. 'reward', 'gta') and `emoji: []`.
- `packages/achievements/src/catalog.ts`: the GTA entries `gta-ice-station` and `gta-bear-hug` (format, `target`,
  `reward: { slot, prefabId, label }`).
- `packages/prefabs/src/catalog/gta-campus-gear.ts`: the empty file you fill (already registered).

## Change
- `gta-campus-gear.ts`, `GTA_CAMPUS_GEAR` (category 'armor', uses ['wear-head'] / ['wear-neck'] / ['wear-back'] as given;
  plain palette colours, no tint; 5 examine lines each in the house voice: Rootwell University, the ants who are its
  landlords and are never termites, the giant pinwheels of Pinwheel Ridge):
  - `ant-antenna-headband` (head): a dark red-brown headband with two bendy antennae on springs (thin tilted cylinders
    with a small ball at each tip), and a tiny white sugar cube clipped to the band. Reward of "Not Termites".
  - `rootwell-college-scarf` (neck): a striped university scarf (Rootwell colours: deep red 0x8b1e2b and cream 0xefe3c8,
    four stripes) wound once round the neck with both ends hanging in front, a little fringe at each end. Reward of
    "First Class Honours". Copy how `woolly-sock-scarf` sits (neck pieces hang forward of the neck).
  - `star-chart-tube` (back): a leather map tube carried across the back on a strap (a `cyl` ~0.55 long tilted ~30
    degrees, brass end caps, a rolled star chart poking out of the top with a few tiny gold star dots). Size like
    `crossed-skis-pack`. Reward of "Level with the Stars".
  - `rootwell-flight-goggles` (head): a soft leather flying helmet (brown, ear flaps) with brass-rimmed goggles pushed up
    on the forehead (two short `cyl` rims + pale lens discs), a red Rootwell 'R' badge (a tiny box) on the side. Reward of
    "Touch and Go".
  - `pinwheel-hat` (head): a silver hard hat (like Ragwort Coilspring's) with a tiny red-yellow-blue garden pinwheel on a
    stalk on top (four small tilted vane boxes round a pin). Reward of "Windfall".
- `packages/achievements/src/catalog.ts`: five entries in the GTA block, directly after `gta-bear-hug`, each
  `game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto'`:
  - `gta-deans-leap` "Not Termites": "Drive off Dean's Leap at the top of the Anthill and land it." reward
    `{ slot: 'head', prefabId: 'ant-antenna-headband', label: 'Ant Antenna Headband' }`.
  - `gta-first-class-honours` "First Class Honours": "Visit the front door of all twelve Rootwell University buildings."
    `target: 12`, reward `{ slot: 'neck', prefabId: 'rootwell-college-scarf', label: 'Rootwell College Scarf' }`.
  - `gta-stargazer` "Level with the Stars": "Look through the Anthill Observatory's telescope at night." reward
    `{ slot: 'back', prefabId: 'star-chart-tube', label: 'Star Chart Tube' }`.
  - `gta-touch-and-go` "Touch and Go": "Land an aircraft on Rootwell Field's runway." reward
    `{ slot: 'head', prefabId: 'rootwell-flight-goggles', label: 'Rootwell Flight Goggles' }`.
  - `gta-windfall` "Windfall": "Fly along Pinwheel Ridge below the tops of the pinwheels and between them." reward
    `{ slot: 'head', prefabId: 'pinwheel-hat', label: 'Pinwheel Hat' }`.

## Contract
Achievement ids, `target` and reward prefab ids exactly as above (the game unlocks/increments these ids:
`games/gnome-theft-auto/src/campus/types.ts` `ROOTWELL_ACH`).

## Done when
- `npm test -w packages/prefabs` passes for your five ids; `npm test -w packages/achievements` passes.
- `npm test -w packages/gnome`: the suite has ~38 known gear-fit failures for older items (another branch fixes them);
  none of the failures may name one of your five ids. If one does, fix its parts (head gear sits on the hat line,
  back gear clear of the back of the head, neck gear outside the face) and rerun.
- `npx tsc --noEmit -p packages/prefabs` and `-p packages/achievements` show no errors in your files.

## Out of scope
Every other file.

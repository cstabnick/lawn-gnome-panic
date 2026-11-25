Epic: E15-A (Hedgeworth Links, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E15/issues/_env.md` first (environment, rules).

## Goal
Six Hedgeworth achievements are in the achievements catalogue, each with a wearable reward, and the wearables (plus
the regulars' own headgear and held things) exist as prefabs in `packages/prefabs/src/catalog/gta-golf-gear.ts`.

## Read first
- `docs/roadmaps/prefab-library/_common.md` (modelling rules; ignore its "Environment" section).
- `packages/prefabs/src/types.ts` and `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gta-winter-gear.ts`: four finished GTA rewards (head, back, neck) to copy the style of,
  including `about`, `tags`, `emoji: []` and how back and neck pieces sit.
- `packages/prefabs/src/catalog/cosmetics-back.ts` (a back piece) and a `hand` held item: `packages/prefabs/src/catalog/tools.ts`
  (`watering-can`, uses `['hold', ...]`) for how a held thing is oriented (grip at the origin, pointing +z or up as the
  file does).
- `packages/achievements/src/catalog.ts`: the GTA entries ending with `gta-bear-hug` (format, `target`, `reward`).
- `packages/prefabs/src/catalog/gta-golf-gear.ts`: the empty file you fill (already registered).

## Change
- `gta-golf-gear.ts`, `GTA_GOLF_GEAR` (category 'armor' for worn, as the winter gear; held things as tools.ts does):
  - `argyle-tam` (head, `['wear-head']`): Basil's bright red tam-o'-shanter with a yellow argyle diamond band (small
    diamond boxes rotated 45°, 0.01 proud), a fat red pompom on top, sitting slightly to one side.
  - `tweed-flat-cap` (head): Peony's green plaid tweed flat cap: a flat crown sloping forward to a short stiff brim, a
    thin check pattern (a few darker stripe boxes 0.005 proud), a tiny brass pin.
  - `hosepipe-cap` (head): Thrift's battered brown cap sagging at the brim, a band of coiled green garden hose round it
    (a torus) with a brass hose nozzle sticking out at the side, a blade of grass tucked in.
  - `driver-cane` (hand, `['hold']`): a golf driver used as a walking cane: long shaft, a persimmon head with a brass
    sole plate at the bottom, a leather grip at the top with a crook.
  - `golf-club` (hand, `['hold']`): Basil's iron: a shaft, a shiny blade head, a rubber grip; length about 0.9.
  - `kicked-board-plank` (back, `['wear-back']`): one weathered fence board worn across the back on a rope strap, a bent
    nail still in it and a boot-print scuff. About 0.9 long.
  - `scorecard-lanyard` (neck, `['wear-neck']`): a striped lanyard ring with a little scorecard in a clear sleeve and a
    stubby pencil hanging from it.
  - `golf-bag-pack` (back): a small tartan golf bag worn on the back with three club heads with knitted covers poking up
    over the shoulder.
  Five examine lines each in the house voice (`gta` in the tags; rewards also 'reward').
- `packages/achievements/src/catalog.ts`: six entries in the GTA block right after `gta-bear-hug`, each
  `game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto'`:
  - `gta-kicked-board` "The Kicked Board": "Break through the loose board in the fence round Hedgeworth Links." reward
    `{ slot: 'back', prefabId: 'kicked-board-plank', label: 'The Kicked Board' }`.
  - `gta-hedgeworth-card` "Card in Hand": "Play all four holes of Hedgeworth Links (the 1st, 2nd, 3rd and 9th) in one round."
    reward `{ slot: 'neck', prefabId: 'scorecard-lanyard', label: 'Scorecard Lanyard' }`.
  - `gta-hedgeworth-ace` "Ace, Champ": "Hole in one at Hedgeworth Links. Basil will say it was luck. It was."
    reward `{ slot: 'head', prefabId: 'argyle-tam', label: 'Argyle Tam' }`.
  - `gta-birdie-birdie` "Birdie, Birdie": "Birdie (or better) two Hedgeworth holes in a row." reward
    `{ slot: 'hand', prefabId: 'driver-cane', label: 'Driver Cane' }`.
  - `gta-through-the-hedge` "Through the Hedge": "Drive a golf cart through a hedge arch at Hedgeworth Links." reward
    `{ slot: 'back', prefabId: 'golf-bag-pack', label: 'Golf Bag' }`.
  - `gta-groundskeepers-secret` "The Groundskeeper's Secret": "Pat down every molehill on the ninth green before
    Basil sees them." target 4, reward `{ slot: 'head', prefabId: 'hosepipe-cap', label: 'Hosepipe Cap' }`.

## Contract
Achievement ids, targets and reward prefab ids exactly as above (the game unlocks/increments these ids). Prefab ids
`argyle-tam`, `tweed-flat-cap`, `hosepipe-cap` are also worn by the three regulars (`HEDGEWORTH_CAST` in golf/types.ts);
`driver-cane`, `golf-club` are their held things.

## Done when
- `npm test -w packages/prefabs` and `npm test -w packages/achievements` pass.
- `npx tsc --noEmit -p packages/prefabs` and `-p packages/achievements` show no errors in your files.

## Out of scope
Every other file.

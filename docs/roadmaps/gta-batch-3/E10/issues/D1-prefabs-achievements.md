Epic: E10-A (homes, parallel wave)
Depends on: none

Read `docs/roadmaps/gta-batch-3/E10/issues/_env.md` first (environment, rules).

## Goal
The new objects the homes need exist in `@lawn/prefabs` (a courtyard saucer, a door buzzer panel) plus four wearable
achievement rewards, and the four home achievements are in the achievements catalogue.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: the modelling rules (units, `at` = centre, `rot` in degrees, lowest point at
  y = 0, front +z, parts limits, `examine` voice: 4-5 lines, one a saying, one a tip, one a joke). Ignore its
  "Environment" section (use this worktree).
- `packages/prefabs/src/types.ts` (the `PrefabDef` contract) and `packages/prefabs/src/palette.ts` (colour names).
- `packages/prefabs/src/catalog/cosmetics-back.ts` (`rooftop-pigeon-pack`: a back reward) and
  `packages/prefabs/src/catalog/gta-euro-gear.ts` (rewards of another GTA epic) for style.
- `packages/prefabs/src/catalog/index.ts`: how a catalog file is imported and spread into the full list.
- `packages/achievements/src/catalog.ts`: the GTA entries near `gta-rooftop-run` (format, `target`, `reward`).

## Change
- New `packages/prefabs/src/catalog/gta-homes.ts` exporting `GTA_HOMES: PrefabDef[]`, registered in `catalog/index.ts`
  (import + spread next to `GTA_EURO_GEAR`):
  - `courtyard-saucer` (category 'prop', uses ['place']): a giant Tall-One china saucer set in the ground as a courtyard:
    white glaze with a blue rim band and a faint blue pattern ring, about 15 units across and 0.35 high: a wide flat
    `cyl` dish (radius 7.5, height 0.12, at y 0.06), a raised outer rim ring (a second thin cylinder or a ring laid flat
    with `rot: [90, 0, 0]`, top at ~0.35), a shallow central well (a slightly lower disc of a different shade; its top
    must sit at least 0.02 below or above any other top surface: no coplanar faces), a hairline crack (a thin dark box).
    `footprint: { r: 7.5, h: 0.4 }`. Examine lines about where it came from and why it never holds water.
  - `buzzer-panel` (prop, place): a brass door-buzzer panel on a short post, about 0.25 wide x 0.35 tall panel at gnome
    head height (~0.9-1.2 up), six round buttons in two columns, a tiny speaker grille, one button taped over.
    Examine: residents' joke ("3B: the new one. Buzz twice and wait for Hyssop to answer instead").
  - Rewards (one each, `category: 'armor'` like other wearables, with the matching use tag; check `types.ts` for the
    exact `Use` values and how `rooftop-pigeon-pack` sets its anchor/size):
    - `house-key-necklace` (uses ['wear-neck']): a big brass flat key on a string loop, a paper tag reading nothing
      (a blank tag part). Reward for Home Sweet Loan.
    - `nightcap` (uses ['wear-head']): a long striped sleeping cap with a bobble, tint-able stripe. Reward for Forty Winks.
    - `feather-duster` (uses ['hold'], must have `grip`): a wooden handle with a puff of feathers. Reward for Interior
      Decorator.
    - `rolled-doormat-pack` (uses ['wear-back']): a rolled coir doormat strapped across the back (a brown cylinder along
      x with two straps). Reward for House Call.
- `packages/achievements/src/catalog.ts`: four GTA entries after `gta-rooftop-run`:
  ```ts
  { id: 'gta-home-sweet-loan', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto',
    title: 'Home Sweet Loan', description: 'Sign for Flat 3B at the First Kiln Bank.',
    reward: { slot: 'neck', prefabId: 'house-key-necklace', label: 'House Key' } },
  { id: 'gta-interior-decorator', ..., title: 'Interior Decorator', description: 'Place 10 pieces of furniture in your flat.', target: 10,
    reward: { slot: 'hand', prefabId: 'feather-duster', label: 'Feather Duster' } },
  { id: 'gta-forty-winks', ..., title: 'Forty Winks', description: 'Sleep in your own bed at Saucer Court.',
    reward: { slot: 'head', prefabId: 'nightcap', label: 'Nightcap' } },
  { id: 'gta-house-call', ..., title: 'House Call', description: 'Stand at the front doors of 6 different Turfton homes.', target: 6,
    reward: { slot: 'back', prefabId: 'rolled-doormat-pack', label: 'Rolled Doormat' } },
  ```

## Contract
Prefab ids `courtyard-saucer`, `buzzer-panel`, `house-key-necklace`, `nightcap`, `feather-duster`,
`rolled-doormat-pack`; achievement ids `gta-home-sweet-loan`, `gta-interior-decorator` (target 10), `gta-forty-winks`,
`gta-house-call` (target 6). Other workers already use these exact ids.

## Done when
- `npm test -w packages/prefabs` and `npm test -w packages/achievements` pass.
- `git diff --stat` shows only the new catalog file, `catalog/index.ts` and `achievements/src/catalog.ts` (plus any
  generated docs the prefab tests require, e.g. `docs/cosmetics.md` if the achievements test asks for a row there).

## Out of scope
Every other catalog file; the game folder.

Epic: 8 Integration (Gnome Theft Auto Wild World)
Depends on: none

## Environment
Working directory `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree; stay in it, do not commit).
Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. Other workers are editing
`games/gnome-theft-auto/**`, `packages/achievements/src/sync.ts` and `sync.test.ts` at the same time: do not touch
them. Repo rules: new objects go through the prefab library (`docs/roadmaps/prefab-library/_common.md` has the rules);
every achievement has a cosmetic reward and every reward prefab belongs to one achievement only (a test enforces it).
Lore: no wetness, nothing bleeds; gnomes are fired clay.

## Goal
Seven Gnome Theft Auto achievements for the wild world and the boats, each with a gear reward; four new gear prefabs.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: PrefabDef rules (parts, colours, `about`, `examine` lines).
- `packages/prefabs/src/catalog/gta-tessie-gear.ts`: the model to copy: `loch-tam` (a `wear-head` hat, built with its
  lowest point at y = 0, `tint`/`trim`) and `loch-binoculars` (a `wear-neck` item hanging at the chest).
- `packages/prefabs/src/catalog/index.ts`: how `GTA_TESSIE_GEAR` is imported and spread into `CATALOG` (line ~73).
- `packages/achievements/src/catalog.ts` lines 515-536: the `gta-tessie-*` entries (format to copy), and
  `packages/achievements/src/achievements.test.ts` (the checks: prefab exists, its `uses` contains `wear-head` /
  `wear-neck` / `hold` for slots head / neck / hand, rewards unique).

## Change
- New `packages/prefabs/src/catalog/gta-wild-gear.ts` exporting `export const GTA_WILD_GEAR: readonly PrefabDef[]`
  with four prefabs, each with tags including `'reward'` and `'gta'`, `emoji: []`, an `about` starting
  "Gnome Theft Auto: the ...", and five `examine` lines (description, a saying, a Tip:, a Joke:, a detail):
  - `cowbell` "Cloverfield Cowbell", category `'trinket'`, uses `['wear-neck']`: a brass bell on a leather collar
    strap, hanging at the chest (place it like `loch-binoculars`), clapper visible.
  - `bear-shades` "Polar Bear Shades", category `'armor'`, uses `['wear-head']`: oversized round sunglasses (two dark
    lenses, a bridge, arms) on a white knitted headband, as the Fells polar bears wear in their deck chairs. Lowest point
    y = 0 like `loch-tam`.
  - `beekeeper-hat` "Beekeeper's Hat", category `'armor'`, uses `['wear-head']`: a wide straw brim, a round crown and a
    pale mesh veil (a short open cylinder of `cloth`-coloured parts) hanging from the brim; one tiny bee on the crown.
  - `captain-cap` "Captain's Cap", category `'armor'`, uses `['wear-head']`: a white peaked sailor's cap with a navy
    band, a black visor and a little gold anchor badge at the front (+z).
- `packages/prefabs/src/catalog/index.ts`: `import { GTA_WILD_GEAR } from './gta-wild-gear';` and add
  `...GTA_WILD_GEAR` right after `...GTA_TESSIE_GEAR`.
- `packages/achievements/src/catalog.ts`: after the `gta-tessie-secret` entry (before `// ---- Cooking Gnoma ----`),
  add a `// ---- Gnome Theft Auto: the wild world and boats (Wild World Epic 8) ----` block with exactly these seven
  (all `game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto'`):

| id | title | description | target | reward |
|---|---|---|---|---|
| `gta-herd-grapevine` | Herd It Through the Grapevine | Herd a Cloverfield herd with the Combine or the Mulch Spreader. | | `{ slot: 'hand', prefabId: 'lasso-sling', label: 'Lasso-and-Sling' }` |
| `gta-tipping-point` | Tipping Point | Tip a cow over on foot in Cloverfield Farms. | | `{ slot: 'neck', prefabId: 'cowbell', label: 'Cloverfield Cowbell' }` |
| `gta-drey-day` | Drey Day | Scatter a Drey Gang den. | | `{ slot: 'hand', prefabId: 'twig-slingshot', label: 'Twig Slingshot' }` |
| `gta-snow-joke` | Snow Joke | Smash a snowman in Frostbite Fells. | | `{ slot: 'neck', prefabId: 'icicle-scarf', label: 'Icicle Scarf' }` |
| `gta-unbearably-chill` | Unbearably Chill | Try to rattle a Frostbite Fells polar bear. | | `{ slot: 'head', prefabId: 'bear-shades', label: 'Polar Bear Shades' }` |
| `gta-bee-line` | Bee Line | Knock over a hive in Tallgrass Commons and lose the swarm. | | `{ slot: 'head', prefabId: 'beekeeper-hat', label: "Beekeeper's Hat" }` |
| `gta-captain-clay` | Captain Clay | Take the helm of every boat: the Walnut Dinghy, Gravy Boat, Clog Cruiser, Watering-Can Steamer and HOA Patrol Boat. | 5 | `{ slot: 'head', prefabId: 'captain-cap', label: "Captain's Cap", exclusive: true }` |

  `lasso-sling` and `twig-slingshot` (in `catalog/weapons.ts`, uses include `'hold'`) and `icicle-scarf` (in
  `gta-wild-life.ts`, uses `['wear-neck']`) already exist and are no achievement's reward yet: reuse them, do not edit
  those files.

## Contract
The seven achievement ids above, verbatim (another worker unlocks them from the game). Prefab ids `cowbell`,
`bear-shades`, `beekeeper-hat`, `captain-cap`.

## Done when
- `npm test -w packages/prefabs` passes.
- `npm test -w packages/achievements` passes (`sync.test.ts` is being edited by another worker; if only a test in that
  file fails, say so and move on).
- Check one hat by eye if you can: `npm run dev -w games/prefab-gallery -- --port 5479` and open the new prefabs; stop
  the server afterwards. Optional.

## Out of scope
`games/**`, `packages/achievements/src/sync.ts`, `sync.test.ts`, `store.ts`; existing prefab files other than
`catalog/index.ts`.

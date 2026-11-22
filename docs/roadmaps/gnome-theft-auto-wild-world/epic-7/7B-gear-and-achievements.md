Epic: 7 (Gnome Theft Auto Wild World: the Tessie side quest)
Depends on: none

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree). Run every command from there. Use absolute paths.
- Node: if `node`/`npm` is not found, in Git Bash `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, push or open a PR.
- Five other workers are editing other files at the same time (another prefab file `gta-tessie.ts`, and game files under `games/gnome-theft-auto`). Edit only the files this issue names.

## Goal

Four achievements for the Tessie side quest in `@lawn/achievements`, each with a cosmetic gear reward, the gear prefabs modelled in `packages/prefabs/src/catalog/gta-tessie-gear.ts` (replacing the planner's stubs), and a fix for the failing achievements test: the Wool Scarf (`wool-scarf`) is granted by two achievements (`gsg-great-wave`, which marks it RARE/`exclusive`, and `snigms-first-friend`); give Snigms' one the new `friendship-knot` instead.

## Read first

- `packages/prefabs/src/catalog/gta-tessie-gear.ts`: the stub (four ids, names, categories, uses, tags). Keep ids, names, categories, uses and tags; replace `about`, `examine`, `parts` (add `tint`/`trim` if you use `c: 'tint'`/`'trim'`).
- `packages/prefabs/src/types.ts`: the format (`PrefabDef`, `Part`, shapes and `d` per shape, `PrefabWear`).
- `packages/prefabs/src/palette.ts`: colour names.
- `packages/prefabs/src/catalog/gta-story.ts` lines 451-700: finished gear examples: `salvage-wrench-pack` (wear-back), `snail-shell-cap` (wear-head), `vip-towel-scarf` and `even-cut-medallion` (wear-neck). Copy their sizes, offsets (`at` z of back items is negative, about -0.1) and voice.
- `packages/achievements/src/catalog.ts` lines 401-520 (the Gnome Theft Auto block, ends with `gta-carpool`) and lines 800-815 (`snigms-first-friend`).
- `packages/achievements/src/achievements.test.ts`: what the catalog must satisfy (every reward's prefab exists and has the slot's use: head -> `wear-head`, back -> `wear-back`, neck -> `wear-neck`, hand -> `hold`; every gear reward belongs to one achievement only; an `exclusive` reward is granted by its achievement alone; every achievement rewards something; `emoteCatalog()` has exactly 13 entries, so add NO emotes).

## Change

### 1. `packages/prefabs/src/catalog/gta-tessie-gear.ts`

Model these four (ids fixed). Units: 1 = one gnome's height. Lowest point at y = 0 (±0.03), centred on x/z, front faces +z, largest side 0.03 to 3. `at` is a shape's centre; `rot` in degrees; cylinders stand along y. 4 to 15 parts. `examine`: 5 or 6 lines, 9-160 characters each, all different, in the voice of the examples (a close look, a saying, a tip, one dry joke, an odd detail; never say what a garden object really is; nothing gets wet, soaked or dripping, nothing bleeds).

- **`turtle-shell-pack`** (armor, `wear-back`): a small domed turtle shell worn like a backpack, about 0.24 wide, 0.3 tall, 0.12 deep, sitting at z about -0.1 like `salvage-wrench-pack`: an olive/brown dome (squashed ball) with darker scute plates, moss patches, a tiny lily pad, two leather shoulder straps. The reward for keeping Tessie's secret (RARE). Examine: a cast-off shell of Tessie's, or a cousin's; worn by the few who know.
- **`loch-tam`** (armor, `wear-head`): a flat woollen highland tam (a wide squashed cylinder or ball, about 0.32 across, 0.1 tall), a tartan-ish band (alternating thin boxes in `tint`/`trim`), a bobble on top, a small sprig of heather or moss. Set `tint` (e.g. `0x2f5a3a`) and `trim` (e.g. `0x8e2b2b`).
- **`loch-binoculars`** (trinket, `wear-neck`): two short barrels side by side (cylinders lying along z, `rot: [90, 0, 0]`) joined by a bridge, eyecups, a strap loop (a `ring` or thin boxes), hanging at the chest (z about 0.08) like `even-cut-medallion`.
- **`friendship-knot`** (trinket, `wear-neck`): a braided cord loop (thin pills or a `ring`) tied in a fat knot at the front with one glazed clay bead and a little tassel. Snigms' "Neighbourly" reward. Its examine lines are about neighbours, not Turfton.

### 2. `packages/achievements/src/catalog.ts`

- In the Gnome Theft Auto block, after `gta-carpool`, add exactly these four (same one-line style as the others):

```ts
  {
    id: 'gta-tessie-rumour', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto',
    title: 'Something in the Loch', description: 'Hear the news from Loch Moss, and find Driftwood waiting on the shore.',
    reward: { slot: 'neck', prefabId: 'loch-binoculars', label: 'Loch Binoculars' },
  },
  {
    id: 'gta-tessie-finish', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto',
    title: 'The Loch Moss Monster', description: 'Find Tessie, save her eggs from the HOA dredger and ride her across the loch.',
    reward: { slot: 'head', prefabId: 'loch-tam', label: 'Loch Moss Tam' },
  },
  {
    id: 'gta-tessie-tabloid', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto',
    title: 'Front Page', description: "Sell the photo of Tessie to the Turfton Tattler.",
    reward: { slot: 'hand', prefabId: 'field-camera', label: 'Field Camera' },
  },
  {
    id: 'gta-tessie-secret', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto',
    title: 'Keeper of the Loch', description: "Keep Tessie's secret.",
    reward: { slot: 'back', prefabId: 'turtle-shell-pack', label: 'Turtle-Shell Pack', exclusive: true },
  },
```

  (`field-camera` already exists in `packages/prefabs/src/catalog/gnomeokemon-lab.ts` with uses `['hold', 'place']` and is granted by no achievement; reuse it, do not edit it.)
- In `snigms-first-friend`, change the reward to `{ slot: 'neck', prefabId: 'friendship-knot', label: 'Friendship Knot' }`. Leave `gsg-great-wave` (the Wool Scarf, RARE) unchanged.

## Done when

- `npx tsc --noEmit -p packages/prefabs` shows no errors in `gta-tessie-gear.ts` (errors in `gta-tessie.ts` mean another worker is mid-edit; ignore those).
- `npm test -w packages/prefabs` passes every test whose name contains `turtle-shell-pack`, `loch-tam`, `loch-binoculars` or `friendship-knot`.
- `npm test -w packages/achievements` passes completely (it failed before this issue only because of the Wool Scarf).
- Read the finished gear file once, top to bottom.

## Out of scope

Every other file: `packages/prefabs/src/catalog/gta-tessie.ts` (another worker), `gnomeokemon-lab.ts`, `catalog/index.ts` (already registers your file), prefab `types.ts`/`palette.ts`, `packages/achievements/src/achievements.test.ts`, anything under `games/`.

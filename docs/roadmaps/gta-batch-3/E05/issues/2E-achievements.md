Epic: E05-2 Interiors and rooftops: engine pieces
Depends on: none

## Environment
Repo root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a89501009f27d94ba` (a git worktree; stay in it).
Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. Keep LF line endings. Do not commit.
Other workers are editing game files at the same time; you only touch the two package files below.
Repo rules: every achievement ideally has a cosmetic reward, a `@lawn/prefabs` gear item for the gnome's `head` or
`back` slot; a new prefab follows `docs/roadmaps/prefab-library/_common.md`.

## Goal
Three Gnome Theft Auto achievements for interiors and rooftops exist in the shared catalog, each with a new cosmetic
reward prefab.

## Read first
- `packages/achievements/README.md`: the `AchievementDef` shape and rules.
- `packages/achievements/src/catalog.ts`: the last GTA entries (`gta-band-highlands` ... `gta-band-estates`, around line 1150): copy their shape.
- `docs/roadmaps/prefab-library/_common.md`: prefab rules.
- `packages/prefabs/src/catalog/cosmetics-head-b.ts`: `snowcap-tuque` and `rootwell-mortarboard` (head gear, `category: 'armor'`, `uses: ['wear-head']`) as the model for head gear; find one `uses: ['wear-back']` def in `packages/prefabs/src/catalog/cosmetics-back.ts` as the model for back gear.

## Change
- `packages/achievements/src/catalog.ts`: after `gta-band-estates`, add (game `'gnome-theft-auto'`, gameTitle `'Gnome Theft Auto'`):
  - `gta-home-sweet-hovel`: title 'Home Sweet Hovel', description 'Walk through a door into a building.', reward `{ slot: 'head', prefabId: 'tea-cosy-hat', label: 'Tea-Cosy Hat' }`.
  - `gta-roof-rat`: title 'Roof Rat', description 'Land an aircraft on a rooftop.', reward `{ slot: 'head', prefabId: 'propeller-beanie', label: 'Propeller Beanie' }`.
  - `gta-rooftop-run`: title 'Rooftop Run', description 'Stand on 5 different rooftops.', `target: 5`, reward `{ slot: 'back', prefabId: 'rooftop-pigeon-pack', label: 'Rooftop Pigeon' }`.
- `packages/prefabs/src/catalog/cosmetics-head-b.ts`: add `tea-cosy-hat` (a knitted tea cosy worn as a hat: a squat
  rounded dome, a pompom on top, a little spout-hole flap at the side; tint the knit) and `propeller-beanie` (a small
  beanie with a stalk and a two-blade propeller on top; tint the cap) following the shape of `snowcap-tuque`.
- `packages/prefabs/src/catalog/cosmetics-back.ts`: add `rooftop-pigeon-pack` (a plump grey pigeon perched on a small
  strap pad, as back gear; `uses: ['wear-back']`) following that file's existing back-gear defs.
  Both catalog files are already registered; do not edit `index.ts` unless a test says the new ids are missing.

## Contract
Achievement ids `gta-home-sweet-hovel`, `gta-roof-rat`, `gta-rooftop-run` (target 5); prefab ids `tea-cosy-hat`,
`propeller-beanie` (wear-head), `rooftop-pigeon-pack` (wear-back). The game code that unlocks them is written by other workers.

## Done when
- `npm test -w packages/prefabs` passes.
- `npm test -w packages/achievements` passes.

## Out of scope
Everything under `games/`. Other catalog files.

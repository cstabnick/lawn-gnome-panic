# E08 issue A13-achievements

Epic: E08-A (economy foundation, all issues parallel)
Depends on: none

## Environment
- Repo root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-ae1f1ea613541daa4` (a git worktree: stay
  inside it, use absolute paths). The game is `games/gnome-theft-auto` (Vite + TypeScript + three.js); below, `src/`
  means `games/gnome-theft-auto/src/`. Git Bash: if `node` is missing, `export PATH="/c/Program Files/nodejs:$PATH"`.
  Dependencies are installed: do not run `npm install`.
- About 15 other workers edit OTHER files of this game at the same time. Change only the files under "Change".
  Do not run `npm run build` (vite writes `dist/`); type-check with
  `npx tsc --noEmit -p games/gnome-theft-auto` from the repo root. Errors in files you do not own may show up
  mid-epic: ignore them, but your files must have none. Run only the test files named in "Done when"
  (`npx vitest run <file>` from `games/gnome-theft-auto`). Do not commit. Do not start a dev server.
- Repo rules that apply: mobile by default (every button at least 44 px, no hover-only UI, fits a 390x844 portrait
  phone, `env(safe-area-inset-*)` padding); a UI module appends its own container to the shared `#ui` element it is
  given and never restyles or hides `#ui`; item and vehicle icons come from `@lawn/prefabs`
  (`prefabIconElement(id, emojiFallback, px)` returns an element); plain, short English in UI text; no emoji
  variation selectors needed.

## Goal
Seven new Gnome Theft Auto achievements for the economy features, each with a cosmetic gear reward.

## Read first
- `packages/achievements/src/types.ts`: `AchievementDef`, `AchievementReward` (`slot: 'head'|'back'|'neck'|'hand'`,
  `prefabId`, `label`).
- `packages/achievements/src/catalog.ts` around the `gta-lockup-full` / `gta-special-delivery` entries: the format.
- `packages/achievements/README.md`: the rules (reward prefabs must exist and fit their slot).
- `packages/prefabs/src/catalog/gta-lockup.ts`: two finished GTA reward gear prefabs (one `wear-neck`, one
  `wear-head`), and `docs/roadmaps/prefab-library/_common.md` for modelling rules (ignore its Environment section).
- `packages/prefabs/src/catalog/gta-economy-gear.ts`: the empty `GTA_ECONOMY_GEAR` array (already in the index).

## Change
- `packages/achievements/src/catalog.ts`: add after the `gta-boathouse-full` entry, `game: 'gnome-theft-auto'`,
  `gameTitle: 'Gnome Theft Auto'`:
  - `gta-new-wheels` "New Wheels": "Buy a vehicle at a dealership." reward hand `dealer-keyring` "Dealer Keyring".
  - `gta-fleet-of-three` "Fleet of Three": "Own three vehicles of the same model in your garages." reward back
    `numbered-plate-rack` "Numbered Plate Rack".
  - `gta-showroom-regular` "Showroom Regular": "Buy a vehicle at Burl's Forecourt, Driftwood's Boat Yard and Wally's
    Wing Lot." reward head `salesman-boater` "Salesman's Boater".
  - `gta-claim-approved` "Claim Approved": "Have Kiln-Shield actually pay out: reclaim a written-off vehicle." reward
    neck `kiln-shield-badge` "Kiln-Shield Badge".
  - `gta-first-snack` "Snack Break": "Eat a snack from your bag." reward back `crumbs-satchel` "Crumbs & Co. Satchel".
  - `gta-good-as-new` "Good as New": "Repair a vehicle at the Pay 'n' Glaze Repair tab." reward hand
    `glaze-repair-mallet` "Repair Mallet".
  - `gta-signed-on-the-line` "Signed on the Line": "Buy a property on a loan." reward neck `deed-scroll-cord`
    "Deed Scroll Cord".
  Before making a new prefab, search for an existing one that fits the slot (e.g. `grep -rn "wear-head" packages/prefabs/src/catalog`)
  and reuse it if it fits the idea; otherwise make it.
- `packages/prefabs/src/catalog/gta-economy-gear.ts`: add every reward prefab you did not reuse, with the right
  `uses` (`'wear-head'`, `'wear-back'`, `'wear-neck'`, or `'hold'` + `grip` for hand) exactly like the
  `gta-lockup.ts` gear, category, tags (incl. `reward`, `gta`), about, 5 examine lines.

## Done when
- `npm test -w packages/achievements` and `npm test -w packages/prefabs` pass (from the repo root).

## Out of scope
`packages/prefabs/src/catalog/gta-economy.ts` (another worker), every game file.

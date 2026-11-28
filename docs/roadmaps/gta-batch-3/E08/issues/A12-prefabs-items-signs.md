# E08 issue A12-prefabs-items-signs

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
Five new prefabs in `packages/prefabs/src/catalog/gta-economy.ts` (already registered in the catalog index, empty
now): two fun bag items and the three dealership signs.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: modelling, data and examine-voice rules (ignore its "Environment" section:
  use this issue's). The examine voice for Gnome Theft Auto things is the town of Turfton (see the existing
  `packages/prefabs/src/catalog/gta-lockup.ts` lines for the tone: plain, dry, a "Saying:" and a "Tip:" line).
- `packages/prefabs/src/types.ts`: the `PrefabDef` contract. `packages/prefabs/src/palette.ts`: colour names.
- `packages/prefabs/src/catalog/gta-economy.ts` (empty array `GTA_ECONOMY`) and
  `packages/prefabs/src/catalog/gta-hangar-boathouse.ts` (a finished outdoor GTA prop for scale and style).

## Change
- `packages/prefabs/src/catalog/gta-economy.ts`: add to `GTA_ECONOMY`:
  - `party-popper` "Party Popper": category `'trinket'`, uses `['hold']` (needs `grip`), ~0.22 tall: a striped cone
    (tint) with a string loop, a few confetti bits on top. Tags: party, popper, confetti, fun, gta. Emoji `['🎉']`.
  - `whoopee-cushion` "Whoopee Cushion": category `'trinket'`, uses `['hold', 'place']` (grip), a flat squashed pink
    ball ~0.3 wide with a short neck. Tags: whoopee, cushion, prank, fun, gta. Emoji `[]`.
  - `dealer-sign-forecourt` "Burl's Forecourt Sign": category `'prop'`, uses `['place']`. About 3 gnome-heights tall:
    two posts and a board, red `tint` board with a white price-tag shape and bunting triangles along the top.
  - `dealer-sign-boatyard` "Driftwood's Boat Yard Sign": same size; a driftwood plank board on two rough posts, a
    small anchor and a ring buoy hung on it.
  - `dealer-sign-winglot` "Wally's Wing Lot Sign": same size; a board on a pole with a windsock on top and a small
    propeller shape on the board.
  Each: `about` line, 5 examine lines, tags (lower-case words incl. `sign`, `dealer`, `gta`), lowest point at y = 0,
  centred, front +z, at most 40 parts.

## Done when
- `npm test -w packages/prefabs` passes (from the repo root).

## Out of scope
Every other prefab file (another worker adds reward gear to `gta-economy-gear.ts`), the catalog index (done).

# E08 issue A11-dealer-map-icons

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
The three dealership map kinds (`'dealer-car'`, `'dealer-boat'`, `'dealer-air'`, already in `PlaceKind` and
`PLACE_STYLE`) get their own white glyphs on the minimap and big map.

## Read first
- `src/mapIcons.ts`: `PlaceKind`, `PLACE_STYLE`, `drawPlaceIcon` and its `switch (kind)` with helper calls
  (`glyphRect`, `glyphPoly`, arcs) for every other kind (see `'hangar'`, `'boathouse'`, `'lockup'`).
- `src/mapIcons.test.ts`.

## Change
- `src/mapIcons.ts`: add three cases to the glyph switch in `drawPlaceIcon`, in the same style (white fill, glyph in a
  -1..1 box scaled by `s`):
  - `'dealer-car'`: a price tag: a pentagon tag shape (`glyphPoly`) with a small hole (a circle filled with `color`).
  - `'dealer-boat'`: a sailboat: a triangle sail (`glyphPoly`) over a hull trapezoid (`glyphPoly`).
  - `'dealer-air'`: a plane from above: a fuselage bar (`glyphRect`) crossed by a wing bar and a small tail bar.
- `src/mapIcons.test.ts`: only if a test enumerates kinds in a way that now fails; otherwise leave it.

## Done when
- `npx vitest run src/mapIcons.test.ts` passes (from `games/gnome-theft-auto`).
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in `src/mapIcons.ts`.

## Out of scope
`src/types.ts`, `src/mapPois.ts`, `src/dealers/*` (the dealers emit the blips themselves).

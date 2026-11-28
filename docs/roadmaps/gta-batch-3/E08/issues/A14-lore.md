# E08 issue A14-lore

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
Lore entries for the new places, people and services of the GTA economy, so names and dialogue have canon behind them.

## Read first
- `docs/lore/README.md` (entry format and front matter) and `docs/lore/canon.md`.
- `docs/lore/entries/apocrypha/wind-sock-wally.md`, `docs/lore/entries/apocrypha/driftwood-castaway.md`,
  `docs/lore/entries/apocrypha/hangar-two.md` (existing GTA entries to match).
- Run `npm run lore -- find kiln-shield` and `npm run lore -- find burl` from the repo root before writing.

## Change
New files in `docs/lore/entries/apocrypha/` (same front-matter fields and status as the files above):
- `burls-forecourt.md`: Burl's Forecourt, a used-mower lot beside Side-Valve Salvage in Turfton; sells ground
  vehicles; bunting, a red price-tag sign; the Sling-Lift delivers sales.
- `honest-burl.md`: Honest Burl, who runs it: a gnome salesman whose nickname is a joke nobody explains; dry, always
  closing a sale; does not trade in Tansy's territory (tuning).
- `driftwoods-boat-yard.md`: Driftwood's Boat Yard on the Loch Moss shore, near the dock Driftwood keeps; sells
  dinghies to steamers.
- `wallys-wing-lot.md`: Wally's Wing Lot beside the charter desk at the Desert Airfield; Wind-Sock Wally sells
  aircraft as well as hangar space.
- `kiln-shield-vehicle-cover.md`: Kiln-Shield, Turfton's insurer famous for denying hospital claims, also sells
  vehicle cover that (to everyone's surprise) pays out for a 25 % deductible, once per vehicle per ten minutes; fee
  10 % of value.
- `crumbs-and-co.md`: Crumbs & Co., a snack delivery service that drops snacks and party tat straight into a gnome's
  bag for a price; nobody has seen the courier.
Add a ruling to `docs/lore/rulings.md` (follow its format): "Property in Turfton is bought on a loan booked beside
Clay-Mart's Kiln-Debt, never added to it."
Link the existing Wally and Driftwood entries from the new ones (their link style), and add a one-line mention in the
existing `wind-sock-wally.md` and `driftwood-castaway.md` ("also sells ...").

## Done when
- `npm run lore` passes (from the repo root).

## Out of scope
All code; any lore file not named here.

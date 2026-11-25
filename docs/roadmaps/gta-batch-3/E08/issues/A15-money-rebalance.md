# E08 issue A15-money-rebalance

Epic: E08-A (economy foundation, parallel with the other issues)
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
L32: "rebalance money a little. equipment should be a bit more expensive. make sure we have some grind but don't have
to endlessly grind." Raise equipment prices about x1.5 to x2, raise job and side-gig pay about x1.2, keep story
(quest) rewards, and pin the grind curve in a new test `src/economyCurve.test.ts`.

## Read first (judgment issue: read what you need)
Prices (confirmed): `src/gunMods.ts` (`price`), `src/gunShop.ts` (order fee), `src/fishing/tackle.ts` (`RODS`,
`BAITS`), `src/hunting/species.ts` (`LODGE` prices; sell values are income), `src/craft/tuning.ts` (`tuneCost`),
`src/craft/craftPanels.ts` (`CRAFT_PAINT_PRICE`), `src/glazeShop.ts` (`QUICK_RESPRAY_PRICE`), `src/garages.ts`
(`RESPRAY_COST`, keep it equal to `QUICK_RESPRAY_PRICE`), `src/jobs/defs.ts` (`licence` fees and gig pay) and
`src/jobs/career.ts`, `src/config.ts` (`PAY_N_GLAZE`, `SIDE_VALVE` costs if any), `src/outskirts/shopItems.ts`,
`src/interactables.ts` (`COLA_COST`, `FIZZ_COST`, `CAKE_COST`), `src/vending.ts`, `src/lockup/config.ts`
(`ESTATES.hangar.price`, `ESTATES.boathouse.price`, delivery fees), `src/dealers/config.ts` (vehicle prices).
Glaze part prices live in `packages/glaze` (`loadoutCost`): you may raise them there if it is one table; run its
tests then (`npm test -w packages/glaze`). Income: `src/jobs/*`, `src/economy.ts` (`FRAUD_PAYOUT_PER_SPEED`,
`HOSPITAL_FEE`), hunting/fishing sell values, `src/stunts.ts` rewards.

## Change
- Raise equipment and service prices x1.5..x2 (round to tidy numbers: 5s and 10s). Leave `STARTING_ACORNS`,
  `STARTING_DEBT` and quest rewards alone. Keep the hospital fee modest (it punishes failure; at most x1.5).
- Raise job/gig pay x1.2 (taxi, courier, pilot, boat pay tables in `src/jobs/`).
- Dealer prices in `src/dealers/config.ts`: keep the order; make sure the cheapest car is affordable after about
  5 minutes of job play and the dearest aircraft needs roughly 1.5 to 3 hours of job play.
- `src/economyCurve.test.ts` (new): compute a representative "Acorns per minute of job play" from the pay tables you
  changed (state your formula in a comment: e.g. average gig pay at level 1 and level 4 divided by an assumed gig
  length in minutes, written as constants in the test), then assert minutes-to-afford bands: the cheapest dealer
  vehicle <= 10 min at level 1; a mid gun mod (median `price` in gunMods) between 5 and 30 min; Hangar Two between
  20 and 90 min; the dearest dealer vehicle between 60 and 240 min at level 4; and that every equipment table you
  changed is at least 1.4x what it was (hard-code the old median as a constant with a comment).
- Fix any existing test that asserted an exact old price (search the `*.test.ts` files for the numbers you changed),
  including `src/questSim/` suites if Acorn-dependent: keep the quest flow intact (a quest that buys something must
  still be affordable with the rewards before it).
- Do NOT edit `src/inventory.ts` or `src/glazePanelRepair.ts` (other workers own them).

## Done when
- From `games/gnome-theft-auto`: `npx vitest run src/economyCurve.test.ts src/economy.test.ts` and the test files of
  every module you changed pass, and finally the whole `npx vitest run` shows no failure caused by your changes
  (other workers' files may still be stubs: report anything else you see instead of fixing it).
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in files you changed.
- Report a before/after table of the main prices and pay rates.

## Out of scope
`src/inventory.ts`, `src/glazePanelRepair.ts`, `src/ownership.ts`, UI files.

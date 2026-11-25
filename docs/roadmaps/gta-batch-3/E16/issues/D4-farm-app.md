Epic: E16-D (countryside, last wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
A Farm app on the Gnomlet tablet shows Windfall Croft at a glance: for sale (and how to buy), or the eight beds with
what grows, its state and time left, the oak, the crate, and a seed picker; a badge counts beds that need the player.

## Read first
- `docs/roadmaps/gta-batch-3/E07/contracts.md`, section "Gnomlet apps" (`registerGnomletApp({ id, label, icon, group,
  order?, detail?, badge?, available?, open: (root, ctx) => cleanup })`, groups, tablet focus and `pointerdown` rules).
- `games/gnome-theft-auto/src/golf/golfApp.ts` or `games/gnome-theft-auto/src/winter/winterApp.ts`: finished in-tablet
  apps of the same kind (markup, styles, cleanup).
- `games/gnome-theft-auto/src/farm/runtime.ts` (`FarmRuntime`: `state()`, `owned()`, `selectSeed(crop)`),
  `games/gnome-theft-auto/src/farm/state.ts` (`bedStatus`, `bedSecondsLeft`, `oakSecondsLeft`, `oakReady`),
  `games/gnome-theft-auto/src/farm/types.ts` (`CROPS`, `cropDef`, `BED_CROPS`, `FARM`).
- `games/gnome-theft-auto/src/farm/farmApp.ts`: the stub you replace (keep `registerFarmApp(farm)`).

## Change
`src/farm/farmApp.ts`:
- `registerFarmApp(farm)`: `registerGnomletApp({ id: 'farm', label: 'Farm', icon: '🌱', group: 'money', detail: () =>
  farm.owned() ? '<n> growing, <m> ripe' : 'Croft for sale', badge: () => (count of 'dry' + 'ripe' beds, + 1 if the oak
  is ready) || null, open: (root) => {...} })`.
- The screen (built with DOM into `root`, plain styles in the file's own `<style>` or inline, readable at 390 px wide,
  buttons >= 44 px tall, `pointerdown` handlers, refreshed every 1 s while open via `setInterval`, cleaned up on close):
  - Not owned: the croft's `FARM.blurb`, the price line "2,200 Acorns: 300 down, the rest a First Kiln Bank loan at
    10%", and "Buy it at the For Sale board by the croft gate in Cloverfield, or in the Ledger app."
  - Owned: a grid of 8 bed cards (2 columns): crop name or "Empty", status ("Needs water", "Growing m:ss", "Ripe!",
    "Empty: plant <seed>"), coloured by status; an oak card ("Not planted", "Growing m:ss", "Acorns in m:ss",
    "Ready to shake!"); a crate line ("Crate: 3 radishes, 1 pumpkin" or "Crate: empty"); a seed picker: four buttons
    (`BED_CROPS`), each "<Name> · <seedCost> · <growS as minutes> min · sells <sell> × <yield>", the selected one
    highlighted, `farm.selectSeed(id)` on press; a footnote "Plant, water and harvest at the croft. Sell at the stall by
    the gate."
- No farming actions from the tablet (the croft is worked in person).

## Contract
`registerFarmApp(farm: FarmRuntime): void` unchanged; app id 'farm'.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` shows no errors in your file.
- `npx vitest run src/gnomlet src/farm` passes.

## Out of scope
`src/farm/runtime.ts`, `src/farm/state.ts`, `src/farm/types.ts`, `src/gnomlet/*`, every other file.

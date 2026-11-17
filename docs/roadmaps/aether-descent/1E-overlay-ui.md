Epic: 1 Descent
Depends on: none

## Environment
Working directory: `C:\Users\cstab\Documents\gaming` (Windows, Git Bash). If `node` is not found:
`export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed. Do not run `git commit`.
Other workers are editing other files in `games/aether-board` at the same time (world.ts, physics.ts, view/*,
descent/run.ts, descent/perks.ts, app.ts). Touch only the file listed under Change.
Repo rule: UI modules get the shared `#ui` element as a parent: append your own container to it, never restyle or
hide `#ui` itself. `#ui` has `pointer-events:none`; give your interactive screens `pointer-events:auto`.

## Goal
The Descent overlay exists as DOM: the hill picker (cards with three slider bars), the reward / perk pick after a
hill, the end screens, the lives HUD while riding, the crash flash, and a mode-switch pill on the title card.

## Read first
- `games/aether-board/src/descent/ui.ts`: the stub. Keep every exported name and signature exactly.
- `games/aether-board/src/descent/types.ts`: `RunState`, `HillCard`, `HillReward`, `HillResult`, `CrashResult`,
  `PerkId`, `DESCENT`.
- `games/aether-board/src/descent/perks.ts`: `PERKS[id].name / desc / max` (another worker is filling in `desc`
  right now; just read the fields).
- `games/aether-board/src/hud.ts` lines 1-130 and `buildCss()`: the look to match (Jet Set Radio style: "Arial
  Black" italic uppercase skewed text, `PALETTE` candy colours, ink `#17072e` outlines and hard drop shadows like
  `box-shadow:4px 4px 0 <pink>`). Do not edit hud.ts.

## Layout already on screen (do not overlap while riding)
Free-ride HUD: score top-left (16px), volume button top-right, flow meter bottom-left, speed bottom-right, trick
stick bottom-centre, combo text at 30% height centre. The title / pause card is centred. A cheat badge may sit at
top:14px centre on the title.

## Change
- `games/aether-board/src/descent/ui.ts`: implement `createDescentUi` and `createModeSwitch`.

### createDescentUi(ui)
- Inject one `<style id="dsc-style">` (once) and append one root `<div id="dsc">` to `ui`. All classes prefixed `dsc-`.
- **Screens** (picker, reward, end) share one full-screen layer: `position:fixed; inset:0; z-index:20;
  pointer-events:auto; background:rgba(23,7,46,.88); display:flex; flex-direction:column; align-items:center;
  justify-content:center; gap:16px; padding:16px; overflow-y:auto`. Only one screen at a time; `hideScreens()`
  hides the layer. Each show* replaces the layer's content.
- **showPicker(run, cards, onPick)**: heading `HILL {run.hill + 1} / {DESCENT.hills}` (plus a `BOSS HILL` tag when
  `cards[0].boss`), a stats line (lives as ❤ filled for `run.lives` and ♡ up to `run.maxLives`, `🛡 x{shields}` when
  > 0, `SCORE {run.score}` with thousands separators via `toLocaleString()`), then a row of cards (flex, wrap; on
  narrow screens they stack). Each card is a `<button class="dsc-card">` showing: name; three slider rows HAZARD /
  STEEP / TRICKY each with 5 pips, `value` filled (hazard red `#ff2d4b`, steep orange `#ff9f1c`, tricky cyan
  `#2de2e6`); `x{mult} SCORE`; reward chips from `rewards` (`PERK ({amount} choices)`, `+{amount} ❤ 1-UP`,
  `+{amount} 🛡 SHIELD`, or `SCORE ONLY` when empty); a bonus line `BONUS {bonusTarget} PTS → {chip of bonusReward}`;
  a key hint `[1]`, `[2]`, `[3]`. Click / tap a card, or press 1..N, calls `onPick(card)` once and ignores further
  input. Remove the keydown listener when the screen is replaced or hidden.
- **showReward(run, result, onDone)**: heading `HILL CLEARED`; lines `TRICKS {hillScore}`, `x{mult}` (take it from
  `result.banked / result.hillScore` only if hillScore > 0, else omit), `BANKED +{banked}`; the bonus line
  `BONUS HIT!` (lime) or `bonus missed` (dim); chips for `result.granted`. If `result.perkChoices` is not empty:
  `PICK A PERK` and one `<button class="dsc-perk">` per perk: name, desc, `LV {owned} → {owned + 1}` (owned =
  `run.perks[id] ?? 0`), key hint `[1]..[4]`; click or key calls `onDone(id)` once. Otherwise a `CONTINUE` button
  (also Enter / Space) calls `onDone(null)` once.
- **showEnd(run, won, best, onRestart)**: heading `DESCENT CLEARED!` (won) or `WIPEOUT` (lost); `HILLS {run.hill}`,
  `SCORE {run.score}`, `BEST {best}` (and `NEW BEST!` when run.score >= best and score > 0); a `NEW RUN` button
  (also Enter) calls `onRestart()` once.
- **updateHud(run, hillScore, riding)**: a small panel fixed at `top:16px; left:50%; transform:translateX(-50%)`,
  `pointer-events:none`, z-index 5, shown only when `riding` is true and `run.current` is set: lives hearts and
  shields as above; `HILL {run.hill + 1}/{DESCENT.hills} · {run.current.name}`; a thin bar of
  `hillScore / run.current.bonusTarget` (capped at 1, turns lime when reached) with `BONUS {hillScore}/{target}`.
  Called every frame: only write DOM when a value changed (cache the last strings).
- **flashCrash(r)**: big centred text that pops and fades over 1.2 s (CSS animation, restart it by removing and
  re-adding the class after a forced reflow `void el.offsetWidth`): `SHIELD!` in cyan when `r.shielded`, `WIPEOUT`
  in red when `r.over`, else `-1 ❤  ({r.livesLeft} LEFT)` in red. `pointer-events:none`, z-index 15.

### createModeSwitch(ui, descent)
An `<a class="dsc-mode">` appended to `ui` (it can live in the same style block), fixed at `top:56px; left:50%;
transform:translateX(-50%)`, `pointer-events:auto`, z-index 6, skewed pill button. Text `DESCENT MODE →` when
`descent` is false, `← FREE RIDE` when true. href: `new URL(location.href)` with `searchParams.set('mode','descent')`
or `searchParams.delete('mode')` (keep other params such as `seed`). `update(show)` toggles visibility (only touch
the DOM when it changes). Clicks on it must not bubble to the canvas (it is a separate element, so they do not).

## Contract
Exported `DescentUi`, `createDescentUi(ui: HTMLElement): DescentUi`, `ModeSwitch`,
`createModeSwitch(ui: HTMLElement, descent: boolean): ModeSwitch` exactly as in the stub. The app calls them like
this (already written, do not edit app.ts):
```ts
const dui = createDescentUi(ui);
dui.showPicker(run, offerHills(run), (card) => { /* load the hill */ });
dui.showReward(run, finishHill(run, score), (perk) => { choosePerk(run, perk); /* ... */ });
dui.showEnd(run, run.phase === 'won', best, () => { /* new run */ });
dui.hideScreens();
dui.updateHud(run, hillScore, riding);   // every frame
dui.flashCrash(crash(run));
```

## Done when
- `cd games/aether-board && npx tsc --noEmit -p .` passes (errors in files you did not touch are another worker's
  mid-edit; rerun once, then report them rather than fixing them).
- Every number shown is an integer or rounded (`Math.round`, `toLocaleString()`); nothing is `NaN` with an empty
  `perkChoices` or `hillScore` 0.
- No element is created per frame in `updateHud`.

## Out of scope
hud.ts, app.ts, descent/types.ts, descent/run.ts, descent/perks.ts, and everything outside `src/descent/ui.ts`.

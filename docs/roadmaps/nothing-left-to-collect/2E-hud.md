Epic: 2 Systems
Depends on: none (Epic 1 is done: the game builds with stubs)

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\stingaree` (a git worktree). Node: if not found, `export PATH="/c/Program Files/nodejs:$PATH"` in Git Bash.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`.
- Eleven other workers are filling other files in `games/nothing-left-to-collect/src/` right now. Edit only `src/hud.ts`. `tsc` may show errors in their files mid-edit; only yours must be clean.
- Repo rules: append your own container to the shared `#ui` element (passed in as `ui`); never restyle or hide `#ui` (it has `pointer-events: none`: give interactive elements `pointer-events: auto`). Mobile by default: tap targets at least 44 px, safe-area insets (`env(safe-area-inset-*)`), works at 390x844 portrait and 844x390 landscape. No hover-only UI.

## Goal

Replace the stub `src/hud.ts` with the game's whole DOM overlay: collectible counters, a goal line, the dialogue box
(typed text, speaker name), choice buttons, toasts (fake in-game achievements), chapter title cards, a fade cover,
end credits, Chapter 1's "Skip Tutorial" button, a mute button, and an "overflow" effect for Chapter 4.

## Read first

- `games/nothing-left-to-collect/src/hud.ts` (stub) and `src/types.ts` (`Hud`, `CounterRow`, `Speaker`).
- `games/nothing-left-to-collect/src/config.ts`: `SPEAKERS[who].color` (name colour per speaker).

## Change

`createHud(ui: HTMLElement): Hud`. Root `div#fc-hud` (`position: fixed; inset: 0; pointer-events: none; font-family: system-ui, sans-serif`), one injected `<style id="fc-hud-style">`. Look: a tidy, slightly too-cheerful corporate style: cream panels (`#fffaf0`), 2 px `#2b2b33` borders, 10 px radius, a soft drop shadow, bold rounded headings. z-index inside the root: counters 5, toasts 25, dialogue + choices 30, fade 40, title card and credits 45, mute 50.

- **Counters** `div#fc-counters`, top-left (`top: calc(10px + env(safe-area-inset-top)); left: calc(10px + env(safe-area-inset-left))`), a column of rows: icon (24 px `<img>` when `icon` starts with `data:`, otherwise the emoji in a span), label, value (tabular numbers, bold). `setCounters(rows)` updates in place keyed by `kind` (create, update, remove rows; do not rebuild every call; it is called 10 times a second). When a row's value changes, give it a quick 150 ms "pop" scale. On screens narrower than 500 px, use 13 px text and hide labels longer than 14 characters behind an ellipsis. `setCountersVisible(on)` shows/hides the column.
- **Goal** `div#fc-goal`, top-centre, one line; `setGoal(null)` hides it.
- **Skip button**: `setSkipButton(label, onClick)` shows a 44 px-high button under the counters with that label; calling it again with a new label just relabels it (keep the same click handler unless a new one is given); `null` hides it.
- **Mute** button top-right (44x44, 🔊 / 🔇), remembers its state in `localStorage['nothing-left-to-collect.muted']` (try/catch), calls every `onMute(fn)` listener on change, and calls a newly registered listener once with the current state.
- **Dialogue** `div#fc-dialog`, bottom-centre, `max-width: 640px; width: calc(100% - 24px)`, above the safe-area bottom inset and high enough (`bottom: calc(120px + env(safe-area-inset-bottom))` on touch screens `(pointer: coarse)`, `24px` otherwise) to clear the Jump/Interact buttons. `say(who, name, text, auto?)`: show the name in `SPEAKERS[who].color`, type the text at 40 characters/second; a tap/click on the dialogue box (or anywhere on a full-screen transparent catcher shown only while a line is up, `pointer-events: auto`), Enter or Space while typing completes the text at once; once complete, a ▼ blinks and the next tap/Enter/Space resolves. If `auto` is given, it also resolves `auto` seconds after the text completed (no tap needed). Lines queue: a `say` while another is showing waits its turn. Hide the box when nothing is queued.
- **Choices** `div#fc-choices`: `choose(prompt, options)` shows the prompt (if any) and one full-width button per option (min-height 48 px, stacked vertically, max-width 480 px), keyboard 1-9 also pick. Resolves with the index and hides. Works while a dialogue line is showing (it sits just above the dialogue box).
- **Toasts** top-right under the mute button: `toast(title, body?)`: a card with a small 🏆 icon, bold title, optional body line; slides in, stays 2.6 s, slides out. Keep at most 4 visible (drop the oldest). Toasts must not cover the counters.
- **Title card** `titleCard(kicker, title, sub?)`: full-screen centred text over a 70% dark backdrop: small-caps kicker ("Chapter 1"), big title, small sub. Fades in 0.4 s, holds 2 s, fades out 0.4 s, then resolves. Empty kicker → just the title.
- **Fade** `fade(to, seconds, color = '#000')`: a full-screen cover div whose opacity animates to `to` (0..1) over `seconds` (CSS transition), resolving when done. At opacity 0 it has `pointer-events: none`.
- **Credits** `credits(lines)`: lines scroll up slowly over a 60% dark backdrop (about 1.6 s per line, minimum 12 s); empty strings are spacer lines; the first line is big. A "Skip" button (44 px) resolves early. Resolves at the end, then fades away.
- **Overflow** `setOverflow(level)` (0..1), for the top floor where the collecting breaks the HUD: at `level > 0` the counters column gradually grows: font size × (1 + level), it slowly rotates up to 4°, its rows repeat (render each row 1 + floor(level * 6) times), and beyond 0.6 it slides down and off the bottom of the screen (translateY up to 120vh); the goal line jitters. `setOverflow(0)` restores everything exactly.
- Every element respects `env(safe-area-inset-*)`.

## Contract

```ts
export function createHud(ui: HTMLElement): Hud;
```
(`Hud` in `types.ts`: `root`, `setCounters`, `setGoal`, `toast`, `titleCard`, `say`, `choose`, `setOverflow`, `fade`,
`credits`, `setSkipButton`, `onMute`, `setCountersVisible`.) DOM ids the smoke test checks: `fc-hud`, `fc-counters`,
`fc-dialog` (create all three in `createHud`, even while empty/hidden). Do not use the id `fc-touch` (input owns it).

## Done when

- `npx tsc --noEmit -p games/nothing-left-to-collect` shows no errors in `src/hud.ts`.
- Re-read the CSS once against 390x844 portrait and 844x390 landscape: dialogue, choices and toasts fit, nothing is under the notch insets, every button is at least 44 px.

## Out of scope

Every other file under `games/nothing-left-to-collect/`, all packages.

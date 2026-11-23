Epic: 1 Save Trainer
Depends on: none

## Environment
Read and follow `docs/roadmaps/gta-save-trainer/_env.md` first (paths, rules, the trainer foundation files).

## Goal
`games/gnome-theft-auto/src/trainer/panel.ts` becomes the Save Trainer pop-out: a panel with a tab bar built from the section registry, a scrolling body that builds the chosen tab, a "trained save" badge, touch and gamepad control. Today it is a stub with the final exports.

## Read first
- `games/gnome-theft-auto/src/trainer/panel.ts` (the stub: keep every export and signature)
- `games/gnome-theft-auto/src/trainer/ui.ts` (`TRAINER_CSS` and helpers), `registry.ts`, `types.ts`, `mark.ts` (`readTrainerMark`)
- `games/gnome-theft-auto/src/options.ts` lines ~250-330: its gamepad loop (`firstPad()` from `@lawn/gamepad`, edge detection with `padPrev`, `document.body.dataset.options`), copy the pattern, not the code.
- `games/gnome-theft-auto/src/keys.ts`: `KEYS.close` ('Escape').

## Change
- `games/gnome-theft-auto/src/trainer/panel.ts` only. Implement:
  - Module state: `root: HTMLDivElement | null`, `ctxRef`, `currentTab: string | null`, `open = false`.
  - `openTrainerPanel(ctx, tab?)`: on the first call build the DOM once: a `<style>` with `TRAINER_CSS` appended to `document.head`; `div#gta-trainer` appended to `ctx.ui`; inside it a header row (title "Save Trainer"; a badge span, yellow pill, text "Trained save", shown only when `readTrainerMark()` is not null; a close button "✕", 44x44, `aria-label="Close trainer"`), a tab bar (one row, `overflow-x:auto`, buttons using `button()` from ui.ts), and a body div (`flex:1; overflow-y:auto; padding:0 10px 10px; touch-action:pan-y; overscroll-behavior:contain`). Inline styles for the header/tabbar/body are fine.
    Every open: rebuild the tab bar from `listTrainerSections()` (late registrations appear), repaint the badge, pick the tab: `tab` if given and registered, else `currentTab`, else the value saved in `localStorage['gta-trainer-tab']` (wrap localStorage in try/catch), else the first section. Show it (see `showTab`). Add class `open` to the root, set `document.body.dataset.options = 'open'` (input.ts then leaves the gamepad to menus), and `if (document.pointerLockElement) document.exitPointerLock()`. Start the gamepad loop.
  - `showTab(id)` (internal): mark the tab button `on`, `body.replaceChildren()`, create a `div`, append it, call `section.build(div, ctx)` inside try/catch (on error append `note('This tab failed: ' + message)` and `console.error`). Save the id to `currentTab` and localStorage. Scroll the body to the top. Repaint the badge.
  - `refreshTrainerTab()`: if open, `showTab(currentTab)` but keep the body's scrollTop.
  - `closeTrainerPanel()`: remove class `open`, `document.body.dataset.options = ''`, stop the gamepad loop. No-op when closed.
  - `isTrainerOpen()`, `toggleTrainer(ctx, tab?)` (keep the stub's logic: toggle; but when open and a different `tab` is given, switch to it instead of closing).
  - Root listeners (added once): `pointerdown` and `wheel` -> `e.stopPropagation()`; `touchmove` -> `e.stopPropagation()` with `{ passive: true }`. Window `keydown`: when open and `e.code === KEYS.close` -> close.
  - Gamepad loop (`requestAnimationFrame` only while open): `const p = firstPad()`. Snapshot the pressed buttons at open so a held button does not count. Edges (pressed now, not before): D-pad up (12) / stick Y < -0.6: focus previous; D-pad down (13) / stick Y > 0.6: focus next; D-pad left (14) or LB (4): previous tab; D-pad right (15) or RB (5): next tab; A (0): activate; B (1) or Start (9): close. Focusables = `[...root.querySelectorAll('button, select, input, textarea')]` that are visible (`el.offsetParent !== null`). Focus with `el.focus()` and `el.scrollIntoView({ block: 'nearest' })`. Activate: a `select` advances `selectedIndex` by one (wrapping) and dispatches `new Event('change', { bubbles: true })`; anything else `.click()`. After a tab switch focus the first focusable in the body.
  - Layout: `TRAINER_CSS` already sizes the panel for phones (full height minus safe areas, max 460 px wide, right side). Add nothing that makes it wider than the viewport.

## Contract (keep exactly)
```ts
export function openTrainerPanel(ctx: TrainerCtx, tab?: string): void;
export function closeTrainerPanel(): void;
export function isTrainerOpen(): boolean;
export function refreshTrainerTab(): void;
export function toggleTrainer(ctx: TrainerCtx, tab?: string): void;
```
Sections are `TrainerSection { id, label, order, build(container, ctx) }` from `listTrainerSections()` (already sorted).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in `src/trainer/panel.ts`.
- `cd games/gnome-theft-auto && npx vitest run src/trainer` passes.
- Reading the code: nothing runs per frame while the panel is closed; DOM is built on the first open only.

## Out of scope
Every other file, including `src/trainer/sections/*`, `install.ts`, `ui.ts` (if you need a style, put it inline in panel.ts).

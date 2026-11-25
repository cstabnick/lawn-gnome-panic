Epic: E25-2 (jobs III, parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E25/_env.md` first. DOM UI issue, no dev server.

## Goal
`workplaces/shiftHud.ts`: the driving-shift HUD the bin round and the fire brigade share: a top-centre panel (icon,
title, up to three lines, a meter bar) and one 44 px action button, also pressed by the I key and the gamepad's
right-stick click.

## Read first
- `games/gnome-theft-auto/src/workplaces/shiftHud.ts`: the stub (`ShiftHudView`, `ShiftHud`, `createShiftHud`).
- `games/gnome-theft-auto/src/jobs/hud.ts`: the vehicle jobs' HUD widget: copy its approach closely (CSS injected
  once by id, `body.gta-in-scene` hides it, text written only on change, the action button with its key glyph via
  `glyphText('jobAction')` and `currentGlyphSet()` / `onInputSourceChange` from '../ui/...', the I key handler with
  `KEYS.jobAction` and `isTyping`, the pad R3 edge read with `firstPad()` and `JOB_PAD_BUTTON` from '../jobs/defs').
  Do not import or change jobs/hud.ts; write the new widget with ids `gta-shift-hud` (and classes `gta-sh-*`).

## Change
- `games/gnome-theft-auto/src/workplaces/shiftHud.ts`: implement `createShiftHud(ui)`:
  - Root `#gta-shift-hud` appended to `ui`: fixed, top-centre under the safe area (same spot and width rule as
    `#gta-job-hud`: the two never show together), dark translucent panel with a 4 px left border in `view.color`.
  - Head row: icon + title (ellipsis). Up to 3 lines. Meter: a thin bar with a caption (`label` and percent), the
    bar coloured by frac (green > 40%, amber > 15%, red below).
  - Action button under the panel (min 120 x 44 px, `pointer-events: auto`, `touch-action: manipulation`, stops
    pointerdown propagation) with the key glyph badge like jobs/hud.ts; hidden when `action` is null.
  - `set(null)` hides the root; `set(v)` shows and updates only what changed. The pad R3 edge is read in `set` (it is
    called every frame) and fires the callbacks once per press while the button shows.
  - `onAction(cb)` returns an unsubscribe. `dispose()` removes the root and every listener.
- `games/gnome-theft-auto/src/workplaces/shiftHud.test.ts` (new): with the repo's fake DOM (look for
  `installFakeDom` in `src/testing/fakeDom.ts` and how other UI tests use it, e.g. a `*.test.ts` under `src/jobs/`),
  set a view and check the title text; `set(null)` hides; the I keydown fires the callback only while an action shows.
  If the fake DOM cannot dispatch key events, test what it can and say so.

## Contract
`createShiftHud(ui): ShiftHud` and `ShiftHudView` exactly as in the stub.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/workplaces/shiftHud.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files.

## Out of scope
`jobs/hud.ts`, every other file.

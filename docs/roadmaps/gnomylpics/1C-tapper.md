Epic: 1 (shared modules and the party-only capability)
Depends on: none

## Goal
`games/gnomylpics/src/olympic/taps.ts` is the real view-side input for the tap events: keyboard alternate taps (A/D, arrows), an action (Space/Enter/the pad's pointer, or an on-screen button) and big touch buttons, all turned into the cumulative counters a slice sends.

## Read first
- `games/gnomylpics/src/olympic/taps.ts`: the stub. Every exported name, type and doc comment is final; fill in `createTapper` (you may add private helpers).
- `games/gnomylpics/src/olympic/run.ts`: `TapInput { taps, slips, acts }` (import the type only).
- `packages/party/src/types.ts`: `PadState` (`a` = action held, `aPressed` = went down this frame; a pointer held on the canvas also counts as `a`).

## Change
- `games/gnomylpics/src/olympic/taps.ts`, `createTapper(ui, opts)`:
  - **Why not pad.x:** the pad sums A and D, so pressing D while A is still held reads 0 and a fast tap is lost. Listen to key events yourself: `window.addEventListener('keydown', onKey)`. Ignore `e.repeat` and events whose target is an INPUT/TEXTAREA/SELECT. Left = `KeyA`, `ArrowLeft`; right = `KeyD`, `ArrowRight`. Call `e.preventDefault()` for those four codes.
  - Tap rule: a press on side `s` (-1 left, 1 right): if `lastSide === s` it is a **slip** (`slips += 1`, `lastSlipAt = performance.now()`, lastSide unchanged); otherwise `taps += 1` and `lastSide = s`. The very first press of either side is a tap.
  - Touch tap buttons (unless `opts.tapButtons === false`): one container div appended to `ui` with `position:absolute;inset:0;pointer-events:none`. Two round buttons, bottom-left and bottom-right (`left:4vw` / `right:4vw`, `bottom:6vh`, size `min(26vw,150px)` square, `border-radius:50%`, `background:rgba(255,255,255,0.18)`, `border:3px solid rgba(255,255,255,0.6)`, white `◀` / `▶` glyph 48px, `pointer-events:auto`, `touch-action:none`). `pointerdown` → `preventDefault()` + the same tap rule. Show them only on touch devices: `matchMedia('(pointer: coarse)').matches`; on others do not create them.
  - Action:
    - Sources: `pad.a` (Space/Enter/pointer on canvas) OR the on-screen action button being held. In `sample(pad)` compute `down = pad.a || buttonHeld`.
    - With `opts.actLabel`, an action button (always shown, also on desktop, so players see the verb): bottom centre (`left:50%;transform:translateX(-50%);bottom:6vh`), pill `padding:18px 34px`, `font:800 26px system-ui`, `background:#ffd54f`, `color:#222`, `border-radius:40px`, `pointer-events:auto`, `touch-action:none`; text `opts.actLabel` plus on desktop ` (Space)`. `pointerdown` → `buttonHeld = true` + `preventDefault()`; `pointerup`, `pointercancel`, `pointerleave` → `buttonHeld = false`.
    - `actOn: 'press'` (default): `acts += 1` on the sample where `down` goes from false to true.
    - `actOn: 'release'`: track `downSince = performance.now()` when `down` goes true; `holdS = (now - downSince)/1000` while down; when `down` goes false: `holdS` = final hold seconds, `acts += 1`.
    - `actDown = down` after each sample.
  - `sample(pad)` returns `{ taps, slips, acts }` (cumulative since createTapper).
  - The returned object exposes `lastSide`, `lastSlipAt`, `actDown`, `holdS` as live values (use getters).
  - `dispose()`: remove the keydown listener and the container div.
- `games/gnomylpics/src/olympic/taps.test.ts` is NOT needed (it needs a DOM). Instead keep the logic testable: export a small pure helper `applyTap(st: { taps: number; slips: number; lastSide: -1 | 0 | 1 }, side: -1 | 1): 'tap' | 'slip'` that mutates `st` by the tap rule, use it inside createTapper, and add `games/gnomylpics/src/olympic/taps.test.ts` testing only `applyTap` (L,R,L,R → 4 taps; L,L → 1 tap 1 slip, lastSide -1; first press R is a tap). The test file must not import anything that touches `window` at import time (taps.ts must not either).

## Contract
The exported API of `taps.ts` exactly as in the stub, plus the new `applyTap` export. Slices call: `const tapper = createTapper(ctx.ui, { actLabel: 'JUMP' }); ... input(pad) { return { ...tapper.sample(pad) }; } ... dispose() { tapper.dispose(); }`.

## Done when
- `cd games/gnomylpics && npx vitest run src/olympic/taps.test.ts` passes.
- `npx tsc --noEmit -p games/gnomylpics` shows no errors in `src/olympic/taps.ts` or `taps.test.ts`.

## Out of scope
Every other file: `src/olympic/run.ts`, `field.ts`, `rank.ts`, `src/minigames/**` belong to other workers. Never edit `packages/party`.

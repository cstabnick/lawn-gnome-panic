Epic: 2 (all modules, in parallel)
Depends on: none

(First read `docs/roadmaps/aether-board/_env.md`: environment and repo rules.)

## Goal
`src/hud.ts`: a Jet Set Radio-style HUD. A title/pause card that teaches the controls, graffiti trick text that slams in,
the running combo with its multiplier and link timer, banked score, speed, a flow meter for boost, and a small trick-stick
display that shows your flick paths so the mouse gestures are learnable.

## Read first
- `games/aether-board/src/hud.ts`: the stub you replace (keep `GameState`, `HudFrame`, `Hud`, `createHud`).
- `games/aether-board/src/config.ts`: `ComboView` (lines, points, mult, linkLeft, total, best, last), `Player` (vel,
  flow, boosting, mode, t), `PALETTE`.
- `games/aether-board/src/app.ts`: `hud.update(...)` is called every frame with state 'title' | 'playing' | 'paused'.
  A click on the canvas starts (pointer lock); pad A starts too.

## Change
- `src/hud.ts`:
  - Repo rule: append your own container (`#ab-hud`, `position:fixed; inset:0; pointer-events:none`) to `ui`; never
    restyle `#ui`. One injected `<style id="ab-hud-style">`. Keep the top-right 120×50 px free (volume button). Build
    elements once; set text/styles only when they change (it runs every frame).
  - **Graffiti type**: `font-family: "Arial Black", Impact, system-ui, sans-serif; font-weight: 900; font-style: italic;`
    `transform: skewX(-10deg)`, chunky multi-colour `text-shadow` stacks (e.g. `3px 3px 0 #17072e, 6px 6px 0 #ff3fa4`) and
    gradient fills (`background: linear-gradient(...)`; `-webkit-background-clip: text; color: transparent` with the
    shadow on a sibling layer if needed). Colours from PALETTE.
  - **Title card** ('title'): centred: "AETHER BOARD" huge graffiti logo, subtitle "a gnome. a board. the ethereal plane.",
    a pulsing "CLICK TO RIDE" (or "PRESS A" when `device === 'pad'`), and two control columns (keyboard+mouse / gamepad;
    the current device's column brighter):
    - KB+M: A/D carve · spin in the air · W push · front flip in the air · S brake · back flip in the air ·
      Mouse = trick stick: pull back, flick forward → Ollie · flick ↖ Kickflip · ↗ Heelflip · ← / → Shove-its ·
      swing through ← or → on the way up → Varials / 360 Flip · In the air: flick for flip tricks · Space hold + release →
      Ollie · LMB / RMB (or Q / E) grabs · Shift boost (burns flow) · R back to the island · Arrow keys = trick stick too.
    - Pad: Left stick carve / spin / flip · Right stick tricks (Skate style) · A ollie · LT / RT grabs · RB boost ·
      B brake · Y reset.
    'paused': the same card with "PAUSED" and "CLICK TO RIDE ON". Hidden while 'playing'.
  - **Combo** (playing, centre, 30 % from the top): the last 4 `lines` stacked (newest biggest), then
    `${points} × ${mult}` big; under it a thin link bar (`linkLeft / 1.4`) when `linkLeft > 0`. Hidden with no combo.
  - **Trick slam**: whenever `lines.length` grows, the new name slams in near the top centre: scale 1.6 → 1 with a random
    tilt ±7°, 0.12 s in, holds 0.6 s, fades (CSS animation, restart by toggling a class / re-inserting the node).
  - **Banked / bailed** (`last` changed, compare `last.t`): centre: 'landed' → "+{points}" huge in yellow with a pop
    animation and the trick text under it (small); 'bailed' → "BAILED" red with a shake. Fades after 1.6 s.
  - **Score** (top-left): "SCORE {total}" and "BEST {best}" in graffiti type.
  - **Speed** (bottom-right): `Math.round(speed * 3.6)` big + "KM/H", and a slanted bar (speed / 70).
  - **Flow** (bottom-left): label "FLOW", a slanted bar 0..1 with a cyan → pink → yellow gradient; glows and pulses while
    `p.boosting`. The first time flow passes 0.5 show "SHIFT / RB to boost" under it for 4 s.
  - **Stick display** (bottom centre, 84 px circle, translucent): 8 zone ticks, the trail (`trail`) as an SVG polyline
    fading out, and the current stick dot. Visible in every state (it teaches the flicks on the title card too).
  - `mode === 'grind'`: a small "GRIND" tag under the combo. `mode === 'bail'`: nothing extra.

## Contract
```ts
export type GameState = 'title' | 'playing' | 'paused';
export interface HudFrame { p: Player; combo: ComboView; state: GameState; device: 'kbm' | 'pad'; stick: { x: number; y: number }; trail: { x: number; y: number }[] }
export interface Hud { update(f: HudFrame): void }
export function createHud(ui: HTMLElement): Hud;
```

## Done when
- `npx tsc --noEmit -p games/aether-board` passes for your file.
- Visual check (only you use this port): `cd games/aether-board && npx vite --port 5200 --strictPort` in the background,
  Playwright screenshot of `http://localhost:5200/` after 3 s (`require('playwright')`; `chromium.launch()`; save to
  /tmp/ab-hud/): the title card is readable. No console errors. Stop the server afterwards.

## Out of scope
Every other file in `games/aether-board/src`.

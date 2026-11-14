Epic: 2 Systems · Issue 6: controls (aim, club select with ranges, three-tap swing meter)
Depends on: none

## Goal
`src/controls.ts` is how the player plays, on a phone or a keyboard, like classic PGA golf games: drag to aim, step through the bag (every club shows its estimated range), and swing with a three-tap power/accuracy meter.

## Read first
- `games/gnome-golf/src/config.ts`: `SWING`, `CLUBS`, `CLUB_ORDER`, `GameState` (`swing`, `phase`, `view`), `Shot`
- `games/gnome-golf/src/round.ts`: `takeShot`, `setAim`, `cycleClub`, `skipIntro`, `distanceToPin`, `fmtDistance`
- `games/gnome-golf/src/physics.ts`: `estimateCarry`
- `games/gnome-golf/src/controls.ts` (stub)

## Change
- `games/gnome-golf/src/controls.ts`: implement `createControls(ctx: Ctx): System`. One root `<div id="gc-root">` appended to `ctx.ui`; all CSS selectors start with `#gc-`.
  1. **Aim by dragging** the 3D view: `pointerdown`/`pointermove`/`pointerup`/`pointercancel` on `ctx.canvas` (call `canvas.setPointerCapture`). In phase 'aim' only, horizontal drag changes the aim: `setAim(state, state.aimYaw - dx * k)` with k = 0.004 rad/px for full swings and 0.0015 for the putter (dragging right turns the aim right; right of yaw a is (-cos a, 0, sin a), so turning right means decreasing yaw). In 'intro', any pointerdown on the canvas calls `skipIntro(state)`.
  2. **Club selector** (bottom-left): a panel with `◀` and `▶` buttons (48x48) around a label showing the club name and its estimated range for the current lie, e.g. "7 Iron" over "138 yd" (`Math.round(estimateCarry(club, state.lie))`, or for the putter `fmtDistance(estimateCarry('PT', state.lie), 'green')` such as "90 ft"). `◀` = longer club (`cycleClub(state, -1)`), `▶` = shorter (+1). `sfx('tick')` on change. Tapping the label toggles the **bag list**: a panel above it listing every club in `CLUB_ORDER` with its range for the current lie, the selected one highlighted, clubs whose range is within 10% of `distanceToPin(state)` marked with a small flag "⛳"; tapping a row selects that club and closes the list. Enabled in 'aim' only (dim to 50% opacity otherwise, hidden in 'title', 'card', 'final').
  3. **Swing meter** (bottom-centre): a horizontal bar, width `min(78vw, 460px)`, height 26px. Layout left to right: a short "accuracy zone" on the left (the accuracy line at 12% of the width, the zone ±`SWING.accuracyWindow` around it drawn in a lighter colour), the power scale to the full-power mark at 88% of the width, and an overswing zone (red) from 88% to 100% representing power 1.0..`SWING.maxPower`. A marker (white 4px bar) at x = line + marker * (full - line), where marker 0 = the accuracy line and marker 1 = full power. Show the locked power as a gold tick once set. Above the bar show the live distance for the marker's power: `Math.round(estimateCarry(club, lie, max(0, marker)))` yd (feet for the putter via fmtDistance). Shown in 'aim' and 'swing', hidden otherwise.
  4. **Three-tap swing**, driven by a big round SWING button (bottom-right, 84px, `pointerdown`) or the Space key:
     - Tap 1 (phase 'aim', `swing.stage === 'idle'`): `startAudio()`, `sfx('tick')`, set `state.phase = 'swing'`, `state.phaseTime = 0`, `state.swing = { stage: 'power', marker: 0, power: 0 }`.
     - Power stage: each frame `marker += dt / (SWING.riseSeconds * (club === 'PT' ? SWING.puttRiseScale : 1))`. Tap 2 locks `power = marker`, stage 'accuracy', `sfx('click')`. If the marker reaches `SWING.maxPower`, lock power there automatically.
     - Accuracy stage: marker falls `dt * power / SWING.fallSeconds` per frame (from the power mark to the line in fallSeconds), continuing below 0. Tap 3: `accuracy = clamp(-marker / SWING.accuracyWindow, -1, 1)` (early = positive marker = pulled left = negative accuracy; late = pushed right). If the marker reaches `-0.3` with no tap, accuracy = 1.
     - Then: `sfx('swing')`, `sfx(club === 'PT' ? 'putt' : 'hit', min(1, power))`, `takeShot(state, { club: state.club, power, accuracy, yaw: state.aimYaw })` (it sets phase 'flight' and resets `state.swing`). Ignore taps in any other phase. Briefly flash text over the meter for the result: "PERFECT" when |accuracy| < 0.15, "HOOK"/"SLICE" when |accuracy| > 0.6 (negative = HOOK).
  5. **VIEW button** (bottom-right, above SWING, 56px): toggles `state.view` between 'behind' and 'overhead' (label "TOP" / "BACK"). Enabled in 'aim'. Key V.
  6. **Keyboard**: ArrowLeft/ArrowRight (or A/D) rotate the aim at 0.6 rad/s while held (0.15 with Shift, and 0.2 for the putter) via `setAim`; ArrowUp/W = longer club, ArrowDown/S = shorter; Space = swing tap; V = view; Enter or Space in 'intro' = skip intro. Call `e.preventDefault()` for Space and arrow keys.
- Mobile: buttons are at least 48px, use `pointerdown` so taps register instantly, and `env(safe-area-inset-bottom)` / `-left` / `-right` padding. The SWING button must stay reachable with the right thumb in both orientations.

## Contract
`export function createControls(ctx: Ctx): System` (signature unchanged). The only state this issue writes: `state.phase`/`phaseTime` (aim -> swing only), `state.swing`, `state.view`, and through round.ts `takeShot`, `setAim`, `cycleClub`, `skipIntro`. Element ids start with `gc-`.

## Done when
- `cd /home/user/lawn-gnome-panic/games/gnome-golf && npx tsc --noEmit -p .` shows no errors in `src/controls.ts`.
- Three taps on SWING (or Space) in 'aim' end in `takeShot` with a power and accuracy taken from the meter; the club selector shows each club's range and the bag list lists all 12.

## Out of scope
Every other file. Hole info, wind, banners, title and scorecard are hud.ts; the minimap is minimap.ts.

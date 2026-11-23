Epic: 2 (parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-gun-store/_common.md` first.

## Goal
`InputState.aim` is true while the player aims: right mouse button held (with or without pointer lock), the on-screen touch "Aim" toggle
(on foot only), or the gamepad left trigger on foot.

## Read first
- `games/gnome-theft-auto/src/input.ts`: the whole file (321 lines). Mouse (`mousedown`/`mouseup`, `dragging` for right-drag look when the
  pointer is not locked), the touch `button()` helper, the rows `topRow`/`bottomRow`, `applyMode`, and `read()`.
- `games/gnome-theft-auto/src/gamepad.ts`: `PadState`, the header comment, and the foot branch (`else { out.jump = ... }`), `active`.
- `games/gnome-theft-auto/src/types.ts`: `InputState.aim`.

## Change
- `games/gnome-theft-auto/src/gamepad.ts`: add `aim: boolean` to `PadState` (default false); in the foot/chute branch `out.aim = lt > 0.3`;
  include `out.aim` in `active`. Update the header comment line for "On foot / parachute" to say "LT aim".
- `games/gnome-theft-auto/src/input.ts`:
  - Mouse: `let mouseAim = false`. `mousedown` button 2 sets `mouseAim = true` (keep setting `dragging` when not locked, as now);
    `mouseup` button 2 clears it; the window `blur` handler also clears it. (Unlocked right-drag still looks around AND aims: that is wanted.)
  - Touch: an `Aim` toggle button, 64 px, made with the existing `button()` helper, put in `bottomRow` just before `fireBtn`. Tapping it flips
    `aimToggle`. While on: `aria-pressed="true"`, border colour `#ff7a1a`, background `rgba(255,122,26,0.35)`; while off: the normal look and
    `aria-pressed="false"`. Visible only in `'foot'` mode (set in `applyMode`); `applyMode` also turns the toggle off.
  - `read()`: `aim: mouseAim || aimToggle || !!p?.aim`.
  - Update the file's first-line comment to mention aiming.

## Contract
`InputState.aim?: boolean` (types.ts, already there). `PadState.aim: boolean`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `input.ts` and `gamepad.ts`.
- Read through `applyMode`: the Aim button shows in foot mode only and every other button's visibility is unchanged.

## Out of scope
`camera.ts`, `player.ts` (another worker), `app.ts`, `hud.ts`, `types.ts`, every other file.

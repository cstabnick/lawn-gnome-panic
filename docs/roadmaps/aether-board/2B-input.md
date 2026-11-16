Epic: 2 (all modules, in parallel)
Depends on: none

(First read `docs/roadmaps/aether-board/_env.md`: environment and repo rules.)

## Goal
`src/input.ts`: keyboard + mouse and gamepad into one `Input` per frame. The mouse is a **springy virtual right stick**
under pointer lock: moving it pushes the stick, which springs back to centre, so a quick mouse flick is a stick flick
(pull the mouse back then flick it forward = ollie, flick toward up-left = kickflip, as in the Skate games).

## Read first
- `games/aether-board/src/input.ts`: the stub you replace (keep `InputSource`, `createInput`).
- `games/aether-board/src/config.ts`: `Input` (field meanings), `NO_INPUT`.
- `games/aether-board/src/app.ts`: how `read`, `locked`, `requestLock`, `device` and `consumeStart` are used. The canvas
  click calls `requestLock()` when not playing.

## Change
- `src/input.ts`:
  - **Keyboard** (`keydown`/`keyup` on `window`, by `e.code`, ignore repeats; `preventDefault` for Space, arrows, Tab):
    A/D or ←/→ steer (−1/+1), W/S lean (+1/−1). Space = `jump`. Shift (either) = `boost`. Q = grab 1, E = grab 2.
    R = `respawn` (true only on the `read` after the press). Arrow keys **also** drive the trick stick when the mouse is not
    used: ↑ y+1, ↓ y−1, ← x−1, → x+1 (combined, normalised to the unit disc), so laptop players can do ↓ then ↑ for an
    ollie and ↓ then ←↑ for a kickflip. (So arrows both steer/lean and stick: fine, they are an alternative layout.)
  - **Mouse**: `requestLock()` calls `canvas.requestPointerLock()` (wrap in try/catch; some browsers return a promise:
    `void Promise.resolve(...).catch(() => {})`). `locked` = `document.pointerLockElement === canvas`. While locked,
    `mousemove` adds `movementX * SENS` to stick x and `-movementY * SENS` to stick y (`SENS = 1 / 90`), clamped to the unit
    disc. Every `read(dt)`, the mouse stick springs back: multiply by `Math.exp(-14 * dt)`. LMB (button 0) held = grab 1,
    RMB (button 2) held = grab 2 (block the context menu on the canvas). A click that results in pointer lock (the
    `pointerlockchange` event with lock acquired) sets the start flag.
  - **Gamepad** (`navigator.getGamepads()`, first connected pad with `mapping === 'standard'`, polled in `read`): left stick
    axes 0/1 → steer = axis0, lean = −axis1; right stick axes 2/3 → stick x = axis2, y = −axis3 (deadzone 0.15 each, radial,
    rescaled so just past the deadzone is near 0). Buttons: 0 (A) jump, 5 (RB) boost, 6 (LT) grab 1, 7 (RT) grab 2
    (pressed or value > 0.5), 3 (Y) respawn (edge), 1 (B) also brake (lean = −1 while held). Button 0 or 9 (Start)
    pressed (edge) sets the start flag. D-pad (12..15) also steers/leans.
  - **Combine**: steer/lean = the bigger-magnitude of keyboard and pad. stick = pad stick if its magnitude > 0.2, else
    mouse stick + arrow stick, clamped to the unit disc. Booleans OR'd. `grab`: 1 wins over 2 if both.
  - `device`: 'pad' when the pad last had any input above the deadzone or a button press, 'kbm' after any key or mouse
    move/click.
  - `consumeStart()`: returns the start flag and clears it.
  - Blur (`window` 'blur'): clear all held keys and buttons.
  - Never touch `#ui`. Do not read anything at import time (everything inside `createInput`).

## Contract
```ts
export interface InputSource {
  read(dt: number): Input;
  readonly locked: boolean;
  requestLock(): void;
  readonly device: 'kbm' | 'pad';
  consumeStart(): boolean;
}
export function createInput(canvas: HTMLCanvasElement): InputSource;
```

## Done when
- `npx tsc --noEmit -p games/aether-board` passes for your file.
- Optional (only you use this port): `cd games/aether-board && npx vite --port 5197 --strictPort` in the background; a
  Playwright check (`require('playwright')` works anywhere; `chromium.launch()` needs no options) that loads
  `http://localhost:5197/`, presses keys and reads `window.ab.player` is fine. Stop the server afterwards.

## Out of scope
Every other file in `games/aether-board/src`.

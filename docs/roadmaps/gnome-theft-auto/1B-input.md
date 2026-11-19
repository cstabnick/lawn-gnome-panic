Epic: 1 (parallel modules)
Depends on: none

## Environment

- Repo root: `/home/user/lawn-gnome-panic` (Linux). Run commands from there. Dependencies are installed: do not run `npm install`. Do not commit.
- Game: `games/gnome-theft-auto` (three.js 0.187 + TypeScript + Vite). It already builds: every module exists as a STUB with its final exported signature. Your job is to replace ONE stub (or the files named below) with the real thing.
- About ten other workers are editing the other files of this game at the same time. Edit only the files your issue names. Keep every exported name and signature of your file exactly as in its stub, so other files keep compiling.
- The contracts are in `games/gnome-theft-auto/src/types.ts` (read it first, do not edit it) and all tuning numbers are in `games/gnome-theft-auto/src/config.ts` (read, do not edit). `src/collide.ts` (box collision, `angleDiff`) and `src/gnomes.ts` (town looks, names, `makeGnome`, `poseHandsUp`, `clearHandsUp`, `gnomeState`) are shared helpers: use them, do not edit them. `src/main.ts` is the wiring that calls your module; read it to see how you are called, do not edit it.
- Conventions: y up, 1 unit = one gnome's height (a gnome model is about 1.1 tall). Yaw 0 faces +z; forward = `(Math.sin(yaw), 0, Math.cos(yaw))`; the gnome's right = `(-Math.cos(yaw), 0, Math.sin(yaw))`. Turning right DECREASES yaw. Prefab models from `@lawn/prefabs` stand on y = 0 and face +z.
- `buildPrefab(id, { scale, tint })` (from `@lawn/prefabs`) returns a `THREE.Group`; it throws `Unknown prefab` for an id that does not exist yet. The new ids `squirt-pistol`, `super-soaker`, `zero-turn-mower`, `whirligig-mower`, `sandbag-wall`, `watch-tower` are being added by another worker right now; you may reference them, they will exist when the epic is done.
- Lore (Gnome Theft Auto is a parody set in the town of Turfton): no gore, nothing bleeds or dies; water guns only; soaked gnomes put their hands up and run. Gnomes are fired clay. No humans ever appear.
- Mobile matters: anything a player does must work by touch too (only the input/HUD issues build UI).
- Check: `npx tsc --noEmit -p games/gnome-theft-auto` must show no errors in YOUR files (errors in another worker's file mean they are mid-edit: ignore those). Do NOT run `vite build`, `npm run build` or a dev server: other workers share the folder and the port.

## Goal
`games/gnome-theft-auto/src/input.ts` reads keyboard, mouse (pointer lock) and touch into one `InputState` per frame, and draws the on-screen touch controls (stick + buttons) for phones.

## Read first
- `games/gnome-theft-auto/src/types.ts`: `InputState`, `Input`, `CameraMode`.
- `games/gnome-theft-auto/src/input.ts`: the stub (keep `export function createInput(canvas: HTMLCanvasElement, ui: HTMLElement): Input`).
- `games/gnome-theft-auto/src/main.ts`: how `read()`, `setMode()` and `setEnterLabel()` are called every frame.

## Change
`games/gnome-theft-auto/src/input.ts` only.

Keyboard (`window` keydown/keyup on `e.code`, ignore repeats for edges):
- `KeyW`/`ArrowUp` moveY +1, `KeyS`/`ArrowDown` moveY -1, `KeyD`/`ArrowRight` moveX +1, `KeyA`/`ArrowLeft` moveX -1.
- `Space`: `jump` edge AND `lift` +1 while held. `ShiftLeft`/`ShiftRight`/`KeyC`: `lift` -1 while held.
- `KeyE`: `enterExit` edge. `KeyQ`: `switchGun` edge. `KeyF`: `fire` while held.
- `preventDefault()` for Space and arrows.

Mouse (desktop):
- Clicking the canvas calls `canvas.requestPointerLock()`. While `document.pointerLockElement === canvas`: `mousemove` adds `camYaw += -e.movementX * 0.0025` and `camPitch += e.movementY * 0.0025`; left button held = `fire`.
- Without pointer lock, dragging with the right mouse button also moves the camera the same way (and `contextmenu` is prevented on the canvas).

Touch (phones), drawn only when `matchMedia('(pointer: coarse)').matches` or after the first `touchstart`:
- Append ONE container `div` (`id="gta-touch"`) to `ui`, `position: fixed; inset: 0; pointer-events: none`. Never restyle or hide `ui` itself. Buttons and the stick area have `pointer-events: auto` and `touch-action: none`.
- Left stick: touching the left 45% of the screen (not on a button) places a stick base (110 px circle, translucent white) under the thumb; dragging moves a knob up to 50 px; `moveX = dx/50`, `moveY = -dy/50` clamped to -1..1. Releasing resets to 0.
- Camera drag: a touch that starts on the right 55% of the screen and not on a button adds `camYaw += -dx * 0.005`, `camPitch += dy * 0.005` per move.
- Buttons, bottom-right, round, at least 64 px (Squirt 84 px), with text labels, positioned with `calc(env(safe-area-inset-right) + 16px)` / `calc(env(safe-area-inset-bottom) + 16px)`: **Squirt** (fire while held), **Jump** (on foot: jump edge; in `fly` mode labelled **Up**: lift +1 while held), **Down** (only in `fly` mode: lift -1 while held), **Swap** (only on foot: switchGun edge), **Enter** (enterExit edge; its text is set by `setEnterLabel(label)`, hidden when label is null). Use pointer events (`pointerdown`/`pointerup`/`pointercancel`, `setPointerCapture`) so multi-touch works: a thumb on the stick and one on Squirt at the same time.
- In `drive` mode hide Jump/Down/Swap; show Squirt and Enter. In `fly` mode show Up, Down, Squirt, Enter.
- The stick must work in portrait 390x844 and landscape 844x390: keep the buttons in a column/cluster that fits 390 px tall.

`read()` returns a copy of the state, then clears the edge flags (`jump`, `enterExit`, `switchGun`) and the camera deltas (`camYaw`, `camPitch`). Keyboard and touch axes add up, clamped to -1..1. `setMode(mode)` and `setEnterLabel(label)` only touch the DOM when the value changed (they are called every frame).

## Contract
`export function createInput(canvas: HTMLCanvasElement, ui: HTMLElement): Input` with `read`, `setMode`, `setEnterLabel` as in `types.ts`. Sign rules: moveX +1 = right, moveY +1 = forward, lift +1 = up, camYaw + = orbit/turn left, camPitch + = look further down.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/input.ts`.
- By reading: every action (move, look, squirt, enter/exit, jump/up, down, swap) has a touch control; buttons ≥ 64 px; only `#gta-touch` is added to `ui`.

## Out of scope
Every other file (the HUD is `hud.ts`, another worker's).

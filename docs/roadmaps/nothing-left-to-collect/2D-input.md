Epic: 2 Systems
Depends on: none (Epic 1 is done: the game builds with stubs)

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\stingaree` (a git worktree). Node: if not found, `export PATH="/c/Program Files/nodejs:$PATH"` in Git Bash.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`.
- Eleven other workers are filling other files in `games/nothing-left-to-collect/src/` right now. Edit only `src/input.ts`. `tsc` may show errors in their files mid-edit; only yours must be clean.
- Repo rules: append your own container to the shared `#ui` element (passed in as `ui`); never restyle or hide `#ui` itself (it has `pointer-events: none`, so give your interactive elements `pointer-events: auto`). Mobile by default: touch for every action, targets at least 44 px, safe-area insets, works at 390x844 portrait and landscape.

## Goal

Replace the stub `src/input.ts` with keyboard + touch input: a virtual joystick, a Jump button and a context
Interact button, all read through one `InputState`.

## Read first

- `games/nothing-left-to-collect/src/input.ts` (stub) and `src/types.ts` (`Input`, `InputState`).
- `games/nothing-left-to-collect/index.html`: the canvas `#game` and the `#ui` overlay.

## Change

`createInput(ui: HTMLElement): Input`:

- Container: `div#fc-touch` appended to `ui`, `position: fixed; inset: 0; pointer-events: none; z-index: 10`. Inject one `<style>` element (id `fc-touch-style`) for its CSS.
- **Joystick**: a pointer that goes down on the left 55% of the screen (and not on a button or on any element inside `#fc-hud`, i.e. listen on `#fc-touch`'s own full-screen transparent layer `div.fc-stick-zone` with `pointer-events: auto`, which sits BELOW the buttons) starts a floating stick at that point: a 110 px translucent ring with a 48 px knob. Dragging moves the knob up to 50 px; `moveX = dx / 50`, `moveZ = dy / 50` (screen down is +z), clamped to length 1, dead zone 0.12. Release resets to 0. Use pointer events with `setPointerCapture`; track one pointer id for the stick.
  - The stick zone covers only the left 55% so taps on the right half reach the dialogue and other HUD buttons below it. Use `touch-action: none` on it.
- **Jump button**: round, 72 px, bottom-right: `right: calc(20px + env(safe-area-inset-right)); bottom: calc(24px + env(safe-area-inset-bottom))`, label "Jump" (text, plus an up arrow ⤒). `pointerdown` sets `jump = true` and queues `jumpPressed`; `pointerup`/`pointercancel`/`pointerleave` clears `jump`.
- **Interact button**: round, 72 px, left of Jump (`right: calc(108px + env(safe-area-inset-right))`), hidden unless `setInteract(label)` gave a label; shows the label (e.g. "Talk"). `pointerdown` queues `interactPressed`. Add a soft pulse animation when it appears.
- Show the touch buttons only on touch devices (`matchMedia('(pointer: coarse)').matches`) OR after the first `pointerdown` with `pointerType === 'touch'`. On desktop, `setInteract(label)` instead shows a small hint chip bottom-centre: `[E] <label>` (not clickable, `pointer-events: none`).
- **Keyboard** (on `window`): WASD and arrow keys → moveX/moveZ (W/Up = -z); Space → jump (queues `jumpPressed` on keydown without repeat); E or Enter → `interactPressed`. Ignore key events when `e.target` is an input/textarea. `preventDefault` for arrows and Space.
- `read()`: returns a fresh `InputState`: keyboard and stick combined (stick wins when active), then clears the queued one-shot `jumpPressed` and `interactPressed`.
- `setEnabled(false)`: hides the stick and both buttons (and the desktop hint), resets the stick, and makes `read()` return zero movement and no presses until enabled again. Keyboard presses while disabled are dropped (not queued).
- `dispose()`: removes listeners and `#fc-touch`.
- Buttons: `user-select: none; -webkit-tap-highlight-color: transparent;`, a white 80%-opaque fill, dark text, 2 px dark border, bold 14 px system font.

## Contract

```ts
export function createInput(ui: HTMLElement): Input;
// Input = { read(): InputState; setInteract(label: string | null): void; setEnabled(on: boolean): void; dispose(): void }
// InputState = { moveX, moveZ, jump, jumpPressed, interactPressed }
```
DOM ids other modules or the smoke test rely on: `#fc-touch` (container). Do not use ids starting with `fc-hud` or `fc-dialog` (the HUD owns those).

## Done when

- `npx tsc --noEmit -p games/nothing-left-to-collect` shows no errors in `src/input.ts`.
- Re-read the CSS once against a 390x844 portrait and an 844x390 landscape screen: both buttons fully on screen, at least 44 px, clear of the safe-area insets, and the stick zone does not cover the right side of the screen.

## Out of scope

Every other file under `games/nothing-left-to-collect/`, all packages.

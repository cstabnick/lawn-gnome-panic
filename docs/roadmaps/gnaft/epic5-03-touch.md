Epic: 5. Co-op over the shared matchmaking server (+ mobile)
Depends on: none

## Environment
- Repo: `C:\Users\cpsai\cstabnick\lawn-gnome-panic` (Windows, Git Bash). Game: `games/gnaft` (Vite + TypeScript strict + three@0.187.0). If `node` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed: do not run `npm install` or add packages.
- **Other workers are editing other files in `games/gnaft/src` at the same time.** Edit ONLY the file listed under Change. Never edit `config.ts`, `rules.ts`, `input.ts`, `main.ts` or another system's file. A constant you need that is not in config.ts: declare it as a local `const` at the top of your file.
- Keep the exported function name and signature exactly.
- Do not run `vite build`, `npm run dev`, or start any server. Do not `git commit`.
- UI rule: append your own container to `ctx.ui` (the shared `#ui` element) and style only your own elements. Never restyle, hide or clear `#ui` itself. `#ui` has `pointer-events:none`; set `pointer-events:auto` on your own touchable elements only.

## Goal
Gnaft is playable on a phone or tablet: a move joystick, drag-to-look, and big buttons for every action, changing with the game mode. The controls feed the same input state as the keyboard and mouse, so no gameplay code changes.

## Read first
- games/gnaft/src/touch.ts: the stub (keep `export function createTouch(ctx: Ctx): System`)
- games/gnaft/src/input.ts: `Input.touch()`, `Input.virtual` (`keyDown(code)`, `keyUp(code)`, `buttonDown(b)`, `buttonUp(b)`, `look(dx, dy)`, `wheel(deltaY)`). In touch mode `input.locked()` is always true, so fishing and building accept the virtual mouse buttons.
- games/gnaft/src/config.ts: `KEYS` (the key codes to send), `GameState.mode` ('title' | 'play' | 'build' | 'telescope' | 'craft'), `GameState.sea.docked`, `GameState.hasTelescope`, `GameState.canGrab`, `GameState.player.swimming`, `TOOLS`, `GameState.tools`

## Change
- games/gnaft/src/touch.ts (only this file). Inject one `<style id="rg-touch-style">` for your classes, and build all DOM once inside `<div id="rg-touch">` appended to `ctx.ui` (`position:absolute;inset:0;pointer-events:none;touch-action:none;user-select:none`). Use Pointer Events (`pointerdown` / `pointermove` / `pointerup` / `pointercancel`, with `setPointerCapture`) so several fingers work at once; call `preventDefault()` on them.
  1. **Visibility.** Show `#rg-touch` only while `ctx.input.touch()` is true and `state.mode !== 'title'`. When it hides, release everything you are holding (keyUp/buttonUp for any key or button you pressed).
  2. **Move joystick** (left 45% of the screen, a transparent `pointer-events:auto` zone below the top 80 px): a finger down there places a joystick base (120 px circle) with a knob (56 px) that follows the finger up to 60 px away. Map the knob to keys: x > 0.35 → `KEYS.right` ('KeyD') held, x < -0.35 → `KEYS.left`, y < -0.35 (up) → `KEYS.forward`, y > 0.35 → `KEYS.back`; send keyDown/keyUp only on changes. Pushed to the rim (> 0.9) also holds `KEYS.sprint`. Release all on finger up.
  3. **Look** (the rest of the screen, a zone under the buttons): dragging calls `ctx.input.virtual.look(dx * 1.6, dy * 1.6)` with the pixel movement since the last event. A quick tap there (under 200 ms, under 10 px of movement) does nothing.
  4. **Pinch zoom**: two fingers in the look zone: `virtual.wheel(-(newDistance - oldDistance) * 3)`.
  5. **Buttons** (round, 64 px, dark translucent with a white border and a short label, a bigger 84 px main button). Hold-type buttons send keyDown/buttonDown on press and keyUp/buttonUp on release; tap-type send down on press and up on release too (the game reads `pressed` on the down). Lay them out on the right side, above the bottom edge, with `env(safe-area-inset-*)` padding. Show only the ones that fit the mode:
     - **play**: main "Fish" (hold → mouse button 0; label "Fish", hidden while `player.swimming`), "Jump" (Space), "Grab" when `state.canGrab` else "Cut" (KeyE; label "Open" is not needed), "Build" (KeyB), "Tool" (KeyQ, only when more than one tool is owned), "Craft" (Tab), "Bonk" (KeyF), "Scope" (KeyT, only with `hasTelescope`), and "Cast off" (KeyC, only while `sea.docked`).
     - **build**: main "Place" (mouse 0), "Remove" (mouse 2), "Next" (KeyR), "Done" (KeyB), "Jump" (Space).
     - **telescope**: "Chart" (KeyC), "Close" (KeyT).
     - **craft**: only "Close" (Tab), top-right; the craft menu's own buttons are tapped directly.
  6. Never cover the HUD's craft panel or title screen: in 'craft' show only the Close button; in 'title' show nothing.

## Contract
`export function createTouch(ctx: Ctx): System` (unchanged). main.ts calls it every frame after the HUD. It only talks to the game through `ctx.input.virtual` and reads `ctx.state`.

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/touch.ts`.

## Out of scope
Every file except games/gnaft/src/touch.ts.

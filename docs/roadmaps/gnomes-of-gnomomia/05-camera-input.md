Epic: 2, Systems
Depends on: none

## Environment
Read `docs/roadmaps/gnomes-of-gnomomia/00-environment.md` first; it applies in full.

## Goal
Old-school controls: a RuneScape-style orbit camera (arrow keys, middle-drag, wheel zoom), left-click to walk / attack / talk / take, right-click option menus with Examine, mouse-over text, a click marker, spell and close hotkeys, and long-press menus on touch screens.

## Read first
- `games/gnomes-of-gnomomia/src/config.ts`: `TUNING` (camera* values), `ENEMIES`, `NPCS`, `Entity`, `UI`.
- `games/gnomes-of-gnomomia/src/camera.ts` and `src/input.ts`: the stubs you replace.

## Change
### `games/gnomes-of-gnomomia/src/camera.ts`
- State: `yaw` (start 0), `pitch` (`TUNING.cameraPitchDefault`), `distance` (`TUNING.cameraDistanceDefault`).
- Keys (window keydown/keyup, ignore when `document.activeElement` is an input or textarea): ArrowLeft/ArrowRight turn yaw at `TUNING.cameraKeySpeed` rad/s while held; ArrowUp/ArrowDown change pitch at the same rate (Up = higher). `preventDefault` on arrow keys.
- Middle mouse (button 1) drag on the canvas: `yaw -= dx * 0.008`, `pitch += dy * 0.006`; `preventDefault` on that pointerdown (no browser autoscroll).
- Wheel on the canvas: `distance *= e.deltaY > 0 ? 1.1 : 1 / 1.1`, `preventDefault` (listener `{ passive: false }`).
- Clamp pitch to `[cameraPitchMin, cameraPitchMax]` and distance to `[cameraDistanceMin, cameraDistanceMax]`.
- `updateCamera(dt, target)`: focus = target + (0, 1, 0); desired = focus + `(sin(yaw)*cos(pitch)*d, sin(pitch)*d, cos(yaw)*cos(pitch)*d)`; keep desired.y >= `heightAt(desired.x, desired.z) + 0.8` (`heightAt` from `'./world'`); on the first call snap, after that `camera.position.lerp(desired, 1 - Math.exp(-12 * dt))`; `camera.lookAt(focus)`.

### `games/gnomes-of-gnomomia/src/input.ts`
Imports: `allEntities, entityFromObject` from `'./entities'`; `getGroundMesh` from `'./world'`; `player, walkTo, interact` from `'./player'`; `castSpell` from `'./combat'`; `setHoverText, showContextMenu, hideContextMenu, type MenuOption` from `'./ui/hud'`; `isDialogueOpen, closeDialogue` from `'./ui/dialogue'`; `closeShop` from `'./ui/shop'`; `say` from `'./events'`; config.
- Picking: a `THREE.Raycaster` from the camera through the pointer (NDC from the canvas's bounding rect). Targets = the `object` of every entity in `allEntities()` with `!dead && object.visible`, plus `getGroundMesh()`; `intersectObjects(targets, true)`. The first hit that belongs to an entity (`entityFromObject`) wins; otherwise the first ground hit gives a walk point; nothing = no pick.
- Default action per entity: enemy → label `` `Attack ${name} (level ${level})` ``, `interact('attack', id)`; npc → `` `Talk-to ${name}` ``, `interact('talk', id)`; loot → `'Take Loot'`, `interact('take', id)`. Ground → `'Walk here'`, `walkTo(x, z)`.
- Hover: on pointermove remember the pointer; in `updateInput(dt)` (once per frame) pick and `setHoverText(defaultLabel)`; `setHoverText(null)` when nothing is under the pointer. Set `canvas.style.cursor = 'pointer'` over entities, `'default'` otherwise.
- Left click (button 0 pointerdown + pointerup within 8 px): ignore while `player.dead`. `hideContextMenu()`; if `isDialogueOpen()` and the click is not on an NPC, `closeDialogue()`. Run the default action. Show a click marker at the hit point: an X of two thin flat boxes (`BoxGeometry(0.6, 0.02, 0.1)` rotated ±45°), yellow `0xffe14f` for a walk, red `0xff3030` for an entity, `MeshBasicMaterial`, sitting 0.05 above the point; it shrinks and disappears over 0.5 s (animate in `updateInput`). Add it to the scene from `initInput`.
- Right click (`contextmenu` on the canvas, `preventDefault`): build `MenuOption[]`: for an entity: its default action first, then `` `Examine ${name}` `` (says `NPCS[defId].examine` / `ENEMIES[defId].examine` / `'A small sack of loot.'` with `say(text, UI.textWhite)`), then `'Walk here'` (walks to the ground point under the pointer, if any). For ground: `'Walk here'`, then `'Cancel'` (does nothing). Call `showContextMenu(e.clientX, e.clientY, options)`.
- Touch: a touch pointer held 500 ms without moving 10 px opens the same right-click menu (and the following pointerup does nothing else). A short tap is a left click.
- Keys (window keydown, ignore in inputs/textareas, and ignore `'1'`/`'2'` while `isDialogueOpen()` because the dialogue uses number keys): `'1'` → `castSpell('flare')`, `'2'` → `castSpell('mend')`, `'Escape'` → `hideContextMenu()`, `closeDialogue()`, `closeShop()`.

## Contract
All exports keep their stub signatures. Use only the imported functions listed above from other modules (they exist now as stubs).

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` shows no errors in `src/camera.ts` or `src/input.ts`.

## Out of scope
`src/ui/hud.ts`, `src/player.ts`, `src/entities.ts`, `src/world.ts` and all other files.

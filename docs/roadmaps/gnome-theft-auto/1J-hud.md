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
`games/gnome-theft-auto/src/hud.ts` draws the HUD: Hat Watch heat (three gnome hats), dryness and water-tank bars, current gun, vehicle name, soaked counter, crosshair, the enter/steal prompt, toasts, a big banner and a minimap, sized for both a phone and a desktop.

## Read first
- `games/gnome-theft-auto/src/types.ts`: `Hud`, `HudState`, `Blip`.
- `games/gnome-theft-auto/src/config.ts`: `WORLD_HALF`, `ROAD_LINES`, `ROAD_WIDTH`, `BASE`, `GUNS`, `MAX_HEAT`.
- `games/gnome-theft-auto/src/hud.ts`: the stub (keep `export function createHud(ui: HTMLElement): Hud`).
- `games/gnome-theft-auto/src/main.ts`: `hud.set(...)` is called EVERY frame; `toast` and `banner` now and then.
- `packages/prefabs/README.md`: `prefabIconElement(id, emoji, size)`.

## Change
`games/gnome-theft-auto/src/hud.ts` only.

- Append ONE container `div#gta-hud` to `ui` (`position: fixed; inset: 0; pointer-events: none`), with a `<style>` element for its classes (prefix every class with `gta-`). Never restyle or hide `ui` itself. All text white with a dark text-shadow, font `system-ui`, bold.
- Safe areas: pad with `env(safe-area-inset-top/left/right)`.
- Top-left panel: "HAT WATCH" label and `MAX_HEAT` (3) small gnome-hat icons (inline SVG triangle with a brim, 22 px), filled navy `#1f3a93` with a white outline when `i < heat`, grey and translucent otherwise; the lit hats pulse (CSS animation) when heat ≥ 1. Under it: a **Dry** bar (`dryness`, blue→ dark blue as it drops) and a **Tank** bar (`tank`, light blue), 120 px wide; the gun name with its icon (`prefabIconElement(GUNS[kind].prefab, '💦', 28)` — pick the kind whose `GUNS[kind].name === state.gun`; rebuild the icon only when the gun changes; the prefab may not exist yet when you test: wrap in try/catch and fall back to the emoji); `Soaked: N`.
- Top-right: minimap canvas, 128 px (96 px when `innerWidth < 420`), round corners. Draw a static background once to an offscreen canvas: grass, roads (from `ROAD_LINES`, `ROAD_WIDTH`, full world `WORLD_HALF`, skipping inside the base like the world: x > BASE.minX && z < BASE.maxZ, except the x = 100 road north of BASE.maxZ), base rectangle in sand colour. Map world to canvas with `s = size / (2 * WORLD_HALF)`: canvas x = `(x + WORLD_HALF) * s`, canvas y = `(WORLD_HALF - z) * s` (+z is up on the map). Each frame: draw the background, the blips (3 px dots, `blip.color`), and the player as a small white arrow pointing along `player.yaw` (forward = (sin yaw, cos yaw) in world → on canvas (sin, -cos)).
- Bottom-centre (above `env(safe-area-inset-bottom) + 120px` so touch buttons don't cover it): the vehicle name when driving, and the `prompt` text in a dark pill when not null. Desktop shows `E: ` before the prompt (`matchMedia('(pointer: fine)')`).
- Crosshair: a small white ring in the screen centre, shown only when `vehicle === null`.
- `online`: small text bottom-left when not null.
- `toast(text, ms = 2600)`: stacked pills top-centre (max 4, oldest removed), fade out.
- `banner(text, ms = 2000)`: big centred text (clamp(28px, 7vw, 64px)), scale-in and fade-out.
- First 8 seconds: a help line under the top-left panel: desktop "WASD move · click + mouse look · click/F squirt · E steal · Space jump · Q swap"; touch "Stick to move · drag to look · Squirt · Enter to steal".
- Performance: `set()` runs every frame; only write to the DOM when a value changed (compare to the last value). Redraw the minimap every frame is fine.
- Must fit 390x844 portrait and 844x390 landscape without overlapping itself.

## Contract
`createHud(ui): Hud` with `set`, `toast`, `banner` exactly as in `types.ts`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/hud.ts`.

## Out of scope
Every other file. Touch buttons are `input.ts` (another worker): keep the bottom-right corner (220x260 px) and bottom-left (180x180 px) free.

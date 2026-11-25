Epic: E05-2 Interiors and rooftops: engine pieces
Depends on: none

## Environment
Repo root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a89501009f27d94ba` (a git worktree; stay in it).
Game: `games/gnome-theft-auto` (Vite + TypeScript + three.js). Git Bash; if `node` is missing:
`export PATH="/c/Program Files/nodejs:$PATH"`. Keep LF line endings. Do not commit.
Other workers are editing other files at the same time (kit.ts is being written in parallel: code against its exported
signatures only). Only change the files listed under Change. Keep every exported signature exactly as it is.

## Goal
`src/interiors/runtime.ts` makes interiors enterable: a door prompt for every defined interior, a fade, building the
room on entry and disposing it on leaving, in-room action spots, indoor light, ambience, and the module functions
`enterInterior / leaveInterior / currentInterior / onInteriorChange`.

## Read first
- `games/gnome-theft-auto/src/interiors/runtime.ts`: the stub (keep `InteriorDeps`, `Interiors`, `createInteriors`, `emitInteriorChange` and the four module functions; the listeners are already module-level).
- `games/gnome-theft-auto/src/interiors/types.ts` and `registry.ts`: `InteriorDef` (`door`, `exit`, `locked`, `onEnter`, `onLeave`, `ambience`, `hiddenDoor`, `prompt`), `onInteriorDefined`, `interiorById`, `PlacedInterior.origin`/`.theme`.
- `games/gnome-theft-auto/src/interiors/kit.ts`: `createKit(placed) -> { kit, build }` (build.boxes LOCAL, build.spots LOCAL, build.spawn, build.windows) and `disposeGroup(group)`.
- `games/gnome-theft-auto/src/interactables.ts`: `addInteractSpot({ x, z, y?, prompt, run })` returns a remover; spots are answered by the E key / touch action button (range 3.6 m, never in a vehicle).
- `games/gnome-theft-auto/src/sound/bus.ts`: `setAmbienceOverride(bed | 'silent' | null)`.

## Change
- `games/gnome-theft-auto/src/interiors/runtime.ts`:
  - On `createInteriors(deps)`: `onInteriorDefined(p => ...)` adds, for every def without `hiddenDoor`, a world door spot
    `addInteractSpot({ x: def.door.x, z: def.door.z, prompt: def.prompt ?? 'Enter ' + def.name, run: () => { enter(def.id); return true; } })`.
  - `enter(id)`: refuse (return false) when: unknown id; already inside or a transition is running; `deps.player.vehicle`;
    `deps.heat() >= 1` (toast via `deps.hud.toast`: "The door stays shut with the Hat Watch on your tail."); `def.locked?.()`
    returns a string (toast it). Otherwise: `deps.play('door')`, fade to black (below), then at full black:
    1. `const { kit, build } = createKit(placed); def.build(kit);` place `kit.group.position.set(origin.x, 0, origin.z)`, `deps.scene.add(kit.group)`.
    2. The first time this id is built, push its boxes offset to world (`minX + origin.x` ... ) into `deps.world.boxes`
       and remember that (never push twice: the boxes stay; they are far from the map). Do not remove boxes on leaving.
    3. Add every `build.spots` entry as `addInteractSpot({ x: origin.x + s.x, z: origin.z + s.z, prompt: s.prompt, run: () => { s.run(); return true; } })`; keep the removers.
    4. Teleport: spawn = `build.spawn ?? { x: 0, z: 0, yaw: 0 }` -> `deps.teleport(origin.x + spawn.x, origin.z + spawn.z, spawn.yaw)`.
    5. `setAmbienceOverride(def.ambience ?? 'silent')`; set current; `def.onEnter?.()`; `deps.unlock('gta-home-sweet-hovel')`; `emitInteriorChange(id)`; fade back in.
  - `leave(to?)`: only when inside and not mid-transition. `deps.play('door')`, fade out; at black: remove the spots
    (call the removers), `deps.scene.remove(group)`, `disposeGroup(group)`, `setAmbienceOverride(null)`, teleport to
    `to ?? def.exit` (`deps.teleport(x, z, yaw, to?.y)`), clear current, `def.onLeave?.()`, `emitInteriorChange(null)`; fade in.
  - `home()`: null outside; inside: `{ x: def.exit.x, y: 0, z: def.exit.z, yaw: def.exit.yaw }` (y may be 0: callers only use x, z).
  - `update(dt)`: advance the fade; while inside and not fading out, re-apply the indoor light every frame (the
    atmosphere resets the lights each frame before this runs): `deps.world.hemi` (if present) colour = `theme.light`,
    groundColor = `theme.floor`, intensity 1.25; `deps.world.sun` (if present) intensity `Math.min(sun.intensity, 0.45)`.
    Tint `build.windows` pane materials: lerp `0xbfe3ff` (day) to `0xffb860` (night) by `deps.night()`.
    Do NOT add any THREE light to the scene (a new light recompiles every material in the world).
  - Fade: one `div` you create and append to `deps.ui` (never restyle `#ui` itself): `position:fixed; inset:0; background:#000; opacity:0; pointer-events:none; transition:none; z-index:30`.
    Drive opacity from `update(dt)`: 0 -> 1 over 0.25 s, do the swap at 1, then 1 -> 0 over 0.3 s. Guard
    `typeof document === 'undefined'` (tests): then do the swap immediately with no fade.
  - Listen once for `window` event `'gta:interior-say'` (`detail: { name?: string; line: string }`) and toast
    `` `${name}: "${line}"` `` (or just the line when no name) via `deps.hud.toast(text, 4000)`. Guard `typeof window`.
  - Keep the module functions working through the `active` instance (already in the stub).
- `games/gnome-theft-auto/src/interiors/runtime.test.ts` (new): with no DOM (vitest node env), `resetInteriorsForTest()`,
  `defineInterior` a test room (`build(kit) { kit.room(); kit.door(4.8, 0, -Math.PI / 2); }`), a fake deps object
  (player `{ vehicle: null, x: 0, y: 0, z: 0, health: 1 }` cast `as never`, world `{ boxes: [] }`, `teleport` that sets
  player.x/z, `heat: () => 0`, `night: () => 0`, `hud.toast` spy, scene `new THREE.Scene()`, ui `{} as never`), then:
  `enter('t')` true -> `update(0.016)` -> `current() === 't'`, player x >= 5000, world.boxes has 4 boxes;
  `leave()` -> `update(0.016)` -> current null, player at the exit; enter again -> boxes still 4 (not pushed twice);
  a heat of 1 refuses entry and toasts. Note: `addInteractSpot` adds to a module-level list; that is fine in a test.

## Contract
```ts
export interface InteriorDeps { scene; ui; world; player; hud; teleport(x, z, yaw, y?); heat(); night(); play(sfx); unlock(id) }
export interface Interiors { enter(id): boolean; leave(to?): void; current(): string | null; home(): {x,y,z,yaw} | null; update(dt): void; onChange(cb): () => void }
export function createInteriors(deps: InteriorDeps): Interiors;
export function enterInterior(id: string): boolean;
export function leaveInterior(to?: { x: number; y: number; z: number; yaw: number }): void;
export function currentInterior(): string | null;
export function onInteriorChange(cb: (id: string | null) => void): () => void;
```
Achievement id unlocked on every entry (the tracker ignores repeats): `gta-home-sweet-hovel`.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` passes.
- `npx vitest run src/interiors/runtime.test.ts` passes (it needs kit.ts from a parallel worker; if kit.ts is still a
  stub when you test, your box-count assertions may fail only for that reason: say so in your report).

## Out of scope
kit.ts, registry.ts, types.ts, rooftops*.ts, roofLife.ts, showcase/*.ts, app.ts, interactables.ts.

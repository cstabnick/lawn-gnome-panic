Epic: E05-2 Interiors and rooftops: engine pieces
Depends on: none

## Environment
Repo root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a89501009f27d94ba` (a git worktree; stay in it).
Game: `games/gnome-theft-auto` (Vite + TypeScript + three.js). Git Bash; if `node` is missing:
`export PATH="/c/Program Files/nodejs:$PATH"`. Keep LF line endings in files you write. Do not commit.
Other workers are editing other files of this game at the same time (runtime.ts, rooftopsBuild.ts, roofLife.ts,
showcase/*.ts, quests/*). Only change the files listed under Change. Keep every exported signature exactly as it is.

## Goal
`src/interiors/kit.ts` builds real furnished rooms: the `InteriorKit` that each interior's `build(kit)` uses (floor,
walls, ceiling, door, prefab furniture, architecture blocks, windows, signs, spots, residents, stairs).

## Read first
- `games/gnome-theft-auto/src/interiors/types.ts`: `InteriorKit`, `InteriorBuild`, `PutOpts`, `InteriorNpc` (the contract, verbatim, do not change).
- `games/gnome-theft-auto/src/interiors/kit.ts`: the stub you replace (keep `createKit` and `disposeGroup` signatures).
- `games/gnome-theft-auto/src/interiors/registry.ts`: `PlacedInterior` (`def`, `origin`, `theme`), `themeOf`.
- `games/gnome-theft-auto/src/cutscene/rooms.ts`: `fitPrefab(id, size, by)` (how to scale a prefab to a size with `THREE.Box3`) and the room shell boxes.
- `games/gnome-theft-auto/src/gnomes.ts`: `makeGnome(parent, look)` returns a `GnomeModel` (`model.object`); `gnomeState(x,y,z,yaw,speed,sitting)` + `model.update(state, dt)` poses it (call once with dt 0 to pose it standing or sitting).

## Change
- `games/gnome-theft-auto/src/interiors/kit.ts`: implement `createKit(placed)` and `disposeGroup(group)`.
  Local coordinates: origin = room centre on the floor, +x east, +z south, y up. The runtime places `group` at the
  pocket origin and offsets `build.boxes` itself, so record boxes in LOCAL coordinates.
  - `room(opts)`: size = opts or `kit.size` (`w` along x, `d` along z, `h`); theme = `themeOf(opts.theme)` or `kit.theme`.
    Floor: a `THREE.BoxGeometry(w + 0.6, 0.2, d + 0.6)` top at y = 0 (centre y -0.1), `MeshStandardMaterial({ color: theme.floor, roughness: 0.9 })`.
    Four walls and a ceiling made as **single-sided planes facing into the room** (`THREE.PlaneGeometry`, default
    `FrontSide`, rotated so the front faces the room centre), so a camera outside a wall sees straight through it.
    Wall colour `theme.wall`, ceiling `theme.ceiling` at y = h. Skirting: a strip 0.12 high on each wall, 0.03 in front
    of the wall plane (planes, front facing in), colour `theme.trim`. No mesh casts shadows (`castShadow = false`).
    Wall colliders: four boxes 0.4 thick just outside the inner size, `h` = room h + 2, pushed to `build.boxes`:
    north `{minX:-w/2-0.4, maxX:w/2+0.4, minZ:-d/2-0.4, maxZ:-d/2, h}`, south mirrored, west `{minX:-w/2-0.4, maxX:-w/2, minZ:-d/2, maxZ:d/2}`, east mirrored.
    Calling `room()` again replaces nothing (first call wins; later calls are ignored).
  - `door(x, z, yaw)`: a door frame (two posts 0.15 x 2.4 x 0.15 and a lintel, colour `theme.trim`) plus a dark door
    panel plane 1.2 x 2.2 (colour 0x5d4037) 0.05 in front of the wall, facing yaw (yaw 0 faces +z: the plane's normal is
    `(sin yaw, 0, cos yaw)`). Sets `build.exitDoor = {x, z, yaw}`; if `build.spawn` is null set it to 1.5 m in front:
    `{ x: x + 1.5*sin(yaw), z: z + 1.5*cos(yaw), yaw }`. Push spot `{ id: 'exit', x, z, prompt: 'Leave ' + kit.name, run: () => leaveInterior() }`
    (`import { leaveInterior, enterInterior } from './runtime'`).
  - `spawn(x, z, yaw)`: `build.spawn = {x, z, yaw}` (always wins over door's default).
  - `put(prefabId, x, z, yaw = 0, opts = {})`: `buildPrefab(prefabId, { lights: false, shadows: false, tint: opts.tint })`
    from `@lawn/prefabs`. If `opts.size`: scale like `fitPrefab` (widest side, or height when `by === 'h'`). Stand it on
    `y = opts.y ?? 0` (subtract the scaled bounding box min.y so its bottom touches the floor). Rotate `rotation.y = yaw`.
    Add to group. If `opts.solid !== false`: compute the world-axis-aligned `Box3` after placing
    (`obj.updateMatrixWorld(true)`; `new THREE.Box3().setFromObject(obj)`) and push `{minX,maxX,minZ,maxZ,h: max.y}`, but
    skip the collider when the box is lower than 0.25 m (rugs). Flat things: when the placed object's height is under
    0.08 m, apply `flatLayer(material, LAYER.decal)` (`import { flatLayer, LAYER } from '@lawn/depth'`) to every mesh
    material so it does not z-fight the floor. Return the object. Unknown prefab id: `console.warn` and return an empty Group.
  - `block(w, h, d, x, z, opts)`: a `BoxGeometry(w, h, d)` mesh, colour `opts.color ?? theme.trim`, emissive `opts.emissive ?? 0`,
    bottom at `opts.y ?? 0`. Collider when `opts.solid !== false` (`h` = top y). Return the mesh.
  - `window(x, z, yaw, w = 1.6, h = 1.2, y = 1.1)`: a frame (4 thin boxes, `theme.trim`) and a pane plane
    `MeshBasicMaterial({ color: 0xbfe3ff })` facing yaw, 0.04 in front of the wall. Push the pane mesh to `build.windows`
    (the runtime tints it: day sky blue, night warm amber).
  - `sign(text, x, y, z, yaw, opts)`: draw `text` on a canvas (512 wide, height from aspect w:h, default w 1.6, h 0.6),
    background `opts.bg ?? 0x2b2b2b`, text `opts.fg ?? 0xf5f0e1`, bold sans-serif, lines split on `\n`, centred, font
    size fitted so the longest line fits. `THREE.CanvasTexture` on a `PlaneGeometry(w, h)` with `MeshBasicMaterial({ map })`
    facing yaw at (x, y, z). Guard: if `document` is undefined (tests), skip the texture and use a plain coloured plane.
  - `spot(s)`: push to `build.spots`.
  - `npc(n)`: build `makeGnome(group, { ...DEFAULT_LOOK, ...n.look })` (`DEFAULT_LOOK` from `../config`), pose it with
    `model.update(gnomeState(n.x, 0, n.z, n.yaw, 0, !!n.sit) as never, 0)` (the second-to-last arg 0 = standing still;
    sitting when `n.sit`), then set `model.object.position.set(n.x, 0, n.z)` and `rotation.y = n.yaw`. Push `n` to
    `build.npcs`. If `n.line`: push spot `{ id: 'npc-' + n.id, x: n.x, z: n.z, prompt: 'Talk to ' + (n.name ?? 'the gnome'), run: () => sayLine(n) }`
    where `sayLine` fires `window.dispatchEvent(new CustomEvent('gta:interior-say', { detail: { name: n.name, line: n.line } }))`
    (the runtime turns that into a toast). Add a body collider `{ x±0.35, z±0.35, h: 1.2 }`.
  - `stairsTo(x, z, to, prompt)`: a dark doorway plane (1.2 x 2.2, 0x3e2723) is NOT drawn; instead push spot
    `{ id: 'stairs-' + (typeof to === 'string' ? to : 'out'), x, z, prompt: prompt ?? (typeof to === 'string' ? 'Go through' : 'Go out'), run }`
    where run = `typeof to === 'string' ? () => enterInterior(to) : () => leaveInterior(to)`.
  - `disposeGroup(group)`: traverse; dispose every `geometry`, every material (arrays too) and any `material.map`
    texture. Do not dispose prefab materials twice (wrap in try/catch, it is fine to call dispose twice in three.js).

## Contract
```ts
export function createKit(placed: PlacedInterior): { kit: InteriorKit; build: InteriorBuild };
export function disposeGroup(group: THREE.Object3D): void;
```
`build.boxes` local; `build.spots` includes 'exit' from `door()`; spawn default in front of the door.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` passes.
- A small test `games/gnome-theft-auto/src/interiors/kit.test.ts` (vitest, node env: no `document`) builds a fake
  `PlacedInterior` (`{ def: { id:'t', name:'Test', door:{x:0,z:0,yaw:0}, exit:{x:0,z:0,yaw:0}, size:{w:10,d:8,h:3}, theme:'shop', build(){} }, origin:{x:5100,y:0,z:5100}, large:false, theme: INTERIOR_THEMES.shop }`),
  calls `room()`, `door(4.8, 0, -Math.PI/2)`, `put('bed', 0, 0)`, `put('rug', 1, 1)`, and checks: 4 wall boxes + 1 bed box (rug adds none),
  `build.exitDoor` set, `build.spawn` ≈ {x: 3.3, z: 0}, an 'exit' spot exists. `npx vitest run src/interiors/kit.test.ts` passes.

## Out of scope
runtime.ts, registry.ts, types.ts, rooftops*.ts, showcase/*.ts, app.ts.

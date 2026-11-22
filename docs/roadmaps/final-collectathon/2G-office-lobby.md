Epic: 2 Systems
Depends on: none (Epic 1 is done: the game builds with stubs)

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\stingaree` (a git worktree). Node: if not found, `export PATH="/c/Program Files/nodejs:$PATH"` in Git Bash.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`.
- Eleven other workers are filling other files in `games/final-collectathon/src/` right now. Edit only `src/office.ts`, `src/floors/lobby.ts`, and `games/final-collectathon/package.json` (only to add `"@lawn/depth": "*"` to `dependencies`). `tsc` may show errors in their files mid-edit; only yours must be clean.
- Repo rules:
  - Furniture and props come from `@lawn/prefabs` (`buildPrefab(id, { tint?, scale? })`, a `THREE.Group` standing on y = 0, front facing +z). Never hand-build furniture. Never dispose prefab meshes (their geometry/materials are shared caches): only remove them from the scene. Walls, floor, lift doors, front doors and windows are architecture: build those yourself from boxes.
  - No z-fighting: anything flat laid on the floor (a rug, a doormat) gets `flatLayer(material, LAYER.decal)` from `@lawn/depth`; boxes that touch must not share a face (overlap them by 0.01 or leave a gap, e.g. wall corners overlap rather than meet flush).
  - The player is the player's gnome (handled elsewhere); NPC gnomes use `createGnomeModel(look)` from `@lawn/gnome`.

## Goal

Replace the stub `src/office.ts` with the floor builder that turns any `FloorLayout` into a lit, walkable office
floor (outer and interior walls, a lift, the lobby's glass front doors, windows onto the sky, prefab props with
colliders, NPC gnomes), and write the real reception layout `src/floors/lobby.ts`.

## Read first

- `games/final-collectathon/src/office.ts` (stub), `src/floors/lobby.ts` (stub) and `src/types.ts`: `FloorLayout`, `PropPlacement`, `NpcPlacement`, `WallSeg`, `Interactable`, `Floor`, `Box`.
- `games/final-collectathon/src/config.ts`: `TUNING.wallHeight` (3), `TUNING.wallThickness` (0.2), `PRIMROSE_LOOK`.
- `packages/gnome/src/types.ts`: `GnomeLook`, `GNORMAN_LOOK`, `PlayerState`; `GnomeModel.update(state, dt)` places and animates a model (pass `grounded: true`, zero velocity, `sitting` false).
- `packages/depth/README.md`: `flatLayer`, `LAYER`.

## Change

### `src/office.ts`: `buildFloor(scene, id)`

Keep `if (id === 'sky') return buildSkyFloor(scene);` (sky.ts is another worker's). For office floors, from `LAYOUTS[id]`:

- **Scene look**: `scene.background = new THREE.Color(0xdfe7ef)` (and `scene.fog = null`). Lights inside the floor group: a `HemisphereLight(0xffffff, 0x9a8f7a, 1.6)` and a `DirectionalLight(0xfff4e0, 1.8)` from above-front (`position (6, 14, 8)`) with `castShadow`, shadow camera bounds covering the floor (`left/right/top/bottom = ±max(w, d)/2 + 2`), `shadow.mapSize 2048`.
- **Floor**: a box `w x 0.2 x d` with its top at y = 0 (`floorColor`, `receiveShadow`). A slightly darker carpet border is optional; if you add one, use `flatLayer(mat, LAYER.tint)`.
- **Outer walls** (`wallColor`, `castShadow`, `receiveShadow`): north (z = -d/2), west, east are `TUNING.wallHeight` tall and `wallThickness` thick, placed outside the floor rectangle (their inner face on the floor edge). The **south wall is a low 0.5 m cutaway** (the camera looks in from +z, like a dollhouse). Corners: extend the side walls by the thickness so walls overlap at corners instead of meeting flush.
  - **Lift** in the north wall at `x = layout.elevatorX`: a 2.0 m wide, 2.4 m tall opening with a brushed-steel frame (boxes, `0xb8c0c8`), two door slabs (`0x9aa4ae`) that slide apart sideways when open (animate in `update(dt)` toward the open/closed target at 2.5 m/s), a small lit panel beside it with an up/down arrow (`MeshBasicMaterial`), and a dark box behind the opening (the car). The doors are colliders while closed; the opening is always walkable into 0.6 m (the director moves the player in).
  - **Front door** (only when `frontDoorX` is set) in the south cutaway at that x: a 2.4 m wide frame, full 2.6 m tall, with two glass panels (`MeshStandardMaterial({ color: 0xbfe6ef, transparent: true, opacity: 0.35 })`) that slide apart when `setFrontDoorOpen(true)`. While closed, the panels are colliders. Behind the door (z > d/2) put a 3 x 3 m bright white glowing plane facing -z (`MeshBasicMaterial`, `0xffffff`) that is hidden while closed and shown while open: "the light outside". When open, the colliders go away so the player can walk out to about z = d/2 + 1.5 (add a walkable floor slab 3 x 0.2 x 3 outside the door at y top 0).
  - **Windows** (when `layout.windows`): on the west, east and north walls (not over the lift), every 4 m, a 2 m wide x 1.4 m tall pane set 1 m above the floor: a pale sky-blue `MeshBasicMaterial(0xbfe3ff)` plane on the inner wall face lifted by `flatLayer(..., LAYER.decal)`, plus a frame. Behind the north wall, far away (`(0, 40, -120)`), a big sand-coloured sphere (radius 18, `0xe8d6a0`, `MeshBasicMaterial`) with a blue band (a torus or a slightly larger flattened sphere, `0x4aa8e8`) and a faint glow: Shellshore, the beach planet, seen through the windows. Put it in the floor group so it goes with the floor.
- **Interior walls** from `layout.walls`: each axis-aligned segment becomes a box `TUNING.wallHeight` tall (use 1.6 m: these are cubicle-height partitions, so the camera sees over them), `wallThickness` thick, plus a collider.
- **Props**: `buildPrefab(p.prefab, { tint: p.tint, scale: p.scale })` inside try/catch (unknown id: `console.warn` and push an empty `THREE.Group` so indices stay aligned). Position `(p.x, p.y ?? 0, p.z)`, `rotation.y = (p.rot ?? 0) * Math.PI / 180`, shadows on. `floor.props[i]` is that object. `solid` props get a collider from `new THREE.Box3().setFromObject(obj)` (shrink it by 0.05 on x and z). Keep a `propColliders: (Box | null)[]` per index so `removeProp(i)` can hide the object and drop its collider from `floor.colliders`.
- **NPCs**: for each `NpcPlacement`, `createGnomeModel({ ...GNORMAN_LOOK, ...npc.look })` (the look's `hair` must be `null` or `{ color, style: 'pigtails' }`), placed at `(x, 0, z)` with `facing`. Store in `floor.npcs[npc.id]`. In `update(dt)` call `model.update({ position, velocity: zero, facing, grounded: true, jumpsUsed: 0 }, dt)` and add a gentle idle (the whole object bobs 1 cm at 0.5 Hz). An NPC with `asleep`: tilt `model.rig.rotation.x = 0.35` after update, and float a "z z z" sprite above its head (a `THREE.Sprite` with a `CanvasTexture` of the text, drifting up and fading in a 2 s loop). Each NPC is also a collider (0.6 x 1.1 x 0.6 box).
- **The lobby sign**: when `layout.id === 'lobby'`, add a sign on the north wall above the reception area reading `BUCKETWORTH & SONS` (line 1) and `Collectors, since before there was anything to collect` (line 2): a `CanvasTexture` on a 6 x 1.2 m plane on the wall's inner face, `flatLayer(..., LAYER.decal)`.
- **Colliders** (`floor.colliders: Box[]`): outer walls (the lift opening and an open front door excluded), interior walls, solid props, NPCs, closed doors. `groundAt()` returns 0.
- **dispose()**: remove the group from the scene; dispose the geometries, materials and textures YOU created (walls, floor, doors, windows, sprites, sign, planet). Do not dispose anything under a prefab object (`buildPrefab` result) or a gnome model's shared parts: dispose a gnome model by just removing it.

### `src/floors/lobby.ts`: the reception

`export const LOBBY: FloorLayout` with `id: 'lobby'`, `title: 'Reception'`, `w: 20`, `d: 16`, `floorColor: 0xc9b89a`, `wallColor: 0xece4d4`, `elevatorX: 0`, `frontDoorX: 0`, `windows: false`, and:
- `spawn: { x: 0, z: 5.5, facing: Math.PI }` (just inside the front door, facing the desk to the north).
- props (all `solid` unless noted): `reception-desk` at (0, -3) tint `0x8a5a3b`; `fc-nameplate` at (-0.75, -2.85) with `y: 0.73` (the desk top) not solid; two `couch` at (-6, 2) rot 90 and (6, 2) rot -90; `spiky-potted-plant` in the four corners (±8.8, ±6.8) and either side of the lift (±1.8, -7.3); `wall-clock` on the north wall at (4, -7.85) with `y: 2.2` not solid; `bookshelf` at (-8.6, -4) rot 90; `side-table` at (-6, 4.3) and (6, 4.3); `trophy-cup` on each side table (`y` = that table's top; read `side-table`'s parts in `packages/prefabs/src/catalog/furniture.ts` for its height) not solid; `flower-pot` at (±2.2, 6.5) by the front door.
- `npcs: [{ id: 'primrose', x: 0, z: -4.1, facing: 0, look: PRIMROSE_LOOK }]` (import `PRIMROSE_LOOK` from `../config`).
- `areas`: `'front-door': { x0: -1.5, z0: 6.6, x1: 1.5, z1: 8 }`, `outside: { x0: -1.5, z0: 8.3, x1: 1.5, z1: 9.6 }`, `reception: { x0: -3, z0: -2.6, x1: 3, z1: 0 }`, `waiting: { x0: -8, z0: -1, x1: 8, z1: 5 }`, `all: { x0: -9.5, z0: -7.5, x1: 9.5, z1: 7.5 }`.
- `interactables`: `{ id: 'secretary', label: 'Talk', x: 0, z: -2.1, radius: 1.6 }`, `{ id: 'nameplate', label: 'Read', x: -0.9, z: -2.1, radius: 0.9 }`, `{ id: 'clock', label: 'Look', x: 4, z: -7, radius: 1.2 }`.
- `walls: []`.

## Contract

```ts
export function buildFloor(scene: THREE.Scene, id: FloorId): Floor;   // office.ts
export const LOBBY: FloorLayout;                                       // floors/lobby.ts
```
`Floor` exactly as in `types.ts`. The chapter workers (next epic) write `floors/f1.ts`..`f4.ts` against this builder:
interior walls are 1.6 m partitions, the south wall is a 0.5 m cutaway, the lift is in the north wall at `elevatorX`,
`windows: true` shows Shellshore to the north. Lobby area names `front-door`, `outside`, `reception`, `waiting`,
`all` and interactable ids `secretary`, `nameplate`, `clock` are used by the prologue and ending scripts.

## Done when

- `npx tsc --noEmit -p games/final-collectathon` shows no errors in `src/office.ts` and `src/floors/lobby.ts`.
- Optional visual check (only you use port 5215): `npx vite --port 5215 --strictPort` from `games/final-collectathon`, open `http://localhost:5215/` and look at the reception (other modules may still be stubs), then stop the server.

## Out of scope

`floors/f1.ts`..`f4.ts`, `floors/index.ts`, `sky.ts`, every other file under `games/final-collectathon/` except `package.json`'s one dependency line, all packages.

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
`games/gnome-theft-auto/src/player.ts` is the player's own gnome: walks relative to the camera, jumps, collides with buildings, aims its water gun, sits in a mower while driving, and gets soaked.

## Read first
- `games/gnome-theft-auto/src/types.ts`: `Player`, `InputState`, `Vehicle`, `World`.
- `games/gnome-theft-auto/src/player.ts`: the stub (keep `export function createPlayer(scene: THREE.Scene, look: GnomeLook): Player`).
- `games/gnome-theft-auto/src/collide.ts`: `pushOutOfBoxes`, `clampToWorld`, `angleDiff`.
- `games/gnome-theft-auto/src/vehicles.ts`: use its exported `seatWorld(v, out)` and `exitPoint(v)` (another worker is rewriting that file's bodies; the signatures stay).
- `packages/gnome/src/types.ts` lines 100-160: `GnomeModel`, `PlayerState`, `CreateGnomeModelOptions`.

## Change
`games/gnome-theft-auto/src/player.ts` only.

- Model: `createGnomeModel(look, { overrideEquipment: ['hand'] })` from `@lawn/gnome` (the game's water gun replaces the customizer's hand item); `castShadow` on its meshes; `scene.add(model.object)`.
- `updateFoot(input, camYaw, dt, world)`:
  - Camera-relative move: forward `f = (sin camYaw, cos camYaw)`, right `r = (-cos camYaw, sin camYaw)`; `m = f * input.moveY + r * input.moveX`, clamp its length to 1; horizontal velocity = `m * PLAYER.walkSpeed`.
  - Facing: if `input.fire` is held, ease `yaw` toward `camYaw` fast (rate 20/s, so the gnome faces where it squirts); otherwise if moving, ease toward `Math.atan2(m.x, m.z)` at 12/s. Use `angleDiff`.
  - Jump: `input.jump && grounded` → `vy = PLAYER.jumpSpeed`. Gravity `PLAYER.gravity`. Ground is y = 0 (land: y = 0, vy = 0, grounded = true).
  - Collide: `pushOutOfBoxes(x, z, PLAYER.radius, world.boxes, y)` then `clampToWorld(x, z, world.half, PLAYER.radius)`.
  - Animate: `model.update({ position, velocity, facing: yaw, grounded, jumpsUsed: grounded ? 0 : 1, sitting: false }, dt)` (reuse one Vector3 for position and velocity, no per-frame allocation). AFTER update, if `input.fire`: raise the right arm forward to aim: `model.arms.right.rotation.x = -Math.PI / 2`.
- `updateRiding(dt)`: put the gnome on `this.vehicle`'s seat: `seatWorld(vehicle, tmp)` as position, `facing = vehicle.yaw`, `sitting: true`, `grounded: true`, zero velocity; `model.update(...)`. Keep `x, y, z, yaw` equal to the vehicle's (x, y, z, yaw) so the camera and the HUD follow.
- `enter(v)`: `vehicle = v`. `exit()`: stand at `exitPoint(vehicle)`, y = 0, vy = 0, yaw = vehicle.yaw, `vehicle = null`.
- `soak(amount)`: `dryness = Math.max(0, dryness - amount)`.
- `respawn(x, z, yaw)`: position there on the ground, dryness 1, vehicle null, vy 0.
- `hand()`: `model.arms.right`.
- `muzzle(out)`: `model.object.updateMatrixWorld(true)`, then `model.arms.right.localToWorld(out.set(0, -0.72, 0.02))` (the tip of the held gun). While riding, return the seat position + (0, 0.8, 0) instead.

## Contract
`Player` exactly as in `types.ts`; `createPlayer(scene, look)`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/player.ts`.

## Out of scope
Every other file. Do not build the gun (weapons.ts attaches it to `hand()`).

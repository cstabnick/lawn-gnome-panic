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
`games/gnome-theft-auto/src/weapons.ts` (two water guns: Squirt Pistol and Pump Soaker, held by the gnome, firing pooled water droplets with gravity that soak whatever they hit) and `games/gnome-theft-auto/src/fx.ts` (splashes, drips and short spray streams).

## Read first
- `games/gnome-theft-auto/src/types.ts`: `Weapons`, `Fx`, `HitTest`, `World`, `GunKind`.
- `games/gnome-theft-auto/src/config.ts`: `GUNS`, `GUN_ORDER`, `WATER`.
- `games/gnome-theft-auto/src/weapons.ts` and `src/fx.ts`: stubs (keep `createWeapons(scene: THREE.Scene, fx: Fx): Weapons` and `createFx(scene: THREE.Scene): Fx`).
- `games/gnome-theft-auto/src/collide.ts`: `insideBox`.
- `games/gnome-theft-auto/src/main.ts`: `weapons.update(dt, firing, muzzle, aim, hitTest, world)`; `fx.update(dt)` is called once per frame.

## Change
`games/gnome-theft-auto/src/fx.ts`:
- One `THREE.InstancedMesh` of small icosahedron particles (radius 0.06, `MeshBasicMaterial` colour 0x7fd3ff, transparent, opacity 0.8), capacity 500, `frustumCulled = false`. Particles: position, velocity, life; gravity 9; hide dead ones with a zero-scale matrix.
- `splash(x, y, z)`: 8 particles bursting up and outward (speed 2-4), life 0.5 s. `drip(x, y, z)`: 1 particle falling, life 0.6 s. Recycle the oldest when full.
- `spray(ax, ay, az, bx, by, bz)`: a pool of 16 thin stretched cylinders (radius 0.035, colour 0x9fe0ff, opacity 0.6) that show for 0.12 s between a and b (position at the midpoint, `quaternion.setFromUnitVectors(up, dir)`, `scale.y = length`), plus a `splash` at b with 30% chance.
- `update(dt)`: move particles, expire, fade sprays.

`games/gnome-theft-auto/src/weapons.ts`:
- Held gun: `attachTo(hand)` builds `buildHeld(GUNS[gun].prefab)` (from `@lawn/prefabs`) and adds it to `hand` at position (0, -0.32, 0.02) with `rotation.x = Math.PI` (the prefab's muzzle is +y; this points it along the arm). `switchGun()` moves to the next of `GUN_ORDER` and swaps the held model. `setVisible(v)` shows/hides it.
- Droplets: one `InstancedMesh` of spheres radius `WATER.dropRadius` (colour 0x5ec8ff, `MeshStandardMaterial` with emissive 0x1a5f8a, transparent opacity 0.85), capacity `WATER.maxDrops`, `frustumCulled = false`.
- `update(dt, firing, origin, dir, hitTest, world)`:
  - Firing: while `firing` and `tank >= spec.cost`, emit `spec.rate` droplets per second (accumulate fractional time). Each: position `origin`, velocity = `dir` rotated by a random angle within `spec.spread` (e.g. add a random vector of length `spec.spread` and normalise) times `spec.speed`, life `spec.life`. `tank -= spec.cost` per droplet. Track seconds since the last shot.
  - Refill: after `WATER.refillDelay` s without firing, `tank = Math.min(1, tank + WATER.refillPerSecond * dt)`.
  - Move: `vel.y -= WATER.gravity * dt`; `pos += vel * dt`. A droplet ends when: `hitTest(x, y, z)` returns true (count a hit, `fx.splash`), `y <= 0` (`fx.splash` at y 0.05), `insideBox(x, y, z, world.boxes)` (`fx.splash`), or its life runs out.
  - Return the number of hits this frame.
- No allocations per frame: reuse Vector3/Matrix4 scratch objects.

## Contract
`Weapons` and `Fx` exactly as in `types.ts`; constructor signatures as in the stubs.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/weapons.ts` and `src/fx.ts`.

## Out of scope
Every other file. What a droplet hits and what happens to it is main.ts's `hitTest` closure.

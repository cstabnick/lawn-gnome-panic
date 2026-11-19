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
`games/gnome-theft-auto/src/npcs.ts` fills the sidewalks with townsgnomes who stroll between walk points, and who — when hit by a water gun, scared by a speeding mower or pulled off their own mower — put their hands up and run away from whoever did it, dripping.

## Read first
- `games/gnome-theft-auto/src/types.ts`: `Npc`, `Npcs`, `Fx`, `World`, `Vehicle`.
- `games/gnome-theft-auto/src/config.ts`: `PEDESTRIANS`.
- `games/gnome-theft-auto/src/npcs.ts`: the stub (keep `export function createNpcs(scene: THREE.Scene, world: World, fx: Fx): Npcs`).
- `games/gnome-theft-auto/src/gnomes.ts`: `randomTownLook`, `randomGnomeName`, `makeGnome`, `poseHandsUp`, `clearHandsUp`, `gnomeState`.
- `games/gnome-theft-auto/src/collide.ts`: `pushOutOfBoxes`, `clampToWorld`, `angleDiff`.

## Change
`games/gnome-theft-auto/src/npcs.ts` only.

- Pedestrians: keep `list` at `PEDESTRIANS.count` townsgnomes, created lazily on the first `update` at random `world.walkPoints` within `PEDESTRIANS.recycleDistance` of the player (but not within 8 units of the player). Each gets `randomTownLook()`, `randomGnomeName()`, a model from `makeGnome(scene, look)`.
- States (per `update(dt, world, playerX, playerZ, vehicles)`):
  - `walk`: walk at `PEDESTRIANS.walkSpeed` toward `(targetX, targetZ)`, a random walk point within 30 units. On arrival: `idle` for 1-4 s, then pick a new target and `walk`.
  - `flee`: run at `PEDESTRIANS.fleeSpeed` directly away from `(fromX, fromZ)` (plus a small sideways wobble `Math.sin(t*3)*0.3`). `fleeTime -= dt`; at 0 go back to `walk` with a new target and call `clearHandsUp(model)`. If a box blocks the way (the push-out moved it), turn the run direction 90° for the rest of this flee.
  - Scare: a vehicle with `|speed| > 4` within `PEDESTRIANS.vehicleScare` that is heading toward the gnome (dot of its forward with the direction to the gnome > 0.5) makes a non-fleeing gnome flee from the vehicle (like `soak` but without making it wet).
- Movement: face the direction of travel (ease yaw with `angleDiff`, rate 10/s); `pushOutOfBoxes(x, z, 0.4, world.boxes)`; `clampToWorld`.
- Animate: `model.update(state, dt)` with a reused PlayerState-like object (position, velocity, facing, grounded true, jumpsUsed 0) — do not allocate per frame. AFTER update, while fleeing: `poseHandsUp(model, time)` (both arms up). That pose is the point of the game: soaked gnomes run away with their hands up.
- Wet: `soak()` sets `wet = 8`; while `wet > 0`, call `fx.drip(x + random ±0.2, 1.0, z + random ±0.2)` about 4 times a second.
- Recycle: a non-fleeing gnome farther than `recycleDistance` from the player jumps to a random walk point 30..80 units from the player (dry, `walk`). If `list.length > PEDESTRIANS.count + 10`, remove the farthest non-fleeing extras (`scene.remove(model.object)` and splice).
- `hitTest(x, y, z)`: the nearest gnome with horizontal distance < 0.5 and 0 ≤ y ≤ 1.2, else null.
- `soak(npc, fromX, fromZ)`: `fresh = npc.state !== 'flee' || npc.wet <= 0`; state `flee`, `fleeTime = PEDESTRIANS.fleeSeconds`, from = (fromX, fromZ), `wet = 8`; return `fresh`.
- `spawnFleeing(x, z, fromX, fromZ, look)`: a new gnome (look or `randomTownLook()`), already fleeing with hands up, pushed into `list`; return it.

## Contract
`Npcs` exactly as in `types.ts`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/npcs.ts`.
- By reading: a soaked gnome runs away from the shooter with both arms raised, then calms down after `fleeSeconds`.

## Out of scope
Every other file. Officers and guards are `police.ts`.

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
`games/gnome-theft-auto/src/police.ts` is the heat system: the Hat Watch (navy caps, yellow coats) send officers who chase the player and spray them with water when heat is 1+, and the Spade Guard (olive caps) defend Fort Sandpit. Soaked officers and guards give up, put their hands up and run.

## Read first
- `games/gnome-theft-auto/src/types.ts`: `Watch`, `WatchContext`, `Npc`, `Fx`, `World` (`base`, `walkPoints`, `boxes`).
- `games/gnome-theft-auto/src/config.ts`: `MAX_HEAT`, `HEAT`, `WATCH`.
- `games/gnome-theft-auto/src/police.ts`: the stub (keep `export function createWatch(scene: THREE.Scene, world: World, fx: Fx): Watch`).
- `games/gnome-theft-auto/src/gnomes.ts`: `randomTownLook({ hat, shirt })`, `randomGnomeName`, `makeGnome`, `poseHandsUp`, `clearHandsUp`.
- `games/gnome-theft-auto/src/collide.ts`: `pushOutOfBoxes`, `clampToWorld`, `angleDiff`.

## Change
`games/gnome-theft-auto/src/police.ts` only. Officers and guards are `Npc` objects (type from `types.ts`); keep extra per-unit data (hits, role `'officer' | 'guard'`, post, spray timer) in a `Map<number, ...>` keyed by `npc.id`.

- Heat: `addHeat(a)` clamps `heat` to [0, MAX_HEAT]. `clear()`: heat 0 and every officer leaves (removed). Cooling: track seconds since any officer or guard was within 30 units of the player; past `HEAT.coolDelay`, `heat -= HEAT.coolRate * dt` (not below 0).
- Officers: target count = `WATCH.officersPerLevel[Math.floor(heat)]`. Spawn missing ones at a `world.walkPoints` point between 25 and `WATCH.spawnDistance + 10` units from the player. Look: `randomTownLook({ hat: WATCH.hat, shirt: WATCH.coat })`, name `Officer ${randomGnomeName()}`. When over the target count (heat dropped), the extra officers walk away from the player and are removed once 60+ units away.
- Guards: one per `world.base.guardPosts` entry, created on the first update, look `randomTownLook({ hat: WATCH.guardHat, shirt: WATCH.guardCoat })`, name `Sentry ${randomGnomeName()}`. They stand at their post facing the gate. When the player is inside the base rectangle (or within 6 units of it while heat ≥ 2) they chase like officers but never leave the base rectangle (clamp them inside it, 1 unit from the walls); otherwise they walk back to their post.
- Chase (both): run toward the player at `WATCH.speed` (stop at 4 units); `pushOutOfBoxes(x, z, 0.4, world.boxes)`. Within `WATCH.sprayRange` and when the player is lower than y = 4: face the player, raise the right arm forward (`model.arms.right.rotation.x = -Math.PI / 2` after `model.update`), every 0.12 s call `fx.spray(x, 0.75, z, playerX, playerY + 0.7, playerZ)`, and add `WATCH.sprayPerSecond * dt` to this frame's soak total. Each officer and guard holds a `buildHeld('squirt-pistol')` (from `@lawn/prefabs`) on `model.arms.right`, at position (0, -0.32, 0.02) with `rotation.x = Math.PI` (muzzle along the arm).
- `update(dt, ctx, world)` returns the total soak for the player this frame (sum over spraying units). When `ctx.playerVehicle` is not null, chase the vehicle's position.
- Animate every unit with `model.update(...)` using one reused PlayerState-like object per unit (position, velocity, facing, grounded true, jumpsUsed 0).
- `hitTest(x, y, z)`: nearest officer/guard with horizontal distance < 0.5 and 0 ≤ y ≤ 1.2.
- `soak(o, fromX, fromZ)`: `hits++`, and `fx.drip(o.x, 1, o.z)`. When `hits` reaches `WATCH.soakHits` and it is not already fleeing: state `flee`, `fleeTime = WATCH.fleeSeconds`, from = (fromX, fromZ), return true. Otherwise return false.
  Fleeing units run away with `poseHandsUp(model, t)` applied after `model.update` (hands up!). A fleeing officer is removed when its time runs out (a fresh one may spawn later). A fleeing guard walks back to its post afterwards, with `hits = 0` and `clearHandsUp(model)`.

## Contract
`Watch` exactly as in `types.ts`. The player's dryness is not yours: return the soak amount; main applies it.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/police.ts`.

## Out of scope
Every other file. Pedestrians are `npcs.ts`; heat is ADDED by main.ts (`addHeat`), not by you, except cooling.

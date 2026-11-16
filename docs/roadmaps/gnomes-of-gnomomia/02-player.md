Epic: 2, Systems
Depends on: none

## Environment
Read `docs/roadmaps/gnomes-of-gnomomia/00-environment.md` first; it applies in full.

## Goal
RuneScape-style click-to-move: the player's gnome walks a grid A* path to a clicked point, or walks up to an entity and then attacks, talks or takes.

## Read first
- `games/gnomes-of-gnomomia/src/pathfind.ts` and `src/player.ts`: the stubs you replace.
- `games/gnomes-of-gnomomia/src/config.ts`: `TUNING` (walkSpeed, meleeRange, talkRange, takeRange), `SPAWN`, `PLAYER_LOOK`, `Entity`.
- `packages/gnome/src/types.ts` lines 95-140: `GnomeLook`, `PlayerState`, `GnomeModel` (the model faces +z at yaw 0; `update(p, dt)` animates legs and arms from `p.velocity`, and overwrites arm rotations every call).

## Change
### `games/gnomes-of-gnomomia/src/pathfind.ts`
`findPath(from, to, blocked)`:
- Grid of 1-unit cells; cell (i, j) has centre (i, j) (use `Math.round` to map a point to a cell).
- A* with 8 neighbours, cost 1 straight / 1.4142 diagonal, octile heuristic. A diagonal step is allowed only when both orthogonal neighbours are free (no corner cutting). A cell is free when `!blocked(i, j)`. The start cell counts as free even if blocked.
- Open set as a binary min-heap (write a small one). Stop after expanding 6000 nodes.
- If the goal cell is blocked or not reached, finish at the expanded cell with the smallest heuristic distance to the goal (return `[]` if that is the start cell).
- Smooth: from the current point, skip ahead to the farthest waypoint reachable in a straight line (sample the segment every 0.4 units; every sample must have `!blocked`).
- Return waypoints excluding `from`. When the goal was reached and is free, the last point is exactly `to` (not the cell centre).

### `games/gnomes-of-gnomomia/src/player.ts`
Keep `player`, `PlayerAction` and all exports exactly as in the stub (including the `swing` field). Imports you need: `createGnomeModel, getMyGnome` from `'@lawn/gnome'`; `findPath` from `'./pathfind'`; `heightAt, isBlocked` from `'./world'`; `getEntity` from `'./entities'`; `pickUpLoot` from `'./inventory'`; `bus` from `'./events'`; `TUNING, PLAYER_LOOK` from `'./config'`.
- `createPlayer(scene)`: `player.model = createGnomeModel(getMyGnome()?.look ?? PLAYER_LOOK)`; traverse the model object and set `castShadow = true` on meshes; add `player.model.object` to the scene; set `player.position.y = heightAt(x, z)`.
- `walkTo(x, z)`: `player.action = null`; `player.path = findPath(player.position-as-{x,z}, {x, z}, isBlocked)`. Ignore while `player.dead`.
- `interact(type, id)`: ignore while dead; `player.action = { type, target: id }`; path to the entity's position at once; then re-path every 0.4 s while the action lasts (the target may move).
- `stopPlayer()`: clear path and action.
- `teleportPlayer(x, z)`: set position (y = heightAt), clear path and action, `player.dead = false`, `player.model?.setDead(false)`.
- `updatePlayer(dt)`:
  1. If `player.dead`: `player.model.setDead(true)`, update the model with zero velocity, return.
  2. If there is an action, `e = getEntity(action.target)`. Drop the action (set null, clear path) when `e` is undefined, or `e.dead`. Range: attack `TUNING.meleeRange`, talk `TUNING.talkRange`, take `TUNING.takeRange`. When the 2D (x, z) distance <= range: clear the path, face the entity, then: talk → `bus.emit('talk', { npcId: e.defId, entityId: e.id })` and set action null; take → `pickUpLoot(e.id)` and set action null; attack → keep the action (combat.ts swings while you are in range). Otherwise re-path on the 0.4 s timer.
  3. Move along `player.path` at `TUNING.walkSpeed` (pop a waypoint when within 0.1 of it; carry leftover distance to the next one). `player.facing = Math.atan2(dx, dz)` of the step while moving. Keep a velocity vector (zero when standing) for the model.
  4. `player.position.y = heightAt(x, z)`.
  5. `player.model.update({ position: player.position, velocity, facing: player.facing, grounded: true, jumpsUsed: 0 }, dt)`.
  6. AFTER the model update: if `player.swing > 0`, `player.swing -= dt` and set `player.model.arms.right.rotation.x = -2.4 * Math.sin(Math.PI * (1 - Math.max(0, player.swing) / 0.35))` (a chop forward and back).

## Contract
Exports and the `player` object shape stay exactly as in the stub. `findPath` returns `Point[]` (`{ x, z }`).

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` shows no errors in `src/pathfind.ts` or `src/player.ts`.

## Out of scope
`src/world.ts`, `src/entities.ts`, `src/inventory.ts`, `src/combat.ts` and all other files (other workers own them).

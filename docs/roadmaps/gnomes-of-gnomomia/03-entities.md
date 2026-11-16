Epic: 2, Systems
Depends on: none

## Environment
Read `docs/roadmaps/gnomes-of-gnomomia/00-environment.md` first; it applies in full.

## Goal
The world's population: villager NPCs who wander and stop to face you, enemies with simple AI (wander, aggro, chase, attack, leash home, respawn), creature models, and loot piles.

## Read first
- `games/gnomes-of-gnomomia/src/config.ts`: `TUNING` (aggroRange, leashRange, enemyWalkSpeed, wanderRadius, meleeRange, talkRange, lootSeconds), `ENEMIES`/`EnemyDef`, `SPAWN_GROUPS`, `NPCS`/`NpcDef`, `Entity`, `InvSlot`, `PLAYER_LOOK`, `UI`.
- `games/gnomes-of-gnomomia/src/entities.ts`: the stub you replace.
- `packages/gnome/src/types.ts` lines 95-140: `GnomeLook`, `PlayerState`, `GnomeModel` (faces +z at yaw 0; `update(p, dt)` animates from `p.velocity` and overwrites arm rotations every call; `setDead(true)` lays it down).

## Change
### `games/gnomes-of-gnomomia/src/models.ts` (new)
`export interface CreatureRig { object: THREE.Group; update(position: THREE.Vector3, facing: number, speed: number, dt: number): void; setDead(dead: boolean): void; swing(): void }`
- `export function createEnemyRig(def: EnemyDef): CreatureRig` by `def.model`:
  - `'gnome'`: `createGnomeModel({ ...PLAYER_LOOK, hat: def.color, shirt: 0x4a4a4a, pants: 0x2b2b2b, beard: 0x555555 })` from `'@lawn/gnome'`; update passes `{ position, velocity: (sin(facing)*speed, 0, cos(facing)*speed), facing, grounded: true, jumpsUsed: 0 }`; `swing()` starts a 0.35 s right-arm chop applied after `model.update` (`arms.right.rotation.x = -2.4 * sin(PI * t/0.35)`).
  - `'slug'`: body = `SphereGeometry(0.5, 10, 8)` scaled (0.6, 0.45, 1.3), colour def.color, two eye stalks (thin cylinders + small black spheres) at the front (+z). When moving, squash-stretch the body along z with `sin(time*8)`.
  - `'beetle'`: glossy body `SphereGeometry(0.6, 10, 8)` scaled (0.8, 0.5, 1.1) colour def.color (`MeshPhongMaterial`, shininess 80), a smaller head sphere at the front, two mandibles (`ConeGeometry(0.08, 0.6, 5)` pointing forward, colour 0x2a1a0a), six legs (`CylinderGeometry(0.03, 0.03, 0.7)`) that wiggle when moving.
  - `'mole'`: round body `SphereGeometry(0.55, 10, 8)` scaled y 0.85 colour def.color, pink snout sphere (0xf0a0a0) at the front, two pink paw spheres, tiny black eyes. If `def.id === 'mole-king'` add a gold crown (`CylinderGeometry(0.28, 0.32, 0.22, 8, 1, true)` 0xffd700 plus 5 small cones) on top.
  - Creatures sit with their bellies on the ground (lift by about the body half-height). `setDead(true)` rolls the group onto its back (`rotation.z = PI`) and sinks it 0.2; `setDead(false)` restores. `swing()` lunges the body forward 0.3 units for 0.25 s.
  - Scale the whole group by `def.scale`. Flat-shaded `MeshLambertMaterial` unless noted. `castShadow = true` on meshes.
- `export function createNpcRig(def: NpcDef): CreatureRig` from `createGnomeModel(def.look)`, same wrapping as `'gnome'`.
- `export function createLootRig(): CreatureRig`: a little brown sack (`SphereGeometry(0.3, 8, 6)` 0x9b7a4c, scaled y 0.8) with a tied top (small cone) and 3 gold coins (`CylinderGeometry(0.12, 0.12, 0.03, 10)` 0xffd700) beside it; it bobs gently (y += 0.05*sin(time*3)). setDead/swing do nothing.

### `games/gnomes-of-gnomomia/src/entities.ts`
Replace the stub; keep every export exactly. Imports: `player` from `'./player'`; `heightAt, isBlocked` from `'./world'`; `enemyAttack` from `'./combat'`; `bus, say` from `'./events'`; data from `'./config'`.
- Keep a list of `{ entity: Entity, rig: CreatureRig, ...private AI fields }`. Ids start at 1 and increase.
- After creating any rig, traverse `rig.object` and set `userData.entityId = id` on it and every child. `entity.object = rig.object`; add it to the scene (keep the scene from `spawnWorldEntities`).
- `spawnWorldEntities(scene)`: one NPC entity per `NPCS` entry at (def.x, def.z) (kind 'npc', level 0, hp/maxHp 1); then for each `SPAWN_GROUPS` group, `count` enemies at a random offset within `spread` of (x, z) (seeded random: mulberry32 seed 99, `function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}`), retrying up to 10 times while `isBlocked`. Enemy entity: `name` from def, `level`, `hp = maxHp = def.hp`, `home` = spawn spot, `sinceHit = Infinity`, `attackTimer = 0`, `loot = []`, `gold = 0`.
- `updateEntities(dt)`, for each entity:
  - Everyone: `sinceHit += dt`, y = `heightAt`, `rig.update(position, facing, speed, dt)` (speed 0 when still).
  - Enemy, alive: `attackTimer -= dt`.
    - If `!inCombat` and `def.aggressive` and `!player.dead` and 2D distance to `player.position` < `TUNING.aggroRange` and the player is within `TUNING.leashRange` of `home`: `inCombat = true`.
    - If `inCombat`: if `player.dead` or the enemy is farther than `TUNING.leashRange` from `home`: `inCombat = false`, `hp = maxHp`, walk home. Else if distance to the player > `TUNING.meleeRange * 0.9`: move toward the player at `TUNING.enemyWalkSpeed` (try the full step; if `isBlocked`, try only the x part, then only the z part). Else face the player and, when `attackTimer <= 0`: `enemyAttack(entity)`, `rig.swing()`, `attackTimer = def.attackSeconds`.
    - Else wander: every 3 to 7 s pick a free point within `TUNING.wanderRadius` of `home` and walk to it at half speed.
    - Note: combat.ts sets `entity.inCombat = true` when the player hits a passive enemy, so it fights back; your code just reads the flag.
  - NPC: if the player is within 3.5 units, stop and face the player. Else wander within `def.wander` of home (0 = stand still facing +z) at 1.2 units/s, pausing 2 to 6 s between walks.
  - Loot: count down `TUNING.lootSeconds`, then `removeEntity`.
  - Dead enemy: count its respawn time (`def.respawnSeconds`); 1.5 s after death set `object.visible = false`; on respawn put it back at `home` with full hp, `dead = false`, `inCombat = false`, `visible = true`, `rig.setDead(false)`.
- `killEntity(id)`: only for live enemies. `dead = true`, `inCombat = false`, `rig.setDead(true)`. Roll each `def.loot` drop by `chance` (count `drop.count ?? 1`) and gold uniformly in `def.gold` (inclusive integers); if anything dropped, `spawnLoot(x, z, items, gold)`. Then `bus.emit('enemy-killed', { defId, entityId: id })` and `say(`You defeated the ${name}.`, UI.good)`.
- `spawnLoot(x, z, items, gold)`: a new entity, kind 'loot', defId 'loot', name 'Loot', level 0, hp/maxHp 1, the given items (copied) and gold, at heightAt; returns it.
- `removeEntity(id)`: remove the object from the scene and the entity from the list.
- `getEntity(id)`, `allEntities()` (the entities, not the wrappers), `entityFromObject(obj)` (walk up `.parent` until `userData.entityId` is a number, then `getEntity`).

## Contract
All `entities.ts` exports keep their stub signatures. `Entity` objects match `config.ts` exactly; `object` and every descendant carry `userData.entityId`. `enemyAttack(e)` is called at most once per `def.attackSeconds` per enemy and only when within `TUNING.meleeRange` of the player.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` shows no errors in `src/entities.ts` or `src/models.ts`.

## Out of scope
`src/player.ts`, `src/combat.ts`, `src/world.ts` and all other files.

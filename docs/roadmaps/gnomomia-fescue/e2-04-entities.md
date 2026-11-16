Epic: 2, Systems
Depends on: none

## Goal
Entities spawn per zone, NPCs follow `placements`/`hidden`, enemies use `enemyStats`, escorted NPCs follow the player, and quests can spawn enemies at a point.

## Read first
- `games/gnomes-of-gnomomia/src/entities.ts` (all), `src/config.ts` (`NpcDef`, `SpawnGroup`, `Entity`), `src/content.ts` (table names)
- `src/combat.ts` exports `speedFactor` and `canAct` (another worker is writing them; use them by name)

## Change
- `src/entities.ts`:
  - **Spawning.** `spawnZoneEntities(scene, zone)` removes all current entities, then:
    1. Spawns the NPCs whose resolved location is in this zone. The first `placements` entry whose `when` holds wins, else `npc.zone/x/z`. Skip NPCs whose `hidden` condition holds.
    2. Spawns every `SPAWNS` group with `zone === zone` whose `when` holds (or has none).
  - **Re-placing NPCs.** On `flag-set` and `quest-updated`, re-resolve NPC placement and despawn or respawn the NPCs that changed.
  - **Re-checking spawn groups.** On the same events, re-check every `SPAWNS` group in this zone that has a `when`. A group whose condition became true spawns now. A group whose condition became false despawns its living members that aren't in combat. Track groups by their index in `SPAWNS`.
  - **Enemy stats and AI.**
    - Enemy HP comes from `enemyStats(def).hp`.
    - The attack timer uses `def.attackSeconds ?? 2.4`, scaled by `1/speedFactor(id)`.
    - Skip AI while `!canAct(id)`. Movement is × `speedFactor`.
  - **Escort.** If an active quest stage is `{type:'escort', npc}` and that NPC is in this zone, it walks to within 2 m of the player at walk speed instead of wandering.
  - **`spawnEnemyAt(defId, x, z)`** spawns one enemy with `home` at that point. It ignores `respawnSeconds` (it doesn't respawn) and returns the entity.
  - **Last words.** On death, if `def.lastWords` is set, say `<name>: "<lastWords>"`.
  - The nameplate level stays as is; hud.ts colours it by rank.
  - Keep `spawnWorldEntities(scene)` as `spawnZoneEntities(scene, state.zone)`.
- Enemies whose `model` models.ts doesn't know yet still render, because models.ts falls back. You don't need to check.

## Contract
Stub signatures unchanged. Use `checkCondition` from `./quests` for every `when`/`hidden`.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia`: no errors in entities.ts.

## Out of scope
models.ts, combat.ts, quests.ts, zones.ts.

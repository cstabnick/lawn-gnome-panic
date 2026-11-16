Epic: 2, Systems
Depends on: none

## Goal
Enemies with `moves` use them: telegraphed rings, cones and lanes, summons, pulls, poison pools, vanish and buffs. The player can see them coming and dodge.

## Read first
- `games/gnomes-of-gnomomia/src/config.ts` `BossMoveDef`, `EnemyDef.moves`; `src/bossmoves.ts` (stub)
- `src/entities.ts` (`allEntities()`, `spawnEnemyAt`), `src/combat.ts` (`dealDamage`, `applyStatus`, `canAct`), `src/rules.ts` (`enemyStats`), `src/player.ts` (`player`)
- `docs/design/gnomomia/bestiary.md` (Grubthorn, Rotgut, Clogmaw and the Mower sheet, for what moves feel like)

## Change
- `src/bossmoves.ts`:
  - `initBossMoves(scene)` keeps the scene.
  - `updateBossMoves(dt)`: for each living enemy in combat that has `moves`, give each move its own timer starting at `every × 0.6`.
  - When a move fires (skip if `!canAct(id)`, or if `belowHpPct` is set and HP is above it):
    1. Draw a telegraph decal on the ground for `telegraph` seconds: a translucent red mesh (ring = a disc of `radius` around the enemy; cone = a 60° sector toward the player, length `radius`; lane = a rectangle `length` × `width` toward the player; pool = a disc at the player's position).
    2. Then resolve it: if the player is inside the shape, `dealDamage(PLAYER_ID, avgEnemyHit × damage, enemy damageType, { noRoll: true })` and apply `status`.

    | kind | Resolves as |
    |---|---|
    | summon | `spawnEnemyAt(summon.enemy)` × count near the boss |
    | pull | moves the player 70% of the way to the boss |
    | pool | leaves a 6 s lingering damage disc at the player's position (`damage` per second) |
    | vanish | hides the boss 3 s, then it reappears at the player with a ring hit |
    | buff | glows the boss, ×1.3 damage for 8 s (keep a local map) |

  - Telegraphs are pure three.js meshes: `RingGeometry`/`CircleGeometry`/`PlaneGeometry`, `MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: 0.35, depthWrite: false })`, laid flat at `heightAt + 0.05`. Fade the opacity up as the telegraph runs out.
  - Emit `boss-phase { boss: def.name, phase: 0, text: move.name }` when a move fires, so the HUD shows its name.

## Contract
Stub signatures unchanged. Read enemy damage only through `enemyStats`.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia`: no errors in bossmoves.ts.

## Out of scope
mower.ts (the final battle has its own script), entities.ts.

Epic: 2, Systems
Depends on: none

## Goal
Character level comes from XP (kills and quests), not skill-ups. Skills are capped by level. Level-ups give attributes and skill points. HP and mana use the new formulas.

## Read first
- `docs/design/gnomomia/combat.md` §1-3 and §10
- `games/gnomes-of-gnomomia/src/progression.ts` (stub), `src/state.ts`, `src/data/classes.ts` (CLASSES shape)

## Change
- `src/progression.ts`:
  - `xpToNext(L) = 40 + 30L + 4L²`.
  - `killXp(Le, rank) = (6 + 2·Le)` × rank multiplier × level-difference multiplier.
    - Rank: trivial .5, normal 1, elite 3, miniboss 6, boss 10, worldboss 20, final 40.
    - Level difference: +10% per level above, up to +30%; −20% per level below; 0 at 5 or more below.
  - `questXp(q) = killXp(q.level,'normal') × (side 10 | main 20 | finale 40)`.
  - `skillCap(L = state.level) = 5 + 4L`.
  - `grantXp`: adds XP and loops level-ups (cap 30). Each level-up gives +1 to every attribute, +1 extra to the class primary (if a class is chosen), +1 skill point, and a full heal. Emit `level-up` and `xp-gained`, and say `Level up! You are now level N.` in gold.
  - `useSkill(skill, xp)`: as the old rules.ts version, but stop at `skillCap()`, and **don't** touch character level.
  - `initProgression()`:
    - On `enemy-killed`: `grantXp(killXp(def.level, def.rank))` (look up `ENEMIES[defId]`).
    - On `quest-completed`: `grantXp(questXp(QUESTS[id]))`. If `tier === 'finale'`, give +1 skill point and say so.
- `src/state.ts`: replace the bodies only.
  - `maxHp = round((40 + 12(level-1) + 2·max(0, endurance - 10 - (level-1))) × (classId==='warden' ? 1.25 : 1))`. Endurance from levels is already counted in the 12 per level, so only extra Endurance adds.
  - `maxMp = 20 + 4(intelligence - 10) + 3·level`.
  - `equippedArmor` sums `armorValue` (import from rules).
  - `newGameState` gives `xp: 0, skillPoints: 0`.

## Contract
Epic-1 signatures unchanged. The `level-up` payload is unchanged.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia`: no errors in progression.ts or state.ts.
- `xpToNext(1) === 74` and `xpToNext(10) === 740`.

## Out of scope
rules.ts, combat.ts, quests.ts (quests.ts emits `quest-completed`; you only listen), ui/*.

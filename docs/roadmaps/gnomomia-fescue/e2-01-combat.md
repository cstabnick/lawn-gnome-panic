Epic: 2, Systems
Depends on: none (epic 1 stubs are in place)

## Goal
Combat uses the new rules from `docs/design/gnomomia/combat.md`. The level-based d20 roll, armor as % mitigation, damage from ilvl and power, damage types against families, crits, statuses and spell ranks replace the old bounded d20. Respawn is at the current zone's shrine.

## Read first
- `docs/design/gnomomia/combat.md`, all of it (§4-9 are the formulas, §5 has spells)
- `games/gnomes-of-gnomomia/src/rules.ts`, `src/combat.ts` (current code and the epic-1 stubs)
- `games/gnomes-of-gnomomia/src/config.ts`: `ItemDef`, `EnemyDef`, `Family`, `DamageType`, `StatusId`, `SpellDef`

## Change
- `src/rules.ts`: implement every stub exactly as combat.md says.
  - `power(a) = 1 + (a - 10) / 40`. `accuracyFromSkill(l) = floor(l/20)`. `damageFromSkill(l) = l/400`.
  - `attackRoll(acc, def, critRange = 20)`: d20; natural 1 misses; natural 20 hits and crits; a hit needs `roll + acc >= 9 + min(def, 6)`; crit when the hit's roll is `>= critRange`.
  - `mitigation(A, L) = min(0.6, A / (A + 40 + 20 L))`.
  - `weaponRange`: avg `3 + 2·ilvl`, two-handed ×1.4, blowpipe ×0.8, rarity bonus (plain 0, sprouted .08, blooming .16, heirloom .25, kilnfired .35), min `0.6·avg`, max `1.4·avg`, rounded. `damageOverride` wins.
  - `armorValue`: `(40 + 20·ilvl) × typeFactor × slotShare` (cloth .11, leather .25, plate .55, shield .25 with slotShare 1; head .15, body .40, legs .20, hands .15, feet .10). The `armor` field wins.
  - `typeMultiplier`: the table in combat.md §7.
  - `enemyStats`: the §9 formulas.
    - `avgHit(L) = (3+2L)(1+(L-1)/20)`. HP = `avgHit × min(5, 3 + L/5)` × rank HP multiplier.
    - Damage avg `3 + 1.7L` × rank damage multiplier, ±30%.
    - Armor fraction by family (soft 0, shelled .55, metal .9, others .11) × `(40+20L)`.
    - Accuracy by rank: trivial 1, normal 2, elite/miniboss 4, boss/worldboss/final 5.
    - Defense `def.defense ?? 0`, +2 if the family is winged. Overrides win.
    - Rank multipliers (HP / damage): trivial .6/.6, normal 1/1, elite 2.5/1.3, miniboss 4/1.4, boss 6/1.5, worldboss 12/1.6, final 1/1 (the final boss uses hpOverride).
  - Stop using `attributeMod` and `skillBonus` in your two files, but keep them exported (ui/panels.ts still imports them this epic).
- `src/combat.ts`:
  - **Player swing.**
    - Damage: weapon range (fists 1-3 crush) × `power(primary)`, where primary is the class primary from `CLASSES[state.classId].primary` (strength if classless; sling/blowpipe/thrown use agility). Then apply `damageFromSkill`, the type multiplier, enemy armor mitigation, and crit ×2.
    - Ranged weapons (`weaponClass` sling/blowpipe/thrown) attack from 12 m instead of melee range, with −30% inside 2 m.
    - Train the weapon's skill: blade = slash, blunt = crush, marksmanship = ranged.
  - **Enemy attack.**
    - Use `enemyStats` accuracy and damage.
    - Player defense = shield `floor(block/20)` + `floor((agility-10)/30)`, capped at 6.
    - Player armor = sum of `armorValue` over equipped items. Mitigation is against the enemy's level, plus `toughness × 0.001`.
    - Train toughness on being hit, and block on a miss while a shield is equipped.
  - **Statuses.** Implement `dealDamage`, `applyStatus`, `hasStatus` and `healPlayer`. Statuses live in a `Map<targetId, Map<StatusId, {left, power}>>` ticked in `updateCombat`. Emit `status` events.
    - Chipped, poisoned and burning deal `power` per second.
    - Soaked: +15% rain damage taken.
    - Slowed: the enemy moves and attacks 30% slower. Expose `speedFactor(targetId)` for entities.ts and player.ts.
    - Rooted, stunned and staggered: the target can't act. Expose `canAct(targetId)`.
    - Cracked: −25% armor.
    - Glazed: absorbs `power` damage.
  - **Spells.** The current rank is the highest entry of `SPELLS[id].ranks` ≤ the player's level (classless and non-mage classes stay on rank 1). Damage base `1.5 × (3 + 2·Lr)`, heal `2.0 × (3 + 2·Lr)`, cost `5 + 1.5·Lr`, multiplied as combat.md §5 says. `hit` events carry `damageType` and `crit`.
  - **Death and respawn:** teleport to `currentZone().shrine` (import from `./zones`). The chat says `You are glued back together at <shrine name>.`
  - **Regen:** in combat as now. Out of combat (5 s with no hits either way): 5% of max HP and mana per second.

## Contract
Keep the epic-1 signatures. Also export `speedFactor(targetId: number): number` (1 normally, 0.7 slowed, 0 rooted/stunned), `canAct(targetId: number): boolean`, and `playerDefense(): number` and `playerArmor(): number` for the stats panel. Read enemy stats ONLY through `enemyStats(def)`.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` shows no errors in rules.ts or combat.ts.
- Check against combat.md's sanity table: an L1 player with skill 5 vs an L1 slug needs a 9 (60%).

## Out of scope
entities.ts, abilities.ts, progression.ts, ui/*. Don't add new spells.

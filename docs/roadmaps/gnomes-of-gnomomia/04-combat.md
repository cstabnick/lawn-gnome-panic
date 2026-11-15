Epic: 2, Systems
Depends on: none

## Environment
Read `docs/roadmaps/gnomes-of-gnomomia/00-environment.md` first; it applies in full.

## Goal
Simple d20 rules and the fights built on them: the player's auto-attacking melee, Flare and Mend spells, enemy attacks, Elder-Scrolls skill progression by use, HP/MP regeneration, death and respawn.

## Read first
- `games/gnomes-of-gnomomia/src/config.ts`: `TUNING`, `SPAWN`, `SKILLS`, `SPELLS`/`SpellDef`, `ENEMIES`, `ITEMS`, `Entity`, `PLAYER_ID`, `UI`.
- `games/gnomes-of-gnomomia/src/state.ts`: `state`, `maxHp`, `maxMp`, `equippedArmor`, `equippedWeapon`.
- `games/gnomes-of-gnomomia/src/rules.ts` and `src/combat.ts`: the stubs you replace.

## Change
### `games/gnomes-of-gnomomia/src/rules.ts`
- `rollDice(count, sides, rng = Math.random)`: sum of `count` rolls of `Math.floor(rng() * sides) + 1`.
- `attributeMod(v)`: `Math.floor((v - 10) / 2)`.
- `skillBonus(level)`: `Math.floor(level / 5)`.
- `attackRoll(bonus, armor, rng = Math.random)`: `roll = rollDice(1, 20, rng)`; `hit = roll === 20 || (roll !== 1 && roll + bonus >= 10 + armor)`; return `{ hit, roll }`.
- `skillXpToNext(level)`: `2 + Math.floor(level / 2)`.
- `useSkill(skill, xp = 1)`: `s = state.skills[skill]`; stop at level 100. `s.xp += xp`; while `s.xp >= skillXpToNext(s.level)`: subtract, `s.level++`, `state.skillUps++`, `bus.emit('skill-up', { skill, level })`, `say(`Your ${name} skill is now ${level}.`, UI.good)` (name from `SKILLS`). Whenever `state.skillUps >= TUNING.skillUpsPerLevel`: subtract it, `state.level++`, every attribute +1, `state.hp = maxHp()`, `state.mp = maxMp()`, `bus.emit('level-up', { level })`, `say(`Level up! You are now level ${level}.`, UI.gold)`. Finally `bus.emit('changed', {})`.

### `games/gnomes-of-gnomomia/src/combat.ts`
Imports: `player, teleportPlayer` from `'./player'`; `getEntity, allEntities, killEntity` from `'./entities'`; rules; state helpers; `bus, say`; config.
- `initCombat(scene)`: keep the scene for effects.
- `updateCombat(dt)`:
  - If `player.dead`: count 3 s, then `teleportPlayer(SPAWN.x, SPAWN.z)`, `state.hp = maxHp()`, `state.mp = maxMp()`, `say('You wake up by the well in Mossbottom.', UI.quest)`, `bus.emit('changed', {})`. Nothing else while dead.
  - Regen: +1 hp every `TUNING.hpRegenSeconds`, +1 mp every `TUNING.mpRegenSeconds` (accumulators, capped at max).
  - Timers: swing timer and spell cooldown count down.
  - Melee: if `player.action?.type === 'attack'`, `e = getEntity(target)`; if `e`, `e.kind === 'enemy'`, `!e.dead`, 2D distance <= `TUNING.meleeRange + 0.3`, and the swing timer <= 0: swing timer = `TUNING.playerAttackSeconds`; `player.swing = 0.35`; face the enemy (`player.facing = atan2(dx, dz)`); `e.inCombat = true`; `e.sinceHit = 0`. Weapon = `equippedWeapon()`; skill = `weapon?.skill ?? 'blunt'`; dice = `weapon?.damage ?? [1, 2]`. `bonus = skillBonus(state.skills[skill].level) + attributeMod(state.attributes.agility)`; `def = ENEMIES[e.defId]`; `attackRoll(bonus, def.armor)`. Hit: `damage = Math.max(1, rollDice(...dice) + attributeMod(state.attributes.strength))`, `e.hp -= damage`, `bus.emit('hit', { attacker: PLAYER_ID, target: e.id, damage, at: e.position.clone() })`, `useSkill(skill, 1)`; if `e.hp <= 0`: `e.hp = 0`, `killEntity(e.id)`, `player.action = null`. Miss: `bus.emit('miss', { attacker: PLAYER_ID, target: e.id, at: e.position.clone() })`.
  - Update spell effects (below).
- `enemyAttack(e)`: skip if `player.dead`. `def = ENEMIES[e.defId]`. `shield = state.equipment.shield !== null`. `armor = equippedArmor() + skillBonus(state.skills.armor.level) + (shield ? skillBonus(state.skills.block.level) : 0)`. `attackRoll(def.attack, armor)`. Hit: `damage = rollDice(...def.damage)`, `state.hp -= damage`, `bus.emit('hit', { attacker: e.id, target: PLAYER_ID, damage, at: player.position.clone() })`, `useSkill('armor', 1)`. Miss: `bus.emit('miss', { attacker: e.id, target: PLAYER_ID, at: player.position.clone() })`; if `shield`, `useSkill('block', 1)`. Auto-retaliate: if `player.action === null && player.path.length === 0`, `player.action = { type: 'attack', target: e.id }`. If `state.hp <= 0`: `state.hp = 0`, `player.dead = true`, `player.action = null`, `player.path = []`, `bus.emit('player-died', {})`, `say('Oh dear, you are dead!', UI.bad)`. Always `bus.emit('changed', {})`.
- `castSpell(id)`: ignore when dead. If cooldown > 0: return silently. `sp = SPELLS[id]`. If `state.mp < sp.cost`: `say('You do not have enough mana.', UI.bad)`; return.
  - Flare (`needsTarget`): target = the current attack target if alive and within `TUNING.spellRange`; else the nearest live enemy within `TUNING.spellRange` (prefer `inCombat` ones). None: `say('There is nothing to target.', UI.bad)`; return. `damage = rollDice(...sp.dice) + skillBonus(state.skills.destruction.level)`; never misses; `e.inCombat = true`; `e.sinceHit = 0`; `e.hp -= damage`; `bus.emit('hit', { attacker: PLAYER_ID, target: e.id, damage, at: e.position.clone(), spell: true })`; `useSkill('destruction', 1)`; kill at 0 hp as for melee. If `player.action` is null set it to attack this enemy. Effect: an orange glowing sphere (`SphereGeometry(0.25, 8, 6)`, `MeshBasicMaterial` 0xff7a1a) flying from the player's chest (y + 1) to the target's (y + 0.8) over 0.3 s, then removed.
  - Mend: `amount = rollDice(...sp.dice) + 2 * skillBonus(state.skills.restoration.level)`; `state.hp = min(maxHp(), state.hp + amount)`; `bus.emit('heal', { amount })`; `useSkill('restoration', 1)`. Effect: a green ring (`RingGeometry(0.6, 0.8, 24)`, flat, `MeshBasicMaterial` 0x6dff8a, transparent) rising from the feet to y + 2 over 0.6 s while fading.
  - Both: `state.mp -= sp.cost`; cooldown = `TUNING.spellCooldownSeconds`; `player.swing = 0.35`; `bus.emit('cast', { spell: id, from: player.position.clone(), to: target position clone or null })`; `bus.emit('changed', {})`.
- `spellCooldown()`: `Math.max(0, cooldown)`.

## Contract
All exports keep their stub signatures. `hit`/`miss` payloads use `PLAYER_ID` (0) for the player and the entity id for enemies; `at` is a clone of the target's feet position.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` shows no errors in `src/rules.ts` or `src/combat.ts`.

## Out of scope
`src/player.ts`, `src/entities.ts`, `src/state.ts` and all other files.

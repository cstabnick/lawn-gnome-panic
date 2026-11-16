Epic: 2, Systems
Depends on: none (reads `src/data/classes.ts`, which another worker fills in this epic; code against its exported names and shapes)

## Goal
Players can choose a class, spend skill points on talents within tier gates, respec, and use class abilities from the hotbar with the class resource (Grit, Focus or Mana).

## Read first
- `docs/design/gnomomia/classes.md` (resource rules, Calling, respec cost, tier gates)
- `games/gnomes-of-gnomomia/src/config.ts` (`ClassDef`, `AbilityDef`, `TalentDef`), `src/talents.ts` and `src/abilities.ts` (stubs), `src/data/classes.ts` (exports `CLASSES`, `TALENTS`, `TIER_GATE`, `BRANCHES`)
- `src/combat.ts` exports you call: `dealDamage(targetId, base, type, opts)`, `applyStatus(targetId, status, seconds, power)`, `healPlayer(amount)`, `castSpell(id)`, `canAct(id)`

## Change
- `src/talents.ts`:
  - `chooseClass(c)`: only if `state.classId === null`. Sets it, emits `class-chosen`, and puts the class's first ability on hotbar slot 3.
  - `branchPoints` sums the ranks of `TALENTS` in that class and branch.
  - `canLearn(id)`: the talent is the player's class, `rank < maxRank`, `state.skillPoints > 0`, `branchPoints >= TIER_GATE[tier]`, and if `tier === 6`, the player has fewer than 2 capstones.
  - `learnTalent`: spend a point, add a rank, emit `talents-changed` and `changed`. If the talent `grants` an ability, say `New ability: <name>`.
  - `respec()`: refunds all points. Free the first time (`state.flags['respec-used']` unset; set it), then costs `level²` gold (refuse with a message if short).
- `src/abilities.ts`:
  - `knownAbilities()`: the class abilities with `level <= state.level` and no `fromTalent`, plus the ones whose `fromTalent` rank ≥ 1. Classless players get none (Flare and Mend stay on keys 1-2 through `castSpell`).
  - `resource()`:
    - **grit:** 0-100, +8 per player hit landed, +5 per hit taken (listen to `hit` events), drains 5/s out of combat.
    - **focus:** 0-100, regenerates 12/s.
    - **mana:** reads `state.mp`/`maxMp()`.
  - `useHotbar(slot)`:
    - Slots 0-1 are `flare`/`mend` → `castSpell`.
    - Other slots hold an ability id. Check cooldown and resource, spend it, then run the ability on `player.action?.target` (or self).
    - Effects use the combat API: `attack`/`spell` → `dealDamage(target, weaponAvg × power, damageType ?? weapon type)`, or radius-based to every enemy within `radius` of the target; `status` → `applyStatus`; `heal` → `healPlayer`; `move` → teleport the player toward or away from the target by the distance in `about` (Hedge Charge 10 m to the target, Scramble 6 m back, Puddle Step 8 m forward).
    - Abilities whose `about` describes something special (traps, pets, Thunderhead, Fairy Ring, Midsummer) get a simple version: traps = root + chipped on the nearest enemy within 6 m after 1 s; pet = `spawnEnemyAt` is NOT used; skip pets for now and say "Your beetle is still in Barkhollow."
  - **Passive talents:** export `talentBonus(kind: 'damagePct' | 'hpPct' | 'reductionPct' | 'swingPct' | 'defense' | 'critRange' | 'critDamagePct' | 'healingPct', ctx?: { type?: DamageType; twoHanded?: boolean; shield?: boolean }): number`. It sums the simple numeric passives by reading each talent's `about` text. Hard-code a small id → effect table for the ones that map cleanly (Thick Clay, Keen Edge, Heavy Hands, Glazed Over, Quick Snips, Pot-Lid Practice, Hard Acorns, Hawk Eye, Kindling, Cold Snap, Green Thumb, Quick Breath). Others return 0 for now.
  - `updateAbilities(dt)` ticks cooldowns and resources.

## Contract
Stub signatures plus `talentBonus` (combat.ts may call it later; nothing calls it this epic). Hotbar slots are `state.hotbar[i]` with i 0-7.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia`: no errors in talents.ts or abilities.ts.

## Out of scope
data/classes.ts, combat.ts, ui/*, input.ts.

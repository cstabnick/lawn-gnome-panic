# Combat and progression redesign

The current rules (`src/rules.ts`, `src/combat.ts`) were made for a five-quest intro, and they run out of room before the intro ends. This redesign keeps the feel (d20 rolls, RuneScape hitsplats, skills that grow by use) and makes it scale across 30 levels and seven zones.

## Why the current system maxes out

| Problem | Where | Effect |
|---|---|---|
| **Armor is part of the to-hit roll.** Enemies need `d20 + attack >= 10 + armor`. | `combat.ts:133` | Beetle plate 5 + oak shield 4 + thimble helm 3 = 12, plus Armor and Block skill bonuses, so enemies hit only on a natural 20 (5%). Armor can't go higher without making the player immune. |
| **Weapon dice have a low ceiling.** The best weapon is 2d8 (avg 9). | `config.ts` ITEMS | There's nowhere for weapons to go, and hits read 2-16 forever. |
| **Character level comes only from skill-ups**, and skills level fast (`2 + level/2` uses). | `rules.ts` useSkill | Levels arrive from grinding one skill, not from progress through the world, so there's no level to gate zones on. |
| **Attributes add flat +1s**, and the bonus is `(attr-10)/2`. | `rules.ts` attributeMod | Gains shrink to nothing. Strength 20 is only +5 damage. |
| **Enemy accuracy doesn't scale**, while player armor does. | ENEMIES | Any new zone would need ever-higher `attack` numbers, and the arms race above repeats. |

## The new model in one paragraph

**Hitting is about skill and level difference. How much it hurts is about gear and attributes. Armor reduces damage instead of preventing hits.** The to-hit roll stays a d20 but compares levels, so it never saturates. Damage scales with item level and your primary attribute, and armor is a percentage reduction with diminishing returns. Character level comes from XP (quests and kills), and use-based skills stay as *proficiencies* capped by character level.

---

## 1. Levels and XP

- **Level cap for Fescue: 30.**
- **XP to next level:** `xpToNext(L) = 40 + 30·L + 4·L²`

| L | to next | L | to next | L | to next |
|---|---|---|---|---|---|
| 1 | 74 | 10 | 740 | 20 | 2,240 |
| 5 | 290 | 15 | 1,390 | 29 | 4,274 |

  The total from 1 to 30 is about 48,400 XP.
- **Kill XP:** `6 + 2·Lenemy`, times the rank multiplier (below), times the level-difference multiplier:
  - Enemy above you: +10% per level, up to +30%.
  - Enemy below you: −20% per level. At 5 or more levels below, the enemy is **grey** and gives 0 XP. (This is what stops the grinding that broke levelling.)
- **Quest XP:** side quest = 10 × kill XP at the quest's level. Main story = 20 ×. Chapter finale = 40 ×.
- **Rest XP:** logging out or resting at an Inn stores bonus XP (double kill XP) up to 1.5 levels' worth.
- **On level-up:** +1 to every attribute, **+1 extra to your class primary**, **+1 skill point** (see [classes.md](classes.md)), full heal. That's the same celebration as today.

## 2. Attributes

| Attribute | Does | Primary for |
|---|---|---|
| **Strength** | Melee damage multiplier | Warden |
| **Agility** | Ranged damage multiplier; crit range; small dodge | Slinger |
| **Intelligence** | Spell and heal multiplier; max mana | Hedge-Mage |
| **Endurance** | Max HP | (Warden gets +25% base HP instead) |

- **Power multiplier:** `P(attr) = 1 + (attr − 10) / 40`. This replaces `attributeMod`. It never shrinks: L30 primary ≈ 68, so P ≈ 2.45.
- Everyone starts at 10 in all four.

## 3. Hit points and mana

- **Max HP** `= 40 + 12·(L − 1)`, plus 2 per point of Endurance above 10 from gear and talents. **Wardens ×1.25.**

| L | 1 | 5 | 10 | 15 | 20 | 25 | 30 |
|---|---|---|---|---|---|---|---|
| HP | 40 | 88 | 148 | 208 | 268 | 328 | 388 |
| Warden HP | 50 | 110 | 185 | 260 | 335 | 410 | 485 |

- **Max mana** `= 20 + 4·(INT − 10) + 3·L`. A Hedge-Mage at L10 has about 122, a non-mage about 86.
- **Regen:** in combat as today (HP 1 per 3 s, mana 1 per 1.5 s, scaled up by 1% of max per 3 s). **Out of combat (5 s after the last hit): 5% of max per second.** This cuts downtime, which matters more once fights are longer.

## 4. The to-hit roll

> **Roll d20 + Accuracy ≥ 9 + Defense.** A natural 1 always misses. A natural 20 always hits **and crits**.

**Player Accuracy** = `floor(weaponSkill / 20)` (0 to +5) + `clamp(Lyou − Ltarget, −5, +3)` + talents.
**Enemy Accuracy** = rank accuracy (normal 2, elite 4, boss 5) + `clamp(Lenemy − Lplayer, −5, +3)`.

**Defense** (both sides): base 0, plus:
- Shield equipped: `floor(Block / 20)` (0 to +5)
- Agility: `floor((AGI − 10) / 30)` (0 to +2)
- Talents and buffs
- Winged or nimble enemies: +2
- **Defense is capped at +6.** That's the safety rail that stops the old "immune at armor 12" problem.

**Armor is no longer in this roll.**

Sanity checks:

| Situation | Needs | Chance |
|---|---|---|
| L1 player (skill 5) vs L1 slug | 9 | 60% |
| L10 player (skill 45) vs L10 normal | 7 | 70% |
| L30 player (skill 100) vs L30 normal | 4 | 85% |
| L30 player vs L32 Mower (def +1) | 7 | 70% |
| L10 normal enemy vs L10 Slinger (no shield) | 7 | 70% |
| L10 normal enemy vs L10 Warden (shield, Block 45, 2 talent pts) | 11 | 50% |
| Boss L+3 vs fully capped Warden (def 6) | 10 | 55% |

## 5. Damage

```
damage = roll(weapon or spell range)
       × P(primary attribute)
       × (1 + skill / 400)              // proficiency, up to +25%
       × talent and buff multipliers
       × type multiplier                // weakness / resistance, see §7
       × (1 − mitigation)               // armor for physical, ward for magic
       × 2 on a crit
       minimum 1
```

### Weapons by item level

The `ItemDef.damage` dice become a **min–max range** from item level (ilvl, which is about the zone level):

- **One-handed average** `= 3 + 2·ilvl`, range **±40%** (min = 0.6 × avg, max = 1.4 × avg).
- **Two-handed:** average × 1.4, swing time × 1.4. Same DPS, bigger hits, better with on-hit talents.
- **Swing times:** 1-hand 2.0 s (currently 2.4), 2-hand 2.8 s, slingshot 2.2 s, blowpipe 1.6 s (avg × 0.8).
- **Rarity** adds to the average: Plain +0%, Sprouted +8%, Blooming +16%, Heirloom +25%, Kiln-fired +35% (see [items.md](items.md)).

| ilvl | 1 | 5 | 10 | 15 | 20 | 25 | 30 |
|---|---|---|---|---|---|---|---|
| 1-hand range | 3-7 | 8-18 | 14-32 | 20-46 | 26-60 | 32-74 | 38-88 |
| avg | 5 | 13 | 23 | 33 | 43 | 53 | 63 |

### Expected hit at level (level-appropriate Plain weapon, primary attribute on curve, before mitigation)

`avgHit(L) = (3 + 2L) × (1 + (L − 1) / 20)`

| L | 1 | 5 | 10 | 15 | 20 | 25 | 30 |
|---|---|---|---|---|---|---|---|
| avgHit | 5 | 16 | 33 | 56 | 84 | 117 | 154 |

Hitsplats go from single digits in Mossbottom to three digits on the Verge. That's a visible sense of growth, and RuneScape-style splats handle up to 4 digits fine.

### Spells

Spells have **ranks**. A rank learned at level Lr has a base average of:

- **Damage spells:** `1.5 × (3 + 2·Lr)`, range ±25%. Multiplied by P(INT), `(1 + schoolSkill/400)`, and the staff's spell bonus (`+1.5% × staff ilvl`).
- **Heals:** `2.0 × (3 + 2·Lr)`, range ±20%. Multiplied by P(INT) and `(1 + Bloom/200)`.
- **Mana cost:** `5 + 1.5·Lr`.

A spell hits about 1.5× a melee swing but costs mana and has a cooldown, so DPS comes out about even and burst is higher. Rank tables are in [classes.md](classes.md).

### Crits

- A natural 20 always crits. **Crit range** grows: −1 per 25 AGI above 10 (so a Slinger crits on 18-20 by L30), and talents can take it lower. **Floor: 16-20.**
- Crit = ×2 damage (Acorneer talents push it to ×2.5). Crits show as a big gold hitsplat.

## 6. Mitigation

### Armor (physical)

> **mitigation = Armor / (Armor + 40 + 20 × Lattacker)**, capped at **60%**.

Diminishing returns are built in, and because the attacker's level is in the formula, old armor goes stale as you move up. A slot's armor value:

`armor(piece) = (40 + 20·ilvl) × typeFactor × slotShare`

| Type | typeFactor | Full set at level (vs same-level attacker) |
|---|---|---|
| Cloth (smocks; Hedge-Mage) | 0.11 | about 10% |
| Leather (jerkins; Slinger) | 0.25 | about 20% |
| Plate (shell and Shard plate; Warden) | 0.55 | about 35% |
| Shield (adds on top) | 0.25 | +about 8% more |

Slot shares: **body 0.40, legs 0.20, head 0.15, hands 0.15, feet 0.10**. That adds three slots to the current four: **legs, hands, feet**. The old `armor` skill is renamed **Toughness** and adds +0.1% mitigation per level (up to +10%).

### Ward (magic)

Spells don't roll to hit (Flare "never misses" today, which keeps casters easy to play). Instead, each enemy has a **Ward %** per school, from its family (§7) and rank: elite +10%, boss +15%. Gear can add Ward against one school.

### Enemy armor

| Enemy kind | Armor (as fraction of `40 + 20·L`) | Mitigation |
|---|---|---|
| Soft (slugs, leeches, worms) | 0 | 0% |
| Normal | 0.11 | about 10% |
| Shelled (beetles, ants, earwigs) | 0.55 | about 35%. Crush ignores half. |
| Metal (the Mower, rust-rats) | 0.9 | about 47%, capped 60% |

## 7. Damage types and creature families

Physical: **Slash** (trowels, shears, claws), **Crush** (mallets, picks, sling-stones), **Pierce** (darts, thorns, pointed acorns). Magic: **Sun**, **Rain**, **Bloom**.

Weakness ×1.5 / ×1.25, resistance ×0.75 / ×0.5, immune ×0. Each family's numbers follow from what the creature *is* (lore rule 1):

| Family | Examples | Slash | Crush | Pierce | Sun | Rain | Bloom | Why |
|---|---|---|---|---|---|---|---|---|
| Soft | slug, leech, worm, Clogmaw, muck sprite | 1.25 | 0.75 | 1 | **1.5** | 0.5 | 1 | Sun dries them; water is home |
| Shelled | beetle, ant, earwig, centipede | 0.75 | **1.25** | 0.75 | 1 | 1 | 1 | Crack the shell |
| Furred | mole, rat, mouse | 1 | 1 | 1 | 1.25 | 1 | 1 | Fur burns |
| Winged | crow, wasp, moth, magpie | 1 | 0.75 | **1.5** | 1 | 1.25 | 1 | Shoot them down; wet wings. Defense +2. |
| Plant | straw-wight, weed-thing | 1.25 | 1 | 0.75 | **1.5** | 0.5 | 0 | Bloom feeds them |
| Fired clay | golems, Kiln Warden, gnomes | 0.75 | **1.25** | 0.75 | 0.5 | 1.25 | 1 | Already fired; water softens |
| Unfired clay | the Unfired | 1.25 | 1 | 1 | **2** | 0.75 | 1 | Sun *finishes firing them*, which is the kind ending |
| Metal | the Mower, rust-rats, oil-slugs | 0.5 | 1 | 0.5 | 0.75 | **1.5** | 1 | **Rust tames it**, as the Archive says |

That gives every class something to bring against every zone, and it tells the player the lore through the numbers.

## 8. Status effects

| Effect | Does | Main sources |
|---|---|---|
| **Chipped** (the physical "bleed"; clay dust, never blood) | Damage over 6 s | Hedgecutter Trim, claws |
| **Poisoned** | Damage over time, stacks up to 3 | Thornshot darts, wasps, spiders |
| **Burning** | Damage over 4 s; ends on Soaked targets | Sun |
| **Soaked** | +15% Rain damage taken; Sun on a Soaked target makes **Steam** (an area blind for 2 s) | Rain, Spinning Fountains |
| **Slowed** | −30% move and swing speed | Rain, Sod Buster, webs |
| **Rooted** | Can't move | Bloom, Burr Trap |
| **Staggered / Stunned** | Can't act for 1 s / 2-3 s. Bosses get 50% shorter stuns and immunity for 10 s after. | Crush talents, Shield Slam |
| **Cracked** | −25% armor for 8 s | Crush crits, Groundbreaker |
| **Glazed** | Absorbs damage | Bloom Glaze, potions |

## 9. Enemy stats by level

Base numbers for a **Normal** enemy at level L, tuned so a same-level fight takes about 4-6 player hits, and so a fight costs a non-Warden about 35-45% HP without healing.

- `HP(L) = avgHit(L) × min(5, 3 + L/5)`
- `damage avg(L) = 3 + 1.7·L`, range ±30%, every 2.4 s

| L | 1 | 3 | 5 | 8 | 10 | 12 | 15 | 18 | 20 | 22 | 25 | 28 | 30 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| HP | 16 | 36 | 62 | 118 | 167 | 209 | 281 | 361 | 419 | 482 | 583 | 693 | 772 |
| Dmg avg | 5 | 8 | 12 | 17 | 20 | 23 | 29 | 34 | 37 | 40 | 46 | 51 | 54 |

### Rank multipliers

| Rank | HP | Damage | Accuracy | XP | Plate colour |
|---|---|---|---|---|---|
| Trivial (critters, slugs) | ×0.6 | ×0.6 | 1 | ×0.5 | grey |
| Normal | ×1 | ×1 | 2 | ×1 | white |
| Elite | ×2.5 | ×1.3 | 4 | ×3 | gold border |
| Mini-boss | ×4 | ×1.4 | 4 | ×6 | gold |
| Boss (dungeon end) | ×6 | ×1.5 | 5 | ×10 | red |
| World boss | ×12 | ×1.6 | 5 | ×20 | red, skull |

**Co-op scaling** (the shared multiplayer server exists): elites and up get **+70% HP per extra player** nearby. Normal enemies don't scale.

## 10. Use-based skills (proficiencies)

Skills keep growing by use (the RuneScape and Elder Scrolls feel the game is built on), but **they don't level the character any more**, and they are **capped by character level: `skill cap = 5 + 4·L`** (9 at L1, 45 at L10, 100 at L24). That ends grinding one skill to 100 in Mossbottom.

| Skill | Was | Trained by | Gives |
|---|---|---|---|
| Blade | Blade | Hitting with Slash weapons | Accuracy `/20`, damage `/400` |
| Blunt | Blunt | Hitting with Crush weapons | same |
| **Marksmanship** | (new) | Hitting with ranged weapons | same |
| Block | Block | Blocking with a shield | Defense `/20` |
| **Toughness** | Armor | Being hit | +0.1% mitigation per level |
| **Sun** | Destruction | Casting Sun spells | Spell damage `/400` |
| **Rain** | (new) | Casting Rain spells | Spell damage `/400`; slow strength |
| **Bloom** | Restoration | Casting Bloom spells | Healing `/200` |

`skillXpToNext(level)` stays as it is. The cap does the limiting.

## 11. Tuning the intro (Mossbottom Vale) to the new rules

The existing data, re-expressed. The intro should *feel* about the same, just with bigger numbers.

**Enemies**

| Enemy | Old | New |
|---|---|---|
| Garden slug L1 (trivial, soft) | 6 HP, 1d3 | 10 HP, 2-4 dmg |
| Mole L2 (furred) | 10 HP, 1d4 | 25 HP, 4-8 dmg |
| Feral gnome L3 (fired clay) | 14 HP, 1d6 | 36 HP, 6-10 dmg |
| Stag beetle L4 (shelled, armor 35%) | 18 HP, 1d6 | 48 HP, 7-13 dmg |
| **Grubthorn the Mole King** L6 (boss, furred) | 60 HP, 2d6 | 470 HP, 14-26 dmg; new moves: *Burrow* (vanishes 3 s, pops up under you: ring telegraph) and *Mudsling* (ranged, slows) |

**Items** (ilvl → range)

| Item | Old | New |
|---|---|---|
| Rusty trowel | 1d6 blade | ilvl 1, 1-hand Slash, 3-7 |
| Bronze shears | 1d8 blade | ilvl 3, Slash, 5-13 |
| Garden mallet | 1d8 blunt | ilvl 3, Crush, 5-13 |
| Iron pick | 2d6 blunt | ilvl 5, **2-hand** Crush, 11-25 |
| Mole King claw | 2d8 blade | ilvl 7, Heirloom, Slash, 13-29 (Wardens and Slingers both want it) |
| Pot lid / Oak shield | armor 2 / 4 | ilvl 1 / 4 shield, armor 15 / 30 |
| Acorn cap / Thimble helm | 1 / 3 | ilvl 1 leather head 2 / ilvl 4 plate head 10 |
| Moss tunic / Bark vest / Beetle plate | 1 / 3 / 5 | ilvl 1 cloth body 3 / ilvl 3 leather body 10 / ilvl 6 plate body 35 |

**Spells:** Flare becomes 6-9 Sun damage at rank 1 (old 2d6). Mend becomes 8-12 at rank 1 (old 2d8).

## 12. Implementation notes

- `rules.ts`: replace `attributeMod` with `power(attr)`, `skillBonus` with `accuracyFromSkill` (/20) and `damageFromSkill` (/400). Change `attackRoll(bonus, armor)` to `attackRoll(accuracy, defense)` with the `9 +` target. Add `mitigation(armor, attackerLevel)`. Add `xpToNext`, `killXp`.
- `config.ts`: `ItemDef.damage` becomes `{ min, max }` or is derived from `ilvl`. Add `ilvl`, `rarity`, `damageType`, `hands`, `armorType`. `EnemyDef` gets `family`, `rank`; HP and damage can be computed from level × rank multiplier, so the table needs only level, rank and family plus overrides.
- `state.ts`: add `xp`, `skillPoints`, `talents`, `classId`; new equipment slots `legs`, `hands`, `feet`, `trinket`. Bump `SAVE_KEY` to `v2` and migrate v1 saves: level → XP at that level's start, equipment kept, skills clamped to the new cap.
- HUD: XP bar under the orbs. Hitsplat colours by damage type (Sun orange, Rain blue, Bloom green, Poison purple; crit is gold and bigger).

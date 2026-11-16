# Classes and skill trees

Three classes, **melee, ranged, magic**, each with a base kit learned from trainers and a three-branch talent tree paid for with skill points. The numbers use [combat.md](combat.md).

## The Calling (choosing a class)

- The player starts **classless** in Mossbottom Vale, with today's kit: any weapon, Flare r1, Mend r1. That keeps the intro exactly as it plays now.
- In **Thatchford**, at level 5 or higher, the three trainers in the guildhall each offer a short trial quest (see quest "The Calling" in [quests.md](quests.md)). Finishing one makes that your class.
- The weapons and armor you've collected matter: the trainer looks at your most-used skill and says so ("You swing like a Warden already").
- **Respec:** talk to your trainer. Free the first time, then `level² gold`. You can change talents, but **not class**. Class is permanent per character.
- Non-mages keep **Flare r1 and Mend r1** forever as utility. Only Hedge-Mages learn higher ranks.

## Skill points

- **+1 per level from 2 to 30** (29 points), plus **+1 for each chapter finale** (chapters 1-6, 6 points) = **35 points at cap**.
- Each class has 3 branches of 6 talents. A branch holds 14 ranks: `3 + 3 + 1 + 3 + 3 + 1`.
- **Tier gates** count points spent *in that branch*: tier 1 at 0, tier 2 at 2, tier 3 at 4, tier 4 at 6, tier 5 at 8, **capstone at 12**.
- 35 points buys two full branches (28) plus 7 in the third, or one full branch with the rest spread out. **At most two capstones.** That's the specialisation.

```
Branch layout (all nine branches use this shape)

  Tier 1  [ passive x3 ]        needs 0 in branch
  Tier 2  [ passive x3 ]        needs 2
  Tier 3  [ ACTIVE  x1 ]        needs 4
  Tier 4  [ passive x3 ]        needs 6
  Tier 5  [ passive x3 ]        needs 8
  Tier 6  [ CAPSTONE x1 ]       needs 12
```

---

## Warden (melee)

*Lore:* Wardens descend from Gnorwin's Groundskeepers, the gnomes who stood between the lawn and what came for it. The pot-lid shield is their badge. Every Warden's first shield is a lid from home. They are trained in Thatchford by Sergeant Briar Stoutpot and in Flintdelve by the Delvers.

- **Primary:** Strength. **Armor:** plate, shields. **Weapons:** trowels, shears, mallets, picks, two-handed hoes and mattocks.
- **HP ×1.25.**
- **Resource: Grit** (0-100). +8 per hit you land, +5 per hit you take, +15 per block. Drains 5/s out of combat. Wardens hit harder the longer they stand in the fight.

### Base kit

| Lvl | Ability | Cost | Does |
|---|---|---|---|
| 5 | **Bash** | 20 Grit | 130% weapon, Crush, Stagger 1 s. 6 s cd. Rank 2 at L12, rank 3 at L20 (+20% each). |
| 6 | Hold the Line | passive | Can use plate and shields |
| 8 | **Hedge Charge** | – | Rush to a target up to 10 m away, Stagger 1 s, +15 Grit. 15 s cd. |
| 10 | Rallying Shout | 30 Grit | +10% damage to you and nearby allies for 30 s |
| 14 | Second Wind | 50 Grit | Heal 25% max HP over 6 s. 90 s cd. |
| 18 | Challenge | – | Co-op: enemies target you for 6 s. Solo: target's accuracy −2 vs you. 20 s cd. |
| 22 | Sunder | 25 Grit | Cracked (−25% armor) for 8 s |
| 26 | Last Stand | – | +30% max HP for 20 s. 3 min cd. |

### Talent tree

**Bulwark** (shield, survival)

| Tier | Talent | Ranks | Effect |
|---|---|---|---|
| 1 | Thick Clay | 3 | +4% max HP per rank |
| 2 | Pot-Lid Practice | 3 | +1 Defense per rank with a shield (still capped at +6) |
| 3 | **Shield Slam** | 1 | 30 Grit: Crush = 100% weapon + half your shield's armor, Stun 2 s. 12 s cd. |
| 4 | Glazed Over | 3 | −3% damage taken per rank |
| 5 | Spiked Lid | 3 | When an enemy misses you while you hold a shield, it takes 15% / 30% / 45% of your weapon average as Crush |
| 6 | **Unbreakable** | 1 | A killing blow leaves you at 1 HP with 40% damage reduction for 6 s. 2 min cd. *"You crack, but you hold."* |

**Hedgecutter** (blades, speed, Chipped)

| Tier | Talent | Ranks | Effect |
|---|---|---|---|
| 1 | Keen Edge | 3 | +3% Slash damage per rank |
| 2 | Quick Snips | 3 | −4% swing time per rank |
| 3 | **Trim** | 1 | 20 Grit: 80% weapon now plus Chipped for 80% over 6 s |
| 4 | Double Snip | 3 | 5% / 10% / 15% chance to swing twice |
| 5 | Deep Cuts | 3 | Chipped deals +15% per rank. At rank 3, Chipped stacks twice. |
| 6 | **Topiary** | 1 | 50 Grit: spin, 150% weapon to everything within 3 m, and Trim each. 10 s cd. |

**Groundbreaker** (blunt, two-handed, stuns, crowds)

| Tier | Talent | Ranks | Effect |
|---|---|---|---|
| 1 | Heavy Hands | 3 | +4% damage with two-handed weapons per rank |
| 2 | Tamp Down | 3 | Crits Stagger for 1 s. At rank 3 they also Crack. (Ranks 1-2: +5% crit damage.) |
| 3 | **Sod Buster** | 1 | 35 Grit: slam the ground, 120% weapon to everything within 4 m, Slowed 4 s. 8 s cd. |
| 4 | Bedrock | 3 | +8% damage per rank against Staggered, Stunned or Slowed targets |
| 5 | Clod Thrower | 3 | Bash also hits 1 / 2 / 3 extra enemies nearby for 50% |
| 6 | **Gnome Smash** | 1 | 60 Grit: leap up to 12 m, 250% weapon to everything within 3 m, Stun 3 s. 30 s cd. |

**Sample builds:** *Shieldwall* (Bulwark 14, Hedgecutter 14, Groundbreaker 7) is the co-op tank. *Lawnwrecker* (Groundbreaker 14, Hedgecutter 14, Bulwark 7) is the solo two-hander.

---

## Slinger (ranged)

*Lore:* Slingers are Hedgewood hunters' craft. They shoot acorns, stones and thorns from forked-twig slingshots, and darts from reed blowpipes. Hazel Twitchett trains them in Thatchford and Juniper Quickstring in Barkhollow. Slingers swear the Mower can be shot. They're half right: it has a Heartspark.

- **Primary:** Agility. **Armor:** leather. **Weapons:** slingshots (2.2 s), blowpipes (1.6 s, ×0.8 damage), throwing acorns (thrown, 1-hand). Offhand: **ammo pouch**.
- **Resource: Focus** (0-100). Regenerates 12 per second. Abilities spend it. Slingers keep up steady pressure.
- **Range:** auto-shot 12 m. Within 2 m, shots deal −30% (get some distance).
- **Ammo type sets the damage type** (L6). Ammo is unlimited. The pouch only picks the type:
  - **Pebbles**: Crush. Best against shells and clay.
  - **Thorns**: Pierce. Best against wings.
  - **Burr-acorns**: Pierce, −10% damage, every hit Slows 1 s.
  - **Ember-acorns** (Rockery, L20+): Sun, −15% damage. For soft and plant targets.
  - **Rust-acorns** (Verge, L26+): Rain, −15% damage. For metal (the Mower).

  That makes the Slinger the class that can pick a damage type for any fight.

### Base kit

| Lvl | Ability | Cost | Does |
|---|---|---|---|
| 5 | **Aimed Shot** | 40 Focus | 1.5 s cast, 190% weapon. Ranks at L12 and L20 (+20% each). |
| 6 | Ammo Pouch | passive | Leather; choose an ammo type |
| 8 | **Scramble** | 20 Focus | Leap back 6 m. 12 s cd. |
| 10 | Pebble Spray | 50 Focus | Cone, 6 m: 80% weapon to everything |
| 14 | Mark Quarry | 10 Focus | Target takes +10% from all sources for 20 s |
| 18 | Pinning Shot | 30 Focus | Rooted 3 s |
| 22 | Volley | 60 Focus | 5 m circle at range: 3 waves of 60% weapon |
| 26 | Steady Breath | – | Focus regen ×2 for 10 s. 2 min cd. |

### Talent tree

**Acorneer** (slingshot, big shots, crits)

| Tier | Talent | Ranks | Effect |
|---|---|---|---|
| 1 | Hard Acorns | 3 | +3% ranged damage per rank |
| 2 | Steady Hand | 3 | Aimed Shot cast −0.2 s per rank |
| 3 | **Bullseye** | 1 | 40 Focus: instant shot that always crits. 20 s cd. |
| 4 | Hawk Eye | 3 | +15% crit damage per rank (×2 becomes ×2.45) |
| 5 | Long Shot | 3 | +1.5 m range per rank. Shots from beyond 8 m deal +5% per rank. |
| 6 | **Knockout** | 1 | +1 crit range. Aimed Shot crits Stun for 2 s and reset Bullseye. |

**Thornshot** (blowpipe, poisons)

| Tier | Talent | Ranks | Effect |
|---|---|---|---|
| 1 | Nettle Darts | 3 | Auto-shots have an 8% / 16% / 24% chance to Poison (40% weapon over 6 s) |
| 2 | Quick Breath | 3 | −5% blowpipe swing time per rank |
| 3 | **Thistle Volley** | 1 | 35 Focus: 3 darts at up to 3 targets, each Poisons |
| 4 | Creeping Rot | 3 | Poison +15% per rank. At rank 3, Poison stacks to 4. |
| 5 | Numbing Sap | 3 | Poisoned enemies deal −4% damage per rank |
| 6 | **Hemlock** | 1 | Your shots deal double damage to Poisoned targets below 30% HP |

**Trapper** (traps, beetle companion)

| Tier | Talent | Ranks | Effect |
|---|---|---|---|
| 1 | Snare Lore | 3 | Traps last +25% and arm 0.5 s faster per rank |
| 2 | Field Dressing | 3 | Each kill heals you 3% max HP per rank |
| 3 | **Burr Trap** | 1 | 25 Focus: lay a trap. The first enemy on it is Rooted 4 s and Chipped. Up to 2 traps, 15 s cd. |
| 4 | Beetle Companion | 3 | Summon your tamed stag beetle (from "A Beetle of Your Own" in the Hedgewood; until then a garden snail stands in). Pet HP and damage +0% / 20% / 40%. The pet draws enemies. |
| 5 | Pack Bond | 3 | You and your pet deal +3% damage per rank; your crits heal your pet 5% |
| 6 | **Hunter's Calm** | 1 | When neither you nor your pet has taken damage for 3 s, both regenerate 3% HP/s. Your traps also apply Mark Quarry. |

**Sample builds:** *Deadeye* (Acorneer 14, Thornshot 14, Trapper 7) is pure damage. *Beastwarden* (Trapper 14, Acorneer 14, Thornshot 7) is the solo pet build and the safest for new players.

---

## Hedge-Mage (magic)

*Lore:* Hedge-Mages work the three things a lawn needs: Sun, Rain and Bloom (lore rule 7). The craft came out of the Kiln-lore. Old mages say the Kiln's fire was the first Sun spell and the Spigot's water the first Rain. Magister Sorrel Dimm trains them in Thatchford. The Royal Archive keeps the higher ranks. Bloom mages are also the realm's healers. "Mending" a gnome means glazing their cracks shut.

- **Primary:** Intelligence. **Armor:** cloth (smocks). **Weapons:** staffs (2-hand, weak melee, +1.5% spell damage per ilvl) or a wand plus an offhand charm.
- **Resource: Mana.** In-combat regen is 1% of max per second (others get 0.5%).
- Short casts root you for the cast. Instants don't.

### Spell ranks

Ranks follow the formulas in [combat.md](combat.md) §5 (damage `1.5 × (3 + 2·Lr)`, heals `2.0 × (3 + 2·Lr)`, cost `5 + 1.5·Lr`). Before multipliers:

| Spell | School | Ranks learned at | Rank 1 | Top rank (L30) | Notes |
|---|---|---|---|---|---|
| **Flare** | Sun | 1, 6, 12, 18, 24, 30 | 6-9 | 71-118 | Instant, 1.8 s cd, never misses (all classes have rank 1) |
| **Mend** | Bloom | 1, 8, 14, 20, 26 | 8-12 | 88-132 | 1 s cast, self or ally (all classes have rank 1) |

### Base kit

| Lvl | Spell | School | Does |
|---|---|---|---|
| 5 | **Drizzle** | Rain | 1 s cast: 60% of Flare's damage plus Soaked and Slowed for 6 s |
| 6 | **Root Snare** | Bloom | Rooted 4 s. 15 s cd. |
| 10 | **Sunbeam** | Sun | Channel 3 s: 3 ticks of 80% Flare |
| 12 | **Puddle Step** | Rain | Blink 8 m. 20 s cd. |
| 16 | **Downpour** | Rain | 5 m circle for 6 s: 25% of Flare per second, Soaked |
| 20 | **Thin Glaze** | Bloom | Absorb 15% max HP on yourself. 30 s cd. |
| 26 | Rainbow | passive | Sun on a Soaked target makes Steam (2 s area blind) and +30% damage |

### Talent tree

**Sun** (burst damage)

| Tier | Talent | Ranks | Effect |
|---|---|---|---|
| 1 | Kindling | 3 | +3% Sun damage per rank |
| 2 | Dry Spell | 3 | Sun spells cost −5% mana per rank |
| 3 | **Heatwave** | 1 | Cone, 7 m: 130% Flare plus Burning. 10 s cd. |
| 4 | Scorch | 3 | Flare crits Burn for 20% / 40% / 60% of the hit over 4 s |
| 5 | Long Day | 3 | Flare cooldown −0.2 s per rank |
| 6 | **Midsummer** | 1 | Every 4th Flare is free and deals triple |

**Rain** (control, and the best branch against the Mower)

| Tier | Talent | Ranks | Effect |
|---|---|---|---|
| 1 | Cold Snap | 3 | Your Slows are 5% stronger and Rain damage +3% per rank |
| 2 | Soak Through | 3 | Soaked lasts +2 s and the target takes +3% damage per rank |
| 3 | **Hailstone** | 1 | 120% of Flare as Rain, Stun 2 s. 12 s cd. |
| 4 | Undertow | 3 | Drizzle and Downpour cost −8% per rank; Drizzle cast −0.25 s per rank |
| 5 | Rust Lore | 3 | +8% Rain damage against Metal and Fired clay per rank. *"Rust tames it." Royal Archive, Gromwell's notes.* |
| 6 | **Thunderhead** | 1 | A storm cloud follows you for 10 s and strikes the nearest enemy every second for 50% Flare (Rain), Soaking it. 45 s cd. |

**Bloom** (healing, roots, protection, and the co-op healer)

| Tier | Talent | Ranks | Effect |
|---|---|---|---|
| 1 | Green Thumb | 3 | +6% healing per rank |
| 2 | Overgrowth | 3 | Root Snare +1 s per rank; rooted targets take +3% damage per rank |
| 3 | **Thick Glaze** | 1 | Absorb 30% max HP on yourself or an ally for 10 s. 25 s cd. |
| 4 | Regrowth | 3 | Mend also heals 10% / 20% / 30% more over 8 s |
| 5 | Mulch | 3 | When an enemy dies near you, allies within 8 m heal 2% max HP per rank |
| 6 | **Fairy Ring** | 1 | A ring of mushrooms for 8 s, 6 m wide: allies inside heal 4% max HP/s, enemies Slowed 50%. 60 s cd. |

**Sample builds:** *Sunburst* (Sun 14, Rain 14, Bloom 7) is solo damage with Soak and Steam combos. *Groundskeeper* (Bloom 14, Rain 14, Sun 7) is the co-op healer and controller.

---

## Hotbar and UI notes

- Hotbar keys **1-8**. Today's 1 (Flare) and 2 (Mend) stay where they are, and new abilities fill 3 onward. Right-click a hotbar slot to swap.
- A new side-panel tab, **Talents**, shows the 3 branches as columns with tier gates. Hovering a talent shows rank text.
- The resource bar sits under the HP orb: **Grit** is brown (fills in combat), **Focus** green (fills by itself) and **Mana** blue.
- Class icons: Warden is a pot lid, Slinger a forked twig, Hedge-Mage a sprouting acorn.

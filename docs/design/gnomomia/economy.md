# Gnomes of Gnomomia: economy (XP, coins, skills)

How XP, coins, use-based skills and talents are paced across the story, the simulation that measures it, and the numbers in force. The tuning lives in one table, `games/gnomes-of-gnomomia/src/data/economy.ts` (`ECONOMY`), read only through the formulas in `src/economy.ts`. Gameplay and the sim both call those formulas, so the sim measures the real rules. Plan: [docs/roadmaps/gnomomia-economy-scaling.md](../../roadmaps/gnomomia-economy-scaling.md).

## The problem

Everything was earned in Mossbottom. A player left the first zone at level 9 with about 1,550 coins, when the whole Thatchford kit cost about 300. From then on they carried 5 to 21 times the price of the next zone's kit, so no shop ever mattered again (45,000 coins unspent at the end). Kill XP grew linearly (`6 + 2L`), so a Verge kill was worth only 4.4 times a Mossbottom kill. Use-based skills levelled at a flat `2 + s/2` uses, so the weapon skill sat at its level cap for half to three quarters of all combat time, Keep onwards. Talents had no gates: all 41 ranks opened as fast as points came.

## The model

`src/sim/economy.ts`, `runEconomy()`: one player of one class plays the whole story once, with the real content (quests, spawns, enemies, items, shops, talents). Pure and deterministic.

- **Phases** (`src/sim/economyPhases.ts`): seven, in story and level order. Each quest and spawn group goes to the first phase that lists its zone and whose band holds its level.

  | Phase | Zones | Band |
  |---|---|---|
  | mossbottom | Mossbottom | 1-6 |
  | thatchford | Thatchford | 6-11 |
  | keep | Keep + upper Deeps | 10-14 |
  | cloverfield | Cloverfield | 11-16 |
  | hedgewood | Hedgewood + mid Deeps/Keep | 15-20 |
  | rockery | Rockery + lower Deeps + Keep chapter 6 | 19-25 |
  | verge | the Verge | 25-30 (grinds to 30) |

  The lower Deeps and the Chapter 6 Keep quests (levels 21-25, no shop of their own) were an eighth phase, `deeps`, of 1.4 h. They are Chapter 6 content and now play inside the Rockery phase.
- **Player model** (`DEFAULT_PLAYER`, every field can be overridden): quests take 6 / 10 / 15 minutes (side / main / finale) plus their kills; a kill takes 15 s (trivial) to 400 s (final boss), walking and resting included; each respawning spawn group is cleared twice per phase; 6 heal potions per combat hour, bought at the best heal potion on sale.
- **Skills**: one track per skill, as in the game. A warden's hit trains the equipped weapon's skill (`rules.weaponSkillFor`, the same function `combat.ts` calls: slash and pierce train Blade, crush trains Blunt, slings Marksmanship), so swapping a fork for a hoe leaves Blunt behind. A mage's casts split 55% Sun, 25% Rain, 20% Bloom. Uses per kill are the arena's landed hits: 4 (warden), 5 (slinger), 3.5 (mage) per normal kill, scaled by enemy HP for other ranks; 1.5 hits taken per normal kill train Toughness. The test re-measures the hits in the combat arena. The report shows every skill, and the lowest weapon or school skill in use per phase.
- **Order**: activities in a phase run lowest level first; a quest waits until dialogue can start it. After each activity the player shops: per slot, the best affordable class item at or below their level whose gate is open. Quest reward items are worn if better, else sold. Loot sells at half value. If the phase ends below its top level, the player grinds its best normal mob (at most 20 h).
- **Measured per phase**: levels in/out, hours (quest / kill / grind), XP per normal kill, normal kills per level, coins earned and per hour, loot's share of coins, spent on gear and potions, coins carried out, the next phase's kit cost, the share of this phase's kit owned at the end, the hours from each kit item opening (its level reached, its gate open) to owning it, skill-ups per hour, every skill's level, the lowest weapon or school skill vs the cap, the share of weapon-skill uses landing at the cap, talent points vs spendable ranks.
- **Player variants** (`PLAYER_VARIANTS`): `potions-x3` (18 potions per combat hour), `slow-kills` (every kill takes 1.5x as long), `one-clear` (each group cleared once per phase), `few-hits` (a third fewer hits per kill). `--check` and the test run all of them for every class and require no margin flag (`MARGIN_FLAGS`: too rich, too poor, grind wall, skill capped early, unspent talents, flat XP, front-loaded coins, falling kills per level).
- **Assumptions**: every roll is its expected value; no deaths; no grinding beyond the end-of-phase top-up; no rest XP; one fixed choice per story branch, so 7 quests on the other branches are skipped (the test checks every gate quest is done under every value of every choice); Block is not trained by the sim (the loadouts give it Toughness's level).

## Targets and flags

`ECONOMY_TARGETS` and `checkEconomy()` in `src/sim/economy.ts`. Any flag fails `--check`.

| Flag | Fires when | Why |
|---|---|---|
| `TOO_RICH` | coins carried out of a phase > 1.0 x the next phase's full class kit (skipped when the next phase has no shop) | arriving able to buy everything means the new shop is not a goal |
| `TOO_POOR` | own kit owned at phase end < 50% (phases with a shop) | the player should still get most of a zone's gear while there |
| `GRIND_WALL` | grind hours > 1.5 x quest + kill hours | the content, not grinding, should carry the levels |
| `FLAT_XP_SCALING` | Verge median normal-kill XP < 8 x Mossbottom's | late kills must feel worth far more |
| `FRONT_LOADED_COINS` | Mossbottom + Thatchford earn > 25% of all coins | money should grow with the story |
| `SKILL_CAPPED_EARLY` | > 50% of weapon-skill uses land at the cap, Keep onwards | skills should still be growing in the late game; early zones may cap |
| `UNSPENT_TALENTS` | talent points - spendable ranks > 2 (once the class is chosen) | gates must not strand points |
| `FAST_PHASE` / `SLOW_PHASE` | phase hours outside 0.4-2.5 x the median phase (the roadmap's band; was 0.3 while the 1.4 h Deeps phase existed) | no zone should be a blip or a slog |
| `SHRINKING_PHASE` | from the third phase on, hours < 0.75 x the median of the phases before it | later zones take at least as long (a strict "each phase >= the last" cannot hold for hand-made zones of different sizes) |
| `SLOW_SKILL` | skill-ups per hour (all trained skills) < 3.5 | skills must keep visibly growing; why 3.5 and not 5: see the critique response |
| `GEAR_LATE` | mean hours from a kit item opening to owning it > 0.5 x the phase's hours | gear the zone sells must be in reach while there |
| `FALLING_KILLS_PER_LEVEL` | projected phases: normal kills per level < 0.97 x the previous phase's | levels must not get cheaper |
| `GEAR_INSTANT` (watch) | mean opening-to-owning lag < 0.1 h | measured and printed, does not fail yet: see "Gear as a goal" |

## Formulas and values

`L` = level, `s` = skill level, knee = `curveKnee` 30 (where shipped content ends). Levels: cap 30.

| What | Formula (`src/economy.ts`) | Round 1 | Now |
|---|---|---|---|
| XP to next level | `round((base + perLevel L + perLevelSq L^2) * growth^(min(L,knee)-1) * lateGrowth^(max(0,L-knee)))` | base 150, perLevel 90, perLevelSq 20, growth 1.04 | same to 30; lateGrowth 1.06 past it |
| Kill XP | `round((base + perLevel L) * growth^(L-1) * rank * levelDiff)` | base 6, perLevel 2, growth 1.07 | unchanged |
| Quest XP | normal kill XP at the quest's level x tier x zone | side 10, main 20, finale 40 | Verge quests x1.1 (`questZoneXp`) |
| Coins (quest and enemy) | `reward.gold` or `EnemyDef.gold` x `scale * growth^(min(L,knee)-1) * (max(L,knee)/knee)^latePower` | scale 0.1, growth 1.11 | same to 30; latePower 2 past it (follows item prices) |
| Skill cap | `capBase + capPerLevel min(L,knee) + lateCapPerLevel max(0,L-knee)` | `5 + 4L` | same to 30; +3 a level past it |
| Uses to next skill level | `floor(usesBase + usesPerLevel s + usesPerLevelSq min(s, 125)^2)` | 2, 0.5, 0.02 (9 at s10, 104 at s60, 350 at s120) | 2, 0.25, 0.006 (5, 38, 118) |
| Catch-up | a use while `s < catchUpBelow x cap` counts `catchUpMult` | none | below 0.8 x cap a use counts double (`progression.useSkill`) |

Quest gold moved (pack `reward.gold`): Hedgewood quests x0.6 (two steps: x0.7, then x0.86), Keep quests x1.8, Cloverfield quests x2.0 (x1.3, then x1.23, then x1.25), rounded to 5. Item prices did not change except in Mossbottom (round 1): thimble helm 80 -> 16, beetle plate 180 -> 36, Mole crown value 300 -> 40.

## Quest gates

A gate is `gate: { when, why }` on an `ItemDef` or `TalentDef` (`src/config.ts`, checked by `src/gates.ts`). A gated item stays on the shelf, dimmed with a lock and its `why`; a gated talent shows a lock and its `why`.

- **Talents**: every tier-5 talent needs Chapter 3's finale `c3-ledger` (What the Ledger Says, level 12); every tier-6 capstone needs Chapter 5's finale `c5-heartwood` (The Heartwood, level 20). `LEDGER_GATE` / `HEARTWOOD_GATE` in `src/data/classes.ts`.
- **Shop items**, each behind a main quest of its own chapter:

  | Item | Shop | Quest |
  |---|---|---|
  | `c2-felted-hood` | Dock Clodpate, Thatchford | `c2-pressures-wrong` (level 8) |
  | `c3-quilted-coat` | Armourer Ferrule, Keep | `c3-three-accounts` (11) |
  | `c4-thistledown-smock` | Tilth Anvilhand, Sodbury | `c4-granary` (13) |
  | `c4-ribbon-charm` | Tilth Anvilhand, Sodbury | `c4-antenna-sister` (14) |
  | `c5-silk-gloves` | Pelt Ashwick, Barkhollow | `c5-weaver-below` (18) |
  | `c5-barkhollow-token` | Pelt Ashwick, Barkhollow | `c5-fens-two-families` (17) |
  | `c6-kiln-felt-boots` | Cobalt, Rockery | `c6-honest-words` (22) |
  | `c6-shard-pendant` | Cobalt, Rockery | `c6-the-unfired` (23) |
  | `c7-rain-hood` | Hobnail Ferrule, Verge | `c7-same-table` (28) |
  | `c7-muster-medal` | Hobnail Ferrule, Verge | `c7-no-hats` (27) |

  The current list: `grep -rn "gate:" games/gnomes-of-gnomomia/src/data`. `economy.test.ts` runs the sim once per value of every choice flag and requires every gate quest done in each.

## Premium sinks

New stock in each shop from Thatchford on, so late coins have something to buy. Value follows the item convention: sprouted 2 x ilvl^2, blooming 4 x ilvl^2. All reuse existing prefabs.

| Shop | New stock | Price |
|---|---|---|
| Dock Clodpate (Thatchford) | 5 sprouted, ilvl 10: fork, slingshot, staff, tabard, hood | 200 each |
| Armourer Ferrule (Keep) | 5 blooming, ilvl 12-13: spear, sling, staff, cap, coat | 576-676 |
| Tilth Anvilhand (Sodbury) | 5 blooming, ilvl 16: hay hook, lasso-sling, wand, smock, charm | 1,024 |
| Rook Axehandle (Clippings) | 4 blooming, ilvl 19-20: shears, slingshot, crook, helm | 1,444-1,600 |
| Pelt Ashwick (Barkhollow) | 3 blooming, ilvl 19: hood, gloves, token | 1,444 |
| Cobalt (Rockery) | 7 blooming, ilvl 22-24: pick, sling, rod, greaves, leggings, boots, pendant | 1,936-2,304 |
| Hobnail Ferrule (Verge) | 9 blooming, ilvl 28-29: hoe, sling, crook, three body pieces, leggings, hood, medal | 3,136-3,364 |

## Critique response (round 2)

The round-1 tuning passed its own checks with almost no margin, and the sim credited one weapon skill at 3.5 times the hits the arena lands. What changed, item by item:

1. **One skill per skill id: done.** One track per `SkillId`; a hit trains the equipped weapon's damage-type skill through the same function as `combat.ts`; the mage's casts split over Sun, Rain and Bloom. The report shows the lowest skill in use, and the classes now differ: at L30 warden Blade 87 / Blunt 94, slinger Marksmanship 104, mage Sun 91 / Rain 74 / Bloom 67 (cap 125). Added a catch-up rule in the game: a use counts double while the skill is below 0.8 x its cap.
2. **Money margin: done.** Four player variants run in `--check` and in the test. Quest gold moved from the Hedgewood (x0.6) into the Keep (x1.8) and Cloverfield (x2.0). Kit share under `potions-x3`: Keep 67%, Cloverfield 68% (was 34% and 37%, `TOO_POOR`); no variant raises a margin flag; `SKILL_CAPPED_EARLY` is gone everywhere (worst: slinger `one-clear` Keep, 46%).
3. **Gear matters: partly.** The report gives, per kit slot, the hours from the item opening to owning it; `GEAR_LATE` (more than half a phase) fails `--check` and never fires. The other side, "above 0", does not hold: the lag is 0-0.1 h in five of seven phases, because coins carried in pay for each item the moment its level is reached. Cutting late coin growth (1.08 or 1.09 instead of 1.11) did not move it, and cutting early coins breaks the potions-x3 margin. `GEAR_INSTANT` is a printed watch flag, not a failing one, until a pricier late sink tier exists (see "Gear as a goal"). Kit share and carry ratio are still reported.
4. **Thresholds: done.** The `deeps` phase is merged into Rockery (19-25, 5.3 h); the short-phase floor is back at 0.4 x median; `SHRINKING_PHASE` checks that later phases are not shorter than 0.75 x the median of earlier ones (Keep 3.1 h against 3.45 h is the closest).
5. **Golden: done.** `economy.golden.json` now pins, per class and per variant: per phase levelOut, coin and XP ratios, carry ratio, cap share and kit share (+-0.1); total hours and hours to levels 10, 20, 30 (+-10%); coins left (+-15%). A test doubles all coin rewards and checks the golden fails.
6. **Sims agree: done.** Uses per kill come from the arena (and a test re-measures them: arena median within +-50% of the model). The combat loadouts no longer assume 0.85 x cap: `buildLoadout` takes each skill from the economy run of the same class and level (`src/sim/skillFill.ts`) unless a test asks for a fixed `skillFill`. One balance test needed a new number: the Hedge-Mage on the Old Gleaner now runs out of mana in 60% of 60 seeds (52% with the old fill; the old `< 0.5` passed on 15 seeds by luck), so its bound is `< 0.65`; it still wins every run.
7. **Feel: done, by the curve.** Picked lowering the uses curve, not a UI change: the skills panel already shows progress to the next level, and only the curve changes skill-ups per hour. `usesPerLevelSq` 0.02 -> 0.006 and `usesPerLevel` 0.5 -> 0.25 (lower than the critique's 0.012, because honest hits are 3.5x fewer than the old 25 per minute). Skill-ups per hour, warden: 23.8 / 11.6 / 9.5 / 5.5 / 4.7 / 5.3 / 8.8 (was 20 -> 2.1). The target is 3.5 an hour, not 5: a skill on its cap rises 4 per character level, and Cloverfield and the Hedgewood give 3 levels in about 4.9 h, so even two skills sitting on the cap make 4.9 an hour (the slinger trains only two). Meeting 5 everywhere needs faster mid-game levels or a steeper skill cap, both changes to combat. Lowest: slinger Rockery 3.8.
8. **Smaller items: done.** Hedgewood quest gold -40% (it was 20% of the game's coins; now 19%), given to the Keep and Cloverfield. The Verge's quests give 10% more XP (`questZoneXp`): its grind fell from 1.6 h to 1.2 h. A test runs every value of every choice flag and requires every gate quest done. Loot's share of coins is now reported (11-61% per phase, 18% in the Verge).

Not changed: the respec cost (`level^2`) and the heal price stay on the unscaled scale (nit 10: noted, small next to Verge income). "Verge 22.5x Mossbottom" XP per kill stays as a target, and kills per level are now reported next to it (51 at Mossbottom to 137 at the Verge).

## Before and after (round 2)

Warden, default player. Round 1 = the PR's first tuning (sim of that time: one weapon skill at 25 uses per minute); round 2 = now.

| Phase | Levels | Hours | Coins earned | carry | kit | lag h (mean/max) | skill-ups/h | low skill / cap |
|---|---|---|---|---|---|---|---|---|
| mossbottom | 1-6 | 2.1 | 496 | 0.55 | 71% | 0.0/0.0 | 20 -> 23.8 | 27 -> 21/29 (Blade) |
| thatchford | 6-11 | 4.8 | 1,134 | 0.47 | 100% | 0.0/0.0 | 7.7 -> 11.6 | 45 -> 38/49 (Blunt) |
| keep | 11-14 | 3.1 | 436 -> 637 | 0.15 -> 0.02 | 67% -> 100% | 0.2/0.7 | 7.7 -> 9.5 | 57 -> 45/61 (Blunt) |
| cloverfield | 14-17 | 4.9 | 2,266 -> 3,071 | 0.07 -> 0.24 | 100% | 0.4/0.7 | 4.5 -> 5.5 | 68 -> 59/73 |
| hedgewood | 17-20 | 4.9 | 8,288 -> 7,643 | 0.42 -> 0.47 | 100% | 0.0/0.0 | 3.9 -> 4.7 | 80 -> 64/85 |
| rockery (+ deeps) | 20-25 | 4.0 + 1.4 -> 5.3 | 5,711 + 4,805 -> 10,516 | 0.80 | 100% | 0.0/0.0 | 3.5 / 2.1 -> 5.3 | 90 -> 74/105 |
| verge | 25-30 | 4.8 -> 4.5 | 17,465 -> 17,102 | - | 100% | 0.0/0.0 | 5.6 -> 8.8 | 105 -> 87/125 |
| **total** | | 29.9 -> 29.5 h | 40,601 -> 40,599 | | | | 188 -> 252 skill-ups | |

Slinger: 29.5 h, 46,389 coins, 20,952 left, Marksmanship 104/125 at 30. Mage: 48,626 coins, 21,675 left, Bloom 67 / Sun 91. Flags: 0 per class (plus the `GEAR_INSTANT` watch); 0 margin flags in 12 variant runs. Round 1's warden "skill 105/125" was one track credited 25 uses per minute, 3.5x the arena's hits.

## Raids and kill credit (round 3)

Two changes to the curve, from the raids roadmap (`docs/roadmaps/gnomomia-rebalance-raids.md`).

**Kill credit.** Before, every enemy that died near the player paid the player in full, whoever landed the killing blow, so the six AI gnomes' kills paid XP, loot and gold. Now kill XP, loot and gold are paid only when the player hit the enemy (`killEntity` in `src/entities.ts`, the kill handler in `src/progression.ts`). Raid spawns never pay (`EnemyDef.noReward`). The sim plays one solo player, so the farm report is the check. Water beetle (L6) farmed by a level-8 warden, before (3 assisted kills a minute, as with AI gnomes nearby, 2 h) and after (solo, 1 h):

```
Farm: Water beetle (L6) as level 8 warden, 2 h, own kill 35 s, assisted 3/min
  XP/kill 15, kills to level 9: 189 (~40.1 min), XP/h 4,243
  level 8 -> 10.03 in 2 h, kills 565
  weapon skill 29 -> 45 (cap 45), skill-ups/h 8

Farm: Water beetle (L6) as level 8 warden, 1 h, own kill 35 s, assisted 0/min
  XP/kill 15, kills to level 9: 189 (~110.3 min), XP/h 1,543
  level 8 -> 8.54 in 1 h, kills 102
  weapon skill 29 -> 37 (cap 37), skill-ups/h 8
```

Level 9 (2,829 XP, 189 kills) takes about 110 minutes solo and about 40 minutes with three assisted kills a minute, so assists were worth 2.75x the levelling. Skill-ups per hour are 8 in both: assisted kills train nothing. The weapon skill is the other half of "nearly max level": solo, it reaches its cap (37 at level 8) within the first hour.

**Raids.** Each raid of a phase is cleared `raidClears` = 4 times per phase, `raidMinutes` = 4 minutes per clear (the walk to the horn and regrouping), once the player is at the raid's minimum level and Chapter 2 is done (`RAID_UNLOCK`). A clear pays:

- XP: `raidClearXp` = `killXpAt(raid level, normal, player level)` x `ECONOMY.raid.clearXpKills` (5 kills).
- Coins: `raidClearGold` = `ECONOMY.raid.clearGold` (25) x `coinMult`, plus the expected sale of its drops: each drop's value / 2 x `RAID_TUNING.dropChance` (0.2).
- Time: `raidMinutes`, counted in the phase's hours.

Raid kills pay nothing themselves. No skill uses, and no gear from raids: the sim's kit stays shop-based. Not modelled: raid drops as gear, deaths in raids, party members in the seats.

**RAID_FARM.** A phase's raid XP per raid hour must not exceed 1.25 x its quest and kill XP per hour (`ECONOMY_TARGETS.raidXpPerHourMax`); this is also a margin flag for every variant. With `clearXpKills` 8, raids paid 1.30x (Keep), 1.47x (Cloverfield) and 1.64x (Hedgewood) the content XP rate, so it went to 5: the warden's raid rate is then 0.81x (Keep), 0.92x (Cloverfield), 1.03x (Hedgewood), 0.60x (Rockery), 0.56x (Verge). `clearGold` went from 30 to 25 because the `raid-heavy` variant (12 clears a phase) left the Verge carrying 1.01x its next kit at level 70 (`TOO_RICH`). Raids cost ~1.3 raid hours per warden run (5 raids, 0.27 h each), and the default warden reaches level 30 in 30.1 h, against 29.45 h with `no-raids`.

Warden, default player, round 3 (raid hours in brackets):

| Phase | Levels | Hours (raid) | Raid XP/h vs content XP/h | Coins earned | Carry ratio | Kit |
|---|---|---|---|---|---|---|
| mossbottom | 1-6 | 2.1 | none, 0 vs 2,206 | 496 | 0.55 | 71% |
| thatchford | 6-12 | 4.7 | none, 0 vs 4,017 | 1,120 | 0.47 | 100% |
| keep | 12-14 | 3.1 (0.3) | 3,825 vs 4,711 | 705 | 0.05 | 100% |
| cloverfield | 14-17 | 5.2 (0.3) | 6,300 vs 6,844 | 3,187 | 0.28 | 100% |
| hedgewood | 17-20 | 5.1 (0.3) | 12,450 vs 12,119 | 7,799 | 0.51 | 100% |
| rockery | 20-25 | 5.5 (0.3) | 15,375 vs 25,600 | 10,728 | 0.84 | 100% |
| verge | 25-30 | 4.3 (0.3) | 31,950 vs 57,096 | 16,966 | - | 100% |

The Keep phase stays at 2 levels (12 to 14) with or without raids. Even at `clearXpKills` 8 the Keep ends at level 14, and above about 7.7 RAID_FARM trips there. So the short-phase floor test (`levelOut - levelIn >= 3`) still fails on the Keep. Open: the Keep needs a lever other than raid XP.

Golden: `economy.golden.json` was regenerated. Changes come from two sources: the earlier roadmaps (the Calling trials, kill credit) and the raids here. The `no-raids` and `raid-heavy` variants are new entries.

## Gear as a goal

The lag metric says the shop is rarely a goal: from the Hedgewood on, every kit item is owned within minutes of opening, and coins carried in pay for it. Two levers would change that, both content: a late sink tier (an heirloom item per slot at about 6 x ilvl^2 in Rockery and the Verge), or fewer coins carried out of the Hedgewood and Rockery. The second costs the margin; the first uses the 21,000-22,500 coins every class still has at level 30. When a sink tier ships, move `GEAR_INSTANT` from `WATCH_FLAGS` into the failing set.

## Level 70 runway

The game ships to level 30. `npm run sim:economy -w games/gnomes-of-gnomomia -- --cap=70` plays eight synthetic bands after the Verge (30-35 ... 65-70) built like the Verge: a labelled PROJECTION in `src/data/economyProjection.ts`, read only by the sim, never by the game. Each band row is also the content that band would need, so adding content tiers is a balancing lever next to the curve tweaks; the counts below are what the runway result rests on.

Curve changes for the runway (all act past level 30 only; levels 1-30 are unchanged by them):

- **Coins follow prices.** With 1.11 a level all the way, coins rose 64x from L30 to L70 while prices (quadratic in ilvl) rose 5.4x. Now the coin multiplier grows as `(L/30)^2` past 30: x5.44 from 30 to 70, against kit prices x4.1 (ilvl 34 -> 69). Coins per hour rise 3,552 -> 9,745 (x2.7) and bands get longer, so coins earned per band stay at 0.67-0.79 of the band's kit.
- **Kills per level keep rising.** With the XP table's 1.04 growth, kills per level peaked at 138 (L28-30) and fell to 101 at L70. Past 30 the XP table grows 1.06 a level: kills per level 146 (30-35) -> 212 (65-70). 1.07 (the kill-XP growth) made 65-70 a 9 h band with 3 h of grind; 1.06 keeps grind under 2.3 h a band and `FALLING_KILLS_PER_LEVEL` never fires.
- **Skills.** The cap grows 3 a level past 30 (not 4), and the `s^2` term of the uses curve stops at skill 125, so a level-70 skill still moves: lowest skill 198/245 (warden), 204/245 (slinger), 115/245 (mage Bloom). The cap is never reached past 30 (0% capped uses).
- **Talents.** Points are `level - 1 + finales`: 95 at 70 against 41 shipped ranks. The projection opens 7 ranks per band (56 in all, a post-30 talent track gated on each band's finales): 95 points / 97 ranks at 70, never more than 2 unspent.

Result per band (W / S / M = warden / slinger / mage):

| Band | Hours | Kills/level | Coins/h | Warden kit | Coins earned / kit | carry W/S/M | Skill-ups/h W/S/M | Low skill / cap W/S/M | Talent pts / ranks | Flags |
|---|---|---|---|---|---|---|---|---|---|---|
| verge (25-30) | 4.5 | 137 | 3,838 | 16,136 | 1.06 | 0.88 / 0.91 / 0.94 | 8.8 / 5.4 / 9.0 | 87 / 104 / 67 of 125 | 39/41 | none |
| 30-35 | 5.0 | 146 | 3,552 | 25,432 | 0.69 | 0.83 / 0.89 / 0.93 | 5.2 / 4.0 / 6.6 | 111 / 115 / 74 of 140 | 46/48 | none |
| 35-40 | 5.5 | 160 | 4,632 | 33,462 | 0.76 | 0.75 / 0.86 / 0.89 | 5.5 / 3.7 / 5.7 | 100 / 126 / 80 of 155 | 53/55 | none |
| 40-45 | 5.9 | 172 | 5,741 | 42,592 | 0.79 | 0.71 / 0.86 / 0.88 | 5.1 / 3.6 / 5.3 | 122 / 139 / 86 of 170 | 60/62 | none |
| 45-50 | 6.2 | 182 | 6,650 | 52,822 | 0.78 | 0.69 / 0.87 / 0.89 | 4.8 / 3.5 / 5.3 | 143 / 152 / 93 of 185 | 67/69 | none |
| 50-55 | 6.6 | 192 | 7,099 | 64,152 | 0.73 | 0.65 / 0.86 / 0.88 | 3.8 / 3.0 / 4.5 | 160 / 164 / 99 of 200 | 74/76 | SLOW_SKILL (S) |
| 55-60 | 6.8 | 200 | 7,936 | 76,582 | 0.71 | 0.62 / 0.85 / 0.87 | 3.4 / 3.4 / 4.7 | 174 / 178 / 104 of 215 | 81/83 | SLOW_SKILL (W, S) |
| 60-65 | 7.2 | 207 | 8,397 | 90,112 | 0.67 | 0.57 / 0.83 / 0.84 | 2.8 / 2.9 / 4.2 | 186 / 191 / 110 of 230 | 88/90 | SLOW_SKILL (W, S) |
| 65-70 | 7.3 | 212 | 9,745 | 104,742 | 0.68 | - | 2.9 / 3.0 / 4.2 | 198 / 204 / 115 of 245 | 95/97 | SLOW_SKILL (W, S) |

Level 70 in 79.9 h. No margin flag in any variant past 30 (every variant owns 100% of each projected kit; projected potions are priced like shipped ones, 0.75 coins per hp). The one expected flag is `SLOW_SKILL` from 50-55 for the warden and slinger (`EXPECTED_PROJECTION_FLAGS`; the test fails if it stops firing or anything else fires): 5-level bands take 6.6-7.3 h, so a skill gains about 3 levels an hour. Fixing it needs more hits per kill (enemy HP past 50 is not designed yet) or a flatter post-30 uses curve; decide with the level-50 content. The `GEAR_INSTANT` watch also fires past 30, for the same reason as below 30. Coins left at 70: 67,000-92,000, so a 70 game needs a level-cap sink too.

Content each band needs (186 quests, 108 spawn groups, 176 gear items, 8 potion tiers, 56 talent ranks in all):

| Band | Quests side/main/finale | Spawn groups / normal mobs / elites / bosses | Shop tier (per class) | Gear items (3 classes) | Potion tier | Quest gold tier (raw side/main/finale) | Talent ranks |
|---|---|---|---|---|---|---|---|
| 30-35 | 9/9/2 | 12 / 42 / 3 / 1 | ilvl 34: weapon, body, trinket blooming, rest sprouted | 22 | 1 | 87/234/675 (x1.5 the Verge) | 7 |
| 35-40 | 10/10/2 | 12 / 42 / 4 / 1 | ilvl 39 | 22 | 1 | 87/234/675 (x1.5) | 7 |
| 40-45 | 10/10/2 | 13 / 46 / 4 / 1 | ilvl 44 | 22 | 1 | 84/226/653 (x1.45) | 7 |
| 45-50 | 10/10/2 | 13 / 46 / 4 / 1 | ilvl 49 | 22 | 1 | 78/211/608 (x1.35) | 7 |
| 50-55 | 11/11/2 | 14 / 49 / 4 / 1 | ilvl 54 | 22 | 1 | 70/187/540 (x1.2) | 7 |
| 55-60 | 11/11/2 | 14 / 49 / 4 / 1 | ilvl 59 | 22 | 1 | 64/172/495 (x1.1) | 7 |
| 60-65 | 12/12/2 | 15 / 53 / 4 / 1 | ilvl 64 | 22 | 1 | 58/156/450 (x1.0) | 7 |
| 65-70 | 12/12/2 | 15 / 53 / 5 / 1 | ilvl 69 | 22 | 1 | 58/156/450 (x1.0) | 7 |

The quest gold tier is a lever, not a constant: every projected kit prices all 7-8 slots, so the early bands need 1.5x the Verge's raw gold per quest; as content density rises the tier tapers back to 1.0 (at a flat 1.5, bands 50-70 went `TOO_RICH`).

Hard-coded 30s, and what is done about each:

| Where | What | State |
|---|---|---|
| `src/data/economy.ts` `levelCap` | the cap | the data itself; `curveKnee` 30 marks where the late curves start |
| `src/sim/loadout.ts` (`Math.min(30, ...)`) | loadout level clamp | now `ECONOMY.levelCap` |
| `src/sim/visualizer.ts` (two clamps) | scenario level clamp | now `ECONOMY.levelCap` |
| `src/sim/economy.test.ts` (XP loop to 30) | growth check | runs to 70, plus a past-the-knee check |
| `src/data/core.ts` spell ranks (`flare` up to 30, `mend` up to 26) | content | needs new ranks with the 31-70 content |
| `src/sim/economyPhases.ts` bands | content | new phases with new zones; the projection adds its own |
| `src/sim/visualizer.ts` `ZONE_LEVEL`, `defaultHealPotion` / `defaultManaPotion` in `loadout.ts` (10 / 20 steps) | content | need the new zones and potion tiers |

## Run it

```sh
npm run sim:economy -w games/gnomes-of-gnomomia                         # table per class, level-hours line, flags
npm run sim:economy -w games/gnomes-of-gnomomia -- --class=warden        # one class
npm run sim:economy -w games/gnomes-of-gnomomia -- --variant=potions-x3  # one player variant
npm run sim:economy -w games/gnomes-of-gnomomia -- --json                # full reports as JSON
npm run sim:economy -w games/gnomes-of-gnomomia -- --check               # exit 1 on any flag, variants included
npm run sim:economy -w games/gnomes-of-gnomomia -- --check --cap=70      # the level-70 projection (expected flags only)
npm run sim:economy -w games/gnomes-of-gnomomia -- --cap=70 --levels     # per-level hours, kills, coins vs price, skill
```

## Tune it

1. Edit `src/data/economy.ts` (curves) or item values, stock and gates in the pack files. For past-30 questions, `src/data/economyProjection.ts`.
2. Run `npm run sim:economy -w games/gnomes-of-gnomomia -- --check` (and `--check --cap=70`) until it exits 0.
3. Run `npm test -w games/gnomes-of-gnomomia`. `src/sim/economy.test.ts` asserts no flags per class and variant, pins the curve in `src/sim/economy.golden.json`, checks the projection's flags, the arena hits, and the gates under every choice. For a deliberate retune, regenerate the golden as that test's header says (`UPDATE_GOLDEN=1 npm test -w games/gnomes-of-gnomomia -- src/sim/economy.test.ts`) and review its diff.

Changing a target in `ECONOMY_TARGETS` changes what "in shape" means: write the reason next to it.

## Known limits

- No real play-through yet: the numbers are the sim's player, not a person. Times per kill and quest are guesses; hits per kill are measured in the arena, hits taken (Toughness) are estimated.
- Every kit item is owned the moment it opens in most phases (`GEAR_INSTANT` watch): see "Gear as a goal".
- About 21,000 coins are left at level 30; nothing late sinks them.
- 3.5 skill-ups an hour, not 5, is the floor (see the critique response).
- Phase order follows level bands, so Cloverfield (11-16) comes before Hedgewood (15-20) even where the story could send a player elsewhere first.
- Expected values only: no bad-luck streaks, no deaths, no rest XP. The variants stand in for some of that.

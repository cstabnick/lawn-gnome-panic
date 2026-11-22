# Gnomes of Gnomomia: economy (XP, coins, skills)

How XP, coins, use-based skills and talents are paced across the story, the simulation that measures it, and the numbers in force. The tuning lives in one table, `games/gnomes-of-gnomomia/src/data/economy.ts` (`ECONOMY`), read only through the formulas in `src/economy.ts`. Gameplay and the sim both call those formulas, so the sim measures the real rules. Plan: [docs/roadmaps/gnomomia-economy-scaling.md](../../roadmaps/gnomomia-economy-scaling.md).

## The problem

Everything was earned in Mossbottom. A player left the first zone at level 9 with about 1,550 coins, when the whole Thatchford kit cost about 300. From then on they carried 5 to 21 times the price of the next zone's kit, so no shop ever mattered again (45,000 coins unspent at the end). Kill XP grew linearly (`6 + 2L`), so a Verge kill was worth only 4.4 times a Mossbottom kill. Use-based skills levelled at a flat `2 + s/2` uses, so the weapon skill sat at its level cap for half to three quarters of all combat time, Keep onwards. Talents had no gates: all 41 ranks opened as fast as points came.

## The model

`src/sim/economy.ts`, `runEconomy()`: one player of one class plays the whole story once, with the real content (quests, spawns, enemies, items, shops, talents). Pure and deterministic.

- **Phases** (`src/sim/economyPhases.ts`): eight, in story and level order. Each quest and spawn group goes to the first phase that lists its zone and whose band holds its level.

  | Phase | Zones | Band |
  |---|---|---|
  | mossbottom | Mossbottom | 1-6 |
  | thatchford | Thatchford | 6-11 |
  | keep | Keep + upper Deeps | 10-14 |
  | cloverfield | Cloverfield | 11-16 |
  | hedgewood | Hedgewood + mid Deeps/Keep | 15-20 |
  | rockery | Rockery | 19-24 |
  | deeps | lower Deeps + Keep chapter 6 | 24-25 |
  | verge | the Verge | 25-30 (grinds to 30) |

- **Player model** (`DEFAULT_PLAYER`, every field can be overridden): quests take 6 / 10 / 15 minutes (side / main / finale) plus their kills; a kill takes 15 s (trivial) to 400 s (final boss), walking and resting included; each respawning spawn group is cleared twice per phase; 25 weapon-skill uses and 15 Toughness uses per combat minute; 6 heal potions per combat hour, bought at the best heal potion on sale.
- **Order**: activities in a phase run lowest level first; a quest waits until dialogue can start it. After each activity the player shops: per slot, the best affordable class item at or below their level whose gate is open. Quest reward items are worn if better, else sold. Loot sells at half value. If the phase ends below its top level, the player grinds its best normal mob (at most 20 h).
- **Measured per phase**: levels in/out, hours (quest / kill / grind), XP per hour, median XP per normal kill, coins earned and per hour, spent on gear and potions, coins carried out, the cost of the next phase's full class kit, the share of this phase's kit owned at the end, skill-ups, weapon skill vs cap, share of combat time at the cap, talent points vs spendable ranks.
- **Assumptions**: every roll is its expected value (mean coin drop, loot chance x count); no deaths; no grinding beyond the end-of-phase top-up; no rest XP; one fixed choice per story branch, so 7 quests on the other branches are skipped; conditions are evaluated against the sim's own done-quest set.

## Targets and flags

`ECONOMY_TARGETS` and `checkEconomy()` in `src/sim/economy.ts`. Any flag fails `--check`.

| Flag | Fires when | Why |
|---|---|---|
| `TOO_RICH` | coins carried out of a phase > 1.0 x the next phase's full class kit (skipped when the next phase has no shop) | arriving able to buy everything means the new shop is not a goal |
| `TOO_POOR` | own kit owned at phase end < 50% (phases with a shop) | the player should still get most of a zone's gear while there |
| `GRIND_WALL` | grind hours > 1.5 x quest + kill hours | the content, not grinding, should carry the levels |
| `FLAT_XP_SCALING` | Verge median normal-kill XP < 8 x Mossbottom's | late kills must feel worth far more |
| `FRONT_LOADED_COINS` | Mossbottom + Thatchford earn > 25% of all coins | money should grow with the story |
| `SKILL_CAPPED_EARLY` | weapon skill at its cap > 50% of combat time, Keep onwards | skills should still be growing in the late game; early zones may cap |
| `UNSPENT_TALENTS` | talent points - spendable ranks > 2 (once the class is chosen) | gates must not strand points |
| `FAST_PHASE` / `SLOW_PHASE` | phase hours outside 0.3-2.5 x the median phase | no zone should be a blip or a slog. The floor is 0.3, not 0.4: the lower Deeps is 1.4 h of content and the median is about 3.5 h |

## Formulas and values

`L` = level, `s` = skill level. Levels: cap 30.

| What | Formula (`src/economy.ts`) | Before | Now |
|---|---|---|---|
| XP to next level | `round((base + perLevel L + perLevelSq L^2) * growth^(L-1))` | `40 + 30L + 4L^2` (74 at L1, 740 at L10, 2,240 at L20; 48,430 to L30) | base 150, perLevel 90, perLevelSq 20, growth 1.04 (260, 4,341, 20,963; 493,273 to L30) |
| Kill XP | `round((base + perLevel L) * growth^(L-1) * rank * levelDiff)` | `6 + 2L`, no growth (8 at L1, 26 at L10, 66 at L30) | base 6, perLevel 2, growth 1.07 (8, 48, 470) |
| Rank multiplier | | trivial 0.5, normal 1, elite 3, miniboss 6, boss 10, worldboss 20, final 40 | unchanged |
| Quest XP | normal kill XP at the quest's level x tier | side 10, main 20, finale 40 | unchanged (grows with kill XP) |
| Level difference | +10% per level above (max +30%), -20% per level below, 0 at 5 below | | unchanged |
| Quest coins | `round(reward.gold * scale * growth^(level-1))` | `reward.gold` as written | scale 0.1, growth 1.11 (x0.10 at L1, x0.26 at L10, x0.73 at L20, x1.0 near L23, x2.06 at L30) |
| Enemy coins | each end of `EnemyDef.gold` x `scale * growth^(level-1)`, rounded | `EnemyDef.gold` as written | scale 0.1, growth 1.11 |
| Skill cap | `capBase + capPerLevel L` | `5 + 4L` | unchanged |
| Uses to next skill level | `floor(usesBase + usesPerLevel s + usesPerLevelSq s^2)` | `2 + floor(s/2)` (7 at s10, 32 at s60, 62 at s120) | usesBase 2, usesPerLevel 0.5, usesPerLevelSq 0.02 (9, 104, 350) |

Item prices did not change except in Mossbottom, where the plate was overpriced for a first zone: thimble helm 80 -> 16, beetle plate 180 -> 36, and the Mole crown sells for 20 instead of 150 (value 300 -> 40).

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

  The current list: `grep -rn "gate:" games/gnomes-of-gnomomia/src/data`.

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

## Before and after

Warden, default player. `carry` = coins carried out / next phase's kit; `kit` = own kit owned at the end; `cap` = combat time with the weapon skill at its cap.

| Phase | Levels | Hours | XP per normal kill | Coins earned | carry | kit | cap |
|---|---|---|---|---|---|---|---|
| mossbottom | 1-9 -> 1-6 | 2.1 -> 2.1 | 8 -> 14 | 1,815 -> 496 | 5.04 -> 0.55 | 100% -> 71% | 50% -> 58% |
| thatchford | 9-14 -> 6-11 | 4.8 -> 4.8 | 8 -> 28 | 2,775 -> 1,134 | 8.26 -> 0.47 | 100% -> 100% | 66% -> 52% |
| keep | 14-16 -> 11-14 | 2.4 -> 3.1 | 5 -> 29 | 1,255 -> 436 | 9.61 -> 0.15 | 100% -> 67% | 52% -> 45% |
| cloverfield | 16-19 -> 14-17 | 4.9 -> 4.9 | 6 -> 43 | 3,939 -> 2,266 | 13.52 -> 0.07 | 100% -> 100% | 78% -> 29% |
| hedgewood | 19-23 -> 17-20 | 4.9 -> 4.9 | 8 -> 84 | 8,399 -> 8,288 | 7.69 -> 0.42 | 100% -> 100% | 61% -> 0% |
| rockery | 23-26 -> 20-24 | 3.9 -> 4.0 | 29 -> 186 | 6,020 -> 5,711 | - | 100% -> 100% | 49% -> 0% |
| deeps | 26-28 -> 24-25 | 1.4 -> 1.4 | 22 -> 256 | 4,573 -> 4,805 | 21.49 -> 0.77 | - | 0% -> 0% |
| verge | 28-30 -> 25-30 | 3.2 -> 4.8 | 35 -> 315 | 13,914 -> 17,465 | - | 100% -> 100% | 49% -> 0% |
| **total** | | 27.5 -> 29.9 h | x4.4 -> x22.5 | 42,690 -> 40,601 | | gear spend 5,078 -> 33,848 | left 45,652 -> 22,338 |

Flags: 11 -> 0 per class (before: `TOO_RICH` in 6 phases, `SKILL_CAPPED_EARLY` in Keep, Cloverfield and Hedgewood, `FAST_PHASE` in the Deeps, `FLAT_XP_SCALING`). Slinger and mage move the same way: 11 -> 0 flags, gear spend about 5,100 -> 36,700 (slinger) and 34,700 (mage), about 21,000 coins left at the end. Mossbottom + Thatchford earn 4% of all coins now (11% before).

## Run it

```sh
npm run sim:economy -w games/gnomes-of-gnomomia                      # table per class, level-hours line, flags
npm run sim:economy -w games/gnomes-of-gnomomia -- --class=warden     # one class
npm run sim:economy -w games/gnomes-of-gnomomia -- --json             # full reports as JSON
npm run sim:economy -w games/gnomes-of-gnomomia -- --check            # exit 1 on any flag
```

## Tune it

1. Edit `src/data/economy.ts` (curves) or item values, stock and gates in the pack files.
2. Run `npm run sim:economy -w games/gnomes-of-gnomomia -- --check` until it exits 0.
3. Run `npm test -w games/gnomes-of-gnomomia`. `src/sim/economy.test.ts` asserts no flags per class, pins the curve shape in `src/sim/economy.golden.json` (levelOut, coin and XP ratios to Mossbottom, kit share), and checks the gates. For a deliberate retune, regenerate the golden as that test's header says (`UPDATE_GOLDEN=1 npm test -w games/gnomes-of-gnomomia -- src/sim/economy.test.ts`) and review its diff.

Changing a target in `ECONOMY_TARGETS` changes what "in shape" means: write the reason next to it.

## Known limits

- No real play-through yet: the numbers are the sim's player, not a person. Times per kill and quest are guesses.
- From Hedgewood on the weapon skill never reaches its cap (0% capped time). That passes the target, but a late skill may now feel slow; if so, lower `usesPerLevelSq`.
- About 21,000 coins are left at the end: the Verge has no next kit to save for. A late sink (consumables, repairs, cosmetics) would use it.
- The lower Deeps phase is short (1.4 h, one level), which is why the `FAST_PHASE` floor is 0.3.
- Phase order follows level bands, so Cloverfield (11-16) comes before Hedgewood (15-20) even where the story could send a player elsewhere first.
- Expected values only: no bad-luck streaks, no deaths, no rest XP.

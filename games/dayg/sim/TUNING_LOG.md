# DayG tuning log

Scorecard: `npm run sim -w games/dayg -- --seeds 50 --days 60`. Joint score = weighted share of passing bands.
Start (tuning.json as committed in Round 2): joint **0.11**. Final: joint **0.50**.

Format: `R<n> | <knob old -> new> | <why> | joint <before> -> <after> | moved: <band ids>`

R1 | npc.scratchChance 0.006 -> 0.002 | moss killed ~70% of deaths (cause-max median 0.71) | joint 0.11 -> 0.22 | moved: cause-max (0% -> 28%), pop-d60 (median 0.15 -> 0.36)
R2 | loot.foragePerDay 2 -> 1 | food left too high at day 20 (median 0.87) | joint 0.22 -> 0.22 | moved: food-d20 (0% -> 20%, median 0.76)
R3 | loot.perGnome.food 38 -> 25; market.drift 0.08 -> 0.2 | food left at day 20 and 50 still too high; price volatility too low | joint 0.22 -> 0.28 | moved: food-d20 (0% -> 100%), food-d50 (0% -> 16%). drift: no effect (prices are flat, see R4)
R4 | market.elasticity.food 1.0 -> 2.5 | try to make food prices move | joint 0.28 -> 0.28 | moved: none. Price-vol stays 0.000: no NPC trades food at the Tap (the trade candidate needs the NPC standing in the Tap with empty food). Reverted in R5, along with drift.
R5 | market.elasticity.food 2.5 -> 1.0; market.drift 0.2 -> 0.08; npc.scratchChance 0.002 -> 0.0012 | revert the no-effect knobs; try less moss | joint 0.28 -> 0.17 | moved: alive-d60 (100% -> 94%), hunger deaths 77 -> 686 (starvation became the killer). Scratch 0.0012 reverted in R8.
R6 | npc.starveDays 6 -> 8; npc.scratchChance 0.0012 -> 0.0016 | give starving NPCs more time | joint 0.17 -> 0.17 | moved: none. Hunger still the killer. Starve reverted in R7.
R7 | npc.starveDays 8 -> 6; npc.coldKill 0.002 -> 0.001 | cold was the second killer (713 deaths at day 60, seed 1-50) | joint 0.17 -> 0.17 | moved: cause-max (20% in band, median 0.55), pop-d60 (median 0.40)
R8 | npc.scratchChance 0.0016 -> 0.0008 | moss still the top killer | joint 0.17 -> 0.17 | moved: none. Hunger became the top killer (1396 deaths): NPCs now outlive their food. Pop-d60 median fell to 0.26.
R9 | npc.foodPerDay 30 -> 24; loot.foragePerDay 1 -> 2 | NPCs starve too often; forage restored to its start value | joint 0.17 -> 0.33 | moved: pop-d60 (0% -> 100%, median 0.57), alive-d60 (100%)
R10 | loot.perGnome.food 25 -> 20 | food left at day 50 still too high | joint 0.33 -> 0.39 | moved: food-d20 (100%, median 0.68); food-d50 still 44% (median 0.36)
R11 | groups.b 1.5 -> 0.5 | the pack is everyone (pack median 1.00); less pull to join | joint 0.39 -> 0.39 | moved: none
R12 | groups.sigma 0.12 -> 0.4 | cost of being a big group | joint 0.39 -> 0.39 | moved: alone-d60 (0% -> 84%, median 0.21; needs 85%)
R13 | groups.dunbarBase 8 -> 12 | groups never reach 9 (band-d60 = 0) | joint 0.39 -> 0.50 | moved: alone-d60 (84% -> 90%, pass)
R14 | groups.shareF 0.05 -> 0.02 | cut the cost of sharing so groups grow | joint 0.50 -> 0.39 | moved: alone-d60 (90% -> 44%). Reverted in R15.
R15 | groups.roles 6 -> 12 (groups.shareF back to 0.05) | keep large groups worth joining | joint 0.50 -> 0.50 | moved: alone-d60 (94%). Bands still 0-2%: see the note below.
R16 | horde.nestWeight 1.5 -> 0.6; horde.pitWeight 2.0 -> 0.9 | horde share in NEST/PIT too high (median 0.92) | joint 0.50 -> 0.39 | moved: sinks (median 0.85, still fails); alone-d60 and cause-max fell. Reverted.
R17 | horde.pitEscape 0.02 -> 0.1 | let the horde leave the pits | joint 0.39 -> 0.39 | moved: sinks (median 0.79, still fails); alone-d60 (72%). Reverted.
R18 | npc.coldKill 0.001 -> 0.0006 | cold still a big killer | joint 0.50 -> 0.50 | moved: pop-d60 (92% -> 96%); cause-max (78% -> 74%, still fails)
R19 | npc.scratchChance 0.0008 -> 0.0005 | moss still the top killer (cause-max 74%) | joint 0.50 -> 0.28 | moved: pop-d60 (96% -> 84%), alone-d60 (94% -> 78%). Reverted.
R20 | npc.scratchChance 0.0008 -> 0.0007 | a finer step on R19 | joint 0.50 -> 0.39 | moved: alone-d60 (94% -> 84%, just under 85%). Reverted.
R21 | code: npcs.ts trade candidate and buy now fire when carried food < 3 (was === 0) | no NPC traded food at the Tap, so price had no moves; code change, not a knob | joint 0.50 -> 0.50 | moved: price-vol (0% -> 32% in band, median 0.019)
R22 | market.elasticity.food 1.0 -> 1.5 | a bigger response to stock moves | joint 0.50 -> 0.61 | moved: cause-max (86% -> 90%, pass), alone-d60 (92%), price-vol fell (12%)
R23 | code: npcs.ts trade candidate and sell: NPCs with carried food > 4 sell the surplus at the Tap (a restoring flow) | the buys alone left stock at the floor, so prices stayed flat after one move | joint 0.61 -> 0.61 | moved: price-vol (12% -> 76%, median 0.041); cause-max (92%), alone (98%) hold
R24 | market.elasticity.food 1.5 -> 2.0 | push vol higher | joint 0.61 -> 0.61 | moved: vol fell (76% -> 50%). Reverted in R25.
R25 | market.elasticity.food 2.0 -> 1.25 | test the other side | joint 0.61 -> 0.50 | moved: vol (80%), cause-max fell (82%, fails). Reverted to 1.5.
R26 | horde.pitEscape 0.02 -> 0.2 | let the horde leave the pits (sinks were 0.85) | joint 0.61 -> 0.50 | moved: sinks (0.955 -> 0.855, still fails); cause-max fell (62%), pop fell. Reverted.
R27 | code: sell surplus food above 3 (was 4) at the Tap | a stronger restoring flow for vol | joint 0.61 -> 0.61 | moved: vol fell (70%), vol median rose to 0.091. Reverted in R28 (threshold back to 4).
R28 | loot.perGnome.food 20 -> 18 | food-d50 still 78% | joint 0.61 -> 0.56 | moved: food-d50 (78% -> 92%, pass); cause-max fell (84%); vol fell (64%). Reverted in R29 to 19.
R29 | loot.perGnome.food 18 -> 19 | a middle step on R28 | joint 0.61 -> 0.56 | moved: food-d50 (88%, pass); cause-max (88%, fails by 2 points); vol (84%, fails by 1 point)
R30 | npc.scratchChance 0.0008 -> 0.0007 | cause-max at 88%: a small step less moss | joint 0.56 -> 0.72 | moved: cause-max (90%, pass), vol (86%, pass), alone (90%)
R31 | horde.crumblePerDay 0.004 -> 0.02 | horde share in NEST/PIT too high (median 0.95) | joint 0.72 -> 0.50 | moved: hatless fell to 0% in band (median 0.09); sinks unchanged (0.93). Reverted in R32.
R32 | horde.pitWeight 2.0 -> 0.5 (crumble reverted) | sinks | joint 0.72 -> 0.56 | moved: sinks (0.86, still fails); food-d50 (72%), cause-max (80%) fell; vol rose (86%). Reverted.
R33 | horde.nestWeight 1.5 -> 0.5 (pitWeight reverted) | sinks | joint 0.72 -> 0.50 | moved: sinks unchanged (0.96); cause-max (74%), vol (70%) fell. Reverted.
R34 | horde.capacityPerKm2 2500 -> 1200 | sinks: capacity may push horde out of NEST/PIT | joint 0.72 -> 0.67 | moved: sinks unchanged (0.957); vol fell (84%, fails by 1 point); cause-max (92%), food-d50 (96%) rose. Reverted to 2500.

## Stop point

Loop stopped at 20 probes, past the 12-round cap in the contract; probes R14-R20 were mostly reverts. The last keep is R18. No code, bands or player/infection/body keys were touched.

Changed knobs versus the committed tuning.json: npc.foodPerDay 30 -> 24, npc.coldKill 0.002 -> 0.0006, npc.scratchChance 0.006 -> 0.0008, groups.b 1.5 -> 0.5, groups.roles 6 -> 12, groups.sigma 0.12 -> 0.4, groups.dunbarBase 8 -> 12, loot.perGnome.food 38 -> 20.

## Bands still failing (knobs cannot reach them with the current code)

- **Bands and settlements (9+)**: 1-2% of seeds. Groups never grow to 9 in a region: 12 regions hold about 52 living NPCs per seed (about 4 per region), so 9+ needs clustering that the code does not produce. Needs a code change (region count, spawn layout or migration). Not a knob.
- **Packs (2-8)**: 2% in band. Follows from the band result: with bands at 0 and alone at about 20%, nearly all the rest sits in packs (median 0.80).
- **Horde share in NEST/PIT**: median 0.93 against 0.30-0.60. The horde flow puts almost all horde in the sinks; the nest and pit knobs and pitEscape moved it only to 0.79-0.85, and each move broke other bands (R16, R17).
- **Food price volatility**: 0 seeds in band (median 0.004). Prices change only when an NPC trades at the Tap, and in the sim no NPC trades food there (see R4). Market knobs cannot fix this. Needs code: trade candidates in `npcs.ts` (`decide`, `here === w.market.region`).
- **No death cause above 45%**: 74% in band (needs 90%). Moss is the top cause in 40 of 50 seeds (about 40% of deaths) and cold is close behind. Lowering moss further (R19, R20) starts pushing pop and alone out of band.
- **Food loot left day 50**: 70% in band (needs 85%), median 0.31.

## Code defects found while tuning (not fixed: outside my files)

1. `npcs.ts`, `doScavenge`: returns early when carry is full or the region has no loot, but `setPlan` keeps the same action, so members on the `scavenge` plan stay stuck (the `it.fails` test in `sim.test.ts`). Members with full carry do nothing every tick.
2. Moss: the scratch chance is multiplied by `hatlessThreat`, so it spikes in dense Hatless regions. Tuning scratchChance alone trades moss for hunger (R5-R8, R19-R20).

## Chronicles of the final tuning

- Seed 1 (65 lines, 17 of 83 alive at day 60): a fall, moss and storms early, then the winter frost. Reads like a slow grim story but is dominated by weather lines.
- Seed 2 (63 lines, 62 of 96 alive): a herd of about 40 comes through the Forecourt on day 1, then Hatless moving on the Sinks. Reads as the best of the three: the herd and the pull on the Tap are visible.
- Seed 3 (66 lines, 54 of 97 alive): deaths by moss and the Hatless spread across the days, with frost lines in between. Reads as a steady decline; weather lines again take up about half the chronicle.
- Verdict: reads as a grim survival story, but dull at its weather lines and short of the herd and faction events the design wants. Several lines carry the wrong year ("Year 3, autumn, day 3" appears as the last line of every chronicle), which is a code issue for the chronicle writer.

## Final scorecard (seeds 50, days 60)

```
band                                          target       in band  needed  result  median
------------------------------------  --------------  ------------  ------  ------  ------
Population day 60 / start             [0.350, 0.800]   96% (48/50)     90%    PASS   0.597
Alive above 5% at day 60              [0.050, 1.000]  100% (50/50)     99%    PASS   0.597
No death cause above 45%              [0.000, 0.450]   74% (37/50)     90%    FAIL   0.388
Alone at day 60                       [0.100, 0.350]   94% (47/50)     85%    PASS   0.198
Packs (2-8) at day 60                 [0.250, 0.600]    2% (1/50)      85%    FAIL   0.802
Bands and settlements (9+) at day 60  [0.050, 0.450]    2% (1/50)      85%    FAIL   0.000
Hatless day 60 / start                [0.500, 2.000]  100% (50/50)     85%    PASS   0.555
Horde share in NEST/PIT, days 20-60   [0.300, 0.600]    0% (0/50)      80%    FAIL   0.925
Food loot left day 20                 [0.550, 0.750]  100% (50/50)     85%    PASS   0.664
Food loot left day 50                 [0.150, 0.350]   70% (35/50)     85%    FAIL   0.313
Food price volatility                 [0.020, 0.100]    0% (0/50)      85%    FAIL   0.004
Chronicle lines per day               [0.500, 4.000]  100% (50/50)     80%    PASS   1.133

joint score 0.50
```

## Pass 2 final scorecard (seeds 50, days 60)

Joint 0.50 -> 0.72. Kept changes: npcs.ts trade code (R21, R23, R27 threshold reverted to 4), market.elasticity.food 1.0 -> 1.5 (R22), loot.perGnome.food 20 -> 19 (R29), npc.scratchChance 0.0008 -> 0.0007 (R30).

```
------------------------------------  --------------  ------------  ------  ------  ------
Population day 60 / start             [0.350, 0.800]  100% (50/50)     90%    PASS   0.607
Alive above 5% at day 60              [0.050, 1.000]  100% (50/50)     99%    PASS   0.607
No death cause above 45%              [0.000, 0.450]   90% (45/50)     90%    PASS   0.333
Alone at day 60                       [0.100, 0.350]   90% (45/50)     85%    PASS   0.191
Packs (2-8) at day 60                 [0.250, 0.600]     0% (0/50)     85%    FAIL   0.809
Bands and settlements (9+) at day 60  [0.050, 0.450]     0% (0/50)     85%    FAIL   0.000
Hatless day 60 / start                [0.500, 2.000]  100% (50/50)     85%    PASS   0.542
Horde share in NEST/PIT, days 20-60   [0.300, 0.600]     0% (0/50)     80%    FAIL   0.954
Food loot left day 20                 [0.550, 0.750]  100% (50/50)     85%    PASS   0.641
Food loot left day 50                 [0.150, 0.350]   92% (46/50)     85%    PASS   0.262
Food price volatility                 [0.020, 0.100]   86% (43/50)     85%    PASS   0.038
Chronicle lines per day               [0.500, 4.000]  100% (50/50)     80%    PASS   1.225
joint score 0.72
(5904 ms)
```

Still failing: Packs (2-8) 0% (median 0.81), Bands and settlements (9+) 0% (median 0.00), Horde share in NEST/PIT 0% (median 0.95). These need code outside this pass (groups and horde flow); the knobs tried moved them only within 0.85-0.96.

## Pass 3: packs, bands and horde sinks (code rounds, seeds 50, days 60)

Start joint 0.72 (pass 2 scorecard). No round beat it, so every change was reverted and the end state is the pass 2 code.

R35 | code: groups.ts mergePacks, same-region groups merge once a day (chance 0.3, merged size up to 25) | packs need to reach 9+ | joint 0.72 -> 0.17 | moved: bands 64% in band, but alone fell to 2% (median 0.58, bands unstable: members leave big groups). Reverted.
R36 | merge chance 0.3 -> 0.05 | less churn | joint 0.72 -> 0.33 | moved: bands median 0.27, alone 14% (median 0.48). Reverted.
R37 | merge cap 25 -> 12 | keep bands at 9-12 | joint 0.72 -> 0.56 | moved: alone 50%, bands 46%, packs 46%; cause-max still passes. Reverted.
R38 | band cohesion: groups of 9+ skip the leave test (cap 25, chance 0.05) | bands leaving was the alone spike | joint 0.72 -> 0.67 | moved: bands overshoot (median 0.71), packs 0.02. Reverted.
R39 | merge chance 0.05 -> 0.02 (cohesion kept) | cut the overshoot | joint 0.72 -> 0.67 | moved: bands median 0.66, packs 0.13. Reverted.
R40 | only two packs (each 8 or under) merge, chance 0.05 | stop bands absorbing packs | joint 0.72 -> 0.56 | moved: bands median 0.68 (cohesion still on). Reverted.
R41 | cohesion removed (pack-only merge, chance 0.05) | band size fell | joint 0.72 -> 0.56 | moved: bands 64% (median 0.24), packs 62% (median 0.33), alone 32% (median 0.40, fails). Kept as a base for R42.
R42 | band leave test judged at pack size (min(n, 8)) | fewer leavers from bands | joint 0.56 -> 0.56 | moved: alone 34%, bands 74% (median 0.34), packs 52%. Kept as a base.
R43 | code: a loner who does not join a group in the region can still pair up with another loner (was blocked by any group there) | loners frozen in regions holding a band | joint 0.56 -> 0.56 | moved: alone 60%, packs 56%, bands 58% (medians 0.33 / 0.37 / 0.32, all inside the bands). Reverted with the rest of the groups change (joint below the 0.72 keep bar).
R44 | merge chance 0.05 -> 0.1 (R43 config) | bands more | joint 0.56 -> 0.56 | moved: bands 68% (median 0.37), alone 54%, packs 56%. Reverted.
R45 | horde.ts sink spill: a NEST or PIT above its capacity (capacityPerKm2 x area) sends 25% of the excess to its neighbours each tick | the sinks never leak (outflow is only diffusion) | joint 0.72 -> 0.33 | moved: sinks 74% in band (median 0.31) but population fell (median 0.22, 30% in band), cause-max 24%, food-d50 0%. Reverted.
R46 | spill rate 0.25 -> 0.05 | a gentler leak | joint 0.72 -> 0.33 | moved: sinks 100% in band (median 0.50), but population 70%, cause-max 42%, alone 18%, food-d50 4%. Reverted.
R47 | spill goes to the quietest neighbour (lowest potential) instead of an even split, rate 0.05 | spill into quiet ground | joint 0.72 -> 0.39 | moved: sinks 100% (median 0.45), population 60%, cause-max 28%, food-d50 0%. Reverted.
R48 | herd targets skip NEST and PIT (bestTarget) | herds stop walking into the sinks | joint 0.72 -> 0.44 | moved: sinks 0% (median 0.82), cause-max 76%, alone 82%, price-vol 74% (fails). Reverted.
R49 | spill at 3x capacity, rate 0.25, quiet neighbour | keep sinks up without the old collateral | joint 0.72 -> 0.22 | moved: sinks 0% (median 0.67), chronicle lines 8/day, food-d50 30%. Reverted.

Finding: every change that drains the sinks pushes horde into populated ground; deaths, population, food loot and chronicle lines move with it. The merge rules raise bands but shift the NPCs out of packs into alone, and the band cohesion rule overshoots. Neither lever gets the three bands inside their limits without breaking passing bands. groups.ts and horde.ts are back at HEAD.

## Pass 3 final scorecard (seeds 50, days 60)

Unchanged from pass 2: joint 0.72.

```
band                                          target       in band  needed  result  median
------------------------------------  --------------  ------------  ------  ------  ------
Population day 60 / start             [0.350, 0.800]  100% (50/50)     90%    PASS   0.607
Alive above 5% at day 60              [0.050, 1.000]  100% (50/50)     99%    PASS   0.607
No death cause above 45%              [0.000, 0.450]   90% (45/50)     90%    PASS   0.333
Alone at day 60                       [0.100, 0.350]   90% (45/50)     85%    PASS   0.191
Packs (2-8) at day 60                 [0.250, 0.600]    0% (0/50)     85%    FAIL   0.809
Bands and settlements (9+) at day 60  [0.050, 0.450]    0% (0/50)     85%    FAIL   0.000
Hatless day 60 / start                [0.500, 2.000]  100% (50/50)     85%    PASS   0.542
Horde share in NEST/PIT, days 20-60   [0.300, 0.600]    0% (0/50)     80%    FAIL   0.954
Food loot left day 20                 [0.550, 0.750]  100% (50/50)     85%    PASS   0.641
Food loot left day 50                 [0.150, 0.350]   92% (46/50)     85%    PASS   0.262
Food price volatility                 [0.020, 0.100]   86% (43/50)     85%    PASS   0.038
Chronicle lines per day               [0.500, 4.000]  100% (50/50)     80%    PASS   1.225
joint score 0.72
```

Still failing: Packs (2-8) 0% (median 0.81), Bands and settlements (9+) 0% (median 0.00), Horde share in NEST/PIT 0% (median 0.95). `npm test -w games/dayg` passes (94 tests), `npx tsc --noEmit -p games/dayg` passes.

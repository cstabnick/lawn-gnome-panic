# Research round 5: playtest feedback (pace, steal spam, blocks, pump fake)

Follow-up to `RESEARCH_ROUND_4.md`, after playing the round 4 build.

## Feedback and what changed

| Feedback | Change (defaults in `src/balance.ts`) |
|---|---|
| A touch too slow now | `moveSpeedScale` 0.78 -> **0.84** |
| No downside to spamming steal | Missed pickpocket leaves the thief off balance (`stealWhiffStunSec` 0.7). Pickpocket is harder from the front (x0.5, ball shielded), easier from behind (x1.4), harder against a turbo sprint (x0.7); defence bonus shrunk (`stealDefenseScale` 0.03), `stealBaseChance` 0.05. |
| Cannot steal from the inbound ("return") | The inbound ball-holder cannot be stolen from or shoved for `inboundProtectSec` = 3 s so teams can reposition. Game and shot clocks keep running, so it cannot be used to stall. |
| Stronger blocks | `dunkBlockBaseChance` 0.18, `shotBlockReach` 2.9, an airborne defender can swat a shot in flight on any tick (one probabilistic roll per defender per shot, `shotBlockBaseChance`), and a jumping defender at the release can swat it (`shotBlockReleaseScale`). |
| Pump fake | New action (R / `.` / FAKE button). See below. |
| Passes 8% slower | `passFlightScale` 1.08 |

## Pump fake

Hold the ball and press Fake: the ball goes overhead for `fakeDurationSec`, and you move at `fakeMoveScale` of normal speed. Fakes have a cooldown.
- A defender within `fakeRadius` who jumps to block, pokes a steal or shoves during the fake can **bite**: chance `fakeBiteBaseChance - defense/100 * fakeBiteDefenseScale`. Bitten = the defender is out of position for `fakeBiteStunSec` and the next shot has no contest (+`fakeOpenShotBonus`) for `fakeOpenWindowSec`.
- A defender who pokes during the fake and does **not** bite has read it: pickpocket chance +`fakeReadStealBonus`.
- So fakes cannot be guaranteed (good defenders bite less), a patient defender is rewarded, and a defender who always lunges gets burned. Missing a steal also costs the stun, so blind lunging is punished twice.

## Findings

1. **Interception was the wrong lever for alley-oop-express.** A pass-interception knob (`passInterceptChance`, left in the sim, default 0) barely moved that bot (83% -> 74-82%) and cut passes per possession from 1.65 to about 1.2. What fixed its dominance was the dunk contest plus the slower, more contestable game (it now beats shove-hound 38% of the time).
2. **A blocks overshoot is easy.** The first version of "stronger blocks" blocked over half of all shots (35-47 blocks a game). Rolling once per defender per shot, plus lower dunk-contest fail chance (0.2), brings team blocks to about 8-12 a game, most of them dunk rejections.
3. **The skill ladder was confounded.** Champion v2 is tuned for quick-release shots, so its 60 ms vs 300 ms gap said little (50% or even losing as shot timing grew). The ladder is now Hybrid Ace (60/150/300 ms: strong beats weak 98%), while flow metrics (passes, possessions, lead changes) use Champion v2 at 150 ms, which passes.
4. **Steal spam is now close to even.** A bot that pokes every chance wins 50-56% against the base bot (was 60-70%), with about 11 steals a game instead of 16.
5. **Fakes are not a free win, and mildly rewarded against eager defenders.** Faker vs the same bot without fakes: 54% / 47% when defenders bite at 0.62 / 0.9; vs a steal-spam defender the faker wins 64% against 56% for the no-fake bot. Bite rate is only 5-11% because AI defenders rarely commit during the 0.45 s window. This is bot noise (+-5%) and a human defender decides whether the read-vs-bite trade feels right.

## Scorecard (n=60, seeds 10000+)

Report: `results/scorecard/round5-final/REPORT.md`. Pass: points per team 38.9, dunk share 15.5%, passes per possession 1.69, lead changes 4.18, early-lead AUC 0.81, strong vs weak 98%, strong vs no-pass 70%, garbage time 22.5%. Miss: median GEI 2.93 (target 3-7), possession 3.45 s (target 4-9), persona Nash entropy 0 (shove-hound now top).

## What bots cannot tell us / open

- Whether 0.84 speed feels right and whether the fake animation reads. The fake has no animation beyond the ball going overhead; add a proper pose if it survives playtesting.
- The fake button on a phone (FAKE, bottom right of the touch cluster) was not tried on a device.
- Persona meta: shove-hound is top now; a pass-first persona bot would test passing better than the current set.
- Reproduce: `npm run eval:scorecard -w games/gba-gjam -- --n 60 --label x`, `npm run eval:fakes -w games/gba-gjam -- --n 80`.

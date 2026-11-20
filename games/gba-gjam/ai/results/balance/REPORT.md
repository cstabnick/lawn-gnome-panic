# GBA GJAM — 3-Round Balance Tuning Report

Evaluated **1296 full 4-quarter matches** across 9 bot archetypes in **20.32s**.

## Summary Comparison (Before vs. After)
| Config | Health | Avg PPG | Top PPG | Classic PPG | 3P% | ShvTO/g | Dunks/g | Blk/g | Poss(s) | Top Win% |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Original Baseline (150ms) | **6.6** | 100.8 | 175.0 | 1.6 | 90.7% | 47.6 | 34.1 | 0.2 | 0.80s | 87.5% (`shove-hound`) |
| Original Baseline (60Hz) | **0.8** | 111.7 | 168.9 | 2.1 | 91.6% | 54.4 | 22.5 | 0.1 | 0.62s | 81.3% (`shove-hound`) |
| Balanced Final (150ms) | **98.2** | 40.6 | 51.3 | 24.2 | 39.8% | 9.4 | 11.6 | 1.2 | 1.53s | 87.5% (`alley-oop-express`) |
| Balanced Final (60Hz) | **93.2** | 35.2 | 51.5 | 32.7 | 35.9% | 12.6 | 7.8 | 0.5 | 1.35s | 90.6% (`alley-oop-express`) |

## Round 1: Shove & Quick-Release 3PT Nerfs (150ms)
| Candidate | Health | Avg PPG | Top PPG | Classic PPG | 3P% | ShvTO/g | Dunks/g | Blk/g | Poss(s) | Top Win% |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| R1-A: Moderate Shove (55% loose) + 3PT Nerf | **99.4** | 48.9 | 55.8 | 18.9 | 52.4% | 15.7 | 15.5 | 1.0 | 1.33s | 75.0% (`champion-v1`) |
| R1-B: Strict Shove (40% loose, 1.2s CD) + Crisp 3PT | **100.0** | 47.5 | 61.9 | 26.6 | 46.2% | 9.8 | 15.9 | 1.1 | 1.50s | 75.0% (`shove-hound`) |
| R1-C: Knock-Loose Shove (30% TO, 1.35s CD) + Skill 3PT | **99.4** | 47.8 | 61.3 | 31.2 | 44.9% | 6.8 | 16.3 | 1.1 | 1.58s | 81.3% (`shove-hound`) |
| R1-D: Direct-Rip 35% + High Cooldown (1.4s) | **99.4** | 50.5 | 63.9 | 32.0 | 47.2% | 8.5 | 16.7 | 1.1 | 1.55s | 81.3% (`champion-v2`) |

## Round 2: Contests, Dunk Reach & Rim Blocking (150ms)
| Candidate | Health | Avg PPG | Top PPG | Classic PPG | 3P% | ShvTO/g | Dunks/g | Blk/g | Poss(s) | Top Win% |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| R2-A: Stronger Contests (1.4x) + Rim Blocks | **99.4** | 39.2 | 47.9 | 27.3 | 39.1% | 9.6 | 11.0 | 1.4 | 1.54s | 81.3% (`alley-oop-express`) |
| R2-B: Tight Dunk Reach (2.5m) + High Rim Blocks (0.18) | **98.2** | 36.8 | 43.3 | 25.3 | 37.8% | 9.1 | 8.6 | 1.3 | 1.56s | 81.3% (`champion-v2`) |
| R2-C: Balanced Rim (2.7m) + Active Steals (0.36) & Blocks (0.15) | **99.0** | 37.6 | 48.3 | 22.0 | 35.9% | 9.2 | 9.8 | 1.2 | 1.46s | 81.3% (`alley-oop-express`) |
| R2-D: Heavy Defense (1.7x Contest, 0.22 Dunk Block) | **94.5** | 33.8 | 44.3 | 24.8 | 32.6% | 9.1 | 8.1 | 1.4 | 1.57s | 81.3% (`champion-v2`) |

## Round 3: On-Fire Snowball Control (150ms)
| Candidate | Health | Avg PPG | Top PPG | Classic PPG | 3P% | ShvTO/g | Dunks/g | Blk/g | Poss(s) | Top Win% |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| R3-A: Balanced Fire (streak=3, +16% shot, 0.4x drain) | **100.0** | 40.1 | 51.6 | 28.0 | 37.2% | 9.2 | 11.9 | 1.3 | 1.54s | 75.0% (`champion-v2`) |
| R3-B: Earned Fire (streak=4, +14% shot, 0.5x drain) | **99.4** | 40.0 | 51.1 | 27.0 | 37.2% | 9.1 | 11.7 | 1.6 | 1.48s | 81.3% (`champion-v2`) |
| R3-C: Arcade Pop (streak=3, +18% shot, 0.25x drain) | **99.4** | 39.5 | 50.9 | 24.4 | 37.1% | 9.0 | 11.2 | 1.4 | 1.52s | 81.3% (`shove-hound`) |
| R3-D: Strict Fire (streak=4, +12% shot, 0.7x drain) | **98.2** | 40.3 | 50.4 | 26.0 | 37.0% | 9.0 | 11.5 | 1.4 | 1.49s | 87.5% (`alley-oop-express`) |

## Balanced Final Leaderboard (150ms Human-Fair, 4 games/pair)
| Rank | Bot | Elo | W-L | Win% | PPG | Diff (Med) | FG% | 3P% (3PA) | Dunks | ShvTO | Blk | On Fire | Oops |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | **Alley-Oop Express** | 1959 | 28-4 | 87.5% | 51.3 | +12.1 (+11.5) | 83.2% | 38.4% (2.7) | 21.6 | 8.0 | 1.5 | 1.8 | 19.8 |
| 2 | **Champion v2** | 1812 | 24-8 | 75.0% | 52.4 | +21.9 (+31.0) | 58.8% | 39.0% (22.0) | 11.8 | 6.0 | 0.5 | 2.6 | 0.2 |
| 3 | **Shove Hound** | 1776 | 23-9 | 71.9% | 51.2 | +12.8 (+8.5) | 83.7% | 27.8% (1.1) | 21.3 | 8.7 | 0.8 | 2.2 | 0.1 |
| 4 | **Champion v1** | 1732 | 22-10 | 68.8% | 45.7 | +11.7 (+11.0) | 64.9% | 41.9% (15.2) | 11.0 | 8.1 | 0.7 | 1.3 | 0.3 |
| 5 | **Fire Feeder** | 1536 | 15-17 | 46.9% | 38.6 | -3.4 (-3.5) | 63.7% | 38.0% (11.0) | 10.2 | 10.2 | 1.7 | 1.8 | 0.3 |
| 6 | **Lockdown Counter** | 1494 | 14-18 | 43.8% | 40.5 | +3.9 (-2.5) | 64.4% | 42.0% (11.4) | 10.0 | 11.6 | 3.6 | 1.4 | 0.1 |
| 7 | **Hybrid Ace** | 1424 | 12-20 | 37.5% | 37.2 | -2.7 (-7.0) | 55.1% | 38.2% (17.4) | 6.9 | 9.0 | 1.2 | 1.0 | 0.3 |
| 8 | **Arc Architect** | 1174 | 6-26 | 18.8% | 24.8 | -12.4 (-14.0) | 40.1% | 39.8% (20.7) | 0.0 | 12.1 | 1.0 | 0.3 | 0.0 |
| 9 | **Classic Jam** | 593 | 0-32 | 0.0% | 24.2 | -44.0 (-42.5) | 88.8% | 0.0% (0.0) | 12.1 | 11.3 | 0.3 | 0.1 | 0.0 |

## Promoted `DEFAULT_BALANCE_CONFIG`
```json
{
  "shoveCooldownSec": 1.2,
  "shoveWhiffCooldownSec": 1.5,
  "shoveTurboCost": 34,
  "shoveStunSec": 0.6,
  "shoveTurnoverChance": 0.4,
  "shoveKnocksLoose": true,
  "stealBaseChance": 0.3,
  "threeBaseChance": 0.11,
  "threeStatScale": 0.038,
  "twoBaseChance": 0.44,
  "twoStatScale": 0.042,
  "timingBonusMax": 0.22,
  "earlyReleasePenalty": 0.28,
  "contestScale": 1.4,
  "dunkBaseReach": 2.8,
  "dunkTurboReachBonus": 1,
  "dunkFireReachBonus": 1.1,
  "dunkBlockBaseChance": 0.12,
  "shotBlockReach": 2.55,
  "fireStreakThreshold": 3,
  "fireShotBonus": 0.16,
  "fireTurboDrainScale": 0.4
}
```

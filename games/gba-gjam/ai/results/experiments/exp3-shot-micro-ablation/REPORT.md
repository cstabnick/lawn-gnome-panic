# Experiment 3: 2×2 Ablation — Apex Shot Timing × Contest Discipline

Factorial ablation on `arc-architect` using Shooter rosters (90 3PT) so jump-shot execution dominates. 12 games/pair (72 matches).

## Leaderboard

| Rank | Bot | Elo | W-L | Win% (95% CI) | PPG | OppPPG | Diff | FG% | 3P% (3PA) | Dunks | Steals | Shove TO | Blocks | Reb | On Fire | Oops |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | **Apex OFF + Contest Discipline ON** (`apex0-disc1`) | 1651 | 26-10 | 72.2% (56.0%–84.2%) | 229.0 | 78.9 | +150.1 | 95.2% | 95.2% (80.2) | 0.0 | 84.7 | 81.7 | 0.0 | 2.1 | 1.1 | 0.0 |
| 2 | **Apex ON + Contest Discipline ON** (`apex1-disc1`) | 1609 | 24-12 | 66.7% (50.3%–79.8%) | 164.0 | 114.0 | +49.9 | 95.8% | 95.8% (56.9) | 0.0 | 65.1 | 61.3 | 0.0 | 2.4 | 1.5 | 0.0 |
| 3 | **Apex OFF + Contest Discipline OFF** (`apex0-disc0`) | 1400 | 13-23 | 36.1% (22.5%–52.4%) | 126.4 | 168.3 | -41.8 | 92.8% | 92.8% (45.4) | 0.0 | 51.8 | 46.7 | 0.0 | 3.3 | 0.7 | 0.0 |
| 4 | **Apex ON + Contest Discipline OFF** (`apex1-disc0`) | 1340 | 9-27 | 25.0% (13.8%–41.1%) | 65.9 | 224.2 | -158.2 | 95.1% | 95.0% (23.0) | 0.0 | 30.7 | 26.6 | 0.0 | 2.6 | 0.6 | 0.0 |

## Head-to-Head Matrix (Row Wins / Games)

| Bot | `apex0-disc1` | `apex1-disc1` | `apex0-disc0` | `apex1-disc0` |
|---|---:|---:|---:|---:|
| `apex0-disc1` | — | 6/12 (+47.8) | 10/12 (+172.8) | 10/12 (+229.8) |
| `apex1-disc1` | 6/12 (-47.8) | — | 9/12 (+65.3) | 9/12 (+132.4) |
| `apex0-disc0` | 2/12 (-172.8) | 3/12 (-65.3) | — | 8/12 (+112.5) |
| `apex1-disc0` | 2/12 (-229.8) | 3/12 (-132.4) | 4/12 (-112.5) | — |

## Factorial Effect Decomposition
- **Apex Timing Effect (ON vs OFF, averaged):** 3P% jumps from **94.0%** → **95.4%** (+1.4 percentage points!).
- **Contest Discipline Effect (ON vs OFF, averaged):** Win% moves from **30.6%** → **69.4%**, 3P% moves from **93.9%** → **95.5%**.
- **Winner:** **Apex OFF + Contest Discipline ON** (Elo 1651, 72.2%, 95.2% 3P%).
- **Takeaway for Champion:** Contest discipline is the dominant lever (+38.8pp win rate!). Surprisingly, quick-release (`Apex OFF`) beat strict apex (`Apex ON`) on Shooter rosters (72.2% vs 66.7%, 229 PPG vs 164 PPG): because 90-3PT uncontested shooters already make >95% of quick-release 3s, waiting ~0.35s for apex only adds +1.4pp 3P% while surrendering tempo and giving defenders time to close.

# Experiment 8: Pre-Emptive Off-Ball Shoving & 2v1 Trap Defense

## Experiment Card
- **League:** `Unrestricted (60Hz)`
- **Question:** Optimal turbo threshold for off-ball shoving vs. double-team radius on defense?
- **Controlled Variables:** 4x45s, 60Hz, `pro`, side-swapped, `N=12` per opp (`{shove-hound, champion-v1, hybrid-ace}`), balanced rosters, seed base `73000`.

## Parameter Sweep Leaderboard (36 matches per config)
| Rank | Config | W-L | Win% (95% CI) | PPG | OppPPG | Med Diff [IQR] | PPP | ShvTO | ShvSuf |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | offTurbo=Inf, dblR=11 | 32-4 | 88.9% (74.7%–95.6%) | 162.6 | 36.4 | +171.0 [89.3..199.0] | 1.29 | 101.2 | 36.2 |
| 2 | offTurbo=35, dblR=11 | 31-5 | 86.1% (71.3%–93.9%) | 164.6 | 34.3 | +174.0 [105.3..202.0] | 1.33 | 99.2 | 33.1 |
| 3 | offTurbo=55, dblR=11 | 29-7 | 80.6% (65.0%–90.2%) | 155.3 | 40.5 | +162.0 [34.0..199.8] | 1.24 | 97.5 | 38.1 |
| 4 | offTurbo=24, dblR=11 | 27-9 | 75.0% (58.9%–86.2%) | 136.6 | 45.8 | +115.5 [6.3..175.8] | 1.07 | 92.9 | 45.9 |
| 5 | offTurbo=55, dblR=7.5 | 25-11 | 69.4% (53.1%–82.0%) | 127.6 | 67.8 | +83.5 [-62.3..196.5] | 1.03 | 84.9 | 51.4 |
| 6 | offTurbo=Inf, dblR=5 | 25-11 | 69.4% (53.1%–82.0%) | 122.7 | 64.2 | +66.0 [-62.0..171.5] | 0.99 | 85.0 | 52.6 |
| 7 | offTurbo=35, dblR=5 | 24-12 | 66.7% (50.3%–79.8%) | 130.9 | 63.3 | +106.0 [-45.8..198.3] | 1.05 | 86.9 | 48.2 |
| 8 | offTurbo=24, dblR=5 | 24-12 | 66.7% (50.3%–79.8%) | 116.9 | 72.9 | +72.5 [-65.0..163.3] | 0.93 | 81.3 | 54.4 |
| 9 | offTurbo=24, dblR=7.5 | 23-13 | 63.9% (47.6%–77.5%) | 111.1 | 76.8 | +57.0 [-98.5..158.8] | 0.87 | 83.3 | 60.8 |
| 10 | offTurbo=55, dblR=5 | 23-13 | 63.9% (47.6%–77.5%) | 116.2 | 72.1 | +55.0 [-86.3..186.3] | 0.95 | 80.3 | 53.3 |
| 11 | offTurbo=35, dblR=7.5 | 21-15 | 58.3% (42.2%–72.9%) | 112.8 | 76.8 | +55.0 [-97.3..177.3] | 0.89 | 83.8 | 60.0 |
| 12 | offTurbo=Inf, dblR=7.5 | 21-15 | 58.3% (42.2%–72.9%) | 106.6 | 79.9 | +18.5 [-93.0..144.5] | 0.84 | 81.4 | 62.6 |

## Direct H2H: Best (offTurbo=Inf, dblR=11) vs. Control Shove Hound (N = 20)
| Matchup | W-L | Win% (95% CI) | Score | Mean Diff | Med Diff [IQR] | PPP | Poss(s) | ShvSuf | ShvTO |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Best(offTurbo=Inf, dblR=11) | 10-10 | 50.0% (29.9%–70.1%) | 103.4 – 75.6 | +27.8 | +20.0 [-113.5..188.5] | 0.82 | 0.73s | 64.7 | 77.9 |

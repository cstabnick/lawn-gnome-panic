# Experiment 6: Inbound & Transition Anti-Shove Blitz

## Experiment Card
- **League:** `Unrestricted (60Hz)`
- **Question:** Can an immediate inbound lead-pass or sideline sprint break `shove-hound`'s mid-court trap?
- **Hypothesis:** Tick-1 forward lead-pass to the teammate (4m ahead) or sprinting diagonally to the sideline will cut `shovesSuffered` vs `shove-hound` by >=40% and lift `medianDiff` by >=+60 PPG.
- **Controlled Variables:** 4x45s, 60Hz, `pro`, side-swapped, `N=20` vs `shove-hound` + `N=12` vs `hybrid-ace`, balanced rosters, seed base `71000`.

## vs. Shove Hound (N = 20, Balanced)
| Variant | W-L | Win% (95% CI) | Score | Mean Diff | Med Diff [IQR] | PPP | Poss(s) | ShvSuf | ShvTO |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Control (champion-v1) | 3-17 | 15.0% (5.2%–36.0%) | 31.9 – 164.6 | -132.8 | -147.0 [-224.3..-89.5] | 0.28 | 0.70s | 95.5 | 25.9 |
| Inbound Lead-Pass | 3-17 | 15.0% (5.2%–36.0%) | 40.3 – 114.3 | -74.0 | -85.5 [-150.0..-37.8] | 0.43 | 1.05s | 68.8 | 30.4 |
| Sideline Arc | 0-20 | 0.0% (0.0%–16.1%) | 21.6 – 150.9 | -129.3 | -151.5 [-167.8..-94.8] | 0.21 | 0.85s | 84.5 | 19.1 |
| Inbound Pass + Sideline Arc | 0-20 | 0.0% (0.0%–16.1%) | 29.1 – 122.8 | -93.7 | -90.5 [-130.5..-63.0] | 0.31 | 1.09s | 74.8 | 26.1 |

## vs. Hybrid Ace (N = 12, Balanced)
| Variant | W-L | Win% (95% CI) | Score | Mean Diff | Med Diff [IQR] | PPP | Poss(s) | ShvSuf | ShvTO |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Control (champion-v1) | 9-3 | 75.0% (46.8%–91.1%) | 123.7 – 57.6 | +66.1 | +138.0 [-30.8..176.3] | 1.18 | 0.59s | 41.6 | 75.1 |
| Inbound Lead-Pass | 7-5 | 58.3% (32.0%–80.7%) | 98.8 – 74.7 | +24.1 | +85.5 [-123.8..127.0] | 1.13 | 0.81s | 38.9 | 52.8 |
| Sideline Arc | 9-3 | 75.0% (46.8%–91.1%) | 141.6 – 43.4 | +98.2 | +143.0 [11.8..174.0] | 1.39 | 0.59s | 29.8 | 77.2 |
| Inbound Pass + Sideline Arc | 7-5 | 58.3% (32.0%–80.7%) | 100.2 – 66.7 | +33.5 | +26.5 [-70.3..106.3] | 1.12 | 0.79s | 37.9 | 58.0 |

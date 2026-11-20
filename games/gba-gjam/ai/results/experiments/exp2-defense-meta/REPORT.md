# Experiment 2: Defense Policy Sweep (Controlled Offense)

Holds offense 100% identical (`hybrid-ace` offense) and varies ONLY defensive policy across 4 levels: Passive Containment, Steal-Poke Only, Balanced Shove (`turbo >= 35`), and Relentless Shove (`turbo >= 22`). 12 games/pair (72 matches), balanced rosters.

## Leaderboard

| Rank | Bot | Elo | W-L | Win% (95% CI) | PPG | OppPPG | Diff | FG% | 3P% (3PA) | Dunks | Steals | Shove TO | Blocks | Reb | On Fire | Oops |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | **Relentless Shove (Turbo>=22)** (`def-relentless-shove`) | 2076 | 31-5 | 86.1% (71.3%–93.9%) | 176.4 | 33.7 | +142.7 | 95.6% | 89.7% (11.6) | 4.4 | 92.3 | 91.4 | 0.0 | 1.6 | 1.5 | 0.1 |
| 2 | **Balanced Shove (Turbo>=35)** (`def-balanced-shove`) | 2017 | 29-7 | 80.6% (65.0%–90.2%) | 202.6 | 44.9 | +157.7 | 95.6% | 95.2% (61.0) | 6.1 | 82.0 | 75.8 | 0.0 | 1.8 | 1.3 | 0.1 |
| 3 | **Steal-Poke Only (No Shove)** (`def-steal-only`) | 1285 | 12-24 | 33.3% (20.2%–49.7%) | 62.1 | 151.6 | -89.5 | 98.3% | 72.7% (1.8) | 28.9 | 35.4 | 0.0 | 0.0 | 2.1 | 2.5 | 0.0 |
| 4 | **Passive Containment** (`def-passive`) | 622 | 0-36 | 0.0% (0.0%–9.6%) | 6.6 | 217.4 | -210.9 | 100.0% | 100.0% (0.1) | 3.1 | 0.0 | 0.0 | 0.0 | 2.3 | 0.0 | 0.0 |

## Head-to-Head Matrix (Row Wins / Games)

| Bot | `def-relentless-shove` | `def-balanced-shove` | `def-steal-only` | `def-passive` |
|---|---:|---:|---:|---:|
| `def-relentless-shove` | — | 7/12 (+19.3) | 12/12 (+201.4) | 12/12 (+207.4) |
| `def-balanced-shove` | 5/12 (-19.3) | — | 12/12 (+219.7) | 12/12 (+272.7) |
| `def-steal-only` | 0/12 (-201.4) | 0/12 (-219.7) | — | 12/12 (+152.6) |
| `def-passive` | 0/12 (-207.4) | 0/12 (-272.7) | 0/12 (-152.6) | — |

## Experiment Card & Findings
- **Hypothesis:** Because turbo-shove in `src/sim.ts` is a 100% guaranteed turnover + 0.85s stun (costing 22 turbo) with no foul penalty, lower shove turbo thresholds will monotonically increase steals/shove-turnovers and win rate.
- **Winner:** **Relentless Shove (Turbo>=22)** (Elo 2076, 31-5, 86.1%, 91.4 shove TO/g).
- **Runner-up:** **Balanced Shove (Turbo>=35)** (Elo 2017, 29-7, 80.6%).
- **Steal-Poke Only vs Passive:** Steal-Poke (12-24) vs Passive (0-36).
- **Takeaway for Champion:** Relentless turbo-shove (`turbo >= 22`) is the single highest-leverage defensive mechanic in GBA GJAM — AND this also reveals why an anti-shove offensive counter (passing before contact) is essential to beat shove-heavy bots.

# Experiment 4: The "ON FIRE!" Funnel — Does Feeding the Hot Hand Win Games?

## Experiment Card
- **Question:** Does actively passing to a teammate who has `streak >= 1` or `onFire === true` increase On-Fire activations and win rate?
- **Hypothesis:** Funneling possessions to the hot hand will raise On-Fire activations/game and win rate, because ON FIRE grants infinite turbo, unblockable Meteor Dunks, and +28% shooting.
- **Control:** `fire-funnel-off` (`funnelFire: false`) — identical scoring/defense logic without streak-based passing.
- **Treatment:** `fire-funnel-on` (`funnelFire: true`).
- **Sample:** 20-game direct H2H + 48-game matched-seed gauntlet against 4 diverse opponents (116 total matches).

## Direct Head-to-Head (N = 20)
| Matchup | W-L | Win% (95% CI) | Avg Score (Diff) | FG% / 3P% | Steals (Shove) | On-Fire/g |
|---|---:|---:|---:|---:|---:|---:|
| Funnel ON vs Funnel OFF | 10-10 | 50.0% (29.9%–70.1%) | 86.0 – 79.0 (+7.0) | 95.5% / 91.3% | 78.5 (67.6) | 1.1 |

## Matched-Seed Gauntlet vs. 4 Opponents (N = 48 each)
| Opponent | Funnel ON W-L (Diff, Fire/g) | Funnel OFF W-L (Diff, Fire/g) |
|---|---:|---:|
| `shove-hound` | 3-9 (-86.0, 0.8 fire/g) | 6-6 (-1.3, 3.2 fire/g) |
| `hybrid-ace` | 4-8 (-34.2, 0.8 fire/g) | 7-5 (+27.1, 1.3 fire/g) |
| `arc-architect` | 4-8 (-36.4, 0.9 fire/g) | 10-2 (+122.6, 1.9 fire/g) |
| `alley-oop-express` | 5-7 (-32.6, 0.7 fire/g) | 12-0 (+196.7, 2.5 fire/g) |
| **TOTAL** | **16-32 (33.3%, 0.8 fire/g)** | **35-13 (72.9%, 2.2 fire/g)** |

## Key Findings
- **Direct H2H:** Funnel ON went **10-10** (50.0%, +7.0 diff). On-Fire/g: **1.1** vs **1.5**.
- **Gauntlet:** Funnel ON went **16-32** (33.3%) vs Funnel OFF **35-13** (72.9%).
- **Diagnosis:** Check whether passing to the hot hand at `streak === 1` occasionally slows tempo vs only funneling at `streak >= 2` or `onFire`. In `champion-v1`, we restrict funneling to `onFire` or `streak >= 2` AND only when the teammate is safe from defenders (`mateDefDist > 1.85m`).

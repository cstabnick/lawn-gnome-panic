# Experiment 1: 3-Point Volume vs. Rim Dunking Across Roster Archetypes

## Experiment Card
- **Question:** How does optimal offensive style (pure 3PT spacing vs. rim/alley-oop dunking vs. stat-aware EV) interact with roster stat profiles?
- **Hypothesis:** Pure 3PT (`arc-architect`) will outperform rim-running on Shooter rosters (where uncontested apex 3s yield ~2.88 EPPS), while rim-running (`alley-oop-express`) will outperform 3PT on Dunker rosters, and `hybrid-ace` will adapt to win or finish top-2 across all three.
- **Controlled Variables:** 4×45s quarters, 60Hz, `pro` difficulty, side-swapped Home/Away, `N = 12` games per pair per roster mode (108 total matches).

## Shooter Roster (90 3PT / 50 Dunk)

| Rank | Bot | Elo | W-L | Win% (95% CI) | PPG | Diff | FG% | 3P% (3PA) | Dunks | Steals |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | **Hybrid Ace (EV)** | 1870 | 23-1 | 95.8% (79.8%–99.3%) | 181.7 | +155.0 | 96.0% | 93.8% (16.2) | 1.3 | 94.4 |
| 2 | **Alley-Oop Express (Rim)** | 1315 | 7-17 | 29.2% (14.9%–49.2%) | 71.2 | -81.9 | 100.0% | 0.0% (0.0) | 35.6 | 47.0 |
| 3 | **Arc Architect (3PT)** | 1315 | 6-18 | 25.0% (12.0%–44.9%) | 81.1 | -73.2 | 97.0% | 97.0% (27.8) | 0.0 | 36.3 |

## Dunker Roster (45 3PT / 90 Dunk)

| Rank | Bot | Elo | W-L | Win% (95% CI) | PPG | Diff | FG% | 3P% (3PA) | Dunks | Steals |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | **Hybrid Ace (EV)** | 1702 | 19-5 | 79.2% (59.5%–90.8%) | 162.6 | +110.6 | 99.7% | 93.6% (3.9) | 75.5 | 100.6 |
| 2 | **Alley-Oop Express (Rim)** | 1577 | 15-9 | 62.5% (42.7%–78.8%) | 139.0 | +61.8 | 100.0% | 0.0% (0.0) | 69.5 | 85.2 |
| 3 | **Arc Architect (3PT)** | 1221 | 2-22 | 8.3% (2.3%–25.8%) | 26.8 | -172.4 | 83.3% | 83.3% (10.7) | 0.0 | 26.4 |

## Balanced Roster (75–80 All-Around)

| Rank | Bot | Elo | W-L | Win% (95% CI) | PPG | Diff | FG% | 3P% (3PA) | Dunks | Steals |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | **Hybrid Ace (EV)** | 1821 | 22-2 | 91.7% (74.2%–97.7%) | 178.4 | +146.6 | 96.0% | 93.9% (14.4) | 2.4 | 92.9 |
| 2 | **Alley-Oop Express (Rim)** | 1482 | 12-12 | 50.0% (31.4%–68.6%) | 114.6 | +8.0 | 100.0% | 0.0% (0.0) | 57.3 | 66.2 |
| 3 | **Arc Architect (3PT)** | 1197 | 2-22 | 8.3% (2.3%–25.8%) | 37.0 | -154.6 | 94.9% | 94.9% (13.0) | 0.0 | 20.5 |

## Key Findings
- **Shooter roster winner:** `hybrid-ace` (23-1, 181.7 PPG, 93.8% 3P%).
- **Dunker roster winner:** `hybrid-ace` (19-5, 162.6 PPG, 75.5 dunks/g).
- **Balanced roster winner:** `hybrid-ace` (22-2, 178.4 PPG).
- **Takeaway for Champion:** Stat-aware EV selection beats locked single-style offense across rosters, because it fires ~90%+ 3s when shooters are open and seamlessly switches to guaranteed dunks on low-3PT builds.

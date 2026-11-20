# Experiment 5: Champion v1 Synthesis & Promotion Gauntlet

## Experiment Card
- **Hypothesis:** Synthesizing the winning levers from Experiments 1–4 (stat-aware EV offense + strict apex 3PT timing + relentless turbo-shove defense + streak>=2 hot-hand funneling) PLUS an **anti-shove ball-protection pass** (passing to an open teammate when a defender closes within `2.05m`) will dethrone baseline #1 `shove-hound` and claim #1 Elo across the entire 10-bot field.
- **Promotion Criteria (from `EXPERIMENT_PROCESS.md`):**
  1. Rank #1 in 10-bot round-robin Elo: **FAIL** (Rank #2, Elo 2020)
  2. Beat prior #1 (`shove-hound`) >55% over N=20 balanced games: **FAIL** (1-19, 5.0%, -179.8 diff)
  3. Cross-roster Pro-Teams gauntlet >60%: **FAIL** (17-15, 53.1%)
  - **OVERALL VERDICT:** 🔬 **ITERATE — SEE DIAGNOSIS BELOW**

## Direct Title Match vs. `shove-hound`
| Roster Mode | W-L | Win% (95% CI) | Avg Score (Diff) | FG% / 3P% | Steals (Shove) | On-Fire/g |
|---|---:|---:|---:|---:|---:|---:|
| Balanced (N=20) | 1-19 | 5.0% (0.9%–23.6%) | 12.4 – 192.2 (-179.8) | 85.8% / 80.9% | 16.6 (13.4) | 0.4 |
| Pro Teams (N=20) | 0-20 | 0.0% (0.0%–16.1%) | 24.6 – 157.4 (-132.8) | 85.0% / 76.6% | 29.7 (24.8) | 0.8 |

## Cross-Roster Pro-Teams Gauntlet (vs. Baseline Top 4)
| Opponent | Champion v1 W-L | Win% | Avg Score (Diff) |
|---|---:|---:|---:|
| `shove-hound` | 1-7 | 12.5% | 35.9 – 153.0 (-117.1) |
| `fire-feeder` | 5-3 | 62.5% | 121.9 – 73.8 (+48.1) |
| `alley-oop-express` | 5-3 | 62.5% | 142.4 – 73.3 (+69.1) |
| `hybrid-ace` | 6-2 | 75.0% | 158.4 – 42.8 (+115.6) |
| **TOTAL** | **17-15** | **53.1%** | — |

# 10-Bot Full Round-Robin Leaderboard (Balanced Rosters, 6 games/pair = 270 matches)

Full field including `champion-v1`.

## Leaderboard

| Rank | Bot | Elo | W-L | Win% (95% CI) | PPG | OppPPG | Diff | FG% | 3P% (3PA) | Dunks | Steals | Shove TO | Blocks | Reb | On Fire | Oops |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | **Shove Hound** (`shove-hound`) | 2165 | 50-4 | 92.6% (82.4%–97.1%) | 198.9 | 19.0 | +179.9 | 99.7% | 0.0% (0.0) | 99.4 | 113.4 | 109.6 | 0.1 | 0.2 | 1.6 | 0.0 |
| 2 | **Champion v1** (`champion-v1`) | 2020 | 46-8 | 85.2% (73.4%–92.3%) | 174.6 | 31.2 | +143.4 | 94.9% | 90.9% (25.1) | 16.0 | 86.5 | 83.8 | 0.1 | 2.5 | 2.1 | 0.2 |
| 3 | **Hybrid Ace** (`hybrid-ace`) | 1904 | 42-12 | 77.8% (65.1%–86.8%) | 158.6 | 46.9 | +111.7 | 94.5% | 91.2% (26.6) | 8.8 | 83.6 | 80.0 | 0.1 | 2.4 | 1.7 | 0.2 |
| 4 | **Fire Feeder** (`fire-feeder`) | 1687 | 34-20 | 63.0% (49.6%–74.6%) | 130.4 | 76.4 | +54.0 | 94.9% | 93.9% (31.6) | 9.5 | 68.7 | 64.2 | 0.2 | 2.1 | 1.3 | 0.4 |
| 5 | **Alley-Oop Express** (`alley-oop-express`) | 1600 | 30-24 | 55.6% (42.4%–68.0%) | 110.3 | 94.6 | +15.6 | 99.6% | 0.0% (0.0) | 55.1 | 67.7 | 57.3 | 0.1 | 0.8 | 1.3 | 6.3 |
| 6 | **Lockdown Counter** (`lockdown-counter`) | 1385 | 22-32 | 40.7% (28.7%–54.0%) | 85.2 | 127.8 | -42.6 | 95.5% | 93.5% (16.9) | 9.2 | 48.2 | 35.5 | 0.5 | 2.8 | 0.7 | 0.1 |
| 7 | **Arc Architect** (`arc-architect`) | 1345 | 18-36 | 33.3% (22.2%–46.6%) | 67.9 | 135.6 | -67.7 | 89.3% | 89.3% (25.1) | 0.0 | 39.5 | 32.8 | 0.1 | 2.5 | 1.0 | 0.0 |
| 8 | **Rim Rusher (Script)** (`rim-rusher`) | 1338 | 20-34 | 37.0% (25.4%–50.4%) | 56.4 | 132.6 | -76.2 | 96.6% | 0.0% (0.0) | 28.2 | 35.2 | 35.1 | 0.2 | 1.0 | 1.7 | 0.0 |
| 9 | **Downtown Sniper (Script)** (`downtown-sniper`) | 941 | 7-47 | 13.0% (6.4%–24.4%) | 21.7 | 171.9 | -150.2 | 78.7% | 78.5% (9.0) | 0.1 | 18.5 | 13.1 | 0.4 | 2.8 | 0.6 | 0.0 |
| 10 | **Classic Jam (Built-in)** (`classic`) | 615 | 1-53 | 1.9% (0.3%–9.8%) | 11.9 | 179.7 | -167.9 | 91.7% | 100.0% (0.0) | 5.8 | 11.8 | 5.3 | 0.5 | 2.1 | 0.4 | 0.0 |

## Head-to-Head Matrix (Row Wins / Games)

| Bot | `shove-hound` | `champion-v1` | `hybrid-ace` | `fire-feeder` | `alley-oop-express` | `lockdown-counter` | `arc-architect` | `rim-rusher` | `downtown-sniper` | `classic` |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `shove-hound` | — | 6/6 (+159.0) | 5/6 (+98.2) | 4/6 (+98.8) | 6/6 (+221.3) | 5/6 (+133.0) | 6/6 (+216.3) | 6/6 (+239.7) | 6/6 (+237.0) | 6/6 (+215.3) |
| `champion-v1` | 0/6 (-159.0) | — | 4/6 (+54.5) | 6/6 (+170.7) | 6/6 (+194.2) | 6/6 (+238.2) | 6/6 (+182.8) | 6/6 (+193.7) | 6/6 (+199.2) | 6/6 (+216.3) |
| `hybrid-ace` | 1/6 (-98.2) | 2/6 (-54.5) | — | 4/6 (+44.2) | 6/6 (+195.2) | 6/6 (+237.0) | 5/6 (+85.8) | 6/6 (+188.8) | 6/6 (+189.0) | 6/6 (+217.8) |
| `fire-feeder` | 2/6 (-98.8) | 0/6 (-170.7) | 2/6 (-44.2) | — | 3/6 (-17.8) | 6/6 (+224.7) | 5/6 (+107.5) | 4/6 (+85.8) | 6/6 (+181.8) | 6/6 (+217.8) |
| `alley-oop-express` | 0/6 (-221.3) | 0/6 (-194.2) | 0/6 (-195.2) | 3/6 (+17.8) | — | 6/6 (+98.5) | 5/6 (+154.2) | 4/6 (+69.3) | 6/6 (+223.3) | 6/6 (+188.3) |
| `lockdown-counter` | 1/6 (-133.0) | 0/6 (-238.2) | 0/6 (-237.0) | 0/6 (-224.7) | 0/6 (-98.5) | — | 3/6 (-27.7) | 6/6 (+152.7) | 6/6 (+219.0) | 6/6 (+204.3) |
| `arc-architect` | 0/6 (-216.3) | 0/6 (-182.8) | 1/6 (-85.8) | 1/6 (-107.5) | 1/6 (-154.2) | 3/6 (+27.7) | — | 2/6 (-76.7) | 4/6 (+16.2) | 6/6 (+170.0) |
| `rim-rusher` | 0/6 (-239.7) | 0/6 (-193.7) | 0/6 (-188.8) | 2/6 (-85.8) | 2/6 (-69.3) | 0/6 (-152.7) | 4/6 (+76.7) | — | 6/6 (+125.7) | 6/6 (+41.5) |
| `downtown-sniper` | 0/6 (-237.0) | 0/6 (-199.2) | 0/6 (-189.0) | 0/6 (-181.8) | 0/6 (-223.3) | 0/6 (-219.0) | 2/6 (-16.2) | 0/6 (-125.7) | — | 5/6 (+39.3) |
| `classic` | 0/6 (-215.3) | 0/6 (-216.3) | 0/6 (-217.8) | 0/6 (-217.8) | 0/6 (-188.3) | 0/6 (-204.3) | 0/6 (-170.0) | 0/6 (-41.5) | 1/6 (-39.3) | — |

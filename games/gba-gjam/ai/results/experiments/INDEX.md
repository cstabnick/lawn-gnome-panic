# GBA GJAM — Bot Strategy Experiments Index

Executed **15 experiments** across **Unrestricted (60Hz)** and **Human-Fair (150ms)** leagues using the deterministic evaluation harness (`npm run eval:experiments -w games/gba-gjam`).

| # | Experiment | Matches | Summary | Report |
|---|---|---:|---|---|
| **EXP1** | 3-Point Volume vs. Rim Dunking Across Rosters | 108 | Winner by roster — Shooter: `hybrid-ace` (95.8%), Dunker: `hybrid-ace` (79.2%), Balanced: `hybrid-ace` (91.7%). | [REPORT.md](./exp1-offense-vs-roster/REPORT.md) |
| **EXP2** | Defense Policy Sweep (Passive vs Steal vs Shove) | 72 | Winner: Relentless Shove (`Turbo>=22`) (86.1%, Elo 2076, 91.4 shove TO/g). | [REPORT.md](./exp2-defense-meta/REPORT.md) |
| **EXP3** | 2×2 Ablation: Apex Timing × Contest Discipline | 72 | Winner: Apex OFF + Contest Discipline ON (72.2%, 95.2% 3P%). | [REPORT.md](./exp3-shot-micro-ablation/REPORT.md) |
| **EXP4** | Hot-Hand / ON FIRE Funnel A/B Test | 116 | Direct H2H: Funnel ON 10-10 (50.0%). Gauntlet: 16/48 vs 35/48. | [REPORT.md](./exp4-on-fire-funnel/REPORT.md) |
| **EXP5** | Champion v1 Synthesis & Promotion Gauntlet | 342 | Rank #2/10 (Elo 2020, 85.2% RR). vs `shove-hound`: 1-19 bal, 0-20 pro. Verdict: ITERATE. | [REPORT.md](./exp5-champion-v1-gauntlet/REPORT.md) |
| **EXP6** | Inbound & Transition Anti-Shove Blitz | 128 | `exp6-inbound-pass` cut `ShvSuf` vs `shove-hound` from 95.5 to 68.8 (+61.5 medDiff), still 3-17. | [REPORT.md](./exp6-inbound-blitz/REPORT.md) |
| **EXP7** | Quick-Release 3PT vs. Immediate Turbo-Dunk | 320 | **Breakthrough:** `quickRelease` flipped `champion-v1` vs `shove-hound` to 13-7 (+101.0 medDiff, 1.25 PPP) bal / 14-6 shooter. | [REPORT.md](./exp7-hesitation-removal/REPORT.md) |
| **EXP8** | Pre-Emptive Off-Ball Shoving & 2v1 Trap Defense | 452 | Top sweep: `offTurbo=Inf, dblR=11` (32-4, 88.9%, 101.2 ShvTO/g). H2H vs `shove-hound`: 10-10 (+20.0 medDiff). | [REPORT.md](./exp8-offball-trap-sweep/REPORT.md) |
| **EXP9** | Dunk-Reach Perimeter Geometry | 100 | `dunkPerimeter` flipped `champion-v1` vs `shove-hound` to 15-5 (+189.5 medDiff) bal / 19-1 dunker, but lost 6-14 H2H vs control. | [REPORT.md](./exp9-dunk-perimeter/REPORT.md) |
| **EXP10** | Automated Parameter Search → `champion-v2` Gauntlet | 2,174 | **PROMOTED:** `champion-v2` Rank #1/11 (Elo 2211, 56-4, 2.30 PPP). vs `shove-hound`: 12-8 bal; Pro gauntlet: 23/32 (71.9%). | [REPORT.md](./exp10-champion-v2-gauntlet/REPORT.md) |
| **EXP11** | Dual-League Meta Shift (60Hz vs 150ms) | 660 | 150ms Human-Fair #1: `champion-v1` (Elo 2149, 51-9) ahead of `shove-hound` (2133) & `champion-v2` (2127). | [REPORT.md](./exp11-dual-league-150ms/REPORT.md) |
| **EXP12** | Asymmetric 2-Bot Duo Synergy (Pro-Teams) | 504 | 60Hz #1: `champion-v2` (80.6%). 150ms #1: `duo-v2-shove` (`ChampionV2(0) + ShoveHound(1)`, 76.4%, Elo 1720). | [REPORT.md](./exp12-duo-synergy/REPORT.md) |
| **EXP13** | Pushing Past `champion-v2` (v3 Ablations) | 360 | 60Hz: `v3-all` 15-5 (+194.5 medDiff) & `v3-inbound` 14-6 vs `champion-v2`. 150ms: all 6 variants tied 10-10 (50.0%). | [REPORT.md](./exp13-v3-plateau-check/REPORT.md) |
| **EXP14** | `champion-v3` Promotion Gauntlet | 488 | Rank #1/12 (Elo 2156, 59-7) & 24-8 pro-teams, but 10-10 (50.0%) H2H vs `champion-v2` bal. Verdict: ITERATE. | [REPORT.md](./exp14-champion-v3-gauntlet/REPORT.md) |
| **EXP15** | Next-Wave Counter-Strategies vs `champion-v3` | 120 | **Plateau reached:** 5 variants scored 41.7%–54.2% (best `v4-tight-dbl` 13-11) with wide snowball IQRs `[-220..+212]`. | [REPORT.md](./exp15-v4-plateau-probe/REPORT.md) |

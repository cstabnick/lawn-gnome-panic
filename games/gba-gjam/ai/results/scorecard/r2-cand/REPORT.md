# GBA GJAM scorecard: r2-cand

Balance: `DEFAULT_BALANCE_CONFIG`. 60 mirror matches and 60 matches per skill/restriction pair, seeds `10000`+. Persona round-robin: 16 games per pair. Generated 2026-11-21T05:44:52.548Z.

## Targets

| Metric | Value | Target | Result |
|---|---:|---|---|
| Points per team per game (4x45 s) | 35.4 | 30-60 | PASS |
| Median GEI | 2.77 | 3-7 | FAIL |
| Average + thriller share of matches | 100.0% | above 50% (mostly average and thriller) | PASS |
| Dunk share of scores | 21.6% | 10-25% | PASS |
| Mean possession seconds | 2.85 | 4-9 | FAIL |
| Mean passes per possession | 1.13 | 1.5 or more | FAIL |
| Mean lead changes | 3.23 | 4 or more | FAIL |
| Early-lead AUC at 50% | 0.756 | below 0.85 | PASS |
| Strong vs weak win rate | 43.3% | above 70% | FAIL |
| Strong vs noPass(strong) | 100.0% | above 60% | PASS |
| Garbage-time share (LI < 0.3) | 24.7% | below 35% | PASS |
| Persona Nash entropy (normalised) | 0.000 | above 0.6 | FAIL |

## Supporting metrics

| Metric | Value |
|---|---:|
| Mean GEI | 2.92 |
| GEI bands (dud / average / thriller / heartPounder) | 0 / 55 / 5 / 0 |
| Early-lead AUC at 25% | 0.640 |
| Home-side win rate in mirror matches (should be near 50%) | 41.7% |
| Comeback rate (winner trailed by 8+) | 16.7% |
| Winner's mean max deficit | 4.00 |
| FG% on fire (pooled) | 75.0% |
| FG% not on fire (pooled) | 47.6% |
| Flame lift (on fire minus off, points) | 27.4 |
| Strong vs weak, fire off | 50.0% |
| Strong vs noTurbo(strong) | 60.0% |
| Matches with a score | 60 / 60 |

## Persona round-robin (row wins vs column)

| Persona | `shove-hound` | `arc-architect` | `alley-oop-express` | `lockdown-counter` | `hybrid-ace` | `fire-feeder` | Nash weight |
|---|---:|---:|---:|---:|---:|---:|---:|
| `shove-hound` | 0.50 | 0.50 | 0.19 | 0.06 | 0.44 | 0.44 | 0.000 |
| `arc-architect` | 0.50 | 0.50 | 0.06 | 0.00 | 0.50 | 0.31 | 0.000 |
| `alley-oop-express` | 0.81 | 0.94 | 0.50 | 0.44 | 0.81 | 0.44 | 0.000 |
| `lockdown-counter` | 0.94 | 1.00 | 0.56 | 0.50 | 0.94 | 0.94 | 1.000 |
| `hybrid-ace` | 0.56 | 0.50 | 0.19 | 0.06 | 0.50 | 0.50 | 0.000 |
| `fire-feeder` | 0.56 | 0.69 | 0.56 | 0.06 | 0.50 | 0.50 | 0.000 |

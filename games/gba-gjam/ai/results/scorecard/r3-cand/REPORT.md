# GBA GJAM scorecard: r3-cand

Balance: `DEFAULT_BALANCE_CONFIG`. 60 mirror matches and 60 matches per skill/restriction pair, seeds `10000`+. Persona round-robin: 16 games per pair. Generated 2026-11-21T05:45:07.560Z.

## Targets

| Metric | Value | Target | Result |
|---|---:|---|---|
| Points per team per game (4x45 s) | 34.9 | 30-60 | PASS |
| Median GEI | 2.25 | 3-7 | FAIL |
| Average + thriller share of matches | 100.0% | above 50% (mostly average and thriller) | PASS |
| Dunk share of scores | 24.9% | 10-25% | PASS |
| Mean possession seconds | 2.56 | 4-9 | FAIL |
| Mean passes per possession | 1.01 | 1.5 or more | FAIL |
| Mean lead changes | 3.15 | 4 or more | FAIL |
| Early-lead AUC at 50% | 0.884 | below 0.85 | FAIL |
| Strong vs weak win rate | 71.7% | above 70% | PASS |
| Strong vs noPass(strong) | 100.0% | above 60% | PASS |
| Garbage-time share (LI < 0.3) | 31.2% | below 35% | PASS |
| Persona Nash entropy (normalised) | 0.000 | above 0.6 | FAIL |

## Supporting metrics

| Metric | Value |
|---|---:|
| Mean GEI | 2.46 |
| GEI bands (dud / average / thriller / heartPounder) | 0 / 53 / 7 / 0 |
| Early-lead AUC at 25% | 0.713 |
| Home-side win rate in mirror matches (should be near 50%) | 33.3% |
| Comeback rate (winner trailed by 8+) | 13.3% |
| Winner's mean max deficit | 3.92 |
| FG% on fire (pooled) | 53.1% |
| FG% not on fire (pooled) | 47.7% |
| Flame lift (on fire minus off, points) | 5.4 |
| Strong vs weak, fire off | 75.0% |
| Strong vs noTurbo(strong) | 73.3% |
| Matches with a score | 60 / 60 |

## Persona round-robin (row wins vs column)

| Persona | `shove-hound` | `arc-architect` | `alley-oop-express` | `lockdown-counter` | `hybrid-ace` | `fire-feeder` | Nash weight |
|---|---:|---:|---:|---:|---:|---:|---:|
| `shove-hound` | 0.50 | 0.63 | 0.13 | 0.13 | 0.63 | 0.44 | 0.000 |
| `arc-architect` | 0.38 | 0.50 | 0.13 | 0.00 | 0.38 | 0.38 | 0.000 |
| `alley-oop-express` | 0.88 | 0.88 | 0.50 | 0.63 | 0.94 | 0.50 | 1.000 |
| `lockdown-counter` | 0.88 | 1.00 | 0.38 | 0.50 | 0.94 | 0.63 | 0.000 |
| `hybrid-ace` | 0.38 | 0.63 | 0.06 | 0.06 | 0.50 | 0.44 | 0.000 |
| `fire-feeder` | 0.56 | 0.63 | 0.50 | 0.38 | 0.56 | 0.50 | 0.000 |

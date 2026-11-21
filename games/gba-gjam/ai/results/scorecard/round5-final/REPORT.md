# GBA GJAM scorecard: round5-final

Balance: `DEFAULT_BALANCE_CONFIG`. 60 mirror matches and 60 matches per skill/restriction pair, seeds `10000`+. Persona round-robin: 16 games per pair. Generated 2026-11-21T06:13:59.439Z.

## Targets

| Metric | Value | Target | Result |
|---|---:|---|---|
| Points per team per game (4x45 s) | 38.9 | 30-60 | PASS |
| Median GEI | 2.93 | 3-7 | FAIL |
| Average + thriller share of matches | 100.0% | above 50% (mostly average and thriller) | PASS |
| Dunk share of scores | 15.5% | 10-25% | PASS |
| Mean possession seconds | 3.45 | 4-9 | FAIL |
| Mean passes per possession | 1.69 | 1.5 or more | PASS |
| Mean lead changes | 4.18 | 4 or more | PASS |
| Early-lead AUC at 50% | 0.809 | below 0.85 | PASS |
| Strong vs weak win rate | 98.3% | above 70% | PASS |
| Strong vs noPass(strong) | 70.0% | above 60% | PASS |
| Garbage-time share (LI < 0.3) | 22.5% | below 35% | PASS |
| Persona Nash entropy (normalised) | 0.000 | above 0.6 | FAIL |

## Supporting metrics

| Metric | Value |
|---|---:|
| Mean GEI | 3.35 |
| GEI bands (dud / average / thriller / heartPounder) | 0 / 44 / 16 / 0 |
| Early-lead AUC at 25% | 0.725 |
| Home-side win rate in mirror matches (should be near 50%) | 53.3% |
| Comeback rate (winner trailed by 8+) | 11.7% |
| Winner's mean max deficit | 3.37 |
| FG% on fire (pooled) | 77.8% |
| FG% not on fire (pooled) | 49.5% |
| Flame lift (on fire minus off, points) | 28.3 |
| Strong vs weak, fire off | 98.3% |
| Strong vs noTurbo(strong) | 73.3% |
| Matches with a score | 60 / 60 |

## Persona round-robin (row wins vs column)

| Persona | `shove-hound` | `arc-architect` | `alley-oop-express` | `lockdown-counter` | `hybrid-ace` | `fire-feeder` | Nash weight |
|---|---:|---:|---:|---:|---:|---:|---:|
| `shove-hound` | 0.50 | 0.81 | 0.63 | 0.56 | 0.81 | 0.75 | 1.000 |
| `arc-architect` | 0.19 | 0.50 | 0.00 | 0.31 | 0.00 | 0.19 | 0.000 |
| `alley-oop-express` | 0.38 | 1.00 | 0.50 | 0.50 | 0.81 | 0.75 | 0.000 |
| `lockdown-counter` | 0.44 | 0.69 | 0.50 | 0.50 | 0.81 | 0.50 | 0.000 |
| `hybrid-ace` | 0.19 | 1.00 | 0.19 | 0.19 | 0.50 | 0.56 | 0.000 |
| `fire-feeder` | 0.25 | 0.81 | 0.25 | 0.50 | 0.44 | 0.50 | 0.000 |

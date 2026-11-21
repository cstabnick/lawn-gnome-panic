# GBA GJAM scorecard: r1-cand

Balance: `DEFAULT_BALANCE_CONFIG`. 60 mirror matches and 60 matches per skill/restriction pair, seeds `10000`+. Persona round-robin: 16 games per pair. Generated 2026-11-21T05:31:22.636Z.

## Targets

| Metric | Value | Target | Result |
|---|---:|---|---|
| Points per team per game (4x45 s) | 20.7 | 30-60 | FAIL |
| Median GEI | 1.73 | 3-7 | FAIL |
| Average + thriller share of matches | 93.3% | above 50% (mostly average and thriller) | PASS |
| Dunk share of scores | 51.4% | 10-25% | FAIL |
| Mean possession seconds | 2.17 | 4-9 | FAIL |
| Mean passes per possession | 0.88 | 1.5 or more | FAIL |
| Mean lead changes | 1.80 | 4 or more | FAIL |
| Early-lead AUC at 50% | 0.798 | below 0.85 | PASS |
| Strong vs weak win rate | 86.7% | above 70% | PASS |
| Strong vs noPass(strong) | 100.0% | above 60% | PASS |
| Garbage-time share (LI < 0.3) | 28.9% | below 35% | PASS |
| Persona Nash entropy (normalised) | 0.000 | above 0.6 | FAIL |

## Supporting metrics

| Metric | Value |
|---|---:|
| Mean GEI | 1.77 |
| GEI bands (dud / average / thriller / heartPounder) | 4 / 56 / 0 / 0 |
| Early-lead AUC at 25% | 0.663 |
| Home-side win rate in mirror matches (should be near 50%) | 43.3% |
| Comeback rate (winner trailed by 8+) | 10.0% |
| Winner's mean max deficit | 3.58 |
| FG% on fire (pooled) | 15.8% |
| FG% not on fire (pooled) | 18.8% |
| Flame lift (on fire minus off, points) | -3.1 |
| Strong vs weak, fire off | 88.3% |
| Strong vs noTurbo(strong) | 86.7% |
| Matches with a score | 60 / 60 |

## Persona round-robin (row wins vs column)

| Persona | `shove-hound` | `arc-architect` | `alley-oop-express` | `lockdown-counter` | `hybrid-ace` | `fire-feeder` | Nash weight |
|---|---:|---:|---:|---:|---:|---:|---:|
| `shove-hound` | 0.50 | 0.69 | 0.25 | 0.31 | 0.25 | 0.44 | 0.000 |
| `arc-architect` | 0.31 | 0.50 | 0.00 | 0.13 | 0.25 | 0.38 | 0.000 |
| `alley-oop-express` | 0.75 | 1.00 | 0.50 | 0.69 | 0.69 | 0.56 | 1.000 |
| `lockdown-counter` | 0.69 | 0.88 | 0.31 | 0.50 | 0.94 | 0.38 | 0.000 |
| `hybrid-ace` | 0.75 | 0.75 | 0.31 | 0.06 | 0.50 | 0.44 | 0.000 |
| `fire-feeder` | 0.56 | 0.63 | 0.44 | 0.63 | 0.56 | 0.50 | 0.000 |

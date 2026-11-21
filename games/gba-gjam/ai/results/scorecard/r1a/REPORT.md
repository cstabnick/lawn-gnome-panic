# GBA GJAM scorecard: r1a

Balance: `DEFAULT_BALANCE_CONFIG`. 60 mirror matches and 60 matches per skill/restriction pair, seeds `10000`+. Persona round-robin: 16 games per pair. Generated 2026-11-21T05:31:54.562Z.

## Targets

| Metric | Value | Target | Result |
|---|---:|---|---|
| Points per team per game (4x45 s) | 40.2 | 30-60 | PASS |
| Median GEI | 2.69 | 3-7 | FAIL |
| Average + thriller share of matches | 100.0% | above 50% (mostly average and thriller) | PASS |
| Dunk share of scores | 33.7% | 10-25% | FAIL |
| Mean possession seconds | 2.26 | 4-9 | FAIL |
| Mean passes per possession | 0.84 | 1.5 or more | FAIL |
| Mean lead changes | 2.35 | 4 or more | FAIL |
| Early-lead AUC at 50% | 0.860 | below 0.85 | FAIL |
| Strong vs weak win rate | 93.3% | above 70% | PASS |
| Strong vs noPass(strong) | 100.0% | above 60% | PASS |
| Garbage-time share (LI < 0.3) | 30.1% | below 35% | PASS |
| Persona Nash entropy (normalised) | 0.000 | above 0.6 | FAIL |

## Supporting metrics

| Metric | Value |
|---|---:|
| Mean GEI | 2.72 |
| GEI bands (dud / average / thriller / heartPounder) | 0 / 57 / 3 / 0 |
| Early-lead AUC at 25% | 0.698 |
| Home-side win rate in mirror matches (should be near 50%) | 55.0% |
| Comeback rate (winner trailed by 8+) | 23.3% |
| Winner's mean max deficit | 4.77 |
| FG% on fire (pooled) | 54.3% |
| FG% not on fire (pooled) | 48.0% |
| Flame lift (on fire minus off, points) | 6.3 |
| Strong vs weak, fire off | 93.3% |
| Strong vs noTurbo(strong) | 71.7% |
| Matches with a score | 60 / 60 |

## Persona round-robin (row wins vs column)

| Persona | `shove-hound` | `arc-architect` | `alley-oop-express` | `lockdown-counter` | `hybrid-ace` | `fire-feeder` | Nash weight |
|---|---:|---:|---:|---:|---:|---:|---:|
| `shove-hound` | 0.50 | 0.81 | 0.31 | 0.38 | 0.44 | 0.44 | 0.000 |
| `arc-architect` | 0.19 | 0.50 | 0.00 | 0.06 | 0.13 | 0.19 | 0.000 |
| `alley-oop-express` | 0.69 | 1.00 | 0.50 | 0.75 | 0.69 | 0.50 | 1.000 |
| `lockdown-counter` | 0.63 | 0.94 | 0.25 | 0.50 | 0.75 | 0.44 | 0.000 |
| `hybrid-ace` | 0.56 | 0.88 | 0.31 | 0.25 | 0.50 | 0.44 | 0.000 |
| `fire-feeder` | 0.56 | 0.81 | 0.50 | 0.56 | 0.56 | 0.50 | 0.000 |

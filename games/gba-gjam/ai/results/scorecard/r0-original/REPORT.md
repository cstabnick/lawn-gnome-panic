# GBA GJAM scorecard: r0-original

Balance: `ORIGINAL_BALANCE_CONFIG`. 60 mirror matches and 60 matches per skill/restriction pair, seeds `10000`+. Persona round-robin: 16 games per pair. Generated 2026-11-21T05:30:33.450Z.

## Targets

| Metric | Value | Target | Result |
|---|---:|---|---|
| Points per team per game (4x45 s) | 97.3 | 30-60 | FAIL |
| Median GEI | 0.51 | 3-7 | FAIL |
| Average + thriller share of matches | 41.7% | above 50% (mostly average and thriller) | FAIL |
| Dunk share of scores | 89.4% | 10-25% | FAIL |
| Mean possession seconds | 0.90 | 4-9 | FAIL |
| Mean passes per possession | 0.47 | 1.5 or more | FAIL |
| Mean lead changes | 0.78 | 4 or more | FAIL |
| Early-lead AUC at 50% | 0.997 | below 0.85 | FAIL |
| Strong vs weak win rate | 100.0% | above 70% | PASS |
| Strong vs noPass(strong) | 100.0% | above 60% | PASS |
| Garbage-time share (LI < 0.3) | 82.4% | below 35% | FAIL |
| Persona Nash entropy (normalised) | 0.000 | above 0.6 | FAIL |

## Supporting metrics

| Metric | Value |
|---|---:|
| Mean GEI | 1.56 |
| GEI bands (dud / average / thriller / heartPounder) | 35 / 18 / 7 / 0 |
| Early-lead AUC at 25% | 0.976 |
| Home-side win rate in mirror matches (should be near 50%) | 76.7% |
| Comeback rate (winner trailed by 8+) | 13.3% |
| Winner's mean max deficit | 2.15 |
| FG% on fire (pooled) | 96.2% |
| FG% not on fire (pooled) | 73.3% |
| Flame lift (on fire minus off, points) | 22.9 |
| Strong vs weak, fire off | 100.0% |
| Strong vs noTurbo(strong) | 100.0% |
| Matches with a score | 60 / 60 |

## Persona round-robin (row wins vs column)

| Persona | `shove-hound` | `arc-architect` | `alley-oop-express` | `lockdown-counter` | `hybrid-ace` | `fire-feeder` | Nash weight |
|---|---:|---:|---:|---:|---:|---:|---:|
| `shove-hound` | 0.50 | 1.00 | 1.00 | 0.75 | 0.75 | 0.69 | 1.000 |
| `arc-architect` | 0.00 | 0.50 | 0.31 | 0.88 | 0.31 | 0.31 | 0.000 |
| `alley-oop-express` | 0.00 | 0.69 | 0.50 | 0.75 | 0.00 | 0.19 | 0.000 |
| `lockdown-counter` | 0.25 | 0.13 | 0.25 | 0.50 | 0.00 | 0.00 | 0.000 |
| `hybrid-ace` | 0.25 | 0.69 | 1.00 | 1.00 | 0.50 | 0.63 | 0.000 |
| `fire-feeder` | 0.31 | 0.69 | 0.81 | 1.00 | 0.38 | 0.50 | 0.000 |

# R1 fix round: notes per epic (fallbacks taken, perf measurements)

## FX09 Pardonlin's ground
- D9 item 4: the Thymes is sunk through its course config (`WATER.courses.thymes.freeboard` 1.8, `bank` 0.5): no kernel change, so the ruling's main option was taken, not the fallback.
- GR9 perf, `node tools/gta-perf.mjs --cpu 4` at 390x844, before -> after (avg / p95 ms): Grand Platz 107.5/145.8 -> 72.1/111.8, Rue Ouest 70.7/104.3 -> 52.2/74.8, Beetle Market 45.4/69.4 -> 46.7/68.4 (+3%). Draw calls rose (market 123 -> 454 avg); details in `fix/FX09/result.md`.

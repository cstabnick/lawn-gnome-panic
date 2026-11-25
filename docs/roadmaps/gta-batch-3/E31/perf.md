# E31 perf (phone viewport 390x844 @2x, `node tools/gta-perf.mjs <url> --route outer`, same machine)

| Leg | before: draw calls avg/max, CPU ms (render) | after |
|---|---|---|
| Trellisdown | 171/320, 3.71 (2.04) | 177/392, 4.46 (2.63) |
| Unmown gate | 130/200, 3.12 (1.88) | 146/231, 3.19 (1.99) |
| Unmown preserve | 115/156, 3.40 (2.04) | 198/359, 3.53 (2.23) |
| Snowcap Rise | 143/271, 3.40 (2.07) | 156/297, 4.22 (2.78) |
| Saltbucket hinterland | 116/230, 3.44 (2.04) | 117/226, 3.58 (2.27) |
| Trellisdown south | 136/300, 3.20 (1.82) | 127/278, 3.96 (2.50) |

Frame times stay at vsync on every leg (avg/p50 7.5 ms, p95 8.0-8.1 ms) before and after; scene meshes 10.2k → 11.9k.
One after-run made while other worktrees were running test suites showed render 4-7.5 ms; a rerun on a quiet machine gave
the table above. All new scenery is in culled cell batches; critters build meshes only near the player.

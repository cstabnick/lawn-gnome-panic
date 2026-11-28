# FX12 roadmap: Snowcap Rise snow, Snowdrop Slope, the Wool Run and Pail Pond

Brief: [../FX12-snowcap-snow-slope-pond.md](../FX12-snowcap-snow-slope-pond.md). Decisions D12 (a), D24, D26 (a).

## Foundation (lead, before the workers)
- D12 paint rule: `landforms/northHighlands.ts` (`SNOW_PAINT`): ice on ponds, snow aprons r + 30 (± 10 noise) round
  ponds and snowfields, gravel above 0.45 slope, `thaw` features green inside r with a 28 m frost ring, a 45 m patchy
  frost band along the region's inner border, snow everywhere else. Mirrored in `assembly/kernel.ts evalRegionPaint`
  (feature kind `thaw` = 14 in `wasm/gtaWasm.ts`), parity test `landforms/northHighlands.test.ts`.
- Level data: `thaw/capwood`, `thaw/mittenholt-green`; the `ski-hill` slot extended north to z -1350 for the summit
  start; `reserve/woolly-sock-lodge` levels a pad under the lodge.
- Contracts: `NURSERY_RUN` and RunId `'nursery'` in `winter/types.ts`; stub `winter/slopeLife.ts` wired into hill.ts.

## Epic 1 (parallel, one owner per file)

| Issue | Owner files | Findings | Model |
|---|---|---|---|
| A Wool Run from the summit | winter/types.ts, course.ts, tow.ts, save.ts, runtime.ts, winterApp.ts (+ tests), app.ts one line, achievements description | G4#8, G8#22, G4#9 (brake) | Sonnet |
| B1 Slope dressing | winter/hill.ts (+ test), level marker `reserve/woolly-sock-lodge` | G4#6, G4#7, G4#9 (corral) | Sonnet |
| B2 Slope life | winter/slopeLife.ts (+ test) | G4#7 (skiers), G4#10 (night) | Sonnet |
| C Pail Pond | winter/pond.ts (+ test) | G4#12 | Sonnet |
| D Chill bears | critters/snowcap.ts, critters/fells.ts | G4#13, G4#14, G4#15 | Sonnet |
| P Prefabs | prefabs gta-winter-lodge.ts, gta-winter-rides.ts | G4#10 (lodge), poles, fence, deck | Sonnet |

Lead: lore (G4#2 ruling, G4#32), re-shoots, checks. G4#4 (settling snow) is a could, after the paint.

Issues: [issues/](issues/) (each starts with `_env.md`).

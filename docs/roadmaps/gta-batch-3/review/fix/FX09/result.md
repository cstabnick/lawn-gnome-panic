# FX09 result (R1 fix round): Pardonlin's ground

Branch `fix/FX09`. Plan: `roadmap.md`, shared worker context `common.md`, issues in `issues/`. The lead wrote the
foundation (laid ground and the cross-district hooks), then five Sonnet workers ran in parallel, one file set each.
Shots were taken on port 5509 and saved under `review/shots/FX09/` (git-ignored); `before/` holds the pre-fix views.

| Finding | Status | What changed | Evidence |
|---|---|---|---|
| G2#1 lawn verges, no pavements (must, D9.1) | fixed | `pardonlin/groundPlan.ts` + `ground.ts`: every town road gets a limestone-flag pavement out to 9.6 m from its centre line (the street fronts) on 'area', and a granite kerb stripe on 'edge', cut at junction mouths. Roundabouts are paved on the outside only, and nothing is laid on the Thymes or its bridges. These are draped decals, merged per 96 m cell, with no tile props. | `groundPlan.test.ts`; shots `ot3`, `rueouest`, `f1/hatwheel`, `f2/placedupot` |
| G2#2 no ambling paths (must, D9.2) | fixed | Eight crooked cobbled `trail/pl-*` lanes are built on both sides (`districts/lanes.ts`): 3 in the Old Town, 3 on the Left Bank, 2 in Teacup Row. They add 123 houses, and each lane has courtyards, signs ("Ruelle des Pas Perdus") and lamps. Where a lane crosses a street row, the row's buildings are dropped to open passages. Lane surfaces reach 2 m past the trail to cover the terrain's dirt border. | `lanes.test.ts`; worker shots `scratchpad/fx09-lanes/s1/*`, `s2/scarabees.png`, `s4/mobile-pas.png`, `phone/phone-lane` |
| G2#3 Grand Platz huge and bare (must, D9.3) | fixed | The core is a 50 x 63 m setts court with cobble rings, filled with a carousel (with its own queue), a flower market, news kiosks, cafe terraces of 23 sets, toy boats on the fountain, a crowd of five round Marcel, a candyfloss cart and chairs at the bandstand. The outer ring is gravel with a plane-tree quincunx and benches. The fixed points are unchanged. | shots `ot2`, `phone/phone-platz`; worker `fx09-b/platzc.png`, `regatta.png`, `mime2.png` |
| G2#4 Thymes a painted road (must, D9.4) | fixed | The channel is sunk through config only: `WATER.courses.thymes` is now `{ depth 1.4, bank 0.5, freeboard 1.8 }`, with no kernel change. Dressed-stone quay walls run on both banks (a low mossy bank in the Jardin), with railings and 10 river stairs. There are 11 moored berths (houseboats, péniches, the sunk rowboat FOR SALE) and 17 bouquiniste boxes with 4 sellers. Static swans include a nest with cygnets, and every bridge has parapets and lamps, with the love-lock railing on the Pont Neuf. The quays are flagged as quay bands. | `thymes.test.ts` (water 1.5-2.2 m under the coping; nothing dropped); shots `thymes`, `thymesn`, `tq2`, `phone/phone-quay`; worker `fx09-thymes/pontneuf.png`, `locks.png`, `down.png` (the lead's own `pontneuf` spot faced a house wall) |
| G2#7 Beetle Market bare frames (should) | fixed | The market is cobbled. 48 striped-canopy stalls stand in crooked clusters, one trade per cluster: beetles in jars, cheese, bric-a-brac, books, records, prints, hats. There is bunting, 8 new stallholders and shoppers, and haggling vignettes. | shot `lb2`; worker `fx09-D/r5/lb2.png`, `marketin.png`, `r5m/lb2.png` |
| G2#8 Basin Quay empty (should) | fixed | Basin Quay now has a stone coping with bollards, a slipway and a pontoon, a harbourmaster's hut ("Office hours: high tide"), a net rack and crates. The pedalo is on the water with dinghies and a cruiser, a plane allée stands on the quay axis, and terrace rows hide the world wall. The gardens' third rect was widened west to x -1660. | shot `gd3`; worker `fx09-gardens/r4/basin.png`, `hut.png` |
| G2#9 Jardin stops past the parterre (should) | fixed | Past the parterre the Jardin has gravel walks (patches), pleached-lime avenues, terracotta urns, a rill court, a rose walk, and Hubert Secateur at work. The river edge is the low stone bank from G2#4. | shot `jardinfountain`; worker `fx09-gardens/r3/gd1.png`, `r4/rill.png` |
| G2#10 seams, timber tiles, slab edges (must) | fixed | Tile props are retired town-wide: every paved area is one draped decal (setts, flags, cobble, gravel, quay) on procedural stone textures, with accent rings one layer up. This removes the seams, the wood look and the raised slab edges. | shots `ot2`, `groan` |
| G2#15 Le Petit Groan a grey hole (should) | fixed | `CLUB_DOOR` (-1555.5, -183.9, yaw PI/2) is now a red cellar door under a stone arch in the south-west corner cafe's east wall. It has a hatch, the banner "LE PETIT GROAN. Laughter by appointment." and tonight's bill on a menu board. The stair well is gone, and the lore entry is updated. | shot `groan`; `src/workplaces` tests |
| G2#25 low-end phone perf (must, D9.5) | done | Measured with `--cpu 4` at 390x844 before and after (table below). Average frame time is within +15% at all three spots. | `scratchpad/perf-before.txt`, `perf-after.txt` |
| G2#26 lawn strip at the Opera Hall (must) | fixed | The forecourt is setts from the Boulevard's kerb to the steps. It has a ticket kiosk whose queue is one cellist, Fifth Symphony posters, a stage door with a waiting cellist, and the Maestro's scooter. | shot `lb1`; worker `fx09-D/r6/kiosk.png`, `r2/adagiofront.png` |

## Perf (GR9), `node tools/gta-perf.mjs --cpu 4`, 390x844 @2x, 15 m/s, same machine (loaded by parallel runs)

| Leg | before avg / p95 ms | after avg / p95 ms | draw calls avg before / after | tris (k) before / after |
|---|---|---|---|---|
| Grand Platz | 107.5 / 145.8 | 72.1 / 111.8 | 542 / 596 | 1670 / 2363 |
| Rue Ouest | 70.7 / 104.3 | 52.2 / 74.8 | 196 / 295 | 887 / 1234 |
| Beetle Market | 45.4 / 69.4 | 46.7 / 68.4 (+3%) | 123 / 454 | 760 / 1781 |

Frame time is within budget everywhere. The machine was noisy, and the Platz leg's start moved from (-1470,-150) to the road at (-1462,-160) because the old spot timed out on load. Triangles and draw calls grew, most at the market (canopied stalls and goods), which a real phone GPU may feel more than the CPU-throttled desktop does. The cheap next step, if needed, is to merge the market's small goods into the static cells. Measuring perf was G2#25's task; this cut is not done.

## Lore
- New rulings R-251 (Pardonlin's ground: pavements, lanes, the Platz, the Thymes), R-252 (Le Petit Groan's door) and R-253 (the Beetle Market, Opera forecourt, Jardin and Basin Quay). The orchestrator renumbers them at merge.
- "In the games" sections are updated in `le-petit-groan.md`, `the-thymes.md`, `beetle-market.md`, `the-jardin.md` and `basin-quay.md`. `npm run lore` passes.

## Contracts provided
- Lanes are `trail/pl-*` footpaths in `pardonlin.level.json`. FX10 can walk them.
- `DistrictPlan.ground: GroundPatch[]` (`groundPlan.ts`). Patch shapes are rect, circle, line and band; the kinds are flags, setts, cobble, gravel and quay; `accent` puts a patch one layer up.
- `plans.ts distribute()` hands cross-district pieces to the district they stand in. The river corridor now belongs to Teacup Row and the Quays.
- The queue post positions are unchanged.

## Not done or carried over
- The quay walls are non-solid, as `RIVER_KEEP` requires. A gnome can walk off the coping into the water, and swims out by the river stairs.
- Small patches of bare grass are left at some bridge heads, between the quay bands and the pavements.
- From the screenshot spot (-1500,-200), the Platz's gravel ring in the foreground is open. The dense core starts about 3 m beyond it.
- `zfight` did not finish. At the Platz it timed out in the scan (puppeteer `protocolTimeout`), as it did for FX06. The Thymes worker's run near the river finished, with 33 pairs before its fixes and 21 after, none in its pieces except one sign face. Every new flat surface is on an @lawn/depth layer, and same-layer patches are kept apart (tests and worker checks).

## Checks
- `npm run build -w games/gnome-theft-auto`: OK.
- `npm test -w games/gnome-theft-auto`: 533 files and 5515 tests pass, 5 skipped. The golden layout fixture was regenerated on purpose because the town changed.
- `npm test -w packages/prefabs`: 4192 tests pass.
- `npm run lore`: OK.
- `bash tools/smoke.sh http://localhost:5509/?at=-1500,-220,3.14 gta-gnomlet`: SMOKE OK.
- The cutscene report was not run, because no scene changed. `CLUB_DOOR` is only used by `club.ts`.

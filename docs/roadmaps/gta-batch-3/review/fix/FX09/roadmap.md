# FX09 roadmap: Pardonlin's ground (R1 fix round)

Brief: `../FX09-pardonlin-ground.md` (D9; findings G2#1, #2, #3, #4, #7, #8, #9, #10, #15, #25, #26).

## Shape

| Epic | What | Done when | Issues |
|---|---|---|---|
| 0 (lead) | Foundation: `pardonlin/groundPlan.ts` + `ground.ts` (stone pavements to 9.6 m on every town road, granite kerbs cut at junction mouths, nothing on the Thymes or its bridges; `DistrictPlan.ground` patches: rect / circle / line / band in flags, setts, cobble, gravel, quay; trail lanes laid automatically), tile props retired in the Old Town and Teacup Row, `plans.ts` hooks for the Thymes (`districts/thymes.ts`, pieces distributed by district) and the lanes (`districts/lanes.ts`), the river corridor added to the Quays' rects, four empty prefab catalog files registered | build, `src/pardonlin` tests | - |
| 1 | Content, five Sonnet workers in parallel, one file set each | build, tests, shots | 5 |
| 2 (lead) | Golden fixture, perf before/after, zfight, smoke, re-shoots, result | all checks | - |

Shared worker context: `common.md`. Issues: `issues/A-lanes.md` (G2#2), `issues/B-platz-groan.md` (G2#3, #15),
`issues/C-thymes.md` (G2#4, #9 river edge), `issues/D-leftbank.md` (G2#7, #26), `issues/E-gardens.md` (G2#8, #9).
G2#1 and G2#10 are the foundation (pavements, decal paving); G2#25 is the lead's perf pass.

File ownership in epic 1 (no file under two issues): A `data/levels/pardonlin.level.json`, `districts/lanes.ts`;
B `districts/oldTown.ts`, `workplaces/comedy/club.ts`, `gta-pardonlin-platz.ts`, `le-petit-groan.md`; C
`districts/thymes.ts`, `config.ts` (WATER.courses.thymes only), `gta-pardonlin-river.ts`, `the-thymes.md`; D
`districts/leftBank.ts`, `gta-pardonlin-market.ts`, `beetle-market.md`; E `districts/gardens.ts`, `layout.ts` (gardens'
third rect only), `gta-pardonlin-garden.ts`, `the-jardin.md`, `basin-quay.md`. Lore rulings are proposed in reports and
appended by the lead. Workers share the lead's dev server on port 5509.

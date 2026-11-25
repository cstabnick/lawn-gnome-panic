# E24 roadmap: Jobs II (chef, mechanic, comedy stage)

Brief: [../E24-jobs-2.md](../E24-jobs-2.md). Worker environment: [_env.md](_env.md). Issues: [issues/](issues/).
Goal: three on-foot workplace jobs on the sim-jobs career: a touch cooking minigame in the Acorn Diner kitchen,
Pay 'n' Glaze client work orders scored against a brief, and a passive comedy set in a Pardonlin cellar.

| Epic | What | Done when | Issues |
|---|---|---|---|
| E24-1 foundation (lead) | `WorkJobId`, career records in `gta-jobs-v1`, `workDefs.ts` (jobs, pay, titles, achievement ids), `workplaces/` (types, `finishShift`, shift card, `installWorkplaces`), app.ts wiring, `ShowroomTarget.fixedYaw`, `glazeClient.ts`, 9 achievements, empty prefab catalogs, per-job `types.ts` contracts and stubs for every module | tsc + `src/jobs` tests | lead |
| E24-2 parallel build | board section; chef menu, step widgets, kitchen UI, prefabs, kitchen interior; mechanic briefs, glaze client mode, prefabs, client lot; comedy material, show clock, prefabs, club, stage UI; sounds; lore | tsc, unit tests, package tests, lore | 01-17 |
| E24-3 runtimes | chef, mechanic and comedy runtimes (glue, pay, bag, achievements, dev hooks `?chefshift`, `?mechorder`, `?comedyset`) | build, tests, smoke at each workplace | 18-20 |
| E24-4 finish (lead) | screenshot pass (`screens/`), AGENT_INDEX, full checks | all checks | lead |

Parallelism: every E24-2 issue owns its own file(s); shared contracts live in `workplaces/<job>/types.ts`, written by
the lead before the wave, with stubs that keep `tsc` green. Dependency E24-2 -> E24-3 only because the runtimes glue the
modules together (the stubs would let them compile, but not be checked in a browser).

Online: per player like the existing jobs (no protocol change). Mobile: every action is a tap / hold / drag on 44 px+
targets; the comedy set needs no input. No party slice: the jobs are open-world workplaces (a 20-60 s cooking round
could become one later; backlog note in the PR, not built).

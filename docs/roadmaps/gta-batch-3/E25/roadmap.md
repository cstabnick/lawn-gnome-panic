# E25 roadmap: Jobs III (garbage truck, firefighting, Gnomazon warehouse)

Brief: [../E25-jobs-3.md](../E25-jobs-3.md). Worker environment: [_env.md](_env.md). Issues: [issues/](issues/).
Goal: three more workplace jobs on the E24 framework: a bin round in the Bin Lorry with a lift-arm minigame, a fire
brigade with the Watering-Can Pumper, hose and ladder (on a reusable fire system), and a packing shift at Gnomazon
FC-1 with KPI-9 the manager-bot.

| Epic | What | Done when | Issues |
|---|---|---|---|
| E25-1 foundation (lead) | `WorkJobId` + counters + pay + 9 achievements, sites `bin-depot`/`fire-station`/`gnomazon-fc`, vehicle kinds `bin-lorry`/`fire-engine` registered, `WorkDeps.fx/seatPlayer`, workplace `waypoint()` routed in app.ts, `HYDRANT_SPOTS`, empty prefab catalogs, typed contracts (`garbage/types.ts`, `firefighter/types.ts`, `gnomazon/types.ts`, `fire/types.ts`) and stubs for every module, `?firedemo` hook | tsc, jobs/sites tests | lead |
| E25-2 parallel build | vehicles; prefabs x3; bin round, lift minigame, bin view, depot; fire sim, fire view, calls, hose, hose UI, station; orders, packing UI, warehouse; shift HUD; sounds; lore | tsc, unit tests, package tests, lore, screenshots at each place | 01-20 |
| E25-3 runtimes | garbage, firefighter and Gnomazon runtimes (glue, pay, achievements, online notes, dev hooks `?binround`, `?firecall`, `?gnomazonshift`) | build, tests, smoke at each workplace | 21-23 |
| E25-4 finish (lead) | screenshot pass (`screens/`), contracts.md (fire system), AGENT_INDEX, full checks | all checks | lead |

Models: Sonnet (general-purpose) for 01 (vehicles), 06 (lift feel), 08/14/17 (dressing and storytelling), 10 (fire
look), 13 (hose controls), 16 (packing feel), 20 (writing) and the three runtimes; Haiku (`haiku-worker`) for the rest.

Parallelism: every E25-2 issue owns its own file(s); contracts live in the `types.ts` files written by the lead with
stubs that keep `tsc` green. Dev-server ports: 5351 (01), 5352 (08), 5353 (10), 5354 (14), 5355 (17). The three dressing
issues temporarily call their builder from their own job's runtime stub and revert it (no two share a runtime file).
E25-2 -> E25-3 only because the runtimes glue the finished modules together.

Online: per player like the existing jobs; the two vehicles relay as usual (codes appended). Fires are per player
(decision in the brief). Mobile: every action is a tap/hold/drag on 44 px+ targets. Party slice: a 45 s Gnomazon
packing round fits the size rules; backlog note in the PR, not built (load limit).

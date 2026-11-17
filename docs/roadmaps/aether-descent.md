# Aether Board: Descent mode

Goal: a second, roguelite mode for Aether Board (`?mode=descent`), inspired by Descenders. Free ride stays exactly as it
is. A run is 12 hills; before each you pick one of three hill cards. Every hill is generated from three sliders
(0..5): **hazard** (aether spikes in the line, narrower runs, more gaps), **steep** (grade, so speed) and **tricky**
(more and bigger kickers, rails, ley-lines, chutes). Harder hills pay more: a bigger score multiplier, perk picks,
crash shields and 1-up lives. Each hill also has a trick-score bonus target. A crash (bail or falling off) costs a
life (or a shield); at zero lives the run is over. Every 4th hill is a boss hill. Perks are attributes that change the
board's tuning (push, pop, spin, landing tolerance, boost, bail recovery, grinds) or the run (score, shields, lives).

Contracts: `games/aether-board/src/descent/types.ts` (types and the `DESCENT` tuning table), stubs in
`descent/run.ts`, `descent/perks.ts`, `descent/ui.ts`, `World.hazards` / `generateWorld(seed, hill?)` in `world.ts`,
`dispose()` on `WorldView` and `Crowd`. Free-ride worlds are pinned by `src/world.descent.test.ts`.

| Epic | Done when | Issues |
| --- | --- | --- |
| 0. Foundation (done by the planner) | types, stubs, classic-world test; build passes | 0 |
| 1. Descent | `npm run build` + `npm test` pass, `?mode=descent` plays a run end to end, free ride unchanged | 5 + app.ts integration (planner) |
| 2. Snowboard Descenders | snowy pine mountains (forests, glades, forks, rock gardens, cliffs), landing perks and close calls; build + tests pass | 5 (foundation by the planner: hazard kinds, cliffs in `surfaceY`, `World.theme`, `ASSIST`, perk stubs) |

Party slice: the backlog row (`aether-trick-jam`) says "later"; this mode does not change that.

## Epic 1 issues

Each issue is a file in [aether-descent/](aether-descent/), run as one `haiku-worker`, all five in parallel.
`app.ts` (the mode switch, hill loading, crashes, rewards) is written by the planner in the same epic against the
stubs, since it is almost entirely decided code.

| Issue | Changes |
| --- | --- |
| [1A run rules](aether-descent/1A-run-rules.md) | descent/run.ts, descent/perks.ts, descent/run.test.ts |
| [1B hill generator](aether-descent/1B-hill-generator.md) | world.ts (generateWorld), world.descent.test.ts |
| [1C hazard physics](aether-descent/1C-hazard-physics.md) | physics.ts, physics.hazard.test.ts |
| [1D hazard view + dispose](aether-descent/1D-hazard-view-dispose.md) | view/world.ts, view/crowd.ts |
| [1E overlay UI](aether-descent/1E-overlay-ui.md) | descent/ui.ts |
| planner | app.ts, README.md |

## Epic 2 issues

All five in parallel. Foundation (planner): `HazardKind`, `Drop` + `dropHeight` in `surfaceY`, `World.theme`,
`ASSIST` / close-call constants and the `saved` event in config.ts, three perk ids, `flashSave` stub; app.ts refills
`ASSIST.landSaves` per hill and flashes saves.

| Issue | Changes |
| --- | --- |
| [2A mountain generator](aether-descent/2A-mountain-generator.md) | world.ts (generateWorld), world.descent.test.ts |
| [2B landing physics](aether-descent/2B-landing-physics.md) | physics.ts, physics.hazard.test.ts |
| [2C close-call score](aether-descent/2C-close-call-score.md) | tricks.ts, tricks.test.ts |
| [2D snow view](aether-descent/2D-snow-view.md) | view/world.ts |
| [2E landing perks + UI](aether-descent/2E-landing-perks-ui.md) | descent/perks.ts, descent/ui.ts, descent/run.test.ts |

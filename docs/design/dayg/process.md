# Process: how we build DayG

DayG is far bigger than any prototype in this repo, and its fun depends on a simulation that has to be tuned before
anyone can judge it. So we build **simulation first, then a small playable slice, then scale out**, with a measured
gate at the end of every phase. Each phase is planned with the decompose skill into epics of Haiku-worker issues.

## Phases

| Phase | What we build | Gate (all must pass to go on) |
|---|---|---|
| **0. Design** | this document set | reviewed and merged |
| **1. Sim core** | `games/dayg` workspace; `src/sim/` (region graph from a stub map, NPC organisms, groups, factions, horde field, economy, loot budget, outside traders, chronicle); `npm run sim` + report; determinism and conservation tests | correctness tests pass; **society, Hatless and economy bands** pass on 200 seeds |
| **2. The map, coarse** | the 12 districts as `@lawn/level` documents with terrain, heights, zones, routes, gates and havens (blockout stamps only); region graph bake | the sim runs on the real map and the bands still pass; every district visited by bots |
| **3. Playable slice: the Lychgate and the Old Rows** | three.js, player gnome, DayG movement and climbing, items and inventory, needs, cracks and moss, Hatless at L0, interiors, loot tables, the Waystation haven; touch controls | build and smoke pass; at phone viewport too; the playtest in [evaluation.md](evaluation.md#playtests) (12 people, 3 sessions each); player-experience bands pass for the slice |
| **4. Talk and quests** | NPC verbs, the trust ledger UI, quest templates, notice boards, reputation, joining a group | consequence-reach and quest-variety bands pass; playtest: "did something you did change the world?" ≥ 60% yes |
| **5. Online** | `dayg` in `GAMES`, host worker, interest management, snapshots, hand-off, the headless host | 4-player session for an hour with a host hand-off and no desync (world hashes match); phone host with 4 players stays in budget |
| **6. The whole map** | the other districts at full detail, LOD streaming, all havens, all gates | performance bands pass; 200-seed sweep on the full map passes every band |
| **7. Depth** | building, farming, crafting tree, traps, skills and lineage, the storylets, the Mowing | the bands still pass with the new systems on; playtest hours-per-session goes up |
| **8. Live** | telemetry, real-world vs sim comparison, seasonal tuning | sim predictions within 20% of real worlds on the main metrics |

Phases 1 and 2 have **no rendering at all**. If the simulated worlds are dull when read as chronicles and dashboards,
they will be dull to play, and that is cheaper to find out first (SOUL.md: playable over polished, but here "playable"
means the world must work before the walking does).

## The tuning loop (every phase from 1 on)

1. Change a rule or a knob in `games/dayg/src/sim/tuning.json`.
2. `npm run sim -w games/dayg -- --seeds 200` (same seeds as last time).
3. Read the scorecard: which bands moved, which failed.
4. Read 5 chronicles from failing seeds and 5 from passing ones. Do the passing ones read like good stories?
5. Keep the change, or roll it back. Write one line in `games/dayg/sim/TUNING_LOG.md` (what, why, which metrics moved).
6. Every few rounds: refresh the golden seeds, play one by hand.

## First epics (for the decompose skill)

Phase 1 cut into epics; each issue owns its own files so workers can run in parallel.

| Epic | Issues (one file group each) |
|---|---|
| 1.0 Foundation (planner) | workspace from `npm run new -- dayg`, `src/sim/types.ts` (every contract), seeded RNG, the stub map (12 regions) |
| 1.1 World | region graph and travel costs · weather and seasons · loot budget and unrolled stock · chronicle writer |
| 1.2 Agents | NPC needs and decisions (self-preservation filter) · trust ledger and rumours · group formation and fission · norms |
| 1.3 Systems | horde field (advection, diffusion, herds) · moss spread · markets and prices · caravans and outside traders |
| 1.4 Factions | power, territory, plans (expand, trade, ally, raid, war, schism, collapse) · havens |
| 1.5 Measurement | sim runner CLI · scorecard and bands · HTML report · determinism, conservation and LOD tests · golden seeds |

## Achievements

Planned for `packages/achievements/src/catalog.ts`, rewards reusing prefabs where they fit:

| Achievement | When | Reward (slot) |
|---|---|---|
| First Night | survive a night outside a haven | `leaf-cloak` (back) |
| Up and Away | climb the Spire | `grave-lantern` (hand; new prefab) |
| Bell Ringer | ring the chapel bell and live | `soul-bell` (hand, existing) |
| Keeper | relight 20 grave lanterns on the Old Rows | `pilgrim-hat` (head) |
| Sworn | reach Sworn rank in any faction | `name-tag` (neck) |
| Kingmaker | your actions put a faction in first place | `mole-crown` (head) |
| Gatekeeper | keep a trader gate safe for a whole season | `signal-horn` (neck) |
| Herd Herder | steer a herd of 200+ into a pit | `funeral-ribbon` (back; new prefab) |
| Scraped Clean | survive a moss infection | `glaze-pot` (hand) |
| Relic Runner | sell 10 relics to outside traders | `tall-eye-charm` (neck) |

## Party slice

Not yet. A DayG round needs a big world, slow tension and lasting consequences, which don't fit a 20–60 second party
round. A later idea: "Last Ladder" (four gnomes on a headstone top as a herd piles up; first to climb off by the
ropes wins). Backlog row added in `packages/party/README.md`.

## Risks

| Risk | How we watch it | Fallback |
|---|---|---|
| The sim is dull (worlds all look alike) | the archetype metric, human chronicle reads | more founder extremes, more shocks, stronger norm effects |
| The sim is chaos (everyone dies or one faction wins) | survival and HHI bands | tighten self-preservation, stronger balancing alliances |
| Too big for a browser host | performance bands | coarser L2 (region-only), the headless host for public worlds |
| Hand-making a 16 km map takes too long | phase 2 blockout first, stamps and layout scripts | ship districts in order; the Lychgate and the Old Rows first |
| Players never see the deep sim | consequence reach, playtests | surface more: rumours, the chronicle, notice boards, maps that change |

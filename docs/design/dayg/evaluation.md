# Evaluation: is the simulation working?

The game's success depends on the simulation giving good worlds **for most seeds**, not just the ones we happened to
look at. So every system is judged in a **headless simulator** over many seeds against numeric targets, before and
after we build the playable game around it. "Days" here are world-days ([world.md](world.md#time-two-clocks)).

## The simulator

- `games/dayg/src/sim/` is pure TypeScript with seeded RNG **streams per system** (weather, loot, hordes, NPC decisions,
  markets, traders), no DOM. The same code runs headless, in the host's Web Worker and in the headless host
  ([multiplayer.md](multiplayer.md)).
- `npm run sim -w games/dayg -- --seeds 200 --days 120 [--profile <tuning.json>] [--shock <name>] [--bots 0..8] [--no-traders]`
  runs worlds at L2 (and L1 around the bot players), writes one JSON row per world per world-day to
  `games/dayg/sim-out/`, and prints a **scorecard**.
- `npm run sim:report -w games/dayg` turns the rows into an HTML dashboard: every metric's distribution across seeds,
  with its target band shaded, the economy balance sheet per seed, plus a few chronicles to read.
- **Bot players** (0–8) play through the same action interface a human uses: a scavenger, a trader, a raider, a
  builder (farms and builds toward the long game), a solo survivalist, and a 3-gnome friend group.
- **Seed sets**: 200 tuning seeds and 100 **holdout** seeds that are only used at phase gates.
- **Baselines** with every sweep: no outside traders; no bots.
- Speed target: a 120-day world at L2 in under 20 s on a laptop, so 200 seeds run in about an hour on 4 cores.

## Correctness tests (`npm test -w games/dayg`)

These must always pass; they are not tuning.

| Test | Checks |
|---|---|
| Determinism | same seed + same inputs → identical world hash after 30 days |
| Conservation | items, acorns, scrip, gnomes and Hatless: what's in = start + inflows − outflows, every tick |
| LOD equivalence | the same region run at L1 and at L2 gives **equivalent** distributions for deaths, loot taken, Hatless moved, group sizes: a TOST equivalence test within a stated margin (10% of the mean), not just "no significant difference" |
| Stream isolation | changing a market rule leaves the weather, loot and horde streams identical |
| Interiors | every shell × 500 seeds generates connected rooms with an exit |
| Map bake | the region graph is up to date with the level documents |
| No stuck NPCs | no NPC has had the same plan for more than 3 days without progress |
| Scenario tests | a failing faction printing scrip; a raider faction with nothing left to raid; a gate held by one faction for a year; all must end the way the design says (discounted scrip; the raiders settle, starve or split; the traders spread out) |

## Metrics and target bands

Numbers are first guesses. A metric "passes" when the stated share of seeds lands in the band. The process
([process.md](process.md)) is: measure, read the worlds, move the bands if worlds that score well don't *feel* good.

### Survival and population

| Metric | Target | Seeds |
|---|---|---|
| Population at day 120 ÷ start | 0.25–0.70 | 90% |
| Extinction (under 5% alive) by day 120 | never | 99% |
| Median NPC lifespan | 25–70 days | 80% |
| Share of NPC deaths that are **stupid** (walked into a known herd, starved with food in reach, fell from height without need) | under 10% | 90% |
| Deaths by cause (Hatless / gnome / hunger / cold / moss / fall) | no cause above 45% | 90% |

### Society

| Metric | Target | Seeds |
|---|---|---|
| At day 60: share of NPCs alone / pack (2–8) / band (9–25) / settlement (25–120) / in a polity | 10–30% / 20–40% / 5–20% / 20–45% / 0–30% | 85% |
| Live factions at day 60 | 3–9 | 90% |
| Faction births and deaths per 30 days | ≥ 1 each | 80% |
| Faction lifespans | heavy-tailed: some short, a few last the whole run | across all seeds |
| Power concentration: normalised HHI `(HHI − 1/n) / (1 − 1/n)` | 0–0.40 | 85% |
| Top faction's share of all power | under 50% | 90% |
| Leadership changes in the top faction by day 120 | ≥ 1 | 70% |
| Alliances, wars, schisms, mergers per 30 days | each ≥ 1 in 60% of seeds | |
| Balancing: when one faction passes 45% power, rivals ally within 15 days | 70% of cases | |
| Raid-to-trade income ratio, raider factions, day 60 vs day 20 | falls (raiding stops paying as the Squeeze bites) | 75% |
| Havens up at every point | ≥ 2 | 95% |
| Haven handovers by day 120 | 1–4 | 70% |

### Hatless

| Metric | Target | Seeds |
|---|---|---|
| Hatless count at day 120 ÷ start | 0.5–2.0 | 85% |
| Share of Hatless losses from crumbling (vs destroyed) | 20–60% | 80% |
| Herd size distribution | heavy-tailed (power-law exponent 1.5–3) | across all seeds |
| Drifts (herds 500+ crossing 2+ districts) per 60 days | 1–4 | 75% |
| Falls of a settlement per 60 days | 0.5–2 | 75% |
| Share of horde in `NEST` / `PIT` zones | 30–60% | 80% |

### Economy

| Metric | Target | Seeds |
|---|---|---|
| Food loot left at day 20 / 50 / 100 (share of the start) | 55–75% / 15–35% / 0–10% ([balance sheet](economy.md#1-set-the-budget-from-the-population-with-decline-built-in)) | 85% |
| Self-sufficiency at day 60, vs the population alive / vs the start population | 0.60–0.85 / 0.30–0.50 | 85% |
| Trader share of essentials, day 60 / day 120 | 5–15% / ≥ 2% | 80% |
| Gate concentration (HHI of import volume by faction), day 60 | ≤ 0.5 | 80% |
| Relic reserve left at day 60 / 120 | 30–60% / 5–30% | 80% |
| Dead markets (an essential tag group with no trade for 3 days) | none | 90% |
| Price volatility (sd of daily log change, essentials) | 0.02–0.10 | 85% |
| Shock response: price rise within 1 day of a forced stock drop, back in band after | ≥ 90% of shocks | |
| Arbitrage gap after a caravan arrives | shrinks by ≥ 30% | 80% of arrivals |
| Gini of NPC wealth | 0.35–0.65 | 85% |
| Share of acorns held by the top 5% | under 40% | 85% |
| Quantity check `M × V` vs `P × T` | within 20% | 90% |
| Days to recover price band after a forced shock | under 20 | 85% |
| No-trader baseline: extinction by day 120 | under 10% of seeds (the world shouldn't need imports to survive, only to thrive) | |

### Player experience (bot players)

| Metric | Target | Seeds |
|---|---|---|
| Time to first NPC contact (solo bot) | under 10 min real | 90% |
| Time to first real threat | 3–15 min | 85% |
| Quests on offer within 1 km of the bot | ≥ 3 at any time after day 2 | 90% |
| Quest variety: distinct templates seen in a 3-hour session | ≥ 6 | 80% |
| **Session fit**: a 45-minute bot session from a haven finishes at least one quest or trade and gets back | ≥ 70% of sessions | |
| **Consequence reach**: share of finished quests followed within 5 days by a faction rank change, a haven changing hands, or a market leaving its band | 20–60% | 80% |
| **Counterfactual divergence**: same seed with and without the bot, vs the same seed with a **null perturbation** (one random NPC nudged) — the bot's divergence at day 30 should be clearly bigger than the null's | in 60%+ of runs | |
| Solo bot survival (median, real hours of play) | 2–6 h | 80% |
| Friend-group bot survival | 1.5–3× the solo bot | 80% |
| Bot deaths per hour by cause | no cause above 50%; under 10% "unfair" (killed within 5 s of spawning, or by something it couldn't see or hear) | 85% |
| Builder bot reaches a homestead (walls, 4 garden beds, 2 dependants) and is alive at day 100 | ≥ 40% of runs | |
| Loot pace: useful finds per real hour (solo, day 1 / day 60) | 20–40 / 4–10 | 80% |
| Share of bot time above ground level (Low and above) | 25–55% (verticality is used, but the ground isn't abandoned) | 80% |
| Every district visited by some bot in 50 worlds | yes | |

### Story

From the chronicle ([history.md](history.md#after-the-chronicle)):

| Metric | Target |
|---|---|
| Named eras per 120 days | 1–3 in 80% of seeds |
| **World archetypes**: cluster day-120 worlds by a feature vector (faction count, normalised HHI, population, Hatless, haven count, trader share, gate HHI) | ≥ 4 clear clusters; none holds more than 45% of seeds |
| Rise-and-fall arcs (a faction reaches the top 2 then dies) | in 40–80% of seeds |
| Human read: 10 random chronicles per tuning round, rated 1–5 "would I want to have played this" | median ≥ 3.5 |

### Performance

| Metric | Target |
|---|---|
| L2 tick for the whole world | under 4 ms (desktop), under 12 ms (phone), run in a worker |
| L0 frame on a mid phone with 120 Hatless near | 30 fps or better |
| World snapshot at day 30 | under 4 MB compressed |

## Golden seeds

Each tuning round, the report picks seeds that show each archetype well and seeds at the edges of every band. These
**golden seeds** are pinned in `games/dayg/sim/golden.json` with their day-120 feature vectors. The test suite runs
them (30 days each) and fails if a change moves a golden seed's vector more than a set amount without the tuning
file changing too. They are also the seeds we play by hand.

## Sensitivity sweeps

`npm run sim:sweep -w games/dayg -- --knob loot.food.daysOfSlack --range 25..60 --steps 7` runs every value on the same
seeds and plots each metric against the knob. We keep a table of which knobs move which metrics; a knob that moves
nothing gets deleted.

**One joint score**: each tuning round also reports a single number, the share of bands passed weighted by
importance (survival and society ×2), so two tunings can be compared at a glance. It never replaces reading the
individual bands.

## Playtests

Bots are not people. Each phase gate also has a playtest: at least **12 people, 3 sessions each** (a mix of solo,
pairs and threes, at least a third on phones), with a short form: did you die fairly, did you change something, did
you want to come back, how long did you spend walking.

## Live telemetry (later)

Once people play, the same metrics come from real worlds through `@lawn/profiler`-style anonymous uploads, so we can
check the simulator against reality and recalibrate the bot players.

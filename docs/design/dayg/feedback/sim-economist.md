# Review: Simulation and economy fan

I have spent years on Dwarf Fortress, RimWorld, EVE's market wars, Mount & Blade's faction politics and Kenshi, and I judge a design by whether its agents keep producing different stories instead of one winner. I read all sixteen files and checked the arithmetic where the numbers allow it.

## User stories

1. **As a designer, I want a per-tick stock-and-flow ledger by resource, source and sink, so that I can see where every unit came from and where it went.**
   Acceptance: residual is 0 every tick on all 200 seeds; the ledger reconciles to the scorecard's flow totals.
   Design today: Partly (`economy.md`: conservation stated, but no per-resource ledger output and acorns are not tracked as money).

2. **As a designer, I want prices that keep rising as stock falls before they reach the cap, so that scarcity shows up as a signal.**
   Acceptance: under 5% of essential market-days sit at the 8x clamp in a median world.
   Design today: Partly (`economy.md`: clamp at [0.2, 8] x base, with no test of how often the cap binds).

3. **As a trader, I want the Verge gates to respond to what I sell there, so that my relics change what comes in.**
   Acceptance: after a season of relic sales, arrivals rise at least 30% against a control seed.
   Design today: Missing (`economy.md`: arrivals follow a seeded calendar scaled only by gate safety).

4. **As a designer, I want acorn money supply and velocity tracked, so that I can see deflation when acorns are hoarded or eaten.**
   Acceptance: the quantity equation (money x velocity ~ price level x volume) holds within 15% on 90% of seeds.
   Design today: Missing (`economy.md`: acorns are money and food, with no money metric).

5. **As a faction player, I want a stockpile find to help but not crown a faction, so that one cache cannot end the game.**
   Acceptance: a 10x change in stockpile days moves a faction's power by at most 2x.
   Design today: Partly (`society.md`: the stockpile term is linear and unbounded).

6. **As a designer, I want the sweeps to run the same society model the NPCs run, so that the society bands measure real behaviour.**
   Acceptance: mode shares and group sizes match per-NPC runs within 10% on 50 paired seeds.
   Design today: Missing (`simulation-lod.md` and `evaluation.md`: NPC decisions run at L1, but the sweeps run at L2).

7. **As a designer, I want groups to join and split with hysteresis, so that they do not churn every tick.**
   Acceptance: median group tenure is at least 10 game-days; join and leave thresholds are separated by a margin.
   Design today: Partly (`society.md`: the ceiling and fission are described in words, with no functional form).

8. **As a designer, I want the Hatless count to have a real sink, so that a long world does not ratchet upward.**
   Acceptance: no rise over 60 days without a named Fall or Drift, in 80% of seeds.
   Design today: Partly (`hatless.md`: fire and cracks destroy Hatless; nothing else removes them).

9. **As a designer, I want tuning and final checks on separate seeds, so that the bands are not overfitted.**
   Acceptance: tune on seeds 0-199, then pass on 200 unseen seeds with pass rates within 5% of the tuning run.
   Design today: Missing (`evaluation.md`: golden seeds serve as both tuning set and test set).

10. **As a player, I want quest rewards to be transfers from the poster's stock, so that quests never print money.**
    Acceptance: conservation holds with quests enabled; reward items leave the poster's ledger.
    Design today: Partly (`quests.md`: rewards come "from what the poster actually has", but scrip and favours sit outside the ledger).

11. **As a player, I want a caravan robbery to cost me something that lasts, so that it is not a one-time jackpot.**
    Acceptance: the robber's standing at that gate lasts at least 30 game-days, and one robbery's take is at most 2x the expected trade income over the same period.
    Design today: Partly (`economy.md`: "very profitable once", with the cost paid by the gate rather than the robber).

## What works

- The stock-and-flow rule in `economy.md` is the right base: no item appears from nothing.
- Non-renewing loot with renewables kept below need (`loot.md`) gives the society model a reason to exist.
- The balance order in `economy.md` (budget, self-sufficiency, release valve, price checks, shocks, common random numbers) is right.
- Quests as unmet needs in the simulation (`quests.md`) and founders pushed to trait extremes (`society.md`) get variety from few rules.

## Concerns and gaps

1. **The society model does not run at the level the sweeps use.** `society.md` puts per-NPC utility, trust and rumour on the L1 tick, and `simulation-lod.md` runs L1 only near players. The 200-seed sweeps run at L2, where no rule for groups, trust or factions is written down, so the group bands measure a model the doc never specifies. The day-60 metric also has three mode buckets where the doc defines five (bands of 9-25 fit none). Suggest: write the L2 society rules as equations (group equilibrium, fission rate, plan rates) and add the paired test in story 6.
2. **The outside-trader loop is a monopoly engine.** Safe gate, more caravans, more imports, more power, more guards, safer gate. No damping is stated and no metric measures gate concentration. Suggest: a gate HHI over import volume (at most 0.5 in 80% of seeds), arrivals that spill to other gates when one is crowded, and guard costs that rise the longer one faction holds a gate.
3. **Relics are a finite reserve with no price.** The ~600 T4 budget is the only exchange rate, and the Crypt Holders' Hill is its main source. A player can sell 10 relics (the "Relic Runner" achievement) and drain a sixth of the world's foreign exchange. The 5-15% trader share is measured only at day 60. Suggest: publish a relic price in acorns, add a day-120 trade-share band (at least 2%), and track the reserve over time.
4. **The power formula compounds.** Territory feeds foraging, foraging feeds stockpile, stockpile feeds power, and power claims territory. The linear `(1 + days/30)` term lets one cache crown a faction. `reputation` is undefined, and `quests.md` defines standing as -100..+100, which would flip the product's sign. Suggest: a saturating term (`1 + ln(1 + days/30)`) and a 0..1 reputation multiplier.
5. **The HHI band contradicts the faction range.** For 9 equal factions, HHI = 0.111, below the 0.12 floor, so a valid 9-faction world fails. Suggest: normalised HHI, (HHI - 1/n) / (1 - 1/n), with a band of 0-0.4.
6. **The food and fuel budgets do not match their own formulas** (see Economy and balance). The "55 days of slack" delivers about 37 days at full population. The fuel stock runs out in the fourth winter, if a year has four seasons (not stated). Suggest: model population decline inside the budget and print a per-season balance sheet.
7. **Acorns are a hidden money supply.** They are currency, food and a value floor at once, and there is no money metric and no reserve rule for scrip. Suggest: track money, velocity and price level; require scrip to hold a stated reserve ratio; add a "dying faction prints scrip and buys out a market" test.
8. **Hatless are a ratchet.** They do not eat or starve, and nothing removes them except fire and destruction, so every shattering only adds. Suggest: a per-season natural decline (cold, rot) or a carrying capacity per region.
9. **The tick arithmetic is off by 60x.** `simulation-lod.md` says one game-hour is about 2.5 real seconds. With one game-day = 60 real minutes, a game-hour is 2.5 real minutes. The "surge toward gunfire over minutes" claim then belongs to L1, not L2. Fix the figure and say which tier handles each timescale.
10. **Several bands do not test what they say.** "KS p > 0.01" is a failure-to-reject test, not evidence of equivalence; use TOST with a margin. "Negative price-stock correlation" holds by construction; test price response to an exogenous shock. A daily log-price sd of 0.05-0.25 means 5-25% moves a day; 0.02-0.10 was probably meant. Consequence reach at 5% is met by almost any quest; use a rank change or a haven changing hands. Counterfactual divergence needs a null perturbation too.

## Economy and balance

The method is sound in shape, but each part is tuned on its own and no check ties the parts together.

**Food check (`loot.md`).** `1,200 x 55 x 0.65 = 42,900` meals, not the 45,000 printed. At 1,200 a day, 45,000 meals is 37.5 days of full-population food with no renewables, so the formula does not deliver 55 days of slack. With only foraging (15-25%) running by day 20, the day-20 band of 60-80% left needs the population to fall about 15% by then. That decline is not modelled, so the formula and the bands agree only by accident.

**Fuel check.** 9,000 fire-nights at about 400 a day is 22.5 winter-days. Winters are 7 days, so the stock covers about three winters. A 120-day run is about four winters if a year is four seasons, so fuel runs out in the last one. That may be intended, but it should be a stated number.

**Missing failure modes.** (a) Deflation from acorn hoarding by high-greed NPCs. (b) Gate monopoly. (c) Relic exhaustion late in a run, which the day-60 metric cannot see. (d) A raid-only equilibrium: raiding pays better in the Squeeze and the raid rule has no retaliation or lost-trade term. (e) Allee collapse in packs below three. (f) The scrip rug-pull. (g) Haven taxes at the 20% cap with no elasticity bound.

**Extra metrics.** (1) Quantity-equation residual. (2) Gate HHI over import volume. (3) Relic reserve curve and day-120 trade share. (4) Raid-to-trade income ratio by faction type. (5) Share of acorn wealth held by the top 5%.

**Knobs and tests to add.** Split the RNG into named streams per system, so a market change does not reshuffle the Hatless; this is what makes common random numbers survive a rule change. Keep a holdout seed set. Use TOST for the LOD test. Extend conservation to acorns and scrip. Run a baseline with the trader calendar removed, to see whether the world survives without the import crutch.

## Scores

- **Economy model: 3.** Conservation is well defined; money, traders and relics have no closed exchange rate.
- **Balance method: 3.** Right order, but no holdout set and no joint objective.
- **Society model: 3.** Rich traits and norms, but no equations, and not at the sweeps' tier.
- **Faction dynamics: 3.** Good plan list; the power formula compounds without damping.
- **Horde model: 4.** Sound advection and diffusion; the missing sink is the gap.
- **Quests from state: 4.** Strongest part; reward minting needs fixing.
- **Metrics and bands: 2.** Wide coverage, but several bands are wrong or true by construction.
- **Risk of degenerate outcomes: 2 (5 = low risk).** Gate monopoly, relic drain, Hatless ratchet and raid-only dominance lack damping.

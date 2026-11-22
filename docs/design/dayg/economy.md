# Economy: stocks, flows, prices and how it is balanced

## The one rule: everything is a real thing

No vendor has endless stock and no item appears from nothing. Every item is in a container, on a gnome, on the ground,
in a trader's pack, or in a zone's **unrolled stock** (the L2 form of "loot nobody has looked at yet"). The economy is a
**stock-and-flow model**: every unit that enters or leaves is counted, and the counts must balance every tick (a test
checks it).

### Inflows (sources)

| Source | Renews? | Size | Knob |
|---|---|---|---|
| Unopened loot ([loot.md](loot.md)) | **no** | the authored budget; most of the world's wealth | the budget per resource, per tier |
| Sealed crypts | no | a few rich T3–T4 sites | how many are sealed (seed range) |
| Foraging | yes, per zone per season | small; over-foraging lowers next season's yield | regrowth rate, the over-foraging penalty |
| Gardens and farms | yes, needs labour, seeds, water, safety | grows with settled safety | yield per bed, growth time, frost loss |
| Fishing and trapping | yes, from a stock per zone that can be emptied | small | stock size, breeding rate |
| **Outside traders** | yes, on a calendar | the world's controlled top-up | arrivals per season, cargo size, what they want |
| Visitation | yes, tiny | under 2% of food | graves per night |

### Outflows (sinks)

Eating, drinking, burning, wear (tool and armour condition), spoilage, rot from wet, Hatless shattering items in
fights, **outside traders taking goods away** (relics, crafts), and loss: items dropped where nobody looks and caches
whose owners shattered.

### Conversions

Crafting turns items into other items (timber → planks), always with some loss, so crafting is a sink too.

## The macro arc

Because loot runs out and production needs safety and labour, every world follows a broad arc:

1. **Scavenge** (days 0–20): loot everywhere, lone wolves do well, prices low.
2. **Squeeze** (20–50): easy loot gone, prices up, raiding pays better than looting, factions form around food,
   water and gates.
3. **Settle** (50+): gardens and workshops, havens trade specialties, caravans run, wars over farmland and gates.
4. **Shocks** (a Fall, a Drift, the Mowing, a hard winter) push a region back to Squeeze.

## Markets

Every haven and settlement with a store runs a **local market**. NPC traders, outside traders and players buy and sell
there.

- **Need** is a tag query with a target: "MEDICINE: 20 doses, FOOD: 30 days for all members, FUEL: 10 nights".
- **Price** of a tag group: `p = base × (target / (stock + ε))^e`, clamped to [0.2, 8] × base. `e` (elasticity,
  0.6–1.2) is higher for essentials. One item's price = its tag group price × its quality (condition, size).
- **Memory**: a market drifts back toward its target-based price over about a day, so dumping 40 berries crashes that
  market briefly, not forever.
- **Spread**: buy price is above sell price by a haven's tax (5–20%, set by its norms). That spread is the haven's
  income.
- **Local knowledge**: a gnome only knows prices they've seen or heard by rumour, with an age. A trader's job (NPC or
  player) is knowing a price someone else doesn't.

## Trade and caravans

- An NPC trader (high greed, low paranoia, some boldness) plans a route when
  `expected profit − route risk × cargo value > threshold`. Route risk comes from known herds and raider territory.
- Factions with a surplus run **caravans** (porters, guards, a `wooden-cart` or `wheelbarrow`). On the L2 map they
  are tokens on the region graph; near players they are real gnomes with real cargo.
- Caravans are the economy's blood and its weak point: raiders target them, so caravans need guards, so guarding pays,
  so it becomes a quest.
- **Tolls**: a faction that holds a `TOLL` zone (the Footbridge, Yew Edge, the Rose Gate) charges passage.

## Outside traders

The one big controlled inflow. **Verge traders** come from outside the Railings (where from exactly is a loose thread:
"other gardens, past the road").

| Gate | Where | Trader kind | Brings | Wants |
|---|---|---|---|---|
| The Lychgate | main gate, south | **Kerbside caravans**: 4–10 gnomes with a cart, once or twice a season | salt, seeds, medicine, ammo, cloth, tools | relics (T4), glazed work, flowers, fish |
| The Back Gate | the Shed's service gate | **Heavy haulers**: rare, big loads | iron, fuel, building parts | relics, a lot of them |
| The Drain Mouth | under the pond | **Smugglers**: 1–3 gnomes, any time, in secret | rare weapons, ammo, the `double-shotgun`, odd things | relics, information (maps), people |
| The Hedge Gap | south-west hedge | **Pedlars**: a lone gnome with a pack | small goods, news from outside | food, anything |

- **When they come**: each gate has a seeded calendar of arrivals, **scaled by how safe the gate is**. A trader weighs
  the Hatless and raider risk near the gate (from rumour). Safe gate → more and bigger caravans. Raided gate →
  traders stop coming for a season. This is a feedback loop: whoever keeps the gates safe gets the imports, and gate
  control becomes the most valuable power in the world.
- **What they pay with** is their cargo; what they take away are relics and crafts. Relics have almost no use inside
  the world, so their T4 budget (~600) is effectively the world's **foreign-exchange reserve**: when the relics are
  gone, trade switches to crafts (glazed work, fish, flowers), which need a working settlement to make.
- **Damping the gate loop**, so one faction can't own the imports for good:
  - Traders **spread out**: when one gate is busy, or one faction holds it and sets a toll, the next arrivals pick the
    other gates more often.
  - Traders **dislike a single landlord**: a faction that has held a gate for more than a season pays them more
    (traders raise prices to it by 10% per extra season).
  - Holding a gate gets **costlier** the longer it's held: the herds learn the smell of the trade camps (more Hatless
    drawn there each season), and rivals get a plan bonus against the holder.
  - The evaluation measures gate concentration (HHI over import volume per faction).
- **Relics have a price**: traders publish a relic price in acorns that **rises as the world's relic reserve
  falls** (`price = 40 acorns × (600 / relicsLeft)^0.5`: 40 acorns at the start, 80 with a quarter left, about 170 for one of
  the last 20), so the last relics are worth a lot. Each caravan visit also posts **3 commissions**: a list of crafts they want (glazed charms, smoked fish, rose water, rope), so once the
  relics are gone, trade carries on with what a working settlement makes. A solo player can fill commissions too.
- **They are not invincible**: traders fight back, hire guards (a quest), and remember who robbed them. Robbing a
  caravan is very profitable once and costs the gate's traffic for a season.
- **The trader market**: when a caravan camps (usually at the Lychgate Waystation), it runs its own market with its
  own prices, set by what it brought and what it has seen sold.

## Money

- **Acorns** are the currency (core fact 5). They are also food (acorn flour), so their value never drops below their
  calorie value: barter and money stay tied together.
- A big settlement can issue **scrip** (a stamped `letter-of-passage` or a `ledger` entry): a promise redeemable at its
  store. Scrip is worth the faction's trust and power. Issuing too much raises prices in that market (inflation); if the
  faction falls, its scrip is worth nothing.
- Outside traders take acorns and relics, never scrip.
- `gold-coins` and `tall-eye-shard` are stores of value leaders use for alliances and tribute.

## Labour and wages

Members work a role (forager, farmer, guard, builder, glazer, trader, lookout). Output per role depends on skill, tool
quality and safety. Short of guards, a settlement loses more to raids; short of farmers, it starves in winter. **Hiring**
an NPC is a contract (term, pay) on the trust ledger: an underpaid guard walks away, or switches sides.

## How it is balanced

The economy is tuned in the headless simulator ([evaluation.md](evaluation.md)), never by feel alone. The method:

### 1. Set the budget from the population, with decline built in

Days are world-days ([world.md](world.md#time-two-clocks)); 1 meal feeds one gnome for one world-day.

```
authored food budget (whole map)       ≈ 70,000 meals
left untouched at the start (≈ 65%)    ≈ 45,500 meals
days of slack at the start population  = 45,500 / 1,200 ≈ 38 days   (no renewables, nobody dies)
```

`days_of_slack` is the main pacing knob: it sets when the Squeeze starts. But the population isn't constant, and
renewables grow, so the budget is checked against a **balance sheet** with the expected decline (the sim prints this per
seed; these are the design targets):

| Period (world-days) | Avg population | Need | Renewables share | From loot | Loot left after |
|---|---|---|---|---|---|
| 0–20 (Scavenge) | 1,100 | 22,000 | 20% | 17,600 | 27,900 (61%) |
| 20–50 (Squeeze) | 900 | 27,000 | 35% | 17,550 | 10,350 (23%) |
| 50–80 (Settle) | 700 | 21,000 | 60% | 8,400 | 1,950 (4%) |
| 80–120 | 600 | 24,000 | 80%+ | ≤ 1,950 | ~0 |

So **the loot is nearly gone by day 80, on purpose**: from then on the world lives on what it grows, catches and
imports. A world with a slower decline runs out sooner and gets hungrier: that's the pressure, and the bands in
[evaluation.md](evaluation.md#economy) check it lands in range.

**Fuel** the same way: a year is 4 seasons (28 world-days), so a Chronicle has 4 winters. Fuel need is about 400
fire-nights per winter world-day at the start population, ~80 in other seasons. Twigs (renewable) cover about half.
The ~9,000 fire-nights of loot fuel (Black Dew, timber, candles) cover the rest **through the third winter**; the
fourth winter is a planned fuel crisis ("the Cold Year" in the chronicle) unless the world has built up wood stores or
trades for fuel at the Back Gate.

Every other budget (medicine, ammo, tools) gets the same balance sheet.

### 2. Cap renewables below need

At day 60, renewables (foraging + farms + fishing + traders + Visitation) should feed **60–85% of the population that is
alive then**, and **30–50% of the starting population** (so a world doesn't pass just by having shrunk). Under 60%: the world empties out. Over 85%: no pressure, nothing to fight over. The sim measures the
**self-sufficiency ratio** (renewable meals per day ÷ meals needed per day) and the knobs above move it.

### 3. Tune trader inflow as the release valve

Trader cargo is the knob with the fastest effect and the clearest story ("the caravans stopped coming"). Target:
traders supply 5–15% of essentials at day 60 when the gates are safe, under 5% when they're not.

### 4. Check that price signals work

- Every essential tag group trades every day somewhere (no dead markets).
- **Shock response**: when a stock is knocked down from outside (a raid, a fire), the price rises, and falls back as
  stock returns. (A plain price-vs-stock correlation would pass by construction, since the formula makes it so.)
- Arbitrage closes: the price gap between two havens shrinks after a caravan between them arrives.
- Volatility (daily log-price change, standard deviation) stays in **0.02–0.10**: enough to make trading interesting,
  little enough that a player can plan a trip.

### 5. Watch wealth and power

- Gini of NPC net worth in a band (0.35–0.65): some rich factions, no single owner of everything.
- The top faction's share of all stock under 50% in 90% of worlds.
- Scrip inflation: under 5% per season unless a faction is failing.
- **Money**: track the acorn supply (in hands, in stores, eaten), how fast it changes hands (velocity), and a price
  level (an index over essentials). The quantity check `M × V ≈ P × T` should hold within 20%; a big gap means acorns
  are being hoarded (deflation) or minted somewhere by a bug. Track the share of acorns held by the top 5% of gnomes.
- **Scrip reserve**: a faction may issue scrip up to 2× the acorn and food value in its store. Past that, its
  traders discount it; a failing faction that prints scrip to buy out a market is a scenario test.

### 6. Stress-test with shocks

Each sweep runs worlds with forced shocks (a gate raided for a season, a Fall of the biggest haven, a hard winter, the
Mowing on the farmland) and checks recovery: how many days until prices are back in band, and that the world doesn't go
extinct.

Two baselines run with every sweep: **no outside traders at all** (does the world survive without the import valve?)
and **no player bots** (the world's own story).

### 7. Common random numbers, split streams, holdout seeds

- When comparing two tunings, both run the same 200 seeds, so the differences come from the tuning and not luck.
- The RNG is split into **named streams per system** (weather, loot, hordes, NPC decisions, markets, traders), so
  changing a market rule doesn't reshuffle the Hatless. This is what keeps common random numbers meaningful after a
  rule change.
- A **holdout set** of 100 seeds is never used while tuning; each phase gate checks the bands on it too, so we don't
  over-fit the 200.

## What gets measured

All in [evaluation.md](evaluation.md#economy): stock and flow by source and sink over time, self-sufficiency ratio,
trader share, price volatility per tag group, dead markets, arbitrage gap, Gini, top-faction share, scrip inflation,
time to recover from shocks, loot depletion curve (share of the authored budget left by day).

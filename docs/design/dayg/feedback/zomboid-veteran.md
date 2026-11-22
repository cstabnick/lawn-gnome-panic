# Review: Project Zomboid veteran

I have about 1,500 hours across vanilla and modded PZ servers, mostly long-run base-heavy ones. I judge a survival game by whether my 200th hour of crafting still makes me decide things, and whether its numbers make a second year reachable.

## User stories

1. **As a solo survivor, I want any tagged item to become a useful action (rope from fibre, spear from a stick and a blade), so that what I find matters without memorising recipes.**
   Acceptance: every item in items.md has at least one recipe or action; a tag-query recipe resolves for any valid input in a test.
   Design today: Partly (items.md, tag model; only one recipe example, Plank).

2. **As a builder, I want a barricade with a stated plank count and visible HP, so that I know how long I can hold a door.**
   Acceptance: HP shown per piece; a 2-plank barricade's hold time against N Hatless is published from the sim.
   Design today: Partly (items.md, Building: "pieces have health", no numbers).

3. **As a builder, I want locks that are items I can lose, copy or pick, so that security is physical.**
   Acceptance: every locked door opens by key or PRY in a test; a lost key is replaceable by a recipe.
   Design today: Partly (items.md: keys for containers only).

4. **As a crafter, I want skill to change craft speed and failure rate, so that practice pays.**
   Acceptance: craft time at skill 0 is at least 1.5x skill 5; failure rates are logged in the sim.
   Design today: Partly (survival.md, Skills: a list, no curve).

5. **As a bitten player, I want to see my infection stage and timer, so that I can act while I still can.**
   Acceptance: three visible stages with a game-hour timer; scrape success measured across seeds.
   Design today: Partly (survival.md, body: "within hours", "late on, nothing works").

6. **As a player in the open, I want my odds of catching moss from a scratch, so that I can decide whether to fight.**
   Acceptance: per-hit chance is a stated function of crack state and warmth, shown in the in-game health panel.
   Design today: Missing.

7. **As a long-run player, I want to reach day 100 on a farm I built, so that the arc is about my choices.**
   Acceptance: a builder bot with a garden reaches day 100 in at least 20% of seeds.
   Design today: Missing (evaluation.md bots survive 2–6 h only).

8. **As a farmer, I want yield per bed per crop per season, so that I can plan winter food.**
   Acceptance: a yield table exists; a player farm covers 60% of a 4-person group's food in season 2.
   Design today: Missing (economy.md names "yield per bed" as a knob, no values).

9. **As a player who just died, I want a death recap of the chain of causes, so that I learn from it.**
   Acceptance: the recap lists the last 10 relevant events of that gnome; 90% of playtest deaths get a readable chain.
   Design today: Partly (history.md chronicle is world-level only).

10. **As an owner of gear, I want to repair tools and armour with glue, thread and planks, so that my kit lasts a year.**
    Acceptance: each tool has a repair recipe; wear per use is published.
    Design today: Partly (glaze and glue cover the body, not tools).

11. **As a builder, I want each base piece's materials, build time and function listed, so that I can plan.**
    Acceptance: 100% of base pieces in items.md have all three.
    Design today: Missing.

12. **As a winter planner, I want a fuel forecast for the next cold season, so that I can stockpile before it.**
    Acceptance: the forecast shows fire-nights needed over the next 7 game-days, within 20%.
    Design today: Missing (loot.md: "the winter decides").

13. **As a trader, I want each gate's next caravan date, so that I can plan a run.**
    Acceptance: the next arrival is known to within 1 game-day at each gate.
    Design today: Partly (economy.md: seeded calendar, not shown to the player).

## What works

- **items.md, tags and Improvising.** "A ruler-stick can PRY at half speed and breaks easily" is exactly the Zomboid feeling. One data row per item is the right way to scale it.
- **survival.md, Survivalist systems.** Noise, light, smoke and scent on every action make each fire a decision, not a button.
- **economy.md, Money.** Acorns are money and food with a calorie floor, so barter and calories stay tied together.
- **hatless.md, Growth.** No spawning from nothing; piles against walls are a real trade-off with a noise cost.
- **survival.md, Lineage.** Skills passing to a new gnome after death let knowledge outlive you. Best long-game hook in the set.

## Concerns and gaps (most important first)

1. **Crafting has one example.** items.md has a single recipe. Veteran play lives on dozens of chains. Write a recipe table of at least 60 entries (tag inputs, tool tag, skill, time, failure chance) before Phase 3. Metric: every tag used in at least 2 recipes.
2. **Infection has no numbers.** survival.md says the rate depends on "warmth and wetness" and that late on "nothing works". Publish a model: a per-hit chance, a clock in game-hours (for example 6 warm, 12 cold), three visible stages (dull glaze, moss sheen, grey hat-line), and a scrape check against Glazing or Medicine skill.
3. **Skills have no curve.** Give XP per action with diminishing returns, and a stated effect at levels 0, 3, 6 and 9 (craft speed, failure chance, aim spread). Keep "Leadership grows only while leading".
4. **Building has no payoff numbers.** Barricade = 1 to 4 planks, HP per plank, a Hatless push threshold from the pile model (0.6 gm per body, hatless.md). Locks by item on doors, not only containers. Wood decays in rain, so a base needs upkeep. That upkeep is the year-two loop.
5. **Tools have no repair loop.** economy.md says tools last about 90 days. Glue, thread and plank patches make the 2,400-tool budget a choice instead of a clock.
6. **Farming is not a player system yet.** Gardens are named in economy.md and survival.md, but a player bed needs yields by crop and season, seed saving from harvest, and frost loss.
7. **No personal day-100 arc.** The macro arc (regions.md, history.md) is for the world. Give the player checkpoints: winter one (fuel, warmth), spring (the Bloom, moss), year two (a farm feeding four).
8. **Death recap.** The chronicle is world-level. A per-gnome event log shown on death ("bitten at the Forecourt, scrape failed at hour 4, shattered in the Warm Bays") is the "this is how you died" feeling, and costs little if the log exists for the sim.
9. **Bot survival targets are too short.** One game-day is 60 real minutes (world.md), so "solo 2–6 h" is 2–6 game-days. Add a builder bot that reaches day 60 in at least 40% of seeds and day 100 in at least 20%.
10. **Medicine and fuel run out before the long game.** Medicine lasts about 58 days with no renewal beyond petals; fuel's winter is undefined. Add a fuel forecast and a medicine renewal target.

## Economy and balance

The shape is right: non-renewing loot, then farms, then traders as a valve. The numbers do not yet agree:

- economy.md's formula gives 1,200 × 55 × 0.65 = 42,900, not "≈ 45,000". loot.md says the food budget lasts about 37 days with no other source, while economy.md assumes 55 days of slack. Pick one definition before tuning.
- A farming player is not in any world metric. The self-sufficiency ratio (economy.md, step 2) counts renewables for the population, so a player who farms well is invisible to the targets. Add a separate "player-farm share of own food" metric.
- **Knob to add:** relic budget per gate per season. Relics are the world's foreign-exchange reserve (economy.md), so the knob is how many relics arrive each season and at what price. **Metric:** world relic stock at day 60 and 100.
- **Knob to add:** share of food eaten that was preserved (salted, dried, pickled), with a target band by day 60. Preservation is the veteran's main early skill; if no one needs it, the system is decoration.
- **Metric to add:** fraction of builder, farmer and scavenger bots alive at days 30, 60 and 100. This tests whether each play style can reach year two.
- **Metric to add:** days of fuel cover at the coldest week, for a builder bot. Target at least 14.

## Scores

- **Item model: 4.** Tags and improvisation are right; needs a real recipe table.
- **Crafting and building: 2.** One recipe and no building numbers.
- **Infection and body: 3.** Strong dread design, no numbers or visible stages.
- **Skills: 2.** A list with no curve.
- **Long-term goals: 2.** World arc only; no personal year-two path.
- **Economy: 4.** Stock-and-flow with conservation is serious; the arithmetic needs fixing.
- **Hordes: 4.** The field model and the no-spawn rule are strong.
- **NPC societies: 4.** Lineage and norms give a reason to stay put.
- **Measurement plan: 3.** Thorough for the world, blind to the player's own base and farm.

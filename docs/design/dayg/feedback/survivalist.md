# Review: Survivalist

I am a bushcraft hobbyist who runs a bug-out kit for my family and teaches fire and water courses, and I play survival games critically. I read all sixteen DayG documents against what actually kills people in a collapse: thirst, cold, bad company and bad signature.

## User stories

1. **As a solo newcomer, I want a water chain I can run (find, carry, boil or filter), so that thirst does not end my run in the first afternoon.**
   Acceptance: untreated pond water causes Grit in at least 60% of drinks; boiling needs a vessel, fuel and a stated time.
   Design today: Partly (`survival.md` "Water chain"; boil recipe and `water-filter` not specified in `items.md`).

2. **As a bushcraft player, I want to light a fire from tinder, kindling and a striker in wind and rain, so that fire craft is a skill and not a click.**
   Acceptance: wet tinder in rain fails at least 80% of the time without cover; a sheltered lay raises success.
   Design today: Missing (`items.md` has `flint-striker` to add; no TINDER tag or fire-lay).

3. **As a careful cook, I want smoke to drift with the wind and rise differently at dawn, so that where and when I cook decides who sees it.**
   Acceptance: a fire in a downwind ditch halves its detection range; dawn inversion keeps smoke low.
   Design today: Partly (`survival.md` "Signature" gives values; no wind or inversion model).

4. **As a player with a bitten gnome, I want to see how long before moss passes the point of no return, so that I decide to scrape or lose them.**
   Acceptance: the UI shows a stage and hours left; a scrape inside the window succeeds at least 90% of the time.
   Design today: Partly (`survival.md` "The gnome body": "within hours", no readable clock).

5. **As a player who buries a cache, I want to find it again from my own notes (landmark, paces, bearing), so that caches work without a map marker.**
   Acceptance: a bearing and pace count leads to the cache within 5 gm; notes drift with time.
   Design today: Partly (`survival.md` "Caches" and "Navigation"; no cache log).

6. **As a prudent player, I want a decoy cache that draws trackers away, so that my real stash stays hidden.**
   Acceptance: NPC trackers dig up a bait cache at least 60% more often than a real one.
   Design today: Missing.

7. **As a group leader, I want a watch rota, a rally point and an agreed signal set, so that a scattered group regroups and survives the night.**
   Acceptance: at least 90% of survivors reach the rally point within 10 minutes of a scatter.
   Design today: Partly (`survival.md` "Watches"; no player rally point or signals).

8. **As a group leader, I want injured and dependent members to slow the group and force a choice, so that group survival is a trade-off, not a headcount.**
   Acceptance: a group carrying an injured member survives less often; leaving them costs trust that spreads by rumour.
   Design today: Partly (`society.md` "Why gnomes group up"; no dependants or "going back for family" trigger).

9. **As a navigator, I want to use the rows as handrails and count paces, so that I can cross the cemetery without a map.**
   Acceptance: pace count plus bearing reaches a named landmark within 10% of the distance, in daylight and fog.
   Design today: Partly (`survival.md` "Navigation": compass and paper map only).

10. **As a player who wants a winter reserve, I want my food and currency to keep, so that saving is worth doing.**
    Acceptance: dried acorns lose under 5% per season; raw acorns must be leached before they count.
    Design today: Partly (`economy.md` "Money"; spoilage and leaching not modelled).

11. **As a player in the wet, I want to see how soaked clothes change my core temperature, so that I plan warmth before I am in trouble.**
    Acceptance: wet clothes cut warmth regeneration by at least half; cold has staged symptoms with a recovery route.
    Design today: Partly (`survival.md` "Needs": warmth falls with wet and cold, no stages).

## What works

- **Signature as the core loop** (`survival.md`, "Survivalist systems"): noise, light, smoke and scent on every action, with fire as the central trade-off, is the right backbone for a stealth survival game.
- **Groups pay costs as well as gains** (`society.md`, "Why gnomes group up"): watches and fighters against bigger signatures, mouths and sharing costs is how real groups behave.
- **Non-renewing loot with a release valve** (`economy.md`, "How it is balanced"): the world empties and traders and foraging set the pace.
- **Stupid-death metric** (`evaluation.md`, "Survival and population"): deaths from walking into known herds or starving with food in reach is exactly the test a survivalist wants.

## Concerns and gaps

1. **The rule-of-threes times do not fit the clock.** `survival.md` gives 3 hours without warmth in a storm, but a game-day is 60 real minutes (`world.md`, "Time"), so that is 7.5 real minutes. Water (3 days, about 3 real hours) and food (3 weeks, about 21 real hours) are sane; warmth is not.
2. **Fire is a list item, not a chain.** Add a TINDER tag, a fire-lay (tinder, kindling, fuel), a success roll against wind and rain, and a wet-fuel penalty. This is where the signature trade-off gets its feel.
3. **Signature has no wind.** Smoke and scent are values with no direction. Add a per-district wind vector that carries both downwind, a dawn inversion that keeps smoke low, and scent shadows behind hills. Hatless already sense scent, so this is cheap to connect.
4. **Nutrition is one number.** Add 2–3 food families and a malaise penalty for monotony, which is how starvation with food in hand really shows up. Also fix the arithmetic: 1,200 × 55 × 0.65 is about 42,900, not "≈ 45,000".
5. **Infection is a single gate.** Real wound care is clean, dress, rest, and watch for three to seven days. Give the bitten a staged timeline the player can read and nurse, with the Infirmary doing it best.
6. **Caches and OPSEC have no counter-play.** Add drifting bearing notes, decoy caches that trackers dig up, and a day-long visibility window on fresh earth that only someone who saw the dig can read.
7. **Players get no group survival tools.** Only NPC groups get watches. Give players a rota (lost sleep feeds the Rest need), a rally point, and two or three agreed signals (horn, lantern, fire count).
8. **The grey man cannot disguise himself.** Let changing hat, coat and gear change how NPCs read you within a day, and let shared colours or armbands mark a group to outsiders, an OPSEC cost the design can use.
9. **Groups need dependants.** Real groups fail over the injured, the old and the child who slows the walk, and over "going back for family". Add that trigger to `society.md` fission, with trust costs that spread by rumour.
10. **The first money is missing.** Real first currencies were ammo, salt, medicine, batteries and fuel, valued because they were durable and recognised. Keep acorns, but let salt and medicine be first-trade goods, as `economy.md` already implies.

## Economy and balance

The arc (scavenge, squeeze, settle, shocks) and the stock-and-flow accounting are realistic, and gate-based traders model how a collapse economy depends on outside supply. Three problems:

- **Self-sufficiency is measured against living people.** The ratio uses meals needed by the population *alive then*, so a world that shrinks by half passes the 0.60–0.85 band without any growth. Measure it against the start population too.
- **The price-volatility band is too wide.** A daily log-change standard deviation of 0.25 means prices move about a quarter a day, which contradicts the design's own "low enough that the player can plan". I would use 0.02–0.08.
- **Relics as the foreign-exchange reserve is a stretch.** Real outside traders want what is useful to them: labour, skills, news, a doctor, a licence to settle. Relics leave the trade economy resting on a non-renewing stock with no survival use.

Extra metrics and knobs:
- **EROI per source per season**: meals produced per labour-hour for foraging, gardens and fishing. Settlements starve when gardens cost more than they return.
- **Spoilage-adjusted food reaching mouths**: nominal stock is not food.
- **Cache survival at day 30 and bait-cache hit rate**: tests whether OPSEC is a real choice.

## Scores

- **Needs and body: 3.** Sound needs, but warmth timing is off, nutrition is one number and there are no cold stages.
- **Survivalist depth: 3.** Signature, caches and the rule of threes are real. Fire, water, navigation and medicine are named but not built as chains.
- **Signature and stealth: 4.** Strong core, close to field reality. Needs wind and inversion.
- **Group survival: 3.** Good NPC group theory with norms and fission; players get no rota, rally point or dependants.
- **NPC realism: 3.** The trust ledger and norms are plausible; kin, food disputes and sickness are only partly covered.
- **Economy realism: 3.** Good stock-and-flow model, but measured against the wrong population, a volatility band that is too wide and no first money.
- **Measurement plan: 4.** Headless sim, stupid-death metric, shocks and common random numbers. Add EROI, spoilage and cache survival.

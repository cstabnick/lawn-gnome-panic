# Response to the persona reviews

Five reviewers (Haiku agents, each playing a kind of player) read the first draft and wrote user stories, concerns and
scores. Their files are next to this one. This is what we changed, and what we left open.

## Changed

| Concern | Raised by | Change | Where |
|---|---|---|---|
| One 60-minute game-day burns a 24/7 public world's loot in days | small-group, sim-economist, survivalist | **two clocks**: a 2-hour sun-day for needs and light, an 8-hour world-day for the economy; public worlds run 120-day Chronicles (~40 real days) then start over; private worlds pause when empty | world.md |
| L2 tick off by 60× | sim-economist | L2 ticks every sun-hour (5 real min); which level handles which timescale is stated | simulation-lod.md |
| Map crossing time misstated | small-group | 67 min jogging, 2 h 13 walking; caravan rides, ferries, zip lines, spawning near friends | world.md, multiplayer.md |
| No respawn defined | dayz | respawn at the Waystation, a coast spawn or your haven bed; where-you-fell circle; standing halves; home cache | multiplayer.md |
| Logged-off gnomes are a bunker / combat logging | dayz, small-group | 20 s logout, instant in havens; the gnome leaves the world; 60 s AI hold on pulled plugs | multiplayer.md, simulation-lod.md |
| Griefing for casual groups | small-group | room modes: Full, Haven peace (default), Co-op | multiplayer.md |
| A group's private world dies with one device | small-group | snapshot mirrored to every member's cloud slot; any member can host | multiplayer.md |
| Up is too safe | dayz | Ivybound climbers, moss creeping up, wind and lightning, magpies | hatless.md |
| Hatless only ever grow | sim-economist | crumbling over 2–4 seasons plus a carrying capacity per region | hatless.md |
| Food and fuel arithmetic didn't match the formula | dayz, zomboid, sim-economist | budgets restated (70,000 authored, 45,500 at the start, 38 flat days) with a balance sheet by period that includes the decline; fuel stated through the third winter, the fourth a planned crisis | economy.md, loot.md |
| Trader gate loop is a monopoly engine | sim-economist | traders spread out, overcharge a single landlord, and herds learn the camps; a gate HHI metric | economy.md, evaluation.md |
| Relics are a finite, unpriced reserve | dayz, sim-economist | relic price rises as the reserve falls; seasonal craft commissions; day-120 trade band | economy.md |
| Power formula compounds | sim-economist | saturating stockpile term, 0..1 reputation, upkeep `0.05 × power^1.2`, territory capped by patrol reach | society.md |
| Society has no rules at L2, where the sweeps run | sim-economist | group value, join and leave probabilities, equilibrium size, fission, an Allee effect for pairs, plan rates, rumour spread | society.md |
| Raiding has no lasting cost | sim-economist | retaliation, lost trade, trader blacklist, raiders starve without farms; a raid-to-trade metric | society.md, evaluation.md |
| Acorns are a hidden money supply; scrip has no reserve rule | sim-economist | money supply, velocity, price level, quantity check; scrip capped at 2× reserves; scenario test | economy.md, evaluation.md |
| Bands wrong or true by construction | sim-economist, survivalist | normalised HHI; TOST equivalence; shock response instead of correlation; volatility 0.02–0.10; self-sufficiency against the start population too; consequence reach needs a rank change or handover; null perturbation for the counterfactual | evaluation.md |
| No holdout, no joint objective, CRN breaks on rule changes | sim-economist | 100 holdout seeds, a weighted joint score, named RNG streams per system, a no-traders baseline | evaluation.md, economy.md |
| Crafting and building had no numbers | zomboid | recipe tables by station, building HP, farming yields | crafting.md |
| Infection had no clock or stages | zomboid | four stages with chances and timings, the same table for NPCs | crafting.md |
| No death recap | zomboid | a recap card from the gnome's event log | crafting.md |
| Skills had no curve | zomboid | XP curve, book and teacher multipliers, effects per level | survival.md |
| No player long game | zomboid | long goals: homestead, found a faction, cleanse the Pile, the cure, the Great Crypt, the Compost, Lantern Night | quests.md |
| Fire, water and navigation not built as chains; no wind | survivalist | fire lay with tinder and kindling, boiling and filter numbers, wind carries smoke and scent, pace counting and bearings | crafting.md, survival.md |
| Group security only for NPCs | survivalist | watch rota, rally point, whistle signals, group caches, dependants | survival.md |
| No disguise | survivalist | hat colour as a disguise; going hatless makes NPCs wary | survival.md |
| Player deaths not measured; playtest too small | dayz | bot deaths by cause and "unfair" deaths; playtests of 12 people × 3 sessions, a third on phones | evaluation.md |
| Session fit for casual players | small-group | a 45-minute session metric; the newcomer job board and the Gate Book storylet | evaluation.md, multiplayer.md |

## Left open (decide when we build)

- Whether the headless host for public worlds runs on our cluster or players can run their own.
- Exact relic price base and how many commissions a season.
- Whether Ivybound climbers make the Old Rows too hard for new players (the Lychgate start is next to them).
- The 16 km map is a lot to make by hand; process.md ships districts in order and keeps the option of a smaller
  first Chronicle map.
- Mobile inventory: the reviews want a simpler phone layout; designed in Phase 3 with a real phone in hand.

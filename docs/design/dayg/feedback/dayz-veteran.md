# Review: DayZ veteran

I have about 2,000 hours across Chernarus, Livonia and PvPvE servers, and I judge a game by the walk to the next
building and the first stranger I meet. DayG's documents describe a serious world, but several rules I have seen fail on
real servers are still open.

## User stories

1. **As a returning player, I want a fresh spawn on the coast with nothing, so that a death costs a session, not my
   account.**
   Acceptance: first usable loot within 3 real minutes for 90% of spawns; spawn points vary across the Verge gates.
   Design today: Missing (no respawn rule in survival.md or multiplayer.md).

2. **As a player who died, I want to find my body's gear, so that death is a setback I can undo.**
   Acceptance: a shattered gnome's body and its Hatless are locatable from rumour; 50% recovered within 2 real hours.
   Design today: Partly (loot.md "Death and loot"; no recovery route).

3. **As a solo explorer, I want to see a stranger before they see me, so that I can hide, approach or leave.**
   Acceptance: median first-sight distance of 40 gm or more for a standing player in long grass; sight is symmetric.
   Design today: Partly (survival.md stances; no player visibility rule).

4. **As a map learner, I want landmarks, routes and anchor containers in fixed places, so that I can learn Mossgrave by
   heart.**
   Acceptance: 100% of landmarks and 80% of container anchors keep their position across seeds.
   Design today: Partly (world.md fixes terrain and rolls interiors; the anchor rule is not stated).

5. **As a walker, I want several real routes between districts, so that the walk itself is a decision.**
   Acceptance: at least 3 routes between each pair of connected districts, none more than 20% longer than the shortest.
   Design today: Partly (regions.md and world.md give edges, not route variety).

6. **As a player, I want herd contact to come with warning, so that a cheap death is one I could have seen coming.**
   Acceptance: 90% of herd contacts are preceded by 30 s of sound, dust or tracks.
   Design today: Partly (hatless.md covers hearing and sight; no telegraphing rule).

7. **As a player at day 40, I want finds that change my next trip, so that looting still matters.**
   Acceptance: "useful find" defined as used within an hour; one in three finds meets it.
   Design today: Partly (loot.md tiers; evaluation.md uses "useful finds" without defining it).

8. **As a mid-game player, I want people within a kilometre of me, so that the middle of the game is not empty.**
   Acceptance: at least one NPC group or player within 1 km at all times after day 10, in 90% of seeds.
   Design today: Partly (evaluation.md counts quests within 1 km, not people).

9. **As a group player, I want to split up to scout and rejoin by a signal, so that groups play differently from solo.**
   Acceptance: rejoin by signal or map pin within 2 real minutes.
   Design today: Missing (multiplayer.md has no comms or rejoin mechanic).

10. **As a solo player, I want roads where a stranger can kill me, so that PvP is a real risk and not a menu option.**
    Acceptance: at least one non-haven route between each pair of main districts.
    Design today: Partly (havens.md makes havens safe; the roads between them are not specified).

11. **As a player, I want logging off not to make me a bunker, so that combat logging does not work.**
    Acceptance: a logged-off gnome is attackable, or its gear drops into a body container within 60 s of disconnect.
    Design today: Missing (simulation-lod.md leaves the gnome asleep where it was left).

12. **As a long-term player, I want traders to still buy from me after the relics run out, so that trade lasts a server's life.**
    Acceptance: at least one tag group bought by Lychgate caravans at day 120 in 80% of worlds.
    Design today: Partly (economy.md "foreign-exchange reserve" describes the cliff, not a fix).

13. **As a phone player, I want to host a small world, so that friends can join without a PC.**
    Acceptance: a phone host with 4 players stays inside the performance budget.
    Design today: Covered (multiplayer.md "Mobile"; process.md phase 5).

## What works

- **Up is safe, down is dangerous** (world.md, Verticality): it gives DayZ-style choice of route without a mini-map.
- **Paper map and no quest markers** (survival.md, Moving and exploring): this is the feel I want, and the NPC map
  decay makes information worth buying.
- **Hand-made spine, seeded rooms** (world.md, "What the seed changes"): the terrain and paths stay fixed while the
  interiors vary, which is the right split for learning a map.
- **Stock-and-flow economy with a conservation test** (economy.md, "The one rule"): loot that does not come back is the
  core of a long server.
- **Stupid-death metric** (evaluation.md, Survival and population): the right measure for a game where cheap death is
  the enemy.

## Concerns and gaps

1. **No respawn.** A shattered gnome rises as a Hatless still wearing its gear, but the design never says how a new life
   starts. Add a fresh spawn with a coast kit and a timed route back to the body.
2. **Up is too safe.** Hatless cannot climb, and havens and settlements are built high, so mid-game players live on
   rooftops. Add a climbing threat: raiders with ropes, a Greybearded pack that climbs, or a weather hazard on High layers.
3. **Havens remove stranger risk for solo players.** The PvP ban inside walls is right for the Tap, but if the Lychgate
   and the Columbarium are the only places to be safe, the open roads become empty. Cap the haven count so that routes
   outside are the default.
4. **Logged-off gnomes.** simulation-lod.md says logged-off players "hold nothing", yet the gnome sleeps with its gear
   where it was left and NPCs can find it. That is combat logging with a safe bunker. Make logged-off gnomes attackable,
   or drop their gear into a body container at logout.
5. **Player death is not measured.** evaluation.md measures NPC "stupid deaths" only. Add player deaths within 60 s of
   first herd sight, and player deaths per hour split by cause.
6. **The playtest gate is too small.** process.md phase 3 is five people for 30 minutes. A mid-game shows up only over
   hours and in a crowd. Add ten players for four hours each, and a "would you go back?" answer.
7. **The time scale is ambiguous.** world.md says 1 game-day is 60 real minutes and the world ticks per game-hour. Decide
   whether world time runs while you are offline, because the loot clock and the Squeeze timing depend on it.
8. **Reading other players is one-way.** survival.md says NPCs read your gear. Players should read other players' gear
   at range too, or the stranger meeting has no information to act on.

## Economy and balance

The stock-and-flow shape is right, but two things do not hold up yet.

First, the arithmetic does not tie. loot.md says the food budget (about 45,000 meals at 1,200 a day) "lasts ~37 days",
but its formula uses 55 days of slack, and the economy bands want 25–45% left at day 50. Renewables have to do real
work, so state the self-sufficiency assumption in one place.

Second, the relic cliff. T4 relics total about 600 and are the only thing outside traders want. When they run out, the
Lychgate caravans want crafts, which need a working settlement. A solo player on an old server then has nothing to
sell, and trade feels dead exactly when the server is old. Suggested changes:

- **Relic renewal:** a sealed crypt opens during a Mowing or a Drift, about every two seasons.
- **Rotating wants:** each season a caravan's wanted tag group rotates, so a solo player can always sell something.
- **Metric, solo trade income per real hour** at day 20, 60 and 120. It should not fall more than 50% after day 60.
- **Metric, containers opened per player-hour.** It should stay above 0.5 for the first 60 days, then fall as loot runs
  out, so the decline is measured, not felt.
- **Caravan calendar on the board.** "Once or twice a season" is seven real hours to wait. Post the arrival date at the
  Waystation so the wait is a plan, not a gamble.

## Scores

- **Movement and exploration: 4.** The stances and no-marker rules are right; carry costs need field testing.
- **Map and verticality: 4.** The layers and routes are strong; the high-is-safe rule weakens them.
- **PvPvE and strangers: 3.** Havens soften PvP by design, and sight and logout are not described.
- **Death and gear loss: 3.** Hatless-keeps-gear is a good idea; no respawn or recovery route.
- **Loot pacing: 3.** The bands are sensible; "useful find" is undefined.
- **Economy: 3.** Stock-and-flow is right; the relic cliff and the arithmetic gap are not.
- **NPC societies: 4.** The organism model is ambitious and the bands are concrete.
- **Mobile: 3.** Controls are specified; the 4-player phone host cap and the action wheel need a real test.
- **Measurement plan: 4.** Strong headless metrics; player-death and encounter metrics are missing.

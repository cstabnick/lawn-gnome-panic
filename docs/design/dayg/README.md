# DayG: design

> Status: design only, no code yet. Folder to come: `games/dayg` (three.js). Setting: `apocrypha` (see
> [docs/lore/rulings.md#r-039](../../lore/rulings.md#r-039)).

DayG is an open-world zombie survival game set in **Mossgrave**, a Tall One cemetery seen from gnome height. Headstones
are cliffs, a funeral wreath is a forest, a mausoleum is a fortress and the groundskeeper's shed is a ruined city of
giant tools. Gnomes cracked by a creeping grey moss get up again as **the Hatless**, and they walk the rows in herds.

You walk and explore the way you do in DayZ: slowly, on foot, with what you can carry, across a map too big to know.
The things you pick up behave like Project Zomboid items: plain and generic, defined by what they can do. Under that runs
the part that makes it DayG: **a simulated world that goes on without you.** Hordes move across the whole map as large
systems. NPC gnomes act like organisms: they forage, hoard, trust, betray, pair up, form packs and sometimes build
societies that grow, trade, go to war and split apart. Goods are scarce and they really move between places, so prices,
caravans, raids and quests all come out of the simulation, not out of a script.

**The game is the player interacting with the system.** Every quest, trade and fight is the player pushing on a simulated
world and seeing it push back.

## Pillars

1. **Staying alive matters; getting there is the game.** Dying costs you everything you carry, and a shattered gnome
   rises as a Hatless still wearing your gear. Survival is never a checklist. It is a running trade-off between
   noise, light, weight, warmth, trust and time.
2. **The world is a system, not a stage.** Nothing important is hand-placed. Hordes, factions, prices and quests come
   out of rules running on a seed. The designer's job is tuning those rules so most seeds give a good story.
3. **Generic things, deep verbs.** An item is a bundle of properties (sharp, holds water, burns, blunt, 0.4 kg). The
   player solves problems with whatever has the right property, the way Zomboid players do.
4. **Society is an organism.** NPCs have needs and temperaments. Groups form because being together pays, and they
   break up when it stops paying. Power is something factions build up and lose, not a number we assign.
5. **Huge, and it feels huge.** A map you cross in real hours, simulated at different levels of detail so the far side
   of the cemetery keeps living.
6. **Good alone, better with friends, risky with strangers.** PvPvE: solo play is a full game because the NPCs supply
   the social life. Small groups are the sweet spot. Other players are the least predictable thing in the world.
7. **Measured, not guessed.** Every system is balanced in a headless simulation over hundreds of seeds against
   numeric targets ([evaluation.md](evaluation.md)).

## Documents

| File | What |
|---|---|
| [world.md](world.md) | Mossgrave: one hand-made map, scale, the five height layers, what the seed changes, how the map is built, weather, seasons |
| [regions.md](regions.md) | The gazetteer: 12 districts, 61 regions, their zones, traits, loot tiers, Hatless and NPC behaviour, and each one's history and possible futures |
| [history.md](history.md) | The eras before the start (the Long Quiet, the Greying, the Scatter, the Holding), the start state, and the chronicle the sim writes after |
| [loot.md](loot.md) | Seeded interiors, container types, loot tiers and tables, the non-renewing loot budget, Visitation |
| [havens.md](havens.md) | The safe zones the friendly groups run: sites, rules, costs, how they change hands |
| [simulation-lod.md](simulation-lod.md) | The three levels of simulation detail and how entities move between them |
| [survival.md](survival.md) | Moving and exploring (DayG feel), the gnome body (cracks, moss infection), needs, survivalist systems, skills |
| [items.md](items.md) | The generic item model (tags, properties, condition), containers, crafting by tag, building, and the prefab mapping |
| [crafting.md](crafting.md) | The numbers: recipes by station, building pieces and HP, farming yields, fire, water, wind, infection stages, death recap |
| [hatless.md](hatless.md) | The zombie gnomes as big systems: horde fields, flow, noise and scent, turning individual Hatless on and off near players |
| [society.md](society.md) | NPCs as organisms, lone wolves to packs to societies, factions, power, and how they change over time |
| [economy.md](economy.md) | Stock-and-flow economy, local markets and prices, caravans, outside traders, money, and how it is balanced |
| [quests.md](quests.md) | Quests generated from the world state, rumours, reputation, how the player deals with factions, sample quests |
| [multiplayer.md](multiplayer.md) | PvPvE, rooms only (no quick play), hosted in a player's browser, cloud-synced room saves, respawn, logout, travel, mobile |
| [evaluation.md](evaluation.md) | The headless simulator, seed sweeps, the metrics and their target bands, the dashboards, regression seeds |
| [process.md](process.md) | How we build it: phases, gates, what each phase measures, and the first epics for the decompose skill |
| [feedback/](feedback/) | Five persona reviews (DayZ veteran, Project Zomboid veteran, survivalist, sim and economy fan, small-group mobile player) as user stories, and [the response](feedback/RESPONSE.md): what changed because of them |

## Repo rules this design commits to

- **Prefabs first** (`@lawn/prefabs`): every item, prop and piece of scenery maps to a catalog prefab. Missing ones are
  listed in [items.md](items.md#prefabs-to-add) and get added to the catalog, never built inside the game.
- **Player gnome** from `@lawn/gnome`. NPC gnomes are generated looks passed through `resolveLook`, and a Hatless is
  a gnome model with the hat slot cleared and moss materials on top: no separate zombie model.
- **Mobile**: touch move, look, and a context-action wheel; the full control map is in [survival.md](survival.md#controls).
- **Online**: `@lawn/mp`, with id `dayg` in `GAMES`: room codes only, hosted in a player's browser, the world save synced to the cloud for every member ([multiplayer.md](multiplayer.md)).
- **Achievements** with gear rewards: [process.md](process.md#achievements).
- **Party slice**: none yet (backlog row says why).
- **No gore** (core house style): gnomes chip, crack and shatter. Moss and clay dust, never blood.

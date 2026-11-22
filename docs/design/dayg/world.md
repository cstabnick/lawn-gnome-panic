# World: Mossgrave

Mossgrave is **one hand-made map**. Every player on every server learns the same place: the same headstone you
climbed to get away from a herd, the same drain that floods in spring, the same crypt the Crypt Holders will never let
you near. What the seed changes is **what's inside** (interior layouts, loot rolls), **who's there** (the NPC
population, which founders lived, where the moss took hold first) and **what happens next** (the simulation).

| Hand-made (same in every world) | From the seed (different per world) |
|---|---|
| terrain, heights, water, every path | room layouts inside buildings, crypts, sheds, the catacomb side passages |
| every headstone, crypt, tree, wall, gate | what every container holds (rolled from the zone's loot table) |
| region and zone borders and their rules | the starting NPC population, their traits, the founders' extremes |
| landmarks, choke points, climbing routes | where the moss was strongest at the start, the herd sizes |
| the history up to the game's start ([history.md](history.md)) | weather, the trader calendar, which sealed crypts are already broken |
| the havens' sites and the trader gates | which factions hold which havens at the start |

## Scale

Mossgrave is a great city cemetery, about **1.45 km across** in Tall terms. A garden gnome is about 16 cm tall and we
draw it at 1.7 world units, so the scale is **1 Tall metre = 11 gm** (gnome metres, the world unit).

| Thing | Tall size | Gnome size | What it is to a gnome |
|---|---|---|---|
| The map | 1.45 km | **16 km × 16 km** | about 67 min to jog straight across, real hours in practice |
| Mown grass | 4 cm | 0.4 gm | ankle high; no cover |
| Long grass | 10–15 cm | 1.1–1.7 gm | head high: crouch in it and you are hidden |
| Meadow grass (unmown corners) | 40 cm | 4.5 gm | a forest; you can't see a herd until it's on you |
| Grave kerb | 15 cm | 1.6 gm | a wall you can vault |
| Flat plaque headstone | 5 cm | 0.6 gm | a stage: open, exposed |
| Upright headstone | 0.8–1.2 m | 9–13 gm | a cliff; climbing needs a route or a rope |
| Obelisk | 3 m | 33 gm | a tower; a sniper's perch and a landmark |
| Family crypt | 4–6 m | 45–65 gm | a fortress with a roof you can live on |
| Yew tree | 12 m | 130 gm | a vertical forest of branches |
| Chapel spire | 28 m | 310 gm | the highest point; you can see the whole map from the bell |
| Open grave | 1.8 m deep | 20 gm | a canyon with sheer sides |

## Verticality

Height is the main way the map is built. There are five layers, and almost every region uses at least three.

| Layer | Height (gm) | What is there | Who uses it |
|---|---|---|---|
| **Deep** | −40 to −5 | catacombs under the chapel and the Hill, the storm drain, old collapsed graves, mole runs | smugglers, the Crypt Holders, Hatless that fell in and pile up |
| **Ground** | 0 to 2 | grass, gravel paths, grave plots, kerbs | everyone; the Hatless own it at night |
| **Low** | 2 to 15 | headstone tops, crypt steps, benches, flower vases, wheelbarrows, the urn niches of the lower Columbarium | packs and lone wolves (sleep up here and you are out of reach) |
| **High** | 15 to 80 | crypt roofs, obelisks, the Columbarium's upper rows, the shed shelves, yew branches, the chapel roof | settlements and lookouts; the havens |
| **Sky** | 80 to 310 | the chapel spire and bell, the tallest yews, the shed's rafters, the water tower | a few landmarks: you go up to see, not to live |

What the layers change:

- **The Hatless can't climb** ([hatless.md](hatless.md#height)). They pile up against walls and can reach about 3 gm by
  climbing on each other, and they fall into holes and gather there. So *up is safe and down is dangerous*, and every
  settlement is built high.
- **Climbing costs time, stamina and noise**, and every high place has a **route**: hand-placed holds (carved
  letters, a cracked corner, ivy), ladders the factions built, ropes, or a bridge. A route can be cut (pull up the
  ladder), guarded, or trapped. Route control is how havens defend themselves.
- **Falling**: past 6 gm a fall chips, past 12 cracks, past 25 can shatter. A leaf or a funeral ribbon can be used as
  a glider (`funeral-ribbon`, a prefab to add): jump from a crypt roof and float down.
- **Lines of sight** follow height: from a headstone top you see 400 gm down a row; from the spire, the whole map (at
  low detail). Lookouts are a role in every settlement.
- **Rope bridges and zip lines** between high places are buildable. A faction's territory often looks like a web of
  bridges between headstone tops, so their gnomes cross without touching the ground.
- **Underground** is the dark, short-sighted layer: no daylight, sound carries, water floods it in spring, and it
  links places that are far apart on the surface (the drain runs from the Drowned Corner to the Back Gate).

## The map

North is up. The main gate is on the south edge; the chapel stands on the rise in the middle of the north half.

```
 ┌───────────────────────────────── THE RAILINGS ─────────────────────────────────┐
 │ COMPOST     COLUMBARIUM WALL ════════════════      THE NEW HILL   MAUSOLEUM    │
 │ HEAPS ░░    (vertical city, Lantern Keepers)        (unfinished)   HILL ▲▲▲     │
 │   ░░░        │                                                    (crypts)     │
 │ WREATHWOOD ✿✿   BELL CHAPEL ✝ (spire 310 gm)      ── CATACOMBS under ──         │
 │  ✿✿✿✿✿       │   Kiln Sisters infirmary                                       │
 │ ✿✿✿✿    THE OLD ROWS ┃┃┃┃┃┃┃        YEW WALK ♣♣♣ ♣♣♣      THE LAWN SECTION   │
 │         (leaning, ivy,  ┃┃┃┃┃┃┃      (avenue to the      (flat plaques, open,  │
 │          oldest stones) ┃┃┃┃┃┃┃       chapel)            no cover)            │
 │ THE GNOME GARDEN  ┃┃┃┃┃┃   ♣ THE TAP ◉ (standpipe)   THE DROWNED CORNER ≈≈≈≈  │
 │ (Potter's Field,        ♣  neutral market haven         (lily pond, drain)    │
 │  broken ornaments)      ♣                                         ≈≈≈≈        │
 │ HEDGE GAP ⇢             ♣                          THE SHED ▣  MOWER YARD ▣   │
 │ (smugglers' way in)   LYCHGATE ⌂ (main gate, Waystation)   BACK GATE ⇢        │
 └─────────────────────────────── the Verge (outside) ────────────────────────────┘
```

Twelve districts, 61 regions, ~300 zones. The full gazetteer, with every zone's layout, layers, loot, behaviour and
history, is in [regions.md](regions.md).

## Grids and units

| Unit | Size | Count | Use |
|---|---|---|---|
| Tile | 4 gm | 4,000 × 4,000 | walk grid, loot cells, building grid |
| Chunk | 256 gm | 64 × 64 = 4,096 | streaming, rendering, near-player simulation |
| Zone | 100–800 gm across, hand-drawn | ~300 | loot table, behaviour rules, ambience; a quest target |
| Region | a group of zones, 1–2 km², hand-drawn | 61 | the world simulation's graph node: territory, markets, horde field |
| District | a named group of regions | 12 | biome, music, lore |

## How the map is built (code over clicking)

- The map is a set of `@lawn/level` documents, one per district, edited with the level editor's agent API
  (`window.le`, see `tools/level-editor/README.md`) and by scripts. Headstone rows, crypt shells, yews and grave plots
  are **stamps**; each row is placed by a small layout script (row count, spacing, lean, age) and then hand-touched.
  "Hand-made" means **designed and fixed**, not clicked tile by tile.
- Regions, zones, climbing routes, spawn points, the havens and the trader gates are **data** in the level documents
  (`zones[]`, `routes[]`, `gates[]`) so the headless simulator reads the same map the game draws.
- Building interiors are **shells** in the level (outer walls, doors, the floor count). The rooms inside are generated
  from the seed ([loot.md](loot.md#procedural-interiors)).
- The region graph (edges with travel and sight costs, including vertical routes) is **baked** from the level
  documents, like Gnomomia's walk bake, and the build fails if it is stale.

## Time: two clocks

One clock can't serve both a 60-minute play session and a world whose loot should last weeks of real time, so DayG
has two (reviews: [feedback/](feedback/)):

| Clock | Length | Drives |
|---|---|---|
| **Sun clock** | 1 sun-day = **2 real hours** (80 min light, 40 min dark); 1 sun-hour = 5 real min | light and dark, weather, the player's needs, infection, cooking and boiling times, Hatless day/night behaviour |
| **World calendar** | 1 world-day = **2, 4 or 8 real hours** (the room's pace, below; 8 shown here = 4 sun-days); 1 season = 7 world-days (14–56 hours of room time); 1 year = 4 seasons = 28 world-days | the economy, food budgets, farming, faction plans, NPC lifespans, the arc in [economy.md](economy.md#the-macro-arc) |

- **Meals**: 1 meal = one gnome for one world-day. A player eats about a quarter-meal per sun-day, the same rate.
- **Every world is a room** hosted in a player's browser ([multiplayer.md](multiplayer.md#rooms)), and **its calendar
  only runs while someone is in the room**. Nobody comes back to a world that moved on without them.
- **World pace** is a room setting: **Brisk** (1 world-day = 2 real hours, one sun-day), **Standard** (4 real hours) or
  **Slow** (8 real hours, the table above). Pace only changes how much a player gets done per world-day; the simulation's
  rules and bands are in world-days, and the evaluation runs the bots at all three paces.
- **A Chronicle** is a world's life: 120 world-days (a bit over 4 years in the world). At Brisk that is about 240 hours of
  room time, at Standard about 480. It ends with a finale (the Great Mowing), or earlier if the room's creator ends it,
  and a new Chronicle can start on the same map with a new seed. Characters don't carry over; achievements, cosmetics
  and the chronicle archive do. This is DayZ's wipe, given a story.
- **The player's needs only tick while they play**: a logged-off gnome is out of the world ([multiplayer.md](multiplayer.md#logging-out)).
- Crossing the map straight: 16 km at a jog (4 gm/s) is about 67 minutes, at a walk (2 gm/s) about 2 h 13 min.
  Ways to cut it are in [multiplayer.md](multiplayer.md#getting-around).

## Weather, seasons

- Seasons last 7 world-days. A season changes the temperature, the rain, **grass height** (sight lines), what grows and
  how the Hatless move (slow in frost, quick in spring).
- Weather is a seeded Markov chain per district: clear, overcast, drizzle, rain, fog, frost, storm. Rain hides noise and
  smells, wets clothes, fills rain catchers, floods the Deep layer and washes away scent trails. Fog cuts sight for
  everyone, Hatless too.
- **The Mowing**: about every 3 seasons the ground shakes as if a giant machine is running somewhere. In one district,
  in one night, the grass is cut flat: cover is gone for a season, herds scatter, grave goods are scattered too. Nobody
  sees it happen (core fact 3). Which district is a seeded schedule the factions try to predict.
- **Visitation**: some mornings, fresh flowers and a lit candle stand on a few graves that weren't there at dusk. Nobody
  has seen who brings them. It is the only loot that renews by itself, and it is kept small ([loot.md](loot.md#visitation)).

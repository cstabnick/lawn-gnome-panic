# Crafting, building, farming, fire, water and infection: the numbers

The reviews in [feedback/](feedback/) asked for numbers instead of names. These are first-draft values: the sim and the
playtests set the real ones, and every one lives in `games/dayg/src/sim/tuning.json`, not in code.

Times are in **real seconds of player action**. "Sun-hours" use the sun clock ([world.md](world.md#time-two-clocks)):
1 sun-hour = 5 real minutes.

## Recipes

Inputs are tag queries (any item with the tag works) unless an item id is named. Tool = a tag the held item needs. Skill =
the level that removes the failure chance (below it: failure chance 10% per missing level, and the inputs are lost).

### By hand (no station)

| Output | Inputs | Tool | Skill | Time |
|---|---|---|---|---|
| Rag ×2 | CLOTH ×1 | CUT | — | 5 s |
| Cord | FIBRE ×3 (grass, reed, ribbon) | — | — | 15 s |
| Rope coil (10 gm) | cord ×4 | — | — | 40 s |
| Tinder bundle | `dandelion-fluff` or dry grass ×2, or a rag | — | — | 5 s |
| Kindling ×3 | `twig-bundle` ×1 | CUT | — | 10 s |
| Torch | stick, rag, FUEL_OIL ×0.1 | — | — | 15 s |
| Splint | stick ×2, BINDING ×1 | — | Glazing 0 | 10 s |
| Petal poultice | `petal-bundle` ×2, water ×0.1 | — | Glazing 1 | 20 s |
| Salt wash | `salt-pinch`, clean water ×0.2 | — | — | 10 s |
| Slingshot ammo ×10 | `stone-chunk` ×1 | HAMMER | — | 20 s |
| Thorn darts ×8 | thorn ×8 | — | — | 15 s |
| Spear | stick, SHARP ×1, BINDING | — | Melee 1 | 30 s |
| Club | `timber-log` ×1 | CUT | — | 20 s |
| Snare | cord ×2, stick | CUT | Trapping 1 | 30 s |
| Noise line | cord ×3, can or chime ×2 | — | Trapping 0 | 25 s |
| Pack frame | stick ×4, cord ×3, CLOTH ×2 | CUT | Carpentry 1 | 60 s |
| Glider ribbon | `funeral-ribbon` ×1, stick ×2 | CUT | — | 30 s |
| Map sketch | paper, charcoal | — | — | 60 s (draws what you have seen) |
| Disguise hat | a hat of the colour you want, or a hat + dye | — | — | 30 s (see grey gnome in [survival.md](survival.md)) |

### Fire and cooking (campfire, `hearth`)

| Output | Inputs | Tool | Skill | Time |
|---|---|---|---|---|
| Fire (lay) | TINDER ×1, KINDLING ×3, FUEL ×1 | FIRESTARTER | — | 20 s; fails in rain without shelter; wet tinder −50% |
| Boiled water (0.5 L) | dirty water 0.5 L | COOK_VESSEL | — | 35 s* |
| Charcoal ×2 | burnt-out fire | — | — | free, after a fire |
| Toadstool stew | mushroom ×2, water 0.3, salt (opt.) | COOK_VESSEL | Cooking 1 | 60 s |
| Acorn flour | `acorn` ×4 | `millstone` or HAMMER | — | 40 s |
| Seed cake | acorn flour, seeds ×2, water | `clay-oven` or hearth | Cooking 2 | 90 s |
| Smoked fish (keeps 20 days) | fish ×1, FUEL ×1 | drying rack over a fire | Cooking 1 | 1 sun-hour; smoke signature 70 for the whole time |
| Dried berries (keeps 30 days) | berries ×5 | drying rack | — | 2 sun-hours in sun; ruined by rain |
| Salted slug (keeps 40 days) | slug ×1, `salt-pinch` ×1 | — | Cooking 1 | 30 s |
| Pickles (keep 60 days) | food ×3, salt, `clay-jar` with seal | — | Cooking 2 | 60 s |
| Glue | `slug-slime` ×2 | COOK_VESSEL | Glazing 1 | 40 s |
| Spirit (antiseptic) | `stout-tankard` ×2 | COOK_VESSEL | Cooking 2 | 2 min |

*Boiling: water must be held at a boil for 1 sun-minute (5 real seconds) after it heats up, which takes 30 s over a
good fire. Boiling costs fuel and makes smoke.

### Workbench (`workbench`)

| Output | Inputs | Tool | Skill | Time |
|---|---|---|---|---|
| Plank ×2 | `timber-log` ×1 | SAW | Carpentry 0 | 30 s |
| Ladder (10 gm) | plank ×4, cord ×4 | HAMMER | Carpentry 1 | 90 s |
| Barricade | plank ×3, nails ×6 | HAMMER | Carpentry 0 | 45 s |
| Door | plank ×6, hinge (iron) ×2 | HAMMER, SAW | Carpentry 2 | 3 min |
| Lock | iron ×1, spring (`scrap-gear`) ×1 | HAMMER | Masonry 2 | 2 min, makes a key |
| Rain catcher | CLOTH ×2 or a vase, stick ×3 | CUT | — | 60 s |
| Drying rack | stick ×6, cord ×4 | CUT | Carpentry 0 | 60 s |
| Garden bed | plank ×4, soil ×6 | HAMMER, DIG | Gardening 0 | 2 min |
| Water filter | `clay-jar`, sand ×2, charcoal ×2, rag | — | — | 40 s; makes dirty water safe at 0.3 L/min, wears out after 20 L |
| Shield | plank ×3 or `bin-lid-shield` | HAMMER | — | 60 s |
| Bow (rare) | yew stick ×1, cord ×2 | CUT | Ranged 3 | 3 min |
| Arrows ×6 | stick ×6, thorn or nail ×6, `feather` ×6 | CUT | Ranged 2 | 60 s |
| Rope bridge (per 10 gm) | rope coil ×2, plank ×4 | HAMMER | Carpentry 2 | 3 min, needs both ends reached |
| Pulley lift | rope coil ×3, `scrap-gear` ×2, `wheelbarrow` part | HAMMER | Carpentry 3 | 8 min |
| Grave lantern | glass ×1, candle, iron ×1 | HAMMER | Masonry 1 | 60 s |

### Kiln (Kiln Sisters' and buildable)

| Output | Inputs | Skill | Time |
|---|---|---|---|
| Glaze pot | `clay-chunk` ×2, ash ×1, FUEL ×3 | Glazing 2 | 10 min firing (can leave) |
| Clay jar | `clay-chunk` ×2, FUEL ×2 | Masonry 1 | 6 min |
| Re-glaze (service) | glaze pot ×1 per gnome | Glazing 3 | 4 min, restores glaze to full |
| Glazed charm (trade craft) | clay ×1, glaze ×0.2 | Glazing 2 | 3 min; what outside traders want once relics are gone |

### Anvil (Mason's Corner, the Shed)

| Output | Inputs | Skill | Time |
|---|---|---|---|
| Nails ×12 | `iron-bar` ×1 | Masonry 1 | 60 s |
| Blade (CUT, SHARP) | iron ×1 | Masonry 2 | 2 min |
| Iron trowel | iron ×1, plank | Masonry 2 | 3 min |
| Repair a metal tool +40% | iron ×0.5 | Masonry 1 | 60 s |

## Building pieces

HP is how much Hatless pushing (1 HP per Hatless per sun-minute) or hitting (weapon damage) it takes.

| Piece | Cost | HP | Notes |
|---|---|---|---|
| Plank wall (4 gm) | plank ×3, nails ×6 | 120 | climbable with a rope |
| Barricade (on a door or gap) | plank ×3, nails ×6 | 80 | a gap a Hatless pile can't push through until broken |
| Reinforced barricade | barricade + plank ×3 | 200 | |
| Stone wall (4 gm) | `stone-chunk` ×6, mortar ×2 | 400 | Masonry 2 |
| Door | see above | 150 | lockable |
| Ladder (pull-up) | see above | 40 | pulled up in 2 s |
| Spike line | stick ×6 | 60 | 5 damage per Hatless that walks through, slows them |
| Pit (dug) | DIG, 2 min per 1 gm deep | — | a `PIT` zone in small |

A pile of 5 Hatless against a barricade breaks 80 HP in 16 sun-minutes (80 real seconds). A herd of 50 breaks a
stone wall in about 8 sun-minutes. That's why havens are built high, not just walled.

## Farming

| Crop | Plant | Grows in | Yield per bed (4 × 4 gm) | Notes |
|---|---|---|---|---|
| Clover | `clover-seed` ×2 | 5 world-days | 8 meals | spring–autumn, any soil |
| Toadstools | spore (from a mushroom) ×1 | 4 world-days | 6 meals | shade and wet; grows in winter |
| Grain | `grain-sheaf` seeds ×3 | 10 world-days | 14 meals | sun, good soil; frost kills |
| Berries (bush) | cutting ×1 | 14 world-days, then every 6 | 6 meals per pick | lasts for good once grown |
| Roses | cutting | 12 world-days | 3 meals + 2 medicine | the Columbarium's crop |
| Acorn tree | `acorn` ×1 | 40 world-days | 30 acorns a season | the very long game; acorns are money too |

- Each bed needs 1 L of water per world-day and a gnome's 10 minutes of work per world-day. Unwatered: −50% yield.
  Untended for 3 days: weeds, −50%.
- Compost soil (from the Compost Heaps): +50% yield. Hatless trample beds they cross (−1 bed per 10 Hatless).
- A gnome needs 1 meal a world-day, so feeding a group of 10 takes about 2 grain beds or 4 clover beds, plus the work.

## Fire, water and wind

- **Fire lay**: tinder → kindling → fuel. Each part has a dryness; wet parts lower the light chance. Rain without
  cover puts a fire out in 2 sun-minutes. A fire in a hole or behind a stone: −60% light signature. A fire with dry
  hardwood: −50% smoke.
- **Wind** has a direction and strength (from the weather chain). Smoke and scent drift downwind: a fire is seen far
  downwind and hardly at all upwind, and Hatless and trackers downwind of you smell you from 3× as far. A player who
  always camps downwind of a herd is doing it right.
- **Water**: dirty water (puddles, the pond) gives Grit at 25% per drink; boiled, filtered or rain caught in a clean
  container is safe. The Tap is always clean. Grit: −50% water from drinks, stomach cramps (no sprinting), 2–4
  sun-days, worse when dehydrated.

## Infection: the moss, with numbers

| Stage | When | You notice | What works | Chance it works |
|---|---|---|---|---|
| 0. Exposed | a scratch that crack-hits (12% per Hatless hit on an open crack; 3% on a glazed part) | nothing (the game hints only with a faint grey on the crack) | salt wash or spirit | 95% |
| 1. Rooting | 0–3 sun-hours | a grey crack, an itch (Calm −10) | scrape and seal: knife + spirit + glue | 80% (−10% per missing Glazing level below 2) |
| 2. Spreading | 3–12 sun-hours | grey veins, cold (Warmth −20), slower healing | the Kiln Sisters' **firing**: a deep crack in exchange for a cure | 50% |
| 3. Taking | 12–24 sun-hours | the hat slips; NPCs back away; aim drifts | none | 0% |
| Turn | 24 sun-hours (2 real hours) | you shatter and rise as a Hatless | | |

Warmth and wetness speed it up (×1.5 in Bloom season, ×0.5 in frost). NPCs follow the same table, which is what makes
the bitten a social problem for every group.

## Death recap

On death, a short card in the house style shows the last 60 seconds from the gnome's own event log: "You were
crouched on a headstone in the Leaning Rows. A pile of six Hatless reached you. You fell 14 gm and cracked a leg.
Bramble Potsworth, who owed you two acorns, did not come back for you." Then: where you fell (a rough circle on the
map), and the respawn choice ([multiplayer.md](multiplayer.md#death-and-respawn)).

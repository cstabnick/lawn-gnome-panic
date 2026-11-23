# DayG

Mossgrave is a Tall One cemetery seen from gnome height. The Hatless walk its lanes, the moss creeps into the cracks
of your body, and the world keeps running whether you are watching or not: NPCs eat, freeze, form groups and die, and
the weather and the seasons move on. You are one gnome trying to last a day, then another.

This is a playable slice, not the full game. It is single-player.

## Run it

```
npm install                          # once, from the repo root
npm run dev -w games/dayg            # http://localhost:5206
npm run build -w games/dayg          # type-check and build
npm test -w games/dayg               # unit tests
```

The headless simulator runs the world with no rendering:

```
npm run sim -w games/dayg -- --seeds 50 --days 60   # scorecard over 50 seeds
npm run sim -w games/dayg -- --chronicle 3          # the written story of seed 3
npm run sim -w games/dayg -- --seed 3 --json        # one seed as JSON
npm run sim -w games/dayg -- --seeds 50 --days 60 --check   # exit 1 if a band fails
```

Tuning lives in `src/sim/tuning.json`. The latest scorecard is in `sim/TUNING_LOG.md`.

## Controls

| Action | Desktop | Touch (phone) |
|---|---|---|
| Move | WASD or arrow keys | Floating stick: touch the left 45% of the screen, lower part; push past 90% to sprint |
| Look | Mouse, after you click the game (pointer lock) | Drag anywhere that is not the stick |
| Sprint | Hold Shift | Push the stick to its edge |
| Crouch | C (tap) | CROUCH button |
| Act (take, open, light, use what you hold) | E | ACT button |
| Attack (strike with what you hold, or fists) | Left click with the mouse locked | HIT button |
| Climb (vault, ladder, rope, climb down) | Space | UP button (lights up when a climb is possible) |
| Pack (inventory) | Tab or I | PACK button |
| View (third or first person) | V | VIEW button, top right |

Pointer lock needs a click. Until you click the game, the mouse does nothing.

## What is in the slice

- **Map:** one hand-made cemetery, twelve regions (Gate Roof, Forecourt, Verge Path, Bin Corner, Ivy Rows, Leaning Rows,
  The Sinks, Angel Square, The Mason's Corner, Child Graves, Yew Edge, The Tap). Height layers: kerbs, ladders, ropes.
- **Havens:** the Lychgate Waystation (fire, sleep) and The Tap (clean water).
- **Needs:** food, water, warmth and calm for you, and the same needs for the NPCs. Weather and the sun clock change them.
- **Moss:** infection in the body, with stages, cracks and a scrape-and-seal treatment.
- **Recipes:** lay and light a fire, salt wash, spirit wash, scrape and seal, boil water, glaze.
- **Hatless:** the walking dead, with sight, lunge and give-up rules. They fill the regions over time.
- **Death recap:** when you die, the screen shows the cause and the region.
- **Achievements:** four gear rewards: First Night, Up and Away, Scraped Clean, Mossbreaker.

## URL parameters

| Parameter | Effect |
|---|---|
| `seed=<n>` | The world seed. Without it, a random seed is chosen and written into the URL. |
| `timescale=<n>` | Speeds up the clock. Default 1. |
| `simdays=<n>` | Days simulated before you arrive. Default 2. |
| `night=1` | Start at night. |
| `kit=climb` | Start with the rope and the ladder. |
| `touch=1` | Force the touch controls on a desktop. |
| `spawn=<x>,<z>` | Start at a map position instead of the default spawn. |

Example: `http://localhost:5206/?seed=1&kit=climb`.

Debug: the browser console has `window.__dayg` (player, needs, body, inventory, sim, clock, bus, hatless, feed, camp).

## Not done yet

- Multiplayer. DayG is single-player. The simulation is pure code, so a future host could run it, but nothing is built.
- Talk and quests.
- The other districts. Only the Lychgate, the Old Rows and the Yew Walk are mapped.
- Building and farming.
- Factions and traders.

Design notes are in `docs/design/dayg/`. The playtest checklist is in `PLAYTEST.md`.

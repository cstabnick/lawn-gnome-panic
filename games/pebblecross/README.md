# Pebblecross

A single-player life sim in a small town of gnomes, in the spirit of The Sims. Nine residents live their days on a
clock: they bake, post, pot, teach, mend mowers, pull pints and sit on benches. You walk the town, forage for gifts,
talk to residents, give them gifts, and befriend them, from Stranger up to Best friend. The town is a 3D scene built
with three.js, and the lore is the Yard setting (`docs/lore/entries/the-yard/pebblecross.md`).

- Run: `npm run dev -w games/pebblecross` (port 5202). Build: `npm run build -w games/pebblecross`.
- `?fast`: the clock runs at 4x, for testing. `?reset`: wipes your save and starts again.

## How to play

- Tap or click the ground to walk. Tap a resident to talk to them, a place to walk there, or a forage patch to pick it.
- Touch buttons along the bottom: the big action button (talk, give or forage, for whatever you are next to), the bag
  and the friends list. Keys: E (use), B (bag), F (friends), Escape (close a panel).
- Pinch or scroll to zoom the camera. The camera follows the ground you tap; the player moves only by taps.

## The clock

One game day lasts 480 real seconds, so one game hour is 20 seconds. The game starts at 07:00 on a Monday. Residents
keep weekday and weekend timetables, so the town is busy at the bakery in the morning and quiet at night.

## Residents

| Resident | Role | Home | Favourite gift | Works |
|---|---|---|---|---|
| Nettle Dibbleworth | baker, Crumb & Crock | Nettle's house | Bread crumb | bakery, weekday 05-13 |
| Fernwick Stoutpot | postman | Fernwick's house | Bottle cap | post office 08-12, then the round 12-16 |
| Tansy Clayfoot | gardener, Potting Shed | Tansy's house | Dandelion | potting shed, 09-17 |
| Hollis Mulchman | mower mechanic, wary of mowers | Hollis's house | Pebble | Yard Shed, 08-16 |
| Big Lou | strongman, Yard Shed | Lou's house | Acorn | Yard Shed, 08-16, with Hollis |
| Marjory Pipkin | teacher, the Acorn Club school | Marjory's house | Four-leaf clover | school, 09-15 |
| Clem Thatcher | landlord, Lantern Inn | Clem's house | Mushroom | the inn, 17-24 |
| Doris Fennel | retired, bench by the pond | Doris's house | Pebble | green bench, 13-17 |
| Granny Gnertrude | knits under the oak | Gnertrude's house | Dandelion | the oak, 09-15 |

## Foraging and gifts

Gifts come from the ground, not a shop. Forage patches are around the town: dandelions and clover on the green, acorns
under the oak, pebbles at the pond edge, mushrooms behind the inn, bottle caps by the post office and bread crumbs on
the bakery's back step. A picked patch takes a couple of seconds and then has something on it again after a while.
The bag (B) holds what you have picked.

To give a gift, use a resident (or the action button) and pick an item from the bag. Each resident takes one gift a
day. Their favourite gift is worth more than any other.

## Befriending

Each resident has friendship points from 0 to 100, and a level for them:

| Points | Level |
|---|---|
| 0 | Stranger |
| 20 | Acquaintance |
| 50 | Friend |
| 80 | Close friend |
| 100 | Best friend |

Talking to a resident once a day gives 5 points. A gift gives 15 points if it is their favourite and 5 otherwise, one
gift a day per resident. Residents say different things by time of day, and more warmly once they are a friend. The
friends list (F) shows everyone's level and where they are right now.

## Save

Your progress is saved in this browser's localStorage under the key `pebblecross.save.v1`. It is a per-browser
convenience, not a cloud save: another browser or device starts fresh. If the save cannot be read or written, the game
still plays and just does not remember. `?reset` clears it.

## Code

- `src/config.ts`: clock constants, gifts, residents, places, friendship numbers, the save shape and `SAVE_KEY`.
- `src/clock.ts`: game time, day names, weekends and the clock label.
- `src/schedule.ts`: which place each resident is at, and what they are doing, from the time.
- `src/residents.ts`: the nine residents, with their looks and timetables.
- `src/dialogue.ts`: what a resident says, by time of day and friendship.
- `src/friendship.ts`: the save, points, levels, talking and giving.
- `src/nav.ts`: walking grid and path planning around buildings, ponds and props.
- `src/town.ts`: loads the town from its level file (buildings, roads, props, places, forage, ground height).
- `src/world.ts`: the town's scene (ground, buildings, props, forage patches, pond water).
- `src/actors.ts`: the resident gnomes and the player's gnome, walking on their paths.
- `src/camera.ts`, `src/input.ts`: the camera rig, and taps and keys turned into hits.
- `src/hud.ts`, `src/panels.ts`: the top bar, speech box, toasts, and the friends, bag and resident panels.
- `src/main.ts`: wiring. Plan: `docs/roadmaps/pebblecross.md`.

## Editing the town

The town is a level document (`@lawn/level`, the same format as the other 3D games' maps). Open the level editor with
`npm run level-editor` and pick Pebblecross. The file is `games/pebblecross/src/data/levels/pebblecross.level.json`.
Required place markers (`bakery`, `home-nettle`, and so on) must stay, since the schedules refer to them by id.

## Tests

`npm test -w games/pebblecross` runs the module tests. `npm run build -w games/pebblecross` type-checks and builds.

## Mobile and online

- Mobile: yes. Tap controls, touch buttons of at least 44 px, and a layout for portrait and landscape phones.
- Online: no. It is single-player on purpose: befriending is about one player and a town that runs on its own clock.
  Online play would double the size of the game and has no shape yet.

## Not done yet

No shop, no houses to go inside, no weather, no seasons. Party play is not planned yet either (see the backlog in
`packages/party/README.md`).

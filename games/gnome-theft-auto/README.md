# Gnome Theft Auto

An open-town gnome crime sandbox (a parody; lore setting: apocrypha). Walk Turfton as your own gnome, steal mowers,
soak townsgnomes with water guns (they put their hands up and run), dodge the Hat Watch, and lift the Whirligig, a
flying mower, from Fort Sandpit.

Run: `npm run dev -w games/gnome-theft-auto` (port 5198). Build: `npm run build -w games/gnome-theft-auto`.

## Controls

| Action | Keyboard / mouse | Touch |
|---|---|---|
| Move / drive | WASD or arrows | left-thumb stick |
| Look | drag the mouse | drag the right side of the screen |
| Squirt | left mouse or F | Squirt button |
| Get in / out, steal | E | Enter button |
| Jump / fly up | Space | Jump / Up |
| Fly down | Shift or C | Down |
| Swap water gun | Q | Swap |

## Mowers

| Model | Prefab | Feel |
|---|---|---|
| Push-Mower Bike | `push-mower-bike` | light and twitchy |
| Ride-On Mower | `ride-on-mower` | the town's family mower; most of the traffic |
| Zero-Turn Racer | `zero-turn-mower` | fastest on the ground, turns on the spot |
| Combine Harvester | `combine-harvester` | slow, huge, shoves everything |
| The Whirligig | `whirligig-mower` | flies; parked at Fort Sandpit |

Tuning lives in `src/config.ts`; contracts between modules in `src/types.ts`.

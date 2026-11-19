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

## Online

Free roam through `@lawn/mp` (game id `gnome-theft-auto`, 1-16 players, drop-in; `?room=CODE` for a private town).
There is no host: each player relays their own gnome and mower, and tells another player when their water hit them.
Townsgnomes, traffic and the Hat Watch are local to each browser.

Online is on by default: the page joins the public town as it loads, with no menu. The HUD shows
"Online: N in Turfton" under the minimap. The connection is `resumable`: a phone that switches apps gets its seat back
(within 45 s), and returning to the tab reconnects at once instead of waiting for the retry timer. Locally the game uses
`ws://localhost:8787/ws` (`npm run dev -w packages/mp-server`); with no server it is the same game alone.

## Testing

`?debug` exposes the live modules as `window.__gta` (player, vehicles, npcs, watch, world, chase, hud, weapons) for
scripted checks.

## Sim driving (POC)

`?drive=sim` swaps the arcade mower physics for `@lawn/vehicle` (see `packages/vehicle/README.md`) while the player drives a ground mower:
suspension and weight transfer, Pacejka tyres, speed-aware steering, traction control and a handbrake slide. Traffic and the Whirligig stay arcade.

- `?drive=sim&preset=casual|hybrid|simcade` picks the tuning family (default `casual`). Each mower is the preset scaled to its size and retuned to its top speed and pickup (`mowerConfig` in `src/simdrive.ts`).
- **Forced offline** while it is a POC: the page never connects, so there is no "Online" line and no other players.
- Handbrake slide: Space, or the Slide button on touch. Throttle/steer/brake are W/S/A/D or the stick (down = brake, then reverse from a stop).
- `&mount` starts you already driving a ride-on mower on the x = 0 road (used by `demos/sim-driving.json`).

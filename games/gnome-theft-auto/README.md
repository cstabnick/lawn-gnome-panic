# Gnome Theft Auto

An open-world gnome crime sandbox (a parody; lore setting: apocrypha). Walk Turfton as your own gnome, steal mowers,
shoot townsgnomes with real guns (they put their hands up and run, nobody bleeds), dodge the Hat Watch, lift the
Whirligig from Fort Sandpit, fly the Crop Duster from the desert airfield and bail out under an automatic parachute.

The map is 1200 x 1200: Turfton (a grid city with towers downtown) in the middle, and around it the Dust Flats (desert,
east: Fort Sandpit and the airfield), Mossy Wood (west), the Frostbite Fells (north) and Cloverfield Farms (south),
joined by winding highways. Layout constants: `src/config.ts` (`HIGHWAYS`, `biomeAt`, `BASE`, `AIRFIELD`).

Run: `npm run dev -w games/gnome-theft-auto` (port 5198). Build: `npm run build -w games/gnome-theft-auto`.

## Controls

| Action | Keyboard / mouse | Touch |
|---|---|---|
| Move / drive | WASD or arrows | left-thumb stick |
| Look | drag the mouse | drag the right side of the screen |
| Fire | left mouse or F | Fire button |
| Get in / out, steal | E | Enter button |
| Jump / pull up | Space | Jump / Up |
| Fly down | Shift or C | Down |
| Swap gun (Pistol, SMG, Shotgun, Rifle) | Q | Swap |
| Reload | R | Reload button |
| Bail out of a plane (in the air) | E | Exit button |

## Mowers

| Model | Prefab | Feel |
|---|---|---|
| Push-Mower Bike | `push-mower-bike` | light and twitchy |
| Ride-On Mower | `ride-on-mower` | the town's family mower; most of the traffic |
| Zero-Turn Racer | `zero-turn-mower` | fastest on the ground, turns on the spot |
| Combine Harvester | `combine-harvester` | slow, huge, shoves everything |
| The Whirligig | `whirligig-mower` | flies; parked at Fort Sandpit |
| Crop Duster | `crop-duster` | fixed-wing plane: build speed on the runway (stall 22), pull up to take off; two at the desert airfield |

Bullets are hitscan rays from the crosshair (screen centre), so aim by looking. Leaving a plane above 3 units makes the
gnome fall; the parachute opens by itself after about a second and you steer the glide.

Tuning lives in `src/config.ts`; contracts between modules in `src/types.ts`.

## Online

Free roam through `@lawn/mp` (game id `gnome-theft-auto`, 1-16 players, drop-in; `?room=CODE` for a private town).
There is no host: each player relays their own gnome and mower, and tells another player when their bullet hit them.
Townsgnomes, traffic and the Hat Watch are local to each browser.

Online is on by default: the page joins the public town as it loads, with no menu. The HUD shows
"Online: N in Turfton" under the minimap. The connection is `resumable`: a phone that switches apps gets its seat back
(within 45 s), and returning to the tab reconnects at once instead of waiting for the retry timer. Locally the game uses
`ws://localhost:8787/ws` (`npm run dev -w packages/mp-server`); with no server it is the same game alone.

## Testing

`?debug` exposes the live modules as `window.__gta` (player, vehicles, npcs, watch, world, chase, hud, weapons) for
scripted checks.

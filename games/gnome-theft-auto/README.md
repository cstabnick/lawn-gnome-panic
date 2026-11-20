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
- Handbrake: Space, or the Handbrake button on touch; the in-game tune menu (T, or the pill at the top) switches tunes live. Throttle/steer/brake are W/S/A/D or the stick (down = brake, then reverse from a stop).
- `&mount` starts you already driving a ride-on mower on the x = 0 road (used by `demos/sim-driving.json`).

## Damage

Mowers have hit points. Hitting a building or another vehicle above about 5 units/s takes some off (faster and heavier costs more),
and the model changes through the prefab's damage stages (`dented`, then `wrecked`: darker, a wheel off, bonnet up, smoking).
The game toasts the new state for your own mower. Stages are data on the prefab (`packages/prefabs/README.md` > Damage stages);
`?debug` exposes `__gta.damageVehicle(v, 0..1)`, `repairVehicle(v)` and `spawn(kind, x, z, yaw)` for checks.

## Gamepad

Plug in or pair any standard pad (Xbox, PlayStation, Switch Pro, Steam Deck); it works alongside keyboard and touch, with no setup.

| | On foot / parachute | Driving | Flying |
|---|---|---|---|
| Left stick | move | steer | steer + throttle |
| Right stick | look | camera | camera |
| RT / LT | fire (RT) | gas / brake, then reverse | climb / descend |
| A | jump | handbrake | |
| X | reload | reload | |
| Y | get in, steal | get out | get out |
| RB | fire | squirt | fire |
| LB | swap gun | | |
| Start | tune menu (`?drive=sim`) | tune menu | tune menu |

In the tune menu the pad is the menu's: D-pad or left stick up / down to choose, A to pick, B or Start to close.
Pad steering in sim driving is analog (deadzone and gamma, no key smoothing).

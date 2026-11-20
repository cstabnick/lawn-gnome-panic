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
| Turn the radio's dial (Turfton FM, while driving or flying) | N, or D-pad right | Radio button |

## Quests

Quests are data. A quest is an entry in `src/quests/defs.ts`; the systems that run it (`quests.ts`, `cutscene.ts`) know
nothing about any one quest.

```ts
{
  id: 'second-contract', title: 'Second Contract', giver: 'mulch-club', cutscene: { kind: 'contract' },
  demo: true, achievement: 'gta-some-achievement', doneText: 'Done.',
  objectives: [
    { kind: 'crack', text: 'Crack the marked gnome',
      targets: [{ id: 'bert', name: 'Bert Mulch', near: [200, 200], hint: 'Cloverfield Farms', look: { hat: 0xffd23f } }] },
    { kind: 'visit', text: 'Report back', at: [-16, -30], radius: 8, hint: 'The Mulch Club' },
  ],
}
```

- **Giver:** a building the player presses Enter at (`GIVERS` in `defs.ts`; the Mulch Club is block (-30, -30)).
- **Cutscene:** silent and made from the quest's targets (the boss lays out one wanted poster per target). Skip with any key or tap.
- **Objectives** run one after another. `crack` spawns the named targets (gold marker, orange map blip, they run when you get close); `visit` is a place to reach. A new kind is one entry in `OBJECTIVE_KINDS` in `quests.ts` plus a variant in `types.ts`.
- Progress is saved in `localStorage` (`gta-quests-v1`). Clear it to replay the demo contract.
- To start a quest from a new place, add a giver (and a building for it in `world.ts`).

## Turfton FM

Every mower and plane you drive or fly has a radio. The dial is off, or one of three stations: 99.3 The Blade (big beat,
the days: Dock Hoewright; the mornings: Lawn-Dart), 88.7 Fescue Public Radio (lullaby, Sorrel Tillbrook) and 104.1 HOA
Compliance Beats (jazz, Cress Caliper). Each station plays generated music (`@lawn/music`) with DJ banter, adverts,
callers and traffic reports, shown as subtitles in a pill at the bottom of the screen. Breaking-news bulletins cut in
for the Hat Watch level and for things you do. M mutes it with the sound effects; the dial is remembered per browser.

- Everything the radio says is in `src/radio/content.ts` (stations, songs, banter, adverts, bulletins). Add a line by adding
  a string; the no-repeat rule and the content checks in `src/radio/schedule.test.ts` cover it.
- The programme rules (what plays next, breaks, bulletins) are `src/radio/schedule.ts`; `player.ts` is the pill and the music.
- Lore: [docs/lore/entries/apocrypha/turfton-fm.md](../../docs/lore/entries/apocrypha/turfton-fm.md) and the host entries.
- Story: [docs/design/gnome-theft-auto/story.md](../../docs/design/gnome-theft-auto/story.md) section 10.

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

## Driving

Every ground vehicle you drive (Push-Mower Bike, Ride-On, Zero-Turn Racer, Combine) uses `@lawn/vehicle` (see `packages/vehicle/README.md`): suspension and
weight transfer, Pacejka tyres, speed-aware steering, traction control and a handbrake slide. Traffic and the flyers (Crop Duster, Whirligig) stay arcade.

- **Each vehicle drives like itself.** `src/handling.ts` holds a *profile* per vehicle: a stock setup of 11 tuning knobs (top speed, pickup, brakes, grip, balance, steering lock, driver aids, handbrake, weight, suspension, ride height; neutral is 1, balance 0) and the *range* a garage may move each knob within. The bike is light and lively, the zero-turn grips and flicks its tail on the handbrake, the combine pushes wide and rolls. A new vehicle is a profile entry, not new physics.
- **Weight shift.** The rider leans to the outside of a turn (turn left and the gnome rocks a little right) on top of the chassis's own roll and pitch. Subtle on purpose; `LEAN_MAX` and `profile.lean` in `handling.ts` set it. It works under Arcade too (from speed and yaw rate).
- **Driving realism is a cheat.** The gear button under the minimap (or O, or Start on a pad) opens Options > Cheats > Driving realism: Arcade (the original flat model), Casual (default), Open World, Simcade, and the silly ones, Drift Mower and Dewy Lawn. It changes every ground vehicle live and is remembered per browser. `?tune=<id>` picks one for a visit, `?drive=arcade` starts in Arcade.
- **Garage (not built yet).** `getSetup` / `setSetup` / `resetSetup` in `src/simdrive.ts` already read, clamp (to the vehicle's range) and save a setup per vehicle. With `?debug`: `__gta.garage.get('zero-turn')`, `__gta.garage.set('zero-turn', { grip: 1.3 })`, `__gta.setMode('simcade')`. A tuning garage is a screen of sliders over `TUNING_PARAMS` (in `@lawn/vehicle`) limited by `rangeFor(kind, id)`.
- A tipped-over vehicle is stood back up after 1.5 s. Hold a slide for a second (the Zero-Turn and the handbrake will do it, even in Casual) for the Sideways Gnome achievement.
- **Online works**: a driven vehicle is broadcast like any other. Other players see its pose; physics and damage run on the driver's own page.
- Handbrake: Space, A on a pad, or the Handbrake button on touch (hidden in Arcade). Throttle/steer/brake are W/S/A/D or the stick (down = brake, then reverse from a stop).
- `&mount` starts you already driving a ride-on mower on the x = 0 road (used by `demos/sim-driving.json`).
- `npm test -w games/gnome-theft-auto` checks the config builder, that every vehicle survives every mode (full lock plus handbrake at top speed, a hard slalom: no flip), and the lean.

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
| Start | Options | Options | Options |

In Options the pad is the panel's: D-pad or left stick up / down to choose, A to pick, B or Start to close.
Pad steering is analog (deadzone and gamma, no key smoothing).

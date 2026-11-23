# Gnome Theft Auto

An open-world gnome crime sandbox (a parody; lore setting: apocrypha). Walk Turfton as your own gnome, steal mowers,
shoot townsgnomes with real guns (they put their hands up and run, nobody bleeds), dodge the Hat Watch, lift the
Whirligig from Fort Sandpit, fly the Crop Duster from the desert airfield and bail out under an automatic parachute.

The map is 1800 x 1800: Turfton (a grid city with towers downtown) in the middle, and around it the Dust Flats (desert,
east: Fort Sandpit and the airfield), Mossy Wood (west), the Frostbite Fells (north) and Cloverfield Farms (south),
joined by winding highways, with Loch Moss (north-west corner) and Tallgrass Commons (south-west corner) reached by
spur roads. The Everspring river runs from the Frozen Birdbath Basin through Loch Moss, Mossy Wood and the Southern
Drainage Canal to the Puddle Sea (see Wild World below).

The world is level documents (`@lawn/level`): one `src/data/levels/<region>.level.json` per region (`turfton`,
`dust-flats`, `mossy-wood`, `frostbite-fells`, `cloverfield-farms`, `loch-moss`, `tallgrass-commons`), authored
region-local and placed by `src/data/world.layout.json` (origins, world size, highway order). Each region's border is
a polygon (`data.border`); `regionAt(x, z)` in `src/levels.ts` says which region a point is in. A document holds the
region's highways and reserved water (`paths` of kind `road` / `water`),
its hand-placed prefabs (`props`; `solid: true` adds a box collider), its named points (`markers`: landmarks, quest
givers, Fort Sandpit and the airfield, setpiece anchors, reserved zones, walk points) and the seed of its scatter
generator (`base`; trees, cacti, villages and farms are still generated in `src/biomes.ts`). `src/levels.ts` loads
them in world coordinates; `src/config.ts` derives its layout constants (`HIGHWAYS`, `BASE`, `AIRFIELD`...) from them.
Edit them in the level editor: `npm run level-editor`, then `?game=gnome-theft-auto&level=dust-flats`.

Ground height comes from one function, `heightAt(x, z)` in `src/terrain.ts` (with `normalAt`, `aboveGround`, the
vehicle ground probe `terrainProbe()` and `waterAt`). Roads, Turfton and the big sites are flattened on top of
the relief, and the ground mesh is built in 128 m chunks (`src/terrainMesh.ts`). The shipped relief amplitude
(`TERRAIN.amplitude` in `config.ts`) is 1 (each region's landforms in `src/landforms/`); `?terrain=0` flattens it, and
`?terrain=hill` puts a 6 m test hill on the east highway in the Dust Flats (x 545, z 30) to drive and walk over.

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
| Call (or wave off) the Turfton Taxi back to the Central Bus Stop | Y, or D-pad left | 🚕 button |
| Quest Journal / big map with legend | J / M | 📜 button / tap the minimap |

## Quests & Story

A 5-chapter story campaign (*Prologue: Fresh Out the Kiln* through *Chapter 5: The Even Cut*) plus 11 *Strangers & Freaks* side quests (`src/quests/chapter1.ts`–`chapter5.ts`, `src/quests/sideQuests.ts`, assembled in `src/quests/defs.ts`). Quests support silent wanted-poster contracts (`mulch-club`) and speaking dialogue cutscenes (`@lawn/mutter` voice blips, `bodegaCameo` cutaways), plus `crack`, `visit`, `steal-deliver`, `chase-follow`, `convoy-ambush`, `air-drop`, `survive-derby`, `boss-combine`, and `choice` objectives.

- **Givers:** glowing 3D markers across Turfton and the four biomes (`GIVERS` in `defs.ts`). Only givers with work on
  offer show. Story givers are gold (star on the maps, their letter over the beam); side-quest givers are a "?" diamond
  in the giver's own colour (`SIDE_COLORS` in `src/quests/unlocks.ts`); the active objective is orange target rings.
  The big map (M) has a legend.
- **Side-quest pacing:** each side quest (and Tessie) opens after one story quest, in `SIDE_UNLOCKS`
  (`src/quests/unlocks.ts`, the one table to edit). A "NEW SIDE QUEST" banner announces it; the Quest Journal (J) lists
  Open, Locked (with the beat that opens each) and Done. Old saves keep anything already started or finished.
- **Route:** a dashed line along the roads (`src/route.ts`) on both maps to the active objective, or to a giver you
  tap in the journal's Open tab.
- **Turfton Taxi** (`src/taxi.ts`, numbers in `TAXI` in `config.ts`): call it with 🚕, Y or D-pad left; Mabel Kerbstone
  drives the `gta-taxi` prefab up, you get in (E), and she takes you back to the Central Bus Stop with a short drive
  and a fade. Fare 10-60 Acorns by distance. Not while the Hat Watch is on you, on a contract, driving, swimming or
  falling. Achievement: Meter's Running (3 rides, Cabbie Cap).
- **Progress:** saved in `localStorage` (`gta-quests-v1`, mirrored to `@lawn/cloudsave`) alongside `gta-economy-v1` (Acorns & Kiln-Debt) and `gta-collectibles-v1`.
- **Experimental Save Tools:** Options (gear button, `O`, or Start) -> **Experimental** lets you export (`gta-save.json`), import (file or pasted JSON), or reset your local save for dev testing.

## Turfton FM

Every mower and plane you drive or fly has a radio. The dial is off, or one of three stations: 99.3 The Blade (big beat,
the days: Dock Hoewright; the mornings: Lawn-Dart), 88.7 Fescue Public Radio (lullaby, Sorrel Tillbrook) and 104.1 HOA
Compliance Beats (jazz, Cress Caliper). Each station plays generated music (`@lawn/music`) with DJ banter, adverts,
callers and traffic reports, shown as floating text (no box, outlined for legibility). Talk is rare: two songs for each break. Options > Radio text turns the words off and keeps the music. Breaking-news bulletins cut in
for the Hat Watch level and for things you do. M mutes it with the sound effects; the dial is remembered per browser.

- Everything the radio says is in `src/radio/content.ts` (stations, songs, banter, adverts, bulletins). Add a line by adding
  a string; the no-repeat rule and the content checks in `src/radio/schedule.test.ts` cover it.
- The programme rules (what plays next, breaks, bulletins) are `src/radio/schedule.ts`; `player.ts` is the floating text and the music.
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

## Wild World

- **Regions:** seven regions on an 1800 x 1800 map (Turfton, the Dust Flats, Mossy Wood, Frostbite Fells, Cloverfield
  Farms, Loch Moss, Tallgrass Commons), one level document each in `src/data/levels/`; hills from `src/terrain.ts`
  and `src/landforms/`.
- **Water and boats:** the Everspring river from the Fells through Loch Moss and Mossy Wood to the Puddle Sea, the
  Southern Drainage Canal, five road bridges (Fellsmelt, Ravine, Bracken, Culvert, Clover), New Puddle Marina and the
  Loch Moss dock. Five boats (Walnut Dinghy, Gravy Boat, Clog Cruiser, Watering-Can Steamer, HOA Patrol Boat), driven
  with the mower controls; gnomes bob in water and cannot fire; mowers stall in deep water.
- **Wildlife** (`src/critters.ts`, `src/critters/`, local to each browser): Cloverfield herds (tip a cow on foot, herd
  with the Combine or Mulch Spreader), the Drey Gang squirrels (raids, stolen mowers, scatter them by shooting),
  Fells snowmen, sgnowmes and polar bears who only shrug, Tallgrass Commons giant grass (hides you from the Hat Watch)
  and bees (knock a hive, lose the swarm). Animals are knocked over and run off; they never die.
- **Tessie** (`src/tessie.ts`, `src/quests/tessieQuest.ts`): the side quest unlocks after The Salvage Raid (chapter 3; older saves keep their earlier rolled beat), then
  Driftwood waits on the Loch Moss shore; afterwards Tessie surfaces now and then and can be ridden.
- **Achievements:** Herd It Through the Grapevine, Tipping Point, Drey Day, Snow Joke, Unbearably Chill, Bee Line,
  Captain Clay (every boat), plus the four Tessie ones; each gives gear.
- **Dev and demo params:** `?at=x,z[,yaw]`, `?terrain=hill`, `?tessie=now` (unlock the quest), `?tessie=surface`
  (Tessie surfaces near you after 2.5 s), `?mount=<kind>&mountat=x,z[,yaw]` (start at the wheel of that vehicle at
  that spot; works for boats), `?debug` (`window.__gta`).
- **Demos:** `demos/boat-river-run.json`, `demos/drey-raid.json`, `demos/tessie-surfacing.json`,
  `demos/hills-drive.json` (`npm run demo -- games/gnome-theft-auto/demos/<name>.json --gif` with the dev server on
  5198).
- **Perf check:** `node tools/gta-perf.mjs [url]` drives across every region at a 390x844 phone viewport and prints
  frame times and draw calls per region.

## Online

Free roam through `@lawn/mp` (game id `gnome-theft-auto`, 1-16 players, drop-in; `?room=CODE` for a private town).
There is no host: each player relays their own gnome and mower, and tells another player when their bullet hit them.
Townsgnomes, traffic and the Hat Watch are local to each browser.

Everyone online shows their name over their head. Other players are dots on the minimap (one pinned to the rim when it is off the map, so you can still see which way) and names on the big map; Options > Multiplayer > Players on the map turns those dots off (on by default, per browser).

**Passengers:** a mower has seats. Stand beside another player's mower and press E (Ride on touch) to ask for a seat. The driver's game hands out the first free seat (`src/seats.ts`: the seat list lives on the driver's page, a seat is seat 0 for the driver and 1.. for passengers, and `spec.passengerSeats` in `src/config.ts` places them). A rider sits in their seat and goes where the driver goes; E gets them off, and the driver getting out puts every rider off. Seats are on the open mowers, the Push-Mower Bike, Ride-On, Zero-Turn, Combine, Crop Duster, Whirligig, Lowrider, Boot Float and Mulch-Spreader. The Snail-Coach and HOA van have none yet, as their cabins are closed. Earn the Carpool achievement (ride along once).

Online is on by default: the page joins the public town as it loads, with no menu. The HUD shows
"Online: N in Turfton" under the minimap. The connection is `resumable`: a phone that switches apps gets its seat back
(within 45 s), and returning to the tab reconnects at once instead of waiting for the retry timer. Locally the game uses
`ws://localhost:8787/ws` (`npm run dev -w packages/mp-server`); with no server it is the same game alone.

## Testing

- `npm test -w games/gnome-theft-auto` includes `src/layout.golden.test.ts`: it builds the whole world (under a
  stand-in `document`) and compares every collider, walk point, parked mower, prefab placement and scene object with
  `src/data/layout.golden.json`, captured before the world moved into documents. Never regenerate it for a refactor;
  only for a deliberate layout change (`UPDATE_GOLDEN=1 npx vitest run src/layout.golden.test.ts`).
  `src/levels.test.ts` validates the documents.


`?debug` exposes the live modules as `window.__gta` (player, vehicles, npcs, watch, world, chase, hud, weapons) for
scripted checks.

## Driving

Every ground vehicle you drive (Push-Mower Bike, Ride-On, Zero-Turn Racer, Combine) uses `@lawn/vehicle` (see `packages/vehicle/README.md`): suspension and
weight transfer, Pacejka tyres, speed-aware steering, traction control and a handbrake slide. Traffic and the flyers (Crop Duster, Whirligig) stay arcade.

- **Each vehicle drives like itself.** `src/handling.ts` holds a *profile* per vehicle: a stock setup of 11 tuning knobs (top speed, pickup, brakes, grip, balance, steering lock, driver aids, handbrake, weight, suspension, ride height; neutral is 1, balance 0) and the *range* a garage may move each knob within. The bike is light and lively, the zero-turn grips and flicks its tail on the handbrake, the combine pushes wide and rolls. A new vehicle is a profile entry, not new physics.
- **Weight shift.** The rider leans to the outside of a turn (turn left and the gnome rocks a little right) on top of the chassis's own roll and pitch. Subtle on purpose; `LEAN_MAX` and `profile.lean` in `handling.ts` set it. It works under Arcade too (from speed and yaw rate).
- **Driving realism is a cheat.** The gear button under the minimap (or O, or Start on a pad) opens Options > Cheats > Driving realism: Arcade (the original flat model), Casual (default), Open World, Simcade, and the silly ones, Drift Mower and Dewy Lawn. It changes every ground vehicle live and is remembered per browser. `?tune=<id>` picks one for a visit, `?drive=arcade` starts in Arcade.
- **Garages:** *Pay 'n' Glaze* (`PAY_N_GLAZE.bay`, see "Pay 'n' Glaze" below) is the custom shop; *Side-Valve Salvage* (`SIDE_VALVE.bay`) opens a mobile-friendly handling modal over the other ten `@lawn/vehicle` knobs (`getSetup` / `setSetup` / `resetSetup`). The old ride-height knob is now the Pay 'n' Glaze ride-height slider.
- **Party Slice:** `#minigame` plays `gta-getaway` (*Turfton Getaway*, 45 s Zero-Turn race from The Gnomecino to Pay 'n' Glaze dodging Hat Watch cruisers) standalone against 3 CPUs, and Gnome Party auto-discovers it.
- A tipped-over vehicle is stood back up after 1.5 s. Hold a slide for a second (the Zero-Turn and the handbrake will do it, even in Casual) for the Sideways Gnome achievement.
- **Online works**: a driven vehicle is broadcast like any other. Other players see its pose; physics and damage run on the driver's own page.
- Handbrake: Space, A on a pad, or the Handbrake button on touch (hidden in Arcade). Throttle/steer/brake are W/S/A/D or the stick (down = brake, then reverse from a stop).
- `&mount` starts you already driving a ride-on mower on the x = 0 road (used by `demos/sim-driving.json`).
- `npm test -w games/gnome-theft-auto` checks the config builder, that every vehicle survives every mode (full lock plus handbrake at top speed, a hard slalom: no flip), and the lean.

## The Lost & Found Speedway

A race circuit on the Dust Flats' alkali pan, north-east of the airfield (centre about (741, -467)), reached by the dirt
road north from the east-outer highway at (790, 48). 1.27 km a lap, clockwise on the map: the main straight past the
Book Stack and Sneaker grandstands, a climb up the east side, the banked Cooler hairpin, the Rake-Handle Hop under the
giant hose loop, the north S-bends, the infield hill and the Frisbee Crest, then the last hairpin onto the straight.
Everything stands round the Great Spill, the giant Tall-One junk the track was built from (lore:
`docs/lore/entries/apocrypha/lost-and-found-speedway.md`).

- **Free roam:** drive anything with wheels over the line and the lap clock runs (top centre); pass all 12 checkpoints in
  order for a lap time. Best laps are saved per vehicle (`gta-speedway-laps-v1`). Achievements: a first lap, a lap under 48 s.
- **Pay 'n' Glaze (Speedway):** the same shop as Turfton's, in the pit lane; drive in and press T (or the button).
- **The Fizz Cup:** four races from Burdock "Big Flag" Bellweather at the race desk (the white "?" giver): Rookie
  Mow-Down (Ride-Ons, podium), Low & Loud Derby (Lowriders), Snail-Coach Endurance, the Final (Zero-Turns vs Vinnie and
  Dock). Each has an intro on the grid and a podium scene after a win. They open along the story (`SIDE_UNLOCKS`).
- **Test params:** `?race=1..4` makes that race the active quest; `?autopilot[=grip]` lets a racing driver take the
  wheel of the player's ground vehicle at the track; `?cutscene=race-<id>-intro` / `-podium` plays a scene.
- **Minimum lap time:** `src/raceTrack/track.test.ts` laps a stock Zero-Turn with a racing driver at every nerve level:
  about 55 s with the default handling, 36 s in Arcade (35.7 s with boost). The lap is never under 35 s.
- **Online:** each player times their own laps in free roam; the races are single-player (rival AI and race state would
  need a host-run race on @lawn/mp, about as big again as this feature).

## Pay 'n' Glaze (vehicle customisation)

Drive a ground vehicle into the Pay 'n' Glaze bay (a button appears, or press T): the shop **warps you to a showroom off the map** (a great tilted clay pot with a lit doorway, a rack of spray cans, a giant wrench, tyres, buckets and dirt; `src/glazeStage.ts`, built from `glaze-stage-*` prefabs) while the world carries on around where you left, and warps you back on Done. Tabs: **Paint** (colour, 11 finishes, 16 special sprays with colour and lucky number, neon underglow), **Wheels** (ride height, 11 tyres, 12 rims, rim colour, wheel size, front and rear camber), **Lights** (12 headlight styles, 10 beam colours, a beam preview), **Body** (11 spoilers, 11 seats, 10 steering wheels, 13 hood ornaments, up to 4 of 12 extras), **Trim** (5 grilles, 5 bumpers, 5 canopies, 4 mirrors, 4 exhausts, 7 horns you can hear) and **Handling** (the Side-Valve knobs). The vehicle changes live under the sheet while the camera orbits it; the price is itemised; Buy charges Acorns and saves the loadout for that vehicle model in this browser, and any vehicle of that model you drive next wears it. *Quick Respray* is the old 50 Acorn repair, new coat and heat clear.

- Built on `@lawn/glaze` (`packages/glaze/README.md`): `vehicles.ts` builds every ground vehicle with `buildGlazeBody` + `attachLoadout`, so the shop, other players and tests all drive the same `Loadout`. Flyers and boats are not dressed.
- Where things go on each vehicle (lamps, decal panels, steering grips) is hand-tuned in `src/glazeMounts.ts`; the Ride-On's wheel is moved into the gnome's lap by a game-private variant of its prefab (the shared catalogue prefab is untouched).
- **Hands on the wheel:** `src/driverHands.ts` swings the driver's arms onto grip markers under the steering pivot (`reachArm` in `@lawn/glaze`), eased in and out, for you, traffic drivers and online players. Vehicles with no gripable wheel keep the resting pose.
- **Suspension:** the body rides on springs over the wheels (`src/suspension.ts`, `rig.setSuspension`): it dips under braking, squats on acceleration, rolls in corners, heaves over bumps and lifts on a lowrider hop. A visual effect only; the driving model is unchanged.
- Ride height lowers or lifts the body (and the rider and the wheel) over the wheels, and sets the physics model's centre-of-mass height (`comHeightFor` in `handling.ts`): slammed is steadier, lifted rolls more. It replaces the old Side-Valve "Ride height" knob.
- **Online:** your look is sent as a short text code (a `look` message) when it changes and re-sent to each player who joins.
- Achievements with gear rewards: New Coat. Who Dis?, Slammed, Camber Gang, Show Pony, Full Glaze.
- Demo stage: `?mount=<kind>&glaze=<json loadout patch>`, `&shop` (open the shop), `&acorns=<n>`, `&time=golden|night|noon`, `&showcase=<s>` (close orbit while driving). Record it with `npm run demo -- games/gnome-theft-auto/demos/pay-n-glaze.json`. `?debug` exposes `__gta.glaze.look(patch)`.
- Plan: `docs/roadmaps/pay-n-glaze.md`.

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
| D-pad left | call the Turfton Taxi | | |

In Options the pad is the panel's: D-pad or left stick up / down to choose, A to pick, B or Start to close.
Pad steering is analog (deadzone and gamma, no key smoothing).

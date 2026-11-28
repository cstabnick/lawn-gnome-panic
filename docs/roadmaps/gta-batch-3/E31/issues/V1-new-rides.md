Epic: E31 wave 1 (prefabs and systems)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first. For the prefab format read `docs/roadmaps/prefab-library/_common.md`
(IGNORE its "Environment" section and "Units" line: vehicle prefabs are small models scaled up by the game's
`VEHICLES[kind].scale`).

## Goal
Three new civilian vehicles are drivable and pass every vehicle test: the Unmown Ranger Buggy (`ranger-buggy`), the
Snail-Shell Camper (`shell-camper`) and the Ninety-Nine Cone Van (`cone-van`, a Saltbucket ice-cream van).

## Already done by the lead
`types.ts` VehicleKind (+3), `net.ts` VEHICLE_CODES (+3), `config.ts` VEHICLES entries (search `'ranger-buggy'` in
`games/gnome-theft-auto/src/config.ts`): ranger-buggy open 'hop' 2 seats scale 1.6; shell-camper closed 'door' (doors
`door-left`/`door-right`) 2 seats scale 1.8; cone-van closed 'door' driver only scale 1.8.
Today these tests fail and must pass when you are done:
`src/driveGrips.test.ts` (every kind needs a `DRIVE_CONTROLS` entry and hands that reach the drawn control) and
`src/sound/engines.test.ts` (every kind needs its own engine entry).

## Read first
- `packages/prefabs/src/catalog/gta-euro-fleet.ts` (the Deux-Pots, `gta-deux-pots`, open, and the Crepe Van,
  `gta-crepe-van`, closed with door pivots: copy their structure: `seat`, `pivots` wheel-0..3, `steer`, doors)
- `games/gnome-theft-auto/src/config.ts` VEHICLES entries for 'deux-pots', 'crepe-van' and the three new kinds
- `games/gnome-theft-auto/src/driveGrips.ts` (DRIVE_CONTROLS) and `src/driveGrips.test.ts`
- `games/gnome-theft-auto/src/sound/engines.ts`
- `games/gnome-theft-auto/src/handling.ts` (PROFILES, optional per-kind handling)

## Change
- `packages/prefabs/src/catalog/gta-living-rides.ts` (exists, empty `GTA_LIVING_RIDES`, registered): three prefabs,
  modelled like the euro fleet (same unit scale, nose +z, `seat`, wheel pivots, a `steer` steering wheel pivot, door
  pivots on the closed ones):
  - `gta-ranger-buggy` — open two-seat preserve buggy: olive green (tint), roll bar, chunky tyres, a spare wheel on the
    back, a rack with a coiled hose and a net, a little "RANGER" plate (coloured block), a binocular case on the dash.
  - `gta-shell-camper` — a small camper van whose whole back is a big spiral snail shell (tint, default cream/brown
    swirl via 2-3 stacked tori or balls), a cab in front with two doors, round headlamps, a bicycle on the back, curtains.
  - `gta-cone-van` — a boxy ice-cream van, pastel pink/white (tint/trim), a serving hatch on the right side, a giant
    plastic ninety-nine cone on the roof (cone + ball + small flake box), a chime speaker.
  Each: 5-6 examine lines in the Gnomes of Gnomomia voice.
- `games/gnome-theft-auto/src/config.ts`: you may edit ONLY the three E31 entries (`'ranger-buggy'`, `'shell-camper'`,
  `'cone-van'`) so `seat`, `passengerSeats`, `doors[].at`, `radius` match your prefabs times `scale` (as the euro rides do:
  config seat = prefab seat x scale).
- `games/gnome-theft-auto/src/driveGrips.ts`: add `DRIVE_CONTROLS` entries for the three (the buggy like the deux-pots,
  the closed two like the crepe van).
- `games/gnome-theft-auto/src/sound/engines.ts`: an engine entry each (buggy: a buzzy little petrol; camper: a slow
  wheezy diesel; cone van: a mid diesel). If a horn/chime table keyed by kind exists in the sound folder, give the cone van
  the ice-cream chime there only if it is a one-line data change.
- `games/gnome-theft-auto/src/handling.ts`: optional PROFILES entries (buggy grippy off-road; camper heavy, slow to turn).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/driveGrips.test.ts src/sound/engines.test.ts src/vehicles.glaze.test.ts src/handling.test.ts` passes.
- `npm test -w packages/prefabs` passes for your ids.
- `npx tsc --noEmit -p games/gnome-theft-auto` clean for your files.

## Out of scope
`types.ts`, `net.ts`, `traffic.ts`, `fleet.ts`, other VEHICLES entries, other catalog files.

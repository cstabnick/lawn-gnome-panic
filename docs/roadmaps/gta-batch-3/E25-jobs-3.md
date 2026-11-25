# E25 Jobs III: garbage truck, firefighting, Gnomazon warehouse
Wave: 5 · Depends on: E05 (interiors), E07 (Gnomlet), E08 (inventory), E09 (sound), E10 (homes), E24 (workplace jobs) · Kind: Content
Source items:
- L107 add garbage truck job
- L108 add firefighting job
- L109 add warehouse gnomazon worker packing minigame job

## Goal
Three more jobs on the E24 workplace-job framework (same career save, levels, pay card and Jobs app): a bin round in a
new garden-scale bin lorry with a lift-arm minigame, a fire brigade with a watering-can fire engine, a hose and a
ladder answering fire calls round the world, and a packing shift at the Gnomazon Fulfilment Centre where a manager-bot
"encourages" you. Plus a reusable fire effect system other epics can light and put out.

## Scope
In:
- **Framework** (lead, foundation): `WorkJobId` gains `'garbage' | 'firefighter' | 'gnomazon'`; `WORK_JOBS`,
  `WORK_PAY`, `WORK_ACHIEVEMENTS`, `WorkStats`/`WorkExtra`/`JobStats` counters (additive parse, same `gta-jobs-v1`).
  `WorkDeps` gains `fx`, `seatPlayer`; `WorkJobRuntime` and `Workplaces` gain an optional `waypoint()` that app.ts
  routes to (after the vehicle jobs, before quests). Site slots `bin-depot`, `fire-station`, `gnomazon-fc`. Stubs for
  every module. Two vehicle kinds `bin-lorry` and `fire-engine` registered (types, config, net codes appended).
- **Shared shift HUD** `workplaces/shiftHud.ts`: top panel (title, lines, meter) and one 44 px action button (I key /
  pad R3) for the two driving jobs.
- **Garbage**: the Turfton Bin Depot beside the Compost Heap (Mags Wheelie, foreman). "Start a bin round" spawns the
  Bin Lorry; a round is 6-14 kerbside wheelie bins along city streets (road graph). Stop beside a bin -> the lift-arm
  minigame (Grab on the swing, hold Lift into the tip zone, hold Lower and let go when the swing is centred). Over-tip
  = a spill (litter left on the street, an HOA litter citation off the pay); neat set-downs = tips. Back to the depot
  to tip the load into the heap and end the round (shift card).
- **Firefighting**: Fire Station No. 1 on the Mossy Wood edge (Chief Hydra Pumpwell). "Answer the bell" spawns the
  Watering-Can Pumper; calls: a wheelie bin, a garden shed, a barbecue gone wrong, a toadstool (Mossy Wood); level 3+
  calls add a rescue (a gnome on a shed roof / Asphalt the cat up a lamp post). Park near the fire -> "Man the hose":
  aim pad + hold Spray; the stream is ballistic and douses where it lands; a tank empties and refills at hydrants (the
  14 inner-city ones plus one the call places nearby). Ladder rescue: hold Raise, let go in the band. Fires grow and
  spread to nearby fuel until put out; a call ends when all fires are out (or burnt out: low stars).
- **Fire system** `src/fire/`: pure `sim.ts` (ignite, step, douse, spread, burn-out) and `view.ts` (flames, smoke,
  glow light pool of 2, scorch decal on a draw layer, steam when doused), reusable by any epic; documented in
  `E25/contracts.md`.
- **Gnomazon**: Gnomazon Fulfilment Centre FC-1 in the Dust Flats: a big shed with loading docks outside and a
  walk-in warehouse floor interior (`gnomazon-floor`). "Clock in" at a packing station opens the packing minigame:
  orders slide in, pick the items off the shelf grid, choose the right box (S/M/L), tape it (swipe/hold), pick the
  right label, send; beat the quota against the clock while KPI-9 ("Kippy"), the manager-bot, "encourages" you.
  Charming satire: titles never really change, the break room is "coming soon", nobody is mean.
- Each job: Gnomlet Jobs board rows (automatic from `WORK_JOBS`), levels and pay through `finishShift`, 3 achievements
  each with wearable rewards (9), prefabs (vehicles, props, buildings, rewards), synthesized sounds, lore entries and
  rulings R-207..R-209, environmental storytelling at each workplace, 3-spot screenshot pass in `E25/screens/`.
Out: shared online fires (fires and calls are per player, see Online), other players seeing the arm/ladder/hose move
(only the vehicle pose is relayed), dealer stock for the two work vehicles, a Gnomazon party slice (fits the size rules;
backlog note, not built: load limit), story quests at the workplaces (E18/E20).

## Code pointers (confirmed)
All under `games/gnome-theft-auto/src/`. Framework: `jobs/types.ts` (`WorkJobId`, `WORK_JOB_IDS`, `WorkStats`,
`JobStats`), `jobs/career.ts` (`emptySave`, `recordShift`, `WorkExtra`, `statsOf`), `jobs/workDefs.ts`,
`workplaces/{types,index,shift,shiftCard}.ts`; app.ts `installWorkplaces({...})` (~l.1095) and the route block
(`jobs.waypoint() ?? quests.waypoint()`, ~l.2175). Vehicles: `types.ts VehicleKind`, `config.ts VEHICLES`, `net.ts
VEHICLE_CODES` (append), `sound/engines.ts`, `handling.ts PROFILES`, `driveGrips.ts DRIVE_CONTROLS`, `anim/rideAuto.ts`,
`audio.ts` engine switch; custom pivots read with `v.object.getObjectByName(name)` (re-read after damage). Effects:
`fx.ts` (`fire`, `waterJet?`, `smash?`), `Fx` in `types.ts`. Hydrants: `destructibles.ts` `hydrantCoords` (14),
prefab `kerb-hydrant`. Places: `homes/data.ts homePlaces()`, `jobs/places.ts LAND_PLACES`, road graph
`world.roads` (`RoadGraph`, `laneOffset`), `config.ts ROAD_WIDTH`. Safe ground: `lockup/safeSpot.ts findSafeSpot`,
`boxesBlocked`, `parking.ts circleClearOfStreets`. Interiors: `interiors/registry.ts defineInterior`. Spots:
`interactables.ts addInteractSpot`. Sites: `sites.ts siteById/anchorOf/siteRect`. Depth: `@lawn/depth flatLayer/LAYER`.
Sound: `sound/bus.ts registerSound/play2d/playAt`, example `workplaces/sounds.ts`.

## Contracts this epic provides
- `WorkJobId` `'garbage' | 'firefighter' | 'gnomazon'`, their `WORK_JOBS` rows and counters (`JobStats.bins`,
  `fires`, `rescues`, `parcels`): quest probes can read them.
- `Workplaces.waypoint()` / `WorkJobRuntime.waypoint?()`: a workplace job can drive the HUD route.
- `workplaces/shiftHud.ts createShiftHud(ui)`: a reusable driving-shift HUD with one action button.
- `fire/`: `createFireField()`, `ignite`, `douse`, `stepFires`, `createFireView(scene, fx)`: any epic can light a fire
  (a story set piece, a barbecue at a party) and let water put it out.
- Vehicle kinds `bin-lorry`, `fire-engine` (cutscenes and story can spawn them; pivots `arm`, `ladder`, `nozzle`).
- Interior `gnomazon-floor`; sites `bin-depot`, `fire-station`, `gnomazon-fc`.

## Contracts this epic consumes
E05 `defineInterior`; E07 Gnomlet (Jobs board already lists every `WORK_JOB_IDS` row); E08 `addItem` (not needed);
E09 sound bus; E10 `homePlaces()` for fire-call addresses; E24 `finishShift`, shift card, `workLevel`.

## Online / mobile / achievements / prefabs / lore notes
- Online (`docs/roadmaps/gta-online-sync.md`): jobs are per player (own state, own save). The two vehicles are relayed
  like every vehicle (codes appended to `VEHICLE_CODES`). **Fires: per player, decided.** A fire call and its fires
  exist only on the client that took the call; nothing goes on the wire (a shared fire would need an owner, a new hub
  system and spread sync, doubling the epic). Another player sees your Pumper parked and nothing burning. Noted as
  deferred.
- Mobile: every step is a tap/hold/drag on 44 px+ targets: Grab/Lift/Lower one big hold button, hose aim pad + Spray
  hold, ladder hold, packing as taps and one swipe (with a hold fallback). Layouts at 390x844 and landscape.
- Achievements (9): Bin Day, Not a Drop, Kerb Appeal; Hose Gnome, Ladder Gnome, Barbecue Season; Fulfilled, Beat the
  Bot, Time Off Task. Rewards are new wearables (head/back/neck/hand) in the three new catalog files.
- Lore: new entries for the depot, Mags Wheelie, the Bin Lorry, Fire Station No. 1, Chief Hydra Pumpwell, the Pumper,
  Gnomazon, FC-1, KPI-9; rulings R-207 (bins and the Compost Heap), R-208 (the fire brigade), R-209 (Gnomazon). If
  E13/E31 merge first with these numbers, the orchestrator renumbers.

## Risks and open questions (decisions taken)
- Vehicle jobs vs workplace jobs: the two driving jobs are **workplace jobs** (`WorkJobId`) that spawn their own
  vehicle; the gig machine (`JobId`) is keyed by vehicle rules and comfort ratings that do not fit a lift-arm or a hose.
- Minigames hold the controls the same way E24 does (`isOpen()` -> `econOpen`), with the showroom camera locked on the
  bin or the fire (`fixedYaw`).
- Fire visuals: `fx.fire` puffs are small; `fire/view.ts` adds instanced flame cones and a light pool so a fire reads
  at 60 m and on a phone. Performance: at most 12 burning points per call, view culled past 220 m.
- Placement: three new slots (bin-depot (-240, -97) by the Compost Heap reserve, fire-station (-245, 135), gnomazon-fc
  (255, 92), 80 x 40, natural ground: levelling it lowered the ground under a ch4 cutscene camera). The new slot shifted
  the desert scatter so a mesa landed under the beltway: desert scatter now keeps off skyway embankments
  (`biomes.ts nearSkywayFoot`). The layout golden regenerated.

## Done when
`npm run build -w games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto`, `npm test -w packages/prefabs`,
`npm test -w packages/achievements`, `npm test -w packages/gnome`, `npm run lore`; smoke at each workplace; screenshot
pass in `E25/screens/` (3 spots per workplace); storytelling AC (a-e) met at the depot, the station and FC-1.

# E24 Jobs II: chef, mechanic, comedy stage
Wave: 5 · Depends on: E05 (interiors), E07 (Gnomlet), E08 (inventory, glaze repair), E09 (sound), E30 (Pardonlin) · Kind: Content
Source items:
- L30 add a chef job, so that players can cook and make some dishes. should be fun.
- L110 add comedy actor job where the entire thing is to just sit there while your character goes through something rather unfunny and gets grilled by the crowd
- L111 add a mechanic job whre you customize a clients car

## Goal
Three on-foot workplace jobs that use the sim-jobs career (levels, XP, pay, the Jobs app) without being vehicle gigs:
a fun touch cooking minigame in the Route South Acorn Diner kitchen, client work orders customised with the real
Pay 'n' Glaze shop and rated against the brief, and a mostly passive comedy set in a Pardonlin cellar where the
player's own gnome bombs and the crowd grills it.

## Scope
In:
- **Framework** (lead, foundation): `WorkJobId = 'chef' | 'mechanic' | 'comedy'` beside `JobId` (not inside it: the
  vehicle runtime keys `Record<JobId, ...>` by vehicle rules). Career records in the same save `gta-jobs-v1`
  (`JobsSave.work`, `workStats`, additive parse), `recordShift`, `jobs/workDefs.ts` (`WORK_JOBS`, `WORK_PAY`, `workPay`,
  level titles, `WORK_ACHIEVEMENTS`), `workplaces/` (`installWorkplaces`, `finishShift`, shift card), app.ts wiring
  (held controls through `econOpen`, update, blips), camera `ShowroomTarget.fixedYaw` for a locked stage view,
  `glazeClient.ts` (client-car registry; app.ts keeps a client car's look).
- **Jobs app**: a "Workplaces" section in the Jobs board (level, XP, perks, "Show me" route to the workplace).
- **Chef**: kitchen interior `acorn-diner-kitchen` behind the existing diner set (stage `south-highway-diner`, door on
  its west front), Sage Ladle at the pass, Frank through the hatch; ticket rail; eight dishes (schedule doc section 4)
  made of chop/stir/pour/heat/flip/plate touch mini-steps; rush hour at Noon and Dusk (12 tickets, bonus); stars per
  ticket from accuracy and speed; dishes taken home go in the bag (`diner-<dish>` snacks that heal).
- **Mechanic**: a work-order board and client lot at Turfton's Pay 'n' Glaze; a client (a gnome by their car) gives a
  brief and a parts budget; the player drives the car into the bay; the shop opens in **client mode** (start = the
  client's look, no Buy, "Hand back the keys"); `scoreBrief` rates how well it matches; pay via `finishShift`.
- **Comedy**: Le Petit Groan, a cellar club off Pardonlin's Grand Platz (`le-petit-groan`); "Go on stage" puts the
  player's gnome on stage with a locked camera; a pure show clock runs a written set (five sets, escalating awful),
  the crowd answers with silence, coughs, groans, heckles and a tomato or two; one button: **Double Down**; pays 6-12
  Acorns plus 2 per tomato (hazard pay).
- Each job: achievements with wearable rewards (9, ids in `workDefs.ts`), prefabs per job, synthesized sounds, lore
  entries and rulings R-196..R-198, environmental storytelling at each workplace, 3-spot screenshot pass.
Out: Gnoma's guest-teacher scene (level-3 shift), the `sq-chef-first-shift` side quest (E18/E20 own side quests; the job
works from day one), Pie of the Day's "#16" gate (it unlocks at level 5 instead), a client who drives off in traffic
(the car and client leave when the player walks away), shared online rooms (jobs are per player), sharing code with
`cooking-gnoma` (its steps are Phaser scene objects; extracting would change it: GTA writes DOM steps against its own
types, per the standing decision).

## Code pointers (confirmed)
All under `games/gnome-theft-auto/src/`. Career: `jobs/career.ts`, `jobs/types.ts`, `jobs/defs.ts` (`LEVEL_XP`,
`MAX_LEVEL` 6), board `jobs/board.ts`, `jobs/runtime.ts` (`boardView`, `openBoard`, `deps.phone.addApp`). Interiors:
`interiors/registry.ts defineInterior`, kit in `interiors/kit.ts`, example `pardonlin/interiors.ts` (`putIf`,
`gta:interior-say`). Diner set: `quests/stages/cloverfield.ts` stage `south-highway-diner` (building `gsr-bldg-acorn-diner`
at (16, 252), yaw -pi/2, solid box x 10.6..21.4, z 245.7..258.3; sign at (6, 245)). Pay 'n' Glaze: `config.ts PAY_N_GLAZE`
(landmark (90, 150), bay radius 7), `glazeShop.ts`, `garages.ts openGlaze`, `glazeBay.ts`. Vehicles: `vehicles.ts
createVehicle/removeVehicle/setVehicleLook`. Inventory `inventory.ts registerItem/addItem`. Sounds `sound/bus.ts
registerSound/play2d/playAt`. Emotes on the player: `window.dispatchEvent(new CustomEvent('gta:emote', { detail: id }))`.
Camera `camera.ts ShowroomTarget`. Pardonlin Grand Platz around (-1500, -200) (`pardonlin/layout.ts DISTRICTS`).

## Contracts this epic provides
- `WorkJobId`, `WORK_JOB_IDS`, `JobsSave.work`, `JobsSave.workStats`, `JobStats.workLevels/dishes/cars/sets` (quest probes
  can read them), `recordShift`, `anyJobAtLevel`, `workPay`, `WORK_JOBS`, `WORK_ACHIEVEMENTS`.
- `workplaces/shift.ts finishShift(deps, job, end)`: any later on-foot job (E25 garbage, firefighting, Gnomazon) can reuse it.
- `ShowroomTarget.fixedYaw / fixedPitch` (locked camera on a target).
- `glazeClient.ts setClientOrder/clientOrderFor/isClientVehicle` (Pay 'n' Glaze client mode).
- Interiors `acorn-diner-kitchen`, `le-petit-groan` (story epics can stage scenes there; #13 and #20 use the diner).

## Contracts this epic consumes
E05 `defineInterior`, `interiorToWorld`, `currentInterior`; E07 Gnomlet (the Jobs app is already a Gnomlet app via
`phone.addApp`); E08 `registerItem/addItem`, glaze `PanelCtx`; E09 sound bus and anim ids; E10 `homes/data.ts`
(Sage's work is `stage:south-highway-diner`); E30 Pardonlin layout.

## Online / mobile / achievements / prefabs / lore notes
- Online (`docs/roadmaps/gta-online-sync.md`): per player, like the existing jobs. No protocol change. A client car is a
  normal local vehicle; inside an interior the player is relayed at the door (E05).
- Mobile: every step is tap / hold / drag on 44 px+ targets, layouts fit 390x844 and landscape; the comedy set needs no
  input at all (Double Down and Walk off are 44 px buttons).
- Achievements (9): Order Up, Five Stars, The Whole Menu, Customer Is Always Right, Nailed the Brief, Creative
  Differences, Tough Room, Fresh Produce, Double Down; rewards are new wearables in `gta-diner.ts`, `gta-mechanic.ts`,
  `gta-comedy.ts`.
- Lore: Sage Ladle and the diner exist; new: Chrome-Knuckle Cass (Pay 'n' Glaze custom-shop foreman), Le Petit Groan
  and Mireille Sans-Rire (its booker, who has never laughed), the diner menu. Rulings R-196 (the menu), R-197 (work
  orders at Pay 'n' Glaze), R-198 (Le Petit Groan and Pardonlin comedy). If E13/E15 merge first with the same numbers,
  the orchestrator renumbers at merge (as before).

## Risks and open questions (decisions taken)
- JobId union: kept closed; workplace jobs are a parallel id set sharing the save, levels and the board.
- Client car driven by the player would get the player's per-model loadout: app.ts `takeWheel` skips client cars.
- The comedy staging uses the showroom camera (a locked yaw) rather than the cutscene system: the set is interactive
  (Double Down) and must not block quests or saves.
- Kitchen UI is a full-screen DOM overlay (the room stays visible behind on landscape); controls held via `econOpen`.

## Done when
`npm run build -w games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto`, `npm test -w packages/prefabs`,
`npm test -w packages/achievements`, `npm test -w packages/gnome`, `npm run lore`; smoke at each workplace; screenshot
pass in `E24/screens/` (3 spots per workplace); storytelling AC met at the kitchen, the client lot and the club.

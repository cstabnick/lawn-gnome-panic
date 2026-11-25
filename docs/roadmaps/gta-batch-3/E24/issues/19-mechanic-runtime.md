Epic: E24-3 (workplace runtimes)
Depends on: E24-2 (briefs, client lot, glaze client mode, prefabs, sounds are in place)

## Environment
Read `docs/roadmaps/gta-batch-3/E24/_env.md` first. Two other workers write the chef and comedy runtimes at the same
time (other files). You may run ONE dev server on port **5352** only; stop it when done.

## Goal
The mechanic job works end to end at Turfton's Pay 'n' Glaze: take a work order at the board, meet the client by their
car, read the brief, drive the car into the bay, glaze it in the shop's client mode, hand back the keys, get rated and
paid, and the client leaves with the car.

## Read first
- `games/gnome-theft-auto/src/workplaces/mechanic/runtime.ts` (stub `installMechanic(deps)`), `workplaces/types.ts`,
  `workplaces/shift.ts` (`finishShift`, `workLevel`).
- `games/gnome-theft-auto/src/workplaces/mechanic/types.ts`, `mechanic/briefs.ts` (`pickBrief(level, seed, lastId)`,
  `scoreBrief(brief, start, final, partsCost)`), `mechanic/lot.ts` (`buildClientLot(scene, world)` -> `{ board, car,
  client }`).
- `games/gnome-theft-auto/src/glazeClient.ts` (`setClientOrder`, `clearClientOrder`, `ClientOrder`).
- `games/gnome-theft-auto/src/jobs/visuals.ts`: how a waiting fare gnome is made and animated (`makeGnome(scene,
  look)`, `gnomeState(...)`, `model.update(...)`, `randomTownLook()` in `gnomes.ts`), and removed.
- `games/gnome-theft-auto/src/vehicles.ts`: `createVehicle(scene, kind, x, z, yaw, tint?)`, `setVehicleLook(v, look)`,
  `removeVehicle(scene, v)`; `games/gnome-theft-auto/src/tubing/runtime.ts` ~l.620-700 for pushing a created vehicle
  into `deps.vehicles` and splicing it out.
- `games/gnome-theft-auto/src/interactables.ts`: `addInteractSpot({ x, z, prompt, run })` (returns a remover; `run`
  returns true when handled).

## Change
- `games/gnome-theft-auto/src/workplaces/mechanic/briefCard.ts` (new, DOM): `showBriefCard(ui, { client, vehicleName,
  text, wants: string[], budget, level }, onOk)` - a card like `workplaces/shiftCard.ts` (inject CSS once, id
  `gta-brief-card-css`, element id `gta-brief-card`): "🔧 Work order", the client's name, the brief in quotes, "They
  want:" with each want's `says`, "Parts budget: N 🌰", a hint "Drive it into the Pay 'n' Glaze bay and press Glaze.",
  and a 44 px "On it" button. Returns `{ close(): void; isOpen(): boolean }`.
- `games/gnome-theft-auto/src/workplaces/mechanic/runtime.ts`, `installMechanic(deps)`:
  - Lazily on the first `update` (the world is ready): `lot = buildClientLot(deps.scene, deps.world)`; add an interact
    spot at `lot.board`: prompt `'Take a work order (mechanic)'` when no order is open, else `'Work order: <client>'`
    (shows the brief card again).
  - Take an order: `deps.blocked()` reason -> toast. Else `brief = pickBrief(workLevel('mechanic'), Date.now() &
    0xffff, lastId)`; spawn the car with `createVehicle(deps.scene, brief.vehicle, lot.car.x, lot.car.z, lot.car.yaw)`,
    push into `deps.vehicles`; `start = normalizeLoadout({ ...defaultLoadout(<a dull tint>), ...brief.start })`
    (`@lawn/glaze`), `setVehicleLook(car, start)`; spawn the client gnome (`makeGnome` with
    `{ ...randomTownLook(), ...brief.look }`) at `lot.client`, idling each frame; show the brief card; play
    'mech-keys' (`play2d` from `../../sound/bus`, after `registerWorkSounds()` from `../sounds` at install).
    `setClientOrder(car, { title: brief.client + "'s " + <vehicle display name: VEHICLES[kind].name from config.ts>,
    brief: brief.text, budget: brief.budget, start, finish, cancel })`.
  - `finish(look, partsCost)`: `const s = scoreBrief(brief, start, look, partsCost)`; play 'mech-air-wrench';
    `deps.getOut()`; `finishShift(deps, 'mechanic', { units: [{ stars: s.stars }], extra: { cars: 1, perfectCars:
    s.stars === 5 ? 1 : 0 }, quote: brief.client + ': ' + (s.stars >= 4 ? brief.good : s.stars <= 2 ? brief.bad :
    'It is... a car. Thank you.') })` and toast the `s.lines` joined by ' · ' (8 s). Achievements:
    `deps.increment(WORK_ACHIEVEMENTS.mechanic)`, five stars -> `deps.unlock(WORK_ACHIEVEMENTS.nailedBrief)`, score < 20
    -> `deps.unlock(WORK_ACHIEVEMENTS.creativeDifferences)`. `clearClientOrder(car)`; the client walks to the car and
    both are removed 4 s later (or at once when the player is > 60 m away): `removeVehicle` + splice from
    `deps.vehicles`, remove the gnome model from the scene.
  - Drop the order (toast "<client> took their car back.") when the car is exploded/destroyed (`car.exploded` or not
    in `deps.vehicles`), or the player is > 300 m from the lot and not in the car for 20 s. `cancel` (shop closed
    without handing back) does nothing (the player can open the shop again).
  - The client car must not be the player's own: never call lockup / ownership APIs.
  - `blips()`: the board `{ x, z, color: WORK_JOBS.mechanic.color, label: '🔧 Work orders (mechanic)' }`, and while an
    order is open, the client car's position labelled with the client's name.
  - `isOpen()`: the brief card is open.
  - Dev hook: `?mechorder` takes an order 2 s after the lot is built.

## Contract
`export function installMechanic(deps: WorkDeps): WorkJobRuntime` (unchanged).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `workplaces/mechanic/*.ts`.
- `cd games/gnome-theft-auto && npx vitest run src/workplaces src/jobs` passes.
- Dev server on 5352: `bash tools/smoke.sh "http://localhost:5352/?offline&no-intro&at=88,128,0&mechorder" gta-gnomlet gta-brief-card`
  passes; `node tools/gta-shots.mjs "http://localhost:5352/?mechorder" C:/Users/cpsai/AppData/Local/Temp/e24-mech lot:86,124,0`
  shows the lot, the client and their car (look at the PNG). Stop the server.

## Out of scope
`glazeShop.ts`, `glazeClient.ts`, `mechanic/briefs.ts`, `mechanic/lot.ts` (report bugs; small fixes only if a check
fails because of them), every other file.

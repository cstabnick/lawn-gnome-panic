Epic: 1 Save Trainer
Depends on: none

## Environment
Read and follow `docs/roadmaps/gta-save-trainer/_env.md` first (paths, rules, the trainer foundation files).

## Goal
Two trainer tabs: **Garage** (`src/trainer/sections/garage.ts`, id `garage`, order 40): what is stored in the Lock-Up, hangar and boathouse, add any vehicle to storage, remove, free Sling-Lift delivery. **World** (`src/trainer/sections/world.ts`, id `world`, order 50): time of day, clear heat, clear street events, teleport to named places and quest givers, teleport to the crosshair.

## Read first
- `games/gnome-theft-auto/src/trainer/sections/garage.ts` and `world.ts` (stubs: keep `registerGarageSection()` / `registerWorldSection()`).
- `games/gnome-theft-auto/src/lockup/runtime.ts` lines ~51-75: `Lockup` trainer API: `list(kind?)` -> `StoredVehicle[]`, `storeVehicle(v)` -> error sentence | null, `addRecord(id)` -> record | null (full or unknown), `remove(uid)` -> boolean, `callDelivery(uid, free?)` -> error sentence | null.
- `games/gnome-theft-auto/src/lockup/types.ts`: `STORAGE_KINDS` (`'ground' | 'air' | 'water'`), `StoredVehicle` (`uid`, `kind`, `variant`, `name`, `hp` 0..1).
- `games/gnome-theft-auto/src/fleet.ts` (`FLEET`: `id`, `name`) and `config.ts` (`VEHICLES`: `name`).
- `games/gnome-theft-auto/src/atmosphere.ts`: `TimeMode` ('auto' | 'noon' | 'golden' | 'night'), `AtmosphereController.setMode/getMode` (ctx.atmosphere may be null).
- `games/gnome-theft-auto/src/mapPois.ts`: `placeBlips()` -> `{ x, z, label }[]`. `games/gnome-theft-auto/src/quests/defs.ts`: `GIVERS` (`Record<string, { id, name, x, z }>`). `ctx.world.spawn` (`{ x, z, yaw }`).
- `games/gnome-theft-auto/src/events/api.ts`: `activeWorldEvents()`, `clearStreetEvents()`.
- `games/gnome-theft-auto/src/types.ts`: `Player.respawn(x, z, yaw)` (puts the gnome on its feet there, out of any vehicle), `Watch.clear()`.

## Change
- `games/gnome-theft-auto/src/trainer/sections/garage.ts`: `{ id: 'garage', label: 'Garage', order: 40, build }`. `build(el, ctx)`: a `status()` line; for each kind in `STORAGE_KINDS`: `heading` ("Lock-Up (cars)" for ground, "Hangar (aircraft)" for air, "Boathouse (boats)" for water, any other kind -> the kind itself), then each `ctx.lockup.list(kind)` record as a note `${name} · ${Math.round(hp * 100)}%` and a `row(null, button('Deliver free', ...), confirmButton('Remove', ...))`; "None stored." when empty. Deliver: `ctx.lockup.callDelivery(uid, true)` -> error ? status error : status "Sling-Lift on its way." Remove: `ctx.lockup.remove(uid)`, `markTrainerModified('lockup remove ' + name)`, `refreshTrainerTab()`.
  Then `heading('Add to storage')` + note "Puts a full-health one in the right store (Lock-Up, hangar or boathouse) if there is room." A `select` of every FLEET entry (`id`, label `name`) and every VehicleKind of `VEHICLES` except 'tessie' and 'taxi' (label `spec.name`), and button "Add" -> `ctx.lockup.addRecord(id)` null -> status error "Full, or that one cannot be stored."; else mark `'lockup add ' + id` and `refreshTrainerTab()`. Button "Store the one I'm in" -> `ctx.player.vehicle ? ctx.lockup.storeVehicle(v) : 'Get in a vehicle first.'`; on success (null) mark + refresh.
- `games/gnome-theft-auto/src/trainer/sections/world.ts`: `{ id: 'world', label: 'World', order: 50, build }`. `build(el, ctx)`: a `status()` line, then
  1. `heading('Time of day')`: buttons Auto / Noon / Golden Hour / Neon Night -> `ctx.atmosphere?.setMode(mode)`, the current one (`getMode()`) `on`. If `ctx.atmosphere` is null: note "No sky in this build."
  2. `heading('Law and order')`: "Clear heat" -> `ctx.watch.clear()`; "Clear street events" -> `clearStreetEvents()`; note listing `activeWorldEvents()` titles or "No events running."
  3. `heading('Teleport')`: button "To the crosshair" -> `trainerSpot(ctx)` then teleport. Then a `grid` of buttons: "Start" (`ctx.world.spawn`), every `placeBlips()` entry (`label`), and every `GIVERS` entry (`name`, sub "Quest giver"). Teleport = `ctx.player.respawn(x, z, ctx.player.yaw)` (it also gets the gnome out of a vehicle); status `Teleported to ${label}`. Never mark (nothing saved).
  4. A note: "Weather: Turfton has no weather to set yet."

## Contract
`export function registerGarageSection(): void`, `export function registerWorldSection(): void`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your two files.
- `cd games/gnome-theft-auto && npx vitest run src/trainer src/lockup` passes.

## Out of scope
lockup/* (another planner is extending it: use only the `Lockup` methods listed), atmosphere.ts, events/, every other file.

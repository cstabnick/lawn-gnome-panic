Epic: 1 Save Trainer
Depends on: none

## Environment
Read and follow `docs/roadmaps/gta-save-trainer/_env.md` first (paths, rules, the trainer foundation files).

## Goal
The trainer's **Spawn** tab (`src/trainer/sections/spawn.ts`, id `spawn`, order 30): one button per spawnable from the registry, grouped, spawning at the crosshair; plus the built-in spawnables: vehicles (incl. fleet variants and the golf cart), boats, aircraft, critters, hunting quarry, townsgnomes and squads, street and challenge events.

## Read first
- `games/gnome-theft-auto/src/trainer/sections/spawn.ts` (stub: keep `export function registerSpawnSection(): void`)
- `games/gnome-theft-auto/src/fleet.ts`: `FLEET` (`id`, `kind`, `name`). `games/gnome-theft-auto/src/fleetRuntime.ts`: `FleetRuntime.spawn(id, x, z, yaw)` builds a fleet variant id OR any plain VehicleKind (boats and aircraft too), pushes it into the vehicle list, returns the Vehicle or null.
- `games/gnome-theft-auto/src/config.ts`: `VEHICLES: Record<VehicleKind, VehicleSpec>` (`name`, `boat?`, `air?`).
- `games/gnome-theft-auto/src/craft/spawns.ts`: `AIR_KINDS`.
- `games/gnome-theft-auto/src/critters.ts`: `CRITTER_SPECS` (keys = `CritterKind`), `CritterRuntime.spawn(kind, x, z, { yaw })`.
- `games/gnome-theft-auto/src/hunting/species.ts`: `SPECIES` (`id`, `name`); `Hunting.spawn(id, x, z)` (in `hunting/hunting.ts`) returns null when there is no open land in that species' region nearby.
- `games/gnome-theft-auto/src/types.ts`: `Npcs.spawnFleeing(x, z, fromX, fromZ, look | null)`, `Watch.spawnSquad(kind: 'hoa' | 'porcelain' | 'spade', points: [number, number][])`.
- `games/gnome-theft-auto/src/events/api.ts`: `listWorldEvents()` (`id`, `title`, `category`), `triggerWorldEvent(id)` -> boolean, `activeWorldEvents()`, `clearStreetEvents()`.

## Change
- `games/gnome-theft-auto/src/trainer/sections/spawn.ts` only.
  - `registerSpawnSection()`: first registers the built-in spawnables with `registerTrainerSpawnable(group, id, label, (at, ctx) => ...)` in this order of groups, then registers the section `{ id: 'spawn', label: 'Spawn', order: 30, build }`.
    - `'Vehicles'`: each `FLEET` entry (label `entry.name`), then each `VehicleKind` in `VEHICLES` that is not `boat`, not `air`, and not `'tessie'` or `'taxi'` (label `spec.name`). Spawn: `ctx.fleet.spawn(id, at.x, at.z, at.yaw)`; null -> `throw new Error('Unknown vehicle ' + id)`; return `` `${v.spec.name} parked at the crosshair` ``. Use a different group key prefix if you need unique ids, but ids must equal the fleet/kind id.
    - `'Boats'`: kinds with `spec.boat`, except `'tessie'`. Same spawn; return message "... (boats need water: aim at a river or the loch)".
    - `'Aircraft'`: `AIR_KINDS`. Same spawn.
    - `'Critters'`: each `CritterKind` (label: the kind with dashes as spaces, first letter upper case): `ctx.critters.spawn(kind, at.x, at.z, { yaw: at.yaw })`.
    - `'Hunting quarry'`: each `SPECIES` (label `s.name`): `ctx.hunting.spawn(s.id, at.x, at.z)`; null -> throw `No open ${s.name} ground near here (it lives in its own region).`
    - `'Gnomes'`: `'townsgnome'` "Townsgnome" -> `ctx.npcs.spawnFleeing(at.x, at.z, ctx.player.x, ctx.player.z, null)`; `'squad-hoa'` "HOA Enforcers", `'squad-porcelain'` "Porcelain Guards", `'squad-spade'` "Spade Guards" -> `ctx.watch.spawnSquad(kind, [[at.x, at.z], [at.x + 1.6, at.z], [at.x, at.z + 1.6]])`.
    - `'Events'`: each `listWorldEvents()` entry (label `title`, id `id`): `triggerWorldEvent(id)`; false -> throw "Could not start it (already running, or the game is not ready)".
  - `build(el, ctx)`: a `status()` line, note "Spawns where the camera looks (the crosshair), or 7 m ahead. Spawned things are not saved." Then for each `{ group, items }` of `listTrainerSpawnables()` (call it inside build, so plug-ins registered later show): `heading(group)` + a `grid` of `button(item.label, ...)`. Groups with more than 12 items go inside a `<details>` (summary = `${group} (${n})`, summary style min-height 44px, the heading inside summary instead). Click: `const at = trainerSpot(ctx)`; `try { const msg = item.spawn(at, ctx); status.set(msg || 'Spawned ' + item.label); } catch (e) { status.set(e instanceof Error ? e.message : String(e), true); }`.
    After the groups: `heading('Running events')`, a note listing `activeWorldEvents()` titles (or "None"), and button "Clear street events" -> `clearStreetEvents()`. Then call `buildSpawnExtras(div, ctx)` from `./spawnExtras` on an appended div.
  - Spawning is session-only: never call `markTrainerModified`.

## Contract
`export function registerSpawnSection(): void`. Registry use: `registerTrainerSpawnable(group: string, id: string, label: string, spawn: (at: TrainerSpot, ctx: TrainerCtx) => string | void)`. Uses (do not edit) `./spawnExtras`: `buildSpawnExtras(el: HTMLElement, ctx: TrainerCtx): void` (another worker writes it now).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in `src/trainer/sections/spawn.ts`.
- `cd games/gnome-theft-auto && npx vitest run src/trainer src/fleet.test.ts` passes.

## Out of scope
`sections/spawnExtras.ts` (another worker), fleet*, critters*, hunting/, events/, craft/, every other file.

Epic: 2 (Gnome Theft Auto adopts Pay 'n' Glaze)
Depends on: none (epic 1 has landed)

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` and `docs/roadmaps/pay-n-glaze/epic-2/_common2.md` first. You own only: `games/gnome-theft-auto/src/glazeStore.ts`, `games/gnome-theft-auto/src/glazeStore.test.ts` (new), `games/gnome-theft-auto/src/handling.ts`, `games/gnome-theft-auto/src/handling.test.ts`, `games/gnome-theft-auto/src/simdrive.ts`, `games/gnome-theft-auto/src/saveIO.ts`, `games/gnome-theft-auto/src/saveIO.test.ts`.

## Goal
(1) The player's owned Pay 'n' Glaze loadout for each vehicle model is saved in this browser. (2) Ride height replaces the old "Ride height" tuning knob: the driving model's centre-of-mass height now comes from the loadout's `rideHeight`, not from the Side-Valve slider.

## Read first
- `games/gnome-theft-auto/src/glazeStore.ts`: the in-memory stub (`GLAZE_KINDS`, `ownedLoadout`, `saveOwnedLoadout`, `clearOwnedLoadout`, `onOwnedChange`): keep every exported name and signature.
- `games/gnome-theft-auto/src/simdrive.ts` lines 1-90 (`readStore`/`writeStore`, `garage`, `getSetup`, `setSetup`, `resetSetup`, `mowerConfig`, `createSimDrive`) and the other places `mowerConfig` / `vehicleConfig` are used (`grep -n "mowerConfig\|vehicleConfig" games/gnome-theft-auto/src/*.ts`).
- `games/gnome-theft-auto/src/handling.ts` (`PROFILES`, `stockSetup`, `clampSetup`, `rangeFor`, `vehicleConfig`) and `handling.test.ts`.
- `packages/vehicle/src/tuning.ts`: the knob `comHeight` ("Ride height": a higher centre of mass), global range 0.6..1.6.
- `games/gnome-theft-auto/src/saveIO.ts` (`GTA_SAVE_KEYS`: the keys a save bundle exports and imports) and `saveIO.test.ts`.
- `packages/glaze/src/loadout.ts`: `encodeLoadout`, `decodeLoadout`, `normalizeLoadout`.

## Change
- `glazeStore.ts`: persist. Storage key `'gta-glaze-v1'` holding a JSON object `{ [kind]: <encodeLoadout code> }` (a string per vehicle kind). Load once at module start with try/catch (blocked storage or garbage JSON gives an empty store); a code that fails `decodeLoadout` is dropped; only kinds in `GLAZE_KINDS` are kept. `saveOwnedLoadout` / `clearOwnedLoadout` write through (try/catch) and still notify listeners. Export `GLAZE_SAVE_KEY = 'gta-glaze-v1'`. Add `export function glazeStorageForTest(s: { getItem(k: string): string | null; setItem(k: string, v: string): void } | null): void` that swaps the storage backend and reloads (so tests do not need `localStorage`); default backend is `localStorage` guarded by `typeof localStorage !== 'undefined'`.
- `handling.ts`: add `export function comHeightFor(kind: VehicleKind, rideHeight: number): number`: the profile's stock `comHeight` (`profileFor(kind).stock.comHeight ?? 1`) times `(1 + 0.45 * rideHeight)` (so -1 lowers it by 45%, +1 raises it 45%), then clamped to the global tuning limits 0.6..1.6 (`TUNING_PARAMS`' `comHeight` min and max from `@lawn/vehicle`) and NOT to the profile's `ranges.comHeight` (the slider is gone; ride height has its own limits). Change `vehicleConfig(spec, tune, setup, rideHeight = 0)`: apply the setup as now, but with `comHeight` replaced by `comHeightFor(spec.kind, rideHeight)` (pass `{ ...clampSetup(spec.kind, setup), comHeight: comHeightFor(...) }` into `tuneVehicle`; since `clampSetup` clamps by profile ranges, apply the override AFTER clamping). `stockSetup` and `rangeFor` keep working for the other ten knobs; the `comHeight` entries of `PROFILES` stay (they are the stock). Export a `HANDLING_KNOBS` list = `TUNING_PARAMS` without `comHeight` for the garage modal (`export const HANDLING_KNOBS = TUNING_PARAMS.filter((p) => p.id !== 'comHeight')`, import `TUNING_PARAMS` from `@lawn/vehicle`).
- `simdrive.ts`: `mowerConfig(spec, tune = current, rideHeight = 0)` passes `rideHeight` to `vehicleConfig`; `createSimDrive(v)` uses `mowerConfig(v.spec, current, v.look?.rideHeight ?? 0)`. Anything else in that file that rebuilds a config for a vehicle must do the same (search the file). `getSetup` still returns all 11 knobs (the saved `comHeight` is ignored by the model now).
- `saveIO.ts`: add `'gta-glaze-v1'` to `GTA_SAVE_KEYS` (so export/import/reset covers it); update `saveIO.test.ts` expectations that list the keys.
- Tests: `glazeStore.test.ts` (use `glazeStorageForTest` with an in-memory object): empty at start; `saveOwnedLoadout('ride-on', l)` then `ownedLoadout('ride-on')` deep-equals `normalizeLoadout(l)`; persists as a code string under `GLAZE_SAVE_KEY`; reloading from the same fake storage returns it; garbage JSON, an invalid code and a non-glaze kind (`'plane'`) are dropped; `clearOwnedLoadout`; listeners fire on save and clear and stop after the unsubscribe. Add to `handling.test.ts`: `comHeightFor('ride-on', 0) === 1`, `-1` is lower than 0 and `+1` higher, always within 0.6..1.6 (loop all `GLAZE_KINDS` and `rideHeight` in -1..1), and `vehicleConfig(VEHICLES['ride-on'], tune, stockSetup('ride-on'), -1)` differs from `rideHeight = 1` in its centre-of-mass height (read the chassis `comHeightM` or whichever field `tuneVehicle` writes for `comHeight`: look in `packages/vehicle/src/tuning.ts`).

## Contract
`glazeStore.ts` exports (unchanged names): `GLAZE_KINDS`, `ownedLoadout(kind): Loadout | null`, `saveOwnedLoadout(kind, l): void`, `clearOwnedLoadout(kind): void`, `onOwnedChange(cb): () => void`; new: `GLAZE_SAVE_KEY`, `glazeStorageForTest`. `handling.ts` new: `comHeightFor(kind, rideHeight)`, `HANDLING_KNOBS`; `vehicleConfig` gains a 4th optional parameter. `simdrive.ts`: `mowerConfig(spec, tune?, rideHeight?)`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
- `npx vitest run games/gnome-theft-auto/src/glazeStore.test.ts games/gnome-theft-auto/src/handling.test.ts games/gnome-theft-auto/src/saveIO.test.ts games/gnome-theft-auto/src/bump.test.ts` passes.

## Out of scope
Every other file (`garages.ts` removes the old slider; `vehicles.ts`, `app.ts` and the rest belong to other issues).

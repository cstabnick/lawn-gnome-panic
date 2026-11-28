Epic: E02-1 Engine pieces
Depends on: none
Items: L91 ("make civilian cars occasionally have a mod or two")

(Environment: paste `_environment.md`.)

## Goal
`rollCivilianMods(id, kind)` returns 1-2 cosmetic Pay 'n' Glaze mods for about 15% of civilian cars, deterministically from the car id.

## Read first
- `civilianMods.ts`: the stub (`CIV_MODS`, `rollCivilianMods(id, kind): Partial<Loadout> | null`). Keep names and signature.
- `packages/glaze/src/ids.ts` (`FINISH_IDS`, `TYRE_IDS`, `RIM_IDS`, `LAMP_IDS`, `SPOILER_IDS`, `ORNAMENT_IDS`, `MIRROR_IDS`, `EXHAUST_IDS`), `packages/glaze/src/types.ts` `Loadout` (fields `finish`, `tyre`, `rim`, `rimColor`, `lamp`, `spoiler`, `ornament`, `mirror`, `exhaust`), and `packages/glaze/src/index.ts` (what `@lawn/glaze` exports).
- `vehicles.ts`: `dressed(spec)` (which kinds have a glaze rig; near `createVehicle` ~261) and `config.ts` `VEHICLES` (spec fields `boat`, `flies`, `air`).

## Change
- `civilianMods.ts`: implement. A small seeded rng (mulberry32 seeded from `(id * 2654435761) >>> 0` xor a string hash of `kind`). Return null when the spec is a boat (`spec.boat`), flies (`spec.flies`) or has `spec.air`, is not dressed (import `dressed` if vehicles.ts exports it; if not, copy its one-line rule into a local function with a comment saying where it comes from; do NOT edit vehicles.ts), or `rng() >= CIV_MODS.chance`. Else pick 1 or 2 distinct slots from `['finish', 'tyre', 'rim', 'lamp', 'spoiler', 'ornament', 'mirror', 'exhaust']` and a random non-stock id for each from the glaze id lists (finish: any but `gloss`; tyre/rim/lamp: any but `stock`; rim also sets `rimColor` from a short palette of 4 colours). Return only those fields. Never set `wheelSize`, `camberFront`, `camberRear`, `rideHeight`, `extras`.
- New `civilianMods.test.ts`: same (id, kind) -> deep-equal results on repeated calls; over ids 1..2000 for `ride-on` the share with mods is within 0.10..0.20; every result has 1-2 mod slots (rim + rimColor count as one) and every value is a valid id from the glaze lists; boats (`walnut-dinghy`) and `plane` always null; no result has `wheelSize`, `camberFront`, `camberRear`, `rideHeight`.

## Contract
`rollCivilianMods(id: number, kind: VehicleKind): Partial<Loadout> | null`, `CIV_MODS`.

## Done when
- `npx vitest run src/civilianMods.test.ts` passes; `npx tsc --noEmit -p .` clean for civilianMods.ts.

## Out of scope
`traffic.ts` (applying the mods is a later issue), `vehicles.ts`, `fleet.ts`, packages.

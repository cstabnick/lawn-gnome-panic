Epic: 1 (the @lawn/glaze package, its prefabs, the shop widgets)
Depends on: none

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` first (working directory, toolchain, rules, how to report). You own only the files below.

## Goal
`packages/glaze/src/loadout.ts` is a finished module: cleaning any input into a valid `Loadout`, a compact text code for saves and the network, and what a change costs at the shop.

## Read first
- `packages/glaze/src/types.ts`: `Loadout` and its limits (`WHEEL_SIZE_MIN/MAX`, `CAMBER_MIN/MAX`, `MAX_EXTRAS`).
- `packages/glaze/src/ids.ts`: the id lists (a field holding an id outside its list is invalid).
- `packages/glaze/src/catalog.ts`: `modById(slot, id)` prices, `PRICES`, `beamColor`.
- `packages/glaze/src/loadout.ts`: the stub. `defaultLoadout` is final; do not change it.

## Change
- `packages/glaze/src/loadout.ts`: implement, keeping every exported name and signature exactly:
  - `normalizeLoadout(input, paintFallback = 0xd8342c)`: start from `defaultLoadout(paintFallback)`, then for each field of `input` that is valid, take it. Valid means: colours are finite numbers, masked with `& 0xffffff` (paint, decalColor, rimColor; `underglow` is that or `null`); `decalNumber` an integer clamped 0..99; `wheelSize` clamped to `WHEEL_SIZE_MIN..WHEEL_SIZE_MAX` and rounded to 2 decimals; `camberFront`/`camberRear` clamped to `CAMBER_MIN..CAMBER_MAX` and rounded to 1 decimal; `rideHeight` clamped -1..1 rounded to 2 decimals; every id field must be in its list from `ids.ts` (`decal`, `spoiler`, `seat`, `ornament` may also be `'none'`), otherwise the default is kept; `extras`: only valid ids, no duplicates (keep first), cut to `MAX_EXTRAS`. Non-objects and non-finite numbers are ignored. Never throws. Returns a fresh object (never the input).
  - `encodeLoadout(l)`: `'g1.'` followed by the fields joined by `'.'` in the order of the `Loadout` interface. Colours as 6 lower-case hex digits (`underglow` null = `'-'`); ids as their index in the `ids.ts` list in base 36 (`'none'` = `'-'`); `decalNumber` base 36; `wheelSize` as `Math.round(wheelSize*100)` base 36; cambers as `Math.round(camber*10)+300` base 36; `rideHeight` as `Math.round(rideHeight*100)+100` base 36; extras as their indices in base 36 joined with no separator (empty = `'-'`). Input is normalised first. The result uses only `[A-Za-z0-9._-]` and is at most 120 characters. (Indices, not names, so reordering an id list breaks old codes: say so in a comment above the function.)
  - `decodeLoadout(code)`: the exact inverse; returns `null` for anything that does not start with `'g1.'`, has the wrong number of fields, a field that does not parse, a code longer than 120 characters or characters outside `[A-Za-z0-9._-]`. A valid code is passed through `normalizeLoadout` so out-of-range numbers are clamped rather than rejected. `decodeLoadout(encodeLoadout(l))` deep-equals `normalizeLoadout(l)`.
  - `sameLoadout(a, b)`: field-by-field equal; `extras` compared as sets. Replace the JSON.stringify stub.
  - `isStockLoadout(l)`: true when `sameLoadout` with `defaultLoadout(l.paint)`.
  - `loadoutCostLines(owned, wanted)`: both normalised first. One line `{ label, price }` per change; a field that is equal costs nothing; selling back is free (no refunds, no negative lines). Rules: `paint` differs -> `{ label: 'Body colour', price: PRICES.paint }`; `finish` differs -> the new finish's `ModDef.price` (label its name; skip when 0 is not wrong, but then omit the line); `decal` differs and is not `'none'` -> that spray's price (label its name); `decalColor` or `decalNumber` differs while `decal !== 'none'` and the decal did NOT just change -> `PRICES.decalColor` once (label 'Spray colour'); `tyre`, `rim`, `steer`, `lamp`, `spoiler`, `seat`, `ornament` differ and the new id is not stock/'none' -> that product's price; `rimColor` differs and `rim !== 'stock'`... (any rim) and the rim did not change -> `PRICES.rimColor`; `beam` differs -> the new beam's price (omit when 0); `wheelSize` differs by more than 0.004 -> `PRICES.wheelSize`; `camberFront` or `camberRear` differs -> ONE line `PRICES.camber`; `rideHeight` differs by more than 0.004 -> `PRICES.rideHeight`; `underglow` goes null -> colour -> `PRICES.underglow`, colour -> another colour -> `PRICES.rimColor`, colour -> null free; each extra in `wanted.extras` not in `owned.extras` -> that product's price. Drop lines whose price is 0.
  - `loadoutCost` is already written; keep it.
- `packages/glaze/src/loadout.test.ts` (new): vitest tests for normalise (bad ids, out-of-range numbers, duplicate extras, too many extras, garbage input), the code (round trip for the default, for a loadout with every field set, and for 200 random loadouts built from the id lists with a seeded generator; length at most 120; `decode` of `'g1.'`, `'x'`, a too-long string and a code with one field removed all give null), `sameLoadout`, `isStockLoadout`, and cost (stock -> stock is 0; changing only paint is `PRICES.paint`; buying `tyre: 'fat'` + `rim: 'mesh'` costs both product prices; going back to stock is free; three new extras cost the sum).

## Contract
Exactly the exported names in the stub: `defaultLoadout`, `normalizeLoadout`, `encodeLoadout`, `decodeLoadout`, `sameLoadout`, `isStockLoadout`, `CostLine`, `loadoutCostLines`, `loadoutCost`. Pure functions, no three.js, no DOM.

## Done when
- `npx tsc --noEmit -p packages/glaze` has no error in `loadout.ts` or `loadout.test.ts`.
- `npx vitest run packages/glaze/src/loadout.test.ts` passes.

## Out of scope
Every other file under `packages/glaze/src` and everything under `games/` and `packages/prefabs`.

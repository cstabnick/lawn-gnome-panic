Epic: E02-1 Engine pieces
Depends on: none
Items: L53 ("add more ways for vehicles to break and lose parts. doesn't need to be fully realistic for dynamic, but the more parts we lose the better")

(Environment: paste `_environment.md`.)

## Goal
`debris.ts` can knock a visible part off a vehicle on an impact: the part nearest the hit side disappears from the model and a copy flies off as debris; lost parts stay lost when a damage stage rebuilds the body, until the vehicle is repaired.

## Read first
- `debris.ts` (all, ~300 lines): `DEBRIS`, `DebrisSystem` (`detach`, `burst`, `update`, `count`, `clear`), `throwPart`, `hasVisibleMesh`. It must not import `vehicles.ts` (vehicles.ts imports it).
- `debris.test.ts`: how tests build a vehicle-like object and a scene.
- `vehicles.ts` ~92-130 (`PartsHooks`, `applyDamageLevel`: `setPrefabDamage(body, level)` rebuilds the body's children, then `stripLooseParts(body)` and `v.rig?.apply()`), and `createVehicle` (~261): the prefab body is `v.object.children[0]`; Pay 'n' Glaze dressing adds groups named `glaze-fittings` and `glaze-lamps`; an NPC rider model sits under `v.object` too (`v.rider.object`).

## Change
- `debris.ts`:
  - `DEBRIS`: raise `max` to 40; add `knockMin: 7` (impact speed, m/s, below which nothing comes off), `knockChance: 0.55` (chance per qualifying impact; always above 2 x knockMin), `knocksPerVehicle: 6` (most parts one vehicle can lose before repair).
  - Exported `LOOSE_NAME = /^(canopy|mirror|exhaust|bumper|spoiler|ornament|lamp|headlight|light|siren|flag|basket|bag|grass-bag|catcher|hood|bonnet|door|grille|fender|mudflap|plate|antenna|aerial|horn|bell|cone|crate|bucket)/` and `NEVER_LOOSE = /(wheel|steer|handle|seat|body|chassis|deck|rotor|prop|wing|hull|frame|rider|gnome)/`.
  - Exported `looseParts(v: Vehicle): THREE.Object3D[]`: every object under `v.object` (skipping the `v.rider?.object` subtree) whose `name` matches `LOOSE_NAME` and not `NEVER_LOOSE`, is `visible` and `hasVisibleMesh`, plus every visible direct child (with a visible mesh) of objects named `glaze-fittings` or `glaze-lamps`; never both an object and its ancestor (keep the outermost).
  - A module-level `const lost = new WeakMap<Vehicle, string[]>()` of knocked part keys (the object's name; for unnamed glaze children `<parentName>/<index>`).
  - `DebrisSystem.knock(v: Vehicle, nx: number, nz: number, impact: number): number`: (nx, nz) is the unit direction FROM the vehicle centre TOWARD the hit, world space. Return 0 if `impact < DEBRIS.knockMin`, the vehicle already lost `knocksPerVehicle`, or the chance roll fails (`Math.random()`). Otherwise pick the candidate whose world position relative to (v.x, v.z) has the largest dot with (nx, nz); `throwPart` it (a clone flies off), hide the original (`o.visible = false`), record its key, return 1. Above `2 * knockMin` also take the next best (return 2). Add `knock` to the `DebrisSystem` interface.
  - Exported module functions `hideLostParts(v: Vehicle): void` (hide again every recorded part under `v.object`: call after a body rebuild) and `forgetLostParts(v: Vehicle): void` (call on repair).
- `debris.test.ts`: add tests: a vehicle object with named parts `mirror-l` at (+1, 0.5, 0), `exhaust` at (-1, 0.5, 0), `wheel-0` and `seat`; with `Math.random` stubbed to 0, `knock(v, 1, 0, 20)` hides `mirror-l` (+x side) and `count()` grows; a knock below `knockMin` does nothing; `wheel-0` and `seat` are never chosen; after making everything visible again (a rebuild), `hideLostParts(v)` hides `mirror-l` again; `forgetLostParts(v)` then a rebuild leaves it visible; the per-vehicle cap holds.

## Contract
`DebrisSystem.knock(v, nx, nz, impact): number`; exports `looseParts`, `hideLostParts`, `forgetLostParts`, `LOOSE_NAME`, `NEVER_LOOSE`; `DEBRIS.knockMin`, `knockChance`, `knocksPerVehicle`. Existing exports keep their behaviour.

## Done when
- `npx vitest run src/debris.test.ts src/fleetRuntime.test.ts src/fleet.test.ts` pass.
- `npx tsc --noEmit -p .` clean for debris.ts.
- Report which part names `looseParts` finds on a few real vehicles (`createVehicle` for `ride-on`, `zero-turn`, `taxi`, `hoa-van`, `golf-cart`) using a throwaway test you delete afterwards; if a vehicle has fewer than 2 candidates, list the names it does have.

## Out of scope
`vehicles.ts`, `fleetRuntime.ts`, `simdrive.ts` (calling `knock` on impacts is a later issue), prefab catalogs.

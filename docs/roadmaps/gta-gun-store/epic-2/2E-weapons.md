Epic: 2 (parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-gun-store/_common.md` first.

## Goal
`games/gnome-theft-auto/src/weapons.ts` fires every gun with its fitted mods (rate, spread, range, magazine, reload), shrinks the spread while
aiming, draws the held gun with its mods (`buildModdedGun`), and keeps every gun unlocked from the start (no purchase flow).

## Read first
- `games/gnome-theft-auto/src/weapons.ts`: the whole file. It reads `GUNS[w.gun]` / `GUNS[kind]` in `createWeapons` (ammoOf, selectGun,
  update, startReload) and in `fireBullet(spec, ...)`. It already has STUB methods `spec`, `setLoadout`, `loadoutOf`, `setAim`.
- `games/gnome-theft-auto/src/gunMods.ts`: `moddedGun`, `ModdedGun` (extends `GunSpec`), `normalizeGunLoadout`, `GunLoadout`, `AIM.spreadMul`.
- `games/gnome-theft-auto/src/types.ts`: the `Weapons` interface (search `export interface Weapons`), read the doc comments of the four new members.
- `games/gnome-theft-auto/src/gunRig.ts`: `buildModdedGun(gun, loadout, opts)` (a stub now that returns `buildHeld`; another worker fills it).

## Change
- `games/gnome-theft-auto/src/weapons.ts` only:
  - Keep two tables inside `createWeapons`: `const loadouts = {} as Record<GunKind, GunLoadout>` and `const specs = {} as Record<GunKind, ModdedGun>`,
    filled for every kind in `GUN_ORDER` with `{}` and `moddedGun(kind, {})`. Replace every `GUNS[...]` read in `createWeapons` with `specs[...]`
    (initial `ammoOf` from `specs[kind].mag`, `w.mag`, `selectGun`, the fire rate / auto / pellets in `update`, `startReload`'s reload time).
    `fireBullet` keeps taking a `GunSpec` but gets the spread from a new parameter: `fireBullet(spec, spread, tracer, ...)` uses `spread`
    instead of `spec.spread`. The caller passes `spec.spread * (1 + (AIM.spreadMul - 1) * aimT)`.
  - `let aimT = 0`; `setAim(t)` stores `Math.max(0, Math.min(1, t))`.
  - `spec()` returns `specs[w.gun]`. `loadoutOf(kind)` returns `{ ...loadouts[kind] }`.
  - `setLoadout(kind, mods)`: `loadouts[kind] = normalizeGunLoadout(kind, mods)`; `const before = specs[kind]`; `specs[kind] = moddedGun(kind, loadouts[kind])`.
    Magazine: if `ammoOf[kind] >= before.mag` (it was full) set it to the new mag, else clamp it to `Math.min(ammoOf[kind], newMag)`.
    If `kind === w.gun`: `w.mag = specs[kind].mag`, `w.ammo = ammoOf[kind]`, and `rebuildHeld()`.
  - `rebuildHeld()`: `held = buildModdedGun(w.gun, loadouts[w.gun])` instead of `buildHeld(GUNS[w.gun].prefab)` (same position, rotation,
    visibility and hand as now). Drop the `buildHeld` import if nothing else uses it (`buildPrefab` stays for the trip-mine).
  - Every gun is unlocked from the start (`unlocked = new Set(GUN_ORDER)` already). Keep `unlock(kind)` (other code may call it) and
    add a one-line comment on it and at the top of the file: all guns are free and unlocked; Ammu-Gnation sells mods, not guns.
  - Keep the leaf blower, mortar, whip, grenade and mine paths as they are (they read `spec` only for rate/mag).

## Contract
The `Weapons` interface in `types.ts`, unchanged:
```ts
spec(): ModdedGun;
setLoadout(kind: GunKind, mods: GunLoadout): void;
loadoutOf(kind: GunKind): GunLoadout;
setAim(t: number): void;
```
`buildModdedGun(gun: GunKind, loadout: GunLoadout, opts?: { scale?: number }): THREE.Group` from `./gunRig`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `weapons.ts`.
- `npm test -w games/gnome-theft-auto` still passes the tests that passed before (weapons.ts is used by the `gta-getaway` party slice; its
  contract test must pass). If another worker's new test file fails mid-edit, ignore that file.

## Out of scope
`types.ts`, `gunMods.ts`, `gunRig.ts`, `app.ts` (the planner wires sound, recoil and vehicle damage there), every other file.

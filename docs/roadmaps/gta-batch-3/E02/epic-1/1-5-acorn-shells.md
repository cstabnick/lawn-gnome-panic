Epic: E02-1 Engine pieces
Depends on: none
Items: L57 ("make it so when you fire bullets, acorn shells appear on the ground")

(Environment: paste `_environment.md`.)

## Goal
A pooled casing system, `createCasings(scene).eject(...)`, throws a little acorn-shell casing that tumbles, bounces, lies on the ground and fades; plus the `acorn-shell` prefab it uses.

## Read first
- `casings.ts`: the stub with the final interface (`CASINGS` tuning, `CasingSystem`, `createCasings`). Keep every exported name and signature.
- `debris.ts`: the model to copy the motion from (`throwPiece`, `update`: gravity, bounce on `heightAt`, settle, rest, fade via cloned transparent materials, cap with the oldest dropped first).
- `packages/prefabs/src/catalog/gta-fleet.ts`: an existing GTA prefab file (the `PrefabDef` format: id, name, category, uses, tags, emoji, tint, about, examine (5 lines), parts with `s`, `d`, `at`, `rot`, `c`, `seg`, `name`). Rules: `docs/roadmaps/prefab-library/_common.md`.
- `config.ts` `GUNS` (~684): `pistol`, `smg`, `shotgun`, `rifle` fire cartridges; `leaf-blower`, `acorn-mortar`, `tow-whip`, `dandelion-grenade`, `trip-mine` do not. `GunKind` is in `types.ts`.
- Lore: acorns are gnome treasure and gnome ammunition (`docs/lore/entries/core/acorns.md`). The casing is the spent husk and cap of a fired acorn round. No new proper names.

## Change
- `packages/prefabs/src/catalog/gta-fleet.ts`: append one `PrefabDef` to `GTA_FLEET`: id `acorn-shell`, name `Spent Acorn Shell`, category `prop`, uses `['place']`, tags `['acorn', 'shell', 'casing', 'ammo', 'spent', 'gta', 'debris']`, emoji `[]`, `tint: 0x8a5a2b` (used by the husk, `c: 'tint'`), `about` (one sentence with the size: about 4 cm long), `examine`: 5 short lines in the file's style (description, a Saying, a Tip, a Joke, one more). Parts: an open husk (`cyl`, radius about 0.018, length about 0.04) named `husk`, and a thin darker cupule ring named `cap`; total height under 0.05.
- `casings.ts`: implement. `eject(gun, x, y, z, yaw, vx = 0, vz = 0)`: return at once for guns that fire no cartridge. Build `buildPrefab('acorn-shell', { scale: CASINGS.scale * (gun === 'shotgun' ? 1.6 : 1) })` (from `@lawn/prefabs`) once per size as a template, then `template.clone(true)` per shell (materials shared until it fades; on fade clone the materials as debris.ts `makeFadeable` does). Velocity: right of yaw `(-cos yaw, 0, sin yaw) * CASINGS.side` plus up `CASINGS.up`, each times `1 + (Math.random() - 0.5) * CASINGS.spread`, plus `(vx, vz)`; random spin. Step: gravity, bounce on `heightAt(x, z)` (from `./terrain`) with `CASINGS.bounce` / `CASINGS.friction`, rest when slow (lying on its side: rotation x = PI/2, random yaw), age, fade after `CASINGS.life` over `CASINGS.fade`, remove. Cap `CASINGS.max` (drop the oldest). Must not import `vehicles.ts` or `app.ts`.
- New `casings.test.ts`: a pistol eject at y 1.4 -> one shell; after 3 s of updates at 1/60 it rests on the ground (y within 0.06 of `heightAt`) to the right of the shooter (dot with the right vector > 0); 60 ejects -> `count() === CASINGS.max`; a `leaf-blower` eject adds nothing; after `life + fade + 1` s `count() === 0`.

## Contract
`casings.ts` exports exactly `CASINGS`, `CasingSystem`, `createCasings(scene: THREE.Scene): CasingSystem`. Prefab id `acorn-shell`.

## Done when
- `npx vitest run src/casings.test.ts` passes (from games/gnome-theft-auto).
- `npm test -w packages/prefabs` passes (from the repo root).
- `npx tsc --noEmit -p .` clean for casings.ts.

## Out of scope
`app.ts` (ejecting on fire is a later issue), `weapons.ts`, `debris.ts`, other prefab catalog files.

Epic: 1 Save Trainer
Depends on: none

## Environment
Read and follow `docs/roadmaps/gta-save-trainer/_env.md` first (paths, rules, the trainer foundation files).

## Goal
The Spawn tab's three extra blocks in `src/trainer/sections/spawnExtras.ts`: **Weapons** (hold any gun), **Gun mods** (fit any mod on the held gun for this session) and **Props** (search the prefab catalog and place any prefab at the crosshair, and remove them again).

## Read first
- `games/gnome-theft-auto/src/trainer/sections/spawnExtras.ts` (stub: keep `export function buildSpawnExtras(el: HTMLElement, ctx: TrainerCtx): void`)
- `games/gnome-theft-auto/src/types.ts`: `interface Weapons` (`gun`, `unlock(kind)`, `selectGun(kind)`, `setLoadout(kind, mods)`, `loadoutOf(kind)`), `GunKind`.
- `games/gnome-theft-auto/src/config.ts`: `GUNS: Record<GunKind, GunSpec>` (`name`).
- `games/gnome-theft-auto/src/gunMods.ts`: `SLOT_NAMES`, `slotsFor(gun)`, `modsFor(gun, slot)` -> `GunModDef[]` (`id`, `name`), `normalizeGunLoadout(gun, loadout)`, `GunLoadout`.
- `packages/prefabs/src/registry.ts`: `allPrefabs()` (`PrefabDef`: `id`, `name`, `category`, `tags?`), `packages/prefabs/src/build.ts`: `buildPrefab(id)` -> `THREE.Group`.
- `games/gnome-theft-auto/src/terrain.ts`: `heightAt(x, z)`.

## Change
- `games/gnome-theft-auto/src/trainer/sections/spawnExtras.ts` only. `buildSpawnExtras(el, ctx)` appends one `status()` line and:
  1. `heading('Weapons')` + note "Every gun, in your hands now." A `grid` with one button per `GunKind` key of `GUNS` (label `GUNS[k].name`): `ctx.weapons.unlock(k); ctx.weapons.selectGun(k);` status `Holding ${name}`; the held one (`ctx.weapons.gun`) has class `on` (repaint after a click). Session only.
  2. `heading('Gun mods')` + note "On the held gun, this session only. Buy them at Ammu-Gnation to keep them." For `const gun = ctx.weapons.gun`: for each `slot` of `slotsFor(gun)`: `row(SLOT_NAMES[slot], select([{ value: '', label: 'Stock' }, ...modsFor(gun, slot).map(m => ({ value: m.id, label: m.name }))], ctx.weapons.loadoutOf(gun)[slot] ?? ''))`; on change: `const next = { ...ctx.weapons.loadoutOf(gun) }; if (v) next[slot] = v; else delete next[slot]; ctx.weapons.setLoadout(gun, normalizeGunLoadout(gun, next));`. Put the rows in their own div and rebuild it after the Weapons block changes the gun, and with a button "Refresh for held gun".
  3. `heading('Props')` + note "Any prefab, placed at the crosshair. Just for looking: no collision, not saved." A search `input({ placeholder: 'Search props (name, id, tag)' })`; on `input` events (and once at start with an empty query) list up to 40 matches of `allPrefabs()` whose `id`, `name` or any tag contains the lower-cased query, as a `grid` of buttons (label `name`, sub `id`). Click: `const obj = buildPrefab(def.id); const at = trainerSpot(ctx); obj.position.set(at.x, heightAt(at.x, at.z), at.z); obj.rotation.y = at.yaw; ctx.scene.add(obj);` push it to a module-level `const placed: THREE.Object3D[] = []`; status `Placed ${name} (${placed.length} placed)`. Errors from buildPrefab -> status error. Button "Remove placed props": `for (const o of placed) o.removeFromParent(); placed.length = 0;`.
  Never call `markTrainerModified` (nothing here is saved).

## Contract
`export function buildSpawnExtras(el: HTMLElement, ctx: TrainerCtx): void` (sections/spawn.ts, written by another worker now, calls it).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in `src/trainer/sections/spawnExtras.ts`.
- `cd games/gnome-theft-auto && npx vitest run src/trainer src/gunMods.test.ts` passes.

## Out of scope
gun*, weapons.ts, packages/*, `sections/spawn.ts`, every other file.

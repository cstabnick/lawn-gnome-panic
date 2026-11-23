Epic: 2 (parallel build)
Depends on: none (the mod prefabs are being written by other workers right now; your code must skip a mod whose prefab is missing)

## Environment
Read `docs/roadmaps/gta-gun-store/_common.md` first.

## Goal
`buildModdedGun(gun, loadout, opts)` in `games/gnome-theft-auto/src/gunRig.ts` builds a held gun with its mods bolted on at mount points and
its finish applied: the gun's "loadout on a prefab" helper (like `@lawn/glaze`'s `attachLoadout` for vehicles), plus a test.

## Read first
- `games/gnome-theft-auto/src/gunRig.ts`: the stub (keep the signature and the doc comment's promises).
- `games/gnome-theft-auto/src/gunMods.ts`: `GUN_MODS`, `getMod`, `normalizeGunLoadout`, `GunModDef.prefab`, `GunModDef.finish` (`FinishDef`).
- `packages/prefabs/src/build.ts` lines 1-120 and 340-390: `buildPrefab`, `buildHeld`. Static parts are merged into ONE mesh per bucket with
  `vertexColors: true` and a SHARED cached material and geometry; parts with a `name` are their own mesh (`mesh.name` = the part name).
- `packages/prefabs/src/catalog/gta-guns-air.ts`: the four guns. Named parts you will hide: SMG `mag` and `stock`; shotgun `stock`; rifle
  `stock`, `scope`, `scope-lens`.
- `packages/glaze/src/fittings.ts` lines 1-60: how glaze places a prefab part at a mount point (`getPrefab` check, a holder group).

## Change
- `games/gnome-theft-auto/src/gunRig.ts`: implement.
  1. `const holder = buildHeld(GUNS[gun].prefab)` (no scale yet). `const inner = holder.children[0]` is the prefab group in the prefab's own
     coordinates (buildHeld offsets it by the grip). Everything below is added to `inner`, in prefab coordinates.
  2. `const l = normalizeGunLoadout(gun, loadout)`.
  3. Finish first (so it only touches the gun's own parts): if `getMod(l.finish)?.finish` is set, `inner.traverse` every `THREE.Mesh` and:
     clone its material (`mesh.material = (mesh.material as THREE.Material).clone()`; materials may be an array - map them); if the material
     has `vertexColors` and the geometry has a `color` attribute, clone the geometry (`mesh.geometry = mesh.geometry.clone()`) and lerp every
     vertex colour toward the finish colour by `mix` (`THREE.Color.lerp`); otherwise lerp `material.color` by `mix`. On a
     `THREE.MeshStandardMaterial` set `metalness` and `roughness`; with `glow`, also `emissive.setHex(color)` and `emissiveIntensity = 0.55`.
     Never modify the shared cached geometry or material (always clone first): a stock gun built afterwards must look unchanged.
  4. For each slot except `finish`, in this order: `barrel`, `muzzle`, `optic`, `under`, `mag`, `stock`, `charm`: if a mod is fitted and
     `getPrefab(mod.prefab)` exists, `const part = buildPrefab(mod.prefab)`; measure it in its own frame
     (`new THREE.Box3().setFromObject(part)` before parenting); wrap it in `const h = new THREE.Group(); h.name = 'mod-' + slot; h.add(part)`;
     position `part` inside `h` so the box side named by the mount's `align` sits at the mount point (rules below); `inner.add(h)`.
     Then hide the gun's own parts the slot replaces: `inner.getObjectByName(name)` -> `visible = false` for each name in the mount's `hides`.
     Only hide when the replacement was actually placed.
  5. `holder.userData.gunLoadout = l`; `if (opts.scale && opts.scale !== 1) holder.scale.setScalar(opts.scale)`; return `holder`.

### Mount points (prefab coordinates of each gun; the barrel points +y, the gun's top is -z, its underside +z)
`align` says, per axis, which side of the part's bounding box goes to the point: `'min'` = the box's min on that axis sits at the point (the
part extends toward +), `'max'` = the box's max sits there (extends toward -), missing = centred on the point. Embed every aligned side
`EMBED = 0.004` into the gun (`'min'`: box.min = at - EMBED; `'max'`: box.max = at + EMBED) so no faces sit exactly on the gun's faces.

```ts
type Align = Partial<Record<'x' | 'y' | 'z', 'min' | 'max'>>;
interface Mount { at: [number, number, number]; align: Align; hides?: string[] }
type MountSlot = 'muzzle' | 'barrel' | 'optic' | 'under' | 'mag' | 'stock' | 'charm';
const MOUNTS: Partial<Record<GunKind, Partial<Record<MountSlot, Mount>>>> = {
  pistol: {
    muzzle: { at: [0, 0.37, 0], align: { y: 'min' } }, barrel: { at: [0, 0.37, 0], align: { y: 'min' } },
    optic: { at: [0, 0.15, -0.04], align: { y: 'min', z: 'max' } }, under: { at: [0, 0.26, 0.012], align: { y: 'min', z: 'min' } },
    mag: { at: [0, 0, 0], align: { y: 'max' } }, stock: { at: [0, 0.1, -0.03], align: { z: 'max' } },
    charm: { at: [0.025, 0.05, 0], align: { x: 'min' } },
  },
  smg: {
    muzzle: { at: [0, 0.51, 0], align: { y: 'min' } }, barrel: { at: [0, 0.51, 0], align: { y: 'min' } },
    optic: { at: [0, 0.3, -0.013], align: { y: 'min', z: 'max' } }, under: { at: [0, 0.32, 0.013], align: { y: 'min', z: 'min' } },
    mag: { at: [0, 0.22, 0.04], align: { y: 'max', z: 'min' }, hides: ['mag'] },
    stock: { at: [0, 0.2, -0.05], align: { z: 'max' }, hides: ['stock'] },
    charm: { at: [0.025, 0.05, 0], align: { x: 'min' } },
  },
  shotgun: {
    muzzle: { at: [0, 0.78, 0], align: { y: 'min' } }, barrel: { at: [0, 0.78, 0], align: { y: 'min' } },
    optic: { at: [0, 0.46, -0.02], align: { y: 'min', z: 'max' } }, under: { at: [0, 0.46, 0.02], align: { y: 'min', z: 'min' } },
    mag: { at: [0, 0.2, 0.07], align: { y: 'max', z: 'min' } },
    stock: { at: [0, 0.2, -0.06], align: { z: 'max' }, hides: ['stock'] },
    charm: { at: [0.025, 0.06, -0.02], align: { x: 'min' } },
  },
  rifle: {
    muzzle: { at: [0, 0.9, 0], align: { y: 'min' } }, barrel: { at: [0, 0.9, 0], align: { y: 'min' } },
    optic: { at: [0, 0.36, -0.014], align: { y: 'min', z: 'max' }, hides: ['scope', 'scope-lens'] },
    under: { at: [0, 0.5, 0.014], align: { y: 'min', z: 'min' } },
    mag: { at: [0, 0.3, 0.06], align: { y: 'max', z: 'min' } },
    stock: { at: [0, 0.2, -0.06], align: { z: 'max' }, hides: ['stock'] },
    charm: { at: [0.025, 0.06, 0], align: { x: 'min' } },
  },
};
```
- Any other gun or slot missing from the table gets a mount from the gun's own bounding box `bb` (measured on `inner` before any mod is
  added; `h = bb.max.y - bb.min.y`, `cx`, `cz` its centre): `muzzle`/`barrel` `{ at: [cx, bb.max.y, cz], align: { y: 'min' } }`;
  `optic` `{ at: [cx, bb.min.y + 0.55 * h, bb.min.z], align: { z: 'max' } }`; `charm` `{ at: [bb.max.x, bb.min.y + 0.25 * h, cz], align: { x: 'min' } }`;
  `under`/`mag`/`stock` `{ at: [cx, bb.min.y + 0.4 * h, bb.max.z], align: { z: 'min' } }`.
- A fitted barrel moves the muzzle point: after placing the barrel, the muzzle mount's `at` becomes `[barrelAt.x, placedBarrelMaxY, barrelAt.z]`
  where `placedBarrelMaxY` is the placed barrel's top in prefab coordinates (its box max y after positioning).

- `games/gnome-theft-auto/src/gunRig.test.ts` (new, vitest; import `describe, expect, it` from 'vitest'; `getPrefab` from '@lawn/prefabs'):
  - every gun in `GUN_ORDER` with every mod that fits it (`GUN_MODS.filter(m => m.guns.includes(g))`, one at a time) builds without throwing,
    and when the mod has a prefab that `getPrefab` finds, `holder.getObjectByName('mod-' + slot)` exists;
  - the SMG with `{ mag: 'extended-mag' }`: when `getPrefab('gunmod-extended-mag')` exists, `getObjectByName('mag').visible === false`,
    otherwise it is still visible;
  - a finish does not leak: build `'pistol'` with `{}` and read the first mesh's material colour / first vertex colour, build it with
    `{ finish: 'gilded' }`, build `{}` again: the second stock build has the same colours as the first;
  - `opts.scale: 6` gives `holder.scale.x === 6`.

## Contract
`export function buildModdedGun(gun: GunKind, loadout: GunLoadout, opts: { scale?: number } = {}): THREE.Group` exactly as in the stub. The
returned holder is used like a `buildHeld` holder (the game sets its position and rotation and adds it to the gnome's hand).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `gunRig.ts` / `gunRig.test.ts`.
- `npx vitest run src/gunRig.test.ts` (from `games/gnome-theft-auto`) passes.

## Out of scope
`weapons.ts` (another worker swaps `buildHeld` for `buildModdedGun` there), `gunMods.ts`, every prefab catalog file, every other file.

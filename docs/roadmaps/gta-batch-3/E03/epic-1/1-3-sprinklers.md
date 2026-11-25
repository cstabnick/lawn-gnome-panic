Epic: 1 Fixes (parallel) · Item: L10 "the little sprinkler things in the starting area are glitchy and have tall water cone shooting out of them" · Model: haiku
Depends on: none

## Environment
See `docs/roadmaps/gta-batch-3/E03/env.md` (read it first; its rules are part of this issue).

## Goal
The rogue sprinklers look like lawn sprinklers: a `lawn-sprinkler` prefab head with a short, low spray of droplets
(at most 1.5 m high) instead of a 4.4 m solid cone, a short warning before they fire, and a gentler launch.

## Root cause (confirmed by reading)
`encounters.ts` `buildSprinkler` (~line 115): a hand-built green cylinder head plus a `jet` mesh
`new THREE.CylinderGeometry(0.18, 0.85, 4.4, 12)` at y 2.3, shown `SPRINKLER_ACTIVE_DURATION = 3.5` s of every
`SPRINKLER_CYCLE = 9` s: that is the tall water cone. `SPRINKLER_SPOTS` has two in Turfton Park next to spawn,
(-25, 25) and (-42, 42). The launch `SPRINKLER_LAUNCH_VY = 6.5` throws the player high. The head is a one-off mesh
(prefab rule) and its flat base sits in the grass plane.

## Change (only `encounters.ts`)
- Head: `buildPrefab('lawn-sprinkler', { scale: 2.2 })` from `@lawn/prefabs` (the prefab is ~0.3 m tall at scale 1;
  check its parts in `packages/prefabs/src/catalog/props.ts` 'lawn-sprinkler'), lifted 0.02 above `heightAt(x, z)` so the
  base never shares the ground plane. Spin its group slowly while active.
- Spray: replace the cone with a small pool of droplets owned by the sprinkler (e.g. one `THREE.InstancedMesh` of 24
  tiny spheres, radius 0.06, `MeshLambertMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.8 })`), launched
  outward in a rotating fan with vertical speed so the peak is <= 1.5 m (`vy = sqrt(2 * 9.8 * 1.4)` max) and gravity
  9.8; respawn each droplet at the head when it lands. Hidden when inactive. No allocation per frame.
- Telegraph: for 0.8 s before each active window the head wobbles (small rotation.z sine) - a warning.
- `SPRINKLER_LAUNCH_VY` 6.5 -> 4.5. Keep the cycle, spots, radius, toasts and launch logic otherwise.
- Find where the active state toggles `jet.visible` in `createEncounters` update and drive the droplets there.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` clean for `encounters.ts`.
- `cd games/gnome-theft-auto && npx vitest run src/scenery.test.ts src/worldDetails.test.ts` still pass.
- No `CylinderGeometry(0.18, 0.85, 4.4` left; the droplet peak height formula is in a named constant `SPRAY_PEAK = 1.4`.

## Out of scope
`fx.ts`, `types.ts`, the prefab catalog, speed cameras and micro encounters in the same file (do not change them).

Epic: 2 Fill the modules
Depends on: none

## Environment
Repository root: /home/user/lawn-gnome-panic (Linux; node and npm are on PATH; `npm install` has been run).
Game: games/giant-pup (Vite + TypeScript + three@0.187.0). A pet-care game: the player is a gnome in a fenced back yard caring for a giant goofy cartoon dog (pet, feed, water, bath, fetch, tricks).
Other workers are editing other files in games/giant-pup at the same moment. Touch only the files this issue names. Do not add npm dependencies. Do not commit.
Repo rules: assets are generated in code only (no downloaded files). Mobile first: anything interactive must work by touch, with 44 px minimum targets and no hover-only UI.
The file you own currently holds a STUB with the final exported signatures. Keep every exported name and signature exactly as written in "Contract" (other files already import them); replace the bodies.

## Goal
`games/giant-pup/src/scene.ts` builds a cosy back yard with the player's gnome, and `games/giant-pup/src/fx.ts` adds little particle bursts (hearts, bubbles, zzz...).

## Read first
- games/giant-pup/src/scene.ts and games/giant-pup/src/fx.ts: the stubs you replace.
- games/giant-pup/src/config.ts: positions you must use: `YARD_HALF` (16), `GNOME_POS` {x:0,z:7}, `FOOD_BOWL_POS` {x:-5,z:2}, `WATER_BOWL_POS` {x:5,z:2}, `DOGHOUSE_POS` {x:0,z:-9}.
- packages/gnome/src/types.ts lines 100-150: `GnomeLook`, `PlayerState`, `GnomeModel` (model faces +z at facing 0; `update(p, dt)` places the model at p.position and turns it to p.facing).

## Change
### games/giant-pup/src/scene.ts
`createYard()`:
- Scene background a soft sky blue 0x9fd3f0 and `scene.fog = new THREE.Fog(0x9fd3f0, 40, 90)`.
- Lights: HemisphereLight(0xffffff, 0x5a7d3a, 1.2) and a DirectionalLight(0xfff4d6, 2.2) at (12, 20, 10) with castShadow = true, shadow.mapSize 2048, shadow camera left/right/top/bottom ±22, near 1, far 60. Add the light's target to the scene.
- `ground`: a PlaneGeometry(80, 80) lawn (MeshStandardMaterial 0x6cbf4f, roughness 1), rotated -π/2, receiveShadow = true. Add a slightly darker mown-stripe pattern with a CanvasTexture (stripes along z, repeated) — optional but nice.
- Wooden picket fence around the square |x|,|z| ≤ YARD_HALF (white 0xf5f0e6 pickets every 0.8 units, two rails), except leave the +z side (behind the camera, z = +YARD_HALF) present too — all four sides.
- Doghouse at DOGHOUSE_POS facing +z: a red-brown box body (about 4.5 wide, 3.5 tall, 4 deep) with a triangular roof (two dark boxes or an extruded triangle) and a dark arched door on the +z face; a name plate is optional. It must not block the spot (0, DOGHOUSE_POS.z + 3.2) in front of it.
- Two bowls at FOOD_BOWL_POS and WATER_BOWL_POS: short wide open cylinders (radius ~0.8, height 0.35, food bowl red 0xdc2626, water bowl blue 0x2563eb). Inside: a kibble mound (brown 0x92400e lumpy small spheres, a THREE.Group) and a water disc (0x60a5fa, transparent opacity 0.8). `setBowls(food, water)` toggles their `.visible`.
- Scenery outside the fence (never inside |x|,|z| < YARD_HALF): a few round trees (brown trunk cylinder + 2-3 green spheres), bushes, and the back of a house beyond the +z fence is NOT needed. Inside the yard along the fence only (within 1.5 of the fence): flower clumps (small coloured spheres on thin stems). Keep the middle of the yard clear. Use a seeded RNG (e.g. mulberry32 with a constant seed) so the layout is the same every load.
- The gnome: `import { createGnomeModel, getMyGnome, DEFAULT_LOOK, toModelLook } from '@lawn/gnome'` and build `createGnomeModel(getMyGnome()?.look ?? toModelLook(DEFAULT_LOOK))`. Add `gnome.object` to the scene. `gnomeState: PlayerState = { position: new THREE.Vector3(GNOME_POS.x, 0, GNOME_POS.z), velocity: new THREE.Vector3(), facing: Math.PI, grounded: true, jumpsUsed: 0 }` (facing π = toward -z, the yard). Cast shadows on its meshes.
- `update(t, dt)`: call `gnome.update(gnomeState, dt)`; gently sway tree tops / flowers (rotation.z = sin(t + phase) * 0.03).
- Cast/receive shadows on fence, doghouse, bowls, trees.

### games/giant-pup/src/fx.ts
`createFx(scene)`: a small pool of sprites or meshes, each with position, velocity, life, and kind. Use THREE.Sprite with a SpriteMaterial whose map is a CanvasTexture drawn once per kind (cache them):
- `heart`: pink-red heart shape, floats up 1.2 u/s, wobbles, life 1.2 s, fades.
- `bubble`: white-blue translucent circle with a highlight, drifts up slowly with random x/z, life 1.5 s, pops (scale up then vanish).
- `sparkle`: yellow 4-point star, bursts outward then falls, life 0.8 s.
- `zzz`: the letter "Z" in dark blue-grey, drifts up and sideways, grows, life 2 s.
- `dust`: small tan puff, spreads on the ground, life 0.6 s.
- `crumb`: tiny brown dots, small hop with gravity, life 0.7 s.
- `splash`: light blue droplets flung outward with gravity 12, life 0.9 s.
- `note`: a black music note "♪", floats up, life 1.2 s.
`spawn(kind, pos, count = 1)` adds `count` particles at pos (clone pos; give each a little random spread). `update(dt)` moves, fades (material.opacity) and removes dead ones (hide and return to pool). Each sprite needs its own SpriteMaterial (or clone) so opacity is per particle. Sprite scale about 0.5-0.9 world units. Cap live particles at 200 (drop the oldest).
Neither module may touch the DOM at import time (creating a canvas inside a function for a texture is fine).

## Contract
```ts
// scene.ts
export interface Yard {
  scene: THREE.Scene;
  ground: THREE.Mesh;
  setBowls(food: boolean, water: boolean): void;
  gnome: GnomeModel;
  gnomeState: PlayerState;
  update(t: number, dt: number): void;
}
export function createYard(): Yard;
// fx.ts
export type FxKind = 'heart' | 'bubble' | 'sparkle' | 'zzz' | 'dust' | 'crumb' | 'splash' | 'note';
export interface Fx { spawn(kind: FxKind, pos: THREE.Vector3, count?: number): void; update(dt: number): void; }
export function createFx(scene: THREE.Scene): Fx;
```
The caller (main.ts) sets `gnomeState.facing` every frame and writes `gnome.arms.right.rotation.x` after calling `update`; don't fight it.

## Done when
- `cd games/giant-pup && npx tsc --noEmit` passes.
- Nothing is placed inside the yard's middle (|x| < 13 and |z| < 13) except the doghouse, bowls and gnome.

## Out of scope
Every other file: games/giant-pup/src/main.ts, brain.ts, dog.ts, ui.ts, audio.ts, config.ts, and everything under packages/.

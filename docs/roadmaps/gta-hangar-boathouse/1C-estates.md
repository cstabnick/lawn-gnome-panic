Epic: 1 Modules (Hangar Two and the Mossbank Boathouse, Gnome Theft Auto)
Depends on: none

## Environment
Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash; use absolute paths). Game:
games/gnome-theft-auto (Vite + TypeScript + three.js). If node/npx is not found: export PATH="/c/Program Files/nodejs:$PATH".
Other workers edit other files of this game and repo at the same time: touch ONLY the files listed under Change. Do not
commit, push, stash, switch branches, run vite build / npm run build, or start a dev server. Do not edit AGENT_INDEX.md.
tsc over the whole game may show errors in files other workers are editing; only errors in YOUR files matter.
Rendering rule (repo): anything laid flat on the ground takes a draw layer (`flatLayer(material, LAYER.area)` from
`@lawn/depth`), not just a small lift, so it never z-fights.

## Goal
`buildEstates(scene)` builds the two buyable garages into the world: Hangar Two at the Desert Airfield (prefab
`hangar-two`, a concrete floor + apron, a windsock) and the Mossbank Boathouse on Loch Moss (prefab `boathouse`), and
returns their wall / walkway colliders for `world.boxes`. Also `placeRect`, the building-frame-to-world collider helper.

## Read first
- games/gnome-theft-auto/src/lockup/config.ts: `ESTATES` (hangar and boathouse: x, z, yaw, prefab, walls, walkways,
  apron, windsock, deckAboveWater). Every rectangle there is in the building's own frame.
- games/gnome-theft-auto/src/lockup/types.ts: `LocalRect`.
- games/gnome-theft-auto/src/lockup/estates.ts: the stub (keep `placeRect`, `EstateBuildings`, `buildEstates` signatures).
- games/gnome-theft-auto/src/biomes.ts lines 420-450: how the airfield apron is drawn (PlaneGeometry -> rotateX(-PI/2)
  -> translate -> addGroundToGeometry -> `flatLayer(new THREE.MeshStandardMaterial({ color: 0x8c9196 }), LAYER.area)`),
  and line ~480 how a windsock prefab is built (`buildPrefab('windsock', { lights: false })`).

## Change
- games/gnome-theft-auto/src/lockup/estates.ts (replace the stub):
  - `export function placeRect(r: LocalRect, x: number, z: number, yaw: number, baseY: number): Box` - turn the 4
    corners of r about the origin like three.js `rotation.y = yaw` does (`wx = lx * cos(yaw) + lz * sin(yaw)`,
    `wz = -lx * sin(yaw) + lz * cos(yaw)`), add (x, z), and return the axis-aligned box around them with
    `h = baseY + r.h`. Round min/max to 1e-6 is not needed; just compute.
  - `export function localToWorld(lx: number, lz: number, x: number, z: number, yaw: number): { x: number; z: number }`
    (same turn; used for the windsock).
  - `export function buildEstates(scene: THREE.Scene): EstateBuildings`:
    - Imports: `* as THREE from 'three'`, `buildPrefab` from '@lawn/prefabs', `LAYER, flatLayer` from '@lawn/depth',
      `heightAt` from '../terrain', `bodyLevel` from '../water', `addGroundToGeometry` from '../terrainMesh',
      `ESTATES` from './config'.
    - A local helper `tryPrefab(id: string): THREE.Object3D | null` that calls `buildPrefab(id, { lights: false })`
      inside try/catch and returns null (with one `console.warn`) if it throws (the prefabs are being added by another
      worker at the same time; colliders must be built either way). Traverse the object and set castShadow and
      receiveShadow true on meshes.
    - Hangar (H = ESTATES.hangar): baseY = the minimum of `heightAt` at the centre and at the 4 corners of the
      footprint (building frame (+-12, +-7), turned with localToWorld). Prefab H.prefab at (H.x, baseY, H.z),
      rotation.y = H.yaw, scene.add. Colliders: `H.walls.map((r) => placeRect(r, H.x, H.z, H.yaw, baseY))`.
      Floor + apron: one `new THREE.PlaneGeometry(w, d, 8, 12)` with w = apron.maxX - apron.minX, d = apron.maxZ -
      apron.minZ, `.rotateX(-Math.PI / 2)`, `.translate(cx, 0.03, cz)` (cx, cz = the apron rect's centre in the building
      frame), `.rotateY(H.yaw)`, `.translate(H.x, 0, H.z)`, then `addGroundToGeometry(geo)` (adds the terrain height to
      every vertex), material `flatLayer(new THREE.MeshStandardMaterial({ color: 0x8c9196 }), LAYER.area)`,
      receiveShadow = true. Windsock: `tryPrefab('windsock')` at localToWorld(H.windsock.dx, H.windsock.dz, ...),
      y = heightAt there.
    - Boathouse (B = ESTATES.boathouse): baseY = `(bodyLevel('water/loch-moss') ?? -0.65) + B.deckAboveWater`.
      Prefab B.prefab at (B.x, baseY, B.z), rotation.y = B.yaw. Colliders: walls and walkways through placeRect with
      the same baseY.
    - Return `{ boxes }` with all colliders (5 hangar walls + 4 boathouse walls + 2 walkways = 11).
    - Header comment: what the file is (2 lines).
- games/gnome-theft-auto/src/lockup/estates.test.ts (new, vitest). Start with
  `import { installFakeDom } from '../testing/fakeDom'; installFakeDom();` then dynamic-import the module
  (`const { placeRect, localToWorld, buildEstates } = await import('./estates');`), as other tests in src do.
  Cases: placeRect with yaw 0 is the rect moved by (x, z) and h = baseY + r.h; yaw PI mirrors x and z
  (rect {minX 1, maxX 2, minZ 3, maxZ 5} at (10, 20) -> minX 8, maxX 9, minZ 15, maxZ 17); yaw PI/2 swaps axes;
  `buildEstates(new THREE.Scene())` returns 11 boxes; none of these points is inside any returned box (x within
  [minX, maxX] and z within [minZ, maxZ]): the hangar site (480, -70), the hangar floor centre (480, -64), the boathouse
  back-door shore point (-690, -559), the slip (-690, -566), open water in front (-690, -578). The hangar back wall box
  is near z -57 (between -57.5 and -56.5).

## Contract
```ts
export function placeRect(r: LocalRect, x: number, z: number, yaw: number, baseY: number): Box;
export function localToWorld(lx: number, lz: number, x: number, z: number, yaw: number): { x: number; z: number };
export interface EstateBuildings { boxes: Box[] }
export function buildEstates(scene: THREE.Scene): EstateBuildings;
```

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/lockup/estates.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in estates.ts / estates.test.ts.

## Out of scope
lockup/config.ts (read only), packages/prefabs (another worker adds the `hangar-two` and `boathouse` prefabs),
app.ts (the planner wires buildEstates in), every other file.

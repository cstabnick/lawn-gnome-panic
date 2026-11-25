Epic: E05-2 Interiors and rooftops: engine pieces
Depends on: none

## Environment
Repo root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a89501009f27d94ba` (a git worktree; stay in it).
Game: `games/gnome-theft-auto` (Vite + TypeScript + three.js). Git Bash; if `node` is missing:
`export PATH="/c/Program Files/nodejs:$PATH"`. Keep LF line endings. Do not commit.
Other workers are editing other files at the same time. Only change the files listed under Change. Keep every exported
signature exactly as it is. Repo rule: 3D surfaces must not z-fight (no two faces in one plane; boxes that touch must
not share a face).

## Goal
Every downtown tower roof and the Double Pot tunnel-roof slab is a registered walkable rooftop with a 1.1 m parapet
wall (collider + mesh), and the slab carries a helipad, so the Sycamore Copter can land on roofs (aircraft floors
already read `rooftopSurfaceBelow`) and the player can walk on them without walking off by accident.

## Read first
- `games/gnome-theft-auto/src/interiors/rooftopsBuild.ts`: the stub (keep `PARAPET_H`, `PARAPET_T`, `parapetBoxes`, `buildRooftops`).
- `games/gnome-theft-auto/src/interiors/rooftops.ts`: `addRooftop(def)`, `rooftopById`, `clearRooftops` (tests), `rooftopSurfaceBelow`.
- `games/gnome-theft-auto/src/interiors/types.ts`: `Rooftop` (`parapet: boolean | ('n'|'s'|'e'|'w')[]`, 'n' = minZ side, 's' = maxZ, 'w' = minX, 'e' = maxX; `pad`).
- `games/gnome-theft-auto/src/towers/index.ts`: `lastTowerSpecs`, `lastTowerStyles` (same order) and `src/towers/silhouettes.ts` `massesFor(spec, style)`: masses `{ shape: 'box'|'cyl', x, z, w, d, y0, y1 }`; the roof is the mass with the highest `y1`. `src/towers/landmarks.ts` `landmarkFor(spec)` gives `{ id, name }` for named towers.
- `games/gnome-theft-auto/src/city/megaBlock.ts`: `MEGA_BLOCK.roof = { minX: 111, maxX: 129, minZ: -111, maxZ: -69, y: 9 }`.

## Change
- `games/gnome-theft-auto/src/interiors/rooftopsBuild.ts`:
  - `parapetBoxes(r)` (pure): sides = all four when `r.parapet === true`, the listed ones when an array, none when false.
    Inset `I = 0.15` inside the rim, thickness `PARAPET_T`, `h = r.y + PARAPET_H`. North wall: x `minX+I .. maxX-I`, z
    `minZ+I .. minZ+I+T`; south: z `maxZ-I-T .. maxZ-I`; west: x `minX+I .. minX+I+T`, z `minZ+I .. maxZ-I`; east mirrored.
    If `r.pad` exists and the pad circle reaches a wall (distance from pad centre to the wall's centre line < pad.r),
    split that wall: leave out the span `[pad.x - pad.r, pad.x + pad.r]` (north/south walls) or `[pad.z - pad.r, pad.z + pad.r]`
    (west/east walls); drop pieces shorter than 0.3 m. Return `Box[]` (`import type { Box } from '../types'`).
  - `buildRooftops(scene, world)`: call once; a second call does nothing (module flag).
    1. Towers: for each `lastTowerSpecs[i]` with style `lastTowerStyles[i]`: `masses = massesFor(spec, style)`, `top` =
       mass with max `y1`. Skip when `top.shape === 'cyl'` (round roof: no rooftop). Register
       `addRooftop({ id: landmarkFor(spec)?.id ?? 'tower-' + i, name: landmarkFor(spec)?.name, minX: top.x - top.w/2, maxX: top.x + top.w/2, minZ: top.z - top.d/2, maxZ: top.z + top.d/2, y: spec.h, solid: true, parapet: true, pad })`
       where `pad = style.crown === 'helipad' && Math.min(top.w, top.d) >= 12 ? { x: top.x, z: top.z, r: Math.min(top.w, top.d) / 2 - 1.5 } : undefined`.
       Wrap each addRooftop in try/catch (a duplicate landmark id: fall back to `'tower-' + i`).
    2. The Double Pot slab: `addRooftop({ id: 'double-pot-slab', name: 'Thorne Helipad (the Double Pot)', minX: 111, maxX: 129, minZ: -110.7, maxZ: -69.3, y: MEGA_BLOCK.roof.y, solid: false, parapet: ['n', 's'], pad: { x: 120, z: -92, r: 7 } })`.
       The slab has no box collider on purpose (the street runs under it); terrain.ts already stands bodies on it.
    3. Parapets: for every registered rooftop (`ROOFTOPS`), push `parapetBoxes(r)` into `world.boxes`, and add one merged
       mesh of all parapet boxes (`BoxGeometry` per box, translated, `mergeGeometries` from
       `three/examples/jsm/utils/BufferGeometryUtils.js`), each box drawn from `r.y - 0.05` to its `h` (bottom slightly
       sunk into the roof, no coplanar face), `MeshStandardMaterial({ color: 0xa7a39a, roughness: 0.95 })`,
       `castShadow = false`, `receiveShadow = true`, name `'rooftop-parapets'`.
    4. The slab helipad: `buildPrefab('tower-helipad', { lights: false, shadows: false })` from `@lawn/prefabs`, scaled so
       its widest side is 12 m (Box3 like `fitPrefab` in `src/cutscene/rooms.ts`), bottom at `9 + 0.02`, at (120, -92).
       Add it to the scene, name `'double-pot-helipad'`.
- `games/gnome-theft-auto/src/interiors/rooftopsBuild.test.ts` (new, vitest): `clearRooftops()` in `beforeEach`.
  (a) `parapetBoxes` of a 20 x 20 roof at y 40, parapet true -> 4 boxes, all `h` 41.1, none sharing the rim (minX > roof minX).
  (b) the same roof with `pad { x: 10 (centre), z: <minZ + 3>, r: 5 }` -> the north wall is split in two with a gap covering x `centre ± 5`.
  (c) `parapet: ['n', 's']` -> 2 boxes. (d) `buildRooftops(new THREE.Scene(), { boxes: [] } as never)` (no towers in a test:
  `lastTowerSpecs` is empty) registers `double-pot-slab`; `rooftopSurfaceBelow(120, -90, 10, false)` is 9 and
  `rooftopSurfaceBelow(120, -90, 5, false)` is null (a car in the tunnel is not lifted); world.boxes got 2 parapet boxes.

## Contract
```ts
export const PARAPET_H = 1.1; export const PARAPET_T = 0.35;
export function parapetBoxes(r: Rooftop): Box[];
export function buildRooftops(scene: THREE.Scene, world: World): void;
```
Rooftop ids: landmark id or `tower-<index>`; the slab is `double-pot-slab` (pad at (120, -92), y 9).

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` passes.
- `npx vitest run src/interiors/rooftopsBuild.test.ts` passes.

## Out of scope
rooftops.ts, types.ts, terrain.ts, craft/aircraft.ts, towers/*, city/megaBlock.ts, app.ts, roofLife.ts, showcase/*.ts.

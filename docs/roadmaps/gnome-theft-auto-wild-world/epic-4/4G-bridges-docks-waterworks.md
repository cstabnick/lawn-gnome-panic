Epic: 4 (Wild World: water, bridges and boats)
Depends on: none

## Environment
- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree). Run every command from there.
- Node: if `node`/`npm` is not found, in Git Bash run `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are
  installed: never run `npm install`. Never commit, push, stash, reset, or `git checkout`/`git restore` any file.
- About ten other workers and two other planning sessions edit other files of this game at the same time. Edit only
  the files this issue names. If `tsc` or a test fails in a file you do not own, someone is mid-edit: ignore it.
- The prefabs you place are being modelled by other workers right now and may not exist yet. Skip any whose
  `getPrefab(id)` is undefined (so the game builds either way); test the pure plan, not the meshes.
- Repo rule: new objects come from the prefab library (`buildPrefab` from `@lawn/prefabs`), never hand-built meshes.

## Goal
`games/gnome-theft-auto/src/waterworks.ts` places the gnome waterworks along the water: a road bridge at every road
crossing, docks at Loch Moss and the New Puddle marina, wharves on the canal, the canal lock gates, the loch weir,
two field sluices, a waterwheel sawmill in Mossy Wood's ravine, the quiet Tall-One hints, and the boats moored at the
docks. Today it is a planner stub that builds nothing.

## Read first
- `games/gnome-theft-auto/src/waterworks.ts`: the stub and its exported signature (keep it).
- `games/gnome-theft-auto/src/water.ts`: `bridges()` (`{ x, z, yaw, length, width, deck }`: yaw is the road direction,
  the deck's long axis is `(sin yaw, cos yaw)`), `canalLocks()` (`{ x, z, yaw, upper, lower }`), `courseProfile(id)`
  (`s[] x[] z[] surface[] bed[]`, upstream first), `bodyLevel(id)`, `BODIES`, `bodyRadius`, `shorePoint(w, angle)`.
- `games/gnome-theft-auto/src/terrain.ts`: `heightAt`, `waterAt(x, z)` (`{ surface, depth } | null`).
- `games/gnome-theft-auto/src/types.ts`: `Box` (`h` is the absolute top height), `ParkedSpot` (`{ x, z, yaw, kind }`).
- `games/gnome-theft-auto/src/config.ts`: `WATER` (end of file: `freeboard` 1) and the five boat `VEHICLES` specs
  (`radius`, `draft`) near the end of `VEHICLES`.

## Prefab dimensions (the other workers model them exactly so)
- `road-bridge`: deck 12 wide (x) x 24 long (z), deck top at y 2.8, nothing below y 2.3 between its end abutments.
- `wooden-dock`: 3 (x) x 12 (z), deck top y 1.6. `wharf`: 12 (x) x 6 (z), front face at z +3, top y 1.8.
- `canal-lock-gate`: spans a 10 m canal across x, the canal runs along its z; open gates, top y 2.6.
- `loch-weir`: sill 12 across (x) x 2 (z), top y 2.4. `field-sluice`: 3 (x) x 1 (z), top 2.2, front +z.
- `waterwheel-mill`: shed on stilts (floor y 1.2, about 5 x 5 footprint), wheel on its +x side, centre (3.6, 2.6, 0),
  radius 2.6, wheel parts in a child object named `wheel` (spin it about its local x axis).
- `hose-nozzle` (about 5 long, points +z), `pond-liner-rim` (8 along x), `gutter-lip` (10 along x), `stone-heron`.
- Yaw: an object rotated by `yaw` about y has its local +z along `(sin yaw, cos yaw)` and its local +x along
  `(cos yaw, -sin yaw)`.

## Change
- `games/gnome-theft-auto/src/waterworks.ts`:
  - Export a pure `waterworksPlan(): WaterworksPlan` (no three.js; uses water.ts and terrain.ts) and implement
    `buildWaterworks(scene, boxes)` from it. When `bridges()` is empty (the water is off), the plan is empty.
  - Placements (L = `bodyLevel('water/loch-moss')`, S = `bodyLevel('water/puddle-sea')`; "bank(x, z)" =
    `Math.max(heightAt(x, z), level + 0.4)` at the given land point):
    1. **Bridges**: for each `b` of `bridges()`: `road-bridge` at `(b.x, b.deck - 2.83, b.z)`, yaw `b.yaw`,
       `scaleX = b.width / 12`, `scaleZ = b.length / 24`. No collider (the deck is in `heightAt` already).
    2. **Loch dock**: `wooden-dock` at x -715, centre z -562, yaw `Math.PI` (it reaches north into the loch), y =
       bank(-715, -554) - 1.6. Collider `{ minX: -716.5, maxX: -713.5, minZ: -568, maxZ: -556, h: <deck top> }`.
       Moored: `watering-can-steamer` at (-705.5, -574) yaw `Math.PI`; `walnut-dinghy` at (-721, -571) yaw `Math.PI`.
    3. **Loch weir**: walk `courseProfile('river-ravine')` from its start to the first sample k where
       `bodyRadius(loch, x[k], z[k]) > 1 + 10 / 120`; `loch-weir` there, yaw = the path direction
       `atan2(x[k+1] - x[k], z[k+1] - z[k])`, y = `bed[k]`. Collider: the axis-aligned bounds of its rotated 12 x 2
       footprint, `h = y + 2.4` (boats cannot leave the loch).
    4. **Loch hints**: `stone-heron` at `shorePoint(loch, 2.3)` moved 3 m away from the loch centre, y = heightAt;
       `pond-liner-rim` at `shorePoint(loch, a)` for a = 0.4, 1.9, 3.6, y = L + 0.02, yaw = the shore tangent
       `atan2(-(z2 - z1), x2 - x1)` with p1/p2 = `shorePoint(loch, a -+ 0.02)` (its long x axis lies along the shore).
    5. **Canal locks**: for each `lk` of `canalLocks()`: `canal-lock-gate` at `(lk.x, lk.lower - 0.55, lk.z)`, yaw
       `lk.yaw`. No collider.
    6. **Canal wharves** (south bank, front face on the waterline z = 235): `wharf` at (-140, 238) and (150, 238), yaw
       `Math.PI`, y = bank(x, 241) - 1.8; collider `{ minX: x - 6, maxX: x + 6, minZ: 235, maxZ: 241, h: y + 1.8 }`.
       Moored: `walnut-dinghy` at (-140, 231) yaw `Math.PI / 2`; `gravy-boat` at (150, 231) yaw `-Math.PI / 2`.
    7. **Gutter lips**: `gutter-lip` at x = -60, 40, 175, z 236.4, yaw 0, y = heightAt(x, 236.4) - 0.2.
    8. **Field sluices**: on `courseProfile('river-farm')` at k = round(0.35 * n) and round(0.6 * n): with the path
       direction d and its right normal r = (-d.z, d.x), `field-sluice` at centre + r * (12 / 2 + 2.5), yaw facing the
       river (`atan2(cx - x, cz - z)`), y = heightAt. Collider: 3 x 3 box around it, `h = y + 2.2`.
    9. **Ravine sawmill**: on `courseProfile('river-ravine')` at k = round(0.45 * n): normal n = (d.z, -d.x) (the
       left bank), mill origin at centre + n * 7.1, yaw = `atan2(n.z, -n.x)` (its +x, the wheel side, points back at
       the river), y = `surface[k] - 0.4` (the wheel dips into the water). Collider: 5 x 5 box around the origin,
       `h = y + 4.6`. Spin `wheel` at 0.8 rad/s in `update`.
    10. **New Puddle marina**: `wooden-dock` at (600, 774) and (640, 774), yaw 0 (reaching south into the sea), y =
        bank(x, 768) - 1.6, colliders `{ minX: x - 1.5, maxX: x + 1.5, minZ: 768, maxZ: 780, h: <deck top> }`.
        Moored: `clog-cruiser` at (612, 787) yaw 0, `gravy-boat` at (652, 787) yaw 0, `walnut-dinghy` at (628, 785) yaw 0.
    11. **The source**: `hose-nozzle` at (16, -340), y = heightAt, yaw `atan2(-16, -10)` (pointing at the Frozen
        Birdbath Basin centre (0, -350)).
  - `buildWaterworks`: one `THREE.Group` named `waterworks` added to `scene`; each placement with
    `getPrefab(prefab)` defined becomes `buildPrefab(prefab)` positioned, `rotation.y = yaw`, scaled; its colliders
    are pushed into `boxes`; return `{ boats: plan.boats, update(dt) }` (boats are returned even if their prefab is
    missing: app.ts creates them later). Set `castShadow` on meshes like other props.
- `games/gnome-theft-auto/src/waterworks.test.ts` (new): `waterworksPlan()` has 5 `road-bridge` placements, 2
  `canal-lock-gate`, 1 `loch-weir`, 3 docks, 2 wharves, 7 boats; every boat spot has
  `waterAt(x, z).depth >= VEHICLES[kind].draft + 0.2` and no boat is within `radius_a + radius_b` of another; each dock
  collider's water end has `waterAt` depth > 0.5; the weir sits on the ravine outside the loch. Also
  `buildWaterworks(new THREE.Scene(), [])` does not throw with `installFakeDom()` from `./testing/fakeDom` installed
  (see `layout.golden.test.ts` for how).

## Contract
```ts
export interface WorkPlacement { prefab: string; x: number; y: number; z: number; yaw: number; scaleX?: number; scaleZ?: number; solid?: Box[]; spin?: string }
export interface WaterworksPlan { works: WorkPlacement[]; boats: ParkedSpot[] }
export function waterworksPlan(): WaterworksPlan
export interface Waterworks { boats: ParkedSpot[]; update(dt: number): void }
export function buildWaterworks(scene: THREE.Scene, boxes: Box[]): Waterworks
```
`world.ts` already calls `buildWaterworks` and adds `boats` to `world.parked`; do not edit world.ts.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `waterworks.ts` or its test.
- `(cd games/gnome-theft-auto && npx vitest run src/waterworks.test.ts src/water.test.ts)` passes.

## Out of scope
`world.ts`, `app.ts`, `water.ts`, `terrain.ts`, `biomes.ts`, any prefab file, any other file. Do not regenerate
`layout.golden.json`.

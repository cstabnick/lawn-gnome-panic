# Prefab port: LGP mowers and critters, Gnome Golf, Gnome Front

Goal: the enemy machines and desert critters of Lawn Gnome Panic (`games/sample-3d`), Gnome Golf's cart, trees,
flagstick and tee markers, and Gnome Front's guns and battlefield props are `@lawn/prefabs` models. Also fixed: the
golf club was upside down (`party.ts` `makeClub()` flipped an already head-down `buildHeld`).

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation (planner) | catalog stubs `mowers`, `critters`, `golf`, `golf-cart`, `front`, `front-weapons` registered; `buildPrefabInstances` exported; critters moved to `games/sample-3d/src/critterModels.ts`; prefab tests pass | 0 (planner) |
| 2. Port | builds of sample-3d, gnome-golf, gnome-front; `npm test` of packages/prefabs and gnome-golf | 6 (A-F), parallel, disjoint files |
| 3. Wrap-up (planner) | recopy `mowerModels.ts` into gnome-golf and gnome-front `src/models/`; builds, smoke, demos, PR | 0 (planner) |

Stays in games: headlight lamps and light cones, the golf cup, the clubhouse, the 350Z (a real car), the Gnome Front
boundary fence (400 instanced posts), the capture ring and letter labels, terrain, effects.

## Common to every issue (paste into each)

~~~~text
## Environment
Repo root: /Users/alex/cstabnick/lawn-gnome-panic (macOS, node and npm on PATH). Dependencies are installed: do
not run npm install. Do not git commit. Do not run `vite build` or `npm run build` (writes dist/), and do not start
a dev server. Five other workers are editing other files at the same time (other catalog files in
packages/prefabs/src/catalog/, and other game files). Edit ONLY the files your issue lists.

## Prefab rules
- Read docs/roadmaps/prefab-library/_common.md for modelling rules, the examine voice and checks. Follow them,
  EXCEPT: ignore its "Environment" section (use the one above), and the size rule in this issue overrides the
  "gnome-sized" units: you are told each prefab's scale relative to the game.
- packages/prefabs/src/types.ts is the format (PrefabDef, Part). packages/prefabs/src/palette.ts lists colour
  names; raw 0xRRGGBB numbers are fine and preferred when copying a game colour.
- Every new prefab: `emoji: []` (never add emoji: it changes what other games get), category 'prop' unless the
  issue says 'weapon', 4-6 examine lines, lowest point at y = 0 (±0.03), every side shorter than 3 units, roughly
  centred on x/z, at most 40 parts.
- Rotations in parts are DEGREES. `at` is the centre of a shape. cyl d = [radiusTop, radiusBottom, height] standing
  along y; to lay one along x use rot [0,0,90], along z use rot [90,0,0] (this maps +y to +z, so radiusTop ends at
  +z). ball d = [radius] (squash with scale). ring d = [radius, tube, arcDegrees] in the x-y plane.
- To turn a "bar from point a to point b" into a cyl part: at = (a+b)/2, height = |b-a|, rot = Euler of the
  rotation taking +y to the direction. Compute it, don't guess:
  node -e "const T=require('three');const a=new T.Vector3(AX,AY,AZ),b=new T.Vector3(BX,BY,BZ);const d=b.clone().sub(a);const e=new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize()));console.log(a.clone().add(b).multiplyScalar(0.5),d.length(),[e.x,e.y,e.z].map(r=>+(r*180/Math.PI).toFixed(2)))"
  (run it from the repo root; Euler order XYZ matches the prefab builder).
- Pivots: `pivots: { name: [x,y,z] }` makes a THREE.Group named `name` at that point under the prefab root; a part
  with `group: 'name'` goes inside it, and its `at` stays in prefab coordinates (the builder subtracts the pivot).
  Find them in game code with `root.getObjectByName('name')`.
- Prefab geometry and materials are cached and SHARED by every copy. Never dispose them, never edit a prefab
  mesh's geometry, never change a prefab material's colour/emissive. To recolour one copy, give that mesh its own
  material (`mesh.material = (mesh.material as THREE.Material).clone()` or a new one).

## Checks
- `npx tsc --noEmit -p packages/prefabs`: no errors in your catalog file (ignore errors in other workers' files).
- `npx vitest run --root packages/prefabs -t '<one of your ids>'` for each of your ids passes (the test names
  contain the id). If "builds, stands on the ground" fails, compute each part's lowest point and fix `at`.
- `npx tsc --noEmit -p games/<your game>` passes (if another worker's file in the same game errors mid-edit, wait
  a minute and retry; your own files must be clean).
~~~~

## Issue A: LGP mowers as prefabs

~~~~text
Epic: 2 Port
Depends on: none
(+ the Common block above: Environment, Prefab rules, Checks)

## Goal
Lawn Gnome Panic's five mower models (createMowerModel in games/sample-3d/src/mowerModels.ts) are built from new
prefabs in packages/prefabs/src/catalog/mowers.ts, keeping the exact MowerModel behaviour.

## Read first
- games/sample-3d/src/mowerModels.ts (whole file, ~250 lines): the model you transcribe.
- games/sample-3d/src/config.ts: `COLORS` (mower colours) and `interface MowerModel` (around line 1029).
- packages/prefabs/src/catalog/mowers.ts: the empty stub you fill (`export const MOWERS: readonly PrefabDef[] = [...]`).

## Change
- packages/prefabs/src/catalog/mowers.ts: five PrefabDefs, category 'prop', uses ['place'], transcribed part for
  part from mowerModels.ts at the SAME size (1 unit = 1 game unit), colours copied from COLORS as 0x numbers:
  - 'reel-mower' (tier reel), 'push-mower-green', 'push-mower-yellow', 'push-mower-red' (the powered tiers, each with
    its deck colour; red has its white stripe, yellow its black band), 'combine-harvester' (tier combine) at HALF
    size (every coordinate and dimension / 2) so it passes the < 3 size test.
  - Every wheel is a pivot group named 'wheel-<n>' (n = 0,1,2...) at the wheel's centre, holding the tyre part
    (cyl, rot [0,0,90], `group: 'wheel-<n>'`). Wheels touch the ground, so pivot y = wheel radius.
  - The reel (reel mower and combine) is a pivot 'reel' at the old reel group position; its axle and blades/bats
    are parts in group 'reel' (blade i: box rotated rot [a_i in degrees,0,0] at reel + (0, cos a_i * R, sin a_i * R)).
  - The powered tiers' engine block and cap are in pivot 'engine' at [0, 0.65, 0.1].
  - The combine's dividers: cone, rot [90,0,0]. Handles and the combine's spout pipe use the bar formula.
  - Do not include headlights (they stay in the game).
  - Examine lines: gnomes never know what a mower is; it is "the Mower", the only machine, feared by everyone.
- games/sample-3d/src/mowerModels.ts: rewrite createMowerModel(tier) on top of the prefabs. Keep the exported
  signature, the HEADLIGHTS table, the headlight lamp/cone code and setNight exactly as they are. Structure:
  ```ts
  const PREFAB: Record<MowerTier, { id: string; scale: number }> = {
    reel: { id: 'reel-mower', scale: 1 }, green: { id: 'push-mower-green', scale: 1 },
    yellow: { id: 'push-mower-yellow', scale: 1 }, red: { id: 'push-mower-red', scale: 1 },
    combine: { id: 'combine-harvester', scale: 2 },
  };
  const FLASH_MAT = new THREE.MeshBasicMaterial({ color: 0xffffff });
  // in createMowerModel:
  const group = new THREE.Group();                 // callers set group.position/rotation/scale: never put the prefab scale here
  const { id, scale } = PREFAB[tier];
  const body = buildPrefab(id, { scale });         // import { buildPrefab } from '@lawn/prefabs'
  group.add(body);
  const flashMeshes: { mesh: THREE.Mesh; mat: THREE.Material | THREE.Material[] }[] = [];
  body.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) flashMeshes.push({ mesh: m, mat: m.material }); });
  const wheels = body.children.filter((c) => c.name.startsWith('wheel-')).map((w) => ({ node: w, r: w.position.y * scale }));
  const reel = body.getObjectByName('reel');       // reel mower and combine only
  const engine = body.getObjectByName('engine');   // powered tiers only
  ```
  Collect flashMeshes BEFORE adding the lamps and cone (they are added to `group`, not `body`).
  setFlash(on): each flashMesh's `mesh.material = on ? FLASH_MAT : mat`.
  animate(dt, speed): wheels `node.rotation.x += (speed * dt) / r`; reel mower `reel.rotation.x += speed * dt * 3`;
  combine `reel.rotation.x += dt * 4` and `body.rotation.z = Math.sin(t * 20) * 0.006`; powered tiers
  `engine.position.y = 0.65 + Math.sin(t * 60) * 0.012` and `body.rotation.z = Math.sin(t * 45) * 0.01`.
  Delete helpers that become unused (bar, cylinderX, v, the mat/mesh/wheel closures). Keep sharedGeo (lamps use it).
  `COLORS` import may become unused: remove it if so.

## Contract
`export function createMowerModel(tier: MowerTier): MowerModel` unchanged. The model faces +z, base at y = 0.
Prefab ids exactly as above.

## Done when
- Checks pass for all five ids and for games/sample-3d.
- `grep -n "BoxGeometry\|CylinderGeometry\|ConeGeometry" games/sample-3d/src/mowerModels.ts` shows nothing (only
  the lamp SphereGeometry and the cone CircleGeometry remain).

## Out of scope
games/sample-3d/src/critterModels.ts, mowers.ts, config.ts, every other catalog file, other games.
~~~~

## Issue B: LGP desert critters as prefabs

~~~~text
Epic: 2 Port
Depends on: none
(+ the Common block above: Environment, Prefab rules, Checks)

## Goal
The desert enemies (createCritterModel in games/sample-3d/src/critterModels.ts) are built from new prefabs in
packages/prefabs/src/catalog/critters.ts, with the same walking, wagging and glowing-eye behaviour.

## Read first
- games/sample-3d/src/critterModels.ts (whole file): the model you transcribe.
- games/sample-3d/src/config.ts: `interface MowerModel` (around line 1029).
- packages/prefabs/src/catalog/critters.ts: the empty stub (`export const CRITTERS: readonly PrefabDef[] = [...]`).

## Change
- packages/prefabs/src/catalog/critters.ts: four PrefabDefs at the SAME size as the game, category 'prop', uses
  ['place']: 'baby-gecko' (tier reel), 'armadillo' (green; the combine boss reuses it), 'horned-lizard' (yellow),
  'racing-lizard' (red). Transcribe every blob/taper/eye/leg/tail exactly:
  - blob(parent, m, rx, ry, rz, x, y, z) -> `{ s: 'ball', d: [1], scale: [rx, ry, rz], at: [x, y, z], group: 'body' }`.
  - taper(parent, m, rBack, rFront, len, x, y, z) -> `{ s: 'cyl', d: [rFront, rBack, len], rot: [90, 0, 0], at }`
    (at = parent position + (x, y, z)).
  - eye(x, y, z, r): a dark part `{ s:'ball', d:[r], at, c: 0x161616, group:'body' }` and a glow part
    `{ s:'ball', d:[r*1.3], at, c: 0xffe27a, glow: true, name: 'eye-glow', group: 'body' }` (d carries the size;
    NO scale on the glow part, the game scales it).
  - Body parts all have group 'body'; pivots: { body: [0, 0, 0], ... }.
  - Tail: pivot 'tail' at the tail() position; its taper is a part with group 'tail'.
  - Legs: quad(hx, hz, len, splay, m, r) makes four legs; leg k (k = 0..3 in the loop order sx in [-1,1], sz in
    [-1,1]) is pivot 'leg-<k>' at hip = (sx*hx, len*cos(splay), sz*hz) with one part:
    `{ s:'cyl', d:[r*0.7, r, len], group:'leg-<k>', rot:[0, 0, phi_deg], at: [hip.x + (len/2)*sin(phi), hip.y - (len/2)*cos(phi), hip.z] }`
    where phi = sx * splay (radians; rot needs degrees). Write the numbers out, rounded to 3 decimals.
  - Shell bands: `{ s:'ring', d:[0.5, 0.05, 180], scale:[1, 0.6, 1], at:[0, 0.4, z], c:'trim', group:'body' }`.
    Armadillo shell parts use c 'tint' with tint 0xa89279, bands c 'trim' with trim 0x7d6a55.
  - Side spikes: cone rot [0, 0, -s*90].
- games/sample-3d/src/critterModels.ts: rewrite createCritterModel(tier) on the prefabs:
  ```ts
  const PREFAB: Record<MowerTier, string> = { reel: 'baby-gecko', green: 'armadillo', yellow: 'horned-lizard', red: 'racing-lizard', combine: 'armadillo' };
  const FLASH_MAT = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const group = new THREE.Group();   // callers scale/rotate this: the prefab and any boss scale go on `model`
  const model = tier === 'combine'
    ? buildPrefab('armadillo', { tint: 0x8a7258, trim: 0x5f4d3a })
    : buildPrefab(PREFAB[tier]);
  if (tier === 'combine') model.scale.set(2.8, 3.4, 2.8);
  group.add(model);
  const body = model.getObjectByName('body')!;
  const legs = model.children.filter((c) => c.name.startsWith('leg-'));
  const tail = model.getObjectByName('tail');
  for (const l of legs) body.add(l);   // body is at the origin, so positions are kept; legs now bob with the body
  if (tail) body.add(tail);
  ```
  Legs swing with phase: leg k gets phase Math.PI when sx === sz (k = 0 or 3), else 0.
  Collect `{ mesh, mat }` for every mesh under `model` for the flash (setFlash swaps to FLASH_MAT and back).
  Collect meshes named 'eye-glow': hidden at start; setNight(n): `visible = n > 0.05`, `scale.setScalar(n)`.
  animate: same maths as now (stride, `leg.rotation.x = Math.sin(stride + phase) * 0.45 * moving`,
  `body.position.y = Math.abs(Math.sin(stride)) * 0.025 * moving`, `tail.rotation.y = Math.sin(t * 8) * 0.25`).
  Delete the old helpers and sharedGeo if unused.

## Contract
`export function createCritterModel(tier: MowerTier): MowerModel` unchanged. Ids exactly as above.

## Done when
- Checks pass for the four ids and for games/sample-3d.
- critterModels.ts creates no Box/Sphere/Cylinder/Cone/Torus geometry.

## Out of scope
games/sample-3d/src/mowerModels.ts, mowers.ts, config.ts, every other catalog file, other games.
~~~~

## Issue C: Gnome Golf trees, flagstick and tee marker

~~~~text
Epic: 2 Port
Depends on: none
(+ the Common block above: Environment, Prefab rules, Checks)

## Goal
Gnome Golf's broadleaf trees, palms, giant oaks, tall pines, flagsticks and tee markers are prefabs. The trees stay
instanced (hundreds of them) through `buildPrefabInstances` from @lawn/prefabs.

## Read first
- games/gnome-golf/src/world.ts: buildCourse(): the "Trees and palms", "Big trees" and "Holes" sections, the
  makeInstances/makeXfInstances helpers, and the flag flutter in update() ("Flags flutter and point downwind").
- games/gnome-golf/src/trees.ts: placement (Plant/BigTree: x, z, s, yaw; Plant.y is the ground height) and
  OAK_LOBES / PINE_TIER_* (collisions use these: the prefabs must match them).
- packages/prefabs/src/instances.ts: `buildPrefabInstances(id, matrices, { tints })` (one Matrix4 per copy places
  the prefab root; `tints[i]` colours the copy's c:'tint' parts).
- packages/prefabs/src/catalog/golf.ts: the empty stub (`export const GOLF`).

## Change
- packages/prefabs/src/catalog/golf.ts: six PrefabDefs, category 'prop', uses ['place']. Trees are the game's
  trees at 1/10 size (the game scales them by 10 * s). Use exactly these parts (add nothing that changes the
  silhouette; you may set seg):
  - 'broadleaf-tree': trunk cyl [0.02,0.02,0.4] at [0,0.2,0] c 0x6b4a2b; canopy ball [0.3] at [0,0.45,0] c 'tint', tint 0x3b8f3a.
  - 'palm-tree': trunk cyl [0.022,0.032,0.7] at [0,0.35,0] c 0x8d6e4b; fronds cone [0.36,0.24] rot [180,0,0]
    scale [1,0.35,1] at [0,0.7,0] c 0x2d6e2b, seg 7.
  - 'island-oak': trunk cyl [0.09,0.16,1.2] at [0,0.6,0] c 0x5b3a22; crown ball [1.1] scale [1,0.727,1] at [0,1.5,0];
    lobes ball [0.7] scale [1,0.786,1] at [0.5,1.4,0.1] and at [-0.5,1.2,-0.1]; crown and lobes c 'tint', tint 0x3f8a35.
  - 'island-pine': trunk cyl [0.05,0.09,1.8] at [0,0.9,0] c 0x4a3020; tiers cone [0.6,0.9] at [0,1.0,0],
    cone [0.45,0.8] at [0,1.5,0], cone [0.3,0.6] at [0,2.0,0], all c 0x1f4d2b, seg 8.
  - 'golf-flagstick' (game size, 1:1): pole cyl [0.03,0.03,2.6] at [0,1.3,0] c 'white'; pivots { flag: [0,2.325,0] };
    cloth box [0.9,0.55,0.01] at [0.45,2.325,0] c 'tint' tint 0xd93636 name 'flag-cloth' group 'flag'.
  - 'tee-marker' (1:1): ball [0.25] at [0,0.25,0] c 0x2a6fd6 (you may add a short peg underneath if it stays on y = 0).
- games/gnome-golf/src/world.ts:
  - Trees: replace the instanced trunk/canopy/frond/oak/pine meshes with one `buildPrefabInstances` call per tree
    kind (import it from '@lawn/prefabs'). Matrix per tree: position (x, groundY, z), rotation y = yaw, uniform
    scale 10 * s. Broadleaf groundY = p.y; oaks and pines groundY = heightAt(t.x, t.z) (as now).
    Tints: broadleaf `tints[i]` = the same leafColours pick as now; oaks `tints[i]` = the same oakColA.lerp(oakColB)
    colour as now. KEEP the order of colourRand() calls identical (broadleaf first, then oaks) so colours match.
  - Flags: per hole build `buildPrefab('golf-flagstick')` at (pin.x, gy, pin.z). Get `pivot = root.getObjectByName('flag')`
    and `cloth = root.getObjectByName('flag-cloth') as THREE.Mesh`. Give the cloth its own geometry and material so
    the vertex flutter keeps working without touching the shared cache: `cloth.geometry = fgeo` (the existing
    PlaneGeometry(0.9, 0.55, 6, 1) translated by 0.45 in x, with bx/bz captured as now), `cloth.position.set(0, 0, 0)`,
    `cloth.material = flagMat` (the existing DoubleSide red). Store `pivot` as FlagRig.group, so update() keeps
    `f.group.rotation.y = windYaw - Math.PI / 2` and the vertex wave unchanged. Remove the old pole mesh.
  - Tee markers: `buildPrefab('tee-marker')` at (mx, groundY, mz) instead of the sphere mesh.
  - Leave the cup, clubhouse, islands, clouds, sea and terrain alone. Delete materials/geometries that become unused.

## Contract
Ids exactly as above. buildCourse's signature and return value unchanged. trees.ts unchanged.

## Done when
- Checks pass for the six ids and for games/gnome-golf.
- `npm test -w games/gnome-golf` passes (includes the golf-hole party slice, which builds the course).

## Out of scope
trees.ts, obstacles.ts, cartModel.ts, party.ts, every other catalog file, other games, packages/prefabs/src/*.ts.
~~~~

## Issue D: Gnome Golf cart

~~~~text
Epic: 2 Port
Depends on: none
(+ the Common block above: Environment, Prefab rules, Checks)

## Goal
The riding-mower golf cart (2-seat and 4-seat) is built from two new prefabs instead of hand-made meshes.

## Read first
- games/gnome-golf/src/cartModel.ts (whole file, ~175 lines).
- packages/prefabs/src/catalog/golf-cart.ts: the empty stub (`export const GOLF_CART`).

## Change
- packages/prefabs/src/catalog/golf-cart.ts: 'golf-cart' (the 2-seat branch) and 'golf-cart-4' (the 4-seat
  branch), category 'prop', uses ['place', 'sit'], `seat` = the driver seat ([0.32, 0.75, -0.1] and
  [0.33, 0.75, -0.2]). Same size as the game (1:1). Transcribe every part. Body colour parts (the RED ones) are
  c 'tint' with tint 0xd8342c; other colours from the file's constants as 0x numbers.
  - Each wheel is a pivot 'wheel-<n>' at its centre (x, radius, z) holding the tyre (cyl [r, r, width], rot [0,0,90],
    c 0x1a1a1a) and its stripe (box [width+0.02, 0.05, 0.05] at wheel centre + (0, 0, 0.8*r), c 0xf2c230), both
    `group: 'wheel-<n>'`.
  - Steering column: cyl tilted rot [25.78, 0, 0] (0.45 rad); wheel ring rot [-25.78, 0, 0], d [0.16, 0.025].
- games/gnome-golf/src/cartModel.ts: createCartModel(opts) builds
  `const body = buildPrefab(opts.seats === 4 ? 'golf-cart-4' : 'golf-cart', { tint: opts.color ?? RED_DEFAULT })`
  and adds it to `group` (a new empty THREE.Group returned as before; callers move/rotate group). Wheels:
  `body.children.filter(c => c.name.startsWith('wheel-')).map(w => ({ node: w, radius: w.position.y }))`, spun with
  `node.rotation.x += (speed / radius) * dt`. Engine shake goes on `body.rotation.z` (not group). Keep `seats`,
  `seatFacing`, SEAT_Y, CartOptions and CartModel exactly as now. Delete the unused colour constants and helpers.

## Contract
`createCartModel(opts?: CartOptions): CartModel` unchanged; seats unchanged (party.ts seats gnomes on them).

## Done when
- Checks pass for both ids and for games/gnome-golf; `npm test -w games/gnome-golf` passes.
- cartModel.ts creates no geometry.

## Out of scope
world.ts, party.ts, z33Model.ts, splash.ts, every other catalog file, other games.
~~~~

## Issue E: Gnome Front guns

~~~~text
Epic: 2 Port
Depends on: none
(+ the Common block above: Environment, Prefab rules, Checks)

## Goal
Gnome Front's four first-person guns are prefabs (category 'weapon'), and the viewmodel builds them with buildHeld,
with the iron sights exactly where they are now.

## Read first
- games/gnome-front/src/player.ts lines 1-130: RIFLE_BASE, GUN_SCALE, SIGHT_Y, AXIS_Z (= +PI/2, lays a cylinder
  along +z), newGunGroup, addPart, addSights, buildAcornRifle, buildSeedSprayer, buildPeaShooter, buildBlunderbuss.
- packages/prefabs/src/catalog/front-weapons.ts: the empty stub (`export const FRONT_WEAPONS`).

## Coordinate mapping (do it exactly)
The guns point down -z in "gun space". A held prefab stands upright with the muzzle up (+y). A gun-space point
(gx, gy, gz) becomes prefab point (gx, Y0 - gz, gy), where Y0 = the largest (gz + half its z extent) over all parts
of that gun (the back of the stock), so the lowest prefab point is y = 0. `grip: [0, Y0, 0]` (the gun origin).
- Gun box d [w, h, d] -> prefab box [w, d, h].
- Gun cylinder rotated AXIS_Z (radiusTop toward +z, the back) -> prefab cyl with NO rot and the radii swapped:
  d [radiusBottom_gun, radiusTop_gun, height] (prefab top = muzzle).
- Gun cylinder with no rotation (axis along gun y) -> prefab cyl with rot [90, 0, 0].
- Balls: just move the centre.
- Sights (addSights(g, sightY, baseY, frontZ, rearZ)): front post box [0.01, h, 0.02] at gun (0, baseY + h/2, frontZ)
  c 0xff7a1a; rear posts box [0.014, h, 0.02] at gun (±0.022, baseY + h/2, rearZ) c 0x1a1a1a, h = sightY - baseY,
  sightY from SIGHT_Y. Map them with the same rules.

## Change
- packages/prefabs/src/catalog/front-weapons.ts: 'acorn-rifle', 'seed-sprayer', 'pea-shooter',
  'pinecone-blunderbuss': category 'weapon', uses ['hold', 'shoot'], grip as above, colours from player.ts as 0x
  numbers (the pea-shooter lens 0x9fd8ff may be glow: true). Write each part's mapped numbers out.
- games/gnome-front/src/player.ts: replace the four build functions with one
  ```ts
  function buildGun(prefabId: string): THREE.Group {
    const g = newGunGroup();
    const held = buildHeld(prefabId);           // import { buildHeld } from '@lawn/prefabs'
    held.rotation.x = -Math.PI / 2;              // prefab +y (muzzle) -> gun -z
    held.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = (mesh.material as THREE.Material).clone(); // own copy: the viewmodel draws over the world
      mat.depthTest = false;
      mesh.material = mat;
      mesh.renderOrder = 10;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    });
    g.add(held);
    return g;
  }
  ```
  and `guns = { acornRifle: buildGun('acorn-rifle'), seedSprayer: buildGun('seed-sprayer'), peaShooter:
  buildGun('pea-shooter'), blunderbuss: buildGun('pinecone-blunderbuss') }`. Remove addPart/addSights/AXIS_Z if
  unused. Keep RIFLE_BASE, GUN_SCALE, SIGHT_Y (aiming code uses SIGHT_Y) and everything after createPlayerController.
- Verify the mapping once: in a node -e script with three and buildHeld you cannot easily run TS, so instead check
  by hand that for each gun the front sight post's top maps back to gun (0, SIGHT_Y, frontZ).

## Done when
- Checks pass for the four ids and for games/gnome-front.

## Out of scope
world.ts, conquest.ts, vehicles.ts, every other catalog file, other games.
~~~~

## Issue F: Gnome Front battlefield props

~~~~text
Epic: 2 Port
Depends on: none
(+ the Common block above: Environment, Prefab rules, Checks)

## Goal
Gnome Front's shed, fountain, veggie beds, compost heap, HQ tents, HQ banners, capture flagpoles, bushes and cover
trees are prefabs, placed exactly where their colliders are now.

## Read first
- games/gnome-front/src/world.ts: buildLandmarks, buildHQs, buildCover (birdbath, rocks, pots and stumps already use
  buildPrefab: copy that pattern).
- games/gnome-front/src/conquest.ts lines 1-110 and 200-225: the capture flag (pole, gold ball, cloth whose colour
  and height change with capture progress).
- packages/prefabs/src/catalog/front.ts: the empty stub (`export const FRONT`).

## Change
- packages/prefabs/src/catalog/front.ts, category 'prop', uses ['place']. Each is the game object divided by the
  given factor; the game builds it with `{ scale: factor }`:
  - 'garden-shed' (/4): walls box [2,0.8,1.5] at [0,0.4,0] c 0x8b5a2b; two roof panels box [2.1,0.0625,0.9] at
    [0,0.975,±0.45] rot [±25.78,0,0] c 0x6b3f1f; door box [0.35,0.55,0.025] at [0,0.275,0.7625] c 0x4a3018. Add a
    small window or hinge details if you like.
  - 'stone-fountain' (/2): basin cyl [1.25,1.1,0.6] at [0,0.3,0] c 0xbdbdbd; water cyl [1.15,1.15,0.01] at
    [0,0.605,0] c 0x5ec8f2; spout cyl [0.06,0.06,0.7] at [0,0.95,0] c 0xbdbdbd; top water ball [0.125] at [0,1.35,0] c 0x5ec8f2.
  - 'veggie-bed' (/4): soil box [0.375,0.2,2] at [0,0.1,0] c 0x5a3b22; three cabbages ball [0.1125] at
    [0,0.2375,-0.7], [0,0.2375,0], [0,0.2375,0.7] c 0x7fc24a (a few leaf balls around each are fine).
  - 'compost-heap' (/3): a flat-bottomed low dome about 2 wide and 0.67 tall, c 0x6b4a2a, plus 3-6 small peel/twig
    bits on it. Lowest point y = 0.
  - 'hq-tent' (/2): cone [2.25,2.5] seg 4 rot [0,45,0] at [0,1.25,0] c 'tint' tint 0x3466b8; door box
    [0.6,1,0.05] at [0,0.5,1.55] c 0x222222 (door on +z).
  - 'team-banner' (/3): pole cyl [0.033,0.033,2.167] at [0,1.083,0] c 0x8b5a2b; flag box [0.533,0.367,0.01] at
    [0.267,1.867,0] c 'tint' tint 0x3466b8 (flag sticks out toward +x).
  - 'capture-flagpole' (/3): pole cyl [0.027,0.027,2] at [0,1,0] c 'white'; gold ball [0.073] at [0,2.033,0] c 'gold';
    pivots { cloth: [0,0.533,0] }; cloth box [0.6,0.367,0.01] at [0.3,0.533,0] c 'tint' tint 0xcccccc name
    'flag-cloth' group 'cloth'.
  - 'round-bush' (/2): ball [0.5] at [0,0.725,0], ball [0.4] at [0.45,0.425,0.2], ball [0.425] at [-0.35,0.425,-0.25],
    c 0x2f7a2f (lowest point y = 0).
  - 'cone-pine' (/5): trunk cyl [0.09,0.12,1] at [0,0.5,0] c 0x6b4a2e; crown cone [0.64,1.4] at [0,1.7,0] c 0x2e8b3a.
- games/gnome-front/src/world.ts: build each with buildPrefab(id, { scale }) at (x, ground y, z):
  shed at (sx, g, sz); fountain at the flag C centre; veggie beds at (cx, g, cz) with `rotation.y = Math.PI / 2`
  when !alongZ (cabbage obstacles unchanged); compost heap at (ex, g, ez); HQ tent at (0, g, tz) with
  `rotation.y = outward > 0 ? Math.PI : 0` so the door faces the map centre; banners at (px, g, tz) with
  `rotation.y = px < 0 ? Math.PI : 0`, `{ scale: 3, tint: TEAM_COLORS[team] }` and tent `{ scale: 2, tint: TEAM_COLORS[team] }`;
  bushes at (x, g - 0.25, z) scale 2 (the old blobs sank into the ground); cover trees at (x, g, z) scale 5.
  Every `out.push` / Obstacle stays exactly as it is. Delete unused geometries/materials/helpers.
- games/gnome-front/src/conquest.ts: build `buildPrefab('capture-flagpole', { scale: 3 })` as the flag's pole+ball
  inside the existing `group`. `cloth` becomes the 'cloth' pivot group (`root.getObjectByName('cloth')`), and the
  'flag-cloth' mesh gets its own material: `const clothMat = new THREE.MeshLambertMaterial({ color: NEUTRAL_COLOR, side: THREE.DoubleSide, flatShading: true }); clothMesh.material = clothMat;`
  Change the visuals type to `cloth: THREE.Object3D; clothMat: THREE.MeshLambertMaterial`. The cloth pivot lives
  in prefab units under a scale-3 root, so the height update becomes `v.cloth.position.y = (1.6 + 4 * Math.abs(f.progress)) / 3`.
  Keep the ring, label and the sway rotation.

## Done when
- Checks pass for the nine ids and for games/gnome-front.
- world.ts builds no Box/Cone/Cylinder/Sphere meshes outside buildGround/buildFence; conquest.ts builds only the ring.

## Out of scope
player.ts, vehicles.ts, config.ts, terrain.ts, every other catalog file, other games.
~~~~

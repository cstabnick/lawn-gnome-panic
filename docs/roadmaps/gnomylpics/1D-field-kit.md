Epic: 1 (shared modules and the party-only capability)
Depends on: none

## Goal
`games/gnomylpics/src/olympic/field.ts` is the real stadium kit every Gnomylpics event view is built from: sky, lights, grass, a 4-lane track, lines, distance signs, the four gnomes with name labels, a follow camera and the overlay scoreboard. Bright, cheerful, low-poly; everything generated in code (no asset files).

## Read first
- `games/gnomylpics/src/olympic/field.ts`: the stub. Every exported name, signature and doc comment is final; fill in the bodies (private helpers are fine).
- `packages/gnome/src/types.ts` lines ~110-140: `PlayerState` (`position` = feet, `velocity`, `facing` = yaw where 0 faces +z, `grounded`, `jumpsUsed`) and `GnomeModel` (`object`, `arms`, `rig`, `update(p, dt)`, `setDead`). The model animates its run cycle from the horizontal speed of `velocity`, and a jump pose when `grounded` is false.
- `packages/party/template/minigame.ts`: how a slice view makes gnomes (`createGnomeModel(seat.look)` from `@lawn/gnome`, a `PlayerState`), lights and a label.

## Change
- `games/gnomylpics/src/olympic/field.ts`:
  - `addSkyAndLights(scene)`: `scene.background = new THREE.Color(0x8fd3ff)`; `scene.fog = new THREE.Fog(0x8fd3ff, 60, 220)`; `HemisphereLight(0xffffff, 0x4a7a3a, 1.3)`; `DirectionalLight(0xffffff, 1.7)` at `(20, 40, -10)`, `castShadow = true`, shadow map 2048, shadow camera ortho bounds ±60 and far 150; its `target` at `(0, 0, 40)` added to the scene.
  - `addGrass(scene, width, length, z0)`: `PlaneGeometry(width, length)` rotated flat, centred at `(0, 0, z0 + length/2)`, `MeshStandardMaterial({ color: 0x5cae4a })`, `receiveShadow = true`. Add simple mowing stripes: a `CanvasTexture` 64×512 with alternating light/dark green bands, `repeat.set(1, length / 8)`, `wrapS/wrapT = RepeatWrapping`. Return the mesh.
  - `addTrack(scene, length, { z0 = -5, color = 0xc1440e })`: one plane `4 * LANE_W + 0.6` wide from `z0` to `z0 + length` at y 0.01, `receiveShadow`; five white lane lines (thin planes, width 0.05) at x = `laneX(k) ± LANE_W / 2` (k 0..3, i.e. 5 distinct x values from `laneX(0) + LANE_W/2` down to `laneX(3) - LANE_W/2`) at y 0.012.
  - `addLine(scene, z, color, width = 0.12)`: plane across the 4 lanes (`4 * LANE_W` wide), `width` deep along z, at y 0.015.
  - `addDistanceMarkers(scene, fromZ, toZ, every, zeroZ = 0)`: for each `z = fromZ, fromZ + every, ... <= toZ`: a white post (box 0.08×0.8×0.08) at `x = laneX(3) - LANE_W/2 - 0.8`, and on top a `textSprite(\`${Math.round(z - zeroZ)} m\`, '#ffffff', 0.45)` at y 1.1.
  - `textSprite(text, color = '#ffffff', height = 0.5)`: a 256×64 canvas, `bold 40px system-ui`, centred text, black 6 px stroke under the fill, `CanvasTexture` (`colorSpace = THREE.SRGBColorSpace`), `SpriteMaterial({ map, depthTest: false, transparent: true })`, sprite `scale.set(height * 4, height, 1)`, `renderOrder = 10`.
  - `addRacers(scene, seats, startZ = 0)`: for each seat k: `createGnomeModel(seat.look)`, `object.traverse` to set `castShadow = true` on meshes, add to the scene; `pose = { position: new THREE.Vector3(laneX(k), 0, startZ), velocity: new THREE.Vector3(), facing: 0, grounded: true, jumpsUsed: 0 }`; `label = textSprite(seat.name, css(seat.color), 0.35)` added to the scene (it follows the gnome in `poseRacer`, 1.9 m above the feet). Call `model.update(pose, 0)` once. Return the `Racer[]`.
  - `poseRacer(r, x, y, z, vz, dt)`: `r.pose.position.set(x, y, z)`; `r.pose.velocity.set(0, y > 0.02 ? 1 : 0, vz)`; `r.pose.grounded = y <= 0.02`; `r.pose.facing = 0`; `r.model.update(r.pose, dt)`; `r.label.position.set(x, y + 1.9, z)`.
  - `followCamera(camera, focus, offset, dt, rate = 4)`: `const k = 1 - Math.exp(-dt * rate)`; lerp `camera.position` towards `focus + offset` by k; keep a module-private look-at `Vector3` per camera (a `WeakMap<Camera, Vector3>`), lerp it towards `focus` by k (snap on first use), `camera.lookAt(it)`. On the first call for a camera, snap the position too.
  - `createBoard(ui, seats, mySeat)`: a root div appended to `ui`, `position:absolute;inset:0;pointer-events:none;font-family:system-ui`.
    - Rows: a box at `top:12px;left:12px`, `background:rgba(0,0,0,0.45)`, `border-radius:10px`, `padding:8px 12px`, `font:600 16px system-ui`, `color:#fff`. One row per seat: a dot/name in `css(seat.color)` and a value span; the row of `mySeat` is bold and prefixed `▶ `. `set(seat, text)` sets that value span's `textContent`.
    - Banner: centred (`top:30%;left:0;right:0;text-align:center`), `font:900 min(10vw,64px) system-ui`, `text-shadow:0 3px 8px #000`. `banner(text, color = '#ffffff', ms = 1200)` shows it (with a quick CSS scale-in using a `transition` on `transform`), hides it after ms; a new banner cancels the old timer.
    - Hint: `bottom:24%`, centred, `font:700 20px system-ui`, `text-shadow:0 2px 4px #000`; `hint('')` hides it.
- No `window` or `document` access at import time (only inside the functions).
- You cannot run vite (other workers share the game). Rely on the type-check and careful reading.

## Contract
The exported API of `field.ts` exactly as in the stub. Six other workers will call it like this:
```ts
addSkyAndLights(scene); addGrass(scene, 60, 160); addTrack(scene, 120); addLine(scene, 100, 0xffffff, 0.3);
addDistanceMarkers(scene, 10, 100, 10);
const racers = addRacers(scene, seats);           // racers[k].seat === seats[k]
poseRacer(racers[k], laneX(k), 0, z, speed, dt);  // every render
followCamera(camera, new THREE.Vector3(0, 1, z), new THREE.Vector3(-9, 4, -3), dt);
const board = createBoard(ui, seats, mySeat); board.set(k, '12.3 m'); board.banner('GO!'); board.hint('Alternate A and D');
```

## Done when
- `npx tsc --noEmit -p games/gnomylpics` shows no errors in `src/olympic/field.ts`.
- `node -e "require('fs').readFileSync('games/gnomylpics/src/olympic/field.ts','utf8').includes('void scene') && process.exit(1)"` exits 0 (no stub bodies left).

## Out of scope
Every other file: `src/olympic/run.ts`, `taps.ts`, `rank.ts`, `src/minigames/**` belong to other workers. Never edit `packages/`.

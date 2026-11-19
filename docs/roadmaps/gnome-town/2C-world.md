Epic: 2 (modules)
Depends on: none

(Read `docs/roadmaps/gnome-town/_env.md` first: environment and shared rules.)

## Goal
`games/gnome-town/src/world.ts` draws the current map in three.js (ground, walls or hedges, buildings with doors and
signs, signs, prefab props), follows my gnome with the camera, and tells main.ts what a tap landed on.

## Read first
- `games/gnome-town/src/config.ts`: `MapDef`, `BuildingDef`, `SignDef`, `PropDef`, `CAMERA`.
- `games/gnome-town/src/world.ts`: the stub you replace (keep `Pick`, `World` and `createWorld` exactly).
- `packages/prefabs/README.md`: the top "Use it" block only.

## Change
`games/gnome-town/src/world.ts`:
- Renderer: `new THREE.WebGLRenderer({ canvas, antialias: true })`, pixel ratio `Math.min(2, devicePixelRatio)`, sized
  to the window, resized on `resize`. `renderer.outputColorSpace` default. No shadows (phones).
- Lights: a `HemisphereLight(0xffffff, 0x557744, 1.6)` and a `DirectionalLight(0xffffff, 1.6)` from (8, 20, 10).
- `load(map)`: remove the previous map's group from the scene and dispose its geometries and materials, **except**
  inside prefab subtrees (any object whose ancestor-or-self has `userData.prefab` set: prefab geometry is shared and
  must never be disposed). Then build into a new `THREE.Group`:
  - Floor: a plane `map.w x map.d`, `MeshLambertMaterial({ color: map.ground })`, rotated `-Math.PI / 2`.
    Patches: planes at y = 0.01 + index * 0.002 in their colour.
  - Outdoor (`!map.indoor`): `scene.background = new THREE.Color(0x9fd3ff)`, `scene.fog = new THREE.Fog(0x9fd3ff, 40, 90)`,
    a wide grass plane (3x the map, colour a little darker than the ground) at y = -0.02 under everything, and a hedge
    border: boxes 1 high, 1 thick, colour 0x3f7a35, just outside the bounds on all four sides.
  - Indoor: `scene.background = new THREE.Color(0x0b0b12)`, `scene.fog = null`, back and side walls 4 high, 0.3 thick,
    colour `map.wallColor ?? 0x553344` just outside the bounds; the front wall (+z side) only 0.5 high so it never hides
    the room. A few warm `PointLight`s (intensity about 8, distance 14) over the room.
  - Buildings: a box `w x h x d` in `color` standing on y = 0; outdoor ones get a roof (a 4-sided `ConeGeometry` rotated
    `Math.PI / 4`, scaled to overhang the box a little, height about `h * 0.45`, in `roof`); a dark door box (1.4 wide,
    2.2 high, 0.1 deep) centred on the front face (z = building.z + d/2); a sign above the door with `label` (see signs).
    `neon: true`: the sign is emissive pink (0xff4fd8) text on near-black, plus a row of small emissive bulb spheres along
    the top front edge that blink (alternate halves every 0.5 s, done in `render()` from `performance.now()`).
    Every mesh of a building gets `userData.building = { id, link }` for picking.
  - Signs (`SignDef`): a board plane 2.6 x 0.8 with the text painted on a `CanvasTexture` (canvas 512 x 160, bold
    system-ui font sized to fit, light text on `color ?? 0x6b4a2e`, `texture.colorSpace = THREE.SRGBColorSpace`), facing
    +z turned by `rot`. Outdoors (y undefined) it stands on two thin posts with its centre at y 1.4; with `y` set it
    hangs at that height with no posts. Keep one helper `makeTextBoard(text, bg, fg, w, h)` and reuse it for building signs.
  - Props: `buildPrefab(prop.prefab, prop.tint ? { tint: prop.tint } : {})` from `@lawn/prefabs`, at (x, 0, z),
    `rotation.y = rot ?? 0`, uniform `scale ?? 1`. Wrap each in try/catch (an unknown id logs `console.warn` once and is
    skipped). Mark the root `userData.townProp = { x, z }` for picking.
- `pick(clientX, clientY)`: ray from the camera through the point (normalised device coordinates from
  `renderer.domElement.getBoundingClientRect()`). Intersect building meshes and prop subtrees (recursive) of the current
  map, never walls/hedges/floor. Nearest hit on a building: `{ kind: 'building', id, link: link ?? null }`. On a prop:
  `{ kind: 'ground', x, z }` with the prop's own x, z (walk up parents to the `townProp` root). Otherwise intersect the
  plane y = 0: inside the map bounds (+1 margin) return `{ kind: 'ground', x, z }`, else null.
- `follow(x, z, dt, snap)`: the look-at point eases toward (x, z) with factor `1 - Math.exp(-CAMERA.follow * dt)` (snap:
  jump). Clamp the look-at x to `±max(0, map.w/2 - 7)` and z to `±max(0, map.d/2 - 5)` of the loaded map. Camera
  position = look-at + `CAMERA.portraitOffset` when `innerHeight > innerWidth`, else `CAMERA.offset`; `camera.lookAt`.
  Camera: `PerspectiveCamera(CAMERA.fov, aspect, 0.1, 200)`.
- `project(x, y, z)`: CSS pixels from the canvas rect; `visible` false behind the camera (projected z > 1) or more than
  40 px off screen.
- `render()`: animate the neon bulbs, then `renderer.render(scene, camera)`.

## Contract
```ts
export type Pick = { kind: 'building'; id: string; link: string | null } | { kind: 'ground'; x: number; z: number };
export interface World {
  readonly renderer: THREE.WebGLRenderer; readonly scene: THREE.Scene; readonly camera: THREE.PerspectiveCamera;
  load(map: MapDef): void;
  pick(clientX: number, clientY: number): Pick | null;
  follow(x: number, z: number, dt: number, snap?: boolean): void;
  project(x: number, y: number, z: number): { x: number; y: number; visible: boolean };
  render(): void;
}
export function createWorld(canvas: HTMLCanvasElement): World;
```
Avatars add their own objects straight to `world.scene` (not to your map group): `load()` must not remove them.

## Done when
- `npx tsc --noEmit -p games/gnome-town` shows no error in `world.ts`.
- Reading your `load()` once more: it disposes nothing under a `userData.prefab` root, and removes only its own map group.

## Out of scope
Every other file, including `maps.ts` (another worker fills in the maps while you work; test against the types only).

Epic: E28-2 Fill (GTA batch 3, world expansion II)
Depends on: none (prefabs `traffic-podium`, `hoa-traffic-hat`, `stop-go-paddle` come from issue 2D in parallel; guard
with `getPrefab(id)`)

(Read `docs/roadmaps/gta-batch-3/E28/epic-2/_env.md` first: environment, coordinates and the new places.)

## Goal
The traffic-hat wardens are visible: at every junction in `DIRECTORS` (`src/trafficDirectors.ts`) an HOA traffic gnome
stands on a striped podium in the middle of the crossing, wearing the tall striped hat and holding the stop/go paddle.
It turns to face the road it is holding (smoothly, ~0.4 s), raises the paddle toward it, and gives a little hop when the
phase changes. It is charming, not a cop: no chasing, no Hat Watch.

## Read first
- `games/gnome-theft-auto/src/trafficDirectors.ts`: `DIRECTORS`, `directorSignal(d, t)`, `directorFacing(d, t)`,
  `nowSeconds()`. Read only; do not change it (the lead owns it; traffic obeys the same functions).
- `packages/gnome/README.md` and `packages/gnome/src/types.ts`: `createGnomeModel(look, options?)` returns a model with
  `.object` (a `THREE.Group`, feet at y 0, facing +z) and the arm rig; `look.equipment = { head: '<prefab id>',
  hand: '<prefab id>' }` dresses it in prefab gear (missing ids are skipped).
- `games/gnome-theft-auto/src/gnomes.ts`: `randomTownLook(uniform?)` (a valid `GnomeLook` to start from).
- `games/gnome-theft-auto/src/terrain.ts`: `heightAt(x, z)`.
- `@lawn/prefabs`: `buildPrefab(id, { scale?, lights?: false })`, `getPrefab(id)`.

## Change
- New `games/gnome-theft-auto/src/trafficDirectorsView.ts`:
  ```ts
  import * as THREE from 'three';
  export interface DirectorViews {
    /** Turn, pose and show/hide every warden. t = nowSeconds(); (px, pz) = the camera/player position. */
    update(dt: number, t: number, px: number, pz: number): void;
    /** Remove everything from the scene. */
    dispose(): void;
  }
  export function createDirectorViews(scene: THREE.Scene): DirectorViews;
  ```
  For each director: a `THREE.Group` at (d.x, heightAt(d.x, d.z), d.z) holding the `traffic-podium` prefab (scale so it
  is ~1.4 m wide, 0.6 m tall; a plain red/white CylinderGeometry stack if the prefab is missing) and the gnome on top
  (look from `randomTownLook()`, shirt HOA green `0x2f6b3a`, `equipment: { head: 'hoa-traffic-hat', hand:
  'stop-go-paddle' }`). Each frame: target yaw = `directorFacing(d, t)`; ease the gnome's `rotation.y` toward it (wrap
  the angle difference); when `directorSignal` changes from the last frame, a 0.25 s hop (y + sin). During 'clear' both
  arms down; otherwise the paddle arm raised (rotate the right arm group if the model exposes it; if not, tilt the
  paddle prefab). Hide a director's group when farther than 250 m from (px, pz) (`visible = false`, no per-frame work
  for hidden ones beyond the distance check).
- New `games/gnome-theft-auto/src/trafficDirectorsView.test.ts`: with a `THREE.Scene`, `createDirectorViews` adds one
  group per director at the right x/z; `update` far away hides them; `update` near shows them and turns the gnome toward
  `directorFacing` after a few frames; `dispose` removes them.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
- `cd games/gnome-theft-auto && npx vitest run src/trafficDirectorsView.test.ts` passes.

## Out of scope
`app.ts` (the lead wires `createDirectorViews(scene)` and its update), `trafficDirectors.ts`, `traffic.ts`, prefab
catalogs, colliders (the podium has none; traffic AI stops before it).

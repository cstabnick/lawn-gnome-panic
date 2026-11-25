Epic: E19-A (courts and skate park: parallel modules)
Depends on: none
Agent: general-purpose (Sonnet)

## Environment
Read `docs/roadmaps/gta-batch-3/E19/issues/_env.md` first (worktree, toolchain, rules). You own the new files
`games/gnome-theft-auto/src/court/render.ts`, `court/view.ts`, `court/render.test.ts`. Others edit other court/ files.

## Goal
During a pickup game at Drainpipe Court the four players and the ball are drawn from the simulation's view (the
player's own gnome among them), with a ring under the gnome the player steers; a basketball is drawn in the player's
hands or in flight during a shootaround; and a broadcast camera shows the game side-on from the south.

## Read first
- `games/gnome-theft-auto/src/court/types.ts`: `PickupView`, `CourtGnomeView`, `COURT`, `COURT_ORIGIN`, `COURT_SCALE`.
- `games/gnome-theft-auto/src/sports/types.ts`: `SPORTS_CAST` (looks of cardoon, lintel, pansy).
- `games/gnome-theft-auto/src/gnomes.ts`: `makeGnome(scene, look)`, `gnomeState(x, y, z, yaw, speed)`, and how a
  `GnomeModel` is updated (`model.update(state, dt)`; check `packages/gnome/src` for the exact update signature and any
  pose helpers: arms up for a shot).
- `games/gba-gjam/src/renderer.ts` lines 180-260 and 380-470: how GJAM draws its players (scale 1.25), the ball, a
  shadow and the controlled-player ring; jump-shot and dunk arm poses.
- `games/gnome-theft-auto/src/golf/view.ts`: a module that drives the game camera (`camera` position/lookAt, easing,
  returning true when it drove it).
- `packages/depth/src/layers.ts` (`flatLayer`, `LAYER.marker`).

## Change
- `src/court/render.ts`:
  ```ts
  export interface CourtRender {
    /** Draw a game frame (null hides the game gnomes and the game ball). myLook: the player's own look. */
    game(v: PickupView | null, dt: number): void;
    /** Draw the shootaround ball at (x, y, z), or hide it (null). */
    ball(p: { x: number; y: number; z: number } | null, dt: number): void;
    dispose(): void;
  }
  export function createCourtRender(scene: THREE.Scene, myLook: GnomeLook): CourtRender;
  ```
  Four gnome models built lazily on the first game frame (slot 0 the player's look, slot 1 Pansy, slots 2-3 from the
  view's names: Cardoon / Lintel looks from `SPORTS_CAST` when the name matches, else a plain town look), animated
  from `gnomeState(x, y, z, yaw, speed)` each frame with arms up while `air` (as `poseHandsUp` in gnomes.ts does),
  scaled 1 (the court is already scaled); the ball: the `gba-basketball` prefab via `buildPrefab` scaled to about
  0.19 m across, spinning when it moves, with a soft round shadow disc on the ground (`flatLayer(mat, LAYER.decal)`);
  a ring (thin `RingGeometry`, orange, `LAYER.marker`, 0.02 lift) under the gnome in slot `v.controlled`. Hide
  everything when `game(null)`. The shootaround ball reuses the same ball mesh look (a second instance).
- `src/court/view.ts`:
  ```ts
  export interface CourtView { apply(dt: number, v: PickupView | null): boolean; }
  export function createCourtView(camera: THREE.PerspectiveCamera): CourtView;
  ```
  With a view: the camera sits south of the court (z = COURT.z + 13, height 7.5 above the ground of the court centre),
  its x following the ball's x eased (clamped to the court's half length minus 3), looking at (ball x eased, 1, COURT.z
  - 0.5); on portrait screens (camera.aspect < 1) pull back to z + 18 and height 10 so the whole width shows. Ease
  in over 0.6 s from wherever the camera was. Returns true while it drives the camera; null -> false (the chase camera
  takes over again).
- `src/court/render.test.ts`: with a `THREE.Scene` and a fake `PickupView`, `game(view)` adds 4 gnome objects and a
  ball at the given positions; `game(null)` hides them; the ring follows `controlled`; `createCourtView(...).apply`
  puts the camera south of the court (z > COURT.z) and returns true, false for null.

## Contract
The exports above, exactly (court/runtime.ts calls them).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/court/render.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file.

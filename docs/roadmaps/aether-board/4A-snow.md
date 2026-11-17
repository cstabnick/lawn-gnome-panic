Epic: 4 (manuals, snow, polish; in parallel)
Depends on: none

(First read `docs/roadmaps/aether-board/_env.md`: environment and repo rules.)

## Goal
`src/view/fx.ts`: snow kicked up off the board's edges while riding, and board tracks left in the snow behind you, so
carving feels physical. Bright, cel-shaded-friendly, cheap.

## Read first
- `games/aether-board/src/view/fx.ts`: the effects module (you own it; keep `Fx` and `createFx(scene, camera, ui)`).
  It already has a pooled particle system and helpers; reuse them.
- `games/aether-board/src/config.ts`: `Player` (pos, vel, heading, mode, normal, switchStance, manual, boosting),
  `PALETTE`.
- `games/aether-board/src/physics.ts`: `forwardOf(heading, out)` (the board nose direction; increasing heading turns
  left), and how the board slides: sideways velocity relative to the board is what a carve sheds.
- `games/aether-board/src/app.ts`: `fx.update(player, renderPos, dt, frameEvents)` once per frame.

## Change
- `src/view/fx.ts`:
  - **Snow spray** (only `p.mode === 'ground'`): each frame, emit particles from the board's edges at the tail half:
    the side the board is carving toward (the side of the board opposite to the sideways velocity, i.e. the edge that
    digs in) throws a fan of snow outward and back, up and away from the board. Amount: `0` below 6 m/s; scales with
    speed (up to ~10 per frame at 40 m/s) and with how hard you carve (|sideways velocity| / speed), plus a burst of
    ~25 on 'land' events. Colour: white `#ffffff` and pale lilac `#e9dcff`, size 0.25-0.5, life 0.35-0.7 s, a little
    gravity, drag so the fan hangs in the air. Board right vector: the cross of the forward (projected on the ground
    plane of `p.normal`) and the normal. Nothing in the air, on rails or while bailing (a small puff when a bail lands is
    fine).
  - **Board tracks**: a flat ribbon on the ground following the board, like a track carved in snow: sample the board
    position projected 0.03 m above the surface along `p.normal` every 0.35 m travelled while `p.mode === 'ground'`;
    width 0.34 m across the board (along its right vector); white with opacity 0.55, `depthWrite: false`,
    `polygonOffset` (factor −1, units −1) so it never z-fights. Keep the last 400 samples in a ring buffer with their
    time; each vertex fades out (alpha) over 8 s by age. Leaving the ground breaks the strip (no segment joins a sample
    before a gap: give gap segments zero alpha). Teleports (more than 8 m in a frame) break it too.
    Pre-allocate everything; vertex colours with alpha (a `ShaderMaterial` or `MeshBasicMaterial` with
    `vertexColors: true` and a 4-component colour attribute, `transparent: true`).
  - No per-frame allocations.

## Contract
`Fx` and `createFx(scene: THREE.Scene, camera: THREE.PerspectiveCamera, ui: HTMLElement)` unchanged.

## Done when
- `npx tsc --noEmit -p games/aether-board` passes for your file.
- Visual check (only you use this port): `cd games/aether-board && npx vite --port 5204 --strictPort` in the background;
  Playwright (`require('playwright')`; `chromium.launch()`): open `http://localhost:5204/#mute`, wait for `window.ab`,
  click the canvas, hold `KeyW` and alternate `KeyA` / `KeyD` every 1.5 s for 8 s, screenshot every 2 s to
  /tmp/ab-snow/. Spray and tracks are visible. No console errors. Stop the server afterwards.

## Out of scope
Every other file in `games/aether-board/src`.

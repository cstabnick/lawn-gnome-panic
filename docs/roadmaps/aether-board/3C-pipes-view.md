Epic: 3 (more tricks, pipes, personality; in parallel)
Depends on: none

(First read `docs/roadmaps/aether-board/_env.md`: environment and repo rules.)

## Goal
Draw the new halfpipe chutes in `src/view/world.ts`: cel-shaded U channels that match the physics surface exactly,
with glowing coping along both lips, graffiti stripes on the walls, and crystal supports underneath, so the pipes look
like part of the ethereal plane.

## Read first
- `games/aether-board/src/view/world.ts`: the world view (you own it; keep `WorldView`, `createWorldView`).
- `games/aether-board/src/world.ts`: `Pipe` (from, sx, sz, yaw, len, y0, slope, halfW, flatHalf, wallH, exp),
  `World.pipes`, `pipeY(pp, x, z)` (the exact surface height, null outside), `pipeLocal(pp, x, z)` → `{ u, v }`
  (u along the pipe from its start; v across it, + = right of the travel direction (sin yaw, 0, cos yaw)).
- `games/aether-board/src/view/toon.ts`: `toonMat`, `addOutline`. `games/aether-board/src/config.ts`: `PALETTE`.

## Change
- `src/view/world.ts`, in `createWorldView` (built once):
  - Per pipe: one `BufferGeometry` sampled on a grid: u from 0 to `len` every 1 m, v from −halfW to +halfW in 40 steps
    (denser near the walls is nice but not required). Position: world point = (sx, 0, sz) + f·u + r·v, where f = (sin yaw, 0,
    cos yaw) and r = (−cos yaw, 0, sin yaw). Check the mapping with `pipeLocal`: for a generated vertex,
    `pipeLocal(pp, x, z)` must give back the same u and v; y = `pipeY(pp, x, z)` + 0.02. Indexed, `computeVertexNormals`.
  - Vertex colours: floor (|v| ≤ flatHalf) a darker lilac `#7a5cff`; walls hot pink `PALETTE.pink` with yellow stripes
    every 6 m along u (stripes 1.2 m wide), lightening toward the lip. `toonMat(0xffffff, { vertexColors: true, side:
    THREE.DoubleSide })`.
  - Outer shell: the back of each wall (from the lip down to 3 m below the floor) and a flat bottom, as a second mesh in
    dark purple, outlined (`addOutline(mesh, 0.15)`), so the pipe reads as a solid object from outside.
  - Coping: a tube along each lip (`TubeGeometry` along the 2 lip lines, radius 0.18) with an emissive cyan toon
    material (`emissiveIntensity` 1.2) and outline 0.04; plus an additive glow tube (radius 0.5, opacity 0.2, cyan,
    `depthWrite: false`).
  - Supports: every 20 m, a crystal pillar (elongated octahedron, lilac, emissive 0.4, outlined) hanging under the pipe,
    20-35 m long, slightly random tilt (seeded from the pipe index, no Math.random).
  - End caps: nothing (the pipe runs into the islands).
- `update`: optionally pulse the coping glow with `t`. No per-frame allocations.

## Contract
`WorldView` and `createWorldView(scene, w)` unchanged.

## Done when
- `npx tsc --noEmit -p games/aether-board` passes for your file.
- Visual check (only you use this port): `cd games/aether-board && npx vite --port 5202 --strictPort` in the
  background; Playwright (`require('playwright')`; `chromium.launch()`): load `http://localhost:5202/#mute`, wait for
  `window.ab`, then teleport the rider into the first pipe:
  `const pp = window.ab.world.pipes[0]; const f = [Math.sin(pp.yaw), Math.cos(pp.yaw)]; window.ab.player.pos.set(pp.sx + f[0]*15, pp.y0 - pp.slope*15 + 0.1, pp.sz + f[1]*15); window.ab.player.vel.set(f[0]*20, 0, f[1]*20);`
  click the canvas (it starts the game), wait 2 s, screenshot /tmp/ab-pipe/pipe.png. The pipe surface lines up with the
  rider (they ride on it, not above or below it). No console errors. Stop the server afterwards.

## Out of scope
Every other file in `games/aether-board/src`.

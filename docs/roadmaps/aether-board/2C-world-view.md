Epic: 2 (all modules, in parallel)
Depends on: none

(First read `docs/roadmaps/aether-board/_env.md`: environment and repo rules.)

## Goal
`src/view/world.ts` draws the ethereal plane: a loud gradient sky with aurora and stars, pink fog, light, cel-shaded
floating islands with crystal undersides, crisp kickers, rails, glowing animated ley-lines, the aether gate, drifting
decor and sparkles. Very bright and colourful, Jet Set Radio meets dreamscape. Mechanics are elsewhere; this is the vibe.

## Read first
- `games/aether-board/src/view/world.ts`: the stub you replace (keep `WorldView`, `createWorldView`).
- `games/aether-board/src/world.ts`: `World`, `Island` (cx, cz, r, baseY, dx, dz, slope, kickers, color), `Kicker`
  (x, z = ramp start; yaw; len; width; height; big), `Rail` (pts, ley), `Decor` (kind rock/crystal/cloud), `gate`
  (pos, r, yaw), and `surfaceY(island, x, z)` (height incl. kickers and rim roll-off, null off the island).
- `games/aether-board/src/view/toon.ts`: `toonMat(color, { emissive, emissiveIntensity, transparent, opacity, side,
  vertexColors })`, `addOutline(mesh, thickness)`, `GRADIENT`.
- `games/aether-board/src/config.ts`: `PALETTE`, `ISLAND_TOPS`.

## Change
- `src/view/world.ts` (three 0.187; build everything once in `createWorldView`, animate in `update`):
  - **Sky**: a sphere (radius 1800, 48×24) with a `ShaderMaterial` (`side: BackSide`, `depthWrite: false`, `fog: false`),
    re-centred on `camPos` every update. Vertical gradient by the view direction's y: top (y 1) deep violet `#2b0a7a` →
    `#7b2ff7` → hot pink `#ff4fa0` just above the horizon → a peach glow band `#ffd6a5` at the horizon → cyan `#2de2e6`
    below → deep teal `#06306b` at the bottom (the void glows). Stars: a hash of the direction (e.g. `fract(sin(dot(...)))`)
    above y 0.25, twinkling with a `time` uniform. Aurora: 2-3 soft sine-warped ribbons (pink, cyan, lime) across the upper
    sky, drifting slowly with `time`. A big pale "aether sun" disc low in the sky with a soft halo. `time` and a `flow`
    uniform (0..1, adds saturation/brightness to the aurora).
  - **Fog and light**: `scene.fog = new THREE.Fog(0xff9ad5, 140, 950)`; `scene.background` a matching colour (the sky
    covers it). `HemisphereLight(0xffffff, 0x8b5cff, 1.3)` and a `DirectionalLight(0xfff1d6, 2.0)` from (0.4, 1, 0.25).
    No shadow maps.
  - **Island tops**: per island one `BufferGeometry` on a polar grid (32 rings × 72 segments; the outer ring at
    `r * 0.998`), y from `surfaceY`. Vertex colours: `ISLAND_TOPS[isl.color]`, ±6 % lightness noise per vertex, darkened 25 %
    on the outer 8 % of the radius. `toonMat(0xffffff, { vertexColors: true })`. `computeVertexNormals()`.
  - **Undersides**: an inverted jagged cone from the rim (y = surface at the rim − 0.2, radius r) down to a tip
    `r * 1.1` below `baseY`, 4 rings with radius and height jitter (seeded from the island id, no Math.random), 24
    segments, flat shaded (`toNonIndexed` + normals), purple/lilac (`PALETTE.purple`, `PALETTE.lilac` alternating per
    ring via vertex colours), `addOutline(mesh, 0.35)`. 4-7 crystal shards (elongated `OctahedronGeometry`) stuck in the
    underside, emissive cyan/pink (`emissiveIntensity` 0.8), outlined. A rim band: a short cylinder ring (open-ended,
    height 1.2) just below the rim edge in the island colour darkened 40 %, outlined.
  - **Kickers**: one mesh each, built from samples so it matches the physics: top surface on a grid across the ramp
    (u 0..len step 0.5, v −w/2..w/2 step 0.5) at `surfaceY(isl, x, z) + 0.03`, plus the two side walls and the back wall
    (the lip face) down to the island surface without the kicker (just sample `surfaceY` at the same x, z one step
    behind the ramp start and use the island's base plane `baseY − slope * along` for walls). Big kickers: hot pink top with
    yellow stripes (vertex colours, stripes across u), small ones cyan with white stripes. `addOutline(mesh, 0.06)`.
  - **Rails** (`!rail.ley`): `TubeGeometry(new CatmullRomCurve3(pts), pts.length * 2, 0.08, 8)` in `PALETTE.yellow`,
    outlined (0.03); support posts every 4 m (thin cylinders down to `surfaceY` of the island under the point,
    found by checking which island contains it), dark purple.
  - **Ley-lines** (`rail.ley`): a core tube (radius 0.22) with a `ShaderMaterial` (fog: false): bright cyan→pink along the
    tube (uv.x) with pulses that flow along it (`fract(uv.x * len / 6 - time * 1.5)` shaped into bright bands), plus an
    outer additive glow tube (radius 0.7, `MeshBasicMaterial` cyan, `transparent`, `opacity 0.22`,
    `blending: AdditiveBlending`, `depthWrite: false`).
  - **Gate** (`w.gate`): a torus (radius `gate.r`, tube 1.4, 64×12) turned to face `gate.yaw` (its hole along the travel
    direction (sin yaw, 0, cos yaw)), with a hue-cycling emissive toon material and outline 0.25, plus an inner disc
    (`CircleGeometry(gate.r - 1)`) with a swirling transparent shader (spiral of pink/cyan/yellow, additive, rotating with
    time). Spins slowly around its axis.
  - **Decor** (`w.decor`): rock = `DodecahedronGeometry(s, 0)` lilac/purple toon + outline (0.08 s); crystal = elongated
    octahedron (s × 0.4 wide, s tall) emissive pink/cyan/yellow + outline; cloud = 5 merged spheres (white `#fff0fb`
    toon, no outline). Each bobs (y ± 1.5 m, its own phase) and rocks/crystals turn slowly in `update`.
  - **Sparkles**: one `Points` (700 points, `PointsMaterial` size 0.5, `vertexColors`, additive, transparent,
    `depthWrite: false`, `sizeAttenuation: true`) in a 160 m box around the camera; in `update`, wrap each point that is
    more than 80 m from `camPos` on an axis back into the box (so they never run out). Palette colours.
  - `update(dt, t, camPos, flow)`: sky follows `camPos`; set `time`/`flow` uniforms; animate gate, decor. No allocations
    per frame.

## Contract
```ts
export interface WorldView { update(dt: number, t: number, camPos: THREE.Vector3, flow: number): void }
export function createWorldView(scene: THREE.Scene, w: World): WorldView;
```

## Done when
- `npx tsc --noEmit -p games/aether-board` passes for your file.
- Visual check (only you use this port): `cd games/aether-board && npx vite --port 5198 --strictPort` in the background,
  Playwright screenshot of `http://localhost:5198/` after 4 s (`require('playwright')` works anywhere; `chromium.launch()`
  needs no options; save to /tmp/ab-world/). No console errors. The title screen camera shows the first islands. Stop the
  server afterwards.

## Out of scope
Every other file in `games/aether-board/src` (the rider, effects and HUD are other issues).

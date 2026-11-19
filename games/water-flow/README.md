# Water Flow Demo

A tech demo, not a game: can WebGPU water that you pour, tilt and shake run well enough in a browser to put in our games? It is the "Architecture A" path from the water-flow design notes: 3D MLS-MPM (APIC) particles with analytic-SDF vessels, all on the GPU.

```
npm run dev -w games/water-flow     # http://localhost:5180
npm run build -w games/water-flow
```

Needs WebGPU (recent Chrome or Edge, Safari 26). Without it you get an explanatory message; the WebGL 2 fallback is not built.

## What to play with

Four environments (buttons, top left), each with sliders:

| Environment | Try |
|---|---|
| Cup to basin | Tick **Auto pour**, drag **Cup tilt**, tick **Shake cup**, move the cup with **Cup x / height** |
| Stepped weir | Slide **Gate open** and the reservoir spills down three steps |
| Funnel and split | Water drains through a funnel and splits on a ridge into two troughs |
| Dam break | Slide **Gate open**; the column hits a post and a low wall |

Fluid buttons set gravity, viscosity, stiffness and friction in one click: Water, Moon water, Jupiter, Oil, Honey. Sliders: particle count (applies on Reset), gravity, stiffness (numerical speed of sound), viscosity, wall friction, sim speed, droplet size, vessel opacity. Orbit with drag, pan with right-drag, zoom with the wheel. Space pauses, R resets.

The HUD (top right) shows fps, particle conservation (`conserved N/N`, NaN count), particles stuck inside walls, and kinetic energy. Kinetic energy should fall to near zero after a pour; it does.

## How it works

- `src/shaders.ts`: WGSL. Per substep: clear grid, P2G density, P2G momentum (Tait-style pressure + viscous stress), grid update (gravity, SDF vessel collision with moving-wall velocity and Coulomb friction, domain walls), G2P with a two-half-step swept advection that pushes particles out of the SDF. Grid scatter uses `atomic<i32>` fixed point at 2^16, which leaves 1000+ m/s of headroom (the design notes' overflow warning). The scene SDF is shared by the sim and by the raymarched vessel renderer.
- `src/sim.ts`: buffers, pipelines, per-frame encode. All GPU memory is allocated once; the only readback is a 16-byte stats buffer every 15 frames. Substeps use dynamic-offset uniform slots so the moving cup and gate advance inside the frame.
- `src/config.ts`: grid (64x48x64, 2.5 cm cells), timestep (1/600 s), scenes, slider ranges, fluid presets.
- `src/seed.ts`: lattice fill of each scene (2x2x2 particles per rest cell).
- Rendering: depth-tested speed-coloured droplet spheres, plus a fullscreen raymarch of the vessels in two layers (opaque back surfaces, then translucent front glass over the water).

Particle mass is conserved by construction (finite particle set, nothing created or deleted); the HUD checks that none go NaN.

## Findings so far

- Runs at ~144 fps (display cap) with 24k particles, 10 substeps per frame, on the dev machine's GPU. Not yet measured on integrated or mobile GPUs.
- The stream, the basin settling, the weir cascade and the funnel split all look right. Particle rendering reads as water from a distance and as dots up close.
- It is weakly compressible. At the default 5 m/s speed of sound, deep water squishes about 10%. Raising stiffness needs more substeps (CFL); above ~8 m/s it gets unstable at 1/600 s.
- Thin sheets and splash droplets stay as loose particles; there is no surface tension or surface mesh, so thin films look like sprinkled dots.
- A wall plane has to sit on a grid node, and every node on or past it must stop inward flow. Getting that off by one cell makes water slide on the floor with no support. That is the kind of bug to watch for when embedding.

## Not done yet (from the design doc)

- PB-MPM liquid constraint (this uses the Milestone 1 Tait pressure).
- Surface Nets low-poly mesh with flat shading and shoreline foam (particles only).
- WebGL 2 fallback (FP-VP3D virtual pipes) for devices without WebGPU.
- Sparse active-block culling, the 96x64x96 high preset, the full 60-second mass and tilt/shake acceptance runs.

## Adopting it in a game

The sim is self-contained: `shaders.ts` plus `sim.ts`, with the scene SDF as the only game-specific part. To embed it, replace `scene()` in `COMMON` with the game's level colliders (or upload an SDF texture), keep a particle budget of about 16k, and render with the game's renderer by reading `particleBuf`. Per `SOUL.md`, move it to `packages/` once a second game wants it.

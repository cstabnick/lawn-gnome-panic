# Dead Grid

A WebAssembly-core post-apocalyptic society simulator inspired by *DayZ*. Thousands of survivors and zombies roam, scavenge, infect, build settlements, fortify walls, and raid across a `512 × 512` grid world.

## Commands

```bash
npm run dev -w games/dead-grid        # Start Vite dev server on port 5209
npm run build:wasm -w games/dead-grid # Recompile assembly/sim.ts -> src/wasm/simBytes.ts
npm run build -w games/dead-grid      # Type-check + Vite production build
npm test -w games/dead-grid           # Run Vitest simulation tests
```

## Controls

- **Pan**: Drag (mouse or 1-finger touch), or `WASD` / Arrow keys
- **Zoom**: Mouse wheel (zooms toward cursor) or 2-finger pinch
- **Inspect / Brush**: Click or tap on the grid (uses active tool from the Experiment Lab)
- **Time Warp**: `Space` (Pause/Resume), `1`–`5` (speed presets `⏸`, `1x`, `5x`, `15x`, `40x`)
- **Recenter**: `R` or `H`

## Architecture

- `assembly/sim.ts`: AssemblyScript WASM kernel (`64` pages / `4 MB` fixed linear memory) holding the `512 × 512` terrain, loot, faction claim, and scent/noise layers, a `128 × 128` spatial hash, up to `32,768` SoA agents, `16` dynamic factions/settlements, and a `512 × 512` RGBA framebuffer.
- `src/sim/bridge.ts`: TypeScript host wrapper, scenario presets, and inspection helpers.
- `src/render/viewport.ts`: Hybrid Canvas2D renderer (WASM macro pixel blitting when zoomed out, crisp viewport-culled agent + grid rendering when zoomed in).
- `src/ui/hud.ts`: Experiment Lab drawer (presets, live rule sliders, overlays, intervention brushes, world generator), telemetry sparkline & event log, and tile/agent inspector.

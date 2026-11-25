# Dead Grid

A WebAssembly-core post-apocalyptic society simulator sandbox inspired by *DayZ*. Up to `262,144` (256k) humans, zombies, and wild animals roam, scavenge, hunt, play Prisoner's Dilemma resource encounters, form small groups or fortified societies, and battle across `512×512`, `768×768`, or `1024×1024` topographic worlds.

## Commands

```bash
npm run dev -w games/dead-grid        # Start Vite dev server on port 5209
npm run build:wasm -w games/dead-grid # Recompile assembly/sim.ts -> src/wasm/simBytes.ts
npm run build -w games/dead-grid      # Type-check + Vite production build
npm test -w games/dead-grid           # Run Vitest simulation tests
```

## Controls

- **Pan**: Drag (with `Inspect` tool) or Right-Drag anytime, or `WASD` / Arrow keys
- **Paint**: Select `+Zombies`, `+Humans`, `+Animals`, `Airdrop`, or `Clear` and click-drag across the map
- **Zoom**: Mouse wheel (zooms toward cursor) or 2-finger pinch
- **Time Warp**: `Space` (Pause/Resume), `0.1x` / `0.25x` / `0.5x` slow-mo, `1`–`4` (`1x`, `5x`, `15x`, `40x`)
- **Recenter**: `R` or `H`

## Features

- **256k Agent WASM Kernel** (`assembly/sim.ts`): Zero-heap-allocation fixed linear memory (`30 MB` / `480` pages) supporting `512×512`, `768×768`, and `1024×1024` grids and `262,144` SoA agents.
- **2D Shallow-Water, Terraforming & Farmland**: Water flows downhill based on `ELEVATION + WATER_DEPTH`, floods or drains into new land, and societies cultivate farmland, dig irrigation canals, or build polders/levees (while unmaintained farms/walls/roads revert to wild nature).
- **Natural Disasters**: Organic and spawnable `Wildfire`, `Flash Flood`, `Earthquake`, `Plague`, and `Drought` brushes, plus a `Water` hydrological overlay.
- **Nation-States, Republics & Road Infrastructure**: Societies organically expand territory borders, federate with friendly neighbors into **Republics** (pooling treasury aid and sharing borders), maintain claimed roads, invest late-game materials into new paved highways, and watch unmaintained roads decay back to nature.
- **Topography & Water Styles**: Multi-octave fBm + ridged elevation with 4 water generators (`Coastal Mainland`, `River Valleys`, `Archipelago`, `Arid Basin`) and a `Topography` contour overlay.
- **3 Species & Social Tiers**: Humans (solo, small roving groups, or up to 32 fortified societies), Zombies (Walkers, Runners, Pack Alphas forming hordes), and Wild Animals (Deer, Wolves, Boars).
- **Real Inventory, Personalities & Prisoner's Dilemma**: Humans carry food, water, gear, meds, and materials, and negotiate daily resource encounters using Cooperation, Bravery, Greed, Trust, and Reputation.
- **Historical Graphs & Scenario Sandbox**: Interactive multi-tab analytics modal (`Populations`, `Social Tiers`, `Prisoner's Dilemma`, `Inventory Avg`) plus local scenario saving and JSON export/import.

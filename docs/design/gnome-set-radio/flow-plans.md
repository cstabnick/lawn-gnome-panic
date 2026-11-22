# Gnom Set Radio — Skate Flow Plans & Architecture

Every district in **Gnom Set Radio** is designed as a continuous, momentum-preserving skatepark where the player never has to stop, turn around in a dead-end, or hunt blindly for the next vertical climb.

---

## 1. Flow Design Rules

1. **Spawn Sightline (`<= 28m`)**:
   - Directly ahead of the player's spawn point, a lead-in rail, ramp, or launcher sits within `14–28m` so the player immediately sees and enters the district's primary circuit.
2. **Ramp-to-Deck Seam Alignment**:
   - Every ramp's top edge meets its target rooftop or deck cleanly (`yTop == deckTop`) with no lip or gap.
3. **Continuous Chain Connectivity (`<= 26m` reach, `<= 6.5m` step-up)**:
   - Every ramp top, rail exit, and bounce launcher (`bongo-pad`, `hydrant`, `updraft-vent`) chains naturally into another flow element (rail, ramp, launcher, aerial ring, or objective) within `26m` horizontal reach and `<= 6.5m` upward step (or any drop down).
4. **Dual Ascent + Sky-Drop Return Loop**:
   - Every district offers at least two routes to the boss tier (ramps/rails or vertical launchers) and a high-speed **Sky-Drop Rail** sweeping back from the apex into the plaza loop.
5. **Zero Isolated Objectives (`<= 20m` from flow)**:
   - Every gang billboard, relay dish, speaker stack, tempo acorn, and aerial ring sits on or within `20m` of a ramp, rail, roof deck, or launcher.

---

## 2. Regional Flow Circuits

### Area 1 — Velvet Keys Plaza (*The Conservatory Figure-8*)
- **Lead-in:** Spawn (`z=36`) faces the Plaza Loop rail (`z=24`) and Conservatory South Ramp (`z=13` → `3.5m` terrace).
- **Figure-8 Loop:** Conservatory Terrace (`3.5m`) → Upper Gold Ramp → Penthouse Stage (`7.0m`) → East/West Loft Rails (`4.2m`) ↔ North Tower (`5.5m`) → **North-to-Kiosk Sky-Drop Rail** → South Kiosk (`3.0m`) → Plaza Loop (`1.4m`).
- **Launchers:** Twin Geyser Hydrants (`±15, -4`) + Bongo Launcher (`0, -22`) feed directly onto Conservatory & North Tower.

### Area 2 — Bongo Basin Overpass (*The Four-Deck Viaduct Ribbon*)
- **Lead-in:** Spawn (`z=46`) faces the Plaza Lead-In Rail (`z=34` → `z=22`) feeding straight into the South Highway Ramp (`z=15` → `4.0m` Lower Highway).
- **Ribbon:** Lower Highway (`4.0m`) → East/West Pylon Ramps (`6.5m`) → Suspension Cable Ley-Lines → Upper Viaduct (`8.5m`) → Crown Ramp → Bongo Crown (`12.0m`) → **Crown Sky-Drop Rail** sweeping back to the Lower Highway & Plaza.

### Area 3 — Chrome Kiln Foundry (*The Smelter Updraft Loop*)
- **Lead-in:** Spawn (`z=50`) faces the Foundry Lead-In Rail (`z=38` → `z=28`) into the Foundry Loop & Smelter South Ramp (`4.5m`).
- **Loop:** Ground Updraft Vents (`±18, -16`) rocket straight to West/East Kiln Stacks (`8.5m`) → Pipe Rails → Crucible Rim (`8.5m`) → Crown Ramp / Crucible Booster Vent (`0, -29`) → Crucible Crown (`13.0m`) → **Back Sky-Drop Rail** looping back toward the perimeter ramps.

### Area 4 — Neon Birdbath Spire (*The Spiral Mist Vortex*)
- **Lead-in:** Spawn (`z=54`) faces the Spire Lead-In Rail (`z=42` → `z=32`) into the Plaza Arc & Lower Rim (`4.0m`).
- **Vortex:** Lower Rim (`4.0m`) → Mist Geysers (`±18, -14`) / Bowl Ramps → West/East Mist Bowls (`8.0m`) → Spiral Glass-Tube Rails → Spire Basin (`12.5m`) → Apex Ramp / Mist Jet (`0, -27`) → Birdbath Apex (`16.5m`) → **Sky-Drop Rail** returning to the plaza.

---

## 3. Automated Audit & In-Game Visualizer

- **Flow Audit (`src/levels/flowAudit.ts` + `src/levels/flow.test.ts`):** Verifies `flowScore >= 95`, `deadEnds.length === 0`, `isolatedObjectives.length === 0`, and `spawnLeadInDist <= 28` for every level.
- **CLI Tool (`node tools/gsr-flow-audit.mjs`):** Prints per-level flow scores, lead-in distances, dead ends, and isolated objectives.
- **In-Game Flow Guide (`V` key or `?flow=1`):** Toggles glowing dotted flow-line arcs connecting every ramp, rail, and launcher.

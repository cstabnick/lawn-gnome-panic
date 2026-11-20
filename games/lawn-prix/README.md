# Lawn Prix

Gnomes race lawn mowers. Pick a ride-on **cart** (fast, heavy, wins bumps) or a push-mower **bike** (quick off the line, turns tight, gets shoved), paint it, pick a course and race three CPU gnomes over 3 laps. The mown stripe is the track; the long grass either side slows you to a crawl. Press drift to hop, land while steering to drift, and let go for a boost. Item crates give an **acorn** to throw (a hit spins the target out) or a **speed boost**.

Four courses, each with another game "being played" beside the road: **Garden Loop**, **Panic Yard** (the Lawn Gnome Panic yard: a gnome dodges mowers for golden acorns), **The Front** (Red Caps vs Blue Caps battle on both sides), **Island Links** (gnomes playing golf). Their vehicles (runaway mowers, THE COMBINE, golf carts) cross the road: touch one and you spin out.

**Time Trial** (pick it in the garage, or press T): drive 3 laps alone on any course with no item crates. Your best run on each course and vehicle is kept as a **ghost**, a translucent gnome and mower that drives your old line while you race it. The HUD shows your best time, each lap line flashes your lead or deficit against the ghost, and a faster run replaces it. Ghosts live in this browser's localStorage (`lawn-prix.ghost.v1.<course>.<vehicle>`). Escape or the Garage button leaves a trial, Retry restarts it.

The question it answers: is a short mower kart race fun to steer, and do the two vehicles feel different?

**Sim handling (experimental).** `?drive=sim` (or `#drive=sim`, or the ARCADE / SIM toggle in the garage, or `H`) drives every kart on `@lawn/vehicle`: a raycast chassis with Pacejka tyres and light assists, instead of the arcade kart. Real weight and grip, so corners need speed control and the drift button becomes a handbrake: hold it while steering to slide, let go with enough charge for a boost (a longer boost for more charge). Races only; time trials and their ghosts stay arcade. The handling lives in `src/simDrive.ts` (per-vehicle presets and overrides in `HANDLING`) and the tuning numbers in `SIM` (`src/config.ts`). It is not finished: a sim lap is still roughly 1.5 to 2 times slower than arcade, and the CPUs brake for corners only as a first pass. Tune by playing it.

## Run

```
npm install                       # once, from the repo root
npm run dev -w games/lawn-prix    # http://localhost:5193
npm run build -w games/lawn-prix
npm test -w games/lawn-prix       # track, sim and party slice tests
```

Controls: W/↑ throttle, S/↓ brake/reverse, A/D or ←/→ steer, Space or Shift hop/drift, E item. Gamepad: stick or D-pad steers, RT/A gas, LT/B brake, R1 hop/drift, L1 or X item. Touch (on-screen controls, shown during a race once a touch is seen): drag anywhere on the left half to steer (a stick appears under your thumb; steering also drives forward), GAS / BRAKE (brake, then reverse) / DRIFT / ITEM buttons on the right. A tap on the right half of the road also drives forward.

Debug: `#go` skips the menu, `#course=<garden|panic|front|golf>` picks the course, `#mode=<race|trial>` the mode, `?drive=sim` (or `#drive=sim`, `#drive=arcade`) the handling, `#seedghost` (with `#mode=trial`) first records a CPU-driven ghost so a fresh browser has one to race (used by `demos/ghost-trial.json`).

`#minigame` plays the Gnome Party slice alone against 3 CPUs: a 3-lap race on a random course, items fire on their own.

## Adding things

- A vehicle: a `VehicleId` and a `VEHICLES` entry in `src/config.ts`, then its model in `src/scene/mower.ts`. Planned: the combine harvester, huge and painfully slow.
- A colour: `MOWER_COLORS` in `src/config.ts`.
- Tuning (speeds, hop, drift, items, hazards, grass slowdown, CPU skill, camera): all in `src/config.ts`.
- A course: an entry in `COURSES` (`src/courses.ts`: layout, item rows, crossing vehicles) and a show builder in `src/scene/courses/` (registered in `index.ts`), plus a theme in `THEMES` (`src/scene/trackView.ts`).
- Ghosts: `src/ghost.ts` (the `GhostRun` JSON format, recorder, playback, validation: pure) and `src/ghostStore.ts` (the `GhostStore` interface and its localStorage version). A global leaderboard is a new `GhostStore` plus a server that validates `GhostRun`s; nothing else in the game changes (design requirement recorded on PR 177).
- Items: `src/items.ts` (pure rules) and `src/scene/itemView.ts`; tuning in `ITEMS` (`src/config.ts`).
- Sim handling: `HANDLING` per vehicle in `src/simDrive.ts` (a `@lawn/vehicle` preset plus overrides), `SIM` in `src/config.ts`. A kart's model is chosen per race (`RaceState.physics`), so a new driving model is one more branch in `stepRace` (`src/sim.ts`).

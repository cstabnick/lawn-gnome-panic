# Incregnomtal

A one-hour lawn-growing incremental set on **The Bare Patch** behind the Panic Yard fence.

Every upgrade solves a problem and introduces the next one: watering brings puddles, the Robin eats grubs (and your fresh seed), Squirrels plant oaks that cast shade, and Biscuit digs out moles while leaving dog spots. Survive weekly **Mowing Days** from Old Saturday, spend **Mulch** on a 5-branch skill tree (with free respec every Mowing Day), and tame Old Saturday to win **Yard of the Year**.

## Commands

From the repo root:

- Run dev server (port 5197): `npm run dev -w games/incregnomtal`
- Type-check and build: `npm run build -w games/incregnomtal`
- Run guard-rail tests: `npm test -w games/incregnomtal`
- Run headless clicker vs idle balance simulation: `npm run sim -w games/incregnomtal`

## Architecture

- `src/balance.ts`: All grasses, tools, decor, critters, problem rows, skill tree nodes, and scaling curves.
- `src/sim/`: Pure TypeScript simulation (no Phaser, no DOM) — `tick`, `act`, `mowingDay`, `simulateOffline`, `stepMowerRide`, plus the clicker/idle bots (`bots.ts`) and Vitest guard rails (`sim.test.ts`).
- `src/scenes/LawnScene.ts`: Phaser 4 canvas rendering the lawn grid, animated gnomes (wearing your `@lawn/gnome` colors), Biscuit, decor, particles, road easter eggs, and the Week 6 interactive Old Saturday ride.
- `src/ui.ts`: Mobile-first DOM panels appended to `#ui` (portrait bottom / landscape right, 44px+ touch targets).

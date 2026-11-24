import { defineConfig } from 'vitest/config';
import { MAX_SIM_PLAYERS } from './src/questSim/config';

// The quest sim (src/questSim/, docs/roadmaps/gta-quest-sim.md): a MANUAL validation tool, not CI. Only the slow
// *.sim.test.ts files, at most MAX_SIM_PLAYERS (6) test files at once (each plays one quest at a time).
//   npm run quest-sim:suites -w games/gnome-theft-auto            every suite and solver test (~1-2 min)
//   npx vitest run --config vitest.sim.config.ts src/questSim/story.sim.test.ts   one suite
export default defineConfig({
  test: {
    include: ['src/questSim/**/*.sim.test.ts'],
    testTimeout: 120000,
    hookTimeout: 60000,
    maxWorkers: MAX_SIM_PLAYERS,
  },
});

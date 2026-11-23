import { defineConfig } from 'vitest/config';

// The first test in many files builds the 1800 m terrain grid (several seconds on a busy machine), so the default 5 s
// per-test timeout fails them for time alone.
export default defineConfig({ test: { testTimeout: 30000, hookTimeout: 60000 } });

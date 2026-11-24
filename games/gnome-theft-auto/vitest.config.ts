import { configDefaults, defineConfig } from 'vitest/config';

// The first test in many files builds the 1800 m terrain grid (several seconds on a busy machine), so the default 5 s
// per-test timeout fails them for time alone.
// *.slow.test.ts (two whole-world builds and the like) stay out of `npm test`: run them with `npm run mp-audit`
// (vitest.slow.config.ts), by hand, when online/static-world code changes.
export default defineConfig({
  test: { testTimeout: 30000, hookTimeout: 60000, exclude: [...configDefaults.exclude, '**/*.slow.test.ts'] },
});

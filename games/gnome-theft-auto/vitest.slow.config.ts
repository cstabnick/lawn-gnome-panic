import { defineConfig } from 'vitest/config';

// Slow checks run by hand (`npm run mp-audit`), never by `npm test`: src/online/determinism.slow.test.ts builds the
// whole static world twice with different random streams (docs/roadmaps/gta-multiplayer-audit.md).
export default defineConfig({ test: { include: ['src/**/*.slow.test.ts'], testTimeout: 600000, hookTimeout: 600000 } });

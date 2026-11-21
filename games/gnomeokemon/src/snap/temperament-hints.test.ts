import { describe, expect, it } from 'vitest';
import { TEMPERAMENT_HINTS } from './temperament-hints';
import { TEMPERAMENTS } from './temperament';

describe('TEMPERAMENT_HINTS', () => {
  it('has a two-line hint for every species with a temperament', () => {
    for (const id of Object.keys(TEMPERAMENTS)) {
      const hint = TEMPERAMENT_HINTS[id];
      expect(hint, `missing hint for ${id}`).toBeDefined();
      expect(hint).toHaveLength(2);
      for (const line of hint) {
        expect(line.trim().length, `empty line for ${id}`).toBeGreaterThan(0);
        expect(line.length, `line too long for ${id}`).toBeLessThanOrEqual(90);
      }
    }
  });
});

import { describe, expect, it } from 'vitest';
import { EURO_SIGN_LINES, signLine } from './signs';

const LIMITS = { menu: 40, poster: 60, street: 24 } as const;

describe('euro sign lines', () => {
  for (const kind of ['menu', 'poster', 'street'] as const) {
    it(`${kind} has at least 12 lines within ${LIMITS[kind]} characters, no duplicates`, () => {
      const lines = EURO_SIGN_LINES[kind];
      expect(lines.length).toBeGreaterThanOrEqual(12);
      for (const line of lines) expect(line.length, line).toBeLessThanOrEqual(LIMITS[kind]);
      expect(new Set(lines).size).toBe(lines.length);
    });
  }

  it('signLine picks a menu line deterministically', () => {
    expect(EURO_SIGN_LINES.menu).toContain(signLine('menu', 3));
    expect(signLine('menu', 3)).toBe(signLine('menu', 3));
  });
});

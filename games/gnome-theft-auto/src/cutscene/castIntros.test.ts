// Every cast member has an intro card, and each card fits its size limits (castIntros.ts).
import { describe, expect, it } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';

installFakeDom();
const g = globalThis as Record<string, unknown>;
if (!g.window) g.window = { addEventListener: () => {}, removeEventListener: () => {} };
const { CAST_INTROS, introFor } = await import('./castIntros');
const { CAST } = await import('./cast');

describe('CAST_INTROS', () => {
  it('has an entry for every CAST key', () => {
    for (const key of Object.keys(CAST)) expect(CAST_INTROS[key], key).toBeDefined();
  });

  it('adds the two speakers without a CAST preset', () => {
    expect(CAST_INTROS['mayor mulch']).toBeDefined();
    expect(CAST_INTROS['turncoat cam']).toBeDefined();
  });

  it('keeps every role within 28 characters and every line within 70', () => {
    for (const [key, card] of Object.entries(CAST_INTROS)) {
      expect(card.name.length, `${key} name`).toBeGreaterThan(0);
      expect(card.role.length, `${key} role`).toBeGreaterThan(0);
      expect(card.role.length, `${key} role`).toBeLessThanOrEqual(28);
      expect(card.line.length, `${key} line`).toBeGreaterThan(0);
      expect(card.line.length, `${key} line`).toBeLessThanOrEqual(70);
    }
  });

  it('finds a card by upper-case key', () => {
    expect(introFor('PIP').name).toBe(CAST_INTROS.pip.name);
  });

  it('gives an unknown speaker the title-cased name and the override fields', () => {
    const card = introFor('nobody', { role: 'x' });
    expect(card.name).toBe('Nobody');
    expect(card.role).toBe('x');
  });
});

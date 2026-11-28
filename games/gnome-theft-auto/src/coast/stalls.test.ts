// The stall keepers (FX11 B2): on the deck, clear of every counter, with unique coast-keeper ids.
import { describe, expect, it } from 'vitest';
import { COAST } from './config';
import { STALL_KEEPERS } from './stalls';

describe('stall keepers', () => {
  const bw = COAST.boardwalk;
  it('has unique coast-keeper ids', () => {
    const ids = STALL_KEEPERS.map((k) => k.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id.startsWith('coast-keeper-')).toBe(true);
  });
  it('stands on the deck, at least 1.4 m from every counter box', () => {
    for (const k of STALL_KEEPERS) {
      expect(k.x, k.id).toBeGreaterThan(-210);
      expect(k.x, k.id).toBeLessThan(210);
      expect(k.z, k.id).toBeGreaterThan(1102);
      expect(k.z, k.id).toBeLessThan(1132);
      for (const s of bw.stalls) {
        const dx = Math.max(s.x - 1.92 - k.x, 0, k.x - (s.x + 1.92));
        const dz = Math.max(s.z + 0.15 - 0.3 - k.z, 0, k.z - (s.z + 0.15 + 0.3));
        expect(Math.hypot(dx, dz), `${k.id} vs ${s.id}`).toBeGreaterThanOrEqual(1.4);
      }
    }
  });
});

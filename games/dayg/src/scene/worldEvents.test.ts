import { describe, expect, it } from 'vitest';
import { rollSupplyDrop } from './worldEvents';

describe('supply drop world events', () => {
  it('rolls deterministic non-empty rewards', () => {
    const a = rollSupplyDrop(42);
    const b = rollSupplyDrop(42);
    expect(a).toEqual(b);
    expect(a.acorns).toBeGreaterThanOrEqual(20);
    expect(a.items.length).toBeGreaterThan(0);
    expect(a.vehiclePartId).toBeTruthy();
  });
});

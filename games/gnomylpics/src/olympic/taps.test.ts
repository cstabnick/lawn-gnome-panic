import { describe, it, expect } from 'vitest';
import { applyTap } from './taps';

function run(sides: Array<-1 | 1>) {
  const st = { taps: 0, slips: 0, lastSide: 0 as -1 | 0 | 1 };
  const results = sides.map((s) => applyTap(st, s));
  return { st, results };
}

describe('applyTap', () => {
  it('alternating L,R,L,R is 4 taps and no slips', () => {
    const { st } = run([-1, 1, -1, 1]);
    expect(st.taps).toBe(4);
    expect(st.slips).toBe(0);
    expect(st.lastSide).toBe(1);
  });

  it('L,L is 1 tap then 1 slip, lastSide stays left', () => {
    const { st, results } = run([-1, -1]);
    expect(st.taps).toBe(1);
    expect(st.slips).toBe(1);
    expect(st.lastSide).toBe(-1);
    expect(results).toEqual(['tap', 'slip']);
  });

  it('the first press of either side is a tap (R first)', () => {
    const { st, results } = run([1]);
    expect(st.taps).toBe(1);
    expect(st.slips).toBe(0);
    expect(st.lastSide).toBe(1);
    expect(results).toEqual(['tap']);
  });
});

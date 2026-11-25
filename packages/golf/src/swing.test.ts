import { describe, expect, it } from 'vitest';
import { SWING, swingStep, swingTap, type SwingState } from './index';

const idle = (): SwingState => ({ stage: 'idle', marker: 0, power: 0 });

describe('swing meter', () => {
  it('start, power lock, then fire with the accuracy sign', () => {
    const sw = idle();
    expect(swingTap(sw)).toEqual({ kind: 'start' });
    expect(sw.stage).toBe('power');
    swingStep(sw, 0.5, '7I');
    const marker = sw.marker;
    expect(marker).toBeCloseTo(0.5 / SWING.riseSeconds, 9);
    expect(swingTap(sw)).toEqual({ kind: 'power', power: marker });
    expect(sw.stage).toBe('accuracy');
    sw.marker = 0.06; // early (above the line): pulled left
    const left = swingTap(sw);
    expect(left && left.kind === 'fire' && left.accuracy).toBeCloseTo(-0.5, 9);
    sw.marker = -0.06; // late: pushed right
    const right = swingTap(sw);
    expect(right && right.kind === 'fire' && right.accuracy).toBeCloseTo(0.5, 9);
    sw.marker = -0.5;
    const clamp = swingTap(sw);
    expect(clamp && clamp.kind === 'fire' && clamp.accuracy).toBe(1);
  });

  it('overswing locks power at maxPower by itself', () => {
    const sw = idle();
    swingTap(sw);
    const ev = swingStep(sw, 5, 'DR');
    expect(ev).toEqual({ kind: 'power', power: SWING.maxPower });
    expect(sw.stage).toBe('accuracy');
    expect(sw.marker).toBe(SWING.maxPower);
  });

  it('a late tap falls past -0.3 and fires with accuracy 1', () => {
    const sw: SwingState = { stage: 'accuracy', marker: 0, power: 1 };
    expect(swingStep(sw, 0.1, 'DR')).toBeNull();
    const ev = swingStep(sw, 1, 'DR');
    expect(ev).toEqual({ kind: 'fire', power: 1, accuracy: 1 });
  });

  it('putts rise slower and an idle meter does not move', () => {
    const a = { ...idle(), stage: 'power' as const };
    const b = { ...idle(), stage: 'power' as const };
    swingStep(a, 0.2, 'PT');
    swingStep(b, 0.2, 'DR');
    expect(a.marker).toBeCloseTo(b.marker / SWING.puttRiseScale, 9);
    const c = idle();
    expect(swingStep(c, 1, 'DR')).toBeNull();
    expect(c.marker).toBe(0);
  });
});

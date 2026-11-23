import { describe, it, expect } from 'vitest';
import { waveCoefficients } from './engineVoice';
import type { EngineWave } from './engines';

const WAVES: EngineWave[] = ['putt', 'buzz', 'chug', 'rumble', 'electric', 'outboard', 'drone'];

describe('waveCoefficients', () => {
  it('gives length-25 finite arrays for every wave, with a positive fundamental', () => {
    for (const w of WAVES) {
      const { real, imag } = waveCoefficients(w);
      expect(real.length).toBe(25);
      expect(imag.length).toBe(25);
      for (let i = 0; i < 25; i++) {
        expect(Number.isFinite(real[i])).toBe(true);
        expect(Number.isFinite(imag[i])).toBe(true);
      }
      expect(imag[1]).toBeGreaterThan(0);
    }
  });

  it('putt second harmonic matches the classic recipe', () => {
    const { imag } = waveCoefficients('putt');
    expect(imag[2]).toBeCloseTo((1 / Math.pow(2, 1.1)) * 1.3 * (0.75 + 0.5 * Math.abs(Math.sin(2 * 2.399))), 6);
  });

  it('gives each wave its own imaginary series', () => {
    for (let a = 0; a < WAVES.length; a++) {
      for (let b = a + 1; b < WAVES.length; b++) {
        const ia = waveCoefficients(WAVES[a]).imag;
        const ib = waveCoefficients(WAVES[b]).imag;
        expect(Array.from(ia)).not.toEqual(Array.from(ib));
      }
    }
  });

  it('electric is a pure tone with no 5th harmonic', () => {
    expect(waveCoefficients('electric').imag[5]).toBe(0);
  });
});

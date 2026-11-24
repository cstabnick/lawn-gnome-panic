import { beforeEach, describe, expect, it } from 'vitest';
import {
  WAVE_COMPONENTS,
  WAVES,
  registerCalmSpots,
  resetWaves,
  scheduledSeaState,
  seaGainAt,
  seaRoughness,
  seaState,
  setSeaState,
  setWaveClockOffset,
  setWaveDetail,
  tickWaveClock,
  waveAmplitudeScale,
  waveAttitude,
  waveClockOffset,
  waveHeight,
  waveShaderState,
  waveSlope,
  waveSurfaceOffset,
  waveTime,
} from './waves';
import { BODIES, COURSES, shorePoint } from './water';

const OPEN_LOCH = { x: -650, z: -650 };
const PUDDLE = { x: 690, z: 830 };
const AMP_SUM = WAVES.components.reduce((s, c) => s + c[1], 0);
const ISLAND = { x: -760, z: -720 };

function body(id: string) {
  const b = BODIES.find((w) => w.id === id);
  if (!b) throw new Error(`no body ${id}`);
  return b;
}

beforeEach(() => {
  resetWaves();
});

describe('waves: determinism', () => {
  it('gives identical heights for the same (x, z, t) twice, and after resetWaves()', () => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 20; i++) pts.push([-900 + i * 91.3, -800 + i * 53.7, i * 17.9]);
    const first = pts.map(([x, z, t]) => waveHeight(x, z, t));
    const second = pts.map(([x, z, t]) => waveHeight(x, z, t));
    expect(second).toEqual(first);
    resetWaves();
    const third = pts.map(([x, z, t]) => waveHeight(x, z, t));
    expect(third).toEqual(first);
  });
});

describe('waves: bounds', () => {
  it('|h| stays within scale * seaGain * sum of amplitudes, and is finite at huge t and far x, z', () => {
    for (const p of [OPEN_LOCH, PUDDLE]) {
      const s = waveAmplitudeScale(p.x, p.z);
      for (let t = 0; t <= 600; t += 0.7) {
        const h = waveHeight(p.x, p.z, t);
        expect(Math.abs(h)).toBeLessThanOrEqual(s * seaGainAt(t) * AMP_SUM + 1e-9);
      }
    }
    for (const x of [-900, 900]) {
      for (const z of [-900, 900]) {
        expect(Number.isFinite(waveHeight(x, z, 1e8))).toBe(true);
      }
    }
  });
});

describe('waves: continuity', () => {
  it('changes little over a small step in x or t at many open-water points', () => {
    let checked = 0;
    for (let i = 0; i < 40; i++) {
      // A grid inside open Loch Moss (scale 1), well clear of the shore.
      const x = -680 + (i % 8) * 9;
      const z = -650 + Math.floor(i / 8) * 10;
      const t = i * 3.1;
      expect(waveAmplitudeScale(x, z)).toBe(1);
      checked++;
      const h = waveHeight(x, z, t);
      expect(Math.abs(waveHeight(x + 0.01, z, t) - h)).toBeLessThan(0.01);
      expect(Math.abs(waveHeight(x, z, t + 0.01) - h)).toBeLessThan(0.02);
    }
    expect(checked).toBeGreaterThan(10);
  });
});

describe('waves: shore damping and scale', () => {
  it('is 0 on the shore of every body', () => {
    for (const w of BODIES) {
      for (let k = 0; k < 16; k++) {
        const p = shorePoint(w, (k * Math.PI * 2) / 16);
        expect(waveAmplitudeScale(p.x, p.z)).toBeCloseTo(0, 9);
      }
    }
  });

  it('is 1 in open Loch Moss and 1.35 in the Puddle Sea', () => {
    expect(waveAmplitudeScale(OPEN_LOCH.x, OPEN_LOCH.z)).toBe(1);
    expect(waveAmplitudeScale(PUDDLE.x, PUDDLE.z)).toBeCloseTo(1.35, 10);
  });

  it('is 0 at the centre of Tessie\'s island', () => {
    expect(waveAmplitudeScale(ISLAND.x, ISLAND.z)).toBe(0);
  });
});

describe('waves: rivers and calm spots', () => {
  it('gives rivers and the canal the course gain, and 0 inside a calm spot', () => {
    const canal = COURSES.find((c) => c.id === 'canal');
    if (!canal) throw new Error('no canal');
    const [x, z] = canal.points[1];
    expect(waveAmplitudeScale(x, z)).toBeCloseTo(WAVES.courseGain, 10);
    registerCalmSpots([{ x, z, r: 10 }]);
    expect(waveAmplitudeScale(x, z)).toBe(0);
  });
});

describe('waves: slope', () => {
  it('matches a central finite difference of the height', () => {
    const e = 1e-3;
    const out = { x: 0, z: 0 };
    for (let i = 0; i < 10; i++) {
      const t = 10 + i * 13.7;
      waveSlope(OPEN_LOCH.x, OPEN_LOCH.z, t, out);
      const dx = (waveHeight(OPEN_LOCH.x + e, OPEN_LOCH.z, t) - waveHeight(OPEN_LOCH.x - e, OPEN_LOCH.z, t)) / (2 * e);
      const dz = (waveHeight(OPEN_LOCH.x, OPEN_LOCH.z + e, t) - waveHeight(OPEN_LOCH.x, OPEN_LOCH.z - e, t)) / (2 * e);
      expect(Math.abs(out.x - dx)).toBeLessThan(1e-4);
      expect(Math.abs(out.z - dz)).toBeLessThan(1e-4);
    }
  });
});

describe('waves: sea state', () => {
  it('blends to a forced blustery state and reports it', () => {
    setSeaState('blustery', 100);
    expect(seaGainAt(100 + WAVES.blendS + 1)).toBeCloseTo(1.75, 10);
    expect(seaState(500)).toBe('blustery');
  });

  it('returns to the schedule when forced back to null', () => {
    setSeaState('blustery', 100);
    setSeaState(null, 1000);
    const forcedBack = seaGainAt(1000 + WAVES.blendS + 1);
    resetWaves();
    const scheduled = seaGainAt(1000 + WAVES.blendS + 1);
    expect(forcedBack).toBeCloseTo(scheduled, 10);
  });

  it('schedules only the three states, with plausible shares', () => {
    const count = { calm: 0, breezy: 0, blustery: 0 };
    const N = 2000;
    for (let s = 0; s < N; s++) count[scheduledSeaState(s)]++;
    expect(count.calm / N).toBeGreaterThanOrEqual(0.2);
    expect(count.calm / N).toBeLessThanOrEqual(0.4);
    expect(count.blustery / N).toBeGreaterThanOrEqual(0.1);
    expect(count.blustery / N).toBeLessThanOrEqual(0.3);
    expect(count.calm + count.breezy + count.blustery).toBe(N);
  });
});

describe('waves: detail', () => {
  it("is 0 with 'off' and WAVES.lowGain times the high value with 'low'", () => {
    const t = 42.5;
    setWaveDetail('high');
    const high = waveHeight(OPEN_LOCH.x, OPEN_LOCH.z, t);
    setWaveDetail('off');
    expect(waveHeight(OPEN_LOCH.x, OPEN_LOCH.z, t)).toBe(0);
    setWaveDetail('low');
    expect(waveHeight(OPEN_LOCH.x, OPEN_LOCH.z, t)).toBeCloseTo(WAVES.lowGain * high, 12);
  });
});

describe('waves: clock', () => {
  it('is still before the first tick, then follows the wall clock', () => {
    expect(waveSurfaceOffset(OPEN_LOCH.x, OPEN_LOCH.z)).toBe(0);
    tickWaveClock(1.8e12);
    expect(waveTime()).toBeCloseTo(1.8e12 / 1000 - 1735689600, 6);
    expect(waveSurfaceOffset(OPEN_LOCH.x, OPEN_LOCH.z)).toBe(waveHeight(OPEN_LOCH.x, OPEN_LOCH.z, waveTime()));
  });

  it('applies the clock offset on the next tick', () => {
    setWaveClockOffset(500);
    expect(waveClockOffset()).toBe(500);
    tickWaveClock(1.8e12);
    const a = waveTime();
    tickWaveClock(1.8e12);
    expect(waveTime()).toBe(a);
    expect(a).toBeCloseTo(1.8e12 / 1000 - 1735689600 + 0.5, 6);
  });
});

describe('waves: shader agreement', () => {
  it('the shader components reproduce waveHeight at open water', () => {
    const t = 77.3;
    const out = new Float32Array(4 * WAVE_COMPONENTS);
    const n = waveShaderState(t, out);
    expect(n).toBe(WAVE_COMPONENTS);
    const x = OPEN_LOCH.x, z = OPEN_LOCH.z;
    const scale = waveAmplitudeScale(x, z);
    let sum = 0;
    for (let i = 0; i < WAVE_COMPONENTS; i++) {
      sum += out[4 * i + 3] * scale * Math.sin(out[4 * i] * x + out[4 * i + 1] * z - out[4 * i + 2]);
    }
    expect(Math.abs(sum - waveHeight(x, z, t))).toBeLessThan(1e-3);
  });

  it('zeroes the amplitudes beyond the count', () => {
    const out = new Float32Array(4 * WAVE_COMPONENTS);
    const n = waveShaderState(77.3, out, 3);
    expect(n).toBe(3);
    expect(out[4 * 3 + 3]).toBe(0);
    expect(out[4 * 4 + 3]).toBe(0);
  });
});

describe('waves: attitude and roughness', () => {
  it('gives no heave, pitch or roll with waves off', () => {
    setWaveDetail('off');
    const out = { heave: 1, pitch: 1, roll: 1 };
    waveAttitude(OPEN_LOCH.x, OPEN_LOCH.z, 0.3, 3, 1.5, 50, out);
    expect(out.heave).toBe(0);
    expect(out.pitch).toBe(0);
    expect(out.roll).toBe(0);
  });

  it('keeps seaRoughness within [0, 1] after a tick', () => {
    tickWaveClock(1.8e12);
    for (const p of [OPEN_LOCH, PUDDLE, { x: 0, z: 0 }]) {
      const r = seaRoughness(p.x, p.z);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
    }
  });
});
